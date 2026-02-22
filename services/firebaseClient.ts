import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDX_JM5UqCaqY0y9j3LhPe1b5hWtlRlQrk",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jiekai-engineering.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jiekai-engineering",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jiekai-engineering.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "577304673929",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:577304673929:web:755d7a50bfe1454dbf5058",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence (multi-tab)
try {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('[Firebase] Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('[Firebase] Persistence not available in this browser');
        }
    });
} catch (e) {
    console.warn('[Firebase] Persistence setup skipped', e);
}

export default app;
