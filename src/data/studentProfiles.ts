import type { EditableStudentProfile, StudentProfile } from '@/types';
<<<<<<< HEAD
import { demoStudent } from './demoData';
import { LEADERBOARD_BADGES } from './leaderboardBadges';

const profile = (student: StudentProfile): StudentProfile => student;

export const demoStudentProfiles: StudentProfile[] = [
  profile({
    ...demoStudent,
    profileCompletion: 92,
  }),
  profile({
    id: 'stu-002',
    displayName: 'Noah Williams',
    studentId: 'MSOT-2026-0083',
    email: 'noah.williams@msot.edu',
    avatarInitials: 'NW',
    avatarColor: 'from-[var(--c-accent-2)] to-[var(--c-accent)]',
    level: 11,
    totalXP: 6280,
    currentLevelXP: 280,
    nextLevelXP: 700,
    streak: 7,
    streakDays: 7,
    weeklyGrowthPct: 62,
    badges: [LEADERBOARD_BADGES['Consistent Learning Growth']],
    completedQuests: 49,
    courseBranch: 'Software Engineering — Product Systems',
    year: 'Year 2',
    batch: 'Batch 2026 — Section A',
    campus: 'North Campus',
    joinedDate: 'September 2025',
    profileCompletion: 78,
  }),
  profile({
    id: 'stu-003',
    displayName: 'Sofia Rivera',
    studentId: 'MSOT-2027-0194',
    email: 'sofia.rivera@msot.edu',
    avatarInitials: 'SR',
    avatarColor: 'from-[var(--c-accent)] to-[var(--c-accent-2)]',
    level: 9,
    totalXP: 4710,
    currentLevelXP: 510,
    nextLevelXP: 900,
    streak: 18,
    streakDays: 18,
    weeklyGrowthPct: 82,
    badges: [
      LEADERBOARD_BADGES['Consistent Learning Growth'],
      LEADERBOARD_BADGES['Consistent Player'],
    ],
    completedQuests: 38,
    courseBranch: 'Artificial Intelligence — Applied ML',
    year: 'Year 1',
    batch: 'Batch 2027 — Section C',
    campus: 'South Campus',
    joinedDate: 'August 2026',
    profileCompletion: 86,
  }),
  profile({
    id: 'stu-004',
    displayName: 'Kai Patel',
    studentId: 'MSOT-2025-0031',
    email: 'kai.patel@msot.edu',
    avatarInitials: 'KP',
    avatarColor: 'from-[var(--c-warning)] to-[var(--c-accent-2)]',
    level: 19,
    totalXP: 12450,
    currentLevelXP: 650,
    nextLevelXP: 1000,
    streak: 31,
    streakDays: 31,
    weeklyGrowthPct: 74,
    badges: [
      LEADERBOARD_BADGES['Consistent Player'],
      LEADERBOARD_BADGES['Master Learner'],
    ],
    completedQuests: 126,
    courseBranch: 'Computer Science — Algorithms',
    year: 'Year 3',
    batch: 'Batch 2025 — Section A',
    campus: 'North Campus',
    joinedDate: 'August 2024',
    profileCompletion: 100,
  }),
  profile({
    id: 'stu-005',
    displayName: 'Maya Okafor',
    studentId: 'MSOT-2026-0116',
    email: 'maya.okafor@msot.edu',
    avatarInitials: 'MO',
    avatarColor: 'from-[var(--c-accent-2)] to-[var(--c-success)]',
    level: 16,
    totalXP: 9210,
    currentLevelXP: 410,
    nextLevelXP: 900,
    streak: 14,
    streakDays: 14,
    weeklyGrowthPct: 56,
    badges: [LEADERBOARD_BADGES['Consistent Learning Growth']],
    completedQuests: 94,
    courseBranch: 'Information Systems — Cloud Platforms',
    year: 'Year 2',
    batch: 'Batch 2026 — Section C',
    campus: 'South Campus',
    joinedDate: 'August 2025',
    profileCompletion: 89,
  }),
];
=======

// Purged dummy student profiles — Arena strictly operates with real authenticated users
export const demoStudentProfiles: StudentProfile[] = [];
>>>>>>> d7f7895635cfa88d9d6198ee14cbc5ee8f3db9bc

export function getEditableProfile(student: StudentProfile): EditableStudentProfile {
  return {
    displayName: student.displayName,
    avatarColor: student.avatarColor,
    courseBranch: student.courseBranch,
    year: student.year,
    batch: student.batch,
    campus: student.campus,
  };
}
