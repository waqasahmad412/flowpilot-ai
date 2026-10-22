/**
 * FlowPilot AI - Firebase Authentication & Cloud Firestore Integration
 *
 * Configurable via Vite environment variables or firebase config:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * - VITE_FIREBASE_MEASUREMENT_ID
 * - VITE_FIREBASE_DATABASE_ID (optional)
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// Read from Vite environment variables or process.env safely
export function getFirebaseConfig(): FirebaseClientConfig | null {
  const env: Record<string, any> =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined' && process.env
      ? process.env
      : {};

  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  return {
    apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
    firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || '(default)',
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(getFirebaseConfig());
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!cachedApp) {
      const existing = getApps();
      cachedApp = existing.length > 0 ? getApp() : initializeApp(config);
      cachedAuth = getAuth(cachedApp);
      cachedDb = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
        ? getFirestore(cachedApp, config.firestoreDatabaseId)
        : getFirestore(cachedApp);
    }

    return {
      app: cachedApp,
      auth: cachedAuth!,
      db: cachedDb!,
    };
  } catch (err) {
    console.error('Failed to initialize Firebase services:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  const services = initializeFirebase();
  return services ? services.auth : null;
}

export function getFirebaseDb(): Firestore | null {
  const services = initializeFirebase();
  return services ? services.db : null;
}

/**
 * Standardized Firestore error diagnostic logger and thrower
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Tests connection to Firestore using getDocFromServer
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    // Attempt fetching a diagnostic connection ping from server
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && (
      error.message.includes('the client is offline') ||
      error.message.includes('offline') ||
      error.message.includes('invalid-api-key') ||
      error.message.includes('API key not valid')
    )) {
      console.warn('Firestore connection check: service unreachable or client offline.', error.message);
      return false;
    }
    // Any response from server (even permission denied) indicates connection successfully reached Firestore
    return true;
  }
}

// Authentication helpers
export async function firebaseSignInWithGoogle(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function firebaseSignInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function firebaseRegisterWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');

  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function firebaseSignOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToFirebaseAuthState(callback: (user: FirebaseUser | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
