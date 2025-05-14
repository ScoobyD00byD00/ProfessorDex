import React, { useState, useEffect } from "react";
import { useUser } from "../services/UserContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import NavBar from "../components/NavBar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { check } from "leo-profanity";

// 🔥 Main DeckBuilder Component
const DeckBuilder = () => {
  const user = useUser();

  // 🔄 UI and deck state
  const [deckName, setDeckName] = useState("");
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [savedDecks, setSavedDecks] = useState([]);
  const [showListView, setShowListView] = useState(false);
  const [searchListView, setSearchListView] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
 

  // 📝 Player info for TCG Event Export
  const [playerInfo, setPlayerInfo] = useState({
    name: "",
    dob: "",
    playerId: "",
    eventName: "",
    eventDate: "",
  });

  const normalizeInput = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^poke/, "poké") // Replace 'poke' at the start with 'poké'
      .toLowerCase();
  };

  // 📊 Count all cards in current deck
  const totalDeckCount = deckCards.reduce((sum, c) => sum + (c.quantity || 0), 0);

  const [energyFilter, setEnergyFilter] = useState("All");

  const energyTypes = [
    "All", "Grass", "Fire", "Water", "Lightning",
    "Psychic", "Fighting", "Darkness", "Metal", "Fairy"
  ];

  // 🔁 Load existing decks on mount
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user?.uid) return;
      const snap = await getDocs(collection(db, "users", user.uid, "decks"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSavedDecks(list);
    };
    fetchDecks();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim().toLowerCase() === "energy") {
      handleSearch();
    }
  }, [energyFilter]);

  // Create a new deck
  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;
    if (check(deckName)) {
      toast.error("Please avoid using inappropriate language.");
      return;
    }

    const docRef = await addDoc(collection(db, "users", user.uid, "decks"), {
      name: deckName.trim(),
      cards: [],
      createdAt: serverTimestamp(),
    });

    setCurrentDeckId(docRef.id);
    setDeckCards([]);
    setDeckName("");
    toast.success("New deck created");
  };
  // 🔍 Search for cards using API
  const normalize = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
  
    const normalizedTerm = normalizeInput(searchTerm.trim());
  
    try {
      const { data } = await axios.get("https://api.pokemontcg.io/v2/cards", {
        params: { q: `name:"${normalizedTerm}*"` },
        headers: { "X-Api-Key": import.meta.env.VITE_TCG_API_KEY },
      });
  
      // Group by name
      const groupedByName = {};
      data.data.forEach((card) => {
        const nameKey = card.name;
        if (!groupedByName[nameKey]) groupedByName[nameKey] = [];
        groupedByName[nameKey].push(card);
      });
  
      // Show all printings if any legal
      const filtered = Object.values(groupedByName).flatMap((group) => {
        const hasLegal = group.some((card) =>
          (card.supertype === "Energy" && card.subtypes?.includes("Basic")) ||
          (card.regulationMark && card.regulationMark >= "G")
        );
  
        const isTrainer = group[0]?.supertype === "Trainer";
        const isEnergy = group[0]?.supertype === "Energy";
        const isPokemon = group[0]?.supertype === "Pokémon";
  
        return hasLegal && (isTrainer || isPokemon || isEnergy) ? group : [];
      });
  
      // Basic name matching
      const matchFiltered = filtered.filter((card) => {
        const name = normalizeInput(card.name);
        return (
          name.includes(normalizedTerm) ||
          name.split(" ").some((w) => w.startsWith(normalizedTerm))
        );
      });
  
      // If searching for energy, show all matches *first*
      let finalResults = matchFiltered;
  
      if (normalizedTerm === "energy" && energyFilter !== "All") {
        finalResults = matchFiltered.filter((card) =>
          (card.types?.includes(energyFilter)) ||
          (card.name.toLowerCase().includes(energyFilter.toLowerCase()))
        );
      }
  
      setSearchResults(finalResults);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed");
    }
  };
  
  // 🧮 Total copies of a card by name
  const getTotalCopiesByName = (name) =>
    deckCards.filter((c) => c.name === name).reduce((sum, c) => sum + (c.quantity || 0), 0);

  // ➕ Add a card to the deck
  const addCardToDeck = (card) => {
    const totalByName = getTotalCopiesByName(card.name);

    // ⚡ Special Energy max = 4
    if (card.supertype === "Energy") {
      const isBasic = card.subtypes?.includes("Basic");
      if (!isBasic && totalByName >= 4) {
        return toast.warning(`Max 4 copies of special energy: ${card.name}`);
      }
    } else if (totalByName >= 4) {
      return toast.warning(`Max 4 copies of ${card.name}`);
    }

    // ❗ ACE SPEC rule (1 max)
    const aceCount = deckCards.filter((c) => c.name.includes("ACE SPEC")).length;
    if (card.name.includes("ACE SPEC") && aceCount >= 1) {
      return toast.warning("Only 1 ACE SPEC card allowed");
    }

    const existing = deckCards.find((c) => c.id === card.id);
    if (existing) {
      setDeckCards(deckCards.map((c) =>
        c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setDeckCards([...deckCards, { ...card, quantity: 1 }]);
    }
  };

  // ➖ Remove or decrease quantity
  const removeCardFromDeck = (card) => {
    setDeckCards(deckCards
      .map((c) =>
        c.id === card.id ? { ...c, quantity: Math.max(0, c.quantity - 1) } : c
      )
      .filter((c) => c.quantity > 0)
    );
  };

  // 🧩 Sort deck by supertype
  const categorized = {
    Pokémon: deckCards.filter((c) => c.supertype === "Pokémon"),
    Trainer: deckCards.filter((c) => c.supertype === "Trainer"),
    Energy: deckCards.filter((c) => c.supertype === "Energy"),
  };
  // 💾 Save deck to Firestore
  const saveDeck = async () => {
    if (!user?.uid || !currentDeckId) return;
    await updateDoc(doc(db, "users", user.uid, "decks", currentDeckId), { cards: deckCards });
    toast.success("Deck saved");
  };

  // 🧾 Simple export text
  const generateExportText = () => {
    const lines = [];
    lines.push(`Deck: ${deckName}\n`);
    Object.entries(categorized).forEach(([type, cards]) => {
      if (cards.length) {
        lines.push(`${type} (${cards.reduce((s, c) => s + c.quantity, 0)})`);
        cards.forEach((c) => {
          lines.push(`${c.quantity}x ${c.name} (${c.set?.id} #${c.number})`);
        });
        lines.push("");
      }
    });
    return lines.join("\n");
  };

  // 📑 TCG event export with player info
  const generateEventExportText = () => {
    const info = [
      `Player Name: ${playerInfo.name}`,
      `DOB: ${playerInfo.dob}`,
      `Player ID: ${playerInfo.playerId}`,
      `Event: ${playerInfo.eventName}`,
      `Date: ${playerInfo.eventDate}`,
      ``,
    ];
    return info.join("\n") + generateExportText();
  };

  // ⬇️ Export handler
  const exportDeck = (type) => {
    const content =
      type === "event" ? generateEventExportText() : generateExportText();

    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${deckName || "deck"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportOptions(false);
    toast.success("Deck exported");
  };

  // 🧠 Shared inline button style
  const buttonStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#8c92b9",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const inputStyle = {
    padding: "0.5rem",
    marginBottom: "0.5rem",
    width: "100%",
    borderRadius: "4px",
    border: "1px solid #ccc",
  };
  return (
    <div>
      <NavBar />
      <ToastContainer position="bottom-right" />
      <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
        {!currentDeckId ? (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "400", marginBottom: "1rem" }}>Create a New Deck</h1>
            <input
              value={deckName}
              maxLength={30}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Deck name"
              style={{ padding: "0.5rem", width: "60%", marginRight: "0.5rem" }}
            />
            <button onClick={handleCreateDeck} style={buttonStyle}>Create Deck</button>
            <p><small>{deckName.length}/30 characters</small></p>

            <h3>Your Decks</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {savedDecks.map((deck) => (
                <div key={deck.id} style={{
                  backgroundColor: "#2a2a2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <strong style={{ color: "white" }}>{deck.name}</strong>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => {
                        setCurrentDeckId(deck.id);
                        setDeckCards(deck.cards || []);
                      }}
                      style={{ ...buttonStyle, backgroundColor: "#4caf50" }}
                    >Edit</button>
                    <button
                      onClick={async () => {
                        await deleteDoc(doc(db, "users", user.uid, "decks", deck.id));
                        setSavedDecks(savedDecks.filter(d => d.id !== deck.id));
                      }}
                      style={{ ...buttonStyle, backgroundColor: "#f44336" }}
                    >Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => { setCurrentDeckId(null); setDeckCards([]); }}
                style={{ ...buttonStyle, backgroundColor: "#555", marginBottom: "1rem" }}
              >
                ← Back
              </button>
              <h2>Edit Deck</h2>
              <p><strong>Deck Total:</strong> {totalDeckCount} / 60 cards</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..."
                  style={{ padding: "0.5rem", flex: "1", minWidth: "200px" }}
                />
                <button onClick={handleSearch} style={buttonStyle}>Search</button>
                <button onClick={saveDeck} style={buttonStyle}>Save</button>
                <button onClick={() => setShowExportOptions(true)} style={buttonStyle}>Export</button>
                <button onClick={() => setShowListView(!showListView)} style={buttonStyle}>
                  {showListView ? "Show Deck Images" : "Show Deck List"}
                </button>
              </div>
            </div>

            {/* Deck View: List or Grid */}
            {showListView ? (
              <>
                <h3>Deck List</h3>
                {Object.entries(categorized).map(([type, cards]) => (
                  <div key={type}>
                    <h4>{type} ({cards.reduce((s, c) => s + c.quantity, 0)})</h4>
                    <ul>
                      {cards.map((c) => (
                        <li key={c.id}>
                          {c.quantity}x {c.name} ({c.set?.id} #{c.number})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : (
              <>
                {Object.entries(categorized).map(([type, cards]) => (
                  <div key={type}>
                    <h3>{type}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
                      {cards.map((card) => (
                    <div key={card.id} style={{ textAlign: "center" }}>
                         <img
  src={card.images?.small}
  alt={card.name}
  style={{
    width: "100%",
    height: "160px",          // Fixed height
    objectFit: "contain",     // Keeps aspect ratio
    borderRadius: "4px"
  }}
/>
                          <div>
                            <button onClick={() => removeCardFromDeck(card)}>-</button>
                            <span>{card.quantity}</span>
                            <button onClick={() => addCardToDeck(card)}>+</button>
                          </div>
                          <small>{card.name}<br />({card.set?.id} #{card.number})</small>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
{searchTerm.trim().toLowerCase() === "energy" && (
  <div style={{ margin: "1rem 0", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
    {energyTypes.map((type) => (
      <button
        key={type}
        onClick={() => setEnergyFilter(type)}
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          border: "1px solid #ccc",
          backgroundColor: energyFilter === type ? "#8c92b9" : "#444",
          color: "white",
          cursor: "pointer"
        }}
      >
        {type}
      </button>
    ))}
  </div>
)}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <>              
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>Search Results</h3>
                  <button onClick={() => setSearchListView(!searchListView)} style={buttonStyle}>
                    {searchListView ? "Image View" : "Text View"}
                  </button>
                </div>

                {searchListView ? (
                  <ul>
                    {searchResults.map((card) => (
                      <li key={card.id}>
                        {card.name} ({card.set?.id} #{card.number})
                        <button onClick={() => addCardToDeck(card)} style={buttonStyle}>+</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "1rem"
                  }}>
                    {searchResults.map((card) => (
                      <div key={card.id} style={{
                        backgroundColor: "#2a2a2a",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        textAlign: "center",
                        color: "white"
                      }}>
                        <img
                          src={card.images?.small}
                          alt={card.name}
                          style={{ width: "100%", height: "180px", objectFit: "contain" }}
                        />
                        <p style={{ fontSize: "0.85rem", margin: "0.5rem 0" }}>
                          {card.name}<br />
                          <small>{card.set?.id} #{card.number}</small>
                        </p>
                        <button onClick={() => addCardToDeck(card)} style={buttonStyle}>+</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Export Modal */}
            {showExportOptions && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
                alignItems: "center", justifyContent: "center", zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: "#222", padding: "2rem", borderRadius: "8px",
                  maxWidth: "500px", width: "100%", color: "white"
                }}>
                  <h3>Export Options</h3>
                  <button onClick={() => exportDeck("simple")} style={buttonStyle}>
                    Simple Export
                  </button>

                  <div style={{ margin: "1rem 0", borderTop: "1px solid #555" }}></div>

                  <h4>TCG Event Export</h4>
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={playerInfo.name}
                    onChange={(e) => setPlayerInfo({ ...playerInfo, name: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Date of Birth"
                    value={playerInfo.dob}
                    onChange={(e) => setPlayerInfo({ ...playerInfo, dob: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Player ID"
                    value={playerInfo.playerId}
                    onChange={(e) => setPlayerInfo({ ...playerInfo, playerId: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Event Name"
                    value={playerInfo.eventName}
                    onChange={(e) => setPlayerInfo({ ...playerInfo, eventName: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Event Date"
                    value={playerInfo.eventDate}
                    onChange={(e) => setPlayerInfo({ ...playerInfo, eventDate: e.target.value })}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={() => exportDeck("event")} style={buttonStyle}>
                      Export TCG Event
                    </button>
                    <button onClick={() => setShowExportOptions(false)} style={{ ...buttonStyle, backgroundColor: "#666" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeckBuilder;
