// Importing necessary modules and components
import React, { useState, useEffect } from "react";
import axios from "axios"; // For making API requests
import NavBar from "../components/NavBar"; // Custom navigation bar
import { useUser } from "../services/UserContext"; // Custom hook for getting logged-in user info
import { getTotalCardsOwned } from "../services/firestoreService"; // Function to get user's collection stats
import CardSearchBar from "../components/CardSearchBar"; // Reusable card search bar component
import { getTotalDecksCreated, getMasterSetsCompleted } from "../services/firestoreService";


const Dashboard = () => {
  const user = useUser(); // Get the current logged-in user
  const [cards, setCards] = useState([]); // Cards returned from search
  const [loading, setLoading] = useState(false); // Loading state for search
  const [totalCardsOwned, setTotalCardsOwned] = useState(null); // Total cards the user owns
  const [selectedCard, setSelectedCard] = useState(null); // Currently selected card (for modal view)
  const [sortOrder, setSortOrder] = useState("newest"); // Sorting method for cards
  const [searchTerm, setSearchTerm] = useState(""); // User's current search term
  const [searchField, setSearchField] = useState("name"); // Search field (name, artist, etc.)
  const [totalDecksCreated, setTotalDecksCreated] = useState(null);
  const [masterSetsCompleted, setMasterSetsCompleted] = useState(null);

  // Fetch total owned cards from Firestore when the user logs in
  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const [cards, decks, sets] = await Promise.all([
          getTotalCardsOwned(user.uid),
          getTotalDecksCreated(user.uid),
          getMasterSetsCompleted(user.uid)
        ]);
        setTotalCardsOwned(cards);
        setTotalDecksCreated(decks);
        setMasterSetsCompleted(sets);
      }
    };
    fetchStats();
  }, [user]);

  // Function to handle searching for cards using the API
  const handleSearch = async (term, field = "name") => {
    setLoading(true);
    try {
      // Create query string depending on the selected field
      const query =
        field === "name"
          ? `name:*${term}*`
          : field === "artist"
          ? `artist:"${term}"`
          : `set.name:*${term}*`;

      // Make API request to Pokémon TCG API
      const response = await axios.get("https://api.pokemontcg.io/v2/cards", {
        params: { q: query },
      });

      setCards(response.data.data); // Set returned cards
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
    setLoading(false); // Stop loading indicator
  };

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to ProfessorDex!</h1>
        {/* Personalized greeting */}
        {user && (
          <p>
            Hello, <strong>{user.email}</strong> — good to see you back!
          </p>
        )}

        <hr style={{ margin: "2rem 0" }} />

        {/* Collection stats overview */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Your Collection Overview</h2>
          <ul>
  <li>
    Total Cards Owned:{" "}
    <strong>{totalCardsOwned ?? "Loading..."}</strong>
  </li>
  <li>
    Total Decks Created:{" "}
    <strong>{totalDecksCreated ?? "Loading..."}</strong>
  </li>
  <li>
    Master Sets Completed:{" "}
    <strong>{masterSetsCompleted ?? "Loading..."}</strong>
  </li>
</ul>
        </section>

        {/* Card search area */}
        <section>
          <h2>🔍 Search for Cards</h2>
          <CardSearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            onSearch={handleSearch}
          />

          {/* Sorting dropdown */}
          <div style={{ marginTop: "1rem" }}>
            <label htmlFor="sortOrder">Sort by: </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ padding: "0.4rem", marginLeft: "0.5rem" }}
            >
              <option value="newest">Release Date: Newest → Oldest</option>
              <option value="oldest">Release Date: Oldest → Newest</option>
              <option value="type">Card Type: A → Z</option>
            </select>
          </div>

          {/* Show loading message while fetching cards */}
          {loading && <p>Loading cards...</p>}

          {/* Display searched cards in a grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            {[...cards]
              .sort((a, b) => {
                // Sort logic based on selected sortOrder
                if (sortOrder === "newest" || sortOrder === "oldest") {
                  const dateA = new Date(a.set?.releaseDate || "1900-01-01");
                  const dateB = new Date(b.set?.releaseDate || "1900-01-01");
                  return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
                }
                if (sortOrder === "type") {
                  const typeA = (a.types?.[0] || a.supertype || "").toLowerCase();
                  const typeB = (b.types?.[0] || b.supertype || "").toLowerCase();
                  return typeA.localeCompare(typeB);
                }
                return 0;
              })
              .map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)} // Click to view card details
                  style={{
                    cursor: "pointer",
                    maxWidth: "160px",
                    width: "100%",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "0.2rem",
                    margin: "0 auto",
                  }}
                >
                  <img
                    src={card.images.small}
                    alt={card.name}
                    style={{ width: "100%", borderRadius: "4px" }}
                  />
                  <p style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{card.name}</p>
                  <p style={{ fontSize: "0.8rem", marginTop: "0.1rem" }}>
                    {card.set?.name} — #{card.number}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Modal for showing selected card details */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)} // Close modal on outside click
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            }}
          >
            <h2>{selectedCard.name}</h2>
            <img
              src={selectedCard.images.large}
              alt={selectedCard.name}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <p><strong>Type:</strong> {selectedCard.supertype}</p>
            {selectedCard.subtypes && (
              <p><strong>Subtypes:</strong> {selectedCard.subtypes.join(", ")}</p>
            )}
            <p><strong>Rarity:</strong> {selectedCard.rarity || "Unknown"}</p>
            <p><strong>Set:</strong> {selectedCard.set.name}</p>
            <p><strong>Artist:</strong> {selectedCard.artist}</p>
            <button
  onClick={() => setSelectedCard(null)}
  style={{
    marginTop: "1rem",
    backgroundColor: "#8c92b9",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "5px",
    cursor: "pointer"
  }}
>
  Close
</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
