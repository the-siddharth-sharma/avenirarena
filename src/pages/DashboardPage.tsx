import {
  Zap,
  Flame,
  Target,
  TrendingUp,
  ArrowRight,
  Calendar,
  Clock,
  Play,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { StudentAvatar } from '@/components/StudentAvatar';
import { XPProgressBar } from '@/components/XPProgressBar';
import { ProgressBar } from '@/components/ProgressBar';
import {
  demoContinueLearning,
  demoQuests,
  weeklyProgress,
} from '@/data/demoData';
import { useMemo } from 'react';
import type { NavigateProps } from '@/pages/types';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { useAuth } from '@/context/AuthContext';
import { HeroCursorTrace } from '@/components/HeroCursorTrace';
import { InfiniteTraceWidget } from '@/components/InfiniteTraceWidget';
import { buildCompetitiveStandings } from '@/engine/competitiveArena';

export function DashboardPage({ navigate }: NavigateProps) {
  const { selectedStudent, students, xpTransactions } = useStudentProfiles();
  const { userProfile } = useAuth();
  const campusDisplay = userProfile?.campus || selectedStudent.campus;
  const batchDisplay = userProfile?.batch || selectedStudent.batch;
  const dailyQuest = demoQuests.find((q) => q.frequency === 'daily' && q.status !== 'completed');
  const todayChallenge = dailyQuest || demoQuests[0];
  const recentActivities = xpTransactions.slice(0, 5);

  const { entries: arenaStandings } = useMemo(
    () =>
      buildCompetitiveStandings(students, selectedStudent, xpTransactions, {
        scope: 'all-time',
        batchFilter: 'all',
        campusFilter: 'all',
        leagueFilter: 'all',
      }),
    [students, selectedStudent, xpTransactions]
  );
  const topPlayers = arenaStandings.slice(0, 5);
  const maxWeekly = Math.max(...weeklyProgress.map((d) => d.xp));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's your learning overview for today."
      />

      {/* Welcome banner */}
      <Card className="mb-6 relative overflow-hidden">
        <HeroCursorTrace />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StudentAvatar
              initials={selectedStudent.avatarInitials}
              color={selectedStudent.avatarColor}
              size="xl"
              ring
            />
            <div>
              <p className="text-sm text-gray-400">Welcome back,</p>
              <h2 className="text-2xl font-display font-bold text-white">{selectedStudent.displayName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {batchDisplay} • {campusDisplay}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-white">Level {selectedStudent.level}</span>
              <span className="text-xs text-gray-500 font-mono">
                {selectedStudent.currentLevelXP} / {selectedStudent.nextLevelXP} XP
              </span>
            </div>
            <XPProgressBar
              current={selectedStudent.currentLevelXP}
              max={selectedStudent.nextLevelXP}
              showLabels={false}
              height="md"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {selectedStudent.nextLevelXP - selectedStudent.currentLevelXP} XP to Level {selectedStudent.level + 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Infinite Trace session telemetry widget */}
      <div className="mb-6">
        <InfiniteTraceWidget />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Total XP"
          value={selectedStudent.totalXP.toLocaleString()}
          sublabel="All-time earned"
          accentColor="text-accent-400"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={`${selectedStudent.streak} days`}
          sublabel="Keep it going!"
          accentColor="text-warning-400"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Quests Completed"
          value={selectedStudent.completedQuests}
          sublabel="Lifetime total"
          accentColor="text-success-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Weekly Avg"
          value="435 XP"
          sublabel="Last 7 days"
          accentColor="text-ocean-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Continue learning */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Continue Learning</h3>
              <button
                onClick={() => navigate('/games')}
                className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {demoContinueLearning.map((item) => {
                const Icon = (Icons[item.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.BookOpen;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-ink-800 border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                    onClick={() => navigate('/games')}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/5`}>
                      <Icon className="w-6 h-6 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                      <div className="mt-1.5">
                        <ProgressBar value={item.progress} max={100} height="sm" />
                      </div>
                    </div>
                    <span className="text-sm font-mono text-gray-400">{item.progress}%</span>
                    <Play className="w-4 h-4 text-gray-600 group-hover:text-accent-400 transition-colors" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Daily challenge */}
        <div>
          <Card className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-accent-600/15 text-accent-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-white">Daily Challenge</h3>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">{todayChallenge.title}</p>
              <p className="text-xs text-gray-400 mt-1">{todayChallenge.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-accent-400" />
                  {todayChallenge.xpReward} XP
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {todayChallenge.dueLabel}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={todayChallenge.progress}
                  max={todayChallenge.total}
                  color="from-accent-500 to-ocean-500"
                  height="sm"
                />
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {todayChallenge.progress} / {todayChallenge.total}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/quests')}
              className="btn btn-primary w-full mt-4"
            >
              Go to Quests
              <ArrowRight className="w-4 h-4" />
            </button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly progress chart */}
        <Card>
          <h3 className="font-display font-semibold text-white mb-4">Weekly Progress</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {weeklyProgress.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-gray-500">{d.xp}</span>
                <div className="w-full bg-ink-800 rounded-t-lg flex items-end h-28">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-accent-600 to-ocean-500 transition-all duration-700 ease-out"
                    style={{ height: `${(d.xp / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Activity</h3>
            <button
              onClick={() => navigate('/activity')}
              className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-ink-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-600/15 text-accent-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{act.reason}</p>
                    <p className="text-xs text-gray-500">
                      {act.source.toUpperCase()} • {act.academicDate}
                    </p>
                  </div>
                  {act.amount > 0 && (
                    <span className="text-xs font-mono text-accent-400 shrink-0">
                      +{act.amount} XP
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-500">
                No recent activity recorded. Complete a quiz or game to earn XP!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Leaderboard preview */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white">Leaderboard Preview</h3>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
          >
            Full leaderboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          {topPlayers.length > 0 ? (
            topPlayers.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 py-2.5 px-3 rounded-lg transition-colors ${
                  entry.isCurrentUser ? 'bg-accent-600/10 border border-accent-500/20' : 'hover:bg-ink-800'
                }`}
              >
                <span
                  className={`w-7 text-center font-display font-bold ${
                    entry.rank === 1
                      ? 'text-warning-400'
                      : entry.rank === 2
                      ? 'text-gray-300'
                      : entry.rank === 3
                      ? 'text-warning-600'
                      : 'text-gray-500'
                  }`}
                >
                  {entry.rank}
                </span>
                <StudentAvatar initials={entry.avatarInitials} color={entry.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {entry.displayName}
                    {entry.isCurrentUser && <span className="text-accent-400 text-xs ml-2">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-500">Level {entry.level}</p>
                </div>
                <span className="text-sm font-mono text-gray-300">{entry.totalXP.toLocaleString()} XP</span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs font-mono text-gray-500">
              No players ranked yet. Complete learning activities to set the first score!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function activityIcon(type: string): Icons.LucideIcon {
  const map: Record<string, Icons.LucideIcon> = {
    game: Icons.Gamepad2,
    quest: Icons.Target,
    quiz: Icons.HelpCircle,
    challenge: Icons.Swords,
    achievement: Icons.Award,
    'level-up': Icons.TrendingUp,
  };
  return map[type] || Icons.Activity;
}

function activityColor(type: string): string {
  const map: Record<string, string> = {
    game: 'bg-ocean-500/15 text-ocean-400',
    quest: 'bg-accent-600/15 text-accent-400',
    quiz: 'bg-success-500/15 text-success-400',
    challenge: 'bg-error-500/15 text-error-400',
    achievement: 'bg-warning-500/15 text-warning-400',
    'level-up': 'bg-accent-600/15 text-accent-300',
  };
  return map[type] || 'bg-ink-700 text-gray-400';
}
