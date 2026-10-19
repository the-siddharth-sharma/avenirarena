import { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    handleGoogleSuccess,
    handleGoogleError,
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
          {/* Official Google OAuth GSI Button */}
          <div className="flex justify-center w-full min-h-[44px] items-center p-1 rounded-xl bg-elevated/40 border border-line">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-line text-center text-[11px] text-muted font-mono flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
          <span>Single Sign-On · Google Identity Services Verified</span>
        </div>
      </div>
    </div>
  );
}
