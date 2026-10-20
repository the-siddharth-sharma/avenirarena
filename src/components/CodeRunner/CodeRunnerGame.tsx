import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Flame,
  Heart,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { codeChallenges, getRandomChallenges, type CodeChallenge } from './challenges';
import { soundCtrl, type AudioSettings } from './audio';
import { useStudentProfiles } from '@/students/StudentProfileContext';
<<<<<<< HEAD
import {
  codeRunnerLevels,
  getSavedProgression,
  saveProgression,
  getNextLevel,
  getPreviousLevel,
  type CodeRunnerProgressionState,
} from '@/data/codeRunnerLevels';
import { LevelSelector } from './LevelSelector';
import { DsaCodeLabModal } from './DsaCodeLabModal';
import { LevelCompletionModal } from './LevelCompletionModal';
=======
import { usePlayerIdentity, drawPlayerAvatarToCanvas } from '@/components/game-core';
>>>>>>> d7f7895635cfa88d9d6198ee14cbc5ee8f3db9bc

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  alpha: number;
  vy: number;
}

interface GateObstacle {
  z: number;
  challenge: CodeChallenge;
  passed: boolean;
}

interface WrongReviewState {
  challenge: CodeChallenge;
  chosenToken: string;
  livesLeft: number;
}

interface CodeRunnerGameProps {
  onExit: () => void;
  username?: string;
  avatarUrl?: string;
}

<<<<<<< HEAD
export function CodeRunnerGame({ onExit }: CodeRunnerGameProps) {
  const { selectedStudent, submitGame, gameCompletions, submitCodeRunnerLevel } = useStudentProfiles();
=======
export function CodeRunnerGame({ onExit, username: propUsername, avatarUrl: propAvatarUrl }: CodeRunnerGameProps) {
  const { selectedStudent, submitGame, gameCompletions, updateUserXP } = useStudentProfiles();
  const playerIdentity = usePlayerIdentity();

  // Ref for 60 FPS Canvas render loop to access current identity without closure thrashing
  const playerIdentityRef = useRef(playerIdentity);
  playerIdentityRef.current = {
    ...playerIdentity,
    ...(propUsername ? { username: propUsername } : {}),
    ...(propAvatarUrl ? { avatarUrl: propAvatarUrl } : {}),
  };

  const username = playerIdentityRef.current.username;
>>>>>>> d7f7895635cfa88d9d6198ee14cbc5ee8f3db9bc

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multi-level DSA progression per student
  const [progression, setProgression] = useState<CodeRunnerProgressionState>(() =>
    getSavedProgression(selectedStudent?.id || 'default')
  );

  useEffect(() => {
    setProgression(getSavedProgression(selectedStudent?.id || 'default'));
  }, [selectedStudent?.id]);

  const activeLevel = useMemo(
    () =>
      codeRunnerLevels.find((lvl) => lvl.id === progression.currentLevelId) ||
      codeRunnerLevels[0],
    [progression.currentLevelId]
  );

  const prevLevel = useMemo(() => getPreviousLevel(activeLevel.id), [activeLevel.id]);
  const nextLevel = useMemo(() => getNextLevel(activeLevel.id), [activeLevel.id]);
  const isNextLevelUnlocked = nextLevel
    ? progression.unlockedLevelIds.includes(nextLevel.id)
    : false;
  const isPrevLevelUnlocked = prevLevel
    ? progression.unlockedLevelIds.includes(prevLevel.id)
    : false;
  const isCurrentCompleted = progression.completedLevelIds.includes(activeLevel.id);

  // Level modals state
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showCodeLab, setShowCodeLab] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionEarnedXP, setCompletionEarnedXP] = useState(0);
  const [completionStats, setCompletionStats] = useState<{
    gatesCleared: number;
    score: number;
    streak: number;
  } | null>(null);

  // High score persistence per student & level
  const highScoreKey = `avenir-coderunner-highscore-${selectedStudent?.id || 'default'}-${activeLevel.id}`;
  const getSavedHighScore = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    try {
      return (
        progression.levelHighScores[activeLevel.id] ||
        parseInt(localStorage.getItem(highScoreKey) || '0', 10) ||
        0
      );
    } catch {
      return 0;
    }
  }, [activeLevel.id, highScoreKey, progression.levelHighScores]);

  const [gameState, setGameState] = useState<'start' | 'countdown' | 'playing' | 'paused' | 'review' | 'gameover'>('start');
  const [countdownVal, setCountdownVal] = useState<number | string>(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(getSavedHighScore);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [questionsSolved, setQuestionsSolved] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState<CodeChallenge | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  // Update high score whenever active level changes
  useEffect(() => {
    setHighScore(getSavedHighScore());
  }, [activeLevel.id, getSavedHighScore]);

  // Audio settings modal & state
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ ...soundCtrl.settings });

  // Wrong answer syntax learning review checkpoint
  const [wrongReview, setWrongReview] = useState<WrongReviewState | null>(null);

  // Reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gameplay mutable state refs (for 60fps RAF loop without React lag)
  const stateRef = useRef({
    gameState: 'start' as 'start' | 'countdown' | 'playing' | 'paused' | 'review' | 'gameover',
    playerLane: 0 as -1 | 0 | 1,
    playerX: 0, // smoothed visual X (-1 to 1)
    speed: 200, // world units per second (comfortable initial pace)
    baseSpeed: 200,
    distanceTravelled: 0,
    scoreVal: 0,
    livesVal: 3,
    comboVal: 1,
    highestComboVal: 1,
    solvedCount: 0,
    invincibleTimer: 0,
    screenShake: 0,
    lastTime: 0,
    gridOffset: 0,
    runCycle: 0,
    challengesQueue: [] as CodeChallenge[],
    activeGate: null as GateObstacle | null,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    textCounter: 0,
  });

  const updateHighScore = useCallback(
    (newScore: number) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem(highScoreKey, String(newScore));
        } catch {
          // Ignore
        }
        setProgression((prev) => {
          const updated: CodeRunnerProgressionState = {
            ...prev,
            levelHighScores: {
              ...prev.levelHighScores,
              [activeLevel.id]: newScore,
            },
          };
          saveProgression(selectedStudent?.id || 'default', updated);
          return updated;
        });
      }
    },
    [highScore, highScoreKey, activeLevel.id, selectedStudent?.id]
  );

  const handleSelectLevel = useCallback(
    (levelId: string) => {
      const targetLvl = codeRunnerLevels.find((l) => l.id === levelId);
      if (!targetLvl) return;

      setProgression((prev) => {
        const updated: CodeRunnerProgressionState = {
          ...prev,
          currentLevelId: levelId,
        };
        saveProgression(selectedStudent?.id || 'default', updated);
        return updated;
      });

      // Reset runtime states for new level
      const s = stateRef.current;
      s.gameState = 'start';
      setGameState('start');
      setQuestionsSolved(0);
      setScore(0);
      setCombo(1);
      s.solvedCount = 0;
      s.scoreVal = 0;
      s.comboVal = 1;
      s.activeGate = null;
      s.challengesQueue = [];
      soundCtrl.startMenuAmbience();
    },
    [selectedStudent?.id]
  );

  const handleLevelComplete = useCallback(
    (
      levelId: string,
      earnedXP: number,
      stats?: { gatesCleared: number; score: number; streak: number }
    ) => {
      const nextLvl = getNextLevel(levelId);

      setProgression((prev) => {
        const alreadyCompleted = prev.completedLevelIds.includes(levelId);
        const newCompleted = alreadyCompleted
          ? prev.completedLevelIds
          : [...prev.completedLevelIds, levelId];
        const newUnlocked =
          nextLvl && !prev.unlockedLevelIds.includes(nextLvl.id)
            ? [...prev.unlockedLevelIds, nextLvl.id]
            : prev.unlockedLevelIds;

        const updated: CodeRunnerProgressionState = {
          ...prev,
          completedLevelIds: newCompleted,
          unlockedLevelIds: newUnlocked,
          levelPassedAt: {
            ...prev.levelPassedAt,
            [levelId]: new Date().toISOString(),
          },
        };
        saveProgression(selectedStudent?.id || 'default', updated);
        return updated;
      });

      if (submitCodeRunnerLevel) {
        submitCodeRunnerLevel(levelId, earnedXP);
      }

      soundCtrl.playComboMilestone();
      setCompletionEarnedXP(earnedXP);
      if (stats) {
        setCompletionStats(stats);
      } else {
        setCompletionStats({
          gatesCleared: stateRef.current.solvedCount || 4,
          score: stateRef.current.scoreVal || 500,
          streak: stateRef.current.highestComboVal || 1,
        });
      }
      setShowCompletionModal(true);
    },
    [selectedStudent?.id, submitCodeRunnerLevel]
  );

  const getLevelChallenges = useCallback(
    (count = 25): CodeChallenge[] => {
      const pool = [...activeLevel.challenges];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const queue: CodeChallenge[] = [];
      while (queue.length < count) {
        for (const item of pool) {
          queue.push(item);
          if (queue.length >= count) break;
        }
      }
      return queue;
    },
    [activeLevel]
  );

  // Steer left or right
  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;
    if (s.playerLane > -1) {
      s.playerLane = (s.playerLane - 1) as -1 | 0 | 1;
      soundCtrl.playLaneSwitch('left');
    }
  }, []);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;
    if (s.playerLane < 1) {
      s.playerLane = (s.playerLane + 1) as -1 | 0 | 1;
      soundCtrl.playLaneSwitch('right');
    }
  }, []);

  // Spawn next challenge gate (placed comfortably at 1500 distance)
  const spawnChallengeGate = useCallback(
    (zDistance = 1500) => {
      const s = stateRef.current;
      if (s.challengesQueue.length === 0) {
        s.challengesQueue = getLevelChallenges(25);
      }
      const challenge =
        s.challengesQueue.shift() || activeLevel.challenges[0] || codeChallenges[0];
      s.activeGate = {
        z: zDistance,
        challenge,
        passed: false,
      };
      setActiveChallenge(challenge);
    },
    [getLevelChallenges, activeLevel]
  );

  // Start actual game run
  const startGame = useCallback(() => {
    soundCtrl.stopMenuAmbience();
    soundCtrl.playStartRun();

    const s = stateRef.current;
    s.gameState = 'countdown';
    s.playerLane = 0;
    s.playerX = 0;
    s.speed = s.baseSpeed;
    s.distanceTravelled = 0;
    s.scoreVal = 0;
    s.livesVal = 3;
    s.comboVal = 1;
    s.highestComboVal = 1;
    s.solvedCount = 0;
    s.invincibleTimer = 0;
    s.screenShake = 0;
    s.particles = [];
    s.floatingTexts = [];
    s.challengesQueue = getLevelChallenges(25);

    setScore(0);
    setDistance(0);
    setLives(3);
    setCombo(1);
    setHighestCombo(1);
    setQuestionsSolved(0);
    setWrongReview(null);
    setGameState('countdown');
    setCountdownVal(3);

    soundCtrl.playCountdownBeep(false);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownVal(count);
        soundCtrl.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownVal('GO!');
        soundCtrl.playCountdownBeep(true);
      } else {
        clearInterval(timer);
        s.gameState = 'playing';
        s.lastTime = performance.now();
        setGameState('playing');
        spawnChallengeGate(1500);
        soundCtrl.startGameplayMusic();
      }
    }, 800);
  }, [spawnChallengeGate]);

  // Pause Gameplay
  const pauseGame = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'playing') {
      s.gameState = 'paused';
      setGameState('paused');
      soundCtrl.pauseGameplayMusic();
      soundCtrl.playPause();
    }
  }, []);

  // Resume Gameplay
  const resumeGame = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'paused') {
      s.gameState = 'playing';
      s.lastTime = performance.now();
      setGameState('playing');
      soundCtrl.resumeGameplayMusic();
      soundCtrl.playResume();
    }
  }, []);

  // Continue after reviewing syntax checkpoint
  const continueAfterReview = useCallback(() => {
    soundCtrl.playButtonClick();
    const s = stateRef.current;

    if (s.livesVal <= 0) {
      s.gameState = 'gameover';
      setGameState('gameover');
      soundCtrl.playGameOver();
      soundCtrl.startMenuAmbience();
      updateHighScore(s.scoreVal);
      setWrongReview(null);

      // Persist real-time academic XP earned during this run
      const earnedXP = Math.max(0, s.solvedCount * 10);
      if (earnedXP > 0 && updateUserXP) {
        updateUserXP(earnedXP);
      }
      return;
    }

    s.activeGate = null;
    s.invincibleTimer = 2.4; // Grace period after review
    s.gameState = 'playing';
    s.lastTime = performance.now();
    setGameState('playing');
    setWrongReview(null);
    spawnChallengeGate(1500);
    soundCtrl.resumeGameplayMusic();
  }, [spawnChallengeGate, updateHighScore, updateUserXP]);

  // Restart from Game Over or Pause
  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // Add floating text FX
  const addFloatingText = (text: string, color: string, x: number, y: number) => {
    const s = stateRef.current;
    s.floatingTexts.push({
      id: ++s.textCounter,
      text,
      color,
      x,
      y,
      alpha: 1,
      vy: -1.6,
    });
  };

  // Burst particles
  const spawnBurst = (x: number, y: number, color: string, count = 18) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  };

  // Handle ambient menu pad on initial mount / start screen
  useEffect(() => {
    soundCtrl.startMenuAmbience();
    return () => {
      soundCtrl.teardown();
    };
  }, []);

  // Auto-pause when user switches away from browser tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && stateRef.current.gameState === 'playing') {
        pauseGame();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseGame]);

  // Keyboard navigation & controls with focus check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or form field
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        moveRight();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (stateRef.current.gameState === 'playing') {
          pauseGame();
        } else if (stateRef.current.gameState === 'paused') {
          resumeGame();
        } else if (stateRef.current.gameState === 'start' || stateRef.current.gameState === 'gameover') {
          onExit();
        }
      } else if (e.code === 'Space' || e.code === 'Enter') {
        if (stateRef.current.gameState === 'start' || stateRef.current.gameState === 'gameover') {
          startGame();
        } else if (stateRef.current.gameState === 'paused') {
          resumeGame();
        } else if (stateRef.current.gameState === 'review') {
          continueAfterReview();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, startGame, pauseGame, resumeGame, continueAfterReview, onExit]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animationId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI resize
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight || 580;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    stateRef.current.lastTime = performance.now();

    const loop = (time: number) => {
      const s = stateRef.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.08); // delta time capped at 80ms
      s.lastTime = time;

      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 800;
      const h = parent ? parent.clientHeight || 580 : 580;

      // Update game physics ONLY if in active playing state
      if (s.gameState === 'playing') {
        // Player lerping with tactile response
        s.playerX += (s.playerLane - s.playerX) * Math.min(1, dt * 11);

        // Distance and speed
        s.distanceTravelled += s.speed * dt * 0.05;
        s.gridOffset = (s.gridOffset + s.speed * dt) % 120;
        s.runCycle += dt * (s.speed / 40);

        // Gentle progressive speed ramp capped at 360 units/s
        s.speed = Math.min(360, s.baseSpeed + s.solvedCount * 8);

        // Invincibility countdown
        if (s.invincibleTimer > 0) {
          s.invincibleTimer -= dt;
        }

        // Screen shake decay (disabled if prefersReducedMotion)
        if (s.screenShake > 0) {
          s.screenShake = prefersReducedMotion ? 0 : Math.max(0, s.screenShake - dt * 35);
        }

        // Active Gate progression
        if (s.activeGate) {
          s.activeGate.z -= s.speed * dt;

          // Gate collision with player (at z <= 40)
          if (!s.activeGate.passed && s.activeGate.z <= 40) {
            s.activeGate.passed = true;
            const chosenLane = Math.round(s.playerX) as -1 | 0 | 1;
            const chosenLaneIndex = (chosenLane + 1) as 0 | 1 | 2; // -1->0, 0->1, 1->2
            const isCorrect = chosenLaneIndex === s.activeGate.challenge.correctIndex;

            const laneSpacingAtZero = Math.min(w * 0.22, 160);
            const playerScreenX = w * 0.5 + s.playerX * laneSpacingAtZero;
            const playerScreenY = h * 0.78;

            if (isCorrect) {
              // Award points and streak
              const pointsEarned = 100 * s.comboVal;
              s.scoreVal += pointsEarned;
              s.comboVal += 1;
              if (s.comboVal > s.highestComboVal) {
                s.highestComboVal = s.comboVal;
              }
              s.solvedCount += 1;

              // Check combo milestone
              if (s.comboVal === 3 || s.comboVal === 5 || s.comboVal === 8 || s.comboVal === 10) {
                soundCtrl.playComboMilestone();
                addFloatingText(`COMBO x${s.comboVal} MILESTONE!`, '#FDE68A', playerScreenX, playerScreenY - 100);
              } else {
                soundCtrl.playCorrectChoice();
              }

              spawnBurst(playerScreenX, playerScreenY - 40, '#D0B477', 24);
              addFloatingText(`+${pointsEarned}`, '#D0B477', playerScreenX, playerScreenY - 60);

              setFlashColor('rgba(208, 180, 119, 0.25)');
              setTimeout(() => setFlashColor(null), 250);

              setScore(s.scoreVal);
              setCombo(s.comboVal);
              setHighestCombo(s.highestComboVal);
              setQuestionsSolved(s.solvedCount);
              updateHighScore(s.scoreVal);

              // Check if runner milestone reached for this level (5 gates solved)
              if (s.solvedCount >= 5 && !progression.completedLevelIds.includes(activeLevel.id)) {
                setTimeout(() => {
                  if (stateRef.current.gameState === 'playing') {
                    pauseGame();
                    handleLevelComplete(activeLevel.id, activeLevel.xpReward, {
                      gatesCleared: s.solvedCount,
                      score: s.scoreVal,
                      streak: s.highestComboVal,
                    });
                  }
                }, 350);
              }
            } else {
              // Wrong choice: lose heart, pause for Syntax Checkpoint learning
              s.livesVal -= 1;
              s.comboVal = 1;
              s.screenShake = prefersReducedMotion ? 0 : 16;

              soundCtrl.playWrongChoice();
              soundCtrl.pauseGameplayMusic();
              spawnBurst(playerScreenX, playerScreenY - 30, '#EF4444', 28);

              setFlashColor('rgba(239, 68, 68, 0.35)');
              setTimeout(() => setFlashColor(null), 300);

              setLives(s.livesVal);
              setCombo(1);

              // Present friendly syntax review checkpoint
              setWrongReview({
                challenge: s.activeGate.challenge,
                chosenToken: s.activeGate.challenge.options[chosenLaneIndex],
                livesLeft: s.livesVal,
              });

              s.gameState = 'review';
              setGameState('review');

              // If score reached academic reward threshold, verify game reward
              if (s.scoreVal >= 150 && !gameCompletions.some((c) => c.gameId === 'code-sprint')) {
                try {
                  submitGame('code-sprint', 2);
                } catch {
                  // Ignore
                }
              }
            }
          }

          // Gate moved past camera -> spawn next after runway
          if (s.activeGate && s.activeGate.z < -60) {
            s.activeGate = null;
            spawnChallengeGate(1500);
          }
        }

        // Sync distance state occasionally
        setDistance(Math.floor(s.distanceTravelled));
      }

      // ================= DRAW SCENE =================
      ctx.save();

      // Screen Shake (skipped on reduced-motion)
      if (s.screenShake > 0 && !prefersReducedMotion) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Background Futuristic Cyber Arena Sky
      const horizonY = h * 0.32;
      const playerScreenY = h * 0.78;

      const gradSky = ctx.createLinearGradient(0, 0, 0, horizonY);
      gradSky.addColorStop(0, '#07090E');
      gradSky.addColorStop(0.7, '#0C0F17');
      gradSky.addColorStop(1, '#151A24');
      ctx.fillStyle = gradSky;
      ctx.fillRect(0, 0, w, horizonY);

      // Distant Horizon Glow & Arena Skyline
      const gradGlow = ctx.createRadialGradient(w * 0.5, horizonY, 10, w * 0.5, horizonY, w * 0.6);
      gradGlow.addColorStop(0, 'rgba(208, 180, 119, 0.22)');
      gradGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
      gradGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = gradGlow;
      ctx.fillRect(0, 0, w, horizonY + 20);

      // Distant glowing geometric arena pillars
      ctx.strokeStyle = 'rgba(208, 180, 119, 0.15)';
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        const px = w * 0.5 + i * 45;
        const pillarH = 15 + Math.abs(i) * 6;
        ctx.strokeRect(px - 10, horizonY - pillarH, 20, pillarH);
      }

      // 2. Futuristic Track Floor
      const gradFloor = ctx.createLinearGradient(0, horizonY, 0, h);
      gradFloor.addColorStop(0, '#0B0D13');
      gradFloor.addColorStop(0.5, '#0E1118');
      gradFloor.addColorStop(1, '#080A0E');
      ctx.fillStyle = gradFloor;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Track Perspective Projection helper
      const laneSpacingAtZero = Math.min(w * 0.22, 160);
      const project = (laneNorm: number, z: number) => {
        const depth = Math.max(0, z);
        const scale = 280 / (depth + 280);
        const screenX = w * 0.5 + laneNorm * laneSpacingAtZero * scale;
        const screenY = horizonY + (playerScreenY - horizonY) * scale;
        return { x: screenX, y: screenY, scale };
      };

      // Draw Longitudinal Track Lane Divider Lines
      const laneDividers = [-1.5, -0.5, 0.5, 1.5];
      laneDividers.forEach((norm, idx) => {
        const isBorder = idx === 0 || idx === 3;
        const pNear = project(norm, -90);
        const pFar = project(norm, 1600);

        ctx.beginPath();
        ctx.moveTo(pNear.x, pNear.y);
        ctx.lineTo(pFar.x, pFar.y);
        ctx.strokeStyle = isBorder
          ? 'rgba(208, 180, 119, 0.65)'
          : 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = isBorder ? 2.5 : 1.2;
        ctx.stroke();

        // Outer Neon Glow for borders
        if (isBorder) {
          ctx.strokeStyle = 'rgba(208, 180, 119, 0.2)';
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      });

      // Draw Transversal Grid Lines (moving forward)
      const numLines = 18;
      for (let i = 0; i < numLines; i++) {
        const lineZ = (i * 90 - s.gridOffset + 1600) % 1600;
        if (lineZ < 5) continue;
        const pLeft = project(-1.5, lineZ);
        const pRight = project(1.5, lineZ);

        const alpha = Math.max(0, 1 - lineZ / 1550) * 0.24;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.strokeStyle = `rgba(208, 180, 119, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Draw Approaching Challenge Gates
      if (s.activeGate && s.activeGate.z > -40) {
        const gateZ = Math.max(0, s.activeGate.z);
        const pCenter = project(0, gateZ);

        // Archway Dimensions in perspective (fits within lane bounds)
        const doorW = laneSpacingAtZero * pCenter.scale * 0.92;
        const doorH = doorW * 1.35;

        // Draw the 3 lane gateway portals
        const laneIndices: (-1 | 0 | 1)[] = [-1, 0, 1];
        laneIndices.forEach((laneIdx) => {
          const p = project(laneIdx, gateZ);
          const optionIndex = (laneIdx + 1) as 0 | 1 | 2;
          const optionText = s.activeGate!.challenge.options[optionIndex];

          const doorX = p.x - doorW * 0.5;
          const doorY = p.y - doorH;

          // Portal Gate Outer Neon Archway
          ctx.save();

          // Ambient portal glow
          const portalGrad = ctx.createLinearGradient(doorX, doorY, doorX, doorY + doorH);
          portalGrad.addColorStop(0, 'rgba(208, 180, 119, 0.35)');
          portalGrad.addColorStop(0.5, 'rgba(16, 20, 28, 0.9)');
          portalGrad.addColorStop(1, 'rgba(12, 14, 20, 0.95)');

          ctx.fillStyle = portalGrad;
          ctx.beginPath();
          ctx.roundRect(doorX, doorY, doorW, doorH, [Math.max(4, 8 * p.scale), Math.max(4, 8 * p.scale), 0, 0]);
          ctx.fill();

          // Neon Border
          ctx.strokeStyle = 'rgba(208, 180, 119, 0.75)';
          ctx.lineWidth = Math.max(1.2, 3 * p.scale);
          ctx.stroke();

          // Gate Lane Marker Badge
          const badgeH = Math.max(14, 18 * p.scale);
          ctx.fillStyle = 'rgba(208, 180, 119, 0.2)';
          ctx.fillRect(doorX, doorY, doorW, badgeH);

          const laneLabel = laneIdx === -1 ? 'LANE 1' : laneIdx === 0 ? 'LANE 2' : 'LANE 3';
          ctx.font = `bold ${Math.max(8, 10 * p.scale)}px monospace`;
          ctx.fillStyle = '#D0B477';
          ctx.textAlign = 'center';
          ctx.fillText(laneLabel, p.x, doorY + badgeH * 0.72);

          // Code Option Token Inside Gate
          const fontSize = Math.max(11, Math.min(24, 20 * p.scale));
          ctx.font = `bold ${fontSize}px "JetBrains Mono", Menlo, Consolas, monospace`;
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(208, 180, 119, 0.9)';
          ctx.shadowBlur = Math.max(4, 10 * p.scale);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Center option text inside the gate
          ctx.fillText(optionText, p.x, doorY + doorH * 0.58);
          ctx.shadowBlur = 0;

          ctx.restore();
        });

        // Overhead Holographic Code Prompt Banner above the 3 gates
        if (gateZ > 20 && gateZ < 1550) {
          const bannerW = Math.min(w * 0.88, Math.max(260, 420 * pCenter.scale));
          const bannerH = Math.max(30, 42 * pCenter.scale);
          const bannerX = pCenter.x - bannerW * 0.5;
          const bannerY = pCenter.y - doorH - bannerH - 8;

          ctx.save();
          ctx.fillStyle = 'rgba(10, 13, 20, 0.92)';
          ctx.strokeStyle = 'rgba(208, 180, 119, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(bannerX, bannerY, bannerW, bannerH, Math.max(4, 6 * pCenter.scale));
          ctx.fill();
          ctx.stroke();

          // Hologram Tag
          ctx.font = `600 ${Math.max(8, 10 * pCenter.scale)}px sans-serif`;
          ctx.fillStyle = '#D0B477';
          ctx.textAlign = 'center';
          ctx.fillText(
            `SYNTAX GATE · ${s.activeGate.challenge.language.toUpperCase()}`,
            pCenter.x,
            bannerY + bannerH * 0.38
          );

          // Code Prompt
          const promptText = `${s.activeGate.challenge.promptBefore}${s.activeGate.challenge.blank}${s.activeGate.challenge.promptAfter}`;
          ctx.font = `bold ${Math.max(10, 14 * pCenter.scale)}px monospace`;
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(promptText, pCenter.x, bannerY + bannerH * 0.78);

          ctx.restore();
        }
      }

      // 4. Draw Player Runner (Bottom Center, Smooth Lane Lerping)
      const pPlayer = project(s.playerX, 0);
      const playerX = pPlayer.x;
      const playerY = playerScreenY + Math.sin(s.runCycle) * 3;

      const isInvincible = s.invincibleTimer > 0;
      const isVisibleFrame = !isInvincible || Math.floor(time / 60) % 2 === 0;

      if (isVisibleFrame) {
        ctx.save();
        ctx.translate(playerX, playerY);

        // Lean / tilt angle during lane transition
        const tilt = prefersReducedMotion ? 0 : (s.playerLane - s.playerX) * 0.22;
        ctx.rotate(tilt);

        // Shadow under runner
        ctx.beginPath();
        ctx.ellipse(0, 18, 28, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();

        // Runner Jet Engine Exhaust Particles
        if (s.gameState === 'playing') {
          for (let e = -1; e <= 1; e += 2) {
            ctx.beginPath();
            ctx.arc(e * 10, 14, 3.5 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() > 0.4 ? 'rgba(208, 180, 119, 0.8)' : 'rgba(56, 189, 248, 0.8)';
            ctx.shadowColor = '#D0B477';
            ctx.shadowBlur = 10;
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }

        // Cyber Runner Body / Cockpit
        ctx.fillStyle = '#1A1E29';
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(-24, 12);
        ctx.lineTo(-14, -8);
        ctx.lineTo(-8, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(24, 12);
        ctx.lineTo(14, -8);
        ctx.lineTo(8, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Main Hull / Chassis
        const hullGrad = ctx.createLinearGradient(0, -22, 0, 12);
        hullGrad.addColorStop(0, '#D0B477');
        hullGrad.addColorStop(0.5, '#222836');
        hullGrad.addColorStop(1, '#11141C');

        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(0, -24); // Nose cone
        ctx.lineTo(16, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(-16, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Visor / Power Core
        ctx.beginPath();
        ctx.ellipse(0, -6, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Universal Human-like Player Avatar floating above vehicle cockpit via Game Core
        drawPlayerAvatarToCanvas(ctx, playerIdentityRef.current, {
          x: 0,
          y: -42,
          radius: 14,
          tetherStartY: -22,
          tetherColor: 'rgba(208, 180, 119, 0.6)',
          ringColor: '#D0B477',
          ringWidth: 2,
          shadowColor: '#D0B477',
          shadowBlur: 10,
        });

        ctx.restore();
      }

      // 5. Particles Update & Draw
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 6. Floating Score Texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.016;

        if (ft.alpha <= 0) {
          s.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [updateHighScore, gameCompletions, submitGame, spawnChallengeGate, prefersReducedMotion]);

  // Handle audio settings toggles & sliders
  const handleMasterMuteToggle = () => {
    soundCtrl.playButtonClick();
    soundCtrl.setMasterMute(!audioSettings.masterMuted);
    setAudioSettings({ ...soundCtrl.settings });
  };

  const handleMusicMuteToggle = () => {
    soundCtrl.playButtonClick();
    soundCtrl.setMusicMute(!audioSettings.musicMuted);
    setAudioSettings({ ...soundCtrl.settings });
  };

  const handleSfxMuteToggle = () => {
    soundCtrl.playButtonClick();
    soundCtrl.setSfxMute(!audioSettings.sfxMuted);
    setAudioSettings({ ...soundCtrl.settings });
  };

  const handleMasterVolumeChange = (val: number) => {
    soundCtrl.setMasterVolume(val);
    setAudioSettings({ ...soundCtrl.settings });
  };

  const handleMusicVolumeChange = (val: number) => {
    soundCtrl.setMusicVolume(val);
    setAudioSettings({ ...soundCtrl.settings });
  };

  const handleSfxVolumeChange = (val: number) => {
    soundCtrl.setSfxVolume(val);
    setAudioSettings({ ...soundCtrl.settings });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-[620px] max-w-5xl mx-auto rounded-xl border border-line bg-obsidian overflow-hidden select-none shadow-2xl"
    >
      {/* Top Game Navigation & Status Header */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-graphite/90 backdrop-blur-md border-b border-line gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => {
              soundCtrl.playButtonClick();
              onExit();
            }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ivory transition-colors px-2 py-1.5 rounded-md hover:bg-elevated"
            title="Exit to Games Hub"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Exit</span>
          </button>

          {/* Level Selector Roadmap Trigger Button */}
          <button
            onClick={() => {
              soundCtrl.playButtonClick();
              if (gameState === 'playing') pauseGame();
              setShowLevelSelector(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gold-400/40 bg-gold-400/10 hover:bg-gold-400/20 text-xs font-mono text-ivory transition-colors shadow-sm"
            title="Select Level / Open Roadmap"
          >
            <Layers className="h-3.5 w-3.5 text-gold-400" />
            <span className="font-bold text-gold-400">L0{activeLevel.order}</span>
            <span className="hidden sm:inline text-muted">·</span>
            <span className="hidden sm:inline font-medium text-ivory">{activeLevel.topic}</span>
            {isCurrentCompleted && (
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            )}
          </button>

          {/* Quick Prev / Next Level Buttons */}
          <div className="hidden sm:flex items-center gap-0.5 rounded border border-line bg-elevated/60 p-0.5 text-xs">
            <button
              onClick={() => prevLevel && handleSelectLevel(prevLevel.id)}
              disabled={!prevLevel || !isPrevLevelUnlocked}
              className={`p-1 rounded transition-colors ${
                prevLevel && isPrevLevelUnlocked
                  ? 'text-muted hover:text-ivory hover:bg-graphite'
                  : 'text-muted/30 cursor-not-allowed'
              }`}
              title={
                prevLevel
                  ? `Go to Level ${prevLevel.order}: ${prevLevel.title}`
                  : 'No previous level'
              }
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => nextLevel && handleSelectLevel(nextLevel.id)}
              disabled={!nextLevel || !isNextLevelUnlocked}
              className={`p-1 rounded transition-colors ${
                nextLevel && isNextLevelUnlocked
                  ? 'text-muted hover:text-ivory hover:bg-graphite'
                  : 'text-muted/30 cursor-not-allowed'
              }`}
              title={
                nextLevel
                  ? isNextLevelUnlocked
                    ? `Go to Level ${nextLevel.order}: ${nextLevel.title}`
                    : `Level ${nextLevel.order} is locked`
                  : 'Final Level'
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* DSA Code Lab Trigger Button */}
          <button
            onClick={() => {
              soundCtrl.playButtonClick();
              if (gameState === 'playing') pauseGame();
              setShowCodeLab(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-line bg-elevated hover:border-gold-400/40 text-xs font-mono text-ivory transition-colors"
            title="Open DSA Code Lab & Test Runner"
          >
            <Code2 className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden md:inline">DSA Lab</span>
            <span className="text-[10px] text-gold-400 font-bold">+{activeLevel.xpReward} XP</span>
          </button>
        </div>

        {/* Current In-Run Challenge Banner */}
        {gameState === 'playing' && activeChallenge && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md border border-gold-400/30 bg-gold-400/10 text-xs max-w-sm truncate">
            <span className="font-mono text-gold-400 font-bold shrink-0">{activeChallenge.language}</span>
            <span className="text-line">|</span>
            <span className="font-mono text-ivory tracking-tight truncate">
              {activeChallenge.promptBefore}
              <span className="text-gold-400 font-bold underline px-0.5">{activeChallenge.blank}</span>
              {activeChallenge.promptAfter}
            </span>
          </div>
        )}

        {/* Top Right Controls: Pause & Audio Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {gameState === 'playing' && (
            <button
              onClick={pauseGame}
              className="flex items-center justify-center h-8 px-2.5 gap-1.5 rounded-md border border-line bg-elevated text-xs text-muted hover:text-ivory transition-colors"
              title="Pause Game (Escape / P)"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}

          <button
            onClick={() => {
              soundCtrl.playButtonClick();
              setShowAudioSettings(true);
            }}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-line bg-elevated text-muted hover:text-ivory transition-colors"
            title="Audio Settings"
          >
            {audioSettings.masterMuted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-gold-400" />
            )}
          </button>
        </div>
      </div>

      {/* Primary HTML5 Canvas Renderer */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-default" />

      {/* Screen Damage/Success Flash Overlay */}
      {flashColor && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-150"
          style={{ backgroundColor: flashColor }}
        />
      )}

      {/* In-Game Live HUD Display */}
      {gameState === 'playing' && (
        <>
          {/* Top Left Stats (Score & Distance) */}
          <div className="absolute top-14 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">SCORE</span>
              <span className="font-mono text-2xl font-bold text-gold-400 tracking-tight">
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted font-mono">
              <span>{distance} m</span>
              <span>·</span>
              <span className="text-gold-400 font-semibold">{questionsSolved}/5 Gates</span>
            </div>
          </div>

          {/* Top Right Stats (Lives & Combo) */}
          <div className="absolute top-14 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
            {/* Lives Hearts */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`h-5 w-5 transition-transform duration-200 ${
                    heartIndex <= lives
                      ? 'text-red-500 fill-red-500 scale-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                      : 'text-muted/30 fill-transparent scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Streak Multiplier */}
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-gold-400/40 bg-gold-400/15 text-gold-400 text-xs font-mono font-bold animate-pulse">
                <Flame className="h-3.5 w-3.5" />
                <span>COMBO x{combo}</span>
              </div>
            )}
          </div>

          {/* On-Screen Mobile Touch Controls (Left & Right Steer Buttons) */}
          <div className="absolute bottom-5 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
            <button
              onClick={moveLeft}
              className="pointer-events-auto flex items-center justify-center h-14 w-14 rounded-full border border-gold-400/40 bg-graphite/85 backdrop-blur-md text-gold-400 active:scale-90 active:bg-gold-400 active:text-obsidian shadow-lg transition-transform"
              aria-label="Steer Left"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <button
              onClick={moveRight}
              className="pointer-events-auto flex items-center justify-center h-14 w-14 rounded-full border border-gold-400/40 bg-graphite/85 backdrop-blur-md text-gold-400 active:scale-90 active:bg-gold-400 active:text-obsidian shadow-lg transition-transform"
              aria-label="Steer Right"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
        </>
      )}

      {/* Countdown Overlay Screen */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-obsidian/75 backdrop-blur-sm pointer-events-none">
          <span className="font-display text-7xl sm:text-8xl font-black text-gold-400 animate-ping tracking-tight">
            {countdownVal}
          </span>
          <p className="mt-4 text-xs font-mono tracking-widest text-muted uppercase">GET READY TO RUN</p>
        </div>
      )}

      {/* Start Screen Overlay */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-obsidian/90 backdrop-blur-md text-center animate-fade-in overflow-y-auto">
          {/* Active Level Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-400/30 bg-gold-400/10 text-xs font-mono mb-3">
            <span className="font-bold text-gold-400">LEVEL 0{activeLevel.order}</span>
            <span className="text-line">·</span>
            <span className="text-ivory font-medium">{activeLevel.topic}</span>
            {isCurrentCompleted && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold pl-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Cleared</span>
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-4xl font-bold text-ivory tracking-tight">
            {activeLevel.title}
          </h2>
          <p className="max-w-lg text-xs sm:text-sm text-muted mt-2 leading-relaxed">
            {activeLevel.description}
          </p>

          {/* Level Info Banner */}
          <div className="flex items-center justify-center gap-3 mt-4 text-xs font-mono">
            <div className="flex items-center gap-1 text-gold-400 px-3 py-1 rounded-md border border-gold-400/30 bg-gold-400/10">
              <Zap className="h-3.5 w-3.5 fill-gold-400" />
              <span>+{activeLevel.xpReward} XP Reward</span>
            </div>
            {highScore > 0 && (
              <div className="flex items-center gap-1 text-muted px-3 py-1 rounded-md border border-line bg-graphite">
                <Trophy className="h-3.5 w-3.5 text-gold-400" />
                <span>Personal Best: {highScore.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Key Controls Guide */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5 text-[11px] sm:text-xs text-muted font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-line bg-graphite">
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">←</span>
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">→</span>
              <span>or</span>
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">A</span>
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">D</span>
              <span className="text-muted ml-1">Steer</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-line bg-graphite">
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">P</span>
              <span>/</span>
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">ESC</span>
              <span className="text-muted ml-1">Pause</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-line bg-graphite">
              <span className="px-1 py-0.5 rounded bg-elevated text-ivory font-bold">SPACE</span>
              <span className="text-muted ml-1">Run</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={startGame}
              className="btn btn-primary px-7 py-3 text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
            >
              <Play className="h-4 w-4 fill-obsidian" />
              <span>START RUN</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowCodeLab(true);
              }}
              className="btn btn-secondary px-5 py-3 text-sm flex items-center gap-2 hover:border-gold-400/50"
            >
              <Code2 className="h-4 w-4 text-gold-400" />
              <span>DSA CODE LAB</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowLevelSelector(true);
              }}
              className="btn btn-secondary px-5 py-3 text-sm flex items-center gap-2"
              title="View All Levels"
            >
              <Layers className="h-4 w-4 text-gold-400" />
              <span>LEVEL ROADMAP</span>
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-obsidian/90 backdrop-blur-md text-center animate-fade-in">
          <div className="flex items-center justify-center h-14 w-14 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400 mb-3">
            <Pause className="h-7 w-7" />
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">RUN PAUSED</h3>
          <p className="text-xs text-muted font-mono uppercase tracking-wider mt-0.5">Arena on Standby</p>

          <div className="flex flex-col gap-3 max-w-xs w-full mt-6">
            <button
              onClick={resumeGame}
              className="btn btn-primary py-2.5 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(208,180,119,0.25)]"
            >
              <Play className="h-4 w-4 fill-obsidian" />
              <span>Resume Run</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowCodeLab(true);
              }}
              className="btn btn-secondary py-2.5 flex items-center justify-center gap-2 text-ivory border-gold-400/30"
            >
              <Code2 className="h-4 w-4 text-gold-400" />
              <span>Open DSA Code Lab</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowLevelSelector(true);
              }}
              className="btn btn-secondary py-2.5 flex items-center justify-center gap-2"
            >
              <Layers className="h-4 w-4 text-gold-400" />
              <span>Select Level / Roadmap</span>
            </button>

            <button
              onClick={restartGame}
              className="btn btn-secondary py-2.5 flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart Run</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowAudioSettings(true);
              }}
              className="btn btn-secondary py-2.5 flex items-center justify-center gap-2"
            >
              <Sliders className="h-4 w-4" />
              <span>Sound Settings</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                onExit();
              }}
              className="btn btn-secondary py-2.5 flex items-center justify-center gap-2 text-muted hover:text-ivory"
            >
              <span>Exit to Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* Syntax Learning Review Checkpoint Modal (Friendly Learning on Mistake) */}
      {gameState === 'review' && wrongReview && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md text-center animate-fade-in">
          <div className="flex items-center justify-center h-12 w-12 rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-400 mb-3 shadow-[0_0_15px_rgba(208,180,119,0.2)]">
            <AlertTriangle className="h-6 w-6 text-gold-400" />
          </div>

          <h3 className="font-display text-2xl font-bold text-ivory tracking-tight">SYNTAX CHECKPOINT</h3>
          <p className="text-xs text-muted font-mono mt-0.5">
            {wrongReview.livesLeft > 0 ? (
              <span className="text-red-400 font-semibold">-1 Heart ({wrongReview.livesLeft} remaining) · Zero academic XP penalty</span>
            ) : (
              <span className="text-red-400 font-semibold">Final Heart Lost · Reviewing Syntax Before Results</span>
            )}
          </p>

          <div className="max-w-md w-full mt-5 rounded-lg border border-line bg-graphite p-4 text-left shadow-lg">
            <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono">
              <span className="font-bold text-gold-400">{wrongReview.challenge.language}</span>
              <span>Syntax Check</span>
            </div>

            {/* Prompt with blank */}
            <div className="p-3 rounded bg-elevated border border-line font-mono text-sm text-ivory">
              <span>{wrongReview.challenge.promptBefore}</span>
              <span className="text-gold-400 underline font-bold px-1">{wrongReview.challenge.blank}</span>
              <span>{wrongReview.challenge.promptAfter}</span>
            </div>

            {/* Comparison tokens */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
              <div className="p-2 rounded border border-red-500/30 bg-red-500/10">
                <span className="text-[10px] uppercase text-red-400 block font-semibold">You Chose</span>
                <span className="text-sm font-bold text-red-400">{wrongReview.chosenToken}</span>
              </div>
              <div className="p-2 rounded border border-gold-400/40 bg-gold-400/10">
                <span className="text-[10px] uppercase text-gold-400 block font-semibold">Correct Token</span>
                <span className="text-sm font-bold text-gold-400">
                  {wrongReview.challenge.options[wrongReview.challenge.correctIndex]}
                </span>
              </div>
            </div>

            {/* Friendly explanation */}
            <p className="text-xs text-muted leading-relaxed mt-3 pt-2 border-t border-line">
              {wrongReview.challenge.explanation}
            </p>
          </div>

          <button
            onClick={continueAfterReview}
            className="btn btn-primary mt-6 px-8 py-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(208,180,119,0.25)]"
          >
            <span>{wrongReview.livesLeft > 0 ? 'Continue Run' : 'View Final Results'}</span>
          </button>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-obsidian/90 backdrop-blur-md text-center animate-fade-in">
          <div className="flex items-center justify-center h-14 w-14 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 mb-3">
            <Heart className="h-7 w-7" />
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">RUN TERMINATED</h3>
          <p className="text-xs text-red-400 font-mono uppercase tracking-wider mt-0.5">Lives Depleted</p>

          {/* Game Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg w-full mt-6">
            <div className="p-3 rounded-md border border-line bg-graphite">
              <span className="text-[10px] uppercase text-muted tracking-wider">Final Score</span>
              <p className="font-mono text-xl font-bold text-gold-400 mt-0.5">{score.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-md border border-line bg-graphite">
              <span className="text-[10px] uppercase text-muted tracking-wider">Distance</span>
              <p className="font-mono text-xl font-bold text-ivory mt-0.5">{distance} m</p>
            </div>
            <div className="p-3 rounded-md border border-line bg-graphite">
              <span className="text-[10px] uppercase text-muted tracking-wider">Best Streak</span>
              <p className="font-mono text-xl font-bold text-ivory mt-0.5">x{highestCombo}</p>
            </div>
            <div className="p-3 rounded-md border border-line bg-graphite">
              <span className="text-[10px] uppercase text-muted tracking-wider">Syntax Gates</span>
              <p className="font-mono text-xl font-bold text-ivory mt-0.5">{questionsSolved}</p>
            </div>
          </div>

          {score > highScore && (
            <p className="mt-4 text-xs font-mono text-gold-400 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              <span>NEW PERSONAL BEST!</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
            <button
              onClick={restartGame}
              className="btn btn-primary px-5 py-2.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.25)] text-xs"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowCodeLab(true);
              }}
              className="btn btn-secondary px-5 py-2.5 flex items-center gap-1.5 text-xs text-ivory border-gold-400/30"
            >
              <Code2 className="h-4 w-4 text-gold-400" />
              <span>DSA Code Lab</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                setShowLevelSelector(true);
              }}
              className="btn btn-secondary px-5 py-2.5 flex items-center gap-1.5 text-xs"
            >
              <Layers className="h-4 w-4 text-gold-400" />
              <span>Select Level</span>
            </button>

            <button
              onClick={() => {
                soundCtrl.playButtonClick();
                onExit();
              }}
              className="btn btn-secondary px-5 py-2.5 text-xs text-muted hover:text-ivory"
            >
              <span>Exit to Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">Sound Settings</h4>
              </div>
              <button
                onClick={() => {
                  soundCtrl.playButtonClick();
                  setShowAudioSettings(false);
                }}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Master Volume */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Master Sound</span>
                  <button
                    onClick={handleMasterMuteToggle}
                    className="font-mono text-[11px] text-gold-400 hover:underline"
                  >
                    {audioSettings.masterMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.masterMuted ? 0 : audioSettings.masterVolume}
                  onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>

              {/* Background Music */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Music (Cyber Synth)</span>
                  <button
                    onClick={handleMusicMuteToggle}
                    className="font-mono text-[11px] text-gold-400 hover:underline"
                  >
                    {audioSettings.musicMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.musicMuted ? 0 : audioSettings.musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>

              {/* Sound Effects */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Sound Effects (SFX)</span>
                  <button
                    onClick={handleSfxMuteToggle}
                    className="font-mono text-[11px] text-gold-400 hover:underline"
                  >
                    {audioSettings.sfxMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxMuted ? 0 : audioSettings.sfxVolume}
                  onChange={(e) => handleSfxVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => {
                  soundCtrl.playButtonClick();
                  setShowAudioSettings(false);
                }}
                className="btn btn-primary text-xs py-2 px-5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Selector Roadmap Modal */}
      <LevelSelector
        isOpen={showLevelSelector}
        onClose={() => setShowLevelSelector(false)}
        currentLevelId={activeLevel.id}
        unlockedLevelIds={progression.unlockedLevelIds}
        completedLevelIds={progression.completedLevelIds}
        onSelectLevel={handleSelectLevel}
        levelHighScores={progression.levelHighScores}
      />

      {/* DSA Code Lab & Interactive Test Suite Modal */}
      <DsaCodeLabModal
        isOpen={showCodeLab}
        onClose={() => setShowCodeLab(false)}
        level={activeLevel}
        onCompleteLevel={handleLevelComplete}
        isAlreadyCompleted={progression.completedLevelIds.includes(activeLevel.id)}
      />

      {/* Celebratory Level Clear Modal */}
      <LevelCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        level={activeLevel}
        earnedXP={completionEarnedXP || activeLevel.xpReward}
        hasNextLevel={Boolean(nextLevel && nextLevel.id)}
        nextLevelTitle={nextLevel?.title}
        onProceedNextLevel={() => {
          if (nextLevel) {
            handleSelectLevel(nextLevel.id);
          }
        }}
        onReplayLevel={() => {
          restartGame();
        }}
        onOpenLevelSelector={() => {
          setShowLevelSelector(true);
        }}
        stats={
          completionStats || {
            gatesCleared: questionsSolved,
            score: score,
            streak: highestCombo,
          }
        }
      />
    </div>
  );
}
