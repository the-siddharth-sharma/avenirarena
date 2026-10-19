import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { CredentialResponse } from '@react-oauth/google';
import { traceEngine } from '@/engine/infiniteTrace';
import { firestoreService } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '@/firebase';

export const ADMIN_EMAIL = 'siddharthsharma2649@gmail.com';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  token?: string;
}

export interface UserSocialLinks {
  linkedin?: string;
  other?: string;
  github?: string;
  twitter?: string;
}

export interface UserProfile {
  uid?: string;
  email?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string;
  campus: string;
  year: string;
  batch: string;
  socialLinks?: UserSocialLinks;
  bio?: string;
  xp?: number;
  academicXP?: number;
  gamesPlayed?: number;
  infiniteTraceStreak?: number;
  role?: 'admin' | 'cadet';
  isSetupComplete: boolean;
  createdAt?: string;
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  exp?: number;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

export const TAKEN_USERNAMES = [
  'admin',
  'quasar',
  'player1',
  'root',
  'cyber',
  'sniper',
  'test',
  'system',
  'moderator',
  'master',
];

/**
 * Real-time username uniqueness validation against reserved callsigns & Firestore user collection
 */
export async function checkUsernameUnique(username: string, currentUid?: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const normalized = username.trim().toLowerCase();
  if (TAKEN_USERNAMES.includes(normalized)) return false;
  
  try {
    const allUsers = await firestoreService.getAllUsers();
    const match = allUsers.find(
      (u) => u.username.toLowerCase() === normalized && u.uid !== currentUid
    );
    return !match;
  } catch {
    return true;
  }
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isOnboardingRequired: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  handleGoogleSuccess: (credentialResponse: CredentialResponse) => void;
  handleGoogleError: () => void;
  loginWithGoogle: () => Promise<void>;
  saveUserProfile: (profileData: Omit<UserProfile, 'isSetupComplete'>) => Promise<void>;
  updateUserXP: (delta: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
}

const AUTH_STORAGE_KEY = 'avenir-auth-user-v1';
const PROFILE_STORAGE_KEY = 'avenir-user-profile-v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronously restore user from cache on initial evaluation to eliminate reload latency
function getInitialStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user: User = JSON.parse(raw);
    if (user?.token) {
      try {
        const payload = jwtDecode<GoogleTokenPayload>(user.token);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          return null;
        }
      } catch {
        return null;
      }
    }
    return user;
  } catch {
    return null;
  }
}

// Synchronously restore profile from cache on initial evaluation so UI renders with 0ms delay
function getInitialStoredProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authStored) {
      const u = JSON.parse(authStored);
      const localUsers = JSON.parse(localStorage.getItem('avenir_firestore_users_v1') || '{}');
      if (localUsers[u.uid]) {
        const doc = localUsers[u.uid];
        return {
          uid: doc.uid,
          email: doc.email,
          username: doc.username,
          firstName: doc.firstName,
          lastName: doc.lastName,
          avatarUrl: doc.avatarUrl,
          campus: doc.campus,
          year: doc.year || '1st Year',
          batch: doc.batch,
          bio: doc.bio,
          socialLinks: doc.socialLinks,
          xp: doc.xp || 0,
          academicXP: doc.academicXP ?? doc.xp ?? 0,
          gamesPlayed: doc.gamesPlayed || 0,
          infiniteTraceStreak: doc.infiniteTraceStreak || 0,
          role: doc.role,
          isSetupComplete: Boolean(doc.isSetupComplete),
          createdAt: doc.createdAt,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous cache hydration ensures 0ms render latency on page reload
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialStoredUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getInitialStoredProfile);
  // Zero latency: Start with isLoading false whenever cached session exists or for guest
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync profile from Firestore with timeout resilience and local caching
  const syncProfileFromFirestore = async (uid: string): Promise<UserProfile | null> => {
    try {
      // 1. Query Firestore users collection with timeout to avoid network stalls
      try {
        const userRef = doc(db, 'users', uid);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
        );
        const userSnap = await Promise.race([getDoc(userRef), timeoutPromise]);

        if (userSnap.exists()) {
          const docData = userSnap.data();
          const xpVal = Number(docData.academicXP ?? docData.xp ?? 0);
          const profile: UserProfile = {
            uid: docData.uid || uid,
            email: docData.email || '',
            username: docData.username || '',
            firstName: docData.firstName || '',
            lastName: docData.lastName || '',
            avatarUrl: docData.avatarUrl || docData.photoURL || '',
            campus: docData.campus || 'MSOT Ghaziabad',
            year: docData.year || '1st Year',
            batch: docData.batch || '2025-2029',
            bio: docData.bio,
            socialLinks: docData.socialLinks,
            xp: xpVal,
            academicXP: xpVal,
            gamesPlayed: docData.gamesPlayed ?? 0,
            infiniteTraceStreak: docData.infiniteTraceStreak ?? 0,
            role: docData.role || 'cadet',
            isSetupComplete: Boolean(docData.isSetupComplete),
            createdAt: docData.createdAt || new Date().toISOString(),
          };
          setUserProfile(profile);
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
          } catch {}
          return profile;
        }
      } catch (firestoreErr) {
        console.warn('[AVENIR ARENA FIRESTORE] Direct Firestore read failed/timed out, using cache:', firestoreErr);
      }

      // 2. Fallback to service layer
      const localDoc = await firestoreService.getUserDoc(uid);
      if (localDoc) {
        const xpVal = Number(localDoc.xp || 0);
        const profile: UserProfile = {
          uid: localDoc.uid,
          email: localDoc.email,
          username: localDoc.username,
          firstName: localDoc.firstName,
          lastName: localDoc.lastName,
          avatarUrl: localDoc.avatarUrl,
          campus: localDoc.campus,
          year: localDoc.year || '1st Year',
          batch: localDoc.batch,
          bio: localDoc.bio,
          socialLinks: localDoc.socialLinks,
          xp: xpVal,
          academicXP: xpVal,
          gamesPlayed: localDoc.gamesPlayed,
          infiniteTraceStreak: localDoc.infiniteTraceStreak,
          role: localDoc.role,
          isSetupComplete: localDoc.isSetupComplete,
          createdAt: localDoc.createdAt,
        };
        setUserProfile(profile);
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {}
        return profile;
      }
    } catch (err) {
      console.error('[AVENIR ARENA FIRESTORE] Error reading user profile:', err);
    }
    return null;
  };

  // Restore authenticated session and listen to Firebase Auth in the background
  useEffect(() => {
    let isMounted = true;

    // Immediately bind traceEngine to authenticated student if present
    const activeUid = currentUser?.uid || getInitialStoredUser()?.uid;
    if (activeUid) {
      traceEngine.setActiveStudent(activeUid);
      // Non-blocking background revalidation (Stale-While-Revalidate)
      syncProfileFromFirestore(activeUid).catch(() => {});
    }

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        const user: User = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Google Cadet',
          email: fbUser.email || '',
          photoURL:
            fbUser.photoURL ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setCurrentUser(user);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } catch {}
        traceEngine.setActiveStudent(user.uid);
        // Non-blocking background revalidation
        syncProfileFromFirestore(user.uid).catch(() => {});
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearError = () => setError(null);

  /**
   * Save session, upsert user in Firestore, and bind Infinite Trace
   */
  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }

    traceEngine.setActiveStudent(user.uid);
    setIsAuthModalOpen(false);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data();
        // Save user's uid, displayName, photoURL, email, campus to Firestore users collection
        // CRITICAL: Do NOT overwrite existing academicXP or infiniteTraceStreak
        await setDoc(
          userRef,
          {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            campus: existingData.campus || 'MSOT Ghaziabad',
          },
          { merge: true }
        );

        const xpVal = Number(existingData.academicXP ?? existingData.xp ?? 0);
        const streakVal = Number(existingData.infiniteTraceStreak ?? 0);

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          username: existingData.username || user.displayName,
          firstName: existingData.firstName || '',
          lastName: existingData.lastName || '',
          avatarUrl: existingData.avatarUrl || user.photoURL,
          campus: existingData.campus || 'MSOT Ghaziabad',
          year: existingData.year || '1st Year',
          batch: existingData.batch || '2025-2029',
          bio: existingData.bio || 'Cadet in AVENIR ARENA.',
          xp: xpVal,
          academicXP: xpVal,
          gamesPlayed: existingData.gamesPlayed ?? 0,
          infiniteTraceStreak: streakVal,
          socialLinks: existingData.socialLinks || { linkedin: '', other: '' },
          role: existingData.role || (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'cadet'),
          isSetupComplete: Boolean(existingData.isSetupComplete),
          createdAt: existingData.createdAt || new Date().toISOString(),
        };

        setUserProfile(profile);
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {
          // Ignore
        }
      } else {
        // Initialize new player document with academicXP: 0 and infiniteTraceStreak: 0
        const isUserAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const initialData = {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          campus: 'MSOT Ghaziabad',
          username: user.displayName || '',
          firstName: '',
          lastName: '',
          avatarUrl: user.photoURL,
          year: '1st Year',
          batch: '2025-2029',
          bio: 'First-year cadet in AVENIR ARENA.',
          xp: 0,
          academicXP: 0,
          gamesPlayed: 0,
          infiniteTraceStreak: 0,
          socialLinks: { linkedin: '', other: '' },
          role: isUserAdmin ? 'admin' : 'cadet',
          isSetupComplete: false,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, initialData, { merge: true });
        setUserProfile(initialData as UserProfile);
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initialData));
        } catch {
          // Ignore
        }
      }
    } catch (firestoreErr) {
      console.error('[AVENIR ARENA AUTH] Firestore upsert on login error:', firestoreErr);
      await syncProfileFromFirestore(user.uid);
    }
  };

  /**
   * Handle @react-oauth/google success credential response
   */
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError('Login cancelled. Try again.');
        return;
      }

      // Decode received JWT credential using jwt-decode
      const payload = jwtDecode<GoogleTokenPayload>(credentialResponse.credential);

      if (!payload || !payload.sub) {
        setError('Invalid token response received from Google.');
        return;
      }

      const user: User = {
        uid: `google-${payload.sub}`,
        displayName: payload.name || 'Google User',
        email: payload.email || '',
        photoURL:
          payload.picture ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        token: credentialResponse.credential,
      };

      await handleAuthSuccess(user);
    } catch (err) {
      console.error('[AVENIR ARENA AUTH] Failed to decode Google JWT token:', err);
      setError('Login cancelled. Try again.');
    }
  };

  /**
   * Handle @react-oauth/google error callback
   */
  const handleGoogleError = () => {
    setError('Login cancelled. Try again.');
  };

  /**
   * Programmatic Google Login trigger
   * Attempts Firebase Modular signInWithPopup first; gracefully falls back to Google GSI AuthModal
   */
  const loginWithGoogle = async (): Promise<void> => {
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res && res.user) {
        const user: User = {
          uid: res.user.uid,
          displayName: res.user.displayName || 'Google Cadet',
          email: res.user.email || '',
          photoURL:
            res.user.photoURL ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        await handleAuthSuccess(user);
        return;
      }
    } catch (popupErr: any) {
      console.warn('[AVENIR ARENA AUTH] Firebase popup flow deferred or cancelled, launching modal fallback:', popupErr);
      if (popupErr?.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Try again.');
        return;
      }
    }

    openAuthModal();
  };

  /**
   * Save completed User Profile directly to Firestore
   */
  const saveUserProfile = async (profileData: Omit<UserProfile, 'isSetupComplete'>) => {
    if (!currentUser) return;

    const isUserAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const effectiveXP = typeof profileData.academicXP === 'number'
      ? profileData.academicXP
      : (typeof profileData.xp === 'number' ? profileData.xp : (userProfile?.academicXP ?? userProfile?.xp ?? 0));

    const userRef = doc(db, 'users', currentUser.uid);
    const updatedPayload = {
      ...profileData,
      socialLinks: {
        linkedin: profileData.socialLinks?.linkedin || '',
        other: profileData.socialLinks?.other || '',
      },
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: profileData.username || currentUser.displayName,
      photoURL: profileData.avatarUrl || currentUser.photoURL,
      role: isUserAdmin ? 'admin' : (userProfile?.role || 'cadet'),
      isSetupComplete: true,
      xp: effectiveXP,
      academicXP: effectiveXP,
      gamesPlayed: userProfile?.gamesPlayed ?? 0,
      infiniteTraceStreak: userProfile?.infiniteTraceStreak ?? 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(userRef, updatedPayload, { merge: true });
    } catch (e) {
      console.error('[AVENIR ARENA AUTH] Failed to save profile to Firestore:', e);
    }

    // Persist to offline resilient storage
    await firestoreService.setUserDoc(currentUser.uid, updatedPayload as any);

    const updatedProfile: UserProfile = {
      ...updatedPayload,
      year: updatedPayload.year || '1st Year',
    };

    setUserProfile(updatedProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // Ignore
    }

    // Sync username & avatar into currentUser for global nav consistency
    const updatedUser: User = {
      ...currentUser,
      displayName: updatedProfile.username || currentUser.displayName,
      photoURL: updatedProfile.avatarUrl || currentUser.photoURL,
    };
    setCurrentUser(updatedUser);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch {
      // Ignore
    }
  };

  /**
   * Increment or decrement user XP in real-time Firestore
   */
  const updateUserXP = async (delta: number): Promise<void> => {
    if (!currentUser) return;
    const currentXP = userProfile?.academicXP ?? userProfile?.xp ?? 0;
    const newXP = Math.max(0, currentXP + delta);
    const newGamesPlayed = (userProfile?.gamesPlayed || 0) + 1;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          xp: newXP,
          academicXP: newXP,
          gamesPlayed: newGamesPlayed,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('[AVENIR ARENA AUTH] Failed to update XP in Firestore:', e);
    }

    await firestoreService.updateUserDoc(currentUser.uid, {
      xp: newXP,
      gamesPlayed: newGamesPlayed,
    });

    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, xp: newXP, academicXP: newXP, gamesPlayed: newGamesPlayed };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  /**
   * Re-fetch the current user's profile from Firestore
   */
  const refreshProfile = async (): Promise<void> => {
    if (currentUser?.uid) {
      await syncProfileFromFirestore(currentUser.uid);
    }
  };

  /**
   * Log out current user and clear session from memory & storage
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      sessionStorage.removeItem('avenir_admin_session');
      sessionStorage.removeItem('avenir_admin_email');
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    traceEngine.setActiveStudent('');
  };

  // Role-Based Access Control (RBAC): Admin check
  const isAdmin = Boolean(
    currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin'
  );

  // Flag determining whether mandatory first-time onboarding modal should be displayed
  const isOnboardingRequired = Boolean(currentUser && (!userProfile || !userProfile.isSetupComplete));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isLoading,
        isOnboardingRequired,
        error,
        isAuthModalOpen,
        handleGoogleSuccess,
        handleGoogleError,
        loginWithGoogle,
        saveUserProfile,
        updateUserXP,
        refreshProfile,
        logout,
        openAuthModal,
        closeAuthModal,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
