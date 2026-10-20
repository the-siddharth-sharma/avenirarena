import { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Brain,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CatalogGame } from '@/data/gamesCatalog';
import { useAuth } from '@/context/AuthContext';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { challengeAudio } from '@/utils/challengeAudio';
import { GameLogo } from './GameLogo';

interface InteractiveGameModalProps {
  game: CatalogGame;
  onClose: () => void;
  onComplete?: () => void;
}

export function InteractiveGameModal({ game, onClose, onComplete }: InteractiveGameModalProps) {
  const { updateUserXP } = useAuth();
  const { submitGame } = useStudentProfiles();

  const blocks = (game.engineData.blocks as string[] | undefined) || [];

  // Engine state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [parsonsOrder, setParsonsOrder] = useState<number[]>(() => {
    if (game.engineType === 'parsons' && blocks.length > 0) {
      // Scramble blocks initially
      const indices = blocks.map((_, i) => i);
      return [...indices].sort(() => Math.random() - 0.5);
    }
    return [];
  });
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [awardedXP, setAwardedXP] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(challengeAudio.muted);

  // Handle Parsons block movement
  const moveParsonsBlock = (fromIndex: number, toIndex: number) => {
    if (hasSubmitted) return;
    const next = [...parsonsOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setParsonsOrder(next);
  };

  // Submit and evaluate
  const handleSubmit = async () => {
    if (hasSubmitted) return;

    let correct = false;
    let feedback = '';

    if (game.engineType === 'parsons') {
      const correctOrder = (game.engineData.correctOrder as number[] | undefined) || [];
      correct = parsonsOrder.every((val, idx) => val === correctOrder[idx]);
      feedback = game.engineData.explanation || 'Code blocks correctly assembled!';
    } else {
      const target = game.engineData.correctAnswer;
      correct = selectedOption === target;
      feedback = game.engineData.explanation || (correct ? 'Evaluation passed!' : 'Mismatch detected in test harness.');
    }

    setIsCorrect(correct);
    setExplanation(feedback);
    setHasSubmitted(true);

    if (correct) {
      challengeAudio.playSuccess();
      const xp = game.xpReward || 150;
      setAwardedXP(xp);
      try {
        await updateUserXP(xp);
        // Persist completion in localStorage and student context
        const saved = JSON.parse(localStorage.getItem('avenir_completed_games') || '{}');
        saved[game.id] = true;
        localStorage.setItem('avenir_completed_games', JSON.stringify(saved));
        submitGame(game.id as Parameters<typeof submitGame>[0], 1);
        if (onComplete) onComplete();
      } catch (err) {
        console.warn('Failed to record game XP:', err);
      }
    } else {
      challengeAudio.playError();
    }
  };

  const handleReset = () => {
    setHasSubmitted(false);
    setSelectedOption(null);
    if (game.engineType === 'parsons' && blocks.length > 0) {
      const indices = blocks.map((_, i) => i);
      setParsonsOrder([...indices].sort(() => Math.random() - 0.5));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-graphite border border-gold-400/40 rounded-2xl shadow-[0_0_50px_rgba(208,180,119,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-obsidian">
          <div className="flex items-center gap-3.5 min-w-0">
            <GameLogo
              gameId={game.id}
              subjectId={game.subjectId}
              mechanics={game.mechanicsFamily}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-gold-400/30 bg-gold-400/10 text-gold-400">
                  {game.subjectName}
                </span>
                <span className="text-[10px] font-mono text-muted">• {game.difficulty}</span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-bold text-ivory mt-0.5 truncate">
                {game.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                challengeAudio.toggleMute();
                setIsMuted(challengeAudio.muted);
              }}
              className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center text-muted hover:text-ivory transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center text-muted hover:text-ivory hover:border-gold-400/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-6 flex-1">
          {/* Objective Callout */}
          <div className="p-3.5 rounded-xl bg-elevated border border-line flex items-start gap-3">
            <Brain className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-ivory">Objective: </span>
              {game.learningObjectives[0] || game.description}
            </div>
          </div>

          {/* PARSONS PUZZLE ENGINE */}
          {game.engineType === 'parsons' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-muted">
                <span>ARRANGE CODE BLOCKS IN EXECUTION ORDER:</span>
                <span className="text-gold-400">Click arrows to reorder</span>
              </div>

              <div className="space-y-2">
                {parsonsOrder.map((origIdx, pos) => (
                  <div
                    key={origIdx}
                    className="p-3 rounded-lg bg-obsidian border border-line flex items-center justify-between gap-3 group hover:border-gold-400/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs text-ivory">
                      <span className="text-muted text-[10px] w-5">#{pos + 1}</span>
                      <code className="text-cyan-300">{blocks[origIdx]}</code>
                    </div>

                    {!hasSubmitted && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={pos === 0}
                          onClick={() => moveParsonsBlock(pos, pos - 1)}
                          className="px-2 py-1 rounded bg-elevated border border-line text-[10px] font-mono text-muted hover:text-ivory disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          disabled={pos === parsonsOrder.length - 1}
                          onClick={() => moveParsonsBlock(pos, pos + 1)}
                          className="px-2 py-1 rounded bg-elevated border border-line text-[10px] font-mono text-muted hover:text-ivory disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SYNTAX / LOGIC / SYSTEMS / ALGO TRACE / AI MATH ENGINES */}
          {game.engineType !== 'parsons' && (
            <div className="space-y-4">
              {/* Code Snippet / Context Box */}
              {(game.engineData.snippet || game.engineData.code) && (
                <div className="p-4 rounded-xl bg-obsidian border border-line">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5 text-[10px] font-mono text-muted">
                    <span>SOURCE TELEMETRY INSPECTOR</span>
                    <span>C++ / Python Bytecode</span>
                  </div>
                  <pre className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {game.engineData.snippet || game.engineData.code}
                  </pre>
                </div>
              )}

              {/* Scenario Prompt */}
              <div className="text-sm text-ivory font-medium">
                {game.engineData.question || game.description}
              </div>

              {/* Interactive Options Grid */}
              {game.engineData.options && (
                <div className="grid grid-cols-1 gap-2.5">
                  {game.engineData.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        disabled={hasSubmitted}
                        onClick={() => setSelectedOption(opt)}
                        className={`p-3.5 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/15 text-ivory shadow-[0_0_15px_rgba(208,180,119,0.2)]'
                            : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-md border border-line bg-elevated flex items-center justify-center text-[10px] text-gold-400">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </span>

                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Feedback & Result Screen */}
          {hasSubmitted && (
            <div
              className={`p-4 rounded-xl border animate-fade-in space-y-2 ${
                isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-display font-bold text-emerald-400 text-sm">
                        Challenge Mastered!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="font-display font-bold text-red-400 text-sm">
                        Syntax / Logic Discrepancy
                      </span>
                    </>
                  )}
                </div>

                {isCorrect && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-gold-400/20 border border-gold-400/40 text-gold-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gold-400 fill-gold-400" />
                    +{awardedXP} XP
                  </span>
                )}
              </div>

              <p className="text-xs text-muted leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-line bg-obsidian flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <Zap className="w-4 h-4 text-gold-400" />
            <span>Reward: {game.xpReward} Academic XP</span>
          </div>

          <div className="flex items-center gap-2">
            {hasSubmitted ? (
              <>
                {!isCorrect && (
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 font-mono"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Challenge
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-mono"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                disabled={game.engineType !== 'parsons' && !selectedOption}
                onClick={handleSubmit}
                className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-2 font-mono disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(208,180,119,0.25)]"
              >
                <Sparkles className="w-3.5 h-3.5" /> Verify & Execute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
