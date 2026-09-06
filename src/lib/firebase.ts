import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { stripUndefined } from './sanitize';
import type { JournalEntry } from '../types';

export const firebaseConfig = firebaseConfigData;

// Initialize Firebase app singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if specified in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection-health'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client appears offline. Retrying or using cache.');
      return false;
    }
    // Any other error still indicates network reachability
    return true;
  }
}

// User-isolated entries collection helper: /users/{userId}/entries
export function getUserEntriesRef(userId: string) {
  return collection(db, 'users', userId, 'entries');
}

export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  const entriesRef = getUserEntriesRef(userId);
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<JournalEntry, 'id'>) });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore snapshot error:', err);
      onError(err);
    }
  );
}

// Local storage cache keys for guest/offline sessions
const LOCAL_ENTRIES_KEY = 'ganbatte_journal_local_entries_v1';
const LEGACY_LOCAL_ENTRIES_KEY = 'cozy_journal_local_entries_v1';

export function getLocalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENTRIES_KEY) || localStorage.getItem(LEGACY_LOCAL_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalEntry(entry: JournalEntry): void {
  try {
    const current = getLocalEntries();
    const updated = [entry, ...current.filter((e) => e.id !== entry.id)];
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function removeLocalEntry(entryId: string): void {
  try {
    const current = getLocalEntries();
    const updated = current.filter((e) => e.id !== entryId);
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not remove from localStorage:', e);
  }
}

// Synchronize any local pending entries to Firestore when the user authenticates
export async function syncLocalEntriesToFirestore(userId: string): Promise<number> {
  const localEntries = getLocalEntries();
  if (localEntries.length === 0) return 0;

  let syncedCount = 0;
  for (const entry of localEntries) {
    try {
      const cleanPayload = stripUndefined({
        ...entry,
        userId,
      });
      const docRef = doc(db, 'users', userId, 'entries', entry.id);
      await setDoc(docRef, cleanPayload, { merge: true });
      removeLocalEntry(entry.id);
      syncedCount++;
    } catch (err) {
      console.warn(`Could not sync local entry ${entry.id} to Firestore:`, err);
    }
  }
  return syncedCount;
}

// Attempt anonymous sign-in gracefully on startup if not already authenticated
export async function autoSignInAnonymous(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch {
    // If anonymous sign-in is not enabled on the Firebase project, gracefully continue
    return null;
  }
}

export interface SaveEntryResult {
  savedToFirestore: boolean;
  actualUserId: string;
  isLocalOnly: boolean;
}

export async function saveJournalEntry(entry: JournalEntry): Promise<SaveEntryResult> {
  const currentAuthUser = auth.currentUser;

  // Case 1: Authenticated user (Google Auth or active session)
  if (currentAuthUser && !currentAuthUser.isAnonymous) {
    const actualUserId = currentAuthUser.uid;
    const cleanPayload = stripUndefined({
      ...entry,
      userId: actualUserId,
    });
    const docRef = doc(db, 'users', actualUserId, 'entries', entry.id);
    await setDoc(docRef, cleanPayload, { merge: true });
    removeLocalEntry(entry.id);
    return { savedToFirestore: true, actualUserId, isLocalOnly: false };
  }

  // Case 2: Anonymous user
  if (currentAuthUser && currentAuthUser.isAnonymous) {
    try {
      const actualUserId = currentAuthUser.uid;
      const cleanPayload = stripUndefined({
        ...entry,
        userId: actualUserId,
      });
      const docRef = doc(db, 'users', actualUserId, 'entries', entry.id);
      await setDoc(docRef, cleanPayload, { merge: true });
      saveLocalEntry({ ...entry, userId: actualUserId });
      return { savedToFirestore: true, actualUserId, isLocalOnly: false };
    } catch (fsErr) {
      console.warn('Anonymous Firestore write error, caching locally:', fsErr);
      saveLocalEntry(entry);
      return { savedToFirestore: false, actualUserId: entry.userId || 'guest', isLocalOnly: true };
    }
  }

  // Case 3: No current Firebase Auth user (e.g. preview mode or before sign-in)
  // Firestore rules strictly mandate `request.auth != null && request.auth.uid == userId`.
  // Calling setDoc unauthenticated would trigger "Missing or insufficient permissions".
  // We safeguard the reflection immediately in local persistence without crashing.
  saveLocalEntry(entry);
  return { savedToFirestore: false, actualUserId: entry.userId || 'guest', isLocalOnly: true };
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'entries', entryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  }
  removeLocalEntry(entryId);
}

export { onAuthStateChanged, signInWithPopup, signOut, type User };

