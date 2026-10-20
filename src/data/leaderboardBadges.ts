import type { LeaderboardBadgeTitle, StudentBadge } from '@/types';

export const LEADERBOARD_BADGES: Record<LeaderboardBadgeTitle, StudentBadge> = {
  'Consistent Player': {
    title: 'Consistent Player',
    label: 'Consistent Player',
    description: 'Active for 7+ consecutive days with verified daily streak and quest completions',
    icon: 'Flame',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  'Consistent Learning Growth': {
    title: 'Consistent Learning Growth',
    label: 'Consistent Growth',
    description: 'Achieved >30% weekly learning growth and knowledge expansion rate',
    icon: 'TrendingUp',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  'Master Learner': {
    title: 'Master Learner',
    label: 'Master Learner',
    description: 'Apex academic standing across core DSA topics and challenge modules',
    icon: 'Award',
    colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
};
