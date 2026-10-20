import { auth, db } from '@/firebase';
import { collection, doc, onSnapshot, getDoc } from 'firebase/firestore';

export interface CadetPresence {
  uid: string;
  username: string;
  avatarUrl?: string;
  campus?: string;
  lastSeen: number;
  status: 'online' | 'offline';
  updatedAt?: string;
}

const ONLINE_THRESHOLD_MS = 90000; // 90 seconds (heartbeat is sent every 45s)

/**
 * Determine if a cadet is genuinely active right now based on heartbeat timestamp
 */
export function isCadetOnline(presence?: { status?: string; lastSeen?: number } | null): boolean {
  if (!presence) return false;
  if (presence.status !== 'online') return false;
  if (!presence.lastSeen) return false;
  return Date.now() - presence.lastSeen < ONLINE_THRESHOLD_MS;
}

/**
 * Format last seen time accurately without fabrication
 */
export function formatLastSeen(lastSeen?: number): string {
  if (!lastSeen) return 'Offline';
  const diff = Date.now() - lastSeen;
  if (diff < ONLINE_THRESHOLD_MS) return 'Active now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;
  return `Last seen ${new Date(lastSeen).toLocaleDateString()}`;
}

/**
 * Real-time listener for the entire presence collection
 * Auth-guarded: Only connects to Firestore WebChannel stream when authenticated,
 * preventing Safari access control aborts and permission errors on unauthenticated mount.
 */
export function subscribeToPresence(
  onUpdate: (presenceMap: Record<string, CadetPresence>) => void
): () => void {
  let isCleanedUp = false;
  let unsubscribePresence: (() => void) | null = null;

  const startListening = () => {
    if (isCleanedUp || unsubscribePresence) return;
    try {
      const presenceCol = collection(db, 'presence');
      unsubscribePresence = onSnapshot(
        presenceCol,
        (snapshot) => {
          if (isCleanedUp) return;
          const map: Record<string, CadetPresence> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as CadetPresence;
            if (data && docSnap.id) {
              map[docSnap.id] = {
                uid: docSnap.id,
                username: data.username || 'Cadet',
                avatarUrl: data.avatarUrl || '',
                campus: data.campus || '',
                lastSeen: data.lastSeen || 0,
                status: data.status || 'offline',
                updatedAt: data.updatedAt,
              };
            }
          });
          onUpdate(map);
        },
        (err) => {
          console.warn('[AVENIR ARENA] Presence subscription notice:', err);
        }
      );
    } catch (err) {
      console.warn('[AVENIR ARENA] Failed to subscribe to presence collection:', err);
    }
  };

  if (auth.currentUser) {
    startListening();
  } else {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && !isCleanedUp) {
        startListening();
      }
    });

    return () => {
      isCleanedUp = true;
      unsubAuth();
      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }

  return () => {
    isCleanedUp = true;
    if (unsubscribePresence) {
      unsubscribePresence();
    }
  };
}

/**
 * Fetch presence for a single user once (auth-guarded)
 */
export async function getSingleCadetPresence(uid: string): Promise<CadetPresence | null> {
  if (!uid || !auth.currentUser) return null;
  try {
    const presenceRef = doc(db, 'presence', uid);
    const snap = await getDoc(presenceRef);
    if (snap.exists()) {
      const data = snap.data() as CadetPresence;
      return {
        uid,
        username: data.username || 'Cadet',
        avatarUrl: data.avatarUrl || '',
        campus: data.campus || '',
        lastSeen: data.lastSeen || 0,
        status: data.status || 'offline',
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.warn('[AVENIR ARENA] Single presence fetch notice:', err);
  }
  return null;
}
