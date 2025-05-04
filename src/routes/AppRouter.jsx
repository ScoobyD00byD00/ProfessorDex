// src/routes/AppRouter.jsx 
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import SetsPage from "../pages/SetsPage";
import MyCollections from "../pages/MyCollections";
import DeckBuilder from "../pages/DeckBuilder";
import SetDetailPage from "../pages/SetDetailPage";
import PrivateRoute from "./PrivateRoute";
import CollectionDetailPage from "../pages/CollectionDetailPage";
import SavedDecks from "../pages/SavedDecks"; // ✅ new import

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/sets"
          element={
            <PrivateRoute>
              <SetsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sets/:setId"
          element={
            <PrivateRoute>
              <SetDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/collections"
          element={
            <PrivateRoute>
              <MyCollections />
            </PrivateRoute>
          }
        />
        <Route
          path="/collections/:collectionId"
          element={
            <PrivateRoute>
              <CollectionDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/deckbuilder"
          element={
            <PrivateRoute>
              <DeckBuilder />
            </PrivateRoute>
          }
        />
        <Route
          path="/decks"
          element={
            <PrivateRoute>
              <SavedDecks />
            </PrivateRoute>
          }
        />
        <Route
          path="/deck/:deckId"
          element={
            <PrivateRoute>
              <DeckBuilder />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
