import type { EditableStudentProfile, StudentProfile } from '@/types';

// Purged dummy student profiles — Arena strictly operates with real authenticated users
export const demoStudentProfiles: StudentProfile[] = [];

export function getEditableProfile(student: StudentProfile): EditableStudentProfile {
  return {
    displayName: student.displayName,
    username: student.username || student.displayName,
    avatarColor: student.avatarColor,
    courseBranch: student.courseBranch,
    year: student.year,
    batch: student.batch,
    campus: student.campus,
  };
}
