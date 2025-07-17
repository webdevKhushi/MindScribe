const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Note",
  password: "1234",
  port: 5433,
});

// JWT Secret Key (should go in .env ideally)
const SECRET_KEY = "your_jwt_secret_key";

// Nodemailer setup (use Gmail App Password)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "khushibhan235@gmail.com",        
    pass: "your_app_password",           
  },
});

//  Generate email verification token
function generateEmailToken(email) {
  return jwt.sign({ email }, SECRET_KEY, { expiresIn: "1d" });
}

//  Verify email token
function verifyEmailToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

//  Test route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Backend is running! DB time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection failed");
  }
});

//  Signup route with email verification
app.post("/api/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    // Check if user/email exists
    const userExists = await pool.query(
      "SELECT 1 FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (userExists.rowCount > 0) {
      return res.status(400).json({ success: false, message: "Username or email already taken" });
    }

    // Insert user with is_verified = false
    await pool.query(
      "INSERT INTO users (username, password, email, is_verified) VALUES ($1, $2, $3, $4)",
      [username, password, email, false]
    );

    // Send verification email
    const token = generateEmailToken(email);
    const verificationLink = `http://localhost:${PORT}/api/verify-email/${token}`;

    await transporter.sendMail({
      from: "khushibhan235@gmail.com",           
      to: email,
      subject: "Email Verification",
      html: `<p>Please click the link to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`
    });

    res.json({ success: true, message: "Signup successful! Please verify your email." });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
});

//  Email verification route
app.get("/api/verify-email/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const { email } = verifyEmailToken(token);
    await pool.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [email]);
    res.send(" Email verified successfully. You can now log in.");
  } catch (err) {
    console.error("Email verification failed:", err);
    res.status(400).send(" Invalid or expired token.");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

