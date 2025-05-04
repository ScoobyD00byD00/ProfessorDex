import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useUser } from "../services/UserContext";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { searchCards } from "../services/tcgApiService";
import CardSearchBar from "../components/CardSearchBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CollectionDetailPage = () => {
  const { collectionId } = useParams();
  const user = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [searchResults, setSearchResults] = useState([]);
  const [ownedCards, setOwnedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("releaseDate");
  const [collectionName, setCollectionName] = useState("");

  useEffect(() => {
    if (!user?.uid || !collectionId) return;

    const cardsRef = collection(db, "users", user.uid, "collections", collectionId, "cards");
    const unsubscribe = onSnapshot(cardsRef, (snapshot) => {
      const cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOwnedCards(cards);
      setLoading(false);
    });

    const fetchCollectionName = async () => {
      const docRef = doc(db, "users", user.uid, "collections", collectionId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setCollectionName(snapshot.data().name || "Unnamed Collection");
      }
    };

    fetchCollectionName();
    return () => unsubscribe();
  }, [user, collectionId]);

  const handleSearch = async (term = searchTerm, field = searchField) => {
    if (!term.trim()) return;
    const results = await searchCards(term.trim(), field);
    setSearchResults(results);
  };

  const handleAddCard = async (card) => {
    const collectionRef = doc(db, "users", user.uid, "collections", collectionId, "cards", card.id);
    const personalRef = doc(db, "users", user.uid, "personalCollection", card.id);
  
    const snapshot = await getDoc(collectionRef);
    if (snapshot.exists()) {
      await updateDoc(collectionRef, { quantity: increment(1) });
    } else {
      await setDoc(collectionRef, { ...card, quantity: 1 });
    }
  
    const personalSnap = await getDoc(personalRef);
    if (personalSnap.exists()) {
      await updateDoc(personalRef, { quantity: increment(1) });
    } else {
      await setDoc(personalRef, { ...card, quantity: 1 });
    }
  };

  const handleRemoveCard = async (cardId) => {
    const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", cardId);
    const snapshot = await getDoc(cardRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.quantity > 1) {
        await updateDoc(cardRef, { quantity: increment(-1) });
      } else {
        await setDoc(cardRef, { ...data, quantity: 0 });
      }
    }
  };

  const handleAddAllAsUnowned = async () => {
    for (const card of searchResults) {
      const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", card.id);
      const snapshot = await getDoc(cardRef);
      if (!snapshot.exists()) {
        await setDoc(cardRef, { ...card, quantity: 0 });
      }
    }
  };

  const markAllAsOwned = async () => {
    for (const card of ownedCards) {
      const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", card.id);
      await updateDoc(cardRef, { quantity: 1 });
    }
  };

  const totalUnique = ownedCards.filter((c) => c.quantity > 0).length;
  const totalQuantity = ownedCards.reduce((sum, c) => sum + (c.quantity || 0), 0);

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>📁 {collectionName}</h1>
        <button onClick={() => window.history.back()} style={{ marginBottom: "1rem" }}>← Back</button>
        <p>
  This collection contains <strong>{ownedCards.length}</strong> cards.
  <br />You own <strong>{totalUnique}</strong> of them.
  <br />Total copies owned: <strong>{totalQuantity}</strong>
</p>

        <CardSearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          onSearch={handleSearch}
        />

        {searchResults.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button onClick={handleAddAllAsUnowned}>➕ Add All as Unowned</button>
            <button onClick={markAllAsOwned}>✅ Mark All as Owned</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
          {searchResults.map((card) => {
            const owned = ownedCards.find((c) => c.id === card.id) || { quantity: 0 };
            const isMissing = owned.quantity === 0;
            return (
              <div
                key={card.id}
                style={{
                  backgroundColor: "#1e1e1e",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  textAlign: "center",
                  opacity: isMissing ? 0.5 : 1,
                  filter: isMissing ? "grayscale(100%)" : "none",
                }}
              >
                <img src={card.images?.small} alt={card.name} style={{ width: "100%", borderRadius: "4px" }} />
                <p style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{card.name}</p>
                <p style={{ fontSize: "0.8rem", color: "#ccc" }}>#{card.number}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                  <button onClick={() => handleRemoveCard(card.id)}>-</button>
                  <span>{owned.quantity}</span>
                  <button onClick={() => handleAddCard(card)}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
          <label>Sort by: </label>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="releaseDate">Release Date</option>
            <option value="quantity">Quantity</option>
            <option value="type">Type</option>
          </select>
        </div>

        <h2>Your Cards</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {ownedCards.map((card) => {
              const isMissing = card.quantity === 0;
              return (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: "#1e1e1e",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    textAlign: "center",
                    opacity: isMissing ? 0.5 : 1,
                    filter: isMissing ? "grayscale(100%)" : "none",
                  }}
                >
                  <img src={card.images?.small} alt={card.name} style={{ width: "100%", borderRadius: "4px" }} />
                  <p style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{card.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "#fff" }}>Qty: {card.quantity}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                    <button onClick={() => handleRemoveCard(card.id)}>-</button>
                    <button onClick={() => handleAddCard(card)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default CollectionDetailPage;
