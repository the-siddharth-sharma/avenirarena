import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { traceEngine } from '@/engine/infiniteTrace';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
  loginDemoUser: (customData?: Partial<User>) => void;
}

const AUTH_STORAGE_KEY = 'avenir-auth-user-v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse base64 URL-encoded JWT token without external library
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Google Identity Services types on window
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: unknown) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Restore authenticated session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user: User = JSON.parse(stored);
        if (user && user.uid) {
          setCurrentUser(user);
          // Key Infinite Trace to the authenticated Google UID
          traceEngine.setActiveStudent(user.uid);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      // Small simulated delay to prevent UI flickering on initial load
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearError = () => setError(null);

  // Save session and associate Infinite Trace
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }
    // Key Infinite Trace to real user UID
    traceEngine.setActiveStudent(user.uid);
    setIsAuthModalOpen(false);
    setError(null);
  };

  /**
   * Google Sign-In Flow
   * Uses import.meta.env.VITE_GOOGLE_CLIENT_ID with Google Identity Services (GIS).
   * If client ID is unconfigured or network is unreachable, provides clear diagnostics
   * and non-intrusive error toasts.
   */
  const loginWithGoogle = async (): Promise<void> => {
    setError(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Check if real Google Client ID is configured
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      console.warn(
        '[AVENIR ARENA AUTH] VITE_GOOGLE_CLIENT_ID is not configured in .env. Falling back to test Google account.'
      );
      // Instant fallback for live preview / local development
      loginDemoUser({
        uid: 'google-usr-' + Math.random().toString(36).substring(2, 9),
        displayName: 'Alex Vance',
        email: 'alex.vance@student.avenir.edu',
        photoURL:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      return;
    }

    // Google Identity Services (GIS) Client
    try {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        throw new Error('Google Identity Services library is not loaded.');
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential: string }) => {
          if (!response.credential) {
            setError('Authentication server unreachable. Please try again.');
            return;
          }

          const payload = parseJwtPayload(response.credential);
          if (payload && payload.sub) {
            const user: User = {
              uid: `google-${payload.sub}`,
              displayName: (payload.name as string) || 'Google User',
              email: (payload.email as string) || '',
              photoURL:
                (payload.picture as string) ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            };
            handleAuthSuccess(user);
          } else {
            setError('Failed to extract user profile from Google token.');
          }
        },
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification: unknown) => {
        // Handle prompt failures gracefully
        const n = notification as { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean };
        if (n?.isNotDisplayed?.() || n?.isSkippedMoment?.()) {
          console.warn('[AVENIR ARENA AUTH] Google One Tap dismissed or unavailable.');
        }
      });
    } catch (err) {
      console.error('[AVENIR ARENA AUTH] Google Sign-In error:', err);
      setError('Authentication server unreachable. Please try again.');
    }
  };

  /**
   * Fast Demo / Testing Google User Login
   */
  const loginDemoUser = (customData?: Partial<User>) => {
    const demoUser: User = {
      uid: customData?.uid || 'google-demo-1029482',
      displayName: customData?.displayName || 'Alex Vance',
      email: customData?.email || 'alex.vance@student.avenir.edu',
      photoURL:
        customData?.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    handleAuthSuccess(demoUser);
  };

  /**
   * Log out current user and clear sessions
   */
  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    traceEngine.setActiveStudent('');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        error,
        isAuthModalOpen,
        loginWithGoogle,
        logout,
        openAuthModal,
        closeAuthModal,
        clearError,
        loginDemoUser,
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
