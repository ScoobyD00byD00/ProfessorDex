import React from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../services/UserContext";
import { toast } from "react-toastify";

const BackfillOwnedCardsButton = () => {
  const user = useUser();

  const runBackfill = async () => {
    if (!user?.uid) return;

    try {
      const collectionsSnapshot = await getDocs(
        collection(db, "users", user.uid, "collections")
      );

      for (const col of collectionsSnapshot.docs) {
        const collectionId = col.id;

        const cardsSnapshot = await getDocs(
          collection(db, "users", user.uid, "collections", collectionId, "cards")
        );

        for (const cardDoc of cardsSnapshot.docs) {
          const data = cardDoc.data();
          const variants = data.owned || {};
          const cardId = cardDoc.id;
          const setId = data.set?.id || "unknown";

          // ✅ Update shared ownedCards
          await setDoc(
            doc(db, "users", user.uid, "ownedCards", cardId),
            {
              owned: true,
              variants,
              collections: [collectionId],
              updatedAt: new Date(),
            },
            { merge: true }
          );

          // ✅ Also update masterSets path
          await setDoc(
            doc(db, "users", user.uid, "masterSets", setId, "cards", cardId),
            {
              ...data,
              owned: variants,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        }
      }

      toast.success("Backfill complete!");
    } catch (err) {
      console.error("Backfill failed", err);
      toast.error("Backfill failed. Check console.");
    }
  };

  return (
    <button
      onClick={runBackfill}
      style={{
        marginBottom: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#ff9800",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      🔄 Run Backfill for Master Sets
    </button>
  );
};

export default BackfillOwnedCardsButton;
