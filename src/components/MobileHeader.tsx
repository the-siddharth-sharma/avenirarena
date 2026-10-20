import { Menu } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useStudentProfiles } from '@/students/StudentProfileContext';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onNavigate?: (path: string) => void;
}

export function MobileHeader({ onMenuClick, onNavigate }: MobileHeaderProps) {
  const { userProfile, currentUser } = useAuth();
  const { selectedStudent } = useStudentProfiles();

  const displayName =
    userProfile?.username ||
    currentUser?.displayName ||
    selectedStudent?.displayName ||
    'Cadet';
  const level = selectedStudent?.level || 1;

  return (
    <header className="lg:hidden sticky top-0 z-30 w-full bg-obsidian/95 backdrop-blur-md border-b border-line px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg bg-graphite border border-line text-muted hover:text-ivory active:scale-95 transition-all"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-ivory" />
        </button>

        <button
          onClick={() => onNavigate?.('/dashboard')}
          className="flex items-center gap-2 text-left truncate group"
          title="Go to Dashboard"
        >
          <Logo size={28} className="rounded-sm shrink-0" />
          <div className="truncate">
            <span className="font-display font-bold text-xs tracking-wide text-ivory block truncate group-hover:text-gold-400 transition-colors">
              AVENIR ARENA
            </span>
            <span className="text-[9px] font-mono text-gold-400 block -mt-0.5 truncate">
              LVL {level} · @{displayName}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
      </div>
    </header>
  );
}
