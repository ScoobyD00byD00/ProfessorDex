// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{isRegistering ? "Register for ProfessorDex" : "ProfessorDex Login"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">{isRegistering ? "Register" : "Login"}</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
      <br />
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering
          ? "Already have an account? Login"
          : "Need an account? Register"}
      </button>
    </div>
  );
};

export default LoginPage;
