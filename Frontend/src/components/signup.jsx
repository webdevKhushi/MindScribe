import React, { useState } from "react";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message || "Signup successful");

      if (data.success) {
        // Send verification code to email
        const sendCodeRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/send-verification-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });

        const codeData = await sendCodeRes.json();
        setMessage(codeData.message);
        if (codeData.success) {
          setIsOtpSent(true);
          setEmailForOtp(form.email);
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("Signup failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, code: otp }),
      });

      const data = await res.json();
      setMessage(data.message);
      if (data.success) {
        // Optionally redirect or reset form
        setIsOtpSent(false);
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setMessage("Verification failed");
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      {!isOtpSent ? (
        <form onSubmit={handleSignup}>
          <input name="username" placeholder="Username" onChange={handleChange} />
          <input name="email" placeholder="Email" onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} />
          <button type="submit">Sign Up</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP sent to email"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit">Verify Email</button>
        </form>
      )}
      <p>{message}</p>
    </div>
  );
}
