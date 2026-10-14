import { UserRound } from 'lucide-react';
import { useStudentProfiles } from '@/students/StudentProfileContext';

export function DemoStudentSelector() {
  const { students, selectedStudent, selectStudent } = useStudentProfiles();

  return (
    <label className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-graphite px-2 py-2 text-xs text-muted">
      <UserRound className="h-3.5 w-3.5 shrink-0 text-gold-400" />
      <span className="sr-only">Demo student</span>
      <span className="hidden sm:inline uppercase tracking-[0.12em]">Demo student</span>
      <select
        value={selectedStudent.id}
        onChange={(event) => selectStudent(event.target.value)}
        className="max-w-[140px] cursor-pointer bg-transparent text-sm font-medium text-ivory outline-none"
        aria-label="Select demo student"
      >
        {students.map((student) => (
          <option key={student.id} value={student.id} className="bg-graphite text-ivory">
            {student.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
