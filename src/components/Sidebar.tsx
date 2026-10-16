import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { navItems } from '@/data/navItems';
import { StudentAvatar } from './StudentAvatar';
import { Logo } from './Logo';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPath, onNavigate, isOpen, onClose }: SidebarProps) {
  const { selectedStudent } = useStudentProfiles();
  const { currentUser, userProfile, openAuthModal } = useAuth();

  // Persistent collapsible state across route changes
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('avenir-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('avenir-sidebar-collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleNav = (path: string) => {
    onNavigate(path);
    onClose();
  };

  const displayName = userProfile?.username || currentUser?.displayName || selectedStudent.displayName;
  const avatarUrl = userProfile?.avatarUrl || currentUser?.photoURL;
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-obsidian border-r border-line flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand & Collapse Toggle */}
        <div
          className={`flex items-center px-4 py-5 border-b border-line ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="text-gold-400 shrink-0 cursor-pointer"
              onClick={() => handleNav('/dashboard')}
              title="AVENIR ARENA"
            >
              <Logo size={isCollapsed ? 36 : 40} className="rounded-sm" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="font-display font-medium text-ivory text-[15px] leading-tight tracking-tight truncate">
                  AVENIR ARENA
                </h1>
                <p className="text-[10px] text-muted tracking-wide truncate">by Quasar</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-md text-muted hover:text-gold-400 hover:bg-elevated/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden text-muted hover:text-ivory">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {!isCollapsed && (
            <p className="px-3 mb-2 section-label text-[10px] text-muted uppercase tracking-wider">
              Arena
            </p>
          )}

          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              if (isCollapsed) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    title={item.label}
                    className={`relative w-full flex items-center justify-center py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gold-400/10 text-gold-400 border border-gold-400/30'
                        : 'text-muted hover:text-ivory hover:bg-elevated/60'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(208,180,119,0.8)]" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`nav-item w-full text-left ${
                    isActive ? 'nav-item-active' : 'nav-item-inactive'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Student / User Card at Bottom */}
        <div className="px-3 pb-4 border-t border-line/60 pt-3">
          {isCollapsed ? (
            <div
              onClick={() => handleNav('/profile')}
              className="flex justify-center cursor-pointer p-1 rounded-lg hover:bg-elevated transition-colors"
              title={`${displayName} (${userProfile?.campus || 'Cadet'})`}
            >
              <StudentAvatar
                initials={initials}
                photoURL={avatarUrl}
                color={selectedStudent.avatarColor}
                size="sm"
                ring={true}
              />
            </div>
          ) : (
            <div className="bg-graphite border border-line rounded-md p-3">
              <div
                onClick={() => handleNav('/profile')}
                className="flex items-center gap-3 mb-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <StudentAvatar
                  initials={initials}
                  photoURL={avatarUrl}
                  color={selectedStudent.avatarColor}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ivory truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {userProfile?.campus
                      ? userProfile.campus
                      : currentUser
                      ? currentUser.email
                      : `Level ${selectedStudent.level}`}
                  </p>
                </div>
              </div>
              {currentUser ? (
                <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] font-mono text-gold-400">
                  <span>{userProfile ? `${userProfile.year} Year` : 'Operative'}</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="w-full text-center text-[11px] font-mono py-1 rounded bg-elevated hover:bg-elevated-light text-gold-400 transition-colors"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
