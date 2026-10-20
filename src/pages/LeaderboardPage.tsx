import { useEffect, useMemo, useState } from 'react';
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
  executeWeeklyRollover,
  getWeekCountdown,
  type ArenaEntry,
  type LeaderboardViewTab,
} from '@/engine/competitiveArena';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { fetchRealtimeCadets } from '@/firebaseConfig';

const LEADERBOARD_CACHE_KEY = 'avenir_leaderboard_cache_v1';

function getInitialLeaderboardEntries(): ArenaEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

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
  const { selectedStudent } = useStudentProfiles();
  const { currentUser, userProfile } = useAuth();

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

  // Dynamic Real-Time Leaderboard State (SWR cache for 0ms reload latency)
  const [firestoreEntries, setFirestoreEntries] = useState<ArenaEntry[]>(getInitialLeaderboardEntries);
  const [isLoading, setIsLoading] = useState<boolean>(() => getInitialLeaderboardEntries().length === 0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getWeekCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch top 10 users from Firestore ordered by academicXP descending
  // Real-time synchronization of users from Firestore & Global Search source, ranked by XP & Hardwork
  useEffect(() => {
    let isMounted = true;

    async function syncLeaderboard(cloudDocs?: any[]) {
      try {
        const cadetMap = new Map<string, any>();

        // 1. Process cloud docs if provided by onSnapshot
        if (cloudDocs && cloudDocs.length > 0) {
          cloudDocs.forEach((docSnap) => {
            const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
            const uid = docSnap.id || data.uid;
            if (!uid) return;
            const effectiveXP = Number(data.academicXP ?? data.xp ?? 0);
            const name =
              data.username ||
              data.displayName ||
              (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : `Cadet-${uid.slice(0, 4)}`);

            cadetMap.set(uid, {
              id: uid,
              uid,
              displayName: name,
              photoURL: data.photoURL || data.avatarUrl || '',
              avatarUrl: data.avatarUrl || data.photoURL || '',
              campus: data.campus || 'MSOT Ghaziabad',
              batch: data.batch || data.batchCohort || '2025-2029',
              academicXP: effectiveXP,
              xp: effectiveXP,
              gamesPlayed: Number(data.gamesPlayed || 0),
              streak: Number(data.infiniteTraceStreak || data.streak || 0),
              role: data.role || 'cadet',
            });
          });
        }

        // 2. Supplement from fetchRealtimeCadets() to ensure 100% parity with Global Search
        const searchCadets = await fetchRealtimeCadets();
        searchCadets.forEach((c) => {
          if (!cadetMap.has(c.uid)) {
            cadetMap.set(c.uid, {
              id: c.uid,
              uid: c.uid,
              displayName: c.displayName,
              photoURL: c.avatarUrl || c.photoURL || '',
              avatarUrl: c.avatarUrl || '',
              campus: c.campus || 'MSOT Ghaziabad',
              batch: c.batch || '2025-2029',
              academicXP: c.academicXP,
              xp: c.xp,
              gamesPlayed: c.gamesPlayed,
              streak: c.infiniteTraceStreak,
              role: c.role || 'cadet',
            });
          }
        });

        // 3. Ensure currently authenticated user is included with latest profile
        if (currentUser) {
          const currentXP = Number(userProfile?.academicXP ?? userProfile?.xp ?? 0);
          const currentName = userProfile?.username || currentUser.displayName || 'Cadet Operative';
          const existing = cadetMap.get(currentUser.uid) || {};
          cadetMap.set(currentUser.uid, {
            ...existing,
            id: currentUser.uid,
            uid: currentUser.uid,
            displayName: currentName,
            photoURL: userProfile?.avatarUrl || currentUser.photoURL || '',
            avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
            campus: userProfile?.campus || existing.campus || 'MSOT Ghaziabad',
            batch: userProfile?.batch || existing.batch || '2025-2029',
            academicXP: currentXP,
            xp: currentXP,
            gamesPlayed: Number(userProfile?.gamesPlayed ?? existing.gamesPlayed ?? 0),
            streak: Number(userProfile?.infiniteTraceStreak ?? existing.streak ?? 0),
            role: userProfile?.role || 'cadet',
          });
        }

        const allUsers = Array.from(cadetMap.values());

        // 4. Rank strictly per XP and Hardwork (Primary: XP, Secondary: Games/Quests completed, Tertiary: Streak)
        allUsers.sort((a, b) => {
          const xpA = Number(a.academicXP ?? a.xp ?? 0);
          const xpB = Number(b.academicXP ?? b.xp ?? 0);
          if (xpB !== xpA) {
            return xpB - xpA;
          }
          const gamesA = Number(a.gamesPlayed ?? 0);
          const gamesB = Number(b.gamesPlayed ?? 0);
          if (gamesB !== gamesA) {
            return gamesB - gamesA;
          }
          const streakA = Number(a.streak ?? 0);
          const streakB = Number(b.streak ?? 0);
          return streakB - streakA;
        });

        // 5. Map to ArenaEntry
        const mapped: ArenaEntry[] = allUsers.map((cadet, index) => {
          const rank = index + 1;
          const effectiveXP = Number(cadet.academicXP ?? cadet.xp ?? 0);
          const initials =
            cadet.displayName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'AA';

          const tier: LeagueTier =
            effectiveXP >= 5000
              ? 'diamond'
              : effectiveXP >= 2500
              ? 'platinum'
              : effectiveXP >= 1000
              ? 'gold'
              : effectiveXP >= 400
              ? 'silver'
              : 'bronze';

          const isUser = Boolean(
            currentUser &&
              (cadet.uid === currentUser.uid || cadet.id === currentUser.uid || cadet.email === currentUser.email)
          );

          return {
            id: cadet.uid || cadet.id,
            rank,
            rankChange: 0,
            displayName: cadet.displayName,
            avatarInitials: initials,
            avatarColor: '#D4AF37',
            campus: cadet.campus,
            batch: cadet.batch,
            level: Math.max(1, Math.floor(effectiveXP / 100) + 1),
            leagueTier: tier,
            weeklyXP: effectiveXP,
            totalXP: effectiveXP,
            isCurrentUser: isUser,
            isDemo: false,
            zone: rank <= 3 ? 'promotion' : rank >= 8 ? 'relegation' : 'safe',
            zoneLabel: rank <= 3 ? 'Promotion Zone' : rank >= 8 ? 'Relegation Risk' : 'Safe Tier',
            gamesPlayed: cadet.gamesPlayed,
            streak: cadet.streak,
          };
        });

        if (isMounted) {
          setFirestoreEntries(mapped);
          try {
            sessionStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(mapped));
          } catch {}
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[AVENIR ARENA LEADERBOARD] Sync error:', err);
        if (isMounted) setIsLoading(false);
      }

    }

    // Initial load
    syncLeaderboard();

    // Real-time Firestore snapshot listener
    let unsubscribe = () => {};
    try {
      const usersRef = collection(db, 'users');
      unsubscribe = onSnapshot(
        usersRef,
        (snap) => {
          syncLeaderboard(snap.docs);
        },
        (err) => {
          console.warn('[AVENIR ARENA LEADERBOARD] onSnapshot listener warning:', err);
        }
      );
    } catch (e) {
      console.warn('[AVENIR ARENA LEADERBOARD] Failed to attach onSnapshot:', e);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser, userProfile]);

  // Determine user's tier based on live Academic XP
  const effectiveXP = userProfile?.academicXP ?? userProfile?.xp ?? 0;
  const userTier: LeagueTier =
    effectiveXP >= 5000
      ? 'diamond'
      : effectiveXP >= 2500
      ? 'platinum'
      : effectiveXP >= 1000
      ? 'gold'
      : effectiveXP >= 400
      ? 'silver'
      : 'bronze';

  const [studentPref, setStudentPref] = useState({
    anonymous: false,
    optedOut: false,
    tier: userTier,
  });

  // Purely dynamic Firestore entries (ordered by academicXP descending)
  const baseEntries = useMemo(() => {
    return firestoreEntries.map((entry) => ({
      ...entry,
      isCurrentUser: Boolean(
        currentUser &&
          (entry.id === currentUser.uid ||
            (entry as any).uid === currentUser.uid ||
            (currentUser.email && (entry as any).email === currentUser.email))
      ),
    }));
  }, [firestoreEntries, currentUser]);
  const filteredEntries = baseEntries.filter((entry) => {
    if (campusFilter !== 'all' && entry.campus !== campusFilter) return false;
    if (leagueFilter !== 'all' && entry.leagueTier !== leagueFilter) return false;
    if (batchFilter === 'my-batch') {
      const myBatch = userProfile?.batch || selectedStudent?.batch || '';
      if (myBatch && !entry.batch.includes(myBatch.slice(0, 4))) return false;
    }
    return true;
  });

  const currentStudentEntry = filteredEntries.find((e) => e.isCurrentUser) || null;

  // Apply search query filter if provided
  const displayedEntries = searchQuery.trim()
    ? filteredEntries.filter(
        (e) =>
          e.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.campus.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredEntries;

  const toggleAnonymity = () => {
    setStudentPref((prev) => ({ ...prev, anonymous: !prev.anonymous }));
  };

  const toggleOptOut = () => {
    setStudentPref((prev) => ({ ...prev, optedOut: !prev.optedOut }));
  };

  const handleSimulateRollover = () => {
    const result = executeWeeklyRollover(currentUser?.uid || 'cadet', firestoreEntries);
    setRolloverNotice(result.message);
  };

  const currentTierConfig = LEAGUE_CONFIGS[userTier];

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
                initials={currentUser ? (userProfile?.username || currentUser.displayName || 'AA').slice(0, 2).toUpperCase() : (studentPref.anonymous ? '?' : selectedStudent.avatarInitials)}
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
                  {currentUser
                    ? (userProfile?.username || currentUser.displayName)
                    : (studentPref.anonymous ? 'Anonymous Scholar' : selectedStudent.displayName)}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {userProfile?.batch || selectedStudent.batch} • {userProfile?.campus || selectedStudent.campus}
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
              {filteredEntries.find((e) => e.isCurrentUser) || currentStudentEntry ? (
                (() => {
                  const myEntry = filteredEntries.find((e) => e.isCurrentUser) || currentStudentEntry;
                  const myXP = userProfile?.academicXP ?? userProfile?.xp ?? myEntry?.totalXP ?? 0;
                  return (
                    <>
                      <div className="flex sm:justify-end items-center gap-2">
                        <span className="text-2xl font-display font-bold text-ivory">
                          Rank #{myEntry?.rank ?? 'Top 10'}
                        </span>
                        {renderRankChange(myEntry?.rankChange ?? 0)}
                      </div>
                      <p className="text-xs font-mono text-gold-400 mt-0.5">
                        {myXP.toLocaleString()} Academic XP
                      </p>
                      <div className="mt-2">
                        <span
                          className={`badge text-[11px] ${
                            myEntry?.zone === 'promotion'
                              ? 'border border-gold-400/40 bg-gold-400/10 text-gold-400'
                              : myEntry?.zone === 'relegation'
                              ? 'border border-crimson-400/40 bg-crimson-400/10 text-crimson-400'
                              : 'border border-line bg-elevated text-muted'
                          }`}
                        >
                          {myEntry?.zone === 'promotion' && '↑ '}
                          {myEntry?.zone === 'relegation' && '↓ '}
                          {myEntry?.zoneLabel || 'Active Standing'}
                        </span>
                      </div>
                    </>
                  );
                })()
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
              <option value="MSOT Ghaziabad">MSOT Ghaziabad</option>
              <option value="MSOT Bangalore">MSOT Bangalore</option>
              <option value="MSOT Jaipur">MSOT Jaipur</option>
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

      {/* Sleek Futuristic Loading State & Dynamic Firestore Standings */}
      {isLoading ? (
        <Card className="py-20 my-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gold-400/30 bg-graphite/90 shadow-2xl">
          <div className="absolute inset-0 bg-radial-gradient from-gold-400/10 to-transparent pointer-events-none" />
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-full border-2 border-gold-400/20 border-t-gold-400 animate-spin shadow-lg shadow-gold-400/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-gold-400 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-gold-400 font-mono text-xs uppercase tracking-widest mb-1.5 font-semibold">
            <Sparkles className="w-4 h-4 animate-spin text-gold-400" />
            <span>Synchronizing Multiplayer Arena Standings</span>
          </div>
          <p className="text-sm font-display font-medium text-ivory">
            Querying Top 10 Contenders from Firestore
          </p>
          <p className="text-xs text-muted font-mono mt-1">
            Ordered strictly by Academic XP (descending)
          </p>
        </Card>
      ) : (
        <>
          {/* Podium (Top 3) */}
          {filteredEntries.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map((podiumIdx) => {
                const entry = filteredEntries[podiumIdx];
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
                      {entry.totalXP.toLocaleString()} XP
                    </p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">
                      Academic XP
                    </p>
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
                      onClick={() => {
                        window.location.hash = `/player/${entry.id}`;
                      }}
                      className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors cursor-pointer group ${
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
                              <p className="text-sm font-mono font-bold text-gold-400">
                                {scope === 'weekly'
                                  ? `+${(entry.weeklyXP ?? 0).toLocaleString()}`
                                  : entry.totalXP.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted">
                                {scope === 'weekly' ? 'weekly XP' : 'Academic XP'}
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
                    : 'No competitors have entered the arena rankings yet. Complete a learning quest or quiz to set the first score!'
                }
                icon={<Trophy className="w-8 h-8 text-gold-400" />}
              />
            </Card>
          )}
        </>
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
