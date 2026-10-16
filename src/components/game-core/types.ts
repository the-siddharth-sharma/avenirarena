export interface PlayerIdentity {
  username: string;
  avatarUrl: string;
  initials: string;
  avatarImage: HTMLImageElement | null;
  isAvatarLoaded: boolean;
  campus: string;
  year: string;
}

export interface CanvasAvatarRenderOptions {
  x: number;
  y: number;
  radius?: number;
  bob?: number;
  ringColor?: string;
  ringWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  tetherStartY?: number;
  tetherColor?: string;
  showDirectionPip?: boolean;
  facing?: 'up' | 'down' | 'left' | 'right';
  pipColor?: string;
  showCallsignTag?: boolean;
}
