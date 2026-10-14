import { useState } from 'react';
import { Crown, Medal, Eye, EyeOff, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StudentAvatar } from '@/components/StudentAvatar';
import { demoLeaderboard } from '@/data/demoData';

type ViewFilter = 'weekly' | 'batch' | 'campus';

export function LeaderboardPage() {
  const [view, setView] = useState<ViewFilter>('weekly');
  const [anon, setAnon] = useState(false);

  const tabs: { key: ViewFilter; label: string }[] = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'batch', label: 'Batch' },
    { key: 'campus', label: 'Campus' },
  ];

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-warning-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-warning-600" />;
    return <span className="font-display font-bold text-gray-500">{rank}</span>;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leaderboard"
        subtitle="See how you stack up against your peers."
      />

      {/* Demo data label */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-ink-800 border border-white/5 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 shrink-0" />
        This leaderboard displays demonstration data for UI preview purposes.
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        <div className="flex gap-1.5 bg-ink-800 border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`tab-button ${view === t.key ? 'tab-active' : 'tab-inactive'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAnon(!anon)}
          className="btn btn-secondary text-sm"
        >
          {anon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {anon ? 'Anonymous' : 'Show Names'}
        </button>
      </div>

      {/* Podium (top 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {demoLeaderboard.slice(0, 3).map((entry, idx) => {
          const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd visual order
          const actualEntry = demoLeaderboard[podiumOrder[idx]];
          const isFirst = actualEntry.rank === 1;
          return (
            <Card
              key={actualEntry.id}
              className={`text-center ${isFirst ? 'border-warning-500/20 bg-gradient-to-b from-warning-500/5 to-transparent' : ''} ${isFirst ? 'sm:scale-105' : ''}`}
            >
              <div className="flex justify-center mb-3">
                {rankIcon(actualEntry.rank)}
              </div>
              <StudentAvatar
                initials={anon ? '?' : actualEntry.avatarInitials}
                color={actualEntry.avatarColor}
                size="lg"
              />
              <p className="font-display font-semibold text-white mt-3">
                {anon ? `Student #${actualEntry.rank}` : actualEntry.displayName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Level {actualEntry.level}</p>
              <p className="text-lg font-mono font-bold text-accent-400 mt-2">
                {actualEntry.totalXP.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">XP</p>
            </Card>
          );
        })}
      </div>

      {/* Full table */}
      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-white/5">
          {demoLeaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${
                entry.isCurrentUser
                  ? 'bg-accent-600/10 border-l-2 border-accent-500'
                  : 'hover:bg-ink-800'
              }`}
            >
              <div className="w-8 text-center shrink-0">
                {rankIcon(entry.rank)}
              </div>
              <StudentAvatar
                initials={anon ? '?' : entry.avatarInitials}
                color={entry.avatarColor}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {anon ? `Student #${entry.rank}` : entry.displayName}
                  </p>
                  {entry.isCurrentUser && (
                    <span className="badge bg-accent-600/20 text-accent-300 text-[10px]">You</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Level {entry.level} • {!anon && `${entry.batch}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-bold text-white">
                  {entry.totalXP.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
