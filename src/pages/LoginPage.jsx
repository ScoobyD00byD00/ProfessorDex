import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (forgotPasswordMode) {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset link sent! Check your email.");
        return;
      }

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
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Image */}
      <img
        src="/Loginball.png"
        alt="Background"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100vw", // ✅ adjust size here as needed
          maxWidth: "1000px",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Login Form */}
      <div
        style={{
          position: "relative",
          maxWidth: "400px",
          width: "100%",
          padding: "2rem",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: "1rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1,
          color: "#fff",
        }}
      >
        <img
          src="/logo.png"
          alt="ProfessorDex Logo"
          style={{ width: "200px", marginBottom: "1rem" }}
        />
        <h1 style={{ marginBottom: "1rem" }}>
          {forgotPasswordMode
            ? "Reset Password"
            : isRegistering
            ? "Register for ProfessorDex"
            : "Welcome to ProfessorDex"}
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#1c1c2b",
              color: "#fff",
            }}
          />

          {!forgotPasswordMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#1c1c2b",
                color: "#fff",
              }}
            />
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#ffcb05",
              color: "#2a75bb",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            {forgotPasswordMode
              ? "Send Reset Link"
              : isRegistering
              ? "Register"
              : "Login"}
          </button>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "lightgreen" }}>{message}</p>}

        {!forgotPasswordMode && !isRegistering && (
          <button onClick={() => setForgotPasswordMode(true)} style={linkStyle}>
            Forgot Password?
          </button>
        )}

        {forgotPasswordMode && (
          <button onClick={() => setForgotPasswordMode(false)} style={linkStyle}>
            Back to Login
          </button>
        )}

        {!forgotPasswordMode && (
          <button onClick={() => setIsRegistering(!isRegistering)} style={linkStyle}>
            {isRegistering
              ? "Already have an account? Login"
              : "Need an account? Register"}
          </button>
        )}
      </div>
    </div>
  );
};

const linkStyle = {
  background: "none",
  border: "none",
  color: "#ffcb05",
  textDecoration: "underline",
  cursor: "pointer",
  marginBottom: "1rem",
};

export default LoginPage;
