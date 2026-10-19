import { useState } from 'react';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { demoActivities } from '@/data/demoData';
import type { ActivityType } from '@/types';
import { useStudentProfiles } from '@/students/StudentProfileContext';

type FilterType = 'all' | ActivityType;

const activityTypes: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'game', label: 'Games' },
  { key: 'quest', label: 'Quests' },
  { key: 'quiz', label: 'Quizzes' },
  { key: 'challenge', label: 'Challenges' },
  { key: 'achievement', label: 'Achievements' },
  { key: 'level-up', label: 'Level Ups' },
];

function getIcon(type: ActivityType): Icons.LucideIcon {
  const map: Record<ActivityType, Icons.LucideIcon> = {
    game: Icons.Gamepad2,
    quest: Icons.Target,
    quiz: Icons.HelpCircle,
    challenge: Icons.Swords,
    achievement: Icons.Award,
    'level-up': Icons.TrendingUp,
  };
  return map[type] || Icons.Activity;
}

function getColor(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    game: 'bg-ocean-500/15 text-ocean-400',
    quest: 'bg-accent-600/15 text-accent-400',
    quiz: 'bg-success-500/15 text-success-400',
    challenge: 'bg-error-500/15 text-error-400',
    achievement: 'bg-warning-500/15 text-warning-400',
    'level-up': 'bg-accent-600/15 text-accent-300',
  };
  return map[type] || 'bg-ink-700 text-gray-400';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ActivityPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { selectedStudent, xpTransactions } = useStudentProfiles();

  const realActivities: typeof demoActivities = xpTransactions.map((tx) => {
    let actType: ActivityType = 'quest';
    if (tx.source === 'daily-quiz') actType = 'quiz';
    else if (tx.source === 'game') actType = 'game';
    else if (tx.source === 'quest') actType = 'quest';

    return {
      id: tx.id,
      date: tx.academicDate || tx.timestamp.slice(0, 10),
      type: actType,
      title: tx.reason,
      detail: `Academic Record • ${tx.source.toUpperCase()}`,
      xpEarned: tx.amount,
    };
  });

  const filtered = realActivities.filter((a) => filter === 'all' || a.type === filter);

  // Group by date
  const grouped = filtered.reduce((acc, act) => {
    if (!acc[act.date]) acc[act.date] = [];
    acc[act.date].push(act);
    return acc;
  }, {} as Record<string, typeof demoActivities>);

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const totalXP = filtered.reduce((s, a) => s + a.xpEarned, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Activity History"
        subtitle="A chronological log of your learning activities and XP earned."
      />

      {/* Summary */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className="text-2xl font-display font-bold text-white">{filtered.length}</p>
          <p className="text-xs text-gray-500">Activities</p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-accent-400">{totalXP.toLocaleString()}</p>
          <p className="text-xs text-gray-500">XP Earned</p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-semibold text-ivory">XP Ledger</h2>
            <p className="text-xs text-muted mt-1">
              Verified records for {selectedStudent.displayName}. Synchronized with Firestore cloud account.
            </p>
          </div>
          <span className="badge bg-gold-400/10 text-gold-400">{xpTransactions.length} transactions</span>
        </div>
        {xpTransactions.length > 0 ? (
          <div className="space-y-1">
            {xpTransactions.slice().reverse().slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-400/10 text-gold-400">
                  <Icons.Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ivory">{transaction.reason}</p>
                  <p className="text-xs text-muted">
                    {formatTimestamp(transaction.timestamp)} · Academic date {transaction.academicDate}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-gold-400">+{transaction.amount} XP</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-line px-4 py-5 text-sm text-muted">
            Complete the daily quiz or play games to create your first XP transaction.
          </p>
        )}
      </Card>

      {/* Filter */}
      <div className="flex gap-1.5 bg-ink-800 border border-white/5 rounded-xl p-1 mb-6 overflow-x-auto no-scrollbar w-fit max-w-full">
        {activityTypes.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`tab-button ${filter === t.key ? 'tab-active' : 'tab-inactive'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {dates.length > 0 ? (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{formatDate(date)}</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <Card className="p-0 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {grouped[date].map((act) => {
                    const Icon = getIcon(act.type);
                    return (
                      <div key={act.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-ink-800 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getColor(act.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{act.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{act.detail}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {act.xpEarned > 0 ? (
                            <>
                              <p className="text-sm font-mono font-bold text-accent-400">+{act.xpEarned}</p>
                              <p className="text-xs text-gray-600">XP</p>
                            </>
                          ) : (
                            <span className="badge bg-ink-700 text-gray-500 capitalize text-[10px]">{act.type.replace('-', ' ')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No activities found"
            message="Try selecting a different filter to see activities."
            icon={<Icons.Activity className="w-6 h-6" />}
          />
        </Card>
      )}
    </div>
  );
}
