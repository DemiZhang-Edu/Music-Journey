import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useState, useEffect } from 'react';

// Singleton instances
let authInstance: any = null;
let dbInstance: any = null;

const getFirebaseConfig = async () => {
  // 1. Try environment variables (Sync in Vite if defined at build time)
  // Note: Only VITE_ prefixed variables are available in browser context usually
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 2. Fallback to AI Studio dynamic config file
  try {
    // @ts-ignore - Dynamic import to avoid build errors if file is missing
    const m = await import(/* @vite-ignore */ '../../firebase-applet-config.json');
    if (m && m.default) return m.default;
  } catch (e) {
    // Expected in production if env vars are used
  }
  return null;
};

export const initFirebase = async () => {
  if (authInstance) return { auth: authInstance, db: dbInstance };

  const config = await getFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      const apps = getApps();
      const app = apps.length === 0 ? initializeApp(config) : apps[0];
      authInstance = getAuth(app);
      dbInstance = getFirestore(app, config.firestoreDatabaseId || "(default)");
      
      // Update the exported placeholders
      auth = authInstance;
      db = dbInstance;
      
      return { auth: authInstance, db: dbInstance };
    } catch (err) {
      console.warn("Firebase initialization failed:", err);
    }
  }
  return { auth: null, db: null };
};

// Immediate background initialization
// We update the exported 'let' variables as soon as ready
initFirebase().then(instances => {
  if (instances.auth) {
    auth = instances.auth;
    db = instances.db;
  }
});

// Proxy exports that attempt to return instances if they exist
export let auth: any = null;
export let db: any = null;

/**
 * Hook to use Firebase instances once they are ready.
 */
export function useFirebase() {
  const [instances, setInstances] = useState({ auth: authInstance, db: dbInstance });

  useEffect(() => {
    // If already loaded, we're good
    if (authInstance && dbInstance) {
      setInstances({ auth: authInstance, db: dbInstance });
      return;
    }

    // Otherwise, wait for initialization
    initFirebase().then(res => {
      setInstances(res);
    });

    // Also poll slightly if needed (insurance for module-level updates)
    const timer = setInterval(() => {
      if (authInstance && !instances.auth) {
        setInstances({ auth: authInstance, db: dbInstance });
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return instances;
}

export const getAuthInstance = () => authInstance;
export const getDbInstance = () => dbInstance;

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const { auth } = await initFirebase();
  if (!auth) throw new Error("Firebase not initialized. Check your configuration.");
  return signInWithPopup(auth, googleProvider);
};

export const signOut = async () => {
  const { auth } = await initFirebase();
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
