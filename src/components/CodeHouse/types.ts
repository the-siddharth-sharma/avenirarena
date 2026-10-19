export type FloorId = 1 | 2 | 3 | 4 | 5;

export type CodeHouseMode = 'dsa' | 'webdev';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ObjectType =
  | 'terminal'
  | 'grand-terminal'
  | 'bookshelf'
  | 'desk'
  | 'chest'
  | 'fireplace'
  | 'door'
  | 'locked-gate'
  | 'globe'
  | 'clock'
  | 'chalkboard'
  | 'safe'
  | 'specimen'
  | 'valve'
  | 'pedestal'
  | 'appliance'
  | 'server-rack'
  | 'fountain'
  | 'wardrobe'
  | 'plate-dispenser'
  | 'pantry-queue'
  | 'box-crate'
  | 'hedge-gate'
  | 'npc-duck'
  | 'npc-sysadmin'
  | 'npc-designer'
  | 'fuse-box';

export interface WorldObject {
  id: string;
  name: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  interactRadius?: number;
  requiresKeyId?: string;
  isLocked?: boolean;
  inspectText: string;
  clueText?: string;
  givesFragmentId?: string;
  givesKeyId?: string;
  givesKeyName?: string;
  color?: string;
  // Dynamic state attributes
  isBroken?: boolean;
  isPowered?: boolean;
  linkedChallengeId?: string;
  linkedNpcId?: string;
  hintData?: {
    title: string;
    topic: string;
    syntaxCheatSheet: string;
    tips: string[];
  };
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomConnection {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isLocked?: boolean;
  targetPlayerSpawn: Position;
  targetFloorId: FloorId;
  requiresChallengeId?: string;
  pointerAddress?: string; // Memory pointer address e.g. 0x00FF (DSA Mode)
  isSegfaultTrap?: boolean; // Entering triggers segfault void
}

export interface RoomArea {
  id: string;
  name: string;
  bounds: Rect;
  ambientColor?: string;
  floorTexture?: 'wood' | 'stone' | 'metal' | 'wireframe' | 'grass';
  isPowered?: boolean;
  powerColor?: string;
  themeTitle?: string;
}

export interface CodeFragment {
  id: string;
  floorId: FloorId;
  code: string;
  label: string;
  category: 'header' | 'function' | 'variable' | 'control' | 'statement' | 'bracket';
  isDistractor?: boolean;
  distractorReason?: string;
  hint?: string;
}

// ─── Mode 1: DSA Challenge Definitions (C++) ───────────────────────────
export interface DsaTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation: string;
}

export interface DsaChallenge {
  id: string;
  roomId: string;
  title: string;
  topic: 'Arrays & Vectors' | 'Pointers & Linked Lists' | 'Stacks & Queues' | 'Trees & Graphs' | 'Dynamic Programming';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  deviceLore: string;
  timeComplexityTarget: string;
  spaceComplexityTarget: string;
  starterCode: string;
  solutionCode: string;
  testCases: DsaTestCase[];
  hints: string[];
  xpReward: number;
}

// ─── Mode 2: Web Development Challenge Definitions (HTML & CSS) ────────
export interface WebDevRule {
  id: string;
  description: string;
  selector?: string;
  requiredProperty?: string;
  requiredValueRegex?: string;
}

export interface WebDevChallenge {
  id: string;
  roomId: string;
  title: string;
  topic: 'HTML Semantics' | 'Flexbox & Grid' | 'CSS Box Model' | 'CSS Animations & Responsive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  deviceLore: string;
  initialHtml: string;
  initialCss: string;
  targetExplanation: string;
  rules: WebDevRule[];
  hints: string[];
  xpReward: number;
  previewType: 'cardboard-foyer' | 'disarray-living-room' | 'overlapping-bedroom' | 'kinetic-backyard';
}

export interface QuestGoal {
  floorId: FloorId;
  title: string;
  subtitle: string;
  storyBrief: string;
  expectedOutput: string;
  expectedOrder: string[];
  sampleInputs?: string;
  hint1: string;
  hint2: string;
  xpReward: number;
  templateCode?: string;
}

// ─── Pacing & Stakes: Roaming Bugs & Fuse Boxes ──────────────────────
export interface BugEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'syntax-bug' | 'memory-leak' | 'null-pointer';
  isSquashed: boolean;
  hint: string;
  bounty: number; // Byte Bits awarded
  size: number;
}

export interface FuseBoxState {
  active: boolean;
  timeRemaining: number; // in seconds
  maxTime: number;
  isTripped: boolean; // Triggers room blackout & emergency siren
}

// ─── Room Renovation & Decor System ("The Sims" Layer) ───────────────
export interface DecorItem {
  id: string;
  name: string;
  category: 'furniture' | 'neon' | 'appliance' | 'plant';
  cost: number; // in Byte Bits
  icon: string;
  color: string;
  width: number;
  height: number;
  description: string;
}

export interface PlacedDecor {
  instanceId: string;
  decorId: string;
  x: number;
  y: number;
  floorId: FloorId;
}

// ─── Interactive Rubber Duck & Quirky NPCs ───────────────────────────
export type NpcPersonality = 'duck' | 'sysadmin' | 'designer';

export interface NpcCharacter {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  personality: NpcPersonality;
  dialogues: {
    intro: string;
    hints: [string, string, string]; // Level 1 (nudge), Level 2 (syntax), Level 3 (pseudo-code)
    solvedCongrats: string;
  };
}

// ─── Floor Definition ────────────────────────────────────────────────
export interface FloorDefinition {
  id: FloorId;
  name: string;
  theme: string;
  levelBadge: string;
  storyIntro: string;
  mapWidth: number;
  mapHeight: number;
  playerSpawn: Position;
  rooms: RoomArea[];
  walls: Wall[];
  objects: WorldObject[];
  fragments: CodeFragment[];
  quest: QuestGoal;
  dsaChallenge?: DsaChallenge;
  webDevChallenge?: WebDevChallenge;
  connections?: RoomConnection[];
  initialBugs?: BugEntity[];
  hasFuseBox?: boolean;
  fuseBoxMaxTime?: number;
  npc?: NpcCharacter;
}

export interface RoomState {
  isSolved: boolean;
  isPowered: boolean;
  unlockedGates: string[];
  renovationStage: 'corrupted' | 'restored';
  dynamicStyles?: Record<string, string>;
  submittedHtml?: string;
  submittedCss?: string;
  bestExecutionTimeMs?: number;
}

export interface StudentCodeHouseData {
  studentId: string;
  activeMode: CodeHouseMode;
  unlockedFloors: FloorId[];
  completedFloors: FloorId[];
  discoveredFragmentIds: string[];
  collectedKeyIds: string[];
  discoveredClueIds: string[];
  floorAttempts: Record<FloorId, number>;
  floorBestTimes: Record<FloorId, number>; // in seconds
  totalXP: number;
  byteBits: number; // Currency reward system
  placedDecors: PlacedDecor[]; // Decor placements
  unlockedDecorIds: string[]; // Inventory of owned decor
  roomStates: Record<string, RoomState>;
}

export interface AssembledLine {
  instanceId: string;
  fragmentId: string;
  code: string;
  category: CodeFragment['category'];
}

export interface ValidationFeedback {
  isValid: boolean;
  title: string;
  message: string;
  simulatedOutput?: string;
  syntaxErrorLine?: number;
  isHeartLost?: boolean;
  testCaseResults?: Array<{
    id: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }>;
}
