import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Info,
  Medal,
  Minus,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StudentAvatar } from '@/components/StudentAvatar';
import { EmptyState } from '@/components/EmptyState';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { LeagueTier } from '@/types';
import {
  LEAGUE_CONFIGS,
  LEAGUE_TIERS_ORDER,
  buildCompetitiveStandings,
  executeWeeklyRollover,
  getWeekCountdown,
  updateStudentLeaguePref,
  type ArenaEntry,
} from '@/engine/competitiveArena';

export function LeaderboardPage() {
  const { students, selectedStudent, xpTransactions } = useStudentProfiles();

  // Filters
  const [scope, setScope] = useState<'weekly' | 'all-time'>('weekly');
  const [batchFilter, setBatchFilter] = useState<'all' | 'my-batch'>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<'all' | LeagueTier>('all');

  // Live countdown to Sunday midnight
  const [countdown, setCountdown] = useState(() => getWeekCountdown());

  // Rollover simulation message/modal state
  const [rolloverNotice, setRolloverNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getWeekCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Build reactive, live standings
  const { entries, totalCompetitors, currentStudentEntry, studentPref } = buildCompetitiveStandings(
    students,
    selectedStudent,
    xpTransactions,
    {
      scope,
      batchFilter,
      campusFilter,
      leagueFilter,
    }
  );

  const toggleAnonymity = () => {
    updateStudentLeaguePref(selectedStudent.id, {
      anonymous: !studentPref.anonymous,
    });
  };

  const toggleOptOut = () => {
    updateStudentLeaguePref(selectedStudent.id, {
      optedOut: !studentPref.optedOut,
    });
  };

  const handleSimulateRollover = () => {
    const result = executeWeeklyRollover(selectedStudent.id, entries);
    setRolloverNotice(result.message);
  };

  const currentTierConfig = LEAGUE_CONFIGS[studentPref.tier];

  // Helper for rank change indicator
  const renderRankChange = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-xs font-mono font-medium text-emerald-400" title={`Up ${change} positions`}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          +{change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center text-xs font-mono font-medium text-crimson-400" title={`Down ${Math.abs(change)} positions`}>
          <ArrowDownRight className="w-3.5 h-3.5" />
          {change}
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-mono text-muted" title="No rank change">
        <Minus className="w-3.5 h-3.5" />
      </span>
    );
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-gold-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-500" />;
    return <span className="font-display font-bold text-muted">{rank}</span>;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Competitive Arena"
        subtitle="Weekly leagues, deterministic peer rankings, and live academic standings."
      />

      {/* Demo transparency banner */}
      <div className="flex items-center justify-between gap-3 mb-6 text-xs text-muted bg-graphite border border-line rounded-md px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gold-400 shrink-0" />
          <span>
            Rankings combine live XP from your centralized ledger with verified cohort benchmarks. Privacy and opt-out are fully supported.
          </span>
        </div>
        <span className="badge bg-gold-400/10 text-gold-400 hidden sm:inline-block">Part 5: Arena Active</span>
      </div>

      {/* Rollover notice alert if triggered */}
      {rolloverNotice && (
        <div className="mb-6 p-4 rounded-md border border-gold-400/40 bg-gold-400/10 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gold-400 shrink-0" />
            <p className="text-sm font-medium text-ivory">{rolloverNotice}</p>
          </div>
          <button
            onClick={() => setRolloverNotice(null)}
            className="text-xs text-muted hover:text-ivory uppercase tracking-wider font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Student League Status & Weekly Countdown Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Cols: My League & Zone Status */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"
            style={{ backgroundColor: `${currentTierConfig.color}15` }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <StudentAvatar
                initials={studentPref.anonymous ? '?' : selectedStudent.avatarInitials}
                color={selectedStudent.avatarColor}
                size="xl"
                ring
              />
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="badge text-xs font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: currentTierConfig.badgeBg,
                      color: currentTierConfig.color,
                      border: `1px solid ${currentTierConfig.color}40`,
                    }}
                  >
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    {currentTierConfig.name}
                  </span>
                  {studentPref.anonymous && (
                    <span className="badge bg-elevated text-muted text-[10px]">Anonymous</span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-display font-bold text-ivory mt-1">
                  {studentPref.anonymous ? 'Anonymous Scholar' : selectedStudent.displayName}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {selectedStudent.batch} • {selectedStudent.campus}
                </p>
              </div>
            </div>

            {/* Position & Zone Status */}
            <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-line">
              {currentStudentEntry ? (
                <>
                  <div className="flex sm:justify-end items-center gap-2">
                    <span className="text-2xl font-display font-bold text-ivory">
                      Rank #{currentStudentEntry.rank}
                    </span>
                    {renderRankChange(currentStudentEntry.rankChange ?? 0)}
                  </div>
                  <p className="text-xs font-mono text-gold-400 mt-0.5">
                    {scope === 'weekly' ? `${currentStudentEntry.weeklyXP} XP this week` : `${currentStudentEntry.totalXP.toLocaleString()} Lifetime XP`}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`badge text-[11px] ${
                        currentStudentEntry.zone === 'promotion'
                          ? 'border border-gold-400/40 bg-gold-400/10 text-gold-400'
                          : currentStudentEntry.zone === 'relegation'
                          ? 'border border-crimson-400/40 bg-crimson-400/10 text-crimson-400'
                          : 'border border-line bg-elevated text-muted'
                      }`}
                    >
                      {currentStudentEntry.zone === 'promotion' && '↑ '}
                      {currentStudentEntry.zone === 'relegation' && '↓ '}
                      {currentStudentEntry.zoneLabel}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted">
                  <p>You are currently opted out of public rankings.</p>
                  <button onClick={toggleOptOut} className="btn btn-primary text-xs mt-2">
                    Re-enter Arena
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right Col: Weekly Countdown & Rollover Simulation */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-line">
              <span className="section-label text-gold-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Weekly Period
              </span>
              <span className="font-mono text-xs text-muted">{countdown.weekKey}</span>
            </div>

            <p className="text-xs text-muted">Competition cycle concludes Sunday 23:59:</p>
            <div className="grid grid-cols-4 gap-2 text-center mt-3">
              <div className="p-2 rounded bg-elevated border border-line">
                <p className="font-mono text-base font-bold text-ivory">{countdown.days}</p>
                <p className="text-[10px] text-muted uppercase">Days</p>
              </div>
              <div className="p-2 rounded bg-elevated border border-line">
                <p className="font-mono text-base font-bold text-ivory">{countdown.hours}</p>
                <p className="text-[10px] text-muted uppercase">Hours</p>
              </div>
              <div className="p-2 rounded bg-elevated border border-line">
                <p className="font-mono text-base font-bold text-ivory">{countdown.minutes}</p>
                <p className="text-[10px] text-muted uppercase">Mins</p>
              </div>
              <div className="p-2 rounded bg-elevated border border-line">
                <p className="font-mono text-base font-bold text-gold-400">{countdown.seconds}</p>
                <p className="text-[10px] text-muted uppercase">Secs</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
            <span className="text-[11px] text-muted">Safe Rollover Mechanism</span>
            <button
              onClick={handleSimulateRollover}
              className="btn btn-secondary text-xs px-2.5 py-1.5"
              title="Test end-of-week promotion/relegation transition (idempotent, once per week)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Finalize Week
            </button>
          </div>
        </Card>
      </div>

      {/* Control Bar: Filters, Scope, and Privacy Settings */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Scope Toggle: Weekly vs All-Time */}
          <div className="flex items-center gap-1.5 p-1 rounded-md bg-graphite border border-line w-fit">
            <button
              onClick={() => setScope('weekly')}
              className={`tab-button text-xs ${scope === 'weekly' ? 'tab-active' : 'tab-inactive'}`}
            >
              Weekly Rankings
            </button>
            <button
              onClick={() => setScope('all-time')}
              className={`tab-button text-xs ${scope === 'all-time' ? 'tab-active' : 'tab-inactive'}`}
            >
              All-Time Rankings
            </button>
          </div>

          {/* Dimension Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Batch Filter */}
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value as 'all' | 'my-batch')}
              className="bg-elevated border border-line rounded px-2.5 py-1.5 text-xs text-ivory outline-none focus:border-gold-400 cursor-pointer"
              aria-label="Filter by Batch"
            >
              <option value="all">All Batches</option>
              <option value="my-batch">My Batch ({selectedStudent.batch.split('—')[0].trim()})</option>
            </select>

            {/* Campus Filter */}
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="bg-elevated border border-line rounded px-2.5 py-1.5 text-xs text-ivory outline-none focus:border-gold-400 cursor-pointer"
              aria-label="Filter by Campus"
            >
              <option value="all">All Campuses</option>
              <option value="Mirai School Ghaziabad">Mirai School Ghaziabad</option>
              <option value="Mirai School Bangalore">Mirai School Bangalore</option>
              <option value="Mirai School Jaipur">Mirai School Jaipur</option>
            </select>

            {/* League Tier Filter */}
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value as 'all' | LeagueTier)}
              className="bg-elevated border border-line rounded px-2.5 py-1.5 text-xs text-ivory outline-none focus:border-gold-400 cursor-pointer"
              aria-label="Filter by League Tier"
            >
              <option value="all">All Leagues</option>
              {LEAGUE_TIERS_ORDER.map((tier) => (
                <option key={tier} value={tier}>
                  {LEAGUE_CONFIGS[tier].name}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy & Opt-Out Controls */}
          <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
            <button
              onClick={toggleAnonymity}
              className={`btn text-xs px-3 py-1.5 ${studentPref.anonymous ? 'btn-primary' : 'btn-secondary'}`}
              title="Mask your name on the public arena board"
            >
              {studentPref.anonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {studentPref.anonymous ? 'Anonymous' : 'Public Name'}
            </button>

            <button
              onClick={toggleOptOut}
              className={`btn text-xs px-3 py-1.5 ${studentPref.optedOut ? 'btn-secondary text-crimson-400' : 'btn-secondary'}`}
              title="Toggle public arena participation without losing any XP"
            >
              {studentPref.optedOut ? 'Opted Out' : 'Active'}
            </button>
          </div>
        </div>
      </Card>

      {/* Opted-out warning banner if student hidden */}
      {studentPref.optedOut && (
        <Card className="mb-6 p-4 border-dashed border-line">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-muted shrink-0" />
              <div>
                <p className="text-sm font-medium text-ivory">Arena Visibility: Inactive</p>
                <p className="text-xs text-muted mt-0.5">
                  Your profile is currently hidden from competitive leaderboards. Your academic XP and learning progress are safe and never deducted.
                </p>
              </div>
            </div>
            <button onClick={toggleOptOut} className="btn btn-primary text-xs shrink-0">
              Rejoin Leaderboard
            </button>
          </div>
        </Card>
      )}

      {/* Podium (Top 3) */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = entries[podiumIdx];
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            const tierConfig = LEAGUE_CONFIGS[entry.leagueTier || 'gold'];

            return (
              <Card
                key={entry.id}
                className={`text-center ${
                  isFirst
                    ? 'border-gold-400/40 bg-gradient-to-b from-gold-400/10 to-transparent sm:scale-105 z-10'
                    : ''
                }`}
              >
                <div className="flex justify-center mb-2.5">{rankIcon(entry.rank)}</div>

                <div className="flex justify-center">
                  <StudentAvatar initials={entry.avatarInitials} color={entry.avatarColor} size="lg" />
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <p className="font-display font-semibold text-ivory truncate">{entry.displayName}</p>
                  {entry.isCurrentUser && (
                    <span className="badge bg-gold-400/20 text-gold-400 text-[9px]">You</span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: tierConfig.badgeBg, color: tierConfig.color }}
                  >
                    {tierConfig.name.split(' ')[0]}
                  </span>
                  <span className="text-xs text-muted">Lvl {entry.level}</span>
                  {renderRankChange(entry.rankChange ?? 0)}
                </div>

                <p className="text-xl font-mono font-bold text-gold-400 mt-2.5">
                  {scope === 'weekly' ? `+${entry.weeklyXP} XP` : `${entry.totalXP.toLocaleString()} XP`}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  {scope === 'weekly' ? 'This Week' : 'Lifetime Total'}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Standings Table */}
      {entries.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line bg-elevated px-4 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
            <div className="flex items-center gap-4">
              <span className="w-12 text-center">Rank</span>
              <span>Competitor</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-12">
              <span className="hidden md:inline">Tier & Zone</span>
              <span className="w-24 text-right">
                {scope === 'weekly' ? 'Weekly XP' : 'Total XP'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-line">
            {entries.map((entry) => {
              const tierConfig = LEAGUE_CONFIGS[entry.leagueTier || 'gold'];

              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    window.location.hash = `/player/${entry.id}`;
                  }}
                  className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors cursor-pointer group ${
                    entry.isCurrentUser
                      ? 'bg-gold-400/10 border-l-4 border-gold-400'
                      : 'hover:bg-elevated'
                  }`}
                >
                  {/* Left: Rank & Competitor */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 flex flex-col items-center justify-center shrink-0">
                      {rankIcon(entry.rank)}
                      <div className="mt-0.5">{renderRankChange(entry.rankChange ?? 0)}</div>
                    </div>

                    <StudentAvatar initials={entry.avatarInitials} color={entry.avatarColor} size="md" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ivory truncate">{entry.displayName}</p>
                        {entry.isCurrentUser && (
                          <span className="badge bg-gold-400/20 text-gold-400 text-[10px]">You</span>
                        )}
                        {entry.isDemo && (
                          <span className="text-[9px] font-mono text-muted/60 uppercase">Cohort</span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        Level {entry.level} • {entry.batch} • {entry.campus}
                      </p>
                    </div>
                  </div>

                  {/* Right: Zone & XP */}
                  <div className="flex items-center gap-6 sm:gap-12 shrink-0">
                    {/* Zone Badge (on md+ screens) */}
                    <div className="hidden md:flex flex-col items-end">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: tierConfig.badgeBg, color: tierConfig.color }}
                      >
                        {tierConfig.name}
                      </span>
                      {scope === 'weekly' && (
                        <span
                          className={`text-[10px] font-mono mt-0.5 ${
                            entry.zone === 'promotion'
                              ? 'text-gold-400'
                              : entry.zone === 'relegation'
                              ? 'text-crimson-400'
                              : 'text-muted'
                          }`}
                        >
                          {entry.zone === 'promotion' && '▲ Promotes'}
                          {entry.zone === 'relegation' && '▼ Relegates'}
                          {entry.zone === 'safe' && '• Holds'}
                        </span>
                      )}
                    </div>

                    {/* XP Score */}
                    <div className="text-right w-24">
                      <p className="text-sm font-mono font-bold text-ivory">
                        {scope === 'weekly'
                          ? `+${(entry.weeklyXP ?? 0).toLocaleString()}`
                          : entry.totalXP.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted">
                        {scope === 'weekly' ? 'weekly' : 'all-time'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="No players yet"
            message="No competitors have entered the arena rankings yet. Complete a learning quest or quiz to set the first score!"
            icon={<Trophy className="w-8 h-8 text-gold-400" />}
          />
        </Card>
      )}

      {/* League Tiers Legend Card */}
      <Card className="mt-6 p-4">
        <p className="section-label text-gold-400 mb-3">Arena League Hierarchy</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {LEAGUE_TIERS_ORDER.map((tier) => {
            const conf = LEAGUE_CONFIGS[tier];
            const isCurrent = studentPref.tier === tier;

            return (
              <div
                key={tier}
                className={`p-3 rounded border text-center transition-all ${
                  isCurrent
                    ? 'border-gold-400 bg-gold-400/10 shadow-sm'
                    : 'border-line bg-graphite'
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: conf.color }} />
                <p className="text-xs font-semibold text-ivory">{conf.name}</p>
                <p className="text-[10px] text-muted mt-1">
                  {conf.promotionCount > 0 ? `Top ${conf.promotionCount} promote` : 'Apex Tier'}
                </p>
                {isCurrent && (
                  <span className="badge bg-gold-400/20 text-gold-400 text-[9px] mt-2">
                    Current League
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
