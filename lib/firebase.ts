import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Firebase Admin SDK initialization (server-side only)
let app: App | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

function initializeFirebaseAdmin() {
  // Return existing instance if already initialized
  if (app && db && auth) {
    return { app, db, auth };
  }

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

// Lazy getters - initialize on first access
function getFirebaseInstance() {
  return initializeFirebaseAdmin();
}

export const firebaseAdmin = new Proxy({} as App, {
  get: (target, prop) => {
    const instance = getFirebaseInstance();
    return (instance.app as any)[prop];
  }
});

export const firestore = new Proxy({} as Firestore, {
  get: (target, prop) => {
    const instance = getFirebaseInstance();
    return (instance.db as any)[prop];
  }
});

export const firebaseAuth = new Proxy({} as Auth, {
  get: (target, prop) => {
    const instance = getFirebaseInstance();
    return (instance.auth as any)[prop];
  }
});

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
