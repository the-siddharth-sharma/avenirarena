import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  EditableStudentProfile,
  EarnedBadge,
  GameAttempt,
  GameCompletion,
  LearningGameId,
  QuizAttempt,
  QuizQuestion,
  QuestCompletion,
  StudentProfile,
  XPTransaction,
} from '@/types';
import { dailyQuizId } from '@/data/quizData';
import { learningGames } from '@/data/gameData';
import { badgeDefinitions, getPeriodKey, getWeekKey, questDefinitions } from '@/data/progressData';
import { calculateDailyQuizScore, getAcademicDate } from '@/engine/xpRules';
import { traceEngine } from '@/engine/infiniteTrace';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebaseConfig';

const SELECTED_STUDENT_KEY = 'avenir-selected-student';
const STUDENT_PROFILES_KEY = 'avenir-student-profiles';
const PROGRESS_STATE_KEY = 'avenir-progress-state-v2';
const PROGRESS_STATE_VERSION = 2;

export const defaultCadetStudent: StudentProfile = {
  id: 'cadet-init',
  studentId: 'ARENA-0001',
  displayName: 'Cadet Operative',
  email: '',
  avatarInitials: 'CO',
  avatarColor: 'from-gold-500 to-gold-700',
  level: 1,
  totalXP: 0,
  currentLevelXP: 0,
  nextLevelXP: 100,
  streak: 0,
  completedQuests: 0,
  courseBranch: 'Computer Science & Engineering',
  year: 'Year 1',
  batch: 'Batch 2026',
  campus: 'MSOT Ghaziabad',
  joinedDate: new Date().toISOString(),
  profileCompletion: 50,
};

interface StudentProgress {
  attempts: QuizAttempt[];
  transactions: XPTransaction[];
  gameAttempts: GameAttempt[];
  gameCompletions: GameCompletion[];
  earnedBadges: EarnedBadge[];
  questCompletions: QuestCompletion[];
}

interface PersistedProgressState {
  version: number;
  students: Record<string, StudentProgress>;
}

interface QuizSubmissionResult { attempt: QuizAttempt; awarded: boolean; }
interface GameSubmissionResult { attempt: GameAttempt; completion: GameCompletion | null; awarded: boolean; }

interface StudentProfileContextValue {
  students: StudentProfile[];
  selectedStudent: StudentProfile;
  selectStudent: (studentId: string) => void;
  updateSelectedStudent: (changes: EditableStudentProfile) => void;
  quizAttempts: QuizAttempt[];
  xpTransactions: XPTransaction[];
  gameAttempts: GameAttempt[];
  gameCompletions: GameCompletion[];
  earnedBadges: EarnedBadge[];
  questCompletions: QuestCompletion[];
  submitDailyQuiz: (quizId: string, questions: QuizQuestion[], answers: number[]) => QuizSubmissionResult;
  submitGame: (gameId: LearningGameId, answer: number) => GameSubmissionResult;
}

const StudentProfileContext = createContext<StudentProfileContextValue | undefined>(undefined);

function emptyProgress(): StudentProgress {
  return { attempts: [], transactions: [], gameAttempts: [], gameCompletions: [], earnedBadges: [], questCompletions: [] };
}

function getInitialProgress(): PersistedProgressState {
  const empty: PersistedProgressState = { version: PROGRESS_STATE_VERSION, students: {} };
  if (typeof window === 'undefined') return empty;
  try {
    const current = localStorage.getItem(PROGRESS_STATE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && 'students' in parsed) {
        const candidate = parsed as PersistedProgressState;
        if (candidate.version === PROGRESS_STATE_VERSION && typeof candidate.students === 'object') return candidate;
      }
    }
  } catch {
    // Fall back to an empty versioned state.
  }
  return empty;
}

function getInitials(displayName: string): string {
  if (!displayName) return 'CO';
  return displayName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function calculateCompletion(profile: EditableStudentProfile): number {
  const fields = [profile.displayName, profile.courseBranch, profile.year, profile.batch, profile.campus];
  return Math.round((fields.filter((field) => field.trim().length > 0).length / fields.length) * 100);
}

function createId(prefix: string): string {
  return `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36)}`;
}

function addTransaction(
  state: StudentProgress,
  studentId: string,
  amount: number,
  reason: string,
  source: XPTransaction['source'],
  academicDate: string,
  related: { quizId?: string; gameId?: LearningGameId; questId?: string },
): StudentProgress {
  const transaction: XPTransaction = {
    id: createId('xp'), studentId, amount, reason, source, timestamp: new Date().toISOString(), academicDate,
    relatedQuizId: related.quizId, relatedGameId: related.gameId, relatedQuestId: related.questId,
  };
  return { ...state, transactions: [...state.transactions, transaction] };
}

function applyDerivedRewards(studentId: string, state: StudentProgress, now: Date): { state: StudentProgress; xp: number } {
  let next = state;
  let xp = 0;
  const academicDate = getAcademicDate();
  const todayQuiz = next.attempts.find((attempt) => attempt.quizId === dailyQuizId && attempt.academicDate === academicDate);
  const perfectQuiz = next.attempts.some((attempt) => attempt.quizId === dailyQuizId && attempt.academicDate === academicDate && attempt.score === attempt.totalQuestions);
  const todayGames = new Set(next.gameCompletions.filter((completion) => completion.academicDate === academicDate).map((completion) => completion.gameId));
  const weeklyActivities = next.attempts.filter((attempt) => getWeekKey(new Date(attempt.submittedAt)) === getWeekKey(now)).length
    + next.gameCompletions.filter((completion) => getWeekKey(new Date(completion.completedAt)) === getWeekKey(now)).length;
  const questProgress: Record<string, number> = {
    'daily-learner': todayQuiz ? 1 : 0,
    'perfect-precision': perfectQuiz ? 1 : 0,
    'code-explorer': todayGames.has('code-sprint') ? 1 : 0,
    'logic-thinker': todayGames.has('logic-grid') ? 1 : 0,
    'weekly-achiever': weeklyActivities,
  };

  questDefinitions.forEach((quest) => {
    const periodKey = getPeriodKey(quest.frequency, now);
    const alreadyCompleted = next.questCompletions.some((completion) => completion.questId === quest.id && completion.periodKey === periodKey);
    if (questProgress[quest.id] < quest.target || alreadyCompleted) return;
    const completion: QuestCompletion = { questId: quest.id, periodKey, completedAt: now.toISOString(), xpAwarded: quest.reward };
    next = { ...next, questCompletions: [...next.questCompletions, completion] };
    next = addTransaction(next, studentId, quest.reward, `Quest complete: ${quest.title}`, 'quest', academicDate, { questId: quest.id });
    xp += quest.reward;
  });

  const hasEligibleActivity = next.attempts.length > 0 || next.gameCompletions.length > 0;
  const badgeConditions: Record<string, boolean> = {
    'first-steps': hasEligibleActivity,
    'quiz-champion': next.attempts.some((attempt) => attempt.quizId === dailyQuizId && attempt.score === attempt.totalQuestions),
    'code-explorer': next.gameCompletions.some((completion) => completion.gameId === 'code-sprint'),
    'logic-master': next.gameCompletions.some((completion) => completion.gameId === 'logic-grid'),
    'quest-finisher': next.questCompletions.length >= 5,
  };
  badgeDefinitions.forEach((badge) => {
    if (badgeConditions[badge.id] && !next.earnedBadges.some((earned) => earned.badgeId === badge.id)) {
      next = { ...next, earnedBadges: [...next.earnedBadges, { badgeId: badge.id, unlockedAt: now.toISOString() }] };
    }
  });
  return { state: next, xp };
}

function getInitialSelectedStudentId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const rawUser = localStorage.getItem('avenir-google-user-v1');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      return u.uid || '';
    }
  } catch {}
  return '';
}

function getInitialStudents(): StudentProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawUser = localStorage.getItem('avenir-google-user-v1');
    const rawProfile = localStorage.getItem('avenir-user-profile-v1');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const profile = rawProfile ? JSON.parse(rawProfile) : null;
      const name = profile?.username || profile?.displayName || u.displayName || 'Cadet Operative';
      const realXP = profile?.academicXP ?? profile?.xp ?? 0;
      const initialStudent: StudentProfile = {
        id: u.uid,
        studentId: u.uid.replace('google-', 'G-').slice(0, 10).toUpperCase(),
        displayName: name,
        email: u.email || '',
        avatarInitials: getInitials(name),
        avatarColor: 'from-gold-500 to-gold-700',
        level: Math.max(1, Math.floor(Math.sqrt(realXP / 50)) + 1),
        totalXP: realXP,
        currentLevelXP: realXP % 100,
        nextLevelXP: 100,
        streak: profile?.infiniteTraceStreak ?? 0,
        completedQuests: profile?.gamesPlayed ?? 0,
        courseBranch: 'Computer Science & Engineering',
        year: profile?.year ? (profile.year.includes('Year') || profile.year.includes('20') ? profile.year : `${profile.year} Year`) : 'Year 1',
        batch: profile?.batch || '2025-2029',
        campus: profile?.campus || 'MSOT Ghaziabad',
        joinedDate: profile?.createdAt || new Date().toISOString(),
        profileCompletion: profile?.isSetupComplete ? 100 : 50,
      };
      return [initialStudent];
    }
  } catch {}
  return [];
}

export function StudentProfileProvider({ children }: { children: ReactNode }) {
  const { currentUser, userProfile, updateUserXP } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>(getInitialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(getInitialSelectedStudentId);
  const [progress, setProgress] = useState<PersistedProgressState>(getInitialProgress);

  // Synchronize authenticated user and real Firestore users
  useEffect(() => {
    let isMounted = true;

    async function syncRealProfiles() {
      try {
        const firestoreUsers = await firestoreService.getAllUsers();
        if (!isMounted) return;

        const profiles: StudentProfile[] = firestoreUsers.map((u) => {
          const name =
            u.firstName && u.lastName
              ? `${u.firstName} ${u.lastName}`
              : u.username || u.email.split('@')[0] || 'Cadet';

          const userTotalXP = u.xp || 0;
          return {
            id: u.uid,
            studentId: u.uid.replace('google-', 'G-').slice(0, 10).toUpperCase(),
            displayName: name,
            email: u.email,
            avatarInitials: getInitials(name),
            avatarColor: 'from-gold-500 to-gold-700',
            level: Math.max(1, Math.floor(Math.sqrt(userTotalXP / 50)) + 1),
            totalXP: userTotalXP,
            currentLevelXP: userTotalXP % 100,
            nextLevelXP: 100,
            streak: u.infiniteTraceStreak || 0,
            completedQuests: u.gamesPlayed || 0,
            courseBranch: 'Computer Science & Engineering',
            year: u.year ? (u.year.includes('Year') || u.year.includes('20') ? u.year : `${u.year} Year`) : 'Year 1',
            batch: u.batch || 'Batch 2026',
            campus: u.campus || 'MSOT Ghaziabad',
            joinedDate: u.createdAt || new Date().toISOString(),
            profileCompletion: u.isSetupComplete ? 100 : 50,
          };
        });

        // Ensure current real user is included with strictly accurate real XP (0 for new user)
        if (currentUser) {
          const userIndex = profiles.findIndex((p) => p.id === currentUser.uid);
          const currentName =
            userProfile?.username || currentUser.displayName || 'Cadet Operative';
          const realXP = userProfile?.xp ?? 0;
          const currentRealProfile: StudentProfile = {
            id: currentUser.uid,
            studentId: currentUser.uid.replace('google-', 'G-').slice(0, 10).toUpperCase(),
            displayName: currentName,
            email: currentUser.email,
            avatarInitials: getInitials(currentName),
            avatarColor: 'from-gold-500 to-gold-700',
            level: Math.max(1, Math.floor(Math.sqrt(realXP / 50)) + 1),
            totalXP: realXP,
            currentLevelXP: realXP % 100,
            nextLevelXP: 100,
            streak: userProfile?.infiniteTraceStreak ?? 0,
            completedQuests: userProfile?.gamesPlayed ?? 0,
            courseBranch: 'Computer Science & Engineering',
            year: userProfile?.year ? (userProfile.year.includes('Year') || userProfile.year.includes('20') ? userProfile.year : `${userProfile.year} Year`) : 'Year 1',
            batch: userProfile?.batch || 'Batch 2026',
            campus: userProfile?.campus || 'MSOT Ghaziabad',
            joinedDate: userProfile?.createdAt || new Date().toISOString(),
            profileCompletion: userProfile?.isSetupComplete ? 100 : 50,
          };

          if (userIndex >= 0) {
            profiles[userIndex] = currentRealProfile;
          } else {
            profiles.unshift(currentRealProfile);
          }
        }

        setStudents(profiles);

        if (currentUser) {
          setSelectedStudentId(currentUser.uid);
          traceEngine.setActiveStudent(currentUser.uid);
        } else {
          setSelectedStudentId('');
          traceEngine.setActiveStudent('');
        }
      } catch (err) {
        console.error('Failed to sync student profiles from Firestore:', err);
      }
    }

    syncRealProfiles();

    return () => {
      isMounted = false;
    };
  }, [currentUser, userProfile]);

  const selectedStudent = useMemo(() => {
    return (
      students.find((student) => student.id === selectedStudentId) ||
      students[0] ||
      defaultCadetStudent
    );
  }, [selectedStudentId, students]);

  const selectedProgress = progress.students[selectedStudent.id] || emptyProgress();

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_PROFILES_KEY, JSON.stringify(students));
    } catch {
      /* Optional local persistence. */
    }
  }, [students]);

  useEffect(() => {
    if (selectedStudentId) {
      try {
        localStorage.setItem(SELECTED_STUDENT_KEY, selectedStudentId);
      } catch {
        /* Optional local persistence. */
      }
      traceEngine.setActiveStudent(selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STATE_KEY, JSON.stringify(progress));
    } catch {
      /* Optional local persistence. */
    }
  }, [progress]);

  const selectStudent = (studentId: string) => {
    if (students.some((student) => student.id === studentId)) {
      traceEngine.setActiveStudent(studentId);
      setSelectedStudentId(studentId);
    }
  };

  const updateSelectedStudent = (changes: EditableStudentProfile) =>
    setStudents((current) =>
      current.map((student) =>
        student.id !== selectedStudent.id
          ? student
          : {
              ...student,
              ...changes,
              avatarInitials: getInitials(changes.displayName),
              profileCompletion: calculateCompletion(changes),
            }
      )
    );

  const submitDailyQuiz = (
    quizId: string,
    questions: QuizQuestion[],
    answers: number[]
  ): QuizSubmissionResult => {
    const academicDate = getAcademicDate();
    const { score, xp } = calculateDailyQuizScore(questions, answers);
    const alreadyAwarded = selectedProgress.transactions.some(
      (transaction) =>
        transaction.relatedQuizId === quizId && transaction.academicDate === academicDate
    );
    const attempt: QuizAttempt = {
      id: createId('attempt'),
      studentId: selectedStudent.id,
      quizId,
      answers,
      score,
      totalQuestions: questions.length,
      xpAwarded: alreadyAwarded ? 0 : xp,
      submittedAt: new Date().toISOString(),
      academicDate,
    };
    let next = { ...selectedProgress, attempts: [...selectedProgress.attempts, attempt] };
    if (!alreadyAwarded)
      next = addTransaction(
        next,
        selectedStudent.id,
        xp,
        `Daily Quiz: ${score}/${questions.length} correct`,
        'daily-quiz',
        academicDate,
        { quizId }
      );
    const derived = applyDerivedRewards(selectedStudent.id, next, new Date());
    setProgress((current) => ({
      ...current,
      version: PROGRESS_STATE_VERSION,
      students: { ...current.students, [selectedStudent.id]: derived.state },
    }));
    const totalAward = (alreadyAwarded ? 0 : xp) + derived.xp;
    if (totalAward > 0) {
      setStudents((current) =>
        current.map((student) =>
          student.id === selectedStudent.id
            ? {
                ...student,
                totalXP: student.totalXP + totalAward,
                currentLevelXP: (student.totalXP + totalAward) % 100,
              }
            : student
        )
      );
      updateUserXP(totalAward);
    }
    return { attempt, awarded: !alreadyAwarded };
  };

  const submitGame = (gameId: LearningGameId, answer: number): GameSubmissionResult => {
    const game = learningGames.find((candidate) => candidate.id === gameId);
    if (!game) throw new Error('Unknown learning game.');
    const correct = answer === game.correctOptionIndex;
    const academicDate = getAcademicDate();
    const priorCompletion = selectedProgress.gameCompletions.find(
      (completion) => completion.gameId === gameId
    );
    const gameXp = correct && !priorCompletion ? game.reward : 0;
    const attempt: GameAttempt = {
      id: createId('game-attempt'),
      studentId: selectedStudent.id,
      gameId,
      answer,
      correct,
      xpAwarded: gameXp,
      submittedAt: new Date().toISOString(),
      academicDate,
    };
    let next: StudentProgress = {
      ...selectedProgress,
      gameAttempts: [...selectedProgress.gameAttempts, attempt],
    };
    let completion: GameCompletion | null = null;
    if (correct && !priorCompletion) {
      completion = {
        id: createId('game-completion'),
        studentId: selectedStudent.id,
        gameId,
        completedAt: new Date().toISOString(),
        academicDate,
        xpAwarded: gameXp,
      };
      next = { ...next, gameCompletions: [...next.gameCompletions, completion] };
      next = addTransaction(
        next,
        selectedStudent.id,
        gameXp,
        `${game.title} completed`,
        'game',
        academicDate,
        { gameId }
      );
    }
    const derived = applyDerivedRewards(selectedStudent.id, next, new Date());
    setProgress((current) => ({
      ...current,
      version: PROGRESS_STATE_VERSION,
      students: { ...current.students, [selectedStudent.id]: derived.state },
    }));
    const totalAward = gameXp + derived.xp;
    if (totalAward > 0) {
      setStudents((current) =>
        current.map((student) =>
          student.id === selectedStudent.id
            ? {
                ...student,
                totalXP: student.totalXP + totalAward,
                currentLevelXP: (student.totalXP + totalAward) % 100,
              }
            : student
        )
      );
      updateUserXP(totalAward);
    }
    return { attempt, completion, awarded: gameXp > 0 };
  };

  return (
    <StudentProfileContext.Provider
      value={{
        students,
        selectedStudent,
        selectStudent,
        updateSelectedStudent,
        quizAttempts: selectedProgress.attempts,
        xpTransactions: selectedProgress.transactions,
        gameAttempts: selectedProgress.gameAttempts,
        gameCompletions: selectedProgress.gameCompletions,
        earnedBadges: selectedProgress.earnedBadges,
        questCompletions: selectedProgress.questCompletions,
        submitDailyQuiz,
        submitGame,
      }}
    >
      {children}
    </StudentProfileContext.Provider>
  );
}

export function useStudentProfiles(): StudentProfileContextValue {
  const context = useContext(StudentProfileContext);
  if (!context) throw new Error('useStudentProfiles must be used within StudentProfileProvider');
  return context;
}
