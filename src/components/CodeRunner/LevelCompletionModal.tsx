import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import type { CodeRunnerLevel } from '@/data/codeRunnerLevels';

interface LevelCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: CodeRunnerLevel;
  earnedXP: number;
  hasNextLevel: boolean;
  nextLevelTitle?: string;
  onProceedNextLevel: () => void;
  onReplayLevel: () => void;
  onOpenLevelSelector: () => void;
  stats?: {
    gatesCleared: number;
    score: number;
    streak: number;
  };
}

export function LevelCompletionModal({
  isOpen,
  onClose,
  level,
  earnedXP,
  hasNextLevel,
  nextLevelTitle,
  onProceedNextLevel,
  onReplayLevel,
  onOpenLevelSelector,
  stats,
}: LevelCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-obsidian/95 backdrop-blur-md animate-fade-in text-center">
      <div className="relative flex flex-col items-center max-w-md w-full rounded-2xl border border-gold-400/50 bg-gradient-to-b from-graphite via-elevated to-obsidian p-6 sm:p-8 shadow-[0_0_50px_rgba(208,180,119,0.25)] overflow-hidden">
        {/* Radiant Backdrop Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-gold-400/20 blur-3xl rounded-full pointer-events-none" />

        {/* Celebratory Icon */}
        <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl border border-gold-400/40 bg-gold-400/10 text-gold-400 mb-4 shadow-[0_0_25px_rgba(208,180,119,0.35)] animate-bounce">
          <Trophy className="h-8 w-8 text-gold-400" />
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-gold-300 animate-spin" />
        </div>

        {/* Level Tag & Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-gold-400 font-bold">
            LEVEL 0{level.order} CLEARED
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            {level.topic}
          </span>
        </div>

        <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">
          {level.title}
        </h3>

        <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
          Outstanding work! You have conquered this algorithmic milestone and proven your mastery
          of {level.topic}.
        </p>

        {/* Reward Badge */}
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold-400/40 bg-gold-400/10 text-gold-300 font-mono text-sm font-bold shadow-[0_0_15px_rgba(208,180,119,0.2)]">
          <Zap className="h-4 w-4 fill-gold-400 text-gold-400" />
          <span>+{earnedXP} Academic XP Awarded</span>
        </div>

        {/* Optional Game Run Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 w-full mt-5 font-mono text-xs">
            <div className="p-2.5 rounded-lg border border-line bg-graphite/60">
              <span className="text-[10px] uppercase text-muted block">Score</span>
              <span className="font-bold text-ivory">{stats.score.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-line bg-graphite/60">
              <span className="text-[10px] uppercase text-muted block">Streak</span>
              <span className="font-bold text-ivory">x{stats.streak}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-line bg-graphite/60">
              <span className="text-[10px] uppercase text-muted block">Gates</span>
              <span className="font-bold text-emerald-400">{stats.gatesCleared}</span>
            </div>
          </div>
        )}

        {/* Next Level Announcement */}
        {hasNextLevel ? (
          <div className="mt-5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-300 font-mono flex items-center justify-center gap-1.5 w-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Next Level Unlocked: {nextLevelTitle || 'Next Module'}</span>
          </div>
        ) : (
          <div className="mt-5 p-3 rounded-lg border border-gold-400/30 bg-gold-400/5 text-xs text-gold-300 font-mono flex items-center justify-center gap-1.5 w-full">
            <Trophy className="h-3.5 w-3.5 text-gold-400 shrink-0" />
            <span>Mastery Achieved! All 5 DSA Curriculum Levels Cleared!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-6">
          {hasNextLevel && (
            <button
              onClick={() => {
                onClose();
                onProceedNextLevel();
              }}
              className="btn btn-primary py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)] hover:scale-[1.02] transition-transform text-sm font-semibold"
            >
              <span>Proceed to Next Level</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                onClose();
                onReplayLevel();
              }}
              className="btn btn-secondary flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay Level</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenLevelSelector();
              }}
              className="btn btn-secondary flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Select Level</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
