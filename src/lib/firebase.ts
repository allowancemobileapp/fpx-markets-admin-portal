
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Log to help debug if environment variables are loaded
// This will show in your server console when Next.js builds/runs this file,
// and in the browser console because it's a client-side accessible env var.
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

// Check if all required config values are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error(
    "Firebase configuration is missing or incomplete. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
    "and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set correctly in your .env.local file, " +
    "and that you have restarted your development server."
  );
  // Depending on the severity, you might throw an error here to stop initialization
  // if (!firebaseConfig.apiKey) throw new Error("Firebase API Key is missing!");
}


if (!getApps().length) {
  // Ensure apiKey is a string, even if it's undefined, initializeApp will handle it and error out if invalid.
  // This check above is more for developer guidance.
  app = initializeApp(firebaseConfig as any); // Cast as any to bypass strict type checks if some are undefined, Firebase handles it.
} else {
  app = getApp();
}

auth = getAuth(app);

export { app, auth };
