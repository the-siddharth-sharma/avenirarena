import {
  LayoutDashboard,
  Gamepad2,
  Target,
  Trophy,
  User,
  Activity as ActivityIcon,
  GraduationCap,
  BrainCircuit,
  Users,
  Search,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Global Search', path: '/search', icon: Search },
  { label: 'Daily Quiz', path: '/quiz', icon: BrainCircuit },
  { label: 'Games', path: '/games', icon: Gamepad2 },
  { label: 'Quests', path: '/quests', icon: Target },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'Community', path: '/community', icon: Users },
  { label: 'Activity History', path: '/activity', icon: ActivityIcon },
  { label: 'Faculty Panel', path: '/faculty', icon: GraduationCap },
  { label: 'My Profile', path: '/profile', icon: User },
];
