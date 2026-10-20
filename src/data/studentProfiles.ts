import type { EditableStudentProfile, StudentProfile } from '@/types';
import { demoStudent } from './demoData';
import { LEADERBOARD_BADGES } from './leaderboardBadges';

const profile = (student: StudentProfile): StudentProfile => student;

// Purged dummy student profiles — Arena strictly operates with real authenticated users
export const demoStudentProfiles: StudentProfile[] = [];

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
