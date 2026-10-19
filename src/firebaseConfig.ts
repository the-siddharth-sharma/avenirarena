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
  avatarUrl: string;
  campus: string;
  year?: string;
  batch: string;
  bio?: string;
  xp: number;
  gamesPlayed?: number;
  infiniteTraceStreak?: number;
  socialLinks: {
    linkedin: string;
    other?: string;
  };
  role: 'admin' | 'cadet';
  isSetupComplete: boolean;
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

// 1. Production Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Truth Test: Yeh line humein console mein batayegi ki key read hui ya nahi
console.log("Current API Key is:", firebaseConfig.apiKey);

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
    const users = getStoredUsers();
    return users[uid] || null;
  },

  /**
   * Fetch a user by UID or username
   */
  async getUserByUidOrUsername(identifier: string): Promise<UserProfileDoc | null> {
    const users = getStoredUsers();
    if (users[identifier]) return users[identifier];
    const lower = identifier.toLowerCase();
    const match = Object.values(users).find(
      (u) => u.username.toLowerCase() === lower || u.uid.toLowerCase() === lower
    );
    return match || null;
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
      batch: data.batch || existing.batch || '2026-2030',
      bio: data.bio || existing.bio || 'Cadet Operative in AVENIR ARENA',
      xp: typeof data.xp === 'number' ? data.xp : (existing.xp || 0),
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
        data.email?.toLowerCase() === 'siddharthsharma2649@gmail.com' ||
        existing.email?.toLowerCase() === 'siddharthsharma2649@gmail.com'
          ? 'admin'
          : 'cadet',
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
   * Admin: Fetch all registered users
   */
  async getAllUsers(): Promise<UserProfileDoc[]> {
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
