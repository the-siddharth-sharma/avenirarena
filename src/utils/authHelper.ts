import { auth } from '@/firebase';

/**
 * Returns the verified Firebase Auth UID, awaiting authStateReady() if needed.
 * Guarantees that Firestore writes are sent with an authentic Firebase ID token,
 * preventing 'Missing or insufficient permissions' caused by transient unauthenticated state.
 */
export async function getVerifiedAuthUid(): Promise<string | null> {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (typeof auth.authStateReady === 'function') {
    try {
      await auth.authStateReady();
      if (auth.currentUser?.uid) {
        return auth.currentUser.uid;
      }
    } catch {
      // Ignore fallback
    }
  }
  return null;
}
