import { AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithGoogle,
    error,
    clearError,
  } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-md w-full rounded-2xl border border-gold-400/30 bg-graphite p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center overflow-hidden">
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-gold-400/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-line bg-elevated text-muted hover:text-ivory transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Emblem */}
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-400 mx-auto mb-4 shadow-[0_0_20px_rgba(208,180,119,0.25)]">
          <Lock className="h-7 w-7" />
        </div>

        {/* Header */}
        <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-semibold">
          AVENIR ARENA AUTHENTICATION
        </span>
        <h2 className="font-display text-2xl font-bold text-ivory mt-1 tracking-tight">
          Sign In to Continue
        </h2>
        <p className="text-xs text-muted mt-2 leading-relaxed">
          Sign in with your Google account to unlock the Games Hub, track Academic XP, compete on
          leaderboards, and save your Infinite Trace streaks.
        </p>

        {/* Toast Notification on Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs flex items-center justify-between gap-2 animate-fade-in text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Primary Action: Sleek Google Sign-In Button */}
        <div className="mt-6 space-y-3">
          <button
            onClick={loginWithGoogle}
            className="w-full py-3.5 px-4 rounded-xl border border-line-light bg-elevated/90 hover:border-gold-400 hover:bg-elevated hover:shadow-[0_0_20px_rgba(208,180,119,0.25)] text-ivory text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 group active:scale-[0.99]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="font-semibold text-sm">Sign in with Google</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-line text-center text-[11px] text-muted font-mono flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
          <span>Single Sign-On · Google Identity Services Verified</span>
        </div>
      </div>
    </div>
  );
}
