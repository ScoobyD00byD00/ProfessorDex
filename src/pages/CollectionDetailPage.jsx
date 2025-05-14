// src/pages/CollectionDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useUser } from "../services/UserContext";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { searchCards } from "../services/tcgApiService";
import CardSearchBar from "../components/CardSearchBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const allVariants = [
  "normal",
  "reverseHolo",
  "holo",
  "cosmosHolo",
  "aceSpec",
  "doubleRare",
  "ultraRare",
  "illustrationRare",
  "specialIllustrationRare",
  "hyperRare",
  "shinyRare",
  "shinyUltraRare",
  "pokeBallPattern",
  "masterBallPattern",
];

const variantLabels = {
  normal: "Normal",
  reverseHolo: "Reverse Holo",
  holo: "Holo",
  cosmosHolo: "Cosmos Holo",
  aceSpec: "ACE SPEC",
  doubleRare: "Double Rare",
  ultraRare: "Ultra Rare",
  illustrationRare: "Illustration Rare",
  specialIllustrationRare: "Special Illustration Rare",
  hyperRare: "Hyper Rare",
  shinyRare: "Shiny Rare",
  shinyUltraRare: "Shiny Ultra Rare",
  pokeBallPattern: "Poké Ball Pattern",
  masterBallPattern: "Master Ball Pattern",
};

const variantColors = {
  normal: "#fff",
  reverseHolo: "#e57373",
  holo: "#64b5f6",
  cosmosHolo: "#81d4fa",
  aceSpec: "#ff4081",
  doubleRare: "#90caf9",
  ultraRare: "#ffb74d",
  illustrationRare: "#ba68c8",
  specialIllustrationRare: "#ce93d8",
  hyperRare: "#f06292",
  shinyRare: "#00e676",
  shinyUltraRare: "#00bfa5",
  pokeBallPattern: "#ffd54f",
  masterBallPattern: "#9575cd",
};

const CollectionDetailPage = () => {
  const { collectionId } = useParams();
  const user = useUser();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [searchResults, setSearchResults] = useState([]);
  const [ownedCards, setOwnedCards] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const results = await searchCards(searchTerm.trim(), searchField);
    setSearchResults(results);
  };

  const getCardVariants = (card) => {
    const variants = [];
    const rarity = card.rarity || "";
    const subtypes = card.subtypes || [];
    const name = card.name || "";
    const setId = card.set?.id || "";

    const isSpecialRarity =
      rarity === "Double Rare" ||
      rarity === "Ultra Rare" ||
      rarity === "Illustration Rare" ||
      rarity === "Special Illustration Rare" ||
      rarity === "Hyper Rare" ||
      rarity === "Shiny Rare" ||
      rarity === "Shiny Ultra Rare";

    if (card.tcgplayer?.prices?.normal) variants.push("normal");
    if (card.tcgplayer?.prices?.reverseHolofoil) variants.push("reverseHolo");
    if (card.tcgplayer?.prices?.holofoil && !isSpecialRarity && !subtypes.includes("ACE SPEC")) {
      variants.push("holo");
    }

    if (subtypes.includes("ACE SPEC")) variants.push("aceSpec");
    if (rarity === "Double Rare") variants.push("doubleRare");
    if (rarity === "Ultra Rare") variants.push("ultraRare");
    if (rarity === "Illustration Rare") variants.push("illustrationRare");
    if (rarity === "Special Illustration Rare") variants.push("specialIllustrationRare");
    if (rarity === "Hyper Rare") variants.push("hyperRare");
    if (rarity === "Shiny Rare") variants.push("shinyRare");
    if (rarity === "Shiny Ultra Rare") variants.push("shinyUltraRare");

    if (setId === "pe3") {
      if (name.includes("Poké Ball Pattern")) variants.push("pokeBallPattern");
      if (name.includes("Master Ball Pattern")) variants.push("masterBallPattern");
    }

    return variants;
  };

  const toggleVariant = async (cardId, variant, cardData) => {
    if (!user?.uid || !collectionId) return;

    const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", cardId);
    const snapshot = await getDoc(cardRef);
    const current = snapshot.exists() ? snapshot.data().owned || {} : {};
    const newValue = !current[variant];

    await setDoc(cardRef, {
      ...(!snapshot.exists() ? cardData : {}),
      owned: {
        ...current,
        [variant]: newValue,
      },
    }, { merge: true });
  };

  const updateQuantity = async (cardId, delta) => {
    const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", cardId);
    const snapshot = await getDoc(cardRef);
    if (snapshot.exists()) {
      const currentQty = snapshot.data().quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      await updateDoc(cardRef, { quantity: newQty });
    }
  };

  const displayedVariantCards = ownedCards.flatMap((card) => {
    const variants = getCardVariants(card);
    return variants
      .filter((v) => card.owned?.[v])
      .map((variant) => ({ ...card, variant }));
  });

const totalByVariant = (variantKey) =>
  ownedCards.filter((card) => card.owned?.[variantKey] === true).length;

  const handleMarkAll = async (markOwned = true) => {
    if (!user?.uid || !collectionId) return;
    if (!window.confirm(`Are you sure you want to ${markOwned ? "mark" : "unmark"} all cards?`)) return;

    const batch = ownedCards.map(async (card) => {
      const updatedVariants = {};
      getCardVariants(card).forEach((v) => (updatedVariants[v] = markOwned));

      const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", card.id);
      await setDoc(cardRef, {
        ...card,
        owned: updatedVariants,
      }, { merge: true });
    });

    await Promise.all(batch);
    toast.success(`All cards ${markOwned ? "marked" : "unmarked"}.`);
  };
const handleRecalculateStats = async () => {
  if (!user?.uid || !collectionId) return;
  if (!window.confirm("Are you sure you want to recalculate collection stats? This will rebuild the variant tags.")) return;

  const updates = ownedCards.map(async (card) => {
    const cardRef = doc(db, "users", user.uid, "collections", collectionId, "cards", card.id);
    const fixedVariants = {};
    getCardVariants(card).forEach((v) => {
      fixedVariants[v] = card.owned?.[v] || false;
    });

    await updateDoc(cardRef, {
      owned: fixedVariants,
    });
  });

  await Promise.all(updates);
  toast.success("Collection stats recalculated!");
};
 return (
    <div>
      <NavBar />
      <div style={{ padding: "1rem 2rem" }}>
        <button onClick={() => navigate("/collections")} style={{ background: "none", border: "none", color: "#2196f3", fontSize: "0.9rem", cursor: "pointer", marginBottom: "1rem", padding: 0 }}>← Back to Collections</button>
        <h1>{collectionName}</h1>
        <p style={{ color: "#ccc", fontSize: "0.9rem", lineHeight: "1.6" }}>
          {allVariants
            .filter((v) => totalByVariant(v) > 0)
            .map((variant, index, array) => (
              <span key={variant}>
                {variantLabels[variant]}: <strong>{totalByVariant(variant)}</strong>
                {index < array.length - 1 ? " | " : ""}
              </span>
            ))}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem 1.2rem", lineHeight: "1.2", marginBottom: "1.5rem" }}>
          {allVariants
            .filter((v) => totalByVariant(v) > 0)
            .map((key) => (
              <span key={key} style={{ display: "inline-flex", alignItems: "center", fontSize: "0.82rem" }}>
                <span style={{ width: 12, height: 12, backgroundColor: variantColors[key], display: "inline-block", marginRight: 6, borderRadius: 2 }} />
                <span style={{ color: variantColors[key] }}>{variantLabels[key]}</span>
              </span>
            ))}
        </div>

<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.5rem",
  }}
>
  <button
    onClick={() => handleMarkAll(true)}
    style={{
      background: "#4caf50",
      color: "white",
      border: "none",
      padding: "0.4rem 0.8rem",
      borderRadius: "6px",
      cursor: "pointer",
    }}
  >
    Add All
  </button>

  <button
    onClick={() => handleMarkAll(false)}
    style={{
      background: "#f44336",
      color: "white",
      border: "none",
      padding: "0.4rem 0.8rem",
      borderRadius: "6px",
      cursor: "pointer",
    }}
  >
    Remove All
  </button>

  <div style={{ display: "flex", flexDirection: "column", maxWidth: "240px" }}>
    <p style={{ fontSize: "0.85rem", color: "#aaa", margin: 0 }}>
      Rebuilds variant stats using the latest card rules.
    </p>
    <button
      onClick={handleRecalculateStats}
      style={{
        background: "#2196f3",
        color: "white",
        border: "none",
        padding: "0.4rem 0.8rem",
        borderRadius: "6px",
        cursor: "pointer",
        marginTop: "0.4rem",
      }}
    >
      Recalculate Collection Stats
    </button>
  </div>
</div>


        <section style={{ marginBottom: "2rem" }}>
          <h2>Search and Add Cards</h2>
          <CardSearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            onSearch={handleSearch}
          />

          {searchResults.length > 0 && (
            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
              {searchResults.map((card) => {
                const owned = ownedCards.find((c) => c.id === card.id) || { owned: {}, quantity: 0 };
                const cardVariants = getCardVariants(card);


           
                return (
                  <div key={card.id} style={{ backgroundColor: "#1e1e1e", border: "1px solid #ccc", borderRadius: "8px", padding: "0.5rem", textAlign: "center" }}>
                  <img
  src={card.images?.small}
  alt={card.name}
  style={{
    width: "100%",
    height: "180px",         // ✅ force consistent height
    objectFit: "contain",    // ✅ keeps proportions without stretching
    borderRadius: "4px"
  }}
/>
                    <p style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{card.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#ccc" }}>{card.set?.id?.toUpperCase()} — #{card.number}</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "0.25rem" }}>
                      {cardVariants.map((key) => (
                        <div
                          key={key}
                          onClick={() => toggleVariant(card.id, key, card)}
                          style={{
                            width: 14,
                            height: 14,
                            backgroundColor: owned.owned?.[key] ? variantColors[key] : "transparent",
                            border: `2px solid ${variantColors[key]}`,
                            cursor: "pointer",
                          }}
                          title={variantLabels[key]}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <h2>Your Owned Variants</h2>
        {loading ? (
          <p>Loading your collection...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {displayedVariantCards.map((card, index) => (
              <div key={`${card.id}-${card.variant}-${index}`} style={{
  backgroundColor: "#1e1e1e",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "0.5rem",
  textAlign: "center",
  maxWidth: "200px",       
  margin: "0 auto"          
}}>
             <img
  src={card.images?.small}
  alt={card.name}
  style={{
    width: "100%",
    height: "180px",
    objectFit: "contain",
    borderRadius: "4px",
    marginBottom: "0.4rem"
  }}
/>
                <p style={{ fontWeight: "bold", fontSize: "0.85rem", margin: "0.25rem 0 0.15rem" }}>{card.name}</p>
                <p style={{ fontSize: "0.72rem", color: "#ccc", margin: "0 0 0.15rem" }}>{card.set?.id?.toUpperCase()} — #{card.number}</p>
                <span style={{ fontSize: "0.7rem", color: variantColors[card.variant] }}>{variantLabels[card.variant]}</span>
                <div style={{ marginTop: "0.3rem", display: "flex", justifyContent: "center", gap: "0.4rem" }}>
                  <button onClick={() => updateQuantity(card.id, -1)}>-</button>
                  <span>{card.quantity ?? 0}</span>
                  <button onClick={() => updateQuantity(card.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
   <ToastContainer />
    </div> 
  );
};

export default CollectionDetailPage;