import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Crown,
  Dices,
  Loader2,
  Play,
  Sparkles,
  Trophy,
  Users,
  Zap,
  AlertOctagon,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders,
  X,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { cudoAudio, type CudoAudioSettings } from './cudoAudio';

export interface CudoPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  color: string;
  position: number;
  score: number;
  isAI: boolean;
  isReady: boolean;
}

export type TileType = 'start' | 'normal' | 'challenge' | 'hazard' | 'boost' | 'safe' | 'finish';

export interface BoardTile {
  index: number;
  label: string;
  type: TileType;
  description: string;
  effectValue?: number;
}

export interface CudoChallenge {
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const BOARD_TILES: BoardTile[] = [
  { index: 0, label: 'Init Terminal', type: 'start', description: 'Repository initialized. Ready to ship.' },
  { index: 1, label: 'Commit Genesis', type: 'normal', description: 'Initial commit created.' },
  { index: 2, label: 'DSA Challenge', type: 'challenge', description: 'Solve linked list traversal to advance.' },
  { index: 3, label: 'Unit Tests', type: 'normal', description: 'Test coverage verified.' },
  { index: 4, label: 'Turbo Compiler', type: 'boost', description: 'Optimized build: Advance +2 tiles!', effectValue: 2 },
  { index: 5, label: 'Segfault Bug', type: 'hazard', description: 'Memory violation: Go back 2 tiles!', effectValue: -2 },
  { index: 6, label: 'Bug Hunt', type: 'challenge', description: 'Spot off-by-one loop bug to earn +50 XP.' },
  { index: 7, label: 'Code Review', type: 'normal', description: 'Pull request approved with no comments.' },
  { index: 8, label: 'Checkpoint Alpha', type: 'safe', description: 'Milestone passed. Safe from hazards.' },
  { index: 9, label: 'SQL Optimizer', type: 'challenge', description: 'Optimize B-tree index query plan.' },
  { index: 10, label: 'Cache Hit', type: 'boost', description: 'L1 hit: Gain +50 bonus XP!', effectValue: 50 },
  { index: 11, label: 'Merge Conflict', type: 'hazard', description: 'Git collision: Swap positions with nearest player!' },
  { index: 12, label: 'AI Boundary', type: 'challenge', description: 'Tune hyperplane decision margin.' },
  { index: 13, label: 'Staging Build', type: 'normal', description: 'Docker container image compiled.' },
  { index: 14, label: 'GPU Accel', type: 'boost', description: 'CUDA kernels active: Advance +3 tiles!', effectValue: 3 },
  { index: 15, label: 'Infinite Loop', type: 'hazard', description: 'CPU 100%: Fall back 2 tiles!', effectValue: -2 },
  { index: 16, label: 'Checkpoint Beta', type: 'safe', description: 'Staging verified. Immunity active.' },
  { index: 17, label: 'Graph Routing', type: 'challenge', description: 'Calculate shortest Dijkstra path.' },
  { index: 18, label: 'Load Balancer', type: 'normal', description: 'Traffic distributed evenly.' },
  { index: 19, label: 'Fast Forward', type: 'boost', description: 'Skip CI queues: Advance +2 tiles!', effectValue: 2 },
  { index: 20, label: 'Deadlock Stall', type: 'hazard', description: 'Resource lock: Fall back 2 tiles!', effectValue: -2 },
  { index: 21, label: 'System Design', type: 'challenge', description: 'Architect high-availability cache.' },
  { index: 22, label: 'Kubernetes Pod', type: 'normal', description: 'Replica set scaled to 5 pods.' },
  { index: 23, label: 'Zero-Downtime', type: 'boost', description: 'Blue-green rollout: Advance +2 tiles!', effectValue: 2 },
  { index: 24, label: 'Checkpoint Gamma', type: 'safe', description: 'Pre-production dry run successful.' },
  { index: 25, label: 'Neural Weight', type: 'challenge', description: 'Backpropagation loss minimization.' },
  { index: 26, label: 'Memory Leak', type: 'hazard', description: 'OOM Killed: Go back 3 tiles!', effectValue: -3 },
  { index: 27, label: 'Security Audit', type: 'challenge', description: 'Neutralize SQL injection vector.' },
  { index: 28, label: 'Canary Release', type: 'boost', description: '10% traffic healthy: Advance +1 tile!', effectValue: 1 },
  { index: 29, label: 'Prod Outage', type: 'hazard', description: 'P1 Incident: Go back 2 tiles!', effectValue: -2 },
  { index: 30, label: 'Go-Live Gate', type: 'normal', description: 'Final sign-off from platform engineering.' },
  { index: 31, label: 'PRODUCTION DEPLOYMENT', type: 'finish', description: 'Global release shipped! VICTORY!' },
];

const MINI_CHALLENGES: CudoChallenge[] = [
  {
    title: 'Pointer Dereference',
    prompt: 'In C++, what does (*ptr) produce when ptr holds the memory address of an integer?',
    options: ['The value stored at that address', 'The address itself', 'A syntax error', 'Pointer size in bytes'],
    correctIndex: 0,
    explanation: 'Dereferencing a pointer using the asterisk (*) operator yields the underlying value stored at that memory address.',
  },
  {
    title: 'Stack Operations',
    prompt: 'Which fundamental principle defines Stack data structures?',
    options: ['LIFO (Last-In, First-Out)', 'FIFO (First-In, First-Out)', 'Random Access', 'Priority Ordering'],
    correctIndex: 0,
    explanation: 'Stacks operate under LIFO: the last item pushed is the first item popped.',
  },
  {
    title: 'QuickSort Partitioning',
    prompt: 'What is the average time complexity of QuickSort on an array of size N?',
    options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
    correctIndex: 0,
    explanation: 'QuickSort partitions arrays in O(N) over O(log N) recursive levels on average, yielding O(N log N).',
  },
  {
    title: 'HTTP Status Semantics',
    prompt: 'Which HTTP status code indicates a resource was successfully created?',
    options: ['201 Created', '200 OK', '204 No Content', '301 Moved'],
    correctIndex: 0,
    explanation: 'HTTP 201 Created is the standard REST status code confirming successful creation of a new entity.',
  },
  {
    title: 'Binary Search Bounds',
    prompt: 'What is the maximum number of comparisons Binary Search requires for an array of 1,000 elements?',
    options: ['10 comparisons', '100 comparisons', '500 comparisons', '1,000 comparisons'],
    correctIndex: 0,
    explanation: '2^10 = 1024 > 1000. Binary search inspects at most ceil(log2(1000)) = 10 elements.',
  },
];

interface CudoGameProps {
  onExit: () => void;
}

export function CudoGame({ onExit }: CudoGameProps) {
  const { currentUser, userProfile, updateUserXP } = useAuth();

  const [mode, setMode] = useState<'menu' | 'solo' | 'multiplayer-lobby' | 'multiplayer-game'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [players, setPlayers] = useState<CudoPlayer[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<{ challenge: CudoChallenge; playerIdx: number } | null>(null);
  const [winner, setWinner] = useState<CudoPlayer | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioSettings, setAudioSettings] = useState<CudoAudioSettings>({ ...cudoAudio.settings });
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const playerName = userProfile?.username || currentUser?.displayName || 'Cadet Operative';

  // Ambient board game music lifecycle
  useEffect(() => {
    if (mode === 'solo' || mode === 'multiplayer-game') {
      cudoAudio.startBackgroundMusic();
    } else {
      cudoAudio.stopBackgroundMusic();
    }
    return () => {
      cudoAudio.stopAll();
    };
  }, [mode]);

  // Solo Mode Setup
  const startSoloGame = () => {
    const human: CudoPlayer = {
      id: currentUser?.uid || 'human',
      name: playerName,
      color: '#D0B477', // Gold
      position: 0,
      score: 0,
      isAI: false,
      isReady: true,
    };
    const ai1: CudoPlayer = {
      id: 'ai-ada',
      name: 'Ada (AI)',
      color: '#38BDF8', // Cyan
      position: 0,
      score: 0,
      isAI: true,
      isReady: true,
    };
    const ai2: CudoPlayer = {
      id: 'ai-turing',
      name: 'Turing (AI)',
      color: '#34D399', // Emerald
      position: 0,
      score: 0,
      isAI: true,
      isReady: true,
    };
    const ai3: CudoPlayer = {
      id: 'ai-hopper',
      name: 'Hopper (AI)',
      color: '#A78BFA', // Purple
      position: 0,
      score: 0,
      isAI: true,
      isReady: true,
    };

    setPlayers([human, ai1, ai2, ai3]);
    setCurrentTurn(0);
    setDiceValue(null);
    setGameLog(['Game initialized: Solo Practice vs AI. First to Production Deployment wins!']);
    setWinner(null);
    setMode('solo');
  };

  // Create Multiplayer Room
  const createMultiplayerRoom = async () => {
    setIsConnecting(true);
    const code = 'CUDO-' + Math.floor(1000 + Math.random() * 9000);
    const hostPlayer: CudoPlayer = {
      id: currentUser?.uid || 'host',
      name: playerName,
      color: '#D0B477',
      position: 0,
      score: 0,
      isAI: false,
      isReady: true,
    };

    try {
      const roomRef = doc(db, 'cudo_rooms', code);
      await setDoc(roomRef, {
        code,
        hostId: currentUser?.uid || 'host',
        status: 'lobby',
        players: [hostPlayer],
        currentTurn: 0,
        diceValue: null,
        gameLog: [`Room ${code} created by ${playerName}. Awaiting cadets...`],
        createdAt: new Date().toISOString(),
      });
      setRoomCode(code);
      setIsHost(true);
      setPlayers([hostPlayer]);
      setMode('multiplayer-lobby');
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Join Multiplayer Room
  const joinMultiplayerRoom = async () => {
    if (!inputCode.trim()) return;
    setIsConnecting(true);
    const code = inputCode.trim().toUpperCase();

    try {
      const newPlayer: CudoPlayer = {
        id: currentUser?.uid || `guest-${Date.now()}`,
        name: playerName,
        color: '#38BDF8',
        position: 0,
        score: 0,
        isAI: false,
        isReady: true,
      };

      const roomRef = doc(db, 'cudo_rooms', code);
      await updateDoc(roomRef, {
        players: arrayUnion(newPlayer),
        gameLog: arrayUnion(`${playerName} joined the room!`),
      });

      setRoomCode(code);
      setIsHost(false);
      setMode('multiplayer-lobby');
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Room not found or expired. Please check the room code.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen to Firestore Room State
  useEffect(() => {
    if (!roomCode || mode === 'solo' || mode === 'menu') return;

    const roomRef = doc(db, 'cudo_rooms', roomCode);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.players) setPlayers(data.players);
        if (typeof data.currentTurn === 'number') setCurrentTurn(data.currentTurn);
        if (data.diceValue) setDiceValue(data.diceValue);
        if (data.gameLog) setGameLog(data.gameLog);
        if (data.status === 'playing' && mode === 'multiplayer-lobby') {
          setMode('multiplayer-game');
        }
        if (data.winner) setWinner(data.winner);
      }
    });

    return () => unsub();
  }, [roomCode, mode]);

  // Execute Dice Roll
  const handleRollDice = () => {
    if (isRolling || winner || activeChallenge) return;

    cudoAudio.playDiceRoll();
    setIsRolling(true);
    const roll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceValue(roll);
      setIsRolling(false);
      moveCurrentPlayer(roll);
    }, 700);
  };

  // Move Player Logic
  const moveCurrentPlayer = (steps: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      const p = { ...next[currentTurn] };
      let targetPos = Math.min(31, p.position + steps);
      const tile = BOARD_TILES[targetPos];

      cudoAudio.playPawnStep();

      const logMsg = `${p.name} rolled a ${steps} -> Landed on [${tile.index}] ${tile.label}`;
      const newLogs = [...gameLog, logMsg];

      // Handle Tile Effects
      if (tile.type === 'finish' || targetPos >= 31) {
        p.position = 31;
        p.score += 350;
        setWinner(p);
        cudoAudio.playVictory();
        newLogs.push(`🏆 ${p.name} reached PRODUCTION DEPLOYMENT and won the match!`);
        updateUserXP(350).catch(() => {});
      } else if (tile.type === 'boost' && tile.effectValue) {
        targetPos = Math.min(31, targetPos + tile.effectValue);
        p.position = targetPos;
        p.score += 50;
        cudoAudio.playBoost();
        newLogs.push(`⚡ Boost activated! ${p.name} jumped forward to [${targetPos}] ${BOARD_TILES[targetPos].label}`);
      } else if (tile.type === 'hazard' && tile.effectValue) {
        targetPos = Math.max(0, targetPos + tile.effectValue);
        p.position = targetPos;
        cudoAudio.playHazard();
        newLogs.push(`⚠️ Hazard encountered! ${p.name} fell back to [${targetPos}] ${BOARD_TILES[targetPos].label}`);
      } else if (tile.type === 'challenge') {
        p.position = targetPos;
        cudoAudio.playChallengeAlert();
        const randomChallenge = MINI_CHALLENGES[Math.floor(Math.random() * MINI_CHALLENGES.length)];
        setActiveChallenge({ challenge: randomChallenge, playerIdx: currentTurn });
      } else {
        p.position = targetPos;
      }

      next[currentTurn] = p;
      setGameLog(newLogs);

      // Rotate turn if not a challenge
      if (tile.type !== 'challenge' && !winner) {
        const nextTurn = (currentTurn + 1) % next.length;
        setCurrentTurn(nextTurn);
      }

      return next;
    });
  };

  // AI Turn Automator for Solo Mode
  useEffect(() => {
    if (mode !== 'solo' || winner || activeChallenge || isRolling) return;

    const currentPlayer = players[currentTurn];
    if (currentPlayer && currentPlayer.isAI) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, mode, players, winner, activeChallenge, isRolling]);

  // AI Challenge Resolver
  useEffect(() => {
    if (mode === 'solo' && activeChallenge) {
      const p = players[activeChallenge.playerIdx];
      if (p && p.isAI) {
        const timer = setTimeout(() => {
          // 80% AI success rate
          const success = Math.random() < 0.8;
          resolveChallenge(success);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChallenge, mode, players]);

  // Resolve Challenge
  const resolveChallenge = (correct: boolean) => {
    if (!activeChallenge) return;
    const { playerIdx } = activeChallenge;

    setPlayers((prev) => {
      const next = [...prev];
      const p = { ...next[playerIdx] };

      if (correct) {
        cudoAudio.playSuccessChime();
        p.score += 100;
        p.position = Math.min(31, p.position + 1);
        setGameLog((logs) => [
          ...logs,
          `✨ ${p.name} solved the Challenge correctly! (+100 XP & +1 Tile Advance)`,
        ]);
        if (!p.isAI) updateUserXP(100).catch(() => {});
      } else {
        cudoAudio.playFailureBuzz();
        setGameLog((logs) => [
          ...logs,
          `❌ ${p.name} failed the Challenge. (No advance)`,
        ]);
      }

      next[playerIdx] = p;
      return next;
    });

    setActiveChallenge(null);
    setCurrentTurn((prev) => (prev + 1) % players.length);
  };

  // Start Multiplayer match from lobby
  const launchMultiplayerMatch = async () => {
    if (!roomCode) return;
    try {
      const roomRef = doc(db, 'cudo_rooms', roomCode);
      await updateDoc(roomRef, {
        status: 'playing',
        gameLog: arrayUnion('Match started! May the best cadet ship to production!'),
      });
      setMode('multiplayer-game');
    } catch (err) {
      console.error('Failed to launch match:', err);
    }
  };

  // ── Render Menu ──
  if (mode === 'menu') {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <button
            onClick={onExit}
            className="text-xs font-mono text-muted hover:text-gold-400 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Exit to Games Hub
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-gold-400/10 border border-gold-400/30 text-gold-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            FLAGSHIP MULTIPLAYER
          </span>
        </div>

        {/* Hero Card */}
        <Card className="p-8 sm:p-10 border-gold-400/40 bg-gradient-to-r from-obsidian via-graphite to-elevated text-center relative overflow-hidden shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gold-400/10 border-2 border-gold-400/40 flex items-center justify-center text-gold-400 shadow-[0_0_40px_rgba(208,180,119,0.3)] mb-6">
            <Dices className="w-10 h-10" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ivory tracking-tight">
            CUDO: CODE & CONQUER
          </h1>
          <p className="text-sm sm:text-base text-muted mt-3 max-w-xl mx-auto leading-relaxed">
            The high-stakes Computer Science board game. Roll the dice, navigate the 32-tile cyber circuit, solve timed algorithm challenges, avoid segfault hazards, and race to Production Deployment!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={startSoloGame}
              className="w-full sm:w-auto btn btn-primary px-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(208,180,119,0.35)] hover:scale-105 transition-transform"
            >
              <Play className="w-4 h-4 fill-obsidian" />
              <span>PLAY SOLO VS AI</span>
            </button>

            <button
              onClick={createMultiplayerRoom}
              disabled={isConnecting}
              className="w-full sm:w-auto btn btn-secondary px-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2.5 hover:border-gold-400 hover:text-gold-400 transition-colors"
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              <span>HOST MULTIPLAYER ROOM</span>
            </button>
          </div>

          {/* Join Room Input */}
          <div className="mt-6 pt-6 border-t border-line/60 max-w-sm mx-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="ENTER ROOM CODE (e.g. CUDO-7842)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 bg-obsidian border border-line rounded-lg px-3.5 py-2.5 text-xs font-mono text-ivory placeholder:text-muted/60 focus:border-gold-400 focus:outline-none"
            />
            <button
              onClick={joinMultiplayerRoom}
              disabled={!inputCode.trim() || isConnecting}
              className="btn btn-secondary text-xs px-4 py-2.5 font-mono disabled:opacity-40"
            >
              Join
            </button>
          </div>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-line bg-graphite/60 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 mx-auto">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-display font-semibold text-ivory text-sm">Challenge Tiles</h4>
            <p className="text-xs text-muted">Solve DSA, C++, and AI dilemmas to advance faster and rack up XP.</p>
          </Card>

          <Card className="p-5 border-line bg-graphite/60 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h4 className="font-display font-semibold text-ivory text-sm">Hazards & Traps</h4>
            <p className="text-xs text-muted">Dodge Segfaults, Memory Leaks, and Merge Conflicts that swap positions.</p>
          </Card>

          <Card className="p-5 border-line bg-graphite/60 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="font-display font-semibold text-ivory text-sm">350 XP Grand Prize</h4>
            <p className="text-xs text-muted">First cadet to reach Production Deployment claims the winner's bounty.</p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Render Lobby ──
  if (mode === 'multiplayer-lobby') {
    return (
      <div className="animate-fade-in max-w-xl mx-auto space-y-6">
        <button
          onClick={() => setMode('menu')}
          className="text-xs font-mono text-muted hover:text-ivory flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Mode Select
        </button>

        <Card className="p-6 border-gold-400/40 bg-graphite space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400">
              MULTIPLAYER STAGING LOBBY
            </span>
            <h2 className="text-2xl font-display font-bold text-ivory">Room Code: {roomCode}</h2>
            <p className="text-xs text-muted">Share this code with up to 3 classmates to join your room.</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-muted">Cadets Connected ({players.length}/4)</h4>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-obsidian border border-line flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: p.color + '20', color: p.color, border: `1px solid ${p.color}` }}
                    >
                      P{idx + 1}
                    </div>
                    <span className="text-sm font-medium text-ivory">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> READY
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={launchMultiplayerMatch}
              className="w-full btn btn-primary py-3 font-mono text-xs flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-obsidian" /> START MATCH NOW
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-obsidian border border-line text-center text-xs font-mono text-gold-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Awaiting host to launch match...</span>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── Render Active Game (Solo or Multiplayer) ──
  const activePlayer = players[currentTurn];
  const isMyTurn = mode === 'solo' ? !activePlayer?.isAI : activePlayer?.id === currentUser?.uid;

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
      {/* Top Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-lg bg-elevated border border-line text-muted hover:text-ivory transition-colors"
            title="Leave Match"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gold-400/10 border border-gold-400/30 text-gold-400">
                {mode === 'solo' ? 'SOLO PRACTICE VS AI' : `ONLINE ROOM: ${roomCode}`}
              </span>
              <span className="text-[10px] font-mono text-muted">• Target: Tile 31</span>
            </div>
            <h2 className="text-xl font-display font-bold text-ivory">CUDO Cyber Track</h2>
          </div>
        </div>

        {/* Player Turn Pills & Audio Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAudioSettings(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-obsidian border border-line text-muted hover:text-gold-400 hover:border-gold-400/40 transition-colors flex items-center gap-1.5 text-xs font-mono"
            title="Configure CUDO Audio"
          >
            {audioSettings.masterMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-gold-400" />
            )}
            <span className="hidden sm:inline">Audio</span>
          </button>

          {players.map((p, idx) => {
            const isTurn = idx === currentTurn;
            return (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-all flex items-center gap-2 ${
                  isTurn
                    ? 'border-gold-400 bg-gold-400/20 text-ivory shadow-[0_0_15px_rgba(208,180,119,0.3)] scale-105'
                    : 'border-line bg-obsidian text-muted'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-semibold">{p.name}</span>
                <span className="text-[10px] opacity-75">T{p.position}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Board Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Interactive Board Grid (32 tiles arranged in circuit) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-2.5 sm:p-6 border-line bg-graphite/90 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
              {BOARD_TILES.map((tile) => {
                const occupants = players.filter((p) => p.position === tile.index);

                return (
                  <div
                    key={tile.index}
                    className={`relative p-1.5 sm:p-2.5 min-h-[64px] sm:min-h-[72px] rounded-lg sm:rounded-xl border flex flex-col justify-between transition-all ${
                      tile.type === 'finish'
                        ? 'border-gold-400 bg-gold-400/20 shadow-[0_0_20px_rgba(208,180,119,0.3)]'
                        : tile.type === 'hazard'
                        ? 'border-red-500/40 bg-red-500/10'
                        : tile.type === 'boost'
                        ? 'border-cyan-500/40 bg-cyan-500/10'
                        : tile.type === 'challenge'
                        ? 'border-purple-500/40 bg-purple-500/10'
                        : tile.type === 'safe'
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-line bg-obsidian'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono">
                      <span className="font-bold opacity-60">#{tile.index}</span>
                      {tile.type === 'hazard' && <span className="text-red-400">⚠️</span>}
                      {tile.type === 'boost' && <span className="text-cyan-400">⚡</span>}
                      {tile.type === 'challenge' && <span className="text-purple-400">⚔️</span>}
                      {tile.type === 'safe' && <span className="text-emerald-400">🛡️</span>}
                      {tile.type === 'finish' && <span className="text-gold-400">🏆</span>}
                    </div>

                    <div className="text-[9px] sm:text-[10px] font-medium leading-tight text-ivory truncate mt-0.5 sm:mt-1" title={tile.label}>
                      {tile.label}
                    </div>

                    {/* Occupants Pawns */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {occupants.map((occ) => (
                        <div
                          key={occ.id}
                          className="w-3.5 h-3.5 rounded-full border border-black shadow-md flex items-center justify-center text-[7px] font-bold text-black"
                          style={{ backgroundColor: occ.color }}
                          title={`${occ.name} (Tile ${occ.position})`}
                        >
                          ●
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Controls & Game Log */}
        <div className="space-y-4">
          {/* Turn Control Card */}
          <Card className="p-5 border-gold-400/30 bg-graphite text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted">ACTIVE TURN</span>
              <h3 className="font-display font-bold text-lg text-ivory flex items-center justify-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activePlayer?.color }}
                />
                {activePlayer?.name}
              </h3>
            </div>

            {/* Dice Roller Display */}
            <div className="w-24 h-24 mx-auto rounded-2xl bg-obsidian border-2 border-gold-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(208,180,119,0.2)]">
              {isRolling ? (
                <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
              ) : diceValue ? (
                <span className="text-4xl font-display font-extrabold text-gold-400 animate-fade-in">
                  {diceValue}
                </span>
              ) : (
                <Dices className="w-10 h-10 text-muted/40" />
              )}
            </div>

            <button
              onClick={handleRollDice}
              disabled={!isMyTurn || isRolling || Boolean(winner) || Boolean(activeChallenge)}
              className="w-full btn btn-primary py-3 font-mono text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(208,180,119,0.25)]"
            >
              <Dices className="w-4 h-4" />
              {isMyTurn ? 'ROLL COMPILER DICE (1-6)' : 'Awaiting turn...'}
            </button>
          </Card>

          {/* Telemetry Log Card */}
          <Card className="p-4 border-line bg-graphite space-y-2">
            <h4 className="text-xs font-mono uppercase text-muted flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-gold-400" />
              Match Telemetry Feed
            </h4>
            <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1.5 pr-1 text-[11px] font-mono text-muted">
              {gameLog.slice(-8).reverse().map((log, idx) => (
                <div key={idx} className="p-1.5 rounded bg-obsidian border border-line/40 text-ivory/80">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Challenge Pop-up Modal */}
      {activeChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full p-6 border-purple-500/50 bg-graphite shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  TILE CHALLENGE
                </span>
                <span className="text-xs font-mono text-muted">{players[activeChallenge.playerIdx]?.name}</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-lg text-ivory">
              {activeChallenge.challenge.title}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {activeChallenge.challenge.prompt}
            </p>

            <div className="space-y-2 pt-2">
              {activeChallenge.challenge.options.map((opt, oIdx) => (
                <button
                  key={opt}
                  onClick={() => resolveChallenge(oIdx === activeChallenge.challenge.correctIndex)}
                  className="w-full p-3 rounded-lg bg-obsidian border border-line text-left text-xs font-mono text-ivory hover:border-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Winner Celebration Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <Card className="max-w-md w-full p-8 border-gold-400/50 bg-gradient-to-b from-graphite to-obsidian text-center shadow-[0_0_50px_rgba(208,180,119,0.3)] space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gold-400/10 border-2 border-gold-400/50 flex items-center justify-center text-gold-400 shadow-[0_0_30px_rgba(208,180,119,0.4)] animate-bounce">
              <Crown className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-gold-400 font-bold">
                GLOBAL RELEASE DEPLOYED
              </span>
              <h2 className="text-3xl font-display font-extrabold text-ivory">
                {winner.name} Wins!
              </h2>
              <p className="text-xs text-muted">
                Completed the 32-tile circuit and shipped directly to production!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-obsidian border border-line text-xs font-mono text-gold-400">
              +{winner.score} Academic XP Earned
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary text-xs px-5 py-2.5 font-mono"
              >
                Back to Menu
              </button>
              <button
                onClick={startSoloGame}
                className="btn btn-primary text-xs px-5 py-2.5 font-mono"
              >
                Play Again
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-sm w-full p-6 border-gold-400/40 bg-graphite shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gold-400" />
                <h3 className="font-display font-bold text-sm text-ivory">CUDO Audio Controls</h3>
              </div>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="p-1 rounded-md text-muted hover:text-ivory"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory">Master Volume</span>
                <button
                  onClick={() => {
                    const next = !audioSettings.masterMuted;
                    cudoAudio.setMasterMute(next);
                    setAudioSettings({ ...cudoAudio.settings });
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    audioSettings.masterMuted
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {audioSettings.masterMuted ? 'Muted' : 'Active'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  cudoAudio.setMasterVolume(val);
                  setAudioSettings({ ...cudoAudio.settings });
                }}
                className="w-full accent-gold-400"
              />
            </div>

            {/* Music */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory">Board Ambience Music</span>
                <button
                  onClick={() => {
                    const next = !audioSettings.musicMuted;
                    cudoAudio.setMusicMute(next);
                    setAudioSettings({ ...cudoAudio.settings });
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    audioSettings.musicMuted
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {audioSettings.musicMuted ? 'Off' : 'On'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  cudoAudio.setMusicVolume(val);
                  setAudioSettings({ ...cudoAudio.settings });
                }}
                className="w-full accent-gold-400"
              />
            </div>

            {/* SFX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ivory">Sound Effects (Dice, Chimes)</span>
                <button
                  onClick={() => {
                    const next = !audioSettings.sfxMuted;
                    cudoAudio.setSfxMute(next);
                    setAudioSettings({ ...cudoAudio.settings });
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    audioSettings.sfxMuted
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {audioSettings.sfxMuted ? 'Off' : 'On'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  cudoAudio.setSfxVolume(val);
                  setAudioSettings({ ...cudoAudio.settings });
                }}
                className="w-full accent-gold-400"
              />
            </div>

            <button
              onClick={() => setShowAudioSettings(false)}
              className="w-full btn btn-primary text-xs py-2 font-mono"
            >
              Done
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
