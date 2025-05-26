
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getAnalytics } from "firebase/analytics"; // Optional: Only if you need Firebase Analytics

// Log to help debug if environment variables are loaded
console.log("Attempting to use Firebase API Key from env:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let auth: Auth;
// let analytics; // Optional

// Check if all required config values are present for core functionality
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error(
    "Firebase configuration is missing or incomplete. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
    "and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set correctly in your .env.local file, " +
    "and that you have restarted your development server. Application might not work correctly."
  );
  // You might throw an error here to stop initialization if critical values are missing,
  // or allow it to proceed and let Firebase SDK handle the error.
  // if (!firebaseConfig.apiKey) throw new Error("Firebase API Key is missing! Cannot initialize Firebase.");
}


if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    // analytics = getAnalytics(app); // Optional: Initialize Analytics if measurementId is present and needed
  } catch (e) {
    console.error("Error initializing Firebase App:", e);
    // Depending on the error, you might want to throw it or handle it gracefully.
    // For now, we'll let it proceed so auth initialization below might still show an error if config is bad.
  }
} else {
  app = getApp();
}

// Initialize Auth, even if app initialization had an issue, to get specific auth errors.
try {
  auth = getAuth(app!); // Use non-null assertion if app is guaranteed to be initialized or error thrown.
} catch (e) {
  console.error("Error getting Firebase Auth instance:", e);
  // If auth can't be initialized, the app's auth features won't work.
  // throw new Error("Could not initialize Firebase Authentication."); // Optionally rethrow
}


export { app, auth }; // Export analytics if initialized and needed
