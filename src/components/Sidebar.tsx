import { X } from 'lucide-react';
import { navItems } from '@/data/navItems';
import { StudentAvatar } from './StudentAvatar';
import { XPProgressBar } from './XPProgressBar';
import { Logo } from './Logo';
import { useStudentProfiles } from '@/students/StudentProfileContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPath, onNavigate, isOpen, onClose }: SidebarProps) {
  const { selectedStudent } = useStudentProfiles();

  const handleNav = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-obsidian border-r border-line flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="text-gold-400">
              <Logo size={44} className="rounded-sm" />
            </div>
            <div>
              <h1 className="font-display font-medium text-ivory text-[15px] leading-tight tracking-tight">
                AVENIR ARENA
              </h1>
              <p className="text-[10px] text-muted tracking-wide">by Quasar</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted hover:text-ivory">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <p className="px-3 mb-2 section-label">
            Arena
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Student card */}
        <div className="px-3 pb-4">
          <div className="bg-graphite border border-line rounded-md p-3">
            <div className="flex items-center gap-3 mb-2.5">
              <StudentAvatar
                initials={selectedStudent.avatarInitials}
                color={selectedStudent.avatarColor}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ivory truncate">{selectedStudent.displayName}</p>
                <p className="text-xs text-muted">Level {selectedStudent.level}</p>
              </div>
            </div>
            <XPProgressBar
              current={selectedStudent.currentLevelXP}
              max={selectedStudent.nextLevelXP}
              showLabels={false}
              height="sm"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
