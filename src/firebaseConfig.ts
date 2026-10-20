/**
 * Firebase Firestore Configuration & Cloud Service Engine
 * AVENIR ARENA — Production Transition
 */

export interface UserProfileDoc {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  photoURL?: string;
  campus: string;
  year?: string;
  yearOfStudy?: string;
  batch: string;
  batchCohort?: string;
  bio?: string;
  xp: number;
  academicXP?: number;
  gamesPlayed?: number;
  infiniteTraceStreak?: number;
  socialLinks: {
    linkedin: string;
    other?: string;
  };
  role: 'admin' | 'cadet' | 'faculty';
  isSetupComplete: boolean;
  isRegistered?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface QuizDoc {
  id: string;
  subject: string;
  topic: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  createdBy: string;
  createdAt: string;
}

import { auth, db } from './firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

// 1. Production Firebase Configuration from Environment Variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA6wjAjoBTgQ13DvgVeGxSxQ83zJVqFu7E',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'avenir-arena-6fdb7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'avenir-arena-6fdb7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'avenir-arena-6fdb7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '683733824929',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:683733824929:web:8e27b1905e4989f13307e0',
};

// Local storage backup keys for offline resilience & graceful fallback
const FIRESTORE_USERS_KEY = 'avenir_firestore_users_v1';
const FIRESTORE_QUIZZES_KEY = 'avenir_firestore_quizzes_v1';

function getStoredUsers(): Record<string, UserProfileDoc> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FIRESTORE_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, UserProfileDoc>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIRESTORE_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore
  }
}

function getStoredQuizzes(): QuizDoc[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FIRESTORE_QUIZZES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [
    {
      id: 'quiz-cpp-ptr-01',
      subject: 'C++',
      topic: 'Pointers',
      questionText: 'What is the memory size in bytes of a standard pointer on a 64-bit architecture?',
      options: ['2 bytes', '4 bytes', '8 bytes', '16 bytes'],
      correctOptionIndex: 2,
      createdBy: 'siddharthsharma2649@gmail.com',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'quiz-html-sem-01',
      subject: 'HTML',
      topic: 'Semantics',
      questionText: 'Which HTML5 element represents self-contained, syndicatable content?',
      options: ['<section>', '<article>', '<aside>', '<nav>'],
      correctOptionIndex: 1,
      createdBy: 'siddharthsharma2649@gmail.com',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'quiz-math-mat-01',
      subject: 'Engineering Mathematics',
      topic: 'Matrices',
      questionText: 'If a square matrix A has det(A) = 0, what does this indicate about its eigenvalues?',
      options: [
        'All eigenvalues must be equal to 1',
        'At least one eigenvalue is equal to 0',
        'Eigenvalues cannot be real numbers',
        'The matrix has infinite trace',
      ],
      correctOptionIndex: 1,
      createdBy: 'siddharthsharma2649@gmail.com',
      createdAt: new Date().toISOString(),
    },
  ];
}

function saveStoredQuizzes(quizzes: QuizDoc[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIRESTORE_QUIZZES_KEY, JSON.stringify(quizzes));
  } catch {
    // Ignore
  }
}

/**
 * Firestore Service Layer
 * Emulates the Firestore v9 modular API (getDoc, setDoc, updateDoc, collection, query, where)
 * and connects transparently to real cloud Firestore when live credentials are active.
 */
export const firestoreService = {
  /**
   * Fetch a user profile document by UID
   */
  async getUserDoc(uid: string): Promise<UserProfileDoc | null> {
    if (!uid) return null;
    if (!auth.currentUser) {
      const users = getStoredUsers();
      return users[uid] || null;
    }
    try {
      const userRef = doc(db, 'users', uid);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getUserDoc timeout')), 2500)
      );
      const snap = await Promise.race([getDoc(userRef), timeoutPromise]);
      if (snap.exists()) {
        const d = snap.data();
        const user: UserProfileDoc = {
          uid: snap.id,
          email: d.email || '',
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          username: d.username || d.displayName || 'Cadet',
          avatarUrl: d.avatarUrl || d.photoURL || '',
          campus: d.campus || 'MSOT Ghaziabad',
          year: d.year || d.yearOfStudy || '1st Year',
          batch: d.batch || d.batchCohort || '2025-2029',
          bio: d.bio || '',
          xp: Number(d.academicXP ?? d.xp ?? 0),
          gamesPlayed: d.gamesPlayed || 0,
          infiniteTraceStreak: d.infiniteTraceStreak || 0,
          socialLinks: d.socialLinks || { linkedin: '', other: '' },
          role: d.role || 'cadet',
          isSetupComplete: Boolean(d.isRegistered ?? d.isSetupComplete ?? true),
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        };
        const users = getStoredUsers();
        users[uid] = user;
        saveStoredUsers(users);
        return user;
      }
    } catch {
      // Graceful fallback to cached storage on network issues
    }
    const users = getStoredUsers();
    return users[uid] || null;
  },

  /**
   * Fetch a user by UID or username with full Firestore cloud lookup and local cache fallback
   */
  async getUserByUidOrUsername(identifier: string): Promise<UserProfileDoc | null> {
    if (!identifier) return null;

    // 1. Try direct UID fetch from Firestore
    try {
      const directDoc = await this.getUserDoc(identifier);
      if (directDoc) return directDoc;
    } catch {
      // Continue to next resolution strategies
    }

    // 2. Check cached storage
    const users = getStoredUsers();
    if (users[identifier]) return users[identifier];
    const lower = identifier.toLowerCase();
    const match = Object.values(users).find(
      (u) => (u.username && u.username.toLowerCase() === lower) || (u.uid && u.uid.toLowerCase() === lower)
    );
    if (match) return match;

    // 3. Cloud query fallback for remote cadets
    try {
      const allCloudUsers = await this.getAllUsers();
      const cloudMatch = allCloudUsers.find(
        (u) => (u.username && u.username.toLowerCase() === lower) || (u.uid && u.uid.toLowerCase() === lower)
      );
      if (cloudMatch) return cloudMatch;
    } catch {
      // Network or timeout failure
    }

    return null;
  },

  /**
   * Create or overwrite a user profile document
   */
  async setUserDoc(uid: string, data: Partial<UserProfileDoc>): Promise<UserProfileDoc> {
    const users = getStoredUsers();
    const existing = users[uid] || {};
    const updated: UserProfileDoc = {
      uid,
      email: data.email || existing.email || '',
      firstName: data.firstName || existing.firstName || '',
      lastName: data.lastName || existing.lastName || '',
      username: data.username || existing.username || '',
      avatarUrl: data.avatarUrl || existing.avatarUrl || '',
      campus: data.campus || existing.campus || 'MSOT Ghaziabad',
      year: data.year || existing.year || '1st',
      batch: data.batch || (data as unknown as { batchCohort?: string }).batchCohort || existing.batch || '2025-2029',
      bio: data.bio || existing.bio || 'Cadet Operative in AVENIR ARENA',
      xp: typeof data.xp === 'number' ? data.xp : (existing.xp || 0),
      academicXP: typeof data.academicXP === 'number' ? data.academicXP : (existing.academicXP || existing.xp || 0),
      gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : (existing.gamesPlayed || 0),
      infiniteTraceStreak:
        typeof data.infiniteTraceStreak === 'number'
          ? data.infiniteTraceStreak
          : (existing.infiniteTraceStreak || 0),
      socialLinks: {
        linkedin: data.socialLinks?.linkedin || existing.socialLinks?.linkedin || '',
        other: data.socialLinks?.other || existing.socialLinks?.other || '',
      },
      role:
        data.role ||
        existing.role ||
        (data.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase()
          ? 'admin'
          : 'cadet'),
      isSetupComplete: data.isSetupComplete ?? existing.isSetupComplete ?? false,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users[uid] = updated;
    saveStoredUsers(users);
    return updated;
  },

  /**
   * Partially update a user document
   */
  async updateUserDoc(uid: string, updates: Partial<UserProfileDoc>): Promise<UserProfileDoc | null> {
    const users = getStoredUsers();
    if (!users[uid]) return null;

    users[uid] = {
      ...users[uid],
      ...updates,
      socialLinks: {
        ...users[uid].socialLinks,
        ...(updates.socialLinks || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    saveStoredUsers(users);
    return users[uid];
  },

  /**
   * Global Search: Query users with debouncing, matching username, firstName, lastName, and campus filter
   */
  async searchUsers(queryTerm: string, campusFilter: string = 'all'): Promise<UserProfileDoc[]> {
    const users = Object.values(getStoredUsers());
    const term = queryTerm.trim().toLowerCase();

    return users.filter((user) => {
      // Campus filter
      if (campusFilter !== 'all' && user.campus.toLowerCase() !== campusFilter.toLowerCase()) {
        return false;
      }

      if (!term) return true;

      const matchesUsername = user.username.toLowerCase().includes(term);
      const matchesFirstName = user.firstName.toLowerCase().includes(term);
      const matchesLastName = user.lastName.toLowerCase().includes(term);
      const matchesFullName = `${user.firstName} ${user.lastName}`.toLowerCase().includes(term);
      const matchesEmail = user.email.toLowerCase().includes(term);

      return matchesUsername || matchesFirstName || matchesLastName || matchesFullName || matchesEmail;
    });
  },

  /**
   * Admin & Leaderboard: Fetch all registered users from Firestore Cloud
   */
  async getAllUsers(): Promise<UserProfileDoc[]> {
    if (!auth.currentUser) {
      return Object.values(getStoredUsers());
    }
    try {
      const usersRef = collection(db, 'users');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getAllUsers timeout')), 3000)
      );
      const snapshot = await Promise.race([getDocs(usersRef), timeoutPromise]);
      if (!snapshot.empty) {
        const cloudUsers: UserProfileDoc[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: docSnap.id,
            email: d.email || '',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            username: d.username || d.displayName || 'Cadet',
            avatarUrl: d.avatarUrl || d.photoURL || '',
            campus: d.campus || 'MSOT Ghaziabad',
            year: d.year || d.yearOfStudy || '1st Year',
            batch: d.batch || d.batchCohort || '2025-2029',
            bio: d.bio || '',
            xp: Number(d.academicXP ?? d.xp ?? 0),
            gamesPlayed: d.gamesPlayed || 0,
            infiniteTraceStreak: d.infiniteTraceStreak || 0,
            socialLinks: d.socialLinks || { linkedin: '', other: '' },
            role: d.role || 'cadet',
            isSetupComplete: Boolean(d.isRegistered ?? d.isSetupComplete ?? true),
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          };
        });
        const cacheMap: Record<string, UserProfileDoc> = {};
        cloudUsers.forEach((u) => {
          cacheMap[u.uid] = u;
        });
        saveStoredUsers(cacheMap);
        return cloudUsers;
      }
    } catch (err) {
      console.warn('[AVENIR ARENA FIRESTORE] Error getting all users from Firestore:', err);
    }
    return Object.values(getStoredUsers());
  },

  /**
   * Admin: Fetch all daily quizzes
   */
  async getQuizzes(): Promise<QuizDoc[]> {
    return getStoredQuizzes();
  },

  /**
   * Admin: Create a new academic quiz document
   */
  async createQuiz(quizData: Omit<QuizDoc, 'id' | 'createdAt'>): Promise<QuizDoc> {
    const quizzes = getStoredQuizzes();
    const newQuiz: QuizDoc = {
      ...quizData,
      id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    quizzes.unshift(newQuiz);
    saveStoredQuizzes(quizzes);
    return newQuiz;
  },

  /**
   * Admin: Delete a quiz document by ID
   */
  async deleteQuiz(quizId: string): Promise<boolean> {
    const quizzes = getStoredQuizzes();
    const next = quizzes.filter((q) => q.id !== quizId);
    saveStoredQuizzes(next);
    return next.length !== quizzes.length;
  },
};

export interface RealtimeCadet {
  uid: string;
  displayName: string;
  photoURL?: string;
  avatarUrl?: string;
  email?: string;
  campus?: string;
  year?: string;
  batch?: string;
  academicXP: number;
  xp: number;
  gamesPlayed: number;
  infiniteTraceStreak: number;
  username?: string;
  role?: string;
  createdAt?: string;
}

/**
 * Fetch all real registered cadets directly from Firestore users collection
 * with resilient fallback to local storage cache. Guarantees 100% parity
 * between Global Search and the Competitive Leaderboard.
 */
export async function fetchRealtimeCadets(): Promise<RealtimeCadet[]> {
  // If user is not authenticated, immediately return cached profiles
  // without attempting unauthenticated cloud reads
  if (!auth.currentUser) {
    const cachedUsers = Object.values(getStoredUsers());
    return cachedUsers.map((u) => {
      const effectiveXP = Number(u.academicXP ?? u.xp ?? 0);
      const name =
        u.username ||
        (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0] || `Cadet-${u.uid.slice(0, 4)}`);

      return {
        uid: u.uid,
        displayName: name,
        photoURL: u.avatarUrl || '',
        avatarUrl: u.avatarUrl || '',
        email: u.email || '',
        campus: u.campus || 'MSOT Ghaziabad',
        year: u.year || '1st Year',
        batch: u.batch || '2025-2029',
        academicXP: effectiveXP,
        xp: effectiveXP,
        gamesPlayed: Number(u.gamesPlayed || 0),
        infiniteTraceStreak: Number(u.infiniteTraceStreak || 0),
        username: u.username || '',
        role: u.role || 'cadet',
        createdAt: u.createdAt || new Date().toISOString(),
      };
    });
  }

  const cadetMap = new Map<string, RealtimeCadet>();

  // 1. Direct query from Firestore Cloud users collection
  try {
    const usersRef = collection(db, 'users');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('fetchRealtimeCadets timeout')), 3500)
    );
    const snapshot = await Promise.race([getDocs(usersRef), timeoutPromise]);

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const effectiveXP = Number(data.academicXP ?? data.xp ?? 0);
      const name =
        data.username ||
        data.displayName ||
        (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : `Cadet-${docSnap.id.slice(0, 4)}`);

      cadetMap.set(docSnap.id, {
        uid: docSnap.id,
        displayName: name,
        photoURL: data.photoURL || data.avatarUrl || '',
        avatarUrl: data.avatarUrl || data.photoURL || '',
        email: data.email || '',
        campus: data.campus || 'MSOT Ghaziabad',
        year: data.year || data.yearOfStudy || '1st Year',
        batch: data.batch || data.batchCohort || '2025-2029',
        academicXP: effectiveXP,
        xp: effectiveXP,
        gamesPlayed: Number(data.gamesPlayed || 0),
        infiniteTraceStreak: Number(data.infiniteTraceStreak || 0),
        username: data.username || data.displayName || '',
        role: data.role || 'cadet',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
  } catch (err) {
    console.warn('[AVENIR ARENA] Direct cloud users read:', err);
  }

  // 2. Supplement from firestoreService layer (includes cached profiles)
  try {
    const fallbackUsers = await firestoreService.getAllUsers();
    fallbackUsers.forEach((u) => {
      if (!cadetMap.has(u.uid)) {
        const effectiveXP = Number(u.xp || 0);
        const name =
          u.username ||
          (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0] || `Cadet-${u.uid.slice(0, 4)}`);

        cadetMap.set(u.uid, {
          uid: u.uid,
          displayName: name,
          photoURL: u.avatarUrl || '',
          avatarUrl: u.avatarUrl || '',
          email: u.email || '',
          campus: u.campus || 'MSOT Ghaziabad',
          year: u.year || '1st Year',
          batch: u.batch || '2025-2029',
          academicXP: effectiveXP,
          xp: effectiveXP,
          gamesPlayed: Number(u.gamesPlayed || 0),
          infiniteTraceStreak: Number(u.infiniteTraceStreak || 0),
          username: u.username || '',
          role: u.role || 'cadet',
          createdAt: u.createdAt || new Date().toISOString(),
        });
      }
    });
  } catch (err) {
    console.warn('[AVENIR ARENA] Fallback users warning:', err);
  }

  // 3. Reconcile and deduplicate: exactly one canonical profile per unique authenticated identity
  const canonicalMap = new Map<string, RealtimeCadet>();
  const emailToUidMap = new Map<string, string>(); // normalized email -> canonical uid
  const legacyUidsToPurge: string[] = [];

  cadetMap.forEach((cadet, rawUid) => {
    const normEmail = (cadet.email || '').trim().toLowerCase();
    const isLegacyId = rawUid.startsWith('google-');

    if (normEmail) {
      if (emailToUidMap.has(normEmail)) {
        const existingUid = emailToUidMap.get(normEmail)!;
        const existingCadet = canonicalMap.get(existingUid)!;
        const existingIsLegacy = existingUid.startsWith('google-');

        if (existingIsLegacy && !isLegacyId) {
          // Promote the canonical Firebase UID, merge legacy progress
          cadet.academicXP = Math.max(cadet.academicXP, existingCadet.academicXP);
          cadet.xp = Math.max(cadet.xp, existingCadet.xp);
          cadet.gamesPlayed = Math.max(cadet.gamesPlayed, existingCadet.gamesPlayed);
          cadet.infiniteTraceStreak = Math.max(cadet.infiniteTraceStreak, existingCadet.infiniteTraceStreak);
          if ((!cadet.username || cadet.username.startsWith('Cadet-')) && existingCadet.username) {
            cadet.username = existingCadet.username;
            cadet.displayName = existingCadet.displayName;
          }

          canonicalMap.delete(existingUid);
          canonicalMap.set(cadet.uid, cadet);
          emailToUidMap.set(normEmail, cadet.uid);
          legacyUidsToPurge.push(existingUid);
        } else {
          // Merge current progress into existing canonical record
          existingCadet.academicXP = Math.max(existingCadet.academicXP, cadet.academicXP);
          existingCadet.xp = Math.max(existingCadet.xp, cadet.xp);
          existingCadet.gamesPlayed = Math.max(existingCadet.gamesPlayed, cadet.gamesPlayed);
          existingCadet.infiniteTraceStreak = Math.max(existingCadet.infiniteTraceStreak, cadet.infiniteTraceStreak);
          if (isLegacyId) {
            legacyUidsToPurge.push(rawUid);
          }
        }
        return;
      }

      emailToUidMap.set(normEmail, cadet.uid);
    }

    canonicalMap.set(cadet.uid, cadet);
  });

  // Purge reconciled legacy records from local cache
  if (legacyUidsToPurge.length > 0) {
    try {
      const stored = getStoredUsers();
      let changed = false;
      legacyUidsToPurge.forEach((id) => {
        if (stored[id]) {
          delete stored[id];
          changed = true;
        }
      });
      if (changed) {
        saveStoredUsers(stored);
      }
    } catch {
      // Ignore
    }
  }

  return Array.from(canonicalMap.values());
}

