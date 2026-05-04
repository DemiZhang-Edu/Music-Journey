import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In AI Studio, we have a generated config file.
// In professional deployments (Vercel/GitHub), we use environment variables.
let appletConfig: any = {};

async function loadAppletConfig() {
  try {
    // Use vite-ignore to prevent the bundler from failing if the file is missing during build
    const m = await import(/* @vite-ignore */ '../../firebase-applet-config.json');
    appletConfig = m.default;
    return true;
  } catch (e) {
    // This is expected in production/Vercel where the file doesn't exist
    return false;
  }
}

const getFirebaseConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId
  };
};

let auth: any = null;
let db: any = null;

const initFirebase = async () => {
  await loadAppletConfig();
  const config = getFirebaseConfig();
  
  if (config.apiKey && config.projectId) {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      auth = getAuth(app);
      db = getFirestore(app, config.firestoreDatabaseId || "(default)");
    } catch (err) {
      console.warn("Firebase initialization failed:", err);
    }
  }
};

// Start initialization
initFirebase();

export { auth, db };
export const googleProvider = auth ? new GoogleAuthProvider() : null;

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase Auth is not configured.");
  }
  return signInWithPopup(auth, googleProvider);
};

export const signOut = async () => {
  if (auth) return auth.signOut();
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
