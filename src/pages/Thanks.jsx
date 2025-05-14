// src/pages/Thanks.jsx
import React from "react";
import NavBar from "../components/NavBar";

const Thanks = () => {
  return (
    <>
      <NavBar />
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>🎉 Thank you!</h2>
        <p>Your message has been sent. We'll get back to you as soon as we can.</p>
      </div>
    </>
  );
};

export default Thanks;
