// components/VerifyCode.jsx
import React, { useState } from "react";

export default function VerifyCode() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      console.error(err);
      setMessage("Verification failed");
    }
  };

  return (
    <div>
      <h2>Verify Email</h2>
      <form onSubmit={handleVerify}>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="6-digit Code" onChange={(e) => setCode(e.target.value)} />
        <button type="submit">Verify</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
