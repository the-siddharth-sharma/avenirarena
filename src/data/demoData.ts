import type {
  Student,
  Game,
  Quest,
  LeaderboardEntry,
  Activity,
  Badge,
  ContinueLearningItem,
  Notification,
} from '@/types';

// ─── Initial Cadet Template (Strict 0 XP Starting State) ──────────
export const demoStudent: Student = {
  id: 'cadet-init',
  displayName: 'Cadet Operative',
  studentId: 'ARENA-0001',
  email: '',
  avatarInitials: 'CO',
  avatarColor: 'from-[var(--c-accent)] to-[var(--c-accent-2)]',
  level: 1,
  totalXP: 0,
  currentLevelXP: 0,
  nextLevelXP: 100,
  streak: 0,
  completedQuests: 0,
  courseBranch: 'Computer Science & Engineering',
  year: 'Year 1',
  batch: 'Batch 2026',
  campus: 'Mirai Ghaziabad',
  joinedDate: new Date().toISOString(),
};

// ─── Games library ────────────────────────────────────────────────
export const demoGames: Game[] = [
  {
    id: 'game-001',
    title: 'DSA Dash',
    category: 'Data Structures',
    difficulty: 'Intermediate',
    description:
      'Race against the clock to solve array, linked-list, and tree puzzles. Build speed and accuracy on core DSA patterns.',
    icon: 'Zap',
    color: 'from-[var(--c-accent)]/15 to-[var(--c-accent-2)]/5',
    plays: 1240,
    rating: 4.7,
  },
  {
    id: 'game-002',
    title: 'Code Quest',
    category: 'Algorithms',
    difficulty: 'Advanced',
    description:
      'Embark on an epic journey through sorting, searching, and dynamic programming challenges across five kingdoms.',
    icon: 'Swords',
    color: 'from-[var(--c-accent-2)]/15 to-[var(--c-accent)]/5',
    plays: 980,
    rating: 4.8,
  },
  {
    id: 'game-003',
    title: 'Logic Lab',
    category: 'Reasoning',
    difficulty: 'Beginner',
    description:
      'Train your deductive reasoning with bite-sized logic puzzles, truth tables, and Boolean brain-teasers.',
    icon: 'FlaskConical',
    color: 'from-[var(--c-success)]/15 to-[var(--c-accent-2)]/5',
    plays: 1560,
    rating: 4.5,
  },
  {
    id: 'game-004',
    title: 'Recursion Realm',
    category: 'Algorithms',
    difficulty: 'Advanced',
    description:
      'Master recursive thinking through tower puzzles, tree traversals, and memoization challenges in a mystical world.',
    icon: 'Repeat',
    color: 'from-[var(--c-warning)]/15 to-[var(--c-accent)]/5',
    plays: 720,
    rating: 4.6,
  },
  {
    id: 'game-005',
    title: 'Graph Gladiator',
    category: 'Graph Theory',
    difficulty: 'Expert',
    description:
      'Battle through BFS, DFS, shortest-path, and MST problems. Only the sharpest minds survive the arena.',
    icon: 'Network',
    color: 'from-[var(--c-error)]/15 to-[var(--c-accent)]/5',
    plays: 540,
    rating: 4.9,
  },
  {
    id: 'game-006',
    title: 'Bit Battles',
    category: 'Bit Manipulation',
    difficulty: 'Intermediate',
    description:
      'Sharpen your low-level intuition with bitwise operations, masks, and shift-based mini-games.',
    icon: 'Binary',
    color: 'from-[var(--c-accent-2)]/15 to-[var(--c-accent)]/5',
    plays: 890,
    rating: 4.4,
  },
];

// ─── Quests ───────────────────────────────────────────────────────
export const demoQuests: Quest[] = [
  {
    id: 'quest-001',
    title: 'Daily Quiz: Complexity Analysis',
    description: 'Answer 5 questions on time and space complexity.',
    frequency: 'daily',
    status: 'in-progress',
    xpReward: 120,
    progress: 3,
    total: 5,
    category: 'Algorithms',
    dueLabel: 'Today, 11:59 PM',
  },
  {
    id: 'quest-002',
    title: 'Recursion Challenge',
    description: 'Solve 3 recursion problems in the Recursion Realm game.',
    frequency: 'daily',
    status: 'in-progress',
    xpReward: 200,
    progress: 1,
    total: 3,
    category: 'Algorithms',
    dueLabel: 'Today, 11:59 PM',
  },
  {
    id: 'quest-003',
    title: 'Daily Streak Check-in',
    description: 'Log in and complete at least one activity to maintain your streak.',
    frequency: 'daily',
    status: 'completed',
    xpReward: 50,
    progress: 1,
    total: 1,
    category: 'General',
    dueLabel: 'Completed',
  },
  {
    id: 'quest-004',
    title: 'Weekly: Master Linked Lists',
    description: 'Complete all 8 linked-list modules in DSA Dash.',
    frequency: 'weekly',
    status: 'in-progress',
    xpReward: 500,
    progress: 5,
    total: 8,
    category: 'Data Structures',
    dueLabel: '4 days left',
  },
  {
    id: 'quest-005',
    title: 'Weekly: Graph Theory Sprint',
    description: 'Finish 10 graph problems across any game mode.',
    frequency: 'weekly',
    status: 'available',
    xpReward: 600,
    progress: 0,
    total: 10,
    category: 'Graph Theory',
    dueLabel: '4 days left',
  },
  {
    id: 'quest-006',
    title: 'Weekly: Perfect Score Challenge',
    description: 'Score 100% on any 3 quizzes this week.',
    frequency: 'weekly',
    status: 'locked',
    xpReward: 400,
    progress: 0,
    total: 3,
    category: 'General',
    dueLabel: 'Unlocks at Level 15',
  },
];

// ─── Real-Time Leaderboard & Activity Feeds (Purged mock data) ─────
export const demoLeaderboard: LeaderboardEntry[] = [];
export const demoActivities: Activity[] = [];

// ─── Badges ───────────────────────────────────────────────────────
export const demoBadges: Badge[] = [
  { id: 'badge-001', name: 'First Steps', description: 'Complete your first quest', icon: 'Footprints', earned: true, dateEarned: '2025-08-15', rarity: 'common' },
  { id: 'badge-002', name: 'Quick Thinker', description: 'Solve 10 problems under 2 minutes', icon: 'Zap', earned: true, dateEarned: '2026-10-12', rarity: 'rare' },
  { id: 'badge-003', name: 'Streak Master', description: 'Maintain a 10-day streak', icon: 'Flame', earned: true, dateEarned: '2026-10-08', rarity: 'rare' },
  { id: 'badge-004', name: 'Quiz Champion', description: 'Score 100% on 5 quizzes', icon: 'Trophy', earned: true, dateEarned: '2026-09-30', rarity: 'epic' },
  { id: 'badge-005', name: 'Recursion Wizard', description: 'Complete all Recursion Realm levels', icon: 'Sparkles', earned: false, rarity: 'epic' },
  { id: 'badge-006', name: 'Graph Legend', description: 'Finish Graph Gladiator on Expert', icon: 'Crown', earned: false, rarity: 'legendary' },
  { id: 'badge-007', name: 'Night Owl', description: 'Complete a quest after midnight', icon: 'Moon', earned: false, rarity: 'common' },
  { id: 'badge-008', name: 'Perfectionist', description: 'Score 100% on 20 quizzes', icon: 'Star', earned: false, rarity: 'legendary' },
];

// ─── Continue learning ────────────────────────────────────────────
export const demoContinueLearning: ContinueLearningItem[] = [
  { id: 'cl-001', title: 'Linked Lists Mastery', category: 'DSA Dash', progress: 62, icon: 'Link', color: 'from-[var(--c-accent)]/15 to-[var(--c-accent-2)]/5' },
  { id: 'cl-002', title: 'Sorting Kingdom', category: 'Code Quest', progress: 40, icon: 'Swords', color: 'from-[var(--c-accent-2)]/15 to-[var(--c-accent)]/5' },
  { id: 'cl-003', title: 'Boolean Brain-Teasers', category: 'Logic Lab', progress: 85, icon: 'FlaskConical', color: 'from-[var(--c-success)]/15 to-[var(--c-accent-2)]/5' },
];

// ─── Notifications ────────────────────────────────────────────────
export const demoNotifications: Notification[] = [
  { id: 'n-001', title: 'New daily quiz available', detail: 'Complexity Analysis — 120 XP', time: '2h ago', read: false },
  { id: 'n-002', title: 'Streak milestone!', detail: 'You reached a 12-day streak', time: '5h ago', read: false },
  { id: 'n-003', title: 'Badge earned: Quick Thinker', detail: 'Solve 10 problems under 2 minutes', time: '1d ago', read: true },
  { id: 'n-004', title: 'Weekly quest expiring', detail: 'Master Linked Lists — 4 days left', time: '1d ago', read: true },
];

// ─── Weekly progress (Mon–Sun XP earned) ──────────────────────────
export const weeklyProgress = [
  { day: 'Mon', xp: 340 },
  { day: 'Tue', xp: 520 },
  { day: 'Wed', xp: 280 },
  { day: 'Thu', xp: 610 },
  { day: 'Fri', xp: 450 },
  { day: 'Sat', xp: 380 },
  { day: 'Sun', xp: 470 },
];

// ─── Faculty stats ────────────────────────────────────────────────
export const facultyStats = {
  totalStudents: 248,
  activeToday: 187,
  quizParticipation: 75.3,
  inactiveStudents: 23,
  totalXPAwarded: 1842000,
  avgStudentLevel: 11.4,
  weeklyEngagement: [
    { day: 'Mon', value: 165 },
    { day: 'Tue', value: 192 },
    { day: 'Wed', value: 148 },
    { day: 'Thu', value: 201 },
    { day: 'Fri', value: 178 },
    { day: 'Sat', value: 134 },
    { day: 'Sun', value: 187 },
  ],
};

// ─── Faculty leaderboard preview (top 5 for faculty dashboard) ────
export const facultyInactiveStudents = [
  { id: 'fs-001', name: 'Tom Reed', studentId: 'MSOT-2026-0089', lastActive: '6 days ago', level: 8 },
  { id: 'fs-002', name: 'Nina Cole', studentId: 'MSOT-2026-0102', lastActive: '5 days ago', level: 6 },
  { id: 'fs-003', name: 'Ray Diaz', studentId: 'MSOT-2026-0115', lastActive: '4 days ago', level: 10 },
  { id: 'fs-004', name: 'Emma Vu', studentId: 'MSOT-2026-0128', lastActive: '3 days ago', level: 7 },
];
