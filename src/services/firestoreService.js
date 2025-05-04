// src/services/firestoreService.js
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";

const db = getFirestore();

// Total cards user owns (from personal collection)
export const getTotalCardsOwned = async (userId) => {
  const collectionRef = collection(db, "users", userId, "personalCollection");
  const snapshot = await getDocs(collectionRef);
  return snapshot.size;
};

// Get all cards from the personal collection
export const getOwnedCardsForUser = async (userId) => {
  if (!userId) throw new Error("No user ID provided");
  const q = query(collection(db, "users", userId, "personalCollection"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

// Create a named collection (e.g. user-defined folder/group)
export const createUserCollection = async (userId, collectionName) => {
  if (!userId) throw new Error("No user ID provided");
  const userCollectionsRef = collection(db, "users", userId, "collections");
  const docRef = await addDoc(userCollectionsRef, {
    name: collectionName,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Count decks created
export const getTotalDecksCreated = async (userId) => {
  const snapshot = await getDocs(
    collection(db, `users/${userId}/decks`)
  );
  return snapshot.size;
};

// ✅ NEW: Count completed master sets from summaries
export const getMasterSetsCompleted = async (userId) => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "masterSetSummaries")
  );
  return snapshot.docs.filter((doc) => doc.data().completed === true).length;
};
