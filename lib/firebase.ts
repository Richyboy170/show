import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Firebase Admin SDK initialization (server-side only)
let app: App;
let db: Firestore;
let auth: Auth;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Initialize with service account credentials
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error(
        'Missing Firebase Admin SDK credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  return { app, db, auth };
}

// Initialize on first import
const firebase = initializeFirebaseAdmin();

export const firebaseAdmin = firebase.app;
export const firestore = firebase.db;
export const firebaseAuth = firebase.auth;

// Collection names
export const COLLECTIONS = {
  VIDEOS: 'videos',
  ADMINS: 'admins',
  USERS: 'users',
  FAVORITES: 'favorites',
  CHANNEL_MONITORS: 'channelMonitors',
  NOTIFICATIONS: 'notifications',
  LYRICS: 'lyrics', // subcollection under videos
  WORDS: 'words',   // subcollection under lyrics
} as const;
