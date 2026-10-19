import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-KocuOcC8bGuowDFsPe9WyY8-u7-K13U",
  authDomain: "fitlens-bf542.firebaseapp.com",
  databaseURL: "https://fitlens-bf542-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fitlens-bf542",
  storageBucket: "fitlens-bf542.firebasestorage.app",
  messagingSenderId: "274605796488",
  appId: "1:274605796488:web:8cabe338dbe41f3366033d",
  measurementId: "G-8Z6T5J8KYL"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);