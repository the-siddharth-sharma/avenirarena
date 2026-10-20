import type { LeaderboardEntry, LeagueTier, StudentProfile, XPTransaction } from '@/types';
import { demoLeaderboard } from '@/data/demoData';
import { getWeekKey } from '@/data/progressData';

export interface LeagueConfig {
  id: LeagueTier;
  name: string;
  rankTier: number; // 1 to 5
  color: string;
  badgeBg: string;
  promotionCount: number; // Top N students promoted
  relegationCount: number; // Bottom N students relegated
  weeklyRewardXP: number; // Bonus XP on promotion
}

export const LEAGUE_CONFIGS: Record<LeagueTier, LeagueConfig> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze League',
    rankTier: 1,
    color: '#CD7F32',
    badgeBg: 'rgba(205, 127, 50, 0.14)',
    promotionCount: 3,
    relegationCount: 0, // Cannot be relegated from Bronze
    weeklyRewardXP: 50,
  },
  silver: {
    id: 'silver',
    name: 'Silver League',
    rankTier: 2,
    color: '#C4C5C1',
    badgeBg: 'rgba(196, 197, 193, 0.14)',
    promotionCount: 3,
    relegationCount: 2,
    weeklyRewardXP: 100,
  },
  gold: {
    id: 'gold',
    name: 'Gold League',
    rankTier: 3,
    color: '#D0B477',
    badgeBg: 'rgba(208, 180, 119, 0.16)',
    promotionCount: 3,
    relegationCount: 2,
    weeklyRewardXP: 150,
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum League',
    rankTier: 4,
    color: '#70B8D6',
    badgeBg: 'rgba(112, 184, 214, 0.16)',
    promotionCount: 2,
    relegationCount: 2,
    weeklyRewardXP: 250,
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond League',
    rankTier: 5,
    color: '#8AE8FF',
    badgeBg: 'rgba(138, 232, 255, 0.18)',
    promotionCount: 0, // Peak league
    relegationCount: 2,
    weeklyRewardXP: 400,
  },
};

export const LEAGUE_TIERS_ORDER: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const LEAGUE_STORAGE_KEY = 'avenir-arena-leagues-v1';

export interface StudentLeaguePreference {
  tier: LeagueTier;
  optedOut: boolean;
  anonymous: boolean;
  previousRank?: number;
}

interface PersistedLeagueStore {
  version: number;
  students: Record<string, StudentLeaguePreference>;
  rolloverHistory: Record<
    string,
    {
      processedAt: string;
      tierTransitions: Record<string, { from: LeagueTier; to: LeagueTier; rewardXP: number }>;
    }
  >;
}

function getInitialStore(): PersistedLeagueStore {
  const defaultStore: PersistedLeagueStore = {
    version: 1,
    students: {
      'stu-001': { tier: 'gold', optedOut: false, anonymous: false, previousRank: 4 },
      'stu-002': { tier: 'silver', optedOut: false, anonymous: false, previousRank: 8 },
      'stu-003': { tier: 'silver', optedOut: false, anonymous: false, previousRank: 3 },
      'stu-004': { tier: 'diamond', optedOut: false, anonymous: false, previousRank: 1 },
      'stu-005': { tier: 'platinum', optedOut: false, anonymous: false, previousRank: 5 },
    },
    rolloverHistory: {},
  };

  if (typeof window === 'undefined') return defaultStore;
  try {
    const raw = localStorage.getItem(LEAGUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && parsed.version === 1) {
        return parsed as PersistedLeagueStore;
      }
    }
  } catch {
    // Ignore parse error
  }
  return defaultStore;
}

function saveStore(store: PersistedLeagueStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

export function getStudentLeaguePref(studentId: string): StudentLeaguePreference {
  const store = getInitialStore();
  return (
    store.students[studentId] || {
      tier: 'gold',
      optedOut: false,
      anonymous: false,
      previousRank: 4,
    }
  );
}

export function updateStudentLeaguePref(
  studentId: string,
  changes: Partial<StudentLeaguePreference>
): StudentLeaguePreference {
  const store = getInitialStore();
  const current = getStudentLeaguePref(studentId);
  const updated = { ...current, ...changes };
  store.students[studentId] = updated;
  saveStore(store);
  return updated;
}

/**
 * Calculates countdown to end of academic competition week (Sunday 23:59:59 local).
 */
export function getWeekCountdown(now = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  weekKey: string;
} {
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const sundayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilSunday,
    23,
    59,
    59,
    999
  );

  const diffMs = Math.max(0, sundayEnd.getTime() - now.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    weekKey: getWeekKey(now),
  };
}

// Baseline demo weekly XP values for peer student simulation
const PEER_WEEKLY_XP_BASE: Record<string, number> = {
  'stu-001': 480, // Aria Chen
  'stu-002': 340, // Noah Williams
  'stu-003': 520, // Sofia Rivera
  'stu-004': 860, // Kai Patel
  'stu-005': 610, // Maya Okafor
  'lb-001': 860,  // Kai Patel
  'lb-002': 780,  // Sofia Rivera
  'lb-003': 690,  // Devon Kim
  'lb-004': 480,  // Aria Chen
  'lb-005': 610,  // Maya Okafor
  'lb-006': 540,  // Liam Foster
  'lb-007': 510,  // Zara Hussain
  'lb-008': 430,  // Noah Williams
  'lb-009': 390,  // Iris Tanaka
  'lb-010': 360,  // Eli Brooks
};

// Previous ranks for movement delta indicators
const PREVIOUS_RANKS_BASE: Record<string, number> = {
  'stu-001': 5,
  'stu-002': 9,
  'stu-003': 2,
  'stu-004': 1,
  'stu-005': 4,
  'lb-001': 1,
  'lb-002': 2,
  'lb-003': 4,
  'lb-004': 5,
  'lb-005': 4,
  'lb-006': 7,
  'lb-007': 6,
  'lb-008': 8,
  'lb-009': 10,
  'lb-010': 9,
};

export interface StandingsFilter {
  scope: 'weekly' | 'all-time';
  batchFilter: 'all' | 'my-batch';
  campusFilter: 'all' | string;
  leagueFilter: 'all' | LeagueTier;
}

export interface ArenaEntry extends LeaderboardEntry {
  zone: 'promotion' | 'safe' | 'relegation';
  zoneLabel: string;
}

/**
 * Builds deterministic, live competitive standings pulling from the centralized
 * student profiles and XP ledger.
 */
export function buildCompetitiveStandings(
  students: StudentProfile[],
  selectedStudent: StudentProfile,
  studentProgressTransactions: XPTransaction[],
  filters: StandingsFilter
): {
  entries: ArenaEntry[];
  totalCompetitors: number;
  currentStudentEntry: ArenaEntry | null;
  studentPref: StudentLeaguePreference;
} {
  const currentWeek = getWeekKey(new Date());
  const studentPref = getStudentLeaguePref(selectedStudent.id);

  // Compute live XP earned during the current week from actual transactions
  const liveWeeklyXP = studentProgressTransactions
    .filter((tx) => getWeekKey(new Date(tx.timestamp)) === currentWeek)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Map students from profile context
  const activeStudentMap = new Map<string, StudentProfile>();
  students.forEach((s) => activeStudentMap.set(s.id, s));

  // Map real active student profiles (only real registered cadets)
  const combinedEntries: LeaderboardEntry[] = students.map((student) => {
    const isActiveCurrent = student.id === selectedStudent.id;
    const effectiveXP = Number(student.totalXP ?? 0);
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

    return {
      id: student.id,
      rank: 0, // assigned after sorting
      displayName: isActiveCurrent && studentPref.anonymous ? 'Anonymous Scholar' : student.displayName,
      level: student.level || Math.max(1, Math.floor(effectiveXP / 100) + 1),
      totalXP: effectiveXP,
      weeklyXP: effectiveXP,
      previousRank: 0,
      avatarInitials: isActiveCurrent && studentPref.anonymous ? '?' : student.avatarInitials,
      avatarColor: student.avatarColor || '#D4AF37',
      batch: student.batch || '2025-2029',
      campus: student.campus || 'MSOT Ghaziabad',
      leagueTier: tier,
      isCurrentUser: isActiveCurrent,
      isDemo: false,
    };
  });

  // Filter if current student has opted out
  let filtered = combinedEntries;
  if (studentPref.optedOut) {
    filtered = filtered.filter((entry) => !entry.isCurrentUser);
  }

  // Apply User Filters
  if (filters.batchFilter === 'my-batch') {
    filtered = filtered.filter((e) => e.batch === selectedStudent.batch);
  }

  if (filters.campusFilter !== 'all') {
    filtered = filtered.filter((e) => e.campus === filters.campusFilter);
  }

  if (filters.leagueFilter !== 'all') {
    filtered = filtered.filter((e) => e.leagueTier === filters.leagueFilter);
  }

  // Deterministic Ranking Sort strictly by XP and Hardwork:
  // 1. Primary: XP score descending (weeklyXP if weekly, totalXP if all-time)
  // 2. Secondary: Hardwork tie-breaker (Level / Quests completed)
  // 3. Tertiary: Alphabetical display name
  filtered.sort((a, b) => {
    const scoreA = filters.scope === 'weekly' ? (a.weeklyXP ?? 0) : a.totalXP;
    const scoreB = filters.scope === 'weekly' ? (b.weeklyXP ?? 0) : b.totalXP;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.level !== a.level) return b.level - a.level;
    return a.displayName.localeCompare(b.displayName);
  });

  const totalCompetitors = filtered.length;

  // Determine Promotion & Relegation Zones
  const enrichedEntries: ArenaEntry[] = filtered.map((entry, index) => {
    const rank = index + 1;
    const rankChange = entry.previousRank ? entry.previousRank - rank : 0;
    const tier = entry.leagueTier || 'gold';
    const config = LEAGUE_CONFIGS[tier];

    let zone: ArenaEntry['zone'] = 'safe';
    let zoneLabel = 'Safe Zone';

    if (filters.scope === 'weekly') {
      if (rank <= config.promotionCount && tier !== 'diamond') {
        const nextTier = LEAGUE_TIERS_ORDER[config.rankTier];
        zone = 'promotion';
        zoneLabel = `Promotion Zone (to ${LEAGUE_CONFIGS[nextTier].name})`;
      } else if (rank > Math.max(config.promotionCount, totalCompetitors - config.relegationCount) && tier !== 'bronze') {
        const prevTier = LEAGUE_TIERS_ORDER[config.rankTier - 2];
        zone = 'relegation';
        zoneLabel = `Relegation Zone (to ${LEAGUE_CONFIGS[prevTier].name})`;
      }
    }

    return {
      ...entry,
      rank,
      rankChange,
      zone,
      zoneLabel,
    };
  });

  const currentStudentEntry = enrichedEntries.find((e) => e.isCurrentUser) || null;

  return {
    entries: enrichedEntries,
    totalCompetitors,
    currentStudentEntry,
    studentPref,
  };
}

/**
 * Idempotent weekly rollover simulation and execution.
 * Promotes top performers, relegates bottom performers, and awards promotion XP.
 * Guaranteed never to run twice for the same weekKey.
 */
export function executeWeeklyRollover(
  studentId: string,
  currentStandings: ArenaEntry[]
): {
  success: boolean;
  message: string;
  promoted: boolean;
  relegated: boolean;
  oldTier: LeagueTier;
  newTier: LeagueTier;
  rewardXP: number;
} {
  const store = getInitialStore();
  const currentWeek = getWeekKey(new Date());

  if (store.rolloverHistory[currentWeek]) {
    return {
      success: false,
      message: `Weekly rollover for competition period ${currentWeek} has already been finalized.`,
      promoted: false,
      relegated: false,
      oldTier: 'gold',
      newTier: 'gold',
      rewardXP: 0,
    };
  }

  const studentEntry = currentStandings.find((e) => e.id === studentId || e.isCurrentUser);
  const currentPref = getStudentLeaguePref(studentId);
  const oldTier = currentPref.tier;
  const config = LEAGUE_CONFIGS[oldTier];

  let newTier = oldTier;
  let promoted = false;
  let relegated = false;
  let rewardXP = 0;

  if (studentEntry) {
    if (studentEntry.zone === 'promotion' && config.rankTier < 5) {
      newTier = LEAGUE_TIERS_ORDER[config.rankTier]; // Next tier up
      promoted = true;
      rewardXP = config.weeklyRewardXP;
    } else if (studentEntry.zone === 'relegation' && config.rankTier > 1) {
      newTier = LEAGUE_TIERS_ORDER[config.rankTier - 2]; // Previous tier down
      relegated = true;
    }
  }

  // Update student preference with new tier and freeze last week's rank
  updateStudentLeaguePref(studentId, {
    tier: newTier,
    previousRank: studentEntry ? studentEntry.rank : currentPref.previousRank,
  });

  // Log in rollover history to guarantee idempotency
  store.rolloverHistory[currentWeek] = {
    processedAt: new Date().toISOString(),
    tierTransitions: {
      [studentId]: { from: oldTier, to: newTier, rewardXP },
    },
  };
  saveStore(store);

  let message = `Competition week ${currentWeek} finalized! Standings preserved.`;
  if (promoted) {
    message = `Congratulations! You placed rank #${studentEntry?.rank} and earned promotion to ${LEAGUE_CONFIGS[newTier].name} (+${rewardXP} XP award)!`;
  } else if (relegated) {
    message = `Competition concluded. You were placed in ${LEAGUE_CONFIGS[newTier].name} for the next cycle.`;
  }

  return {
    success: true,
    message,
    promoted,
    relegated,
    oldTier,
    newTier,
    rewardXP,
  };
}
