// Dashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import CardSearchBar from "../components/CardSearchBar";
import { useUser } from "../services/UserContext";
import {
  getTotalCardsOwned,
  getTotalDecksCreated,
  getMasterSetsCompleted,
  getAllOwnedCards,
} from "../services/firestoreService";

const Dashboard = () => {
  const user = useUser();
  const [ownedCards, setOwnedCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [totalCardsOwned, setTotalCardsOwned] = useState(null);
  const [totalDecksCreated, setTotalDecksCreated] = useState(null);
  const [masterSetsCompleted, setMasterSetsCompleted] = useState(null);
  const resultsRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);



  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const [cards, decks, sets, owned] = await Promise.all([
          getTotalCardsOwned(user.uid),
          getTotalDecksCreated(user.uid),
          getMasterSetsCompleted(user.uid),
          getAllOwnedCards(user.uid),
        ]);
        setTotalCardsOwned(cards);
        setTotalDecksCreated(decks);
        setMasterSetsCompleted(sets);
        setOwnedCards(owned);
      }
    };
    fetchStats();
  }, [user]);

const handleSearch = async (term, field = "name") => {
  try {
    const query =
      field === "name"
        ? `name:*${term}*`
        : field === "artist"
        ? `artist:"${term}"`
        : `set.name:*${term}*`;

    const response = await axios.get("https://api.pokemontcg.io/v2/cards", {
      params: { q: query },
    });

    setSearchResults(response.data.data); // Set the results

    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  } catch (err) {
    console.error("Error fetching cards:", err);
  }
};

  const getTypeCounts = () => {
    const counts = { Pokémon: 0, Trainer: 0, Energy: 0 };
    ownedCards.forEach((card) => {
      if (card.quantity && card.quantity > 0) {
        const type = card.supertype;
        if (type && counts[type] !== undefined) {
          counts[type]++;
        }
      }
    });
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  };

  const getRarityCounts = () => {
    const rarityMap = {};
    ownedCards.forEach((card) => {
      if (card.quantity && card.quantity > 0) {
        const rarity = card.rarity || "Unknown";
        rarityMap[rarity] = (rarityMap[rarity] || 0) + 1;
      }
    });

    return Object.entries(rarityMap).map(([label, count]) => {
      const symbol = {
        Common: "●",
        Uncommon: "◆",
        Rare: "★",
        "Double Rare": "★★",
        "Ultra Rare": "☆☆",
        "Illustration Rare": "★",
        "Special Illustration Rare": "★★",
        "Hyper Rare": "★",
      }[label] || "•";
      return { label, symbol, count };
    });
  };

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to ProfessorDex!</h1>
        {user && (
          <p>
            Hello, <strong>{user.email}</strong> — good to see you back!
            
          </p>
        )}
        <hr style={{ margin: "2rem 0" }} />

        <section style={{ marginBottom: "3rem" }}>
          <h2>Search for Cards</h2>
          <CardSearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            onSearch={handleSearch}
          />
        </section>
{searchResults.length > 0 && (
  <section ref={resultsRef} style={{ marginBottom: "3rem" }}>
    <h3>Search Results</h3>
  
   <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1rem",
  }}
>
  {searchResults.map((card) => (
    <div
      key={card.id}
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "1rem",
        background: "#1c1c2b",
      }}
    >
      <img
        src={card.images.small}
        alt={card.name}
        style={{ width: "100%", borderRadius: "4px", cursor: "pointer" }}
  onClick={() => setSelectedCard(card)} 
      />
      
      <div
        style={{
          color: "#fff",
          marginTop: "0.5rem",
          fontSize: "0.9rem",
        }}
      >
        <strong>{card.name}</strong>
        <br />
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
          {card.set.name} — #{card.number}
        </span>
      </div>
    </div>
  ))}
</div>

{selectedCard && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem",
    }}
    onClick={() => setSelectedCard(null)}
  >
<div
  style={{
    backgroundColor: "#1c1c2b",
    padding: "1rem",
    borderRadius: "1rem",
    width: "fit-content", // ✅ container wraps to content
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflowY: "auto",
    color: "white",
    position: "relative",
    textAlign: "center",
  }}
  onClick={(e) => e.stopPropagation()}
>
  <button
    onClick={() => setSelectedCard(null)}
    style={{
      position: "absolute",
      top: "0.5rem",
      right: "0.5rem",
      background: "#ffcb05",
      color: "#2a75bb",
      border: "none",
      padding: "0.4rem 0.8rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Close
  </button>

<img
  src={selectedCard.images.large}
  alt={selectedCard.name}
  style={{
    width: "300px", // ✅ fixed clean size
    height: "auto",
    borderRadius: "8px",
    marginTop: "1rem",
    marginBottom: "1rem",
  }}
/>

  <h2 style={{ marginBottom: "0.5rem" }}>{selectedCard.name}</h2>
  <p><strong>Set:</strong> {selectedCard.set.name} — #{selectedCard.number}</p>
  {selectedCard.types && <p><strong>Type:</strong> {selectedCard.types.join(", ")}</p>}
  {selectedCard.rarity && <p><strong>Rarity:</strong> {selectedCard.rarity}</p>}
  {selectedCard.artist && <p><strong>Artist:</strong> {selectedCard.artist}</p>}
</div>

  </div>
)}


  </section>
)}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>Your Collection Overview</h3>
              {[{ label: "Total Cards Owned", count: totalCardsOwned },
                { label: "Total Decks Created", count: totalDecksCreated },
                { label: "Master Sets Completed", count: masterSetsCompleted },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.4rem 0",
                    borderBottom: index < 2 ? "1px solid #ddd" : "none",
                  }}
                >
                  <span style={{ color: "#ccc" }}>{item.label}</span>
                  <span
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#8c92b9",
                      padding: "2px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    {item.count ?? "Loading..."}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>Unique cards per type</h3>
              {getTypeCounts().map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span style={{ color: "#ccc" }}>{item.label}</span>
                  <span
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#8c92b9",
                      padding: "2px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>Unique cards per rarity</h3>
              {getRarityCounts().map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span>
                    <span style={{ marginRight: "0.4rem" }}>{item.symbol}</span>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      backgroundColor: "#8c92b9",
                      padding: "2px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
