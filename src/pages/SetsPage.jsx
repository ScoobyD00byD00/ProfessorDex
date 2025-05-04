// src/pages/SetsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../services/UserContext";

const SetsPage = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedSeries, setSelectedSeries] = useState("all");
  const [availableSeries, setAvailableSeries] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({}); // NEW
  const [completionFilter, setCompletionFilter] = useState("all"); // NEW

  const user = useUser();

  useEffect(() => {
    const fetchSets = async () => {
      setLoading(true);
      try {
        const headers = { "X-Api-Key": import.meta.env.VITE_TCG_API_KEY };
        const response = await axios.get("https://api.pokemontcg.io/v2/sets", { headers });
        const allSets = response.data.data;

        const filteredSets = allSets.filter(set => set.total && set.releaseDate);
        setSets(filteredSets);

        const seriesList = [...new Set(filteredSets.map(s => s.series))];
        setAvailableSeries(seriesList);
      } catch (err) {
        console.error("Error loading sets:", err);
      }
      setLoading(false);
    };

    fetchSets();
  }, []);

  // Fetch master set completion summaries
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!user?.uid) return;

      const snapshot = await getDocs(
        collection(db, "users", user.uid, "masterSetSummaries")
      );

      const status = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        status[doc.id] = {
          completed: data.completed,
          owned: data.owned,
          total: data.total,
        };
      });

      setCompletionStatus(status);
    };

    fetchCompletionStatus();
  }, [user]);

  // Filter and sort sets
  const filteredSortedSets = sets
    .filter((set) => {
      const matchesSearch =
        set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.series.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeries = selectedSeries === "all" || set.series === selectedSeries;

      const summary = completionStatus[set.id];
      const isCompleted = summary?.completed;

      const matchesCompletion =
        completionFilter === "all" ||
        (completionFilter === "completed" && isCompleted) ||
        (completionFilter === "incomplete" && !isCompleted);

      return matchesSearch && matchesSeries && matchesCompletion;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.releaseDate) - new Date(a.releaseDate);
      if (sortOrder === "oldest") return new Date(a.releaseDate) - new Date(b.releaseDate);
      return a.name.localeCompare(b.name);
    });

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>Pokémon TCG Sets</h1>

        {/* Search and Filter Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search by set name or series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "0.5rem", flex: "1 1 200px" }}
          />

          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            style={{ padding: "0.5rem" }}
          >
            <option value="all">All Series</option>
            {availableSeries.map((series) => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ padding: "0.5rem" }}
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
            <option value="name">Name A → Z</option>
          </select>

          {/* NEW: Completion filter dropdown */}
          <select
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value)}
            style={{ padding: "0.5rem" }}
          >
            <option value="all">All Sets</option>
            <option value="completed">Completed Sets</option>
            <option value="incomplete">Incomplete Sets</option>
          </select>
        </div>

        {/* Sets Grid */}
        {loading ? (
          <p>Loading sets...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {filteredSortedSets.map((set) => (
              <div
                key={set.id}
                onClick={() => (window.location.href = `/sets/${set.id}`)}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src={set.images.logo}
                  alt={set.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80px",
                    objectFit: "contain",
                    marginBottom: "0.5rem",
                  }}
                />
                <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{set.name}</h3>
                <p style={{ margin: 0 }}>{set.series}</p>
                <p style={{ fontSize: "0.85rem", color: "white" }}>
                  Released: {set.releaseDate}
                </p>
                <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#ccc" }}>
                  {completionStatus[set.id]?.owned ?? 0} / {set.total} collected
                  {completionStatus[set.id]?.completed && (
                    <span style={{ color: "lime", marginLeft: "0.25rem" }}>✅</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetsPage;
