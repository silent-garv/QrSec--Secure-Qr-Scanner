import { doc, setDoc } from "firebase/firestore";
// Create or update user document in 'users' collection
export const saveUserData = async (user: { uid: string, email?: string, displayName?: string, photoURL?: string }) => {
  if (!user?.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Error saving user data:', err);
  }
};
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot
} from "firebase/firestore";
// Real-time Firestore listener for scans
export const listenToScans = (userId: string, callback: (scans: any[]) => void, limitCount = 50) => {
  const colRef = collection(db, 'scans');
  const q = query(
    colRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const scans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(scans);
  });
};

// Use the VITE_FIREBASE_* environment variable names (normalized across the repo)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined
};

// Export function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let firebaseInitialized = false;

// Debug: show which env key was detected (mask most of the API key)
try {
  const masked = firebaseConfig.apiKey ? ('***' + String(firebaseConfig.apiKey).slice(-6)) : 'MISSING';
  console.debug('[firebase] detected apiKey:', masked);
} catch (e) {
  /* ignore */
}

// Validate minimal required config. If missing, log and avoid initializing to prevent runtime crashes.
if (!firebaseConfig.apiKey) {
  console.error('[firebase] Missing API key. Please set VITE_FIREBASE_API_KEY in your .env file.');
} else {
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig as any);
    } else {
      // reuse initialized app
      firebaseApp = getApps()[0];
    }

    // Initialize auth and firestore
    try {
      firebaseAuth = getAuth(firebaseApp);
    } catch (e) {
      console.warn('[firebase] getAuth failed', e);
      firebaseAuth = null;
    }

    try {
      firebaseDb = getFirestore(firebaseApp);
    } catch (e) {
      console.warn('[firebase] getFirestore failed', e);
      firebaseDb = null;
    }

    firebaseInitialized = true;
    console.info('[firebase] Initialized successfully');
  } catch (err: any) {
    console.error('[firebase] initialization error:', err?.message || err);
    firebaseInitialized = false;
  }
}

export const auth = firebaseAuth;
export const db = firebaseDb;

const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const signInWithGoogle = async () => {
  if (!firebaseInitialized || !auth) {
    const msg = 'Firebase not configured. Cannot sign in.';
    console.error('[firebase] ' + msg);
    return { user: null, error: msg };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error?.message || String(error) };
  }
};

export const signOut = async () => {
  if (!firebaseInitialized || !auth) {
    const msg = 'Firebase not configured. Cannot sign out.';
    console.error('[firebase] ' + msg);
    return { error: msg };
  }

  try {
    await fbSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error?.message || String(error) };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!firebaseInitialized || !auth) {
    console.warn('[firebase] onAuthChange called but Firebase is not configured.');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Firestore helpers
export const addScan = async (userId: string, url: string, status: string, score: number, type: 'url'|'qr') => {
  try {
    const colRef = collection(db, 'scans');
    const docRef = await addDoc(colRef, {
      userId,
      url,
      status,
      score,
      type,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error('Error adding scan:', err);
    throw err;
  }
};

export const getRecentScans = async (userId: string, limitCount = 20) => {
  try {
    const colRef = collection(db, 'scans');
    const q = query(
      colRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return { 
      scans: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      error: null 
    };
  } catch (error: any) {
    return { scans: [], error: error.message };
  }
};
