// src/pages/SetDetailPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { useUser } from "../services/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";

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

const SetDetailPage = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [cards, setCards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [ownedCards, setOwnedCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("number-asc");
  const [variantIdMap, setVariantIdMap] = useState({});

  useEffect(() => {
    const fetchVariantIds = async () => {
      const snapshot = await getDocs(collection(db, "cardVariants"));
      const map = {};
      snapshot.forEach((doc) => {
        map[doc.id] = doc.data().ids;
      });
      setVariantIdMap(map);
    };
    fetchVariantIds();
  }, []);

  const getCardVariants = (card) => {
    const variants = [];
    const rarity = card.rarity || "";
    const subtypes = card.subtypes || [];
    const name = card.name || "";

    const isSpecialRarity =
      rarity === "Double Rare" ||
      rarity === "Ultra Rare" ||
      rarity === "Illustration Rare" ||
      rarity === "Special Illustration Rare" ||
      rarity === "Hyper Rare" ||
      rarity === "Shiny Rare" ||
      rarity === "Shiny Ultra Rare" ||
      subtypes.includes("ACE SPEC");

    if (card.tcgplayer?.prices?.normal) variants.push("normal");
    if (card.tcgplayer?.prices?.reverseHolofoil) variants.push("reverseHolo");
    if (card.tcgplayer?.prices?.holofoil && !isSpecialRarity) variants.push("holo");

    if (subtypes.includes("ACE SPEC")) variants.push("aceSpec");
    if (rarity === "Double Rare") variants.push("doubleRare");
    if (rarity === "Ultra Rare") variants.push("ultraRare");
    if (rarity === "Illustration Rare") variants.push("illustrationRare");
    if (rarity === "Special Illustration Rare") variants.push("specialIllustrationRare");
    if (rarity === "Hyper Rare") variants.push("hyperRare");
    if (rarity === "Shiny Rare") variants.push("shinyRare");
    if (rarity === "Shiny Ultra Rare") variants.push("shinyUltraRare");

    if (variantIdMap.pokeBallPattern?.includes(card.id)) variants.push("pokeBallPattern");
    if (variantIdMap.masterBallPattern?.includes(card.id)) variants.push("masterBallPattern");

    return variants;
  };

  useEffect(() => {
    const fetchSetData = async () => {
      setLoading(true);
      try {
        const headers = { "X-Api-Key": import.meta.env.VITE_TCG_API_KEY };
        const setResponse = await axios.get(`https://api.pokemontcg.io/v2/sets/${setId}`, { headers });
        setSetInfo(setResponse.data.data);

        let allCards = [];
        let page = 1;
        const pageSize = 250;
        let totalCount = 0;

        do {
          const cardsResponse = await axios.get("https://api.pokemontcg.io/v2/cards", {
            headers,
            params: { q: `set.id:${setId}`, page, pageSize },
          });
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

  useEffect(() => {
    if (!user?.uid || !setId) return;
    const cardsRef = collection(db, "users", user.uid, "masterSets", setId, "cards");
    const unsubscribe = onSnapshot(cardsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOwnedCards(list);
    });
    return () => unsubscribe();
  }, [user, setId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const sortedFilteredCards = useMemo(() => {
    return [...cards]
      .filter((card) => card.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      .sort((a, b) => {
        const aNum = parseInt(a.number);
        const bNum = parseInt(b.number);
        if (sortOrder === "number-asc") return aNum - bNum;
        if (sortOrder === "number-desc") return bNum - aNum;
        if (sortOrder === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [cards, debouncedSearchTerm, sortOrder]);

  const getVariantStats = (variantKey) => {
    const total = cards.filter((card) => getCardVariants(card).includes(variantKey)).length;
    const owned = ownedCards.filter((card) => card.owned?.[variantKey]).length;
    return { owned, total };
  };

  const renderCardCheckbox = (card, owned) => {
    const cardVariants = getCardVariants(card);
    return cardVariants.map((key) => (
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
        title={variantLabels[key] || key}
      />
    ));
  };

  const toggleVariant = async (cardId, variant, cardData) => {
    if (!user?.uid || !setId) return;
    const masterRef = doc(db, "users", user.uid, "masterSets", setId, "cards", cardId);
    const masterSnap = await getDoc(masterRef);
    const current = masterSnap.exists() ? masterSnap.data().owned || {} : {};
    const newValue = !current[variant];
    const fullVariantList = getCardVariants(cardData);
    const updatedOwned = {};
    fullVariantList.forEach((v) => {
      updatedOwned[v] = v === variant ? newValue : current[v] || false;
    });

    await setDoc(masterRef, {
      ...(!masterSnap.exists() ? cardData : {}),
      owned: updatedOwned,
      updatedAt: new Date(),
    }, { merge: true });

    const sharedRef = doc(db, "users", user.uid, "ownedCards", cardId);
    const sharedSnap = await getDoc(sharedRef);
    const sharedCurrent = sharedSnap.exists() ? sharedSnap.data().variants || {} : {};
    const existingCollections = sharedSnap.exists() ? sharedSnap.data().collections || [] : [];

    await setDoc(sharedRef, {
      id: cardData.id,
      name: cardData.name,
      images: cardData.images,
      supertype: cardData.supertype,
      rarity: cardData.rarity,
      owned: Object.values(updatedOwned).some(Boolean),
      variants: {
        ...sharedCurrent,
        ...updatedOwned,
      },
      collections: Array.from(new Set([...existingCollections, setId])),
      updatedAt: new Date(),
    }, { merge: true });
  };

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <button onClick={() => navigate("/sets")} style={{ background: "none", border: "none", color: "#2196f3", fontSize: "0.9rem", cursor: "pointer", marginBottom: "1rem", padding: 0 }}>← Back to Sets</button>
        {!setInfo ? <p>Loading set info...</p> : loading ? <p>Loading cards...</p> : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {setInfo?.images?.logo && <img src={setInfo.images.logo} alt={`${setInfo.name} logo`} style={{ height: "40px" }} />}
              <h1 style={{ margin: 0 }}>{setInfo.name}</h1>
            </div>
            <p style={{ margin: "0.5rem 0 1rem", fontSize: "0.95rem" }}>
              {allVariants.filter(v => getVariantStats(v).total > 0).map((variant, index, array) => {
                const { owned, total } = getVariantStats(variant);
                return (
                  <span key={variant}>
                    {variantLabels[variant]}: <strong>{owned}</strong> / {total}
                    {index < array.length - 1 ? " | " : ""}
                  </span>
                );
              })}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#ccc" }}>Legend:</span>
              {allVariants.filter(v => getVariantStats(v).total > 0).map((variant) => (
                <span key={variant} style={{ display: "inline-flex", alignItems: "center", fontSize: "0.82rem" }}>
                  <span style={{ width: 12, height: 12, backgroundColor: variantColors[variant], display: "inline-block", marginRight: 6, borderRadius: 2 }} />
                  <span style={{ color: variantColors[variant] }}>{variantLabels[variant]}</span>
                </span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
              {sortedFilteredCards.map((card) => {
                const owned = ownedCards.find((c) => c.id === card.id) || {};
                return (
                  <div key={card.id} style={{ border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#1e1e1e", padding: "0.5rem", textAlign: "center" }}>
                    <img src={card.images?.small} alt={card.name} loading="lazy" style={{ width: "100%", borderRadius: "4px", marginBottom: "0.4rem" }} />
                    <p style={{ fontSize: "0.85rem", fontWeight: "bold", margin: "0.25rem 0 0.2rem" }}>{card.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#ccc", margin: 0 }}>#{card.number}</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "0.4rem" }}>
                      {renderCardCheckbox(card, owned)}
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
