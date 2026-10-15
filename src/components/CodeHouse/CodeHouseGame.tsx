import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  DoorOpen,
  Flame,
  Gamepad2,
  Heart,
  HelpCircle,
  Key,
  Layers,
  Lock,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { floorsData } from './floorsData';
import { validateCodeAssembly } from './validator';
import { houseAudio } from './audio';
import { CodeHouseCanvas } from './CodeHouseCanvas';
import type {
  AssembledLine,
  CodeFragment,
  FloorId,
  Position,
  StudentCodeHouseData,
  ValidationFeedback,
  WorldObject,
} from './types';

interface CodeHouseGameProps {
  onExit: () => void;
}

const STORAGE_PREFIX = 'avenir_codehouse_';

const DEFAULT_STUDENT_DATA = (studentId: string): StudentCodeHouseData => ({
  studentId,
  unlockedFloors: [1],
  completedFloors: [],
  discoveredFragmentIds: [],
  collectedKeyIds: [],
  discoveredClueIds: [],
  floorAttempts: { 1: 0, 2: 0, 3: 0, 4: 0 },
  floorBestTimes: { 1: 0, 2: 0, 3: 0, 4: 0 },
  totalXP: 0,
});

export function CodeHouseGame({ onExit }: CodeHouseGameProps) {
  const { selectedStudent } = useStudentProfiles();

  // Current Floor & Persistence State
  const [currentFloorId, setCurrentFloorId] = useState<FloorId>(1);
  const [saveData, setSaveData] = useState<StudentCodeHouseData>(() =>
    DEFAULT_STUDENT_DATA(selectedStudent.id)
  );

  // Gameplay State
  const [gameState, setGameState] = useState<
    'intro' | 'exploring' | 'inspect' | 'journal' | 'floormap' | 'success' | 'failed'
  >('intro');
  const [hearts, setHearts] = useState<number>(3);
  const [assembledLines, setAssembledLines] = useState<AssembledLine[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationFeedback | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Inspector Modal State
  const [inspectedObject, setInspectedObject] = useState<WorldObject | null>(null);
  const [nearbyObject, setNearbyObject] = useState<WorldObject | null>(null);

  // Mobile / UI Drawers
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);
  const [audioSettings, setAudioSettings] = useState(houseAudio.settings);

  // Movement & Avatar state
  const activeFloor = useMemo(() => floorsData[currentFloorId], [currentFloorId]);
  const [playerPos, setPlayerPos] = useState<Position>(activeFloor.playerSpawn);
  const [playerFacing, setPlayerFacing] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Load saved student data on mount or when student changes
  useEffect(() => {
    const key = `${STORAGE_PREFIX}${selectedStudent.id}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: StudentCodeHouseData = JSON.parse(stored);
        setSaveData(parsed);
        // Set current floor to highest unlocked
        const maxUnlocked = Math.max(...(parsed.unlockedFloors || [1])) as FloorId;
        setCurrentFloorId(maxUnlocked);
      } else {
        const initial = DEFAULT_STUDENT_DATA(selectedStudent.id);
        setSaveData(initial);
        setCurrentFloorId(1);
      }
    } catch {
      setSaveData(DEFAULT_STUDENT_DATA(selectedStudent.id));
    }
  }, [selectedStudent.id]);

  // Save student data to localStorage
  const persistSaveData = useCallback(
    (updater: (prev: StudentCodeHouseData) => StudentCodeHouseData) => {
      setSaveData((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${selectedStudent.id}`, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [selectedStudent.id]
  );

  // Ambient sound management
  useEffect(() => {
    houseAudio.startAmbience();
    return () => {
      houseAudio.teardown();
    };
  }, []);

  // Floor Timer
  useEffect(() => {
    if (gameState !== 'exploring') return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard navigation & controls with focus check
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      activeKeysRef.current.add(e.code);

      // Interact with nearby object on 'E' or 'Enter'
      if (e.code === 'KeyE' || e.code === 'Enter') {
        if (gameState === 'exploring' && nearbyObject) {
          handleInteract(nearbyObject);
        } else if (gameState === 'inspect') {
          closeInspectModal();
        }
      } else if (e.code === 'KeyJ') {
        // Toggle Journal
        setGameState((curr) => (curr === 'journal' ? 'exploring' : 'journal'));
      } else if (e.code === 'KeyM') {
        // Toggle Floor Map
        setGameState((curr) => (curr === 'floormap' ? 'exploring' : 'floormap'));
      } else if (e.code === 'Escape') {
        if (gameState === 'inspect' || gameState === 'journal' || gameState === 'floormap') {
          setGameState('exploring');
          setInspectedObject(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, nearbyObject]);

  // Change Floor
  const changeFloor = (newFloorId: FloorId) => {
    setCurrentFloorId(newFloorId);
    const newFloor = floorsData[newFloorId];
    setPlayerPos(newFloor.playerSpawn);
    setPlayerFacing('down');
    setIsMoving(false);
    setHearts(3);
    setAssembledLines([]);
    setValidationResult(null);
    setElapsedSeconds(0);
    setGameState('exploring');
    setInspectedObject(null);
    setNearbyObject(null);
    houseAudio.playDoorUnlock();
  };

  // Start Playing from Intro
  const startExploring = () => {
    houseAudio.playTerminalBeep();
    setGameState('exploring');
  };

  // Interact with World Object
  const handleInteract = (obj: WorldObject) => {
    houseAudio.playInspect();
    setInspectedObject(obj);
    setGameState('inspect');

    // If object gives a key and not collected yet
    if (obj.givesKeyId && !saveData.collectedKeyIds.includes(obj.givesKeyId)) {
      houseAudio.playKeyPickup();
      persistSaveData((prev) => ({
        ...prev,
        collectedKeyIds: [...prev.collectedKeyIds, obj.givesKeyId!],
      }));
    }

    // If object gives a fragment and not discovered yet
    if (obj.givesFragmentId && !saveData.discoveredFragmentIds.includes(obj.givesFragmentId)) {
      houseAudio.playFragmentPickup();
      persistSaveData((prev) => ({
        ...prev,
        discoveredFragmentIds: [...prev.discoveredFragmentIds, obj.givesFragmentId!],
      }));
    }

    // If object gives a clue note
    if (obj.clueText && !saveData.discoveredClueIds.includes(obj.id)) {
      persistSaveData((prev) => ({
        ...prev,
        discoveredClueIds: [...prev.discoveredClueIds, obj.id],
      }));
    }
  };

  // Close Inspection Modal
  const closeInspectModal = () => {
    setInspectedObject(null);
    setGameState('exploring');
  };

  // Insert Fragment into Assembled Lines
  const handleInsertFragment = (fragment: CodeFragment) => {
    houseAudio.playLineClick();
    const newLine: AssembledLine = {
      instanceId: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fragmentId: fragment.id,
      code: fragment.code,
      category: fragment.category,
    };
    setAssembledLines((lines) => [...lines, newLine]);
    setValidationResult(null);
  };

  // Remove Line from Assembled Code
  const handleRemoveLine = (instanceId: string) => {
    houseAudio.playLineClick();
    setAssembledLines((lines) => lines.filter((l) => l.instanceId !== instanceId));
    setValidationResult(null);
  };

  // Move Line Up / Down
  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    houseAudio.playLineClick();
    setAssembledLines((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setValidationResult(null);
  };

  // Clear all assembled lines
  const handleClearLines = () => {
    houseAudio.playLineClick();
    setAssembledLines([]);
    setValidationResult(null);
  };

  // Run and Validate Assembled Solution
  const handleValidateSolution = () => {
    houseAudio.playTerminalBeep();
    setIsValidating(true);

    setTimeout(() => {
      setIsValidating(false);
      const result = validateCodeAssembly(currentFloorId, assembledLines);
      setValidationResult(result);

      if (result.isValid) {
        // Triumphant Success!
        houseAudio.playValidationSuccess();
        setGameState('success');

        // Persist completion and unlock next floor
        const nextFloor = (currentFloorId + 1) as FloorId;
        persistSaveData((prev) => {
          const unlocked = new Set(prev.unlockedFloors);
          if (nextFloor <= 4) unlocked.add(nextFloor);

          const completed = new Set(prev.completedFloors);
          const isFirstTime = !completed.has(currentFloorId);
          completed.add(currentFloorId);

          const xpGain = isFirstTime ? activeFloor.quest.xpReward : 0;

          return {
            ...prev,
            unlockedFloors: Array.from(unlocked) as FloorId[],
            completedFloors: Array.from(completed) as FloorId[],
            totalXP: prev.totalXP + xpGain,
            floorBestTimes: {
              ...prev.floorBestTimes,
              [currentFloorId]:
                prev.floorBestTimes[currentFloorId] === 0
                  ? elapsedSeconds
                  : Math.min(prev.floorBestTimes[currentFloorId], elapsedSeconds),
            },
          };
        });
      } else {
        // Error occurred
        houseAudio.playValidationError();
        if (result.isHeartLost) {
          setHearts((h) => {
            const nextH = h - 1;
            if (nextH <= 0) {
              setGameState('failed');
            }
            return Math.max(0, nextH);
          });
        }
      }
    }, 450);
  };

  // Retry Floor after Out of Hearts
  const handleRetryQuest = () => {
    houseAudio.playTerminalBeep();
    setHearts(3);
    setValidationResult(null);
    setGameState('exploring');
  };

  // Mobile virtual joystick triggers
  const triggerMobileMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    const codeMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    };
    activeKeysRef.current.add(codeMap[dir]);
    setTimeout(() => {
      activeKeysRef.current.delete(codeMap[dir]);
    }, 180);
  };

  // Discovered Fragments for current floor
  const discoveredFloorFragments = useMemo(() => {
    return activeFloor.fragments.filter((frag) =>
      saveData.discoveredFragmentIds.includes(frag.id)
    );
  }, [activeFloor.fragments, saveData.discoveredFragmentIds]);

  return (
    <div className="relative flex flex-col w-full min-h-[720px] bg-obsidian text-ivory rounded-2xl border border-line overflow-hidden shadow-2xl">
      {/* Top Atmospheric Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-line bg-graphite/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              houseAudio.playLineClick();
              onExit();
            }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ivory px-2.5 py-1.5 rounded border border-line bg-elevated transition-colors"
            title="Return to Games Hub"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Games Hub</span>
          </button>

          <div className="h-4 w-px bg-line" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-gold-400">
                THE CODE HOUSE
              </span>
              <span className="badge bg-gold-400/10 text-gold-400 text-[10px] border border-gold-400/30">
                Floor {currentFloorId}: {activeFloor.name}
              </span>
            </div>
            <p className="text-[11px] text-muted hidden md:block">
              {activeFloor.levelBadge} · {activeFloor.quest.subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right Header Telemetry */}
        <div className="flex items-center gap-3">
          {/* Hearts Meter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded border border-line bg-elevated">
            {[1, 2, 3].map((hIndex) => (
              <Heart
                key={hIndex}
                className={`h-4 w-4 transition-transform duration-200 ${
                  hIndex <= hearts
                    ? 'text-red-500 fill-red-500 scale-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                    : 'text-muted/30 fill-transparent scale-90'
                }`}
              />
            ))}
          </div>

          {/* Floor Map Button */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setGameState((s) => (s === 'floormap' ? 'exploring' : 'floormap'));
            }}
            className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            title="View Mansion Map [M]"
          >
            <Layers className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden sm:inline">Floors</span>
          </button>

          {/* Journal Button */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setGameState((s) => (s === 'journal' ? 'exploring' : 'journal'));
            }}
            className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            title="Inspect Clue Journal [J]"
          >
            <BookOpen className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden sm:inline">Journal</span>
            {saveData.discoveredClueIds.length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            )}
          </button>

          {/* Audio Controls */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setShowAudioSettings(true);
            }}
            className="p-1.5 rounded border border-line bg-elevated text-muted hover:text-ivory transition-colors"
            title="Sound Settings"
          >
            {audioSettings.masterMuted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-gold-400" />
            )}
          </button>

          {/* Mobile Panel Toggle */}
          <button
            onClick={() => setMobilePanelOpen((o) => !o)}
            className="lg:hidden btn btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Game Viewport */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: 2D Canvas Mansion Exploration */}
        <div className="relative flex-1 flex flex-col p-4 bg-obsidian">
          {/* Floor Subtitle and Quick Status */}
          <div className="flex items-center justify-between mb-2 text-xs text-muted font-mono">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-gold-400" />
              <span>Use WASD or Arrows to explore rooms · Walk near objects to inspect</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span>Keys: {saveData.collectedKeyIds.length}</span>
              <span>·</span>
              <span>
                Fragments: {discoveredFloorFragments.length} / {activeFloor.fragments.length}
              </span>
              <span>·</span>
              <span>Time: {elapsedSeconds}s</span>
            </div>
          </div>

          {/* Interactive Top-Down Canvas */}
          <CodeHouseCanvas
            floor={activeFloor}
            playerPos={playerPos}
            playerFacing={playerFacing}
            isMoving={isMoving}
            discoveredFragmentIds={saveData.discoveredFragmentIds}
            collectedKeyIds={saveData.collectedKeyIds}
            nearbyObject={nearbyObject}
            onNearbyObjectChange={setNearbyObject}
            onInteract={handleInteract}
            onPlayerMove={(pos, facing, moving) => {
              setPlayerPos(pos);
              setPlayerFacing(facing);
              setIsMoving(moving);
            }}
            activeKeys={activeKeysRef.current}
          />

          {/* Mobile On-Screen Virtual Controls */}
          <div className="lg:hidden flex items-center justify-between mt-3 px-2">
            {/* Virtual Directional D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <button
                onClick={() => triggerMobileMove('up')}
                className="h-9 rounded bg-elevated border border-line text-ivory font-bold flex items-center justify-center active:bg-gold-400 active:text-obsidian"
              >
                ▲
              </button>
              <div />
              <button
                onClick={() => triggerMobileMove('left')}
                className="h-9 rounded bg-elevated border border-line text-ivory font-bold flex items-center justify-center active:bg-gold-400 active:text-obsidian"
              >
                ◀
              </button>
              <button
                onClick={() => triggerMobileMove('down')}
                className="h-9 rounded bg-elevated border border-line text-ivory font-bold flex items-center justify-center active:bg-gold-400 active:text-obsidian"
              >
                ▼
              </button>
              <button
                onClick={() => triggerMobileMove('right')}
                className="h-9 rounded bg-elevated border border-line text-ivory font-bold flex items-center justify-center active:bg-gold-400 active:text-obsidian"
              >
                ▶
              </button>
            </div>

            {/* Contextual Action Button */}
            <button
              onClick={() => {
                if (nearbyObject) handleInteract(nearbyObject);
              }}
              disabled={!nearbyObject}
              className="btn btn-primary px-6 py-3 flex items-center gap-2 shadow-lg disabled:opacity-40"
            >
              <Key className="h-4 w-4 fill-obsidian" />
              <span>{nearbyObject ? `Inspect` : `Inspect [E]`}</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Persistent Quest Terminal & Code Assembly Panel */}
        <div
          className={`
            lg:w-[460px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-line bg-graphite flex flex-col z-20 transition-all duration-300
            ${mobilePanelOpen ? 'fixed inset-x-0 bottom-0 top-16 z-40' : 'hidden lg:flex'}
          `}
        >
          {/* Panel Header */}
          <div className="p-4 border-b border-line bg-elevated flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-gold-400" />
              <h3 className="font-display font-semibold text-sm text-ivory">
                Quest Terminal & Code Assembly
              </h3>
            </div>
            {mobilePanelOpen && (
              <button
                onClick={() => setMobilePanelOpen(false)}
                className="p-1 rounded text-muted hover:text-ivory lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
            {/* Quest Briefing Card */}
            <div className="rounded-lg border border-gold-400/30 bg-gold-400/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-gold-400 font-semibold">
                <span>{activeFloor.quest.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-400/20 border border-gold-400/40">
                  +{activeFloor.quest.xpReward} XP
                </span>
              </div>
              <p className="text-muted leading-relaxed font-sans">{activeFloor.quest.storyBrief}</p>
              <div className="pt-2 border-t border-gold-400/20 flex items-center justify-between text-[11px]">
                <span className="text-muted">Target Output:</span>
                <span className="text-gold-400 font-bold bg-graphite px-2 py-0.5 rounded border border-line">
                  {activeFloor.quest.expectedOutput}
                </span>
              </div>
            </div>

            {/* Discovered Fragments Pouch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ivory uppercase tracking-wider text-[11px]">
                  Discovered Fragments ({discoveredFloorFragments.length})
                </span>
                <span className="text-[10px] text-muted">Click to add to program</span>
              </div>

              {discoveredFloorFragments.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-line text-center text-muted">
                  <p>No code fragments discovered on this floor yet.</p>
                  <p className="text-[11px] mt-1 text-gold-400/80">
                    Search desks, hearths, books, and chests in the rooms!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {discoveredFloorFragments.map((frag) => {
                    const isAlreadyPlaced = assembledLines.some((l) => l.fragmentId === frag.id);
                    return (
                      <button
                        key={frag.id}
                        onClick={() => handleInsertFragment(frag)}
                        className={`flex items-center justify-between p-2 rounded border text-left transition-all ${
                          isAlreadyPlaced
                            ? 'border-line/60 bg-elevated/40 text-muted opacity-80'
                            : 'border-gold-400/30 bg-elevated hover:border-gold-400 text-ivory hover:scale-[1.01]'
                        }`}
                      >
                        <span className="truncate pr-2">{frag.code}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-graphite text-gold-400 shrink-0 uppercase">
                          {isAlreadyPlaced ? 'Added' : '+ Add'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assembled Code Program Block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ivory uppercase tracking-wider text-[11px]">
                  Assembled C++ Program ({assembledLines.length} lines)
                </span>
                {assembledLines.length > 0 && (
                  <button
                    onClick={handleClearLines}
                    className="text-[10px] text-muted hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-line bg-obsidian p-2.5 min-h-[140px] space-y-1">
                {assembledLines.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-muted text-center p-3">
                    <p className="text-[11px]">Program buffer is currently empty.</p>
                    <p className="text-[10px] mt-1 text-muted/80">
                      Select fragments above or explore the house to collect missing statements.
                    </p>
                  </div>
                ) : (
                  assembledLines.map((line, idx) => (
                    <div
                      key={line.instanceId}
                      className="group flex items-center justify-between px-2 py-1.5 rounded border border-line/60 bg-graphite hover:border-gold-400/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-[10px] font-mono text-muted/60 select-none w-4 text-right">
                          {idx + 1}
                        </span>
                        <code className="text-xs text-ivory truncate">{line.code}</code>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleMoveLine(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-elevated text-muted hover:text-ivory disabled:opacity-20"
                          title="Move Line Up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveLine(idx, 'down')}
                          disabled={idx === assembledLines.length - 1}
                          className="p-1 rounded hover:bg-elevated text-muted hover:text-ivory disabled:opacity-20"
                          title="Move Line Down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveLine(line.instanceId)}
                          className="p-1 rounded hover:bg-elevated text-muted hover:text-red-400 ml-1"
                          title="Remove Line"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Validation Feedback & Console Log Display */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  validationResult.isValid
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Flame className="h-4 w-4 text-red-400" />
                  )}
                  <span>{validationResult.title}</span>
                </div>
                <p className="mt-1 leading-relaxed text-ivory/90">{validationResult.message}</p>

                {validationResult.simulatedOutput && (
                  <pre className="mt-2 p-2 rounded bg-obsidian/90 border border-line text-[10px] text-gold-400/90 whitespace-pre-wrap font-mono">
                    {validationResult.simulatedOutput}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Panel Bottom Action Bar */}
          <div className="p-4 border-t border-line bg-elevated">
            <button
              onClick={handleValidateSolution}
              disabled={isValidating || assembledLines.length === 0}
              className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-obsidian" />
              <span>{isValidating ? 'COMPILING & TESTING...' : 'RUN & VALIDATE CODE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Mansion Entrance Title Screen */}
      {gameState === 'intro' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/90 backdrop-blur-md text-center">
          <div className="max-w-md w-full rounded-2xl border border-gold-400/30 bg-graphite p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-400 mx-auto mb-4 shadow-[0_0_24px_rgba(208,180,119,0.25)]">
              <DoorOpen className="h-8 w-8" />
            </div>

            <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-semibold">
              AVENIR ARENA EXPEDITION
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory mt-1">
              THE CODE HOUSE
            </h2>
            <p className="text-xs text-gold-400/90 font-medium mt-0.5">
              Mysterious C++ Exploration & Puzzle Chamber
            </p>

            <p className="text-xs sm:text-sm text-muted mt-3 leading-relaxed">
              Step inside the grand abandoned mansion. Explore shadowed rooms, inspect bookcases, open
              locked chests, discover lost C++ code fragments, and assemble working programs at the
              terminal to unlock higher floors!
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5 text-[11px] font-mono text-muted text-left">
              <div className="p-2.5 rounded border border-line bg-elevated">
                <span className="text-gold-400 block font-bold">4 Floors</span>
                <span>Foundations to Functions</span>
              </div>
              <div className="p-2.5 rounded border border-line bg-elevated">
                <span className="text-gold-400 block font-bold">Focus Hearts</span>
                <span>3 Mistakes Allowed per Quest</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={startExploring}
                className="btn btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
              >
                <Play className="h-4 w-4 fill-obsidian" />
                <span>ENTER MANSION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Object Inspection / Clue Discovery Modal */}
      {gameState === 'inspect' && inspectedObject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">
                  {inspectedObject.name}
                </h4>
              </div>
              <button onClick={closeInspectModal} className="text-xs text-muted hover:text-ivory">
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
              {inspectedObject.inspectText}
            </p>

            {/* Revealed Key item */}
            {inspectedObject.givesKeyId && (
              <div className="mt-4 p-3 rounded border border-gold-400/40 bg-gold-400/10 flex items-center gap-3">
                <Key className="h-5 w-5 text-gold-400" />
                <div>
                  <span className="text-[10px] uppercase font-mono text-gold-400 font-bold block">
                    Key Discovered
                  </span>
                  <span className="text-xs font-semibold text-ivory">
                    {inspectedObject.givesKeyName || 'Brass Key'}
                  </span>
                </div>
              </div>
            )}

            {/* Revealed Fragment */}
            {inspectedObject.givesFragmentId && (
              <div className="mt-4 p-3 rounded border border-cyan-500/40 bg-cyan-500/10 space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">
                  Code Fragment Discovered
                </span>
                <code className="text-xs text-ivory font-mono block bg-obsidian p-2 rounded border border-line">
                  {
                    activeFloor.fragments.find((f) => f.id === inspectedObject.givesFragmentId)
                      ?.code
                  }
                </code>
              </div>
            )}

            {/* Revealed Clue Note */}
            {inspectedObject.clueText && (
              <div className="mt-4 p-3 rounded border border-line bg-elevated text-xs text-gold-400 font-mono">
                <span>Clue: {inspectedObject.clueText}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={closeInspectModal} className="btn btn-primary text-xs py-2 px-5">
                Continue Exploring [E]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Floor Map / Selection Modal */}
      {gameState === 'floormap' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full rounded-2xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gold-400" />
                <h4 className="font-display text-lg font-bold text-ivory">
                  Mansion Ascension Map
                </h4>
              </div>
              <button
                onClick={() => setGameState('exploring')}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {([1, 2, 3, 4] as FloorId[]).map((fId) => {
                const floorDef = floorsData[fId];
                const isUnlocked = saveData.unlockedFloors.includes(fId);
                const isCompleted = saveData.completedFloors.includes(fId);
                const isCurrent = fId === currentFloorId;

                return (
                  <div
                    key={fId}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-gold-400 bg-gold-400/10'
                        : isUnlocked
                        ? 'border-line bg-elevated hover:border-gold-400/40'
                        : 'border-line/40 bg-obsidian/40 opacity-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-ivory">
                          Floor {fId}: {floorDef.name}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted font-sans">{floorDef.theme}</p>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="badge bg-gold-400/20 text-gold-400 border border-gold-400/40 text-xs">
                          Current
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => changeFloor(fId)}
                          className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Ascend</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setGameState('exploring')}
                className="btn btn-secondary text-xs py-2 px-4"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Clues & Journal Modal */}
      {gameState === 'journal' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">
                  Explorer's Clue Journal
                </h4>
              </div>
              <button
                onClick={() => setGameState('exploring')}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs font-mono">
              <div className="p-3 rounded border border-line bg-elevated">
                <span className="text-gold-400 font-bold block mb-1">
                  Floor {currentFloorId} Objective:
                </span>
                <p className="text-muted font-sans leading-relaxed">
                  {activeFloor.quest.storyBrief}
                </p>
              </div>

              <div className="p-3 rounded border border-line bg-elevated">
                <span className="text-gold-400 font-bold block mb-1">Architectural Hint 1:</span>
                <p className="text-muted font-sans leading-relaxed">{activeFloor.quest.hint1}</p>
              </div>

              <div className="p-3 rounded border border-line bg-elevated">
                <span className="text-gold-400 font-bold block mb-1">Architectural Hint 2:</span>
                <p className="text-muted font-sans leading-relaxed">{activeFloor.quest.hint2}</p>
              </div>

              {saveData.discoveredClueIds.length > 0 && (
                <div className="p-3 rounded border border-gold-400/30 bg-gold-400/5">
                  <span className="text-gold-400 font-bold block mb-1">Discovered Notes:</span>
                  <ul className="list-disc list-inside space-y-1 text-ivory/90 font-sans">
                    {saveData.discoveredClueIds.map((cId) => {
                      const obj = activeFloor.objects.find((o) => o.id === cId);
                      return obj?.clueText ? <li key={cId}>{obj.clueText}</li> : null;
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setGameState('exploring')}
                className="btn btn-primary text-xs py-2 px-4"
              >
                Close Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Quest Success Modal */}
      {gameState === 'success' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md text-center animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-gold-400/40 bg-graphite p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center h-16 w-16 rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-400 mx-auto mb-4 shadow-[0_0_25px_rgba(208,180,119,0.3)]">
              <Sparkles className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">
              QUEST COMPLETED!
            </h3>
            <p className="text-xs text-gold-400 font-mono mt-1">
              Floor {currentFloorId}: {activeFloor.quest.title} Solved
            </p>

            <div className="my-5 p-4 rounded-xl border border-line bg-elevated text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Concepts Mastered:</span>
                <span className="text-gold-400 font-bold">{activeFloor.levelBadge}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Completion Time:</span>
                <span className="text-ivory font-mono">{elapsedSeconds} seconds</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Academic XP Earned:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{activeFloor.quest.xpReward} XP
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {currentFloorId < 4 ? (
                <button
                  onClick={() => changeFloor((currentFloorId + 1) as FloorId)}
                  className="btn btn-primary px-7 py-3 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)]"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Ascend to Floor {currentFloorId + 1}</span>
                </button>
              ) : (
                <button
                  onClick={onExit}
                  className="btn btn-primary px-7 py-3 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Victory! Return to Hub</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Out of Focus Hearts (Retry) Modal */}
      {gameState === 'failed' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md text-center animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-red-500/40 bg-graphite p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center h-14 w-14 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 mx-auto mb-3">
              <Heart className="h-7 w-7" />
            </div>

            <h3 className="font-display text-2xl font-bold text-ivory tracking-tight">
              FOCUS EXHAUSTED
            </h3>
            <p className="text-xs text-red-400 font-mono mt-0.5">
              3 In-Game Hearts Lost · Zero Academic XP Deducted
            </p>

            <p className="text-xs text-muted mt-3 leading-relaxed">
              Your focus was depleted by repeated syntax or ordering errors. Your discovered fragments
              and inventory remain safe in your pouch. Re-read the journal clues, organize your lines,
              and try again!
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={handleRetryQuest}
                className="btn btn-primary px-6 py-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(208,180,119,0.25)]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore Focus & Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Audio Settings Modal */}
      {showAudioSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">Sound Settings</h4>
              </div>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Master Sound</span>
                  <button
                    onClick={() => {
                      houseAudio.setMasterMute(!audioSettings.masterMuted);
                      setAudioSettings({ ...houseAudio.settings });
                    }}
                    className="text-gold-400 hover:underline"
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
                  onChange={(e) => {
                    houseAudio.setMasterVolume(parseFloat(e.target.value));
                    setAudioSettings({ ...houseAudio.settings });
                  }}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Mansion Ambience</span>
                  <button
                    onClick={() => {
                      houseAudio.setAmbienceMute(!audioSettings.ambienceMuted);
                      setAudioSettings({ ...houseAudio.settings });
                    }}
                    className="text-gold-400 hover:underline"
                  >
                    {audioSettings.ambienceMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.ambienceMuted ? 0 : audioSettings.ambienceVolume}
                  onChange={(e) => {
                    houseAudio.setAmbienceVolume(parseFloat(e.target.value));
                    setAudioSettings({ ...houseAudio.settings });
                  }}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-ivory">Sound Effects (SFX)</span>
                  <button
                    onClick={() => {
                      houseAudio.setSfxMute(!audioSettings.sfxMuted);
                      setAudioSettings({ ...houseAudio.settings });
                    }}
                    className="text-gold-400 hover:underline"
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
                  onChange={(e) => {
                    houseAudio.setSfxVolume(parseFloat(e.target.value));
                    setAudioSettings({ ...houseAudio.settings });
                  }}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => setShowAudioSettings(false)}
                className="btn btn-primary text-xs py-2 px-5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
