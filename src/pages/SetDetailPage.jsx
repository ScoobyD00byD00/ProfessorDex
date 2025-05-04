import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../services/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SetDetailPage = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const user = useUser();

  const [cards, setCards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("number-asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [ownedCards, setOwnedCards] = useState([]);
  const ownedCount = ownedCards.filter((c) => c.quantity && c.quantity > 0).length;

  useEffect(() => {
    if (!user?.uid || cards.length === 0) return;
  
    const updateSummary = async () => {
      const summaryRef = doc(db, "users", user.uid, "masterSetSummaries", setId);
      await setDoc(summaryRef, {
        owned: ownedCount,
        total: cards.length,
        completed: ownedCount === cards.length,
        updatedAt: new Date()
      });
    };
  
    updateSummary();
  }, [ownedCount, cards.length, user, setId]);
  // Fetch set info and all cards (with pagination)
  useEffect(() => {
    const fetchSetData = async () => {
      setLoading(true);
      try {
        const headers = { "X-Api-Key": import.meta.env.VITE_TCG_API_KEY };

        const setResponse = await axios.get(
          `https://api.pokemontcg.io/v2/sets/${setId}`,
          { headers }
        );
        setSetInfo(setResponse.data.data);

        let allCards = [];
        let page = 1;
        const pageSize = 250;
        let totalCount = 0;

        do {
          const cardsResponse = await axios.get(
            "https://api.pokemontcg.io/v2/cards",
            {
              headers,
              params: {
                q: `set.id:${setId}`,
                page,
                pageSize,
              },
            }
          );

          const { data, totalCount: count } = cardsResponse.data;
          allCards = [...allCards, ...data];
          totalCount = count;
          page++;
        } while (allCards.length < totalCount);

        setCards(allCards);
      } catch (err) {
        console.error("Error loading set data:", err);
      }
      setLoading(false);
    };

    fetchSetData();
  }, [setId]);

  // Sync owned cards
  useEffect(() => {
    if (!user?.uid || !setId) return;

    const cardsRef = collection(
      db,
      "users",
      user.uid,
      "masterSets",
      setId,
      "cards"
    );
    const unsubscribe = onSnapshot(cardsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOwnedCards(list);
    });

    return () => unsubscribe();
  }, [user, setId]);

  const handleAddCard = async (card) => {
    if (!user?.uid) return;
  
    const masterRef = doc(db, "users", user.uid, "masterSets", setId, "cards", card.id);
    const personalRef = doc(db, "users", user.uid, "personalCollection", card.id);
  
    const snap = await getDoc(masterRef);
    if (snap.exists()) {
      await updateDoc(masterRef, { quantity: increment(1) });
    } else {
      await setDoc(masterRef, { ...card, quantity: 1 });
    }
  
    const personalSnap = await getDoc(personalRef);
    if (personalSnap.exists()) {
      await updateDoc(personalRef, { quantity: increment(1) });
    } else {
      await setDoc(personalRef, { ...card, quantity: 1 });
    }
  };

  const handleRemoveCard = async (card) => {
    const cardRef = doc(db, "users", user.uid, "masterSets", setId, "cards", card.id);
    const snap = await getDoc(cardRef);
    if (snap.exists()) {
      const data = snap.data();
      if ((data.quantity || 0) > 1) {
        await updateDoc(cardRef, { quantity: increment(-1) });
      } else {
        await updateDoc(cardRef, { quantity: 0 });
      }
    }
  };

  const handleAddAll = async () => {
    if (!user?.uid) return;
  
    try {
      for (const card of cards) {
        const masterRef = doc(db, "users", user.uid, "masterSets", setId, "cards", card.id);
        const personalRef = doc(db, "users", user.uid, "personalCollection", card.id);
  
        const masterSnap = await getDoc(masterRef);
        if (masterSnap.exists()) {
          await updateDoc(masterRef, { quantity: 1 });
        } else {
          await setDoc(masterRef, { ...card, quantity: 1 });
        }
  
        const personalSnap = await getDoc(personalRef);
        if (personalSnap.exists()) {
          await updateDoc(personalRef, { quantity: 1 });
        } else {
          await setDoc(personalRef, { ...card, quantity: 1 });
        }
      }
  
      toast.success("All cards added to Master Set and Personal Collection!");
    } catch (error) {
      console.error("Error syncing cards:", error);
      toast.error("Failed to add cards.");
    }
  };

  const sortedFilteredCards = [...cards]
    .filter((card) => card.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aNum = parseInt(a.number);
      const bNum = parseInt(b.number);
      if (sortOrder === "number-asc") return aNum - bNum;
      if (sortOrder === "number-desc") return bNum - aNum;
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      return 0;
    });

 
  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <button
          onClick={() => navigate("/sets")}
          style={{
            background: "none",
            border: "none",
            color: "#2196f3",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginBottom: "1rem",
            padding: 0,
          }}
        >
          ← Back to Sets
        </button>

        {loading ? (
          <p>Loading cards...</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img
                src={setInfo.images.logo}
                alt={`${setInfo.name} logo`}
                style={{ height: "40px" }}
              />
              <h1 style={{ margin: 0 }}>{setInfo.name}</h1>
            </div>
            <p style={{ margin: "0.5rem 0 1.5rem", fontSize: "0.95rem" }}>
              Owned: <strong>{ownedCount}</strong> / {cards.length} cards
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div>
                <label htmlFor="sortOrder">Sort by: </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ padding: "0.4rem", marginLeft: "0.5rem" }}
                >
                  <option value="number-asc">Card Number: Low → High</option>
                  <option value="number-desc">Card Number: High → Low</option>
                  <option value="name">Card Name: A → Z</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "0.5rem", width: "250px" }}
              />
              <button
                onClick={handleAddAll}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ➕ Add All to Master Set
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1rem",
              }}
            >
              {sortedFilteredCards.map((card) => {
                const owned = ownedCards.find((c) => c.id === card.id) || {};
                const isOwned = owned.quantity > 0;
                return (
                  <div
                    key={card.id}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "0.5rem",
                      textAlign: "center",
                      backgroundColor: isOwned ? "#1e1e1e" : "#3a3a3a",
                      opacity: isOwned ? 1 : 0.6,
                    }}
                  >
                    <img
                      src={card.images?.small}
                      alt={card.name}
                      style={{ width: "100%", borderRadius: "4px", marginBottom: "0.5rem" }}
                    />
                    <p style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                      {card.name}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#fff", marginBottom: "0.5rem" }}>
                      #{card.number}
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleRemoveCard(card)}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        -
                      </button>
                      <span>{owned.quantity || 0}</span>
                      <button
                        onClick={() => handleAddCard(card)}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default SetDetailPage;
