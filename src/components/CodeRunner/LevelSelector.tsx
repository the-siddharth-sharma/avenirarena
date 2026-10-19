import {
  CheckCircle2,
  Lock,
  Play,
  Trophy,
  X,
  Zap,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  codeRunnerLevels,
  type CodeRunnerLevel,
  type DSATopic,
} from '@/data/codeRunnerLevels';

interface LevelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevelId: string;
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  onSelectLevel: (levelId: string) => void;
  levelHighScores?: Record<string, number>;
}

const topicColors: Record<DSATopic, { badge: string; border: string; glow: string }> = {
  Basics: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
  Complexity: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
  'Prefix Sum': {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    border: 'border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  Trees: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.2)',
  },
  Graphs: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.2)',
  },
};

export function LevelSelector({
  isOpen,
  onClose,
  currentLevelId,
  unlockedLevelIds,
  completedLevelIds,
  onSelectLevel,
  levelHighScores = {},
}: LevelSelectorProps) {
  if (!isOpen) return null;

  const totalLevels = codeRunnerLevels.length;
  const completedCount = completedLevelIds.length;
  const progressPercent = Math.round((completedCount / totalLevels) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-obsidian/90 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col max-w-2xl w-full max-h-[90vh] rounded-2xl border border-line bg-graphite shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-elevated/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-gold-400/30 bg-gold-400/10 text-gold-400 shadow-[0_0_15px_rgba(208,180,119,0.2)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold">
                  CURRICULUM ROADMAP
                </span>
                <span className="px-1.5 py-0.2 rounded bg-gold-400/20 text-gold-300 font-mono text-[10px]">
                  5 Sequential Levels
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ivory tracking-tight">
                DSA Mastery Track
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-ivory hover:bg-elevated transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overall Track Progress Bar */}
        <div className="px-5 py-3 border-b border-line/60 bg-elevated/40 flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted">
            <span>Progress:</span>
            <span className="font-bold text-ivory">
              {completedCount} / {totalLevels} Levels Completed
            </span>
            <span className="text-gold-400">({progressPercent}%)</span>
          </div>

          <div className="w-36 sm:w-48 h-2 rounded-full bg-obsidian border border-line overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Level List / Roadmap Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
          {codeRunnerLevels.map((lvl, index) => {
            const isUnlocked = unlockedLevelIds.includes(lvl.id);
            const isCompleted = completedLevelIds.includes(lvl.id);
            const isCurrent = currentLevelId === lvl.id;
            const colors = topicColors[lvl.topic];
            const highScore = levelHighScores[lvl.id] || 0;

            return (
              <div
                key={lvl.id}
                className={`relative rounded-xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? 'border-gold-400/80 bg-gold-400/[0.07] ring-1 ring-gold-400/50 shadow-[0_0_20px_rgba(208,180,119,0.15)]'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/60'
                    : isUnlocked
                    ? 'border-line bg-graphite hover:border-line-light'
                    : 'border-line/40 bg-elevated/30 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Order Badge & Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl border font-mono font-bold shrink-0 ${
                        isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : isCurrent
                          ? 'border-gold-400/50 bg-gold-400/15 text-gold-400'
                          : isUnlocked
                          ? 'border-line bg-elevated text-ivory'
                          : 'border-line/30 bg-obsidian text-muted'
                      }`}
                    >
                      <span className="text-[10px] text-muted">LVL</span>
                      <span className="text-base leading-none">0{lvl.order}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${colors.badge}`}
                        >
                          {lvl.topic}
                        </span>

                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-400/20 text-gold-300 border border-gold-400/40 animate-pulse">
                            <Play className="h-3 w-3 fill-gold-400" />
                            Active Level
                          </span>
                        )}

                        {!isUnlocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-muted border border-line">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>

                      <h4 className="font-display text-base font-semibold text-ivory mt-1">
                        {lvl.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed line-clamp-1 mt-0.5">
                        {lvl.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: XP / Score & Action Button */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-line/60">
                    <div className="text-left sm:text-right font-mono text-xs">
                      <div className="flex items-center sm:justify-end gap-1 text-gold-400 font-bold">
                        <Zap className="h-3.5 w-3.5 fill-gold-400" />
                        <span>+{lvl.xpReward} XP</span>
                      </div>
                      {highScore > 0 && (
                        <div className="text-[10px] text-muted flex items-center sm:justify-end gap-1">
                          <Trophy className="h-3 w-3 text-gold-400/80" />
                          <span>Best: {highScore.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onSelectLevel(lvl.id);
                          onClose();
                        }}
                        className={`btn text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 ${
                          isCurrent
                            ? 'btn-primary shadow-[0_0_15px_rgba(208,180,119,0.3)]'
                            : isCompleted
                            ? 'btn-secondary text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10'
                            : 'btn-secondary'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <span>Resume</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </>
                        ) : isCompleted ? (
                          <>
                            <span>Replay</span>
                            <Play className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            <span>Play</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div
                        className="flex items-center gap-1 text-[11px] font-mono text-muted py-1.5 px-3 rounded border border-line bg-obsidian cursor-not-allowed"
                        title={`Clear Level ${lvl.order - 1} to unlock this level.`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Requires L{lvl.order - 1}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-elevated/70 flex items-center justify-between text-xs text-muted font-mono">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold-400" />
            <span>Complete test cases or runner gates to unlock next level</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs py-1.5 px-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
