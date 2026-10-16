import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { CredentialResponse } from '@react-oauth/google';
import { traceEngine } from '@/engine/infiniteTrace';
import { firestoreService, type UserProfileDoc } from '@/firebaseConfig';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync profile directly from Firestore
  const syncProfileFromFirestore = async (uid: string): Promise<UserProfile | null> => {
    try {
      const doc = await firestoreService.getUserDoc(uid);
      if (doc) {
        const profile: UserProfile = {
          uid: doc.uid,
          email: doc.email,
          username: doc.username,
          firstName: doc.firstName,
          lastName: doc.lastName,
          avatarUrl: doc.avatarUrl,
          campus: doc.campus,
          year: doc.year || '1st',
          batch: doc.batch,
          bio: doc.bio,
          socialLinks: doc.socialLinks,
          xp: doc.xp,
          gamesPlayed: doc.gamesPlayed,
          infiniteTraceStreak: doc.infiniteTraceStreak,
          role: doc.role,
          isSetupComplete: doc.isSetupComplete,
          createdAt: doc.createdAt,
        };
        setUserProfile(profile);
        return profile;
      }
    } catch (err) {
      console.error('[AVENIR ARENA FIRESTORE] Error reading user profile:', err);
    }
    return null;
  };

  // Restore authenticated session on mount and validate token expiration
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const user: User = JSON.parse(stored);

          // Check if Google token has expired
          if (user && user.token) {
            try {
              const payload = jwtDecode<GoogleTokenPayload>(user.token);
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                console.warn('[AVENIR ARENA AUTH] Saved session token has expired. Logging out.');
                localStorage.removeItem(AUTH_STORAGE_KEY);
                if (isMounted) {
                  setCurrentUser(null);
                  setUserProfile(null);
                  traceEngine.setActiveStudent('');
                  setIsLoading(false);
                }
                return;
              }
            } catch {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              if (isMounted) {
                setCurrentUser(null);
                setUserProfile(null);
                traceEngine.setActiveStudent('');
                setIsLoading(false);
              }
              return;
            }
          }

          if (user && user.uid && isMounted) {
            setCurrentUser(user);
            traceEngine.setActiveStudent(user.uid);
            await syncProfileFromFirestore(user.uid);
          }
        }
      } catch (e) {
        console.error('[AVENIR ARENA AUTH] Session restore error:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearError = () => setError(null);

  /**
   * Save session and bind Infinite Trace to real Google UID, then query Firestore
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

    // Fetch existing user doc from Firestore
    const existingDoc = await syncProfileFromFirestore(user.uid);
    if (!existingDoc) {
      // Initialize blank slate document in Firestore for new player
      const isUserAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const newDoc = await firestoreService.setUserDoc(user.uid, {
        uid: user.uid,
        email: user.email,
        firstName: '',
        lastName: '',
        username: '',
        avatarUrl: user.photoURL,
        campus: 'Mirai Ghaziabad',
        year: '1st',
        batch: '2026-2030',
        bio: 'First-year cadet in AVENIR ARENA.',
        xp: 0,
        gamesPlayed: 0,
        infiniteTraceStreak: 0,
        socialLinks: { linkedin: '', other: '' },
        role: isUserAdmin ? 'admin' : 'cadet',
        isSetupComplete: false,
      });

      setUserProfile({
        ...newDoc,
        year: newDoc.year || '1st',
      });
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
   */
  const loginWithGoogle = async (): Promise<void> => {
    setError(null);
    openAuthModal();
  };

  /**
   * Save completed User Profile directly to Firestore
   */
  const saveUserProfile = async (profileData: Omit<UserProfile, 'isSetupComplete'>) => {
    if (!currentUser) return;

    const isUserAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Persist to real-time Firestore database
    const savedDoc = await firestoreService.setUserDoc(currentUser.uid, {
      ...profileData,
      socialLinks: {
        linkedin: profileData.socialLinks?.linkedin || '',
        other: profileData.socialLinks?.other || '',
      },
      uid: currentUser.uid,
      email: currentUser.email,
      role: isUserAdmin ? 'admin' : (userProfile?.role || 'cadet'),
      isSetupComplete: true,
      xp: typeof profileData.xp === 'number' ? profileData.xp : (userProfile?.xp ?? 0),
      gamesPlayed: userProfile?.gamesPlayed ?? 0,
      infiniteTraceStreak: userProfile?.infiniteTraceStreak ?? 0,
    });

    const updatedProfile: UserProfile = {
      ...savedDoc,
      year: savedDoc.year || '1st',
    };

    setUserProfile(updatedProfile);

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
    const currentXP = userProfile?.xp || 0;
    const newXP = Math.max(0, currentXP + delta);

    await firestoreService.updateUserDoc(currentUser.uid, {
      xp: newXP,
      gamesPlayed: (userProfile?.gamesPlayed || 0) + 1,
    });

    setUserProfile((prev) => (prev ? { ...prev, xp: newXP, gamesPlayed: (prev.gamesPlayed || 0) + 1 } : null));
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
      localStorage.removeItem(AUTH_STORAGE_KEY);
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
