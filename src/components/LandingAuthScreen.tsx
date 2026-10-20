import { useState } from 'react';
import {
  Gamepad2,
  Sparkles,
  Shield,
  Flame,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Lock,
  X,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';

export function LandingAuthScreen() {
  const { loginWithGoogle, error, loading, clearError } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    // Strict credential validation per architecture requirements
    if (
      adminEmail.trim().toLowerCase() === 'siddharthsharma2649@gmail.com' &&
      adminPassword === '12345678'
    ) {
      sessionStorage.setItem('avenir_admin_session', 'true');
      sessionStorage.setItem('avenir_admin_email', 'siddharthsharma2649@gmail.com');
      setShowAdminModal(false);
      window.location.hash = '/admin';
    } else {
      setAdminError('Access Denied: Invalid administrator credentials.');
    }
  };

  return (
    <div className="relative min-h-screen bg-obsidian text-ivory flex flex-col justify-between overflow-hidden selection:bg-gold-400 selection:text-obsidian">
      {/* Sci-Fi Background Grid & Radial Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-1 rounded-lg border border-gold-400/30 bg-graphite shadow-[0_0_20px_rgba(208,180,119,0.2)]">
            <Logo size={32} className="text-gold-400" />
          </div>
          <div>
            <span className="font-display font-bold tracking-wider text-sm text-ivory flex items-center gap-1.5">
              AVENIR ARENA
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold-400/15 text-gold-400 font-mono border border-gold-400/30">
                v2.4
              </span>
            </span>
            <p className="text-[10px] text-muted font-mono tracking-wide">
              by Quasar · Mirai School of Technology
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ARENA MAINFRAME ONLINE</span>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center my-auto">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-400/30 bg-graphite/70 backdrop-blur-md mb-8 text-xs font-mono text-gold-400 shadow-[0_0_20px_rgba(208,180,119,0.15)] animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
          <span>AUTHENTICATION CLEARANCE REQUIRED</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-ivory tracking-tight max-w-3xl leading-[1.1] mb-6">
          The Competitive Arena for{' '}
          <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200 bg-clip-text text-transparent">
            Next-Gen Engineers
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-muted max-w-xl mb-10 leading-relaxed font-sans">
          Step into a high-stakes engineering proving ground. Master 3D Code Runner, uncover the
          mysteries of The Code House, and forge an unbreakable Infinite Trace streak.
        </p>

        {/* Card: Exclusively Sign in with Google */}
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-line-light/50 bg-graphite/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />

          <p className="text-xs font-mono uppercase tracking-widest text-gold-400 mb-6 font-semibold">
            Choose Your Ingress Method
          </p>

          {/* Authentication Error Toast / Alert Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl border border-red-500/40 bg-red-950/60 text-red-200 text-xs flex items-start justify-between gap-2.5 text-left animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-300 font-mono text-[11px] uppercase tracking-wider">
                    Ingress Clearance Failed
                  </p>
                  <p className="text-xs leading-relaxed text-red-200/90">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-200 p-0.5 rounded transition-colors shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Primary Action: Sign in with Google */}
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl border border-line-light bg-elevated/90 hover:border-gold-400 hover:bg-elevated hover:shadow-[0_0_25px_rgba(208,180,119,0.25)] disabled:opacity-50 disabled:cursor-wait text-ivory text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 group active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-mono text-xs text-gold-400 tracking-wider uppercase">
                    Verifying Google Identity...
                  </span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="font-semibold text-sm">Continue with Google Account</span>
                  <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-all ml-auto" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-line text-[11px] text-muted font-mono flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-gold-400" />
            <span>One User, One ID · Google Identity Verified</span>
          </div>

          {/* Subtle Minimalist Admin Portal Ingress Trigger */}
          <div className="mt-4 pt-3 border-t border-line/40 text-center">
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-[11px] font-mono text-muted/70 hover:text-gold-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <Lock className="w-3 h-3 text-gold-400/80" />
              <span>Admin Portal Ingress</span>
            </button>
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full mt-12 text-left">
          <div className="p-3.5 rounded-xl border border-line bg-graphite/40 backdrop-blur-sm">
            <Gamepad2 className="w-4 h-4 text-gold-400 mb-2" />
            <p className="text-xs font-bold text-ivory">Code Runner 3D</p>
            <p className="text-[10px] text-muted mt-0.5">High-speed arcade syntax gates</p>
          </div>
          <div className="p-3.5 rounded-xl border border-line bg-graphite/40 backdrop-blur-sm">
            <Terminal className="w-4 h-4 text-cyan-400 mb-2" />
            <p className="text-xs font-bold text-ivory">The Code House</p>
            <p className="text-[10px] text-muted mt-0.5">Mysterious 2D puzzle mansion</p>
          </div>
          <div className="p-3.5 rounded-xl border border-line bg-graphite/40 backdrop-blur-sm">
            <Flame className="w-4 h-4 text-orange-400 mb-2" />
            <p className="text-xs font-bold text-ivory">Infinite Trace</p>
            <p className="text-[10px] text-muted mt-0.5">Continuous cursor streak engine</p>
          </div>
          <div className="p-3.5 rounded-xl border border-line bg-graphite/40 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-ivory">Academic XP</p>
            <p className="text-[10px] text-muted mt-0.5">Campus leaderboard & badges</p>
          </div>
        </div>
      </main>

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-sm w-full rounded-2xl border border-gold-400/40 bg-graphite p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-400/10 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminError('');
              }}
              className="absolute top-4 right-4 p-1 rounded-lg border border-line bg-elevated text-muted hover:text-ivory"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-lg text-ivory text-center">
              Admin Mainframe Portal
            </h3>
            <p className="text-xs text-muted text-center mt-1">
              Restricted clearance. Enter authorized administrator credentials.
            </p>

            {adminError && (
              <div className="mt-4 p-2.5 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1 font-semibold">
                  Administrator Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="siddharthsharma2649@gmail.com"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-obsidian text-ivory text-xs focus:border-gold-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1 font-semibold">
                  Master Passphrase
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-obsidian text-ivory text-xs focus:border-gold-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 text-xs font-semibold mt-2 shadow-[0_0_15px_rgba(208,180,119,0.2)]"
              >
                Authenticate & Open Mainframe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-muted gap-2">
        <span>© 2026 AVENIR ARENA · Quasar Engineering Labs</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Security Protocol v4.2</span>
          <span>·</span>
          <span>Terms & Ethics</span>
          <span>·</span>
          <button
            onClick={() => setShowAdminModal(true)}
            className="hover:text-gold-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-gold-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
