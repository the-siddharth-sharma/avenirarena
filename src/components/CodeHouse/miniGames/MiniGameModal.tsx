import { useState, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  Coins,
  Sparkles,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronRight,
  Search,
} from 'lucide-react';
import { houseAudio } from '../audio';

interface MiniGameModalProps {
  onClose: () => void;
  onReward: (byteBits: number, xp: number) => void;
}

export function MiniGameModal({ onClose, onReward }: MiniGameModalProps) {
  const [selectedGame, setSelectedGame] = useState<'menu' | 'frogger' | 'binary'>('menu');

  // --- Flexbox Frogger State ---
  const [froggerRound, setFroggerRound] = useState<number>(1);
  const [froggerScore, setFroggerScore] = useState<number>(0);
  const [froggerTime, setFroggerTime] = useState<number>(30);
  const [froggerActive, setFroggerActive] = useState<boolean>(false);
  const [selectedFlexStyle, setSelectedFlexStyle] = useState<string>('justify-content: flex-start;');
  const [froggerResult, setFroggerResult] = useState<'playing' | 'won' | 'lost'>('playing');

  const FROGGER_CHALLENGES = [
    {
      round: 1,
      targetDesc: 'Send the Cyber-Frog to the far right glowing lilypad.',
      correctRule: 'justify-content: flex-end;',
      options: [
        'justify-content: flex-end;',
        'justify-content: center;',
        'align-items: flex-start;',
        'flex-direction: column;',
      ],
      targetPos: 'justify-end items-start',
    },
    {
      round: 2,
      targetDesc: 'Center the Cyber-Frog perfectly in the middle of the aquatic grid.',
      correctRule: 'justify-content: center; align-items: center;',
      options: [
        'justify-content: space-between;',
        'justify-content: center; align-items: center;',
        'align-items: flex-end;',
        'flex-wrap: wrap;',
      ],
      targetPos: 'justify-center items-center',
    },
    {
      round: 3,
      targetDesc: 'Stack the lilypads vertically along a downward column axis.',
      correctRule: 'flex-direction: column; justify-content: space-between;',
      options: [
        'flex-direction: row-reverse;',
        'display: block;',
        'flex-direction: column; justify-content: space-between;',
        'justify-content: baseline;',
      ],
      targetPos: 'flex-col justify-between items-center',
    },
  ];

  // Frogger Timer
  useEffect(() => {
    if (selectedGame !== 'frogger' || !froggerActive || froggerResult !== 'playing') return;
    const interval = setInterval(() => {
      setFroggerTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setFroggerResult('lost');
          houseAudio.playValidationError();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedGame, froggerActive, froggerResult]);

  // Handle Frogger Answer
  const handleFroggerOption = (option: string) => {
    setSelectedFlexStyle(option);
    const curr = FROGGER_CHALLENGES[froggerRound - 1];

    if (option === curr.correctRule) {
      houseAudio.playValidationSuccess();
      const nextScore = froggerScore + 1;
      setFroggerScore(nextScore);

      if (froggerRound < 3) {
        setFroggerRound((r) => r + 1);
        setSelectedFlexStyle('justify-content: flex-start;');
      } else {
        setFroggerResult('won');
        houseAudio.playFanfare();
        onReward(60, 100);
      }
    } else {
      houseAudio.playValidationError();
    }
  };

  // --- Binary Scavenger State ---
  const [targetNumber, setTargetNumber] = useState<number>(() => Math.floor(Math.random() * 100) + 1);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [guessHistory, setGuessHistory] = useState<
    Array<{ guess: number; hint: 'HIGHER' | 'LOWER' | 'CORRECT' }>
  >([]);
  const [binaryLow, setBinaryLow] = useState<number>(1);
  const [binaryHigh, setBinaryHigh] = useState<number>(100);
  const [binaryResult, setBinaryResult] = useState<'playing' | 'won' | 'lost'>('playing');

  const startBinaryGame = () => {
    const num = Math.floor(Math.random() * 100) + 1;
    setTargetNumber(num);
    setBinaryLow(1);
    setBinaryHigh(100);
    setGuessHistory([]);
    setCurrentGuess('');
    setBinaryResult('playing');
  };

  const handleBinarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(currentGuess.trim(), 10);
    if (isNaN(val) || val < 1 || val > 100) return;

    houseAudio.playTerminalBeep();
    let hint: 'HIGHER' | 'LOWER' | 'CORRECT' = 'CORRECT';

    if (val === targetNumber) {
      hint = 'CORRECT';
      setBinaryResult('won');
      houseAudio.playFanfare();
      onReward(80, 150);
    } else if (val < targetNumber) {
      hint = 'HIGHER';
      setBinaryLow((low) => Math.max(low, val + 1));
      houseAudio.playLineClick();
    } else {
      hint = 'LOWER';
      setBinaryHigh((high) => Math.min(high, val - 1));
      houseAudio.playLineClick();
    }

    const nextHistory = [{ guess: val, hint }, ...guessHistory];
    setGuessHistory(nextHistory);
    setCurrentGuess('');

    if (val !== targetNumber && nextHistory.length >= 7) {
      setBinaryResult('lost');
      houseAudio.playValidationError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-graphite border border-line rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ivory">
                The Estate Arcade Terminal
              </h3>
              <p className="text-xs text-muted">
                Fast-paced micro-challenges: Earn extra Byte Bits and algorithmic mastery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-muted hover:text-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Screen */}
        {selectedGame === 'menu' && (
          <div className="p-6 space-y-4">
            <div className="text-center mb-6">
              <span className="badge bg-gold-400/10 text-gold-400 border border-gold-400/30 text-xs px-3 py-1 mb-2 inline-block">
                Skill Training Holodeck
              </span>
              <h4 className="text-lg font-bold text-ivory">Choose Your Micro-Game</h4>
              <p className="text-xs text-muted max-w-md mx-auto mt-1">
                Win rounds to claim high bounties of Byte Bits for chamber decor and upgrades.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Game 1: Flexbox Frogger */}
              <div
                onClick={() => {
                  setSelectedGame('frogger');
                  setFroggerRound(1);
                  setFroggerScore(0);
                  setFroggerTime(30);
                  setFroggerActive(true);
                  setFroggerResult('playing');
                  houseAudio.playTerminalBeep();
                }}
                className="p-4 rounded-xl border border-line bg-elevated/40 hover:bg-elevated/80 hover:border-cyan-500/40 cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🐸</span>
                    <span className="badge bg-cyan-500/15 text-cyan-300 text-[10px] border border-cyan-500/30">
                      CSS Layout
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-ivory group-hover:text-cyan-400 transition-colors">
                    Flexbox Frogger
                  </h5>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Test your flexbox muscle memory: Select the right flex rule within 30 seconds to hop across the cyber pond.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono text-gold-400">
                  <span>Bounty: 60 Bits</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Game 2: Binary Scavenger */}
              <div
                onClick={() => {
                  setSelectedGame('binary');
                  startBinaryGame();
                  houseAudio.playTerminalBeep();
                }}
                className="p-4 rounded-xl border border-line bg-elevated/40 hover:bg-elevated/80 hover:border-purple-500/40 cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🌲</span>
                    <span className="badge bg-purple-500/15 text-purple-300 text-[10px] border border-purple-500/30">
                      O(log n) Search
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-ivory group-hover:text-purple-400 transition-colors">
                    Binary Scavenger
                  </h5>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Find the mystery memory address [1..100] in ≤ 7 guesses using optimal binary partition logic.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono text-gold-400">
                  <span>Bounty: 80 Bits</span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Game 1: Flexbox Frogger View --- */}
        {selectedGame === 'frogger' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between bg-obsidian/60 p-3 rounded-lg border border-line">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedGame('menu')}
                  className="text-xs text-muted hover:text-ivory font-mono"
                >
                  ← Menu
                </button>
                <span className="text-line">|</span>
                <span className="text-xs font-semibold text-ivory">
                  Round {froggerRound} / 3
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <Timer className={`w-4 h-4 ${froggerTime < 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className={froggerTime < 10 ? 'text-red-400 font-bold' : 'text-ivory'}>
                  {froggerTime}s
                </span>
              </div>
            </div>

            {/* Aquatic Pond Stage */}
            <div className="w-full h-44 rounded-xl border border-cyan-500/30 bg-[#061826] relative overflow-hidden flex p-4">
              <div
                className={`w-full h-full flex transition-all duration-300 ${
                  FROGGER_CHALLENGES[froggerRound - 1].targetPos
                }`}
              >
                {/* Target Lilypad */}
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-300 font-mono shadow-lg animate-pulse">
                  🌸
                </div>
              </div>
            </div>

            <div className="text-xs text-ivory font-medium">
              Goal: {FROGGER_CHALLENGES[froggerRound - 1].targetDesc}
            </div>

            {/* Answer Options */}
            {froggerResult === 'playing' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FROGGER_CHALLENGES[froggerRound - 1].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleFroggerOption(opt)}
                    className="p-2.5 rounded-lg border border-line bg-elevated/40 hover:bg-elevated/90 hover:border-cyan-400/60 text-xs font-mono text-left text-cyan-300 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : froggerResult === 'won' ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-300">Pond Traversed!</h4>
                <p className="text-xs text-muted">
                  You conquered Flexbox Frogger and collected 60 Byte Bits + 100 XP!
                </p>
                <button
                  onClick={() => setSelectedGame('menu')}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                >
                  Return to Arcade
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="font-bold text-sm text-red-300">Time Expired!</h4>
                <p className="text-xs text-muted">The frog slipped off the layout grid.</p>
                <button
                  onClick={() => {
                    setFroggerRound(1);
                    setFroggerScore(0);
                    setFroggerTime(30);
                    setFroggerActive(true);
                    setFroggerResult('playing');
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- Game 2: Binary Scavenger View --- */}
        {selectedGame === 'binary' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between bg-obsidian/60 p-3 rounded-lg border border-line">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedGame('menu')}
                  className="text-xs text-muted hover:text-ivory font-mono"
                >
                  ← Menu
                </button>
                <span className="text-line">|</span>
                <span className="text-xs font-semibold text-ivory">
                  Guesses Remaining: {7 - guessHistory.length} / 7
                </span>
              </div>

              <div className="text-xs font-mono text-purple-400">
                Range: [{binaryLow} .. {binaryHigh}]
              </div>
            </div>

            {/* Range Bar Indicator */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
              <div className="w-full h-3 rounded-full bg-obsidian border border-line relative overflow-hidden">
                <div
                  className="h-full bg-purple-500/40 border-x border-purple-400 transition-all duration-300"
                  style={{
                    marginLeft: `${binaryLow - 1}%`,
                    width: `${Math.max(2, binaryHigh - binaryLow + 1)}%`,
                  }}
                />
              </div>
            </div>

            {binaryResult === 'playing' ? (
              <form onSubmit={handleBinarySubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    placeholder={`Guess address between ${binaryLow} and ${binaryHigh}...`}
                    className="flex-1 px-3 py-2 rounded-lg bg-obsidian border border-line text-xs text-ivory font-mono outline-none focus:border-purple-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold text-xs hover:bg-purple-500/30 transition-all"
                  >
                    Query
                  </button>
                </div>

                {/* Guess History */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {guessHistory.map((h, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded bg-elevated/40 border border-line text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-ivory">Probe #{guessHistory.length - i}: Value {h.guess}</span>
                      <span
                        className={`font-bold ${
                          h.hint === 'HIGHER'
                            ? 'text-amber-400'
                            : h.hint === 'LOWER'
                            ? 'text-cyan-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {h.hint === 'HIGHER' && '▲ TARGET HIGHER'}
                        {h.hint === 'LOWER' && '▼ TARGET LOWER'}
                        {h.hint === 'CORRECT' && '★ TARGET ACQUIRED'}
                      </span>
                    </div>
                  ))}
                </div>
              </form>
            ) : binaryResult === 'won' ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-300">Target Located!</h4>
                <p className="text-xs text-muted">
                  Address <span className="font-mono text-gold-400 font-bold">{targetNumber}</span> confirmed in {guessHistory.length} guesses. +80 Byte Bits awarded!
                </p>
                <button
                  onClick={() => setSelectedGame('menu')}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                >
                  Return to Arcade
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="font-bold text-sm text-red-300">Out of Probes!</h4>
                <p className="text-xs text-muted">
                  Target was address <span className="font-mono text-gold-400 font-bold">{targetNumber}</span>. In a 100-element space, 7 queries is the theoretical O(log₂ 100) bound.
                </p>
                <button
                  onClick={startBinaryGame}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40"
                >
                  Retry Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
