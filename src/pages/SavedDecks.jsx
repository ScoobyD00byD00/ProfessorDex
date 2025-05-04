import React, { useEffect, useState } from "react";
import { useUser } from "../services/UserContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

const SavedDecks = () => {
  const user = useUser();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchDecks = async () => {
      setLoading(true);
      const deckRef = collection(db, "users", user.uid, "decks");
      const snapshot = await getDocs(deckRef);
      const deckList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDecks(deckList);
      setLoading(false);
    };

    fetchDecks();
  }, [user]);

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>🗂️ My Decks</h1>
        {loading ? (
          <p>Loading decks...</p>
        ) : decks.length === 0 ? (
          <p>No decks found.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {decks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => navigate(`/deck/${deck.id}`)}
                style={{
                  backgroundColor: "#2a2a2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <h3 style={{ margin: 0 }}>{deck.name}</h3>
                <p style={{ margin: "0.5rem 0 0" }}>
                  {deck.cards?.reduce((sum, c) => sum + (c.quantity || 0), 0)} cards
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDecks;
