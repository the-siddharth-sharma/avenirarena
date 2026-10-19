import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import type { PlayerIdentity, CanvasAvatarRenderOptions } from './types';
import { usePlayerIdentity } from './usePlayerIdentity';

interface GamePlayerAvatarProps {
  identity?: PlayerIdentity;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCallsign?: boolean;
  showRing?: boolean;
  showDirectionPip?: boolean;
  facing?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: { box: 'w-7 h-7', text: 'text-[10px]', ring: 'ring-1' },
  md: { box: 'w-10 h-10', text: 'text-xs', ring: 'ring-2' },
  lg: { box: 'w-14 h-14', text: 'text-sm', ring: 'ring-2' },
  xl: { box: 'w-20 h-20', text: 'text-base', ring: 'ring-2' },
};

/**
 * Universal Game Player Avatar Component
 * Can be rendered as a high-performance HTML/DOM overlay tracking 2D/3D screen coordinates,
 * or as a HUD player element.
 */
export function GamePlayerAvatar({
  identity: propIdentity,
  size = 'md',
  showCallsign = false,
  showRing = true,
  showDirectionPip = false,
  facing = 'down',
  className = '',
  style,
}: GamePlayerAvatarProps) {
  const hookIdentity = usePlayerIdentity();
  const identity = propIdentity || hookIdentity;
  const [imageError, setImageError] = useState(false);

  const config = SIZE_MAP[size];
  const hasValidImage = Boolean(identity.avatarUrl) && !imageError;

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none pointer-events-none ${className}`}
      style={style}
    >
      {/* Circular Avatar Frame */}
      <div
        className={`${config.box} rounded-full overflow-hidden bg-graphite border border-line flex items-center justify-center font-mono font-bold text-ivory ${
          showRing ? `${config.ring} ring-gold-400/80 shadow-[0_0_15px_rgba(208,180,119,0.35)]` : ''
        }`}
      >
        {hasValidImage ? (
          <img
            src={identity.avatarUrl}
            alt={identity.username}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-500/20 to-gold-700/20 text-gold-400">
            <span className={config.text}>{identity.initials}</span>
          </div>
        )}
      </div>

      {/* Directional Visor Indicator */}
      {showDirectionPip && (
        <div
          className={`h-1.5 w-1.5 rounded-full bg-cyan-400 absolute shadow-[0_0_6px_#00F0FF] z-10 pointer-events-none ${
            facing === 'up'
              ? 'top-0.5'
              : facing === 'down'
              ? 'bottom-0.5'
              : facing === 'left'
              ? 'left-0.5'
              : 'right-0.5'
          }`}
        />
      )}

      {/* Floating Callsign Tag */}
      {showCallsign && (
        <div className="mt-1 px-2 py-0.5 rounded-full bg-obsidian/90 border border-gold-400/40 text-[10px] font-mono font-bold text-gold-400 shadow-md backdrop-blur-sm whitespace-nowrap">
          {identity.username}
        </div>
      )}
    </div>
  );
}

/**
 * Universal Canvas Renderer for 2D/3D Game Loops (HTML5 Canvas / CanvasRenderingContext2D)
 * Call this inside any 60 FPS requestAnimationFrame canvas loop.
 * Zero DOM allocations, zero React re-render overhead.
 */
export function drawPlayerAvatarToCanvas(
  ctx: CanvasRenderingContext2D,
  identity: PlayerIdentity,
  options: CanvasAvatarRenderOptions
): void {
  const {
    x,
    y,
    radius = 14,
    bob = 0,
    ringColor = '#D0B477',
    ringWidth = 2,
    shadowColor = '#D0B477',
    shadowBlur = 10,
    tetherStartY,
    tetherColor = 'rgba(208, 180, 119, 0.55)',
    showDirectionPip = false,
    facing = 'down',
    pipColor = '#00F0FF',
    showCallsignTag = false,
  } = options;

  const currentY = y + bob;

  // 1. Optional Holographic Tether (e.g. for flight vehicles like Code Runner)
  if (typeof tetherStartY === 'number') {
    ctx.beginPath();
    ctx.moveTo(x, tetherStartY);
    ctx.lineTo(x, currentY + radius + 1);
    ctx.strokeStyle = tetherColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 2. Glowing Outer Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, currentY, radius + ringWidth, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = ringWidth;
  if (shadowBlur > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Circular Avatar Image with Clipping
  ctx.beginPath();
  ctx.arc(x, currentY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0F1115';
  ctx.fill();
  ctx.clip();

  if (identity.avatarImage && identity.avatarImage.complete && identity.avatarImage.naturalWidth > 0) {
    ctx.drawImage(
      identity.avatarImage,
      x - radius,
      currentY - radius,
      radius * 2,
      radius * 2
    );
  } else {
    // Built-in Central Fallback: Solid metallic circle with initial
    ctx.fillStyle = '#1A1E29';
    ctx.fill();
    ctx.fillStyle = ringColor;
    ctx.font = `bold ${Math.max(10, Math.round(radius * 0.85))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(identity.initials || 'U', x, currentY);
  }
  ctx.restore();

  // 4. Directional Visor Pip (e.g. for top-down exploration like The Code House)
  if (showDirectionPip) {
    let pipX = x;
    let pipY = currentY;
    if (facing === 'up') pipY -= radius;
    if (facing === 'down') pipY += radius;
    if (facing === 'left') pipX -= radius;
    if (facing === 'right') pipX += radius;

    ctx.save();
    ctx.fillStyle = pipColor;
    ctx.shadowColor = pipColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(pipX, pipY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Optional Callsign Nameplate
  if (showCallsignTag && identity.username) {
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(identity.username).width;
    const badgeW = textWidth + 8;
    const badgeH = 13;
    const badgeY = currentY - radius - 10;

    ctx.fillStyle = 'rgba(15, 17, 21, 0.85)';
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(identity.username, x, badgeY);
    ctx.restore();
  }
}
