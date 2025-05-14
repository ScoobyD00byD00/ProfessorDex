// src/components/NavBar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useUser } from "../services/UserContext";
import "./NavBar.css";

const NavBar = () => {
  const user = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-header">
          <Link to="/dashboard" className="navbar-logo">
            <img src="/logo.png" alt="ProfessorDex Logo" className="logo-img" />
          </Link>

          {/* Hamburger toggle */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>

        {/* Collapsible nav links */}
        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/sets" onClick={() => setMenuOpen(false)}>Sets</Link>
          <Link to="/collections" onClick={() => setMenuOpen(false)}>My Collections</Link>
          <Link to="/deckbuilder" onClick={() => setMenuOpen(false)}>Deck Builder</Link>
           <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Page</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
