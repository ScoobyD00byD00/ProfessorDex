// src/routes/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../services/UserContext";

const PrivateRoute = ({ children }) => {
  const user = useUser();

  if (user === undefined) {
    // Still checking login status
    return <p style={{ padding: "2rem" }}>🔐 Checking authentication...</p>;
  }

  return user ? children : <Navigate to="/" />;
};

export default PrivateRoute;
