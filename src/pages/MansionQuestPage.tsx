'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  GripVertical,
  Heart,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { mansionLevels } from '@/components/SyntaxMansion/levelsData';
import { mansionAudio } from '@/components/SyntaxMansion/mansionAudio';
import { GamePlayerAvatar, usePlayerIdentity } from '@/components/game-core';
import type { ClueItem, GridPosition, MansionLevel } from '@/components/SyntaxMansion/types';

interface MansionQuestPageProps {
  navigate?: (path: string) => void;
}

export function MansionQuestPage({ navigate }: MansionQuestPageProps) {
  const playerIdentity = usePlayerIdentity();

  // Level State
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel: MansionLevel = mansionLevels[currentLevelIndex] || mansionLevels[0];

  // Gameplay State
  const [playerPosition, setPlayerPosition] = useState<GridPosition>(currentLevel.playerSpawn);
  const [playerFacing, setPlayerFacing] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [activeClues, setActiveClues] = useState<ClueItem[]>(currentLevel.clues);
  const [collectedSnippetIds, setCollectedSnippetIds] = useState<string[]>([]);
  const [assembledOrder, setAssembledOrder] = useState<string[]>([]);
  const [lives, setLives] = useState<number>(3);
  const [sessionXP, setSessionXP] = useState<number>(0);

  // FX & Modals State
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [isMatrixActive, setIsMatrixActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [recentlyCollectedId, setRecentlyCollectedId] = useState<string | null>(null);

  // Drag and Drop Tracking
  const draggedIdRef = useRef<string | null>(null);

  // Reset or load level
  const loadLevel = useCallback((index: number) => {
    const lvl = mansionLevels[index] || mansionLevels[0];
    setCurrentLevelIndex(index);
    setPlayerPosition(lvl.playerSpawn);
    setPlayerFacing('down');
    setActiveClues(lvl.clues.map((c) => ({ ...c, collected: false })));
    setCollectedSnippetIds([]);
    setAssembledOrder([]);
    setValidationError(null);
    setShowSuccessModal(false);
    setShowGameOverModal(false);
    setIsMatrixActive(false);
  }, []);

  // Restart Current Floor
  const handleRestartFloor = () => {
    setLives(3);
    loadLevel(currentLevelIndex);
  };

  // Keyboard Movement Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is active
      if (showSuccessModal || showGameOverModal) return;

      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      let dx = 0;
      let dy = 0;
      let facing: 'up' | 'down' | 'left' | 'right' = playerFacing;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        dy = -1;
        facing = 'up';
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        dy = 1;
        facing = 'down';
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        dx = -1;
        facing = 'left';
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        dx = 1;
        facing = 'right';
      } else {
        return;
      }

      e.preventDefault();
      setPlayerFacing(facing);

      const targetX = playerPosition.x + dx;
      const targetY = playerPosition.y + dy;

      // 1. Boundary Check (10x10: 0..9)
      if (targetX < 0 || targetX > 9 || targetY < 0 || targetY > 9) return;

      // 2. Wall Check
      const isWall = currentLevel.walls.some((w) => w.x === targetX && w.y === targetY);
      if (isWall) return;

      // 3. Solid Furniture Check
      const isSolidFurniture = currentLevel.furniture.some(
        (f) => !f.isWalkable && f.x === targetX && f.y === targetY
      );
      if (isSolidFurniture) return;

      // Move player
      const nextPos = { x: targetX, y: targetY };
      setPlayerPosition(nextPos);
      if (!isAudioMuted) mansionAudio.playStep();

      // 4. Clue Collection Check
      const foundClue = activeClues.find(
        (c) => !c.collected && c.x === targetX && c.y === targetY
      );

      if (foundClue) {
        if (!isAudioMuted) mansionAudio.playCollect();

        // Mark collected
        setActiveClues((prev) =>
          prev.map((c) => (c.id === foundClue.id ? { ...c, collected: true } : c))
        );

        setCollectedSnippetIds((prev) => [...prev, foundClue.snippet.id]);
        setAssembledOrder((prev) => [...prev, foundClue.snippet.id]);

        setRecentlyCollectedId(foundClue.snippet.id);
        setTimeout(() => setRecentlyCollectedId(null), 1200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    playerPosition,
    playerFacing,
    activeClues,
    currentLevel,
    isAudioMuted,
    showSuccessModal,
    showGameOverModal,
  ]);

  // Virtual mobile movement trigger
  const handleVirtualMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    let dx = 0;
    let dy = 0;
    if (direction === 'up') dy = -1;
    if (direction === 'down') dy = 1;
    if (direction === 'left') dx = -1;
    if (direction === 'right') dx = 1;

    setPlayerFacing(direction);
    const targetX = playerPosition.x + dx;
    const targetY = playerPosition.y + dy;

    if (targetX < 0 || targetX > 9 || targetY < 0 || targetY > 9) return;
    if (currentLevel.walls.some((w) => w.x === targetX && w.y === targetY)) return;
    if (currentLevel.furniture.some((f) => !f.isWalkable && f.x === targetX && f.y === targetY)) return;

    setPlayerPosition({ x: targetX, y: targetY });
    if (!isAudioMuted) mansionAudio.playStep();

    const foundClue = activeClues.find(
      (c) => !c.collected && c.x === targetX && c.y === targetY
    );
    if (foundClue) {
      if (!isAudioMuted) mansionAudio.playCollect();
      setActiveClues((prev) =>
        prev.map((c) => (c.id === foundClue.id ? { ...c, collected: true } : c))
      );
      setCollectedSnippetIds((prev) => [...prev, foundClue.snippet.id]);
      setAssembledOrder((prev) => [...prev, foundClue.snippet.id]);
    }
  };

  // Drag and drop snippet reordering
  const handleDragStart = (id: string) => {
    draggedIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    const sourceId = draggedIdRef.current;
    if (!sourceId || sourceId === targetId) return;

    setAssembledOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(sourceId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, sourceId);
      return next;
    });

    draggedIdRef.current = null;
    setValidationError(null);
  };

  // Up/Down button reordering fallback
  const handleMoveSnippet = (index: number, direction: 'up' | 'down') => {
    setAssembledOrder((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setValidationError(null);
  };

  // Run & Validate Code
  const handleRunCode = () => {
    // 1. Missing snippets edge case check
    const totalRequired = currentLevel.clues.length;
    if (assembledOrder.length < totalRequired) {
      setValidationError(
        `Search the room for missing logic. (${assembledOrder.length} of ${totalRequired} clues collected)`
      );
      return;
    }

    // 2. Validate current order vs correctOrder
    const isCorrect =
      assembledOrder.length === currentLevel.correctOrder.length &&
      assembledOrder.every((id, idx) => id === currentLevel.correctOrder[idx]);

    if (isCorrect) {
      // SUCCESS!
      if (!isAudioMuted) mansionAudio.playSuccess();
      setIsMatrixActive(true);
      setSessionXP((xp) => xp + currentLevel.xpReward);
      setValidationError(null);

      // Trigger matrix cascade effect over grid before modal
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 700);
    } else {
      // ERROR!
      if (!isAudioMuted) mansionAudio.playError();
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 500);

      // Deduct 1 life
      const nextLives = lives - 1;
      setLives(nextLives);

      // Deduct 5 XP (clamped at 0)
      setSessionXP((xp) => Math.max(0, xp - 5));

      // Error Diagnostic Feedback
      setValidationError(
        'Compilation / Logic Error: Line sequence is invalid. Re-check block enclosures and declaration order.'
      );

      // Check Game Over
      if (nextLives <= 0) {
        if (!isAudioMuted) mansionAudio.playGameOver();
        setTimeout(() => setShowGameOverModal(true), 400);
      }
    }
  };

  // Advance to Next Floor
  const handleNextFloor = () => {
    if (currentLevelIndex < mansionLevels.length - 1) {
      loadLevel(currentLevelIndex + 1);
    } else {
      // Finished all floors, loop or return
      loadLevel(0);
    }
  };

  const isTerminalActive = collectedSnippetIds.length > 0;
  const allSnippetsCollected = assembledOrder.length === currentLevel.clues.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-10">
      {/* HUD Bar Above Viewport */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {navigate && (
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded border border-slate-800 bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Games</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-cyan-400 text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                <Terminal className="h-4 w-4" />
                THE SYNTAX MANSION
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                {currentLevel.floorTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden md:block">
              {currentLevel.subtitle}
            </p>
          </div>
        </div>

        {/* Telemetry Stats: Lives & Session XP */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Focus Lives */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 shadow-inner">
            <span className="text-[10px] uppercase text-slate-400 font-semibold mr-1">LIVES</span>
            {[1, 2, 3].map((heartIndex) => (
              <Heart
                key={heartIndex}
                className={`h-4 w-4 transition-transform duration-200 ${
                  heartIndex <= lives
                    ? 'text-red-500 fill-red-500 scale-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                    : 'text-slate-700 fill-transparent scale-90'
                }`}
              />
            ))}
          </div>

          {/* Session XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 shadow-inner">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{sessionXP} XP</span>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => setIsAudioMuted((m) => !m)}
            className="p-2 rounded-lg border border-slate-800 bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Toggle Sound Effects"
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Two-Pane Interactive Layout (70% Grid, 30% Terminal) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5 flex-1 flex flex-col lg:flex-row gap-6">
        {/* LEFT PANE (70% Width): 2D Mansion Grid & Quest Prompt */}
        <div className="lg:w-[70%] flex flex-col space-y-4">
          {/* Active Quest Prompt Banner */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold block">
                  Active Mission
                </span>
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed mt-0.5">
                  {currentLevel.prompt}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-400">
                  <span>Arrow keys or WASD to navigate</span>
                  <span>·</span>
                  <span className="text-cyan-300">
                    Clues Found: {collectedSnippetIds.length} / {currentLevel.clues.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 10x10 Geometric Mansion Grid Container */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-5 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Matrix Green Cascade Overlay when solving */}
            {isMatrixActive && (
              <div className="absolute inset-0 z-30 pointer-events-none bg-emerald-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center animate-fade-in overflow-hidden">
                <div className="absolute inset-0 flex justify-around opacity-40 font-mono text-emerald-400 text-xs">
                  {['0101', '1100', '1010', '0011', '1111', '0110', '1001'].map((code, idx) => (
                    <div key={idx} className="animate-matrix-rain">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-2xl">
                  <Sparkles className="h-8 w-8 text-emerald-400 animate-spin" />
                  <span className="font-mono font-bold text-emerald-300 text-sm tracking-wider">
                    PARSING C++ BINARY...
                  </span>
                </div>
              </div>
            )}

            {/* 10x10 Tile Grid */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 w-full max-w-[560px] aspect-square">
              {Array.from({ length: 10 }).map((_, rowIndex) =>
                Array.from({ length: 10 }).map((_, colIndex) => {
                  const isPlayer = playerPosition.x === colIndex && playerPosition.y === rowIndex;
                  const isWall = currentLevel.walls.some(
                    (w) => w.x === colIndex && w.y === rowIndex
                  );
                  const furniture = currentLevel.furniture.find(
                    (f) => f.x === colIndex && f.y === rowIndex
                  );
                  const clue = activeClues.find(
                    (c) => !c.collected && c.x === colIndex && c.y === rowIndex
                  );

                  return (
                    <div
                      key={`${colIndex}-${rowIndex}`}
                      className={`
                        relative rounded-md flex items-center justify-center aspect-square select-none transition-colors duration-150
                        ${
                          isWall
                            ? 'bg-slate-800 border border-slate-700 shadow-inner'
                            : furniture
                            ? 'bg-slate-900 border border-slate-800/90'
                            : 'bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60'
                        }
                      `}
                    >
                      {/* Wall Texture Graphic */}
                      {isWall && (
                        <div className="w-full h-full flex items-center justify-center opacity-40 text-slate-500 font-mono text-[9px]">
                          ///
                        </div>
                      )}

                      {/* Furniture Icon */}
                      {furniture && (
                        <div
                          className="flex flex-col items-center justify-center text-slate-400"
                          title={furniture.name}
                        >
                          <span className="text-[10px] font-mono text-cyan-400/80">■</span>
                          <span className="text-[8px] font-mono tracking-tighter text-slate-500 hidden sm:block">
                            {furniture.name.slice(0, 4)}
                          </span>
                        </div>
                      )}

                      {/* Uncollected Clue (Steppable) */}
                      {clue && !isPlayer && (
                        <div className="absolute inset-0 flex items-center justify-center animate-clue-pulse">
                          <div className="h-5 w-5 rounded-full border border-cyan-400 bg-cyan-400/20 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                            <span className="font-mono text-[10px] font-bold text-cyan-300">?</span>
                          </div>
                        </div>
                      )}

                      {/* Player Avatar via Game Core Component */}
                      {isPlayer && (
                        <div className="relative z-20 transition-all duration-150 ease-out flex items-center justify-center">
                          <GamePlayerAvatar
                            identity={playerIdentity}
                            size="sm"
                            showRing={true}
                            showDirectionPip={true}
                            facing={playerFacing}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Touch Navigation Virtual D-Pad */}
            <div className="mt-4 flex sm:hidden items-center justify-center gap-2">
              <div className="grid grid-cols-3 gap-1.5 w-32">
                <div />
                <button
                  onClick={() => handleVirtualMove('up')}
                  className="h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold flex items-center justify-center active:bg-cyan-500 active:text-slate-950"
                >
                  ▲
                </button>
                <div />
                <button
                  onClick={() => handleVirtualMove('left')}
                  className="h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold flex items-center justify-center active:bg-cyan-500 active:text-slate-950"
                >
                  ◀
                </button>
                <button
                  onClick={() => handleVirtualMove('down')}
                  className="h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold flex items-center justify-center active:bg-cyan-500 active:text-slate-950"
                >
                  ▼
                </button>
                <button
                  onClick={() => handleVirtualMove('right')}
                  className="h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold flex items-center justify-center active:bg-cyan-500 active:text-slate-950"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE (30% Width): The Assembly Terminal */}
        <div className="lg:w-[30%] flex flex-col">
          <div
            className={`
              rounded-2xl border flex-1 flex flex-col p-4 sm:p-5 transition-all duration-300 min-h-[480px]
              ${
                isGlitching
                  ? 'border-red-500 bg-red-950/20 animate-glitch-shake'
                  : isTerminalActive
                  ? 'border-cyan-500/40 bg-slate-900 shadow-2xl'
                  : 'border-slate-800 bg-slate-900/40 opacity-70'
              }
            `}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className={`h-4 w-4 ${isTerminalActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-200">
                  Assembly Terminal
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isTerminalActive
                    ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-400 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
                }`}
              >
                {isTerminalActive ? 'READY' : 'LOCKED'}
              </span>
            </div>

            {/* Locked State when 0 clues collected */}
            {!isTerminalActive ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-14 w-14 rounded-full border border-slate-800 bg-slate-800/40 flex items-center justify-center text-slate-600">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="font-mono text-sm font-semibold text-slate-400">Terminal Dormant</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-xs">
                  Step on glowing markers around the room to extract C++ logic fragments into this
                  buffer.
                </p>
              </div>
            ) : (
              /* Active Reorderable Assembly Buffer */
              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Drag or use arrows to order:</span>
                  <span className="text-cyan-400">
                    {assembledOrder.length}/{currentLevel.clues.length} Collected
                  </span>
                </div>

                {/* Draggable Code Blocks */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {assembledOrder.map((snippetId, index) => {
                    const clue = currentLevel.clues.find((c) => c.snippet.id === snippetId);
                    if (!clue) return null;
                    const isRecentlyCollected = recentlyCollectedId === snippetId;

                    return (
                      <div
                        key={snippetId}
                        draggable
                        onDragStart={() => handleDragStart(snippetId)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(snippetId)}
                        className={`
                          p-2.5 rounded-lg border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all select-none
                          ${
                            isRecentlyCollected
                              ? 'border-cyan-400 bg-cyan-950/40 animate-pulse'
                              : 'border-slate-800 bg-slate-950 hover:border-cyan-500/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <GripVertical className="h-4 w-4 text-slate-600 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-500 w-4 text-right">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <code className="font-mono text-xs text-cyan-300 truncate">
                            {clue.snippet.text}
                          </code>
                        </div>

                        {/* Line Move Up/Down buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveSnippet(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-20"
                            title="Move Line Up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSnippet(index, 'down')}
                            disabled={index === assembledOrder.length - 1}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-20"
                            title="Move Line Down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="p-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-mono leading-relaxed flex items-start gap-2">
                    <Flame className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Run Code Button */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={handleRunCode}
                    className={`
                      w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all
                      ${
                        allSnippetsCollected
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 cursor-pointer'
                      }
                    `}
                    title={
                      allSnippetsCollected
                        ? 'Validate and compile program'
                        : 'Search the room for missing logic.'
                    }
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>RUN CODE</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Floor Cleared (Success Modal) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 sm:p-8 shadow-2xl text-center">
            <div className="h-16 w-16 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-[0_0_24px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              Execution Succeeded (Exit Code 0)
            </span>
            <h3 className="font-display text-2xl font-bold text-slate-100 mt-1">
              FLOOR CLEARED!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The assembled C++ program passed compilation and returned output:
            </p>

            {/* Code Output Display */}
            <div className="my-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-left font-mono text-xs text-emerald-300">
              <span className="text-slate-500 block text-[10px] uppercase mb-1">&gt; Console Output</span>
              <span>{currentLevel.expectedOutput}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/50 text-xs font-mono mb-6">
              <span className="text-slate-400">Reward Awarded:</span>
              <span className="text-emerald-400 font-bold">+{currentLevel.xpReward} XP</span>
            </div>

            <button
              onClick={handleNextFloor}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-transform hover:scale-[1.02]"
            >
              {currentLevelIndex < mansionLevels.length - 1
                ? `Ascend to Floor ${currentLevelIndex + 2}`
                : 'Complete Mansion Expedition'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Brain Fried (Game Over Modal) */}
      {showGameOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-red-500/40 bg-slate-900 p-6 sm:p-8 shadow-2xl text-center">
            <div className="h-16 w-16 rounded-full border border-red-500/40 bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-4">
              <Flame className="h-8 w-8" />
            </div>

            <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-semibold">
              Logic Overflow · Lives Depleted
            </span>
            <h3 className="font-display text-2xl font-bold text-slate-100 mt-1">
              BRAIN FRIED
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You exhausted your 3 lives through syntax sequence mismatches. Reset the floor to
              replenish your focus and try again!
            </p>

            <div className="mt-6">
              <button
                onClick={handleRestartFloor}
                className="w-full py-3 rounded-xl bg-red-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restart Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
