const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();

// ✅ CORS middleware
app.use(cors({
  origin: "http://localhost:5173", // Your React frontend origin
  credentials: true
}));

app.use(express.json());

// ✅ PostgreSQL setup
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Note",
  password: "1234",
  port: 5433,
});

// ✅ JWT secret (store securely in .env for production)
const SECRET_KEY = "your_jwt_secret_key";

// ✅ Gmail transporter using app password
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "khushibhan235@gmail.com",
    pass: "tbprxhptfwtkmqvj", // Gmail app password
  },
});

// ✅ Utility: Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Route: Send verification code
app.post("/api/send-verification-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const code = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await pool.query(
      `INSERT INTO email_verification_codes (email, code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET code = $2, expires_at = $3`,
      [email, code, expiry]
    );

    await transporter.sendMail({
      from: "khushibhan235@gmail.com",
      to: email,
      subject: "Your Verification Code",
      html: `<p>Your verification code is:</p><h2>${code}</h2><p>This code will expire in 10 minutes.</p>`,
    });

    res.json({ success: true, message: "Verification code sent to email." });

  } catch (err) {
    console.error("Error sending verification code:", err);
    res.status(500).json({ success: false, message: "Error sending code" });
  }
});

// ✅ Route: Verify the code
app.post("/api/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Email and code are required" });
  }

  try {
    const result = await pool.query(
      `SELECT code, expires_at FROM email_verification_codes WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: "No code found for this email" });
    }

    const { code: correctCode, expires_at } = result.rows[0];

    if (new Date() > expires_at) {
      return res.status(400).json({ success: false, message: "Code expired" });
    }

    if (code !== correctCode) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    await pool.query(`UPDATE users SET is_verified = TRUE WHERE email = $1`, [email]);
    await pool.query(`DELETE FROM email_verification_codes WHERE email = $1`, [email]);

    res.json({ success: true, message: "Email verified successfully!" });

  } catch (err) {
    console.error("Code verification error:", err);
    res.status(500).json({ success: false, message: "Error verifying code" });
  }
});
const bcrypt = require("bcrypt");

// ✅ Route: Signup
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ success: false, message: "All fields are required" });

  try {
    const userCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (username, email, password, is_verified)
       VALUES ($1, $2, $3, $4)`,
      [username, email, hashedPassword, false]
    );

    res.json({ success: true, message: "Signup successful. Please verify your email." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// ✅ Route: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password are required" });

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rowCount === 0)
      return res.status(400).json({ success: false, message: "User not found" });

    const user = result.rows[0];

    if (!user.is_verified)
      return res.status(403).json({ success: false, message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "1d",
    });

    res.json({ success: true, token, message: "Login successful" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});


// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ✅ Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
