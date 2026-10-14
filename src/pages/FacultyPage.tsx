import {
  Users,
  HelpCircle,
  UserX,
  Zap,
  TrendingUp,
  FileQuestion,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { Placeholder } from '@/components/Placeholder';
import { StudentAvatar } from '@/components/StudentAvatar';
import { facultyStats, facultyInactiveStudents } from '@/data/demoData';

export function FacultyPage() {
  const maxEngagement = Math.max(...facultyStats.weeklyEngagement.map((d) => d.value));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Faculty Panel"
        subtitle="Monitor student engagement and manage learning content."
      />

      {/* Demo / no-permissions label */}
      <div className="flex items-center gap-2 mb-6 text-xs text-gray-500 bg-ink-800 border border-white/5 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        This is a preview of the faculty dashboard. Administrative permissions and real data integration will be added in a future phase.
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Today"
          value={`${facultyStats.activeToday}/${facultyStats.totalStudents}`}
          sublabel="Students logged in"
          accentColor="text-success-400"
        />
        <StatCard
          icon={<HelpCircle className="w-5 h-5" />}
          label="Quiz Participation"
          value={`${facultyStats.quizParticipation}%`}
          sublabel="Daily quiz completion rate"
          accentColor="text-ocean-400"
        />
        <StatCard
          icon={<UserX className="w-5 h-5" />}
          label="Inactive Students"
          value={facultyStats.inactiveStudents}
          sublabel="No activity in 3+ days"
          accentColor="text-error-400"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Total XP Awarded"
          value={`${(facultyStats.totalXPAwarded / 1_000_000).toFixed(2)}M`}
          sublabel={`Avg level ${facultyStats.avgStudentLevel}`}
          accentColor="text-accent-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Engagement chart */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-ocean-400" />
            <h3 className="font-display font-semibold text-white">Weekly Student Engagement</h3>
          </div>
          <div className="flex items-end justify-between gap-3 h-36">
            {facultyStats.weeklyEngagement.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-gray-500">{d.value}</span>
                <div className="w-full bg-ink-800 rounded-t-lg flex items-end h-24">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-ocean-600 to-accent-500 transition-all duration-700"
                    style={{ height: `${(d.value / maxEngagement) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Inactive students */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-5 h-5 text-error-400" />
            <h3 className="font-display font-semibold text-white">Inactive Students</h3>
          </div>
          <div className="space-y-2">
            {facultyInactiveStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-ink-800 border border-white/5">
                <StudentAvatar initials={s.name.split(' ').map((n) => n[0]).join('')} color="from-gray-500 to-gray-600" size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.studentId} • Level {s.level}</p>
                </div>
                <span className="text-xs text-error-400 shrink-0">{s.lastActive}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Future features placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileQuestion className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">Question Management</h3>
          </div>
          <Placeholder
            title="Question Bank"
            message="Create, edit, and organize quiz questions across categories. Assign questions to daily quizzes and track performance metrics per question."
            icon={<FileQuestion className="w-8 h-8" />}
          />
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-accent-400" />
            <h3 className="font-display font-semibold text-white">XP Rules Configuration</h3>
          </div>
          <Placeholder
            title="XP Rules Engine"
            message="Configure XP rewards per quest type, difficulty multiplier rules, streak bonuses, and level-up thresholds. Preview the impact on student progression."
            icon={<Settings className="w-8 h-8" />}
          />
        </Card>
      </div>
    </div>
  );
}
