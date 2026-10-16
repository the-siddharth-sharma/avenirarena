export type FloorId = 1 | 2 | 3 | 4;

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
  | 'pedestal';

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
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoomArea {
  id: string;
  name: string;
  bounds: Rect;
  ambientColor?: string;
  floorTexture?: 'wood' | 'stone' | 'metal';
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

export interface QuestGoal {
  floorId: FloorId;
  title: string;
  subtitle: string;
  storyBrief: string;
  expectedOutput: string;
  expectedOrder: string[]; // Ordered list of fragment IDs that constitute the correct solution
  sampleInputs?: string;
  hint1: string;
  hint2: string;
  xpReward: number;
  templateCode?: string;
}

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
}

export interface StudentCodeHouseData {
  studentId: string;
  unlockedFloors: FloorId[];
  completedFloors: FloorId[];
  discoveredFragmentIds: string[];
  collectedKeyIds: string[];
  discoveredClueIds: string[];
  floorAttempts: Record<FloorId, number>;
  floorBestTimes: Record<FloorId, number>; // in seconds
  totalXP: number;
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
}
