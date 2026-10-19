import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code,
  Coins,
  Compass,
  Cpu,
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
  ShoppingBag,
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
<<<<<<< HEAD
import { DSA_ESTATE_FLOORS, WEBDEV_ESTATE_FLOORS } from './estateData';
import { DsaTerminalModal } from './DsaTerminalModal';
import { WebDevStudioModal } from './WebDevStudioModal';
import { DecorShopModal } from './DecorShopModal';
import { MiniGameModal } from './miniGames/MiniGameModal';
import { NpcDialogModal } from './NpcDialogModal';
import { SegfaultVoidModal } from './SegfaultVoidModal';
import { NPC_CHARACTERS } from './npcDialog';
import { DECOR_CATALOG } from './decorShop';
=======
import { usePlayerIdentity } from '@/components/game-core';
import { floorsData } from './floorsData';
>>>>>>> d7f7895635cfa88d9d6198ee14cbc5ee8f3db9bc
import { validateCodeAssembly } from './validator';
import { houseAudio } from './audio';
import { CodeHouseCanvas } from './CodeHouseCanvas';
import type {
  AssembledLine,
  BugEntity,
  CodeFragment,
  CodeHouseMode,
  DecorItem,
  FloorDefinition,
  FloorId,
  FuseBoxState,
  NpcCharacter,
  PlacedDecor,
  Position,
  RoomConnection,
  RoomState,
  StudentCodeHouseData,
  ValidationFeedback,
  WorldObject,
} from './types';

interface CodeHouseGameProps {
  onExit: () => void;
  username?: string;
  avatarUrl?: string;
}

const STORAGE_PREFIX = 'avenir_codehouse_v2_';

const getInitialBugsForFloor = (floorId: FloorId, mode: CodeHouseMode): BugEntity[] => {
  if (mode === 'dsa') {
    switch (floorId) {
      case 1:
        return [
          { id: 'b1-1', x: 200, y: 320, vx: 35, vy: 25, type: 'syntax-bug', isSquashed: false, bounty: 20, size: 8, hint: 'Vector indexing starts at 0!' },
          { id: 'b1-2', x: 920, y: 380, vx: -30, vy: 40, type: 'null-pointer', isSquashed: false, bounty: 25, size: 9, hint: 'std::sort takes iterators .begin() and .end()' },
        ];
      case 2:
        return [
          { id: 'b2-1', x: 220, y: 350, vx: 45, vy: -30, type: 'null-pointer', isSquashed: false, bounty: 30, size: 9, hint: 'Never dereference nullptr!' },
          { id: 'b2-2', x: 950, y: 500, vx: -40, vy: 35, type: 'memory-leak', isSquashed: false, bounty: 35, size: 10, hint: 'Free dynamically allocated memory or use smart pointers.' },
        ];
      case 3:
        return [
          { id: 'b3-1', x: 300, y: 300, vx: 30, vy: 35, type: 'syntax-bug', isSquashed: false, bounty: 25, size: 8, hint: 'stack.top() inspects without popping!' },
          { id: 'b3-2', x: 800, y: 600, vx: -35, vy: -25, type: 'memory-leak', isSquashed: false, bounty: 30, size: 9, hint: 'Always verify !stack.empty() before .pop()' },
        ];
      case 4:
        return [
          { id: 'b4-1', x: 250, y: 450, vx: 50, vy: 40, type: 'memory-leak', isSquashed: false, bounty: 35, size: 10, hint: 'Graph cycles cause infinite loops without a visited set!' },
          { id: 'b4-2', x: 850, y: 350, vx: -45, vy: -35, type: 'null-pointer', isSquashed: false, bounty: 40, size: 9, hint: 'Check tree child before node->left->val' },
        ];
      case 5:
        return [
          { id: 'b5-1', x: 350, y: 400, vx: 40, vy: 30, type: 'memory-leak', isSquashed: false, bounty: 45, size: 11, hint: 'Unmemoized recursion causes exponential 2^n stack frames!' },
          { id: 'b5-2', x: 750, y: 550, vx: -35, vy: -40, type: 'syntax-bug', isSquashed: false, bounty: 45, size: 10, hint: 'Base cases terminate recursion: if(n <= 1) return 1;' },
        ];
    }
  } else {
    switch (floorId) {
      case 1:
        return [
          { id: 'wb1-1', x: 240, y: 320, vx: 30, vy: 30, type: 'syntax-bug', isSquashed: false, bounty: 20, size: 8, hint: 'Use semantic <article> and <section> tags.' },
        ];
      case 2:
        return [
          { id: 'wb2-1', x: 350, y: 350, vx: -35, vy: 30, type: 'null-pointer', isSquashed: false, bounty: 25, size: 9, hint: 'display: flex creates a 1D flex container.' },
        ];
      case 3:
        return [
          { id: 'wb3-1', x: 260, y: 420, vx: 40, vy: -35, type: 'memory-leak', isSquashed: false, bounty: 30, size: 9, hint: 'box-sizing: border-box includes padding in width.' },
        ];
      case 4:
        return [
          { id: 'wb4-1', x: 400, y: 380, vx: -45, vy: 40, type: 'syntax-bug', isSquashed: false, bounty: 35, size: 10, hint: '@keyframes defines animation frame progressions.' },
        ];
    }
  }
  return [];
};

const DEFAULT_STUDENT_DATA = (studentId: string): StudentCodeHouseData => ({
  studentId,
  activeMode: 'dsa',
  unlockedFloors: [1],
  completedFloors: [],
  discoveredFragmentIds: [],
  collectedKeyIds: [],
  discoveredClueIds: [],
  floorAttempts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  floorBestTimes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  totalXP: 0,
  byteBits: 100,
  placedDecors: [],
  unlockedDecorIds: [],
  roomStates: {},
});

export function CodeHouseGame({ onExit, username: propUsername, avatarUrl: propAvatarUrl }: CodeHouseGameProps) {
  const { selectedStudent } = useStudentProfiles();
  const playerIdentity = usePlayerIdentity();

  const resolvedIdentity = useMemo(() => ({
    ...playerIdentity,
    ...(propUsername ? { username: propUsername } : {}),
    ...(propAvatarUrl ? { avatarUrl: propAvatarUrl } : {}),
  }), [playerIdentity, propUsername, propAvatarUrl]);

  const username = resolvedIdentity.username;
  const avatarUrl = resolvedIdentity.avatarUrl;

  // Mode Selection State
  const [activeMode, setActiveMode] = useState<CodeHouseMode>('dsa');
  const [currentFloorId, setCurrentFloorId] = useState<FloorId>(1);
  const [saveData, setSaveData] = useState<StudentCodeHouseData>(() =>
    DEFAULT_STUDENT_DATA(selectedStudent.id)
  );

  // Active Estate Floors based on chosen mode
  const activeEstate = activeMode === 'dsa' ? DSA_ESTATE_FLOORS : WEBDEV_ESTATE_FLOORS;
  const maxFloors = activeMode === 'dsa' ? 5 : 4;
  const activeFloor = useMemo(() => activeEstate[currentFloorId] || activeEstate[1], [activeEstate, currentFloorId]);

  // Enriched Floor with NPCs and Connections
  const enrichedFloor = useMemo((): FloorDefinition => {
    const base = activeEstate[currentFloorId] || activeEstate[1];
    const objects = [...base.objects];

    // Inject in-world NPC sprite if not present
    if (activeMode === 'dsa') {
      if (currentFloorId === 1 && !objects.some((o) => o.id === 'npc-obj-quacky')) {
        objects.push({
          id: 'npc-obj-quacky',
          name: 'Quacky (Senior Duck)',
          type: 'npc-duck',
          x: 740,
          y: 680,
          width: 36,
          height: 36,
          interactRadius: 75,
          inspectText: 'Senior Rubber Duck Debugger Quacky perches here to listen to your code.',
          linkedNpcId: 'npc-duck',
        });
      } else if (
        (currentFloorId === 2 || currentFloorId === 3 || currentFloorId === 4) &&
        !objects.some((o) => o.id === 'npc-obj-viktor')
      ) {
        objects.push({
          id: 'npc-obj-viktor',
          name: 'Viktor (Kernel SysAdmin)',
          type: 'npc-sysadmin',
          x: 200,
          y: 350,
          width: 36,
          height: 42,
          interactRadius: 75,
          inspectText: 'Viktor monitors kernel memory allocations and stack pointer registers.',
          linkedNpcId: 'npc-sysadmin',
        });
      } else if (currentFloorId === 5 && !objects.some((o) => o.id === 'npc-obj-quacky')) {
        objects.push({
          id: 'npc-obj-quacky',
          name: 'Quacky (Senior Duck)',
          type: 'npc-duck',
          x: 420,
          y: 460,
          width: 36,
          height: 36,
          interactRadius: 75,
          inspectText: 'Quacky contemplates overlapping subproblems and memoization caches.',
          linkedNpcId: 'npc-duck',
        });
      }
    } else {
      if (!objects.some((o) => o.id === 'npc-obj-chloe')) {
        objects.push({
          id: 'npc-obj-chloe',
          name: 'Chloe (Lead Designer)',
          type: 'npc-designer',
          x: 240,
          y: 440,
          width: 36,
          height: 42,
          interactRadius: 75,
          inspectText: 'Chloe checks layout alignments and CSS design fidelity.',
          linkedNpcId: 'npc-designer',
        });
      }
    }

    // Connections with memory pointers (DSA Mode)
    let connections = base.connections;
    if (!connections && activeMode === 'dsa') {
      if (currentFloorId === 2) {
        connections = [
          {
            id: 'conn-floor-2-to-3',
            fromRoomId: 'stair-west-wing',
            toRoomId: 'kitchen-stacks',
            x: 180,
            y: 120,
            width: 70,
            height: 35,
            label: 'Ascension to Stacks & Queues',
            targetFloorId: 3,
            targetPlayerSpawn: { x: 600, y: 720 },
            pointerAddress: '0x00A0',
          },
          {
            id: 'conn-floor-2-trap',
            fromRoomId: 'stair-east-wing',
            toRoomId: 'segfault-void',
            x: 950,
            y: 120,
            width: 70,
            height: 35,
            label: 'Unmapped Memory Portal',
            targetFloorId: 2,
            targetPlayerSpawn: { x: 600, y: 760 },
            pointerAddress: '0x0000',
            isSegfaultTrap: true,
          },
        ];
      } else {
        const nextFloor = Math.min(5, currentFloorId + 1) as FloorId;
        connections = [
          {
            id: `conn-floor-${currentFloorId}-portal`,
            fromRoomId: base.rooms[0]?.id || 'main',
            toRoomId: `room-${nextFloor}`,
            x: 565,
            y: 60,
            width: 70,
            height: 35,
            label: `Portal to Room ${nextFloor}`,
            targetFloorId: nextFloor,
            targetPlayerSpawn: { x: 600, y: 720 },
            pointerAddress: `0x${(currentFloorId * 0x1000).toString(16).toUpperCase()}`,
          },
        ];
      }
    }

    return {
      ...base,
      objects,
      connections,
    };
  }, [activeEstate, currentFloorId, activeMode]);

  // Gameplay State
  const [gameState, setGameState] = useState<
    'mode-select' | 'intro' | 'exploring' | 'inspect' | 'journal' | 'floormap' | 'success' | 'failed'
  >('mode-select');
  const [hearts, setHearts] = useState<number>(3);
  const [assembledLines, setAssembledLines] = useState<AssembledLine[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationFeedback | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Inspector & Interactive Challenge Modals
  const [inspectedObject, setInspectedObject] = useState<WorldObject | null>(null);
  const [nearbyObject, setNearbyObject] = useState<WorldObject | null>(null);
  const [activeDsaChallengeModal, setActiveDsaChallengeModal] = useState<boolean>(false);
  const [activeWebDevStudioModal, setActiveWebDevStudioModal] = useState<boolean>(false);
  const [activeCheatSheetModal, setActiveCheatSheetModal] = useState<WorldObject['hintData'] | null>(null);

  // New Modals for Game Systems
  const [isDecorShopOpen, setIsDecorShopOpen] = useState<boolean>(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState<boolean>(false);
  const [activeNpcCharacter, setActiveNpcCharacter] = useState<NpcCharacter | null>(null);
  const [segfaultTrapAddress, setSegfaultTrapAddress] = useState<string | null>(null);

  // Audiovisual Screen Juice
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);

  // Roaming Bugs State
  const [activeBugs, setActiveBugs] = useState<BugEntity[]>(() =>
    getInitialBugsForFloor(1, 'dsa')
  );

  // Timed Fuse Box State
  const [fuseBoxState, setFuseBoxState] = useState<FuseBoxState | undefined>(undefined);

  // Mobile / UI Drawers
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);
  const [audioSettings, setAudioSettings] = useState(houseAudio.settings);

  // Movement & Avatar state
  const [playerPos, setPlayerPos] = useState<Position>(activeFloor.playerSpawn);
  const [playerFacing, setPlayerFacing] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Load saved student data on mount or when student changes
  useEffect(() => {
    const key = `${STORAGE_PREFIX}${selectedStudent.id}_${activeMode}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: StudentCodeHouseData = JSON.parse(stored);
        setSaveData(parsed);
        const maxUnlocked = Math.min(
          maxFloors,
          Math.max(...(parsed.unlockedFloors || [1]))
        ) as FloorId;
        setCurrentFloorId(maxUnlocked);
      } else {
        const initial = DEFAULT_STUDENT_DATA(selectedStudent.id);
        initial.activeMode = activeMode;
        setSaveData(initial);
        setCurrentFloorId(1);
      }
    } catch {
      setSaveData(DEFAULT_STUDENT_DATA(selectedStudent.id));
    }
  }, [selectedStudent.id, activeMode, maxFloors]);

  // Save student data to localStorage
  const persistSaveData = useCallback(
    (updater: (prev: StudentCodeHouseData) => StudentCodeHouseData) => {
      setSaveData((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(
            `${STORAGE_PREFIX}${selectedStudent.id}_${activeMode}`,
            JSON.stringify(next)
          );
        } catch {
          // Ignore
        }
        return next;
      });
    },
    [selectedStudent.id, activeMode]
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
        setGameState((curr) => (curr === 'journal' ? 'exploring' : 'journal'));
      } else if (e.code === 'KeyM') {
        setGameState((curr) => (curr === 'floormap' ? 'exploring' : 'floormap'));
      } else if (e.code === 'Escape') {
        if (gameState === 'inspect' || gameState === 'journal' || gameState === 'floormap') {
          setGameState('exploring');
          setInspectedObject(null);
          setActiveCheatSheetModal(null);
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

  // Fuse box countdown ticker
  useEffect(() => {
    if (!fuseBoxState?.active || fuseBoxState.isTripped || gameState !== 'exploring') return;

    const interval = setInterval(() => {
      setFuseBoxState((curr) => {
        if (!curr || !curr.active || curr.isTripped) return curr;
        const nextTime = curr.timeRemaining - 1;

        if (nextTime <= 10 && nextTime > 0) {
          houseAudio.playTerminalBeep();
        }

        if (nextTime <= 0) {
          houseAudio.playEmergencySiren();
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 800);
          return { ...curr, timeRemaining: 0, isTripped: true };
        }

        return { ...curr, timeRemaining: nextTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fuseBoxState?.active, fuseBoxState?.isTripped, gameState]);

  // Change Floor
  const changeFloor = (newFloorId: FloorId) => {
    setCurrentFloorId(newFloorId);
    const newFloor = activeEstate[newFloorId] || activeEstate[1];
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
    setActiveDsaChallengeModal(false);
    setActiveWebDevStudioModal(false);
    setActiveCheatSheetModal(null);
    setActiveNpcCharacter(null);
    setSegfaultTrapAddress(null);
    setActiveBugs(getInitialBugsForFloor(newFloorId, activeMode));
    if ((newFloorId === 5 && activeMode === 'dsa') || (newFloorId === 4 && activeMode === 'webdev')) {
      setFuseBoxState({ active: true, timeRemaining: 60, maxTime: 60, isTripped: false });
    } else {
      setFuseBoxState(undefined);
    }
    houseAudio.playDoorUnlock();
  };

  // Start Exploring from Intro
  const startExploring = () => {
    houseAudio.playTerminalBeep();
    setGameState('exploring');
  };

  // Switch Gameplay Mode
  const handleSelectMode = (mode: CodeHouseMode) => {
    houseAudio.playTerminalBeep();
    setActiveMode(mode);
    setCurrentFloorId(1);
    setGameState('intro');
    const targetEstate = mode === 'dsa' ? DSA_ESTATE_FLOORS : WEBDEV_ESTATE_FLOORS;
    setPlayerPos(targetEstate[1].playerSpawn);
    setElapsedSeconds(0);
    setActiveBugs(getInitialBugsForFloor(1, mode));
    setFuseBoxState(undefined);
  };

  // Interact with World Object
  const handleInteract = (obj: WorldObject) => {
    houseAudio.playInspect();
    setInspectedObject(obj);

    // If interacting with an NPC
    if (obj.type === 'npc-duck' || obj.type === 'npc-sysadmin' || obj.type === 'npc-designer' || obj.linkedNpcId) {
      const npcKey = obj.linkedNpcId || obj.type;
      const char = NPC_CHARACTERS[npcKey] || NPC_CHARACTERS['npc-duck'];
      setActiveNpcCharacter(char);
      return;
    }

    // If object links to a mode-specific challenge terminal
    if (obj.linkedChallengeId) {
      if (activeMode === 'dsa' && activeFloor.dsaChallenge) {
        setActiveDsaChallengeModal(true);
        return;
      }
      if (activeMode === 'webdev' && activeFloor.webDevChallenge) {
        setActiveWebDevStudioModal(true);
        return;
      }
    }

    // If object contains syntax cheatsheet notes (e.g. bookshelves)
    if (obj.hintData) {
      setActiveCheatSheetModal(obj.hintData);
      return;
    }

    // Default inspection modal
    setGameState('inspect');

    // Collect keys
    if (obj.givesKeyId && !saveData.collectedKeyIds.includes(obj.givesKeyId)) {
      houseAudio.playKeyPickup();
      persistSaveData((prev) => ({
        ...prev,
        collectedKeyIds: [...prev.collectedKeyIds, obj.givesKeyId!],
      }));
    }

    // Collect code fragments
    if (obj.givesFragmentId && !saveData.discoveredFragmentIds.includes(obj.givesFragmentId)) {
      houseAudio.playFragmentPickup();
      persistSaveData((prev) => ({
        ...prev,
        discoveredFragmentIds: [...prev.discoveredFragmentIds, obj.givesFragmentId!],
      }));
    }

    // Collect clues
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
    setActiveCheatSheetModal(null);
    setGameState('exploring');
  };

  // Solved Handler for DSA Mode Challenge
  const handleDsaSolved = (code: string) => {
    setActiveDsaChallengeModal(false);
    houseAudio.playValidationSuccess();
    handleRoomSuccess(code);
  };

  // Solved Handler for Web Dev Mode Challenge
  const handleWebDevSolved = (html: string, css: string) => {
    setActiveWebDevStudioModal(false);
    houseAudio.playValidationSuccess();
    handleRoomSuccess(`HTML:\n${html}\n\nCSS:\n${css}`);
  };

  // Shared Room Success Trigger
  const handleRoomSuccess = (solutionPayload: string) => {
    setGameState('success');
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3500);

    const xpReward = activeFloor.quest.xpReward;
    const nextFloor = (currentFloorId + 1) as FloorId;

    persistSaveData((prev) => {
      const unlocked = new Set(prev.unlockedFloors);
      if (nextFloor <= maxFloors) unlocked.add(nextFloor);

      const completed = new Set(prev.completedFloors);
      completed.add(currentFloorId);

      const updatedRoomStates = {
        ...prev.roomStates,
        [currentFloorId]: {
          isSolved: true,
          isPowered: true,
          unlockedGates: ['main-gate'],
          renovationStage: 'restored' as const,
          submittedHtml: activeMode === 'webdev' ? solutionPayload : undefined,
        },
      };

      return {
        ...prev,
        unlockedFloors: Array.from(unlocked) as FloorId[],
        completedFloors: Array.from(completed) as FloorId[],
        totalXP: prev.totalXP + xpReward,
        byteBits: (prev.byteBits || 0) + 50,
        roomStates: updatedRoomStates,
        floorBestTimes: {
          ...prev.floorBestTimes,
          [currentFloorId]:
            prev.floorBestTimes[currentFloorId] === 0
              ? elapsedSeconds
              : Math.min(prev.floorBestTimes[currentFloorId], elapsedSeconds),
        },
      };
    });
  };

  // Roaming Bugs Squash Handler
  const handleSquashBug = (bug: BugEntity) => {
    setActiveBugs((prev) =>
      prev.map((b) => (b.id === bug.id ? { ...b, isSquashed: true } : b))
    );
    persistSaveData((prev) => ({
      ...prev,
      byteBits: (prev.byteBits || 0) + bug.bounty,
    }));
  };

  // Decor System Handlers
  const handlePurchaseDecor = (item: DecorItem) => {
    persistSaveData((prev) => {
      const currentBits = prev.byteBits || 0;
      if (currentBits < item.cost) return prev;
      return {
        ...prev,
        byteBits: currentBits - item.cost,
        unlockedDecorIds: [...(prev.unlockedDecorIds || []), item.id],
      };
    });
  };

  const handlePlaceDecor = (decorId: string, pos: Position) => {
    const newPlaced: PlacedDecor = {
      instanceId: `decor-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      decorId,
      x: pos.x,
      y: pos.y,
      floorId: currentFloorId,
    };
    persistSaveData((prev) => ({
      ...prev,
      placedDecors: [...(prev.placedDecors || []), newPlaced],
    }));
  };

  const handleRemovePlacedDecor = (instanceId: string) => {
    persistSaveData((prev) => ({
      ...prev,
      placedDecors: (prev.placedDecors || []).filter((d) => d.instanceId !== instanceId),
    }));
  };

  // Mini-Game Arcade Reward
  const handleMiniGameReward = (bits: number, xp: number) => {
    persistSaveData((prev) => ({
      ...prev,
      byteBits: (prev.byteBits || 0) + bits,
      totalXP: prev.totalXP + xp,
    }));
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  // Segfault Trap & Room Portal Handlers
  const handleSegfaultTrap = (pointerAddress?: string) => {
    houseAudio.playValidationError();
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 600);
    setSegfaultTrapAddress(pointerAddress || '0x00000000');
  };

  const handleRespawnFromSegfault = () => {
    setSegfaultTrapAddress(null);
    setPlayerPos(activeFloor.playerSpawn);
    setPlayerFacing('down');
    setIsMoving(false);
  };

  const handleRoomConnection = (conn: RoomConnection) => {
    changeFloor(conn.targetFloorId);
    if (conn.targetPlayerSpawn) {
      setPlayerPos(conn.targetPlayerSpawn);
    }
  };

  // Insert Fragment into Assembled Lines (for traditional C++ assembly mode)
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

  // Run and Validate Assembled Solution
  const handleValidateSolution = () => {
    houseAudio.playTerminalBeep();
    setIsValidating(true);

    setTimeout(() => {
      setIsValidating(false);
      const result = validateCodeAssembly(currentFloorId, assembledLines);
      setValidationResult(result);

      if (result.isValid) {
        handleRoomSuccess(assembledLines.map((l) => l.code).join('\n'));
      } else {
        houseAudio.playValidationError();
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 500);

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

  // Is Current Room Solved
  const isCurrentRoomSolved = saveData.roomStates?.[currentFloorId]?.isSolved || false;

  return (
    <div className="relative flex flex-col w-full min-h-[720px] bg-obsidian text-ivory rounded-2xl border border-line overflow-hidden shadow-2xl">
      {/* ─── Top Atmospheric Header Bar ───────────────────────────────── */}
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
              <span
                className={`badge text-[10px] font-semibold uppercase tracking-wider ${
                  activeMode === 'dsa'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {activeMode === 'dsa' ? 'DSA Mode (C++)' : 'Web Dev (HTML & CSS)'}
              </span>
              <span className="badge bg-gold-400/10 text-gold-400 text-[10px] border border-gold-400/30">
                Room {currentFloorId}: {activeFloor.name.split('(')[0].trim()}
              </span>
            </div>
            <p className="text-[11px] text-muted hidden md:block">
              {activeFloor.levelBadge}
            </p>
          </div>
        </div>

        {/* Center / Right Header Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher Button */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setGameState('mode-select');
            }}
            className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            title="Switch Mode (DSA vs Web Dev)"
          >
            {activeMode === 'dsa' ? (
              <Terminal className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Code className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">Switch Mode</span>
          </button>

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
            title="View Estate Map [M]"
          >
            <Layers className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden sm:inline">Rooms</span>
          </button>

          {/* Byte Bits Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 font-mono text-xs">
            <Coins className="h-3.5 w-3.5" />
            <span>{saveData.byteBits ?? 0}</span>
          </div>

          {/* Decor Shop */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setIsDecorShopOpen(true);
            }}
            className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            title="Decor Shop"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Shop</span>
          </button>

          {/* Arcade */}
          <button
            onClick={() => {
              houseAudio.playLineClick();
              setIsMiniGameOpen(true);
            }}
            className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            title="Arcade Mini-Games"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Arcade</span>
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
        </div>
      </header>

      {/* ─── Mode Switcher / Start Screen Modal ──────────────────────── */}
      {gameState === 'mode-select' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md animate-fade-in">
          <div className="max-w-3xl w-full rounded-2xl border border-line bg-graphite p-6 sm:p-8 shadow-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Select Estate Exploration Mode</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ivory tracking-tight">
              WELCOME TO THE CODE HOUSE
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto mt-2 leading-relaxed">
              Step across the threshold of a multi-level educational estate. Choose your discipline to
              explore themed rooms where layout, appliances, and architecture reflect computer science concepts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
              {/* Card 1: DSA Mode (C++) */}
              <div
                onClick={() => handleSelectMode('dsa')}
                className={`p-5 rounded-xl border transition-all cursor-pointer relative group ${
                  activeMode === 'dsa'
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'border-line bg-elevated hover:border-amber-500/40 hover:bg-elevated/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Terminal className="h-6 w-6" />
                  </div>
                  <span className="badge text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20">
                    5 Rooms · C++
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-ivory group-hover:text-amber-400 transition-colors">
                  Mode 1: Algorithmic Facility (DSA)
                </h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  Theme the house like an algorithmic data facility. Calibrate array vectors in the living room,
                  traverse pointer addresses along the grand staircase, balance LIFO/FIFO stacks in the kitchen,
                  navigate hedge maze graphs with BFS, and cool the overheating server basement with dynamic programming.
                </p>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-amber-400 font-semibold">
                  <span>Launch DSA Mode</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </div>

              {/* Card 2: Web Dev Mode (HTML & CSS) */}
              <div
                onClick={() => handleSelectMode('webdev')}
                className={`p-5 rounded-xl border transition-all cursor-pointer relative group ${
                  activeMode === 'webdev'
                    ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                    : 'border-line bg-elevated hover:border-cyan-500/40 hover:bg-elevated/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Code className="h-6 w-6" />
                  </div>
                  <span className="badge text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/20">
                    4 Rooms · HTML & CSS
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-ivory group-hover:text-cyan-400 transition-colors">
                  Mode 2: The Unstyled Webpage (Web Dev)
                </h3>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  Theme the house like a broken, unrendered website. Turn cardboard wireframe boxes into load-bearing
                  semantic architecture in the foyer, snap floating furniture into place with CSS Flexbox & Grid,
                  prevent collisions in the bedroom using the CSS Box Model, and animate the kinetic courtyard fountain with @keyframes.
                </p>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                  <span>Launch Web Dev Mode</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Intro Screen Modal ────────────────────────────────────────── */}
      {gameState === 'intro' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md animate-fade-in text-center">
          <div className="max-w-xl w-full rounded-2xl border border-line bg-graphite p-6 sm:p-8 shadow-2xl">
            <span className="badge bg-gold-400/10 text-gold-400 text-xs font-semibold mb-3">
              Room {currentFloorId} of {maxFloors}
            </span>

            <h3 className="font-display text-2xl font-bold text-ivory tracking-tight">
              {activeFloor.name}
            </h3>
            <p className="text-xs font-mono text-gold-400 mt-1">{activeFloor.theme}</p>

            <p className="text-xs sm:text-sm text-muted mt-4 leading-relaxed text-left bg-elevated/50 p-4 rounded-xl border border-line">
              {activeFloor.storyIntro}
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={startExploring}
                className="btn btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Enter & Explore Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Dual-Pane Game Viewport ─────────────────────────────── */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: 2D Canvas Mansion Exploration */}
        <div className="relative flex-1 flex flex-col p-4 bg-obsidian">
          {/* Controls Subtitle & HUD */}
          <div className="flex items-center justify-between mb-2 text-xs text-muted font-mono">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-gold-400" />
              <span>Use WASD or Arrows to explore · Walk near terminals to inspect [E]</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span>Time: {elapsedSeconds}s</span>
              <span>·</span>
              <span className={isCurrentRoomSolved ? 'text-emerald-400' : 'text-amber-400'}>
                {isCurrentRoomSolved ? '✓ Room Calibrated' : '⚡ Puzzle Active'}
              </span>
            </div>
          </div>

          {/* Interactive Top-Down Canvas */}
          <CodeHouseCanvas
            floor={enrichedFloor}
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
<<<<<<< HEAD
            roomStates={saveData.roomStates}
            bugs={activeBugs}
            onSquashBug={handleSquashBug}
            fuseBoxState={fuseBoxState}
            placedDecors={saveData.placedDecors || []}
            shakeScreen={shakeScreen}
            confettiActive={confettiActive}
            onRoomConnection={handleRoomConnection}
            onSegfaultTrap={handleSegfaultTrap}
=======
            identity={resolvedIdentity}
            username={username}
            avatarUrl={avatarUrl}
>>>>>>> d7f7895635cfa88d9d6198ee14cbc5ee8f3db9bc
          />

          {/* Mobile Virtual Controls */}
          <div className="lg:hidden flex items-center justify-between mt-3 px-2">
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

        {/* Right Pane: Room Objective & Challenge Hub */}
        <div className="lg:w-[420px] xl:w-[460px] border-t lg:border-t-0 lg:border-l border-line bg-graphite flex flex-col z-20">
          {/* Header */}
          <div className="p-4 border-b border-line bg-elevated flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-gold-400" />
              <h3 className="font-display font-semibold text-sm text-ivory">
                Room Mission Telemetry
              </h3>
            </div>
            <span
              className={`badge text-[10px] ${
                isCurrentRoomSolved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gold-400/10 text-gold-400 border border-gold-400/30'
              }`}
            >
              {isCurrentRoomSolved ? '✓ Complete' : 'In Progress'}
            </span>
          </div>

          {/* Mission Briefing */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="p-3.5 rounded-xl border border-line bg-elevated">
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider block mb-1">
                Active Objective
              </span>
              <h4 className="font-display font-bold text-sm text-ivory">
                {activeFloor.quest.title}
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {activeFloor.quest.storyBrief}
              </p>
            </div>

            {/* Room Devices & Interactable Highlights */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Interactable Room Devices
              </span>
              {activeFloor.objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => handleInteract(obj)}
                  className="p-3 rounded-lg border border-line bg-elevated/60 hover:bg-elevated transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {obj.type === 'terminal' || obj.type === 'grand-terminal' ? (
                      <Terminal className="w-4 h-4 text-gold-400" />
                    ) : obj.type === 'bookshelf' ? (
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                    ) : obj.type === 'server-rack' ? (
                      <Cpu className="w-4 h-4 text-red-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-400" />
                    )}
                    <div>
                      <p className="font-medium text-ivory">{obj.name}</p>
                      <p className="text-[10px] text-muted truncate max-w-[220px]">
                        {obj.hintData ? 'Contains Syntax Cheat Sheet' : obj.linkedChallengeId ? 'Interactive Challenge Console' : obj.inspectText}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gold-400 font-mono">Inspect ➔</span>
                </div>
              ))}
            </div>

            {/* Launch Challenge Terminal Directly */}
            {(activeFloor.dsaChallenge || activeFloor.webDevChallenge) && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (activeMode === 'dsa') setActiveDsaChallengeModal(true);
                    else setActiveWebDevStudioModal(true);
                  }}
                  className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isCurrentRoomSolved
                      ? 'Re-Open Challenge Console'
                      : activeMode === 'dsa'
                      ? 'Open C++ Challenge Console'
                      : 'Open Web Dev Split Studio'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: DSA Challenge Interactive Modal (C++) ─────────────── */}
      {activeDsaChallengeModal && activeFloor.dsaChallenge && (
        <DsaTerminalModal
          challenge={activeFloor.dsaChallenge}
          isSolved={isCurrentRoomSolved}
          onClose={() => setActiveDsaChallengeModal(false)}
          onSolve={handleDsaSolved}
        />
      )}

      {/* ─── MODAL: Web Dev Split Studio Modal (HTML & CSS) ───────────── */}
      {activeWebDevStudioModal && activeFloor.webDevChallenge && (
        <WebDevStudioModal
          challenge={activeFloor.webDevChallenge}
          isSolved={isCurrentRoomSolved}
          onClose={() => setActiveWebDevStudioModal(false)}
          onSolve={handleWebDevSolved}
        />
      )}

      {/* ─── MODAL: Bookshelf Syntax Cheat Sheet ─────────────────────── */}
      {activeCheatSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gold-400" />
                <h3 className="font-display font-bold text-base text-ivory">
                  {activeCheatSheetModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveCheatSheetModal(null)}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <span className="badge bg-gold-400/10 text-gold-400 text-[10px] mb-3">
              {activeCheatSheetModal.topic}
            </span>

            <div className="bg-obsidian border border-line rounded-lg p-3 my-3">
              <span className="text-[10px] text-muted font-mono block mb-1 uppercase tracking-wider">
                Syntax Reference
              </span>
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {activeCheatSheetModal.syntaxCheatSheet}
              </pre>
            </div>

            <div className="space-y-1.5 text-xs text-muted mt-3">
              <span className="text-[10px] text-ivory font-bold uppercase tracking-wider block mb-1">
                Scholar Tips
              </span>
              {activeCheatSheetModal.tips.map((tip, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-gold-400">•</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => setActiveCheatSheetModal(null)}
                className="btn btn-primary text-xs py-2 px-5"
              >
                Close Folio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Generic Inspection Modal ─────────────────────────── */}
      {gameState === 'inspect' && inspectedObject && !activeCheatSheetModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">
                  {inspectedObject.name}
                </h4>
              </div>
              <button onClick={closeInspectModal} className="text-xs text-muted hover:text-ivory">
                ✕
              </button>
            </div>

            <p className="text-xs text-ivory leading-relaxed mb-4">
              {inspectedObject.inspectText}
            </p>

            {inspectedObject.givesKeyName && (
              <div className="p-3 rounded-lg border border-gold-400/30 bg-gold-400/10 text-xs text-gold-400 flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 shrink-0" />
                <span>Discovered Item: {inspectedObject.givesKeyName}</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-line">
              <button onClick={closeInspectModal} className="btn btn-primary text-xs py-2 px-5">
                Continue Exploring [E]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Room Success Modal ───────────────────────────────── */}
      {gameState === 'success' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-md text-center animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border border-gold-400/50 bg-graphite p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center h-14 w-14 rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-400 mx-auto mb-3">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="font-display text-2xl font-bold text-ivory tracking-tight">
              ROOM CALIBRATED!
            </h3>
            <p className="text-xs text-gold-400 font-mono mt-1">
              Room {currentFloorId}: {activeFloor.quest.title} Complete
            </p>

            <div className="my-5 p-4 rounded-xl border border-line bg-elevated text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Subject Mastered:</span>
                <span className="text-gold-400 font-bold">{activeFloor.levelBadge}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Time Elapsed:</span>
                <span className="text-ivory font-mono">{elapsedSeconds}s</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Academic XP Earned:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{activeFloor.quest.xpReward} XP
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {currentFloorId < maxFloors ? (
                <button
                  onClick={() => changeFloor((currentFloorId + 1) as FloorId)}
                  className="btn btn-primary px-7 py-3 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)]"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Advance to Room {currentFloorId + 1}</span>
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

      {/* ─── MODAL: Out of Focus Hearts Modal ────────────────────────── */}
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
              3 Hearts Lost · 0 Academic XP Deducted
            </p>

            <p className="text-xs text-muted mt-3 leading-relaxed">
              Your focus was depleted by repeated syntax or ordering errors. Inspect the bookshelves for
              syntax cheat sheets and try again!
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

      {/* ─── MODAL: Audio Settings ───────────────────────────────────── */}
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
                  <span className="font-medium text-ivory">Estate Ambience</span>
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

      {/* ─── MODAL: Estate Map ────────────────────────────────────────── */}
      {gameState === 'floormap' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full rounded-xl border border-line bg-graphite p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-base font-semibold text-ivory">
                  {activeMode === 'dsa' ? 'Algorithmic Facility Map' : 'Web Estate Map'}
                </h4>
              </div>
              <button
                onClick={() => setGameState('exploring')}
                className="text-xs text-muted hover:text-ivory"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {Object.values(activeEstate).slice(0, maxFloors).map((floorItem) => {
                const isUnlocked = saveData.unlockedFloors.includes(floorItem.id);
                const isCompleted = saveData.completedFloors.includes(floorItem.id);
                const isCurrent = currentFloorId === floorItem.id;

                return (
                  <div
                    key={floorItem.id}
                    onClick={() => {
                      if (isUnlocked) changeFloor(floorItem.id);
                    }}
                    className={`p-3.5 rounded-lg border transition-all flex items-center justify-between text-xs ${
                      isCurrent
                        ? 'border-gold-400 bg-gold-400/10'
                        : isUnlocked
                        ? 'border-line bg-elevated hover:bg-elevated/80 cursor-pointer'
                        : 'border-line/40 bg-elevated/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-graphite border border-line">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isUnlocked ? (
                          <Unlock className="w-4 h-4 text-gold-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-ivory">
                          Room {floorItem.id}: {floorItem.name}
                        </p>
                        <p className="text-[10px] text-muted">{floorItem.levelBadge}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted">
                      {isCurrent ? 'Current' : isCompleted ? 'Completed' : isUnlocked ? 'Enter ➔' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-line flex justify-end">
              <button
                onClick={() => setGameState('exploring')}
                className="btn btn-secondary text-xs py-2 px-5"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Segfault Void ─────────────────────────────────────── */}
      {segfaultTrapAddress && (
        <SegfaultVoidModal
          pointerAddress={segfaultTrapAddress}
          onRespawn={handleRespawnFromSegfault}
        />
      )}

      {/* ─── MODAL: NPC Dialog ────────────────────────────────────────── */}
      {activeNpcCharacter && (
        <NpcDialogModal
          npc={activeNpcCharacter}
          mode={activeMode}
          floorId={currentFloorId}
          isSolved={isCurrentRoomSolved}
          onClose={() => setActiveNpcCharacter(null)}
        />
      )}

      {/* ─── MODAL: Decor Shop ────────────────────────────────────────── */}
      {isDecorShopOpen && (
        <DecorShopModal
          currentFloorId={currentFloorId}
          playerPos={playerPos}
          byteBits={saveData.byteBits ?? 0}
          unlockedDecorIds={saveData.unlockedDecorIds || []}
          placedDecors={saveData.placedDecors || []}
          isRoomRestored={isCurrentRoomSolved}
          onClose={() => setIsDecorShopOpen(false)}
          onPurchase={handlePurchaseDecor}
          onPlace={handlePlaceDecor}
          onRemovePlaced={handleRemovePlacedDecor}
        />
      )}

      {/* ─── MODAL: Mini-Game Arcade ──────────────────────────────────── */}
      {isMiniGameOpen && (
        <MiniGameModal
          onClose={() => setIsMiniGameOpen(false)}
          onReward={handleMiniGameReward}
        />
      )}
    </div>
  );
}
