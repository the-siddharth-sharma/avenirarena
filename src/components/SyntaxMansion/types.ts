export interface GridPosition {
  x: number;
  y: number;
}

export interface CodeSnippet {
  id: string;
  text: string;
  label?: string;
  category?: 'header' | 'function' | 'loop' | 'pointer' | 'variable' | 'statement' | 'bracket';
}

export interface ClueItem {
  id: string;
  x: number;
  y: number;
  snippet: CodeSnippet;
  collected: boolean;
  name?: string;
}

export type TileType = 'floor' | 'wall' | 'furniture';

export interface FurniturePiece {
  x: number;
  y: number;
  name: string;
  iconName: 'desk' | 'bookshelf' | 'server' | 'terminal' | 'hearth' | 'safe';
  isWalkable: boolean;
}

export interface MansionLevel {
  id: number;
  floorTitle: string;
  subtitle: string;
  prompt: string;
  playerSpawn: GridPosition;
  walls: GridPosition[];
  furniture: FurniturePiece[];
  clues: ClueItem[];
  correctOrder: string[]; // Ordered list of snippet IDs
  expectedOutput: string;
  xpReward: number;
}
