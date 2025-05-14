// src/services/firestoreService.js
import {
  collection,
  getDocs,
  query,
  addDoc
} from "firebase/firestore";
import { db } from "../firebase";

// Total cards user owns
export const getTotalCardsOwned = async (userId) => {
  const collectionRef = collection(db, "users", userId, "personalCollection");
  const snapshot = await getDocs(collectionRef);
  return snapshot.size;
};

// All owned cards
export const getAllOwnedCards = async (userId) => {
  const snapshot = await getDocs(collection(db, "users", userId, "personalCollection"));
  return snapshot.docs.map((doc) => doc.data());
};

// Create a new user collection (folder)
export const createUserCollection = async (userId, collectionName) => {
  if (!userId) throw new Error("No user ID provided");
  const userCollectionsRef = collection(db, "users", userId, "collections");
  const docRef = await addDoc(userCollectionsRef, {
    name: collectionName,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Count total decks user created
export const getTotalDecksCreated = async (userId) => {
  const snapshot = await getDocs(collection(db, "users", userId, "decks"));
  return snapshot.size;
};

// Count completed master sets
export const getMasterSetsCompleted = async (userId) => {
  const snapshot = await getDocs(collection(db, "users", userId, "masterSetSummaries"));
  return snapshot.docs.filter((doc) => doc.data().completed === true).length;
};
