// Centralized type definitions for MSOT Quest
// Designed to map cleanly onto Supabase tables in a future phase.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type QuestStatus = 'completed' | 'in-progress' | 'locked' | 'available';

export type QuestFrequency = 'daily' | 'weekly';

export type ActivityType =
  | 'game'
  | 'quest'
  | 'quiz'
  | 'challenge'
  | 'achievement'
  | 'level-up';

export interface Student {
  id: string;
  displayName: string;
  studentId: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  level: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streak: number;
  completedQuests: number;
  courseBranch: string;
  year: string;
  batch: string;
  campus: string;
  joinedDate: string;
}

export type EditableStudentProfile = Pick<
  Student,
  'displayName' | 'avatarColor' | 'courseBranch' | 'year' | 'batch' | 'campus'
>;

export interface StudentProfile extends Student {
  profileCompletion: number;
}

export interface Game {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
  icon: string;
  color: string;
  plays: number;
  rating: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  frequency: QuestFrequency;
  status: QuestStatus;
  xpReward: number;
  progress: number;
  total: number;
  category: string;
  dueLabel: string;
}

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  level: number;
  totalXP: number;
  weeklyXP?: number;
  rankChange?: number; // e.g. +2, -1, 0
  previousRank?: number;
  avatarInitials: string;
  avatarColor: string;
  batch: string;
  campus: string;
  leagueTier?: LeagueTier;
  isCurrentUser?: boolean;
  isDemo?: boolean;
}

export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  title: string;
  detail: string;
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  dateEarned?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ContinueLearningItem {
  id: string;
  title: string;
  category: string;
  progress: number;
  icon: string;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  xpAwarded: number;
  submittedAt: string;
  academicDate: string;
}

export type XPSource = 'daily-quiz' | 'game' | 'quest';

export interface XPTransaction {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  source: XPSource;
  relatedQuizId?: string;
  relatedGameId?: string;
  relatedQuestId?: string;
  timestamp: string;
  academicDate: string;
}

export type LearningGameId = 'code-sprint' | 'logic-grid' | 'bug-hunter';

export interface GameAttempt {
  id: string;
  studentId: string;
  gameId: LearningGameId;
  answer: number;
  correct: boolean;
  xpAwarded: number;
  submittedAt: string;
  academicDate: string;
}

export interface GameCompletion {
  id: string;
  studentId: string;
  gameId: LearningGameId;
  completedAt: string;
  academicDate: string;
  xpAwarded: number;
}

export interface EarnedBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface QuestCompletion {
  questId: string;
  periodKey: string;
  completedAt: string;
  xpAwarded: number;
}
