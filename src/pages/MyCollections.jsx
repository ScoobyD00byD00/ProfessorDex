import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { useUser } from "../services/UserContext";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { createUserCollection } from "../services/firestoreService";
import { Link } from "react-router-dom";
import { check } from "leo-profanity";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyCollections = () => {
  const user = useUser();
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [sortByName, setSortByName] = useState("asc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "users", user.uid, "collections"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tempCollections = [];

      for (const docSnap of snapshot.docs) {
        const colData = docSnap.data();
        const colId = docSnap.id;

        const cardsRef = collection(
          db,
          "users",
          user.uid,
          "collections",
          colId,
          "cards"
        );
        const cardDocs = await getDocs(cardsRef);
        const cardList = cardDocs.docs.map((d) => d.data());
        const totalCount = cardList.length;
        const ownedCount = cardList.filter(
          (card) => card.quantity && card.quantity > 0
        ).length;

        tempCollections.push({
          id: colId,
          ...colData,
          totalCount,
          cardCount: ownedCount,
        });
      }

      setCollections(tempCollections);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateCollection = async () => {
    if (!user?.uid || !newCollectionName.trim()) return;

    if (check(newCollectionName)) {
      toast.error("Please avoid using inappropriate language.");
      return;
    }

    await createUserCollection(user.uid, newCollectionName.trim());
    setNewCollectionName("");
  };

  const handleDeleteCollection = async (collectionId) => {
    const confirmed = window.confirm("Delete this collection?");
    if (!confirmed) return;
    await deleteDoc(doc(db, "users", user.uid, "collections", collectionId));
  };

  const handleRenameCollection = async (collectionId, currentName) => {
    const input = prompt("Rename collection:", currentName);
    if (!input || input.trim() === "") return;

    const newName = input.trim();

    if (check(newName)) {
      toast.error("Please avoid using inappropriate language.");
      return;
    }

    await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
      name: newName,
    });
  };

  const sortedCollections = [...collections].sort((a, b) =>
    sortByName === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );

  return (
    <div>
      <NavBar />
      <div style={{ padding: "2rem" }}>
        <h1>📁 My Collection</h1>

        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="New collection name..."
            value={newCollectionName}
            maxLength={30}
            onChange={(e) => setNewCollectionName(e.target.value)}
            style={{ padding: "0.5rem", marginRight: "0.5rem" }}
          />
          <small>{newCollectionName.length}/30 characters</small>
          <button
            onClick={handleCreateCollection}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#8c92b9",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "0.5rem",
            }}
          >
            ➕ Create Collection
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="sortByName">Sort collections: </label>
          <select
            id="sortByName"
            value={sortByName}
            onChange={(e) => setSortByName(e.target.value)}
            style={{ padding: "0.5rem", marginLeft: "0.5rem" }}
          >
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
          }}
        >
          {sortedCollections.map((col) => (
            <Link
              key={col.id}
              to={`/collections/${col.id}`}
              style={{ textDecoration: "none", color: "white" }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#2a2a2a",
                  borderRadius: "8px",
                  minHeight: "130px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onClick={(e) => {
                  if (e.target.tagName === "BUTTON") e.preventDefault();
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.5rem" }}>{col.name}</h3>
                  <p style={{ margin: "0" }}>
                    Owned: {col.cardCount > 0 ? col.cardCount : 0} /{" "}
                    {col.totalCount ?? col.cardCount}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleRenameCollection(col.id, col.name)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      backgroundColor: "#4caf50",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: "white",
                    }}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      backgroundColor: "#f44336",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: "white",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default MyCollections;
