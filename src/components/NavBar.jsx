// src/components/NavBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useUser } from "../services/UserContext";
import "./NavBar.css";


const NavBar = () => {
  const user = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) return null;

  return (
    <nav className="navbar">
  <div className="navbar-logo">
  <Link to="/dashboard">
    <img
      src="/logo.png"
      alt="ProfessorDex Logo"
      className="logo-img"
      style={{ cursor: "pointer" }}
    />
  </Link>
</div>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/sets">Sets</Link>
        <Link to="/collections">My Collections</Link>
        <Link to="/deckbuilder">Deck Builder</Link>
      </div>

      <div className="navbar-user">
        <span>{user.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
