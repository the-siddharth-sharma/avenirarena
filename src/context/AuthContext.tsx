import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { CredentialResponse } from '@react-oauth/google';
import { traceEngine } from '@/engine/infiniteTrace';
import { firestoreService } from '@/firebaseConfig';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import {
  signInWithPopup,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
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

interface FirestoreUserDocData {
  uid?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  photoURL?: string;
  campus?: string;
  year?: string;
  yearOfStudy?: string;
  batch?: string;
  batchCohort?: string;
  bio?: string;
  socialLinks?: UserSocialLinks;
  xp?: number;
  academicXP?: number;
  gamesPlayed?: number;
  infiniteTraceStreak?: number;
  role?: 'admin' | 'cadet';
  isRegistered?: boolean;
  isSetupComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  loading: boolean;
  isLoading: boolean;
  isOnboardingRequired: boolean;
  needsRegistration: boolean;
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
    const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authStored) return null;
    const currentStoredUser = JSON.parse(authStored);
    if (!currentStoredUser?.uid) return null;

    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid === currentStoredUser.uid) {
        return parsed;
      }
      // If cached profile belongs to a previous/different user account, evict it!
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }

    const localUsers = JSON.parse(localStorage.getItem('avenir_firestore_users_v1') || '{}');
    if (localUsers[currentStoredUser.uid]) {
      const doc = localUsers[currentStoredUser.uid];
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
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous cache hydration ensures instantaneous render latency on page reload
  const initialUser = getInitialStoredUser();
  const initialProfile = getInitialStoredProfile();
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile);
  // Dedicated loading state: App boots with loading === true while Firebase asynchronously resolves session
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsRegistration, setNeedsRegistration] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('avenir_needs_registration') === 'true';
  });
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const isLoggingInRef = useRef<boolean>(false);
  const processingUidRef = useRef<string | null>(null);
  const authResolvedRef = useRef<boolean>(false);

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
            isSetupComplete: Boolean(docData.isRegistered ?? docData.isSetupComplete ?? true),
            createdAt: docData.createdAt || new Date().toISOString(),
          };
          setUserProfile(profile);
          setNeedsRegistration(false);
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            localStorage.removeItem('avenir_needs_registration');
          } catch {
            // Ignore storage quota errors
          }
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
        } catch {
          // Ignore storage quota errors
        }
        return profile;
      }
    } catch (err) {
      console.error('[AVENIR ARENA FIRESTORE] Error reading user profile:', err);
    }
    return null;
  };

  /**
   * Authoritative Firebase Auth Resolution Handler
   * Atomically checks Firestore /users/{uid}, updates profile and registration state,
   * eliminates race conditions, and directs user to /dashboard or OnboardingModal.
   */
  const processAuthenticatedUser = async (
    fbUser: FirebaseUser | User,
    forceCheck: boolean = false
  ): Promise<void> => {
    if (!fbUser || !fbUser.uid) return;

    // Prevent concurrent duplicate executions for the same user unless forced
    if (
      !forceCheck &&
      processingUidRef.current === fbUser.uid &&
      currentUser?.uid === fbUser.uid &&
      userProfile
    ) {
      setLoading(false);
      setIsLoading(false);
      return;
    }
    processingUidRef.current = fbUser.uid;
    setLoading(true);
    setIsLoading(true);

    const user: User = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || 'Google Cadet',
      email: fbUser.email || '',
      photoURL:
        fbUser.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ...(('token' in fbUser && fbUser.token) ? { token: fbUser.token } : {}),
    };

    traceEngine.setActiveStudent(user.uid);
    setIsAuthModalOpen(false);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      let docData: FirestoreUserDocData | null = null;
      let docExists = false;

      try {
        const timeoutReadPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore read timeout')), 4000)
        );
        const docSnap = await Promise.race([getDoc(userRef), timeoutReadPromise]);
        docExists = docSnap.exists();
        if (docExists) {
          docData = docSnap.data() as FirestoreUserDocData;
        }
      } catch (firestoreErr) {
        console.warn('[AVENIR ARENA AUTH] Direct Firestore read fallback:', firestoreErr);
        try {
          const localDoc = await firestoreService.getUserDoc(user.uid);
          if (localDoc) {
            docExists = true;
            docData = localDoc as unknown as FirestoreUserDocData;
          }
        } catch {
          // Ignore service read error
        }
      }

      const isCadetRegistered = Boolean(
        docExists &&
        docData &&
        (docData.isRegistered === true ||
         docData.isSetupComplete === true ||
         (docData.campus && (docData.username || docData.firstName)))
      );

      if (!docExists || !docData || !isCadetRegistered) {
        // 1. New user or incomplete registration: Route to Registration Terminal (OnboardingModal)
        setCurrentUser(user);
        setUserProfile(null);
        setNeedsRegistration(true);

        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.setItem('avenir_needs_registration', 'true');
        } catch {
          // Ignore storage error
        }
      } else {
        // 2. Returning user: Hydrate user profile into state & route straight to /dashboard
        const existingData = docData;
        const xpVal = Number(existingData.academicXP ?? existingData.xp ?? 0);
        const streakVal = Number(existingData.infiniteTraceStreak ?? 0);
        const isUserAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          username: existingData.username || user.displayName,
          firstName: existingData.firstName || '',
          lastName: existingData.lastName || '',
          avatarUrl: existingData.avatarUrl || user.photoURL,
          campus: existingData.campus || 'MSOT Ghaziabad',
          year: existingData.year || existingData.yearOfStudy || '1st Year',
          batch: existingData.batch || existingData.batchCohort || '2025-2029',
          bio: existingData.bio || 'Cadet in AVENIR ARENA.',
          xp: xpVal,
          academicXP: xpVal,
          gamesPlayed: existingData.gamesPlayed ?? 0,
          infiniteTraceStreak: streakVal,
          socialLinks: existingData.socialLinks || { linkedin: '', other: '' },
          role: existingData.role || (isUserAdmin ? 'admin' : 'cadet'),
          isSetupComplete: true,
          createdAt: existingData.createdAt || new Date().toISOString(),
        };

        setCurrentUser(user);
        setUserProfile(profile);
        setNeedsRegistration(false);

        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
          localStorage.removeItem('avenir_needs_registration');
        } catch {
          // Ignore storage error
        }

        // Route returning cadet directly to /dashboard if currently on landing/login/root
        if (typeof window !== 'undefined') {
          const currentHash = window.location.hash.replace(/^#/, '').split('?')[0];
          if (!currentHash || currentHash === '/' || currentHash === '/login' || currentHash === '/auth') {
            window.location.hash = '/dashboard';
          }
        }
      }
    } catch (err) {
      console.error('[AVENIR ARENA AUTH] User processing error:', err);
      setCurrentUser(user);
      setNeedsRegistration(true);
    } finally {
      processingUidRef.current = null;
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Restore authenticated session and listen to Firebase Auth in the background
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure loading is never permanently stuck if network/auth hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted && !authResolvedRef.current) {
        console.warn('[AVENIR ARENA AUTH] Auth resolution timeout reached; unblocking loading state.');
        authResolvedRef.current = true;
        setLoading(false);
        setIsLoading(false);
      }
    }, 4000);

    // Immediately bind traceEngine to authenticated student if present
    const activeUid = currentUser?.uid || initialUser?.uid;
    if (activeUid) {
      traceEngine.setActiveStudent(activeUid);
      syncProfileFromFirestore(activeUid).catch(() => {});
    }

    // Check for pending redirect result (handles redirect OAuth flow if present)
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted) return;
        if (result && result.user) {
          authResolvedRef.current = true;
          await processAuthenticatedUser(result.user, true);
        }
      })
      .catch((err) => {
        console.warn('[AVENIR ARENA AUTH] getRedirectResult check:', err);
      });

    // Listen to Firebase Auth state changes for persistent session across page reloads
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      authResolvedRef.current = true;
      clearTimeout(safetyTimer);

      if (fbUser) {
        await processAuthenticatedUser(fbUser);
      } else {
        // Prevent clearing state if user is currently interacting with the Google popup flow
        if (isLoggingInRef.current) return;

        setCurrentUser(null);
        setUserProfile(null);
        setNeedsRegistration(false);
        setLoading(false);
        setIsLoading(false);

        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.removeItem('avenir_needs_registration');
        } catch {
          // Ignore storage errors on logout
        }
        traceEngine.setActiveStudent('');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const openAuthModal = () => {
    loginWithGoogle();
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearError = () => setError(null);

  /**
   * Handle @react-oauth/google success credential response
   */
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError('Login cancelled. Try again.');
        return;
      }

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

      await processAuthenticatedUser(user);
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
   * Refactored to use standard Firebase signInWithPopup(auth, googleProvider) with robust error catching.
   * Immediately after successful sign-in, performs a strict lookup in Firestore (doc(db, 'users', user.uid)).
   * If the user document exists and has isRegistered: true (or isSetupComplete: true), hydrates profile and routes to /dashboard.
   * If user document does NOT exist or registration is incomplete, routes them to Registration Terminal (OnboardingModal).
   */
  const loginWithGoogle = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    setIsLoading(true);
    isLoggingInRef.current = true;

    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res && res.user) {
        await processAuthenticatedUser(res.user, true);
        return;
      }
    } catch (popupErr: unknown) {
      console.error('[AVENIR ARENA AUTH] Firebase signInWithPopup error:', popupErr);
      const err = popupErr as { code?: string; message?: string };
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again when ready.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Authentication popup was blocked by your browser. Please allow popups for this site.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored: superseded by concurrent request
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network error during authentication. Please check your internet connection.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add this deployment domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      } else {
        setError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      isLoggingInRef.current = false;
      setLoading(false);
      setIsLoading(false);
    }
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
      isRegistered: true,
      isSetupComplete: true,
      xp: effectiveXP,
      academicXP: effectiveXP,
      gamesPlayed: userProfile?.gamesPlayed ?? 0,
      infiniteTraceStreak: userProfile?.infiniteTraceStreak ?? 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore write timeout')), 5000)
      );
      await Promise.race([
        setDoc(userRef, updatedPayload, { merge: true }),
        timeoutPromise,
      ]);
    } catch (e) {
      console.error('[AVENIR ARENA AUTH] Failed to save profile to Firestore:', e);
    }

    // Persist to offline resilient storage
    await firestoreService.setUserDoc(currentUser.uid, updatedPayload as unknown as Parameters<typeof firestoreService.setUserDoc>[1]);

    const updatedProfile: UserProfile = {
      ...updatedPayload,
      year: updatedPayload.year || '1st Year',
    };

    setUserProfile(updatedProfile);
    setNeedsRegistration(false);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      localStorage.removeItem('avenir_needs_registration');
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
   * Centralized XP Persistence:
   * Instantly updates local state for UI responsiveness,
   * then updates the user's academicXP in Firestore using atomic increment(xpEarned) in the background.
   */
  const updateUserXP = async (delta: number): Promise<void> => {
    if (!currentUser || delta === 0) return;

    // 1. Instantly update local state for immediate UI feedback
    setUserProfile((prev) => {
      if (!prev) return null;
      const currentXP = Number(prev.academicXP ?? prev.xp ?? 0);
      const newXP = Math.max(0, currentXP + delta);
      const newGamesPlayed = (prev.gamesPlayed || 0) + 1;
      const updated = {
        ...prev,
        xp: newXP,
        academicXP: newXP,
        gamesPlayed: newGamesPlayed,
      };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota
      }
      return updated;
    });

    // 2. Perform atomic increment in Firestore in the background
    (async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 5000)
        );
        await Promise.race([
          setDoc(
            userRef,
            {
              academicXP: increment(delta),
              xp: increment(delta),
              gamesPlayed: increment(1),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ),
          timeoutPromise,
        ]);

        firestoreService.getUserDoc(currentUser.uid).then((docData) => {
          if (docData) {
            const currentDocXP = Number(docData.academicXP ?? docData.xp ?? 0);
            firestoreService.updateUserDoc(currentUser.uid, {
              academicXP: currentDocXP + delta,
              xp: currentDocXP + delta,
              gamesPlayed: (docData.gamesPlayed || 0) + 1,
            });
          }
        }).catch(() => {});
      } catch (err) {
        console.error('[AVENIR ARENA AUTH] Background XP persistence error:', err);
      }
    })();
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
      localStorage.removeItem('avenir_needs_registration');
      sessionStorage.removeItem('avenir_admin_session');
      sessionStorage.removeItem('avenir_admin_email');
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    setNeedsRegistration(false);
    traceEngine.setActiveStudent('');
    window.location.hash = '/';
  };

  // Role-Based Access Control (RBAC): Admin check
  const isAdmin = Boolean(
    currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin'
  );

  // Flag determining whether mandatory first-time onboarding modal should be displayed
  const isOnboardingRequired = needsRegistration || Boolean(currentUser && userProfile && !userProfile.isSetupComplete);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        isLoading,
        isOnboardingRequired,
        needsRegistration,
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
