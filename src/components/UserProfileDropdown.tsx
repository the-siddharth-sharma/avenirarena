import { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StudentAvatar } from './StudentAvatar';

export function UserProfileDropdown() {
  const { currentUser, logout, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // If unauthenticated: render sleek "Sign in with Google" button
  if (!currentUser) {
    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-line bg-graphite hover:border-gold-400 hover:shadow-[0_0_15px_rgba(208,180,119,0.25)] text-ivory text-xs font-medium transition-all duration-200 group"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span className="font-semibold group-hover:text-gold-400 transition-colors">
          Sign In
        </span>
      </button>
    );
  }

  // Derive initials
  const initials = currentUser.displayName
    ? currentUser.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-lg border border-line hover:border-gold-400/50 hover:bg-elevated/40 transition-all text-left"
        title="Open Profile Options"
      >
        <StudentAvatar
          initials={initials}
          photoURL={currentUser.photoURL}
          size="sm"
          ring={isOpen}
        />
        <div className="hidden sm:block min-w-0 pr-1">
          <p className="text-xs font-semibold text-ivory truncate max-w-[120px]">
            {currentUser.displayName}
          </p>
          <p className="text-[10px] text-gold-400 font-mono">Authenticated</p>
        </div>
      </button>

      {/* Minimalist Profile Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line bg-graphite shadow-2xl z-50 animate-fade-in overflow-hidden p-1 text-left">
          {/* Header Info */}
          <div className="p-3 border-b border-line bg-elevated/50 rounded-lg mb-1">
            <div className="flex items-center gap-2.5 mb-2">
              <StudentAvatar
                initials={initials}
                photoURL={currentUser.photoURL}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ivory truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-[10px] text-muted truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gold-400 font-mono">
              <Shield className="h-3 w-3" />
              <span>Google Verified Student</span>
            </div>
          </div>

          {/* Account Details */}
          <div className="px-3 py-2 text-[11px] font-mono text-muted space-y-1">
            <div className="flex items-center justify-between">
              <span>Account UID:</span>
              <span className="text-ivory text-[10px] truncate max-w-[100px]">
                {currentUser.uid.slice(0, 14)}...
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Session:</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
          </div>

          <div className="h-px bg-line my-1" />

          {/* Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out of Google</span>
          </button>
        </div>
      )}
    </div>
  );
}
