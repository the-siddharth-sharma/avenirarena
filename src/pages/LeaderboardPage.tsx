import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Info,
  Medal,
  Minus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StudentAvatar } from '@/components/StudentAvatar';
import { EmptyState } from '@/components/EmptyState';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { LeagueTier, StudentBadge } from '@/types';
import { LEADERBOARD_BADGES } from '@/data/leaderboardBadges';
import {
  LEAGUE_CONFIGS,
  LEAGUE_TIERS_ORDER,
  buildCompetitiveStandings,
  executeWeeklyRollover,
  getWeekCountdown,
  updateStudentLeaguePref,
  type ArenaEntry,
  type LeaderboardViewTab,
} from '@/engine/competitiveArena';

function renderBadgeIcon(icon: string) {
  switch (icon) {
    case 'Flame':
      return <Flame className="w-3 h-3 text-amber-400 shrink-0" />;
    case 'TrendingUp':
      return <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />;
    case 'Award':
      return <Award className="w-3 h-3 text-purple-400 shrink-0" />;
    default:
      return <Sparkles className="w-3 h-3 text-gold-400 shrink-0" />;
  }
}

interface BadgeChipProps {
  badge: StudentBadge;
  isHighlighted?: boolean;
  size?: 'sm' | 'xs';
}

function BadgeChip({ badge, isHighlighted = false, size = 'xs' }: BadgeChipProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]';
  const highlightClass = isHighlighted
    ? 'ring-1 ring-current shadow-sm scale-105'
    : 'opacity-90 hover:opacity-100';

  return (
    <span
      title={`${badge.title} — ${badge.description}`}
      className={`inline-flex items-center gap-1 rounded-full font-medium border transition-all ${badge.colorClass} ${sizeClass} ${highlightClass}`}
    >
      {renderBadgeIcon(badge.icon)}
      <span className="truncate max-w-[130px]">{badge.label}</span>
    </span>
  );
}

export function LeaderboardPage() {
  const { students, selectedStudent, xpTransactions } = useStudentProfiles();

  // Active Category View Tab
  const [activeTab, setActiveTab] = useState<LeaderboardViewTab>('overall');

  // Filters & Search
  const [scope, setScope] = useState<'weekly' | 'all-time'>('weekly');
  const [batchFilter, setBatchFilter] = useState<'all' | 'my-batch'>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<'all' | LeagueTier>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Build reactive, live standings sorted by active category tab
  const { entries, currentStudentEntry, studentPref } = buildCompetitiveStandings(
    students,
    selectedStudent,
    xpTransactions,
    {
      scope,
      batchFilter,
      campusFilter,
      leagueFilter,
      metricTab: activeTab,
    }
  );

  // Apply search query filter if provided
  const displayedEntries = searchQuery.trim()
    ? entries.filter(
        (e) =>
          e.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.campus.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

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
        <span
          className="flex items-center text-xs font-mono font-medium text-emerald-400"
          title={`Up ${change} positions`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          +{change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span
          className="flex items-center text-xs font-mono font-medium text-crimson-400"
          title={`Down ${Math.abs(change)} positions`}
        >
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
        subtitle="Weekly leagues, Title Badge honorifics, and multi-metric academic standings."
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
            <div className="flex items-start sm:items-center gap-4">
              <StudentAvatar
                initials={studentPref.anonymous ? '?' : selectedStudent.avatarInitials}
                color={selectedStudent.avatarColor}
                size="xl"
                ring
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
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

                {/* Active Student Badges */}
                {selectedStudent.badges && selectedStudent.badges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {selectedStudent.badges.map((badge) => (
                      <BadgeChip
                        key={badge.title}
                        badge={badge}
                        size="xs"
                        isHighlighted={
                          (activeTab === 'consistent-player' && badge.title === 'Consistent Player') ||
                          (activeTab === 'learning-growth' && badge.title === 'Consistent Learning Growth')
                        }
                      />
                    ))}
                  </div>
                )}
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
                    {activeTab === 'consistent-player'
                      ? `🔥 ${currentStudentEntry.streakDays ?? currentStudentEntry.streak ?? 0} Day Streak`
                      : activeTab === 'learning-growth'
                      ? `📈 +${currentStudentEntry.weeklyGrowthPct ?? 0}% Growth Rate`
                      : scope === 'weekly'
                      ? `${currentStudentEntry.weeklyXP} XP this week`
                      : `${currentStudentEntry.totalXP.toLocaleString()} Lifetime XP`}
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
              <option value="North Campus">North Campus</option>
              <option value="South Campus">South Campus</option>
              <option value="East Campus">East Campus</option>
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

      {/* Metric Categories Switcher Tabs & Competitor Search */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-md border border-line bg-graphite p-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('overall')}
            className={`tab-button flex items-center gap-2 text-xs font-semibold ${
              activeTab === 'overall' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-gold-400" />
            <span>Overall XP Ranking</span>
          </button>

          <button
            onClick={() => setActiveTab('consistent-player')}
            className={`tab-button flex items-center gap-2 text-xs font-semibold ${
              activeTab === 'consistent-player' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Consistent Player</span>
          </button>

          <button
            onClick={() => setActiveTab('learning-growth')}
            className={`tab-button flex items-center gap-2 text-xs font-semibold ${
              activeTab === 'learning-growth' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consistent Learning Growth</span>
          </button>
        </div>

        {/* Competitor Search */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search competitor by name/campus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-graphite border border-line rounded-md pl-9 pr-3 py-1.5 text-xs text-ivory placeholder:text-muted/60 outline-none focus:border-gold-400 transition-colors"
            aria-label="Search competitors"
          />
        </div>
      </div>

      {/* View Category Context Banner */}
      <div className="mb-6 flex items-center justify-between gap-3 p-3 rounded-md bg-graphite border border-line text-xs">
        <div className="flex items-center gap-2">
          {activeTab === 'consistent-player' ? (
            <>
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-ivory font-medium">Consistent Player Board: </span>
                <span className="text-muted">
                  Recognizes habit constancy and daily study rhythm. Ranked by consecutive active study streak and daily completion history.
                </span>
              </div>
            </>
          ) : activeTab === 'learning-growth' ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-ivory font-medium">Consistent Learning Growth Board: </span>
                <span className="text-muted">
                  Celebrates learning velocity and academic acceleration. Ranked by XP progression rate (%) compared to previous cycle.
                </span>
              </div>
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
              <div>
                <span className="text-ivory font-medium">Overall XP Board: </span>
                <span className="text-muted">
                  Global cohort standings based on total experience accumulated across quests, daily quizzes, and code challenges.
                </span>
              </div>
            </>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted uppercase hidden lg:inline-block shrink-0">
          {displayedEntries.length} {displayedEntries.length === 1 ? 'competitor' : 'competitors'}
        </span>
      </div>

      {/* Podium (Top 3) for Current View */}
      {displayedEntries.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = displayedEntries[podiumIdx];
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

                {/* Metric Display according to active view */}
                <div className="mt-2.5">
                  {activeTab === 'consistent-player' ? (
                    <p className="text-xl font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5" />
                      {entry.streakDays ?? entry.streak ?? 0} Days
                    </p>
                  ) : activeTab === 'learning-growth' ? (
                    <p className="text-xl font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-5 h-5" />
                      +{entry.weeklyGrowthPct ?? 0}%
                    </p>
                  ) : (
                    <p className="text-xl font-mono font-bold text-gold-400">
                      {scope === 'weekly' ? `+${entry.weeklyXP} XP` : `${entry.totalXP.toLocaleString()} XP`}
                    </p>
                  )}
                  <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                    {activeTab === 'consistent-player'
                      ? 'Active Study Streak'
                      : activeTab === 'learning-growth'
                      ? 'Knowledge Growth Rate'
                      : scope === 'weekly'
                      ? 'This Week'
                      : 'Lifetime Total'}
                  </p>
                </div>

                {/* Podium Title Badges */}
                {entry.badges && entry.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {entry.badges.map((b) => (
                      <BadgeChip
                        key={b.title}
                        badge={b}
                        isHighlighted={
                          (activeTab === 'consistent-player' && b.title === 'Consistent Player') ||
                          (activeTab === 'learning-growth' && b.title === 'Consistent Learning Growth')
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Standings Table */}
      {displayedEntries.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line bg-elevated px-4 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
            <div className="flex items-center gap-4">
              <span className="w-12 text-center">Rank</span>
              <span>Competitor & Title Badges</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-12">
              <span className="hidden md:inline">Tier & Zone</span>
              <span className="w-28 text-right">
                {activeTab === 'consistent-player'
                  ? '🔥 Streak'
                  : activeTab === 'learning-growth'
                  ? '📈 Growth %'
                  : scope === 'weekly'
                  ? 'Weekly XP'
                  : 'Total XP'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-line">
            {displayedEntries.map((entry) => {
              const tierConfig = LEAGUE_CONFIGS[entry.leagueTier || 'gold'];

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-gold-400/10 border-l-4 border-gold-400'
                      : 'hover:bg-elevated'
                  }`}
                >
                  {/* Left: Rank & Competitor Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 flex flex-col items-center justify-center shrink-0">
                      {rankIcon(entry.rank)}
                      <div className="mt-0.5">{renderRankChange(entry.rankChange ?? 0)}</div>
                    </div>

                    <StudentAvatar initials={entry.avatarInitials} color={entry.avatarColor} size="md" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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

                      {/* Active Title Badges */}
                      {entry.badges && entry.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {entry.badges.map((b) => (
                            <BadgeChip
                              key={b.title}
                              badge={b}
                              isHighlighted={
                                (activeTab === 'consistent-player' && b.title === 'Consistent Player') ||
                                (activeTab === 'learning-growth' && b.title === 'Consistent Learning Growth')
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Zone & Metric Column */}
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

                    {/* Metric Column */}
                    <div className="text-right w-28">
                      {activeTab === 'consistent-player' ? (
                        <>
                          <p className="text-sm font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            {entry.streakDays ?? entry.streak ?? 0} Days
                          </p>
                          <p className="text-[10px] text-muted">active streak</p>
                        </>
                      ) : activeTab === 'learning-growth' ? (
                        <>
                          <p className="text-sm font-mono font-bold text-emerald-400 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{entry.weeklyGrowthPct ?? 0}%
                          </p>
                          <p className="text-[10px] text-muted">vs last cycle</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-mono font-bold text-ivory">
                            {scope === 'weekly'
                              ? `+${(entry.weeklyXP ?? 0).toLocaleString()}`
                              : entry.totalXP.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted">
                            {scope === 'weekly' ? 'weekly' : 'all-time'}
                          </p>
                        </>
                      )}
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
            title="No competitors found"
            message={
              searchQuery.trim()
                ? `No students matching "${searchQuery}" found in the selected filter criteria.`
                : 'No students match the selected batch or campus filter criteria.'
            }
            icon={<Trophy className="w-6 h-6 text-muted" />}
          />
        </Card>
      )}

      {/* Title Badge System Legend Card */}
      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line">
          <p className="section-label text-gold-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Title Badge Honorifics
          </p>
          <span className="text-[11px] text-muted font-mono">Achievement Titles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(LEADERBOARD_BADGES).map((badge) => (
            <div
              key={badge.title}
              className="p-3 rounded border border-line bg-graphite flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <BadgeChip badge={badge} size="sm" isHighlighted />
                </div>
                <p className="text-xs text-ivory font-medium mt-2">{badge.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{badge.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
                <span>Qualification</span>
                <span className="font-mono text-gold-400">
                  {badge.title === 'Consistent Player'
                    ? 'Streak ≥ 7 Days'
                    : badge.title === 'Consistent Learning Growth'
                    ? 'Cycle Growth ≥ 30%'
                    : 'Level ≥ 15 & Top 10%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
