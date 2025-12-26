// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDsZiE2tMXkURiqeKwoRojaGWhVCceVu2Y",
  authDomain: "plateforme-de-plannifica-1b0e3.firebaseapp.com",
  projectId: "plateforme-de-plannifica-1b0e3",
  storageBucket: "plateforme-de-plannifica-1b0e3.firebasestorage.app",
  messagingSenderId: "168469512096",
  appId: "1:168469512096:web:746b1804b035b8b0e8eec5",
  measurementId: "G-RJ5XX7S7HR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);