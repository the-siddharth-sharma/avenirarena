import { useEffect, useRef, useCallback } from 'react';
import type { FloorDefinition, Position, WorldObject } from './types';
import { houseAudio } from './audio';

interface CodeHouseCanvasProps {
  floor: FloorDefinition;
  playerPos: Position;
  playerFacing: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  discoveredFragmentIds: string[];
  collectedKeyIds: string[];
  nearbyObject: WorldObject | null;
  onNearbyObjectChange: (obj: WorldObject | null) => void;
  onInteract: (obj: WorldObject) => void;
  onPlayerMove: (newPos: Position, facing: 'up' | 'down' | 'left' | 'right', moving: boolean) => void;
  activeKeys: Set<string>;
}

const PLAYER_RADIUS = 16;
const MOVE_SPEED = 210; // pixels per second

export function CodeHouseCanvas({
  floor,
  playerPos,
  playerFacing,
  isMoving,
  discoveredFragmentIds,
  collectedKeyIds,
  nearbyObject,
  onNearbyObjectChange,
  onInteract,
  onPlayerMove,
  activeKeys,
}: CodeHouseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const dustParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }>>([]);
  const flameTimerRef = useRef<number>(0);

  // Initialize atmospheric dust motes
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * floor.mapWidth,
        y: Math.random() * floor.mapHeight,
        vx: (Math.random() - 0.5) * 12,
        vy: -4 - Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.35,
        size: 1 + Math.random() * 2,
      });
    }
    dustParticlesRef.current = particles;
  }, [floor.mapWidth, floor.mapHeight]);

  // Collision detection helper against walls and solid objects
  const checkCollision = useCallback(
    (x: number, y: number): boolean => {
      // 1. Boundary check
      if (
        x - PLAYER_RADIUS < 50 ||
        x + PLAYER_RADIUS > floor.mapWidth - 50 ||
        y - PLAYER_RADIUS < 60 ||
        y + PLAYER_RADIUS > floor.mapHeight - 50
      ) {
        return true;
      }

      // 2. Wall collisions
      for (const wall of floor.walls) {
        if (
          x + PLAYER_RADIUS > wall.x &&
          x - PLAYER_RADIUS < wall.x + wall.width &&
          y + PLAYER_RADIUS > wall.y &&
          y - PLAYER_RADIUS < wall.y + wall.height
        ) {
          return true;
        }
      }

      // 3. Object collisions (except grand terminal which has a larger interact area)
      for (const obj of floor.objects) {
        if (obj.type === 'grand-terminal') continue;
        const pad = 6;
        if (
          x + PLAYER_RADIUS > obj.x - pad &&
          x - PLAYER_RADIUS < obj.x + obj.width + pad &&
          y + PLAYER_RADIUS > obj.y - pad &&
          y - PLAYER_RADIUS < obj.y + obj.height + pad
        ) {
          return true;
        }
      }

      return false;
    },
    [floor]
  );

  // Proximity check for nearest interactable object
  const findNearbyObject = useCallback(
    (px: number, py: number): WorldObject | null => {
      let nearest: WorldObject | null = null;
      let minDistance = Infinity;

      for (const obj of floor.objects) {
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;
        const dist = Math.hypot(px - cx, py - cy);
        const radius = obj.interactRadius || Math.max(obj.width, obj.height) / 2 + 45;

        if (dist <= radius && dist < minDistance) {
          minDistance = dist;
          nearest = obj;
        }
      }
      return nearest;
    },
    [floor.objects]
  );

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let currentX = playerPos.x;
    let currentY = playerPos.y;
    let currentFacing = playerFacing;
    let currentMoving = isMoving;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = now;
      flameTimerRef.current += dt * 5;

      // Handle keyboard movement vector
      let dx = 0;
      let dy = 0;

      if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= 1;
      if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += 1;
      if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= 1;
      if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += 1;

      const moving = dx !== 0 || dy !== 0;

      if (moving) {
        // Normalize diagonal movement
        const len = Math.hypot(dx, dy);
        dx = (dx / len) * MOVE_SPEED * dt;
        dy = (dy / len) * MOVE_SPEED * dt;

        // Facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
          currentFacing = dx > 0 ? 'right' : 'left';
        } else {
          currentFacing = dy > 0 ? 'down' : 'up';
        }

        // Try moving with wall sliding
        let nextX = currentX + dx;
        let nextY = currentY + dy;

        if (!checkCollision(nextX, currentY)) {
          currentX = nextX;
        }
        if (!checkCollision(currentX, nextY)) {
          currentY = nextY;
        }

        houseAudio.playFootstep();
      }

      currentMoving = moving;
      onPlayerMove({ x: currentX, y: currentY }, currentFacing, currentMoving);

      // Check proximity to interactable object
      const nearest = findNearbyObject(currentX, currentY);
      if (nearest?.id !== nearbyObject?.id) {
        onNearbyObjectChange(nearest);
      }

      // Update dust particles
      const dust = dustParticlesRef.current;
      for (const p of dust) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < 50) p.y = floor.mapHeight - 50;
        if (p.x < 50) p.x = floor.mapWidth - 50;
        if (p.x > floor.mapWidth - 50) p.x = 50;
      }

      // Render Scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderScene(ctx, canvas, currentX, currentY, currentFacing, currentMoving);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [
    activeKeys,
    checkCollision,
    findNearbyObject,
    floor,
    nearbyObject,
    onNearbyObjectChange,
    onPlayerMove,
    playerFacing,
    playerPos,
    isMoving,
  ]);

  // Canvas resize listener
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight || 560;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Primary Canvas Drawing Function
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    px: number,
    py: number,
    facing: 'up' | 'down' | 'left' | 'right',
    moving: boolean
  ) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;

    // Camera following player with map boundary clamping
    let cameraX = px - viewW / 2;
    let cameraY = py - viewH / 2;
    cameraX = Math.max(0, Math.min(floor.mapWidth - viewW, cameraX));
    cameraY = Math.max(0, Math.min(floor.mapHeight - viewH, cameraY));

    ctx.save();
    ctx.clearRect(0, 0, viewW, viewH);

    // Apply Camera Translation
    ctx.translate(-cameraX, -cameraY);

    // 1. Draw Mansion Void Background
    ctx.fillStyle = '#0B0D10';
    ctx.fillRect(0, 0, floor.mapWidth, floor.mapHeight);

    // 2. Draw Floor Rooms
    for (const room of floor.rooms) {
      const b = room.bounds;

      // Base room floor
      if (room.floorTexture === 'wood') {
        ctx.fillStyle = '#1C1612';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Wood plank lines
        ctx.strokeStyle = '#261F1A';
        ctx.lineWidth = 1;
        for (let y = b.y; y < b.y + b.height; y += 32) {
          ctx.beginPath();
          ctx.moveTo(b.x, y);
          ctx.lineTo(b.x + b.width, y);
          ctx.stroke();
        }
      } else if (room.floorTexture === 'metal') {
        ctx.fillStyle = '#14181B';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Metal grating tiles
        ctx.strokeStyle = '#1E2429';
        ctx.lineWidth = 1;
        for (let x = b.x; x < b.x + b.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, b.y);
          ctx.lineTo(x, b.y + b.height);
          ctx.stroke();
        }
        for (let y = b.y; y < b.y + b.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(b.x, y);
          ctx.lineTo(b.x + b.width, y);
          ctx.stroke();
        }
      } else {
        // Stone slabs
        ctx.fillStyle = '#171A1E';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = '#22262C';
        ctx.lineWidth = 1;
        for (let x = b.x; x < b.x + b.width; x += 48) {
          for (let y = b.y; y < b.y + b.height; y += 48) {
            ctx.strokeRect(x, y, 48, 48);
          }
        }
      }

      // Subtle atmospheric room tint
      if (room.ambientColor) {
        ctx.fillStyle = room.ambientColor;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }

      // Elegant room label on the floor
      ctx.fillStyle = 'rgba(208, 180, 119, 0.08)';
      ctx.font = '600 13px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(room.name.toUpperCase(), b.x + 16, b.y + 24);
    }

    // 3. Draw Architectural Walls
    for (const wall of floor.walls) {
      // Wall drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(wall.x + 4, wall.y + 4, wall.width, wall.height);

      // Wall core
      ctx.fillStyle = '#2A2E35';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Wall top bevel
      ctx.fillStyle = '#3E444E';
      ctx.fillRect(wall.x, wall.y, wall.width, Math.min(4, wall.height));
      ctx.fillStyle = '#1C2025';
      ctx.fillRect(wall.x, wall.y + wall.height - 4, wall.width, Math.min(4, wall.height));
    }

    // 4. Draw Furniture and Interactive Objects
    for (const obj of floor.objects) {
      const isLooted =
        (obj.givesFragmentId && discoveredFragmentIds.includes(obj.givesFragmentId)) ||
        (obj.givesKeyId && collectedKeyIds.includes(obj.givesKeyId));
      const isNearby = nearbyObject?.id === obj.id;

      // Object shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(obj.x + 4, obj.y + 4, obj.width, obj.height);

      // Object Base
      if (obj.type === 'grand-terminal') {
        // High-tech ornate console
        ctx.fillStyle = '#1A1D24';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // Terminal glowing screen
        const pulse = Math.sin(flameTimerRef.current) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(0, 240, 255, ${0.4 * pulse})`;
        ctx.fillRect(obj.x + 8, obj.y + 8, obj.width - 16, obj.height - 18);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TERMINAL', obj.x + obj.width / 2, obj.y + 22);
      } else if (obj.type === 'fireplace') {
        // Hearth stone
        ctx.fillStyle = '#3A2E28';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#1A1412';
        ctx.fillRect(obj.x + 10, obj.y + 12, obj.width - 20, obj.height - 16);

        // Flickering fire
        const fPulse = Math.sin(flameTimerRef.current * 2) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 120, 40, ${0.85 * fPulse})`;
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2 + 4, 12 * fPulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'bookshelf') {
        // Wood frame
        ctx.fillStyle = '#38281E';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#241812';
        ctx.fillRect(obj.x + 4, obj.y + 4, obj.width - 8, obj.height - 8);

        // Colored book spines
        const bookColors = ['#8B0000', '#D0B477', '#2E4057', '#046A38', '#5C4033'];
        for (let bx = obj.x + 8; bx < obj.x + obj.width - 12; bx += 9) {
          const c = bookColors[Math.floor((bx * 13) % bookColors.length)];
          ctx.fillStyle = isLooted ? '#444' : c;
          ctx.fillRect(bx, obj.y + 6, 7, obj.height - 12);
        }
      } else if (obj.type === 'chest') {
        ctx.fillStyle = isLooted ? '#4A4035' : '#8B6508';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obj.x + 2, obj.y + 2, obj.width - 4, obj.height - 4);
        // Lock plate
        ctx.fillStyle = isLooted ? '#333' : '#FFD700';
        ctx.fillRect(obj.x + obj.width / 2 - 4, obj.y + obj.height / 2 - 4, 8, 8);
      } else if (obj.type === 'globe') {
        ctx.fillStyle = '#654321';
        ctx.fillRect(obj.x + obj.width / 2 - 6, obj.y + obj.height - 12, 12, 12);
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2 - 4, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obj.type === 'clock') {
        ctx.fillStyle = '#4A2E18';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#D0B477';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + 16, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Generic desk / pedestal / specimen / valve
        ctx.fillStyle = obj.color || '#4A4E58';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }

      // If object has been inspected/looted, show soft tick mark
      if (isLooted) {
        ctx.fillStyle = 'rgba(208, 180, 119, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', obj.x + obj.width / 2, obj.y - 4);
      }

      // Nearby highlight ring
      if (isNearby) {
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6);
      }
    }

    // 5. Atmospheric Dust Particles
    ctx.fillStyle = 'rgba(208, 180, 119, 0.35)';
    for (const p of dustParticlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Player Avatar
    ctx.save();
    ctx.translate(px, py);

    // Walking bob offset
    const bob = moving ? Math.sin(flameTimerRef.current * 3) * 2 : 0;

    // Player drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 10, PLAYER_RADIUS * 0.9, PLAYER_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Explorer Overcoat)
    ctx.fillStyle = '#222831';
    ctx.beginPath();
    ctx.arc(0, bob, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Champagne gold trim
    ctx.strokeStyle = '#D0B477';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Explorer Visor / Directional Indicator
    let visorX = 0;
    let visorY = 0;
    if (facing === 'up') visorY = -8;
    if (facing === 'down') visorY = 8;
    if (facing === 'left') visorX = -8;
    if (facing === 'right') visorX = 8;

    // Visor glow
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.arc(visorX, visorY + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Lantern in hand
    let lanternX = 12;
    let lanternY = 4;
    if (facing === 'left') lanternX = -12;
    ctx.fillStyle = '#D0B477';
    ctx.beginPath();
    ctx.arc(lanternX, lanternY + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Dynamic Lantern Darkness & Lighting Pass
    // Draw darkness overlay with a radial light cutout around player & light sources
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = viewW;
    lightCanvas.height = viewH;
    const lCtx = lightCanvas.getContext('2d');

    if (lCtx) {
      // Base atmospheric mansion darkness
      lCtx.fillStyle = 'rgba(10, 12, 16, 0.72)';
      lCtx.fillRect(0, 0, viewW, viewH);

      lCtx.globalCompositeOperation = 'destination-out';

      // Player lantern warm cutout
      const screenPx = px - cameraX;
      const screenPy = py - cameraY;
      const lanternGrad = lCtx.createRadialGradient(screenPx, screenPy, 15, screenPx, screenPy, 240);
      lanternGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      lanternGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)');
      lanternGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = lanternGrad;
      lCtx.beginPath();
      lCtx.arc(screenPx, screenPy, 240, 0, Math.PI * 2);
      lCtx.fill();

      // Additional ambient cutouts for Grand Terminal & Fireplaces on screen
      for (const obj of floor.objects) {
        const objScreenX = obj.x + obj.width / 2 - cameraX;
        const objScreenY = obj.y + obj.height / 2 - cameraY;

        if (obj.type === 'grand-terminal' || obj.type === 'fireplace') {
          const glowGrad = lCtx.createRadialGradient(objScreenX, objScreenY, 10, objScreenX, objScreenY, 120);
          glowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          lCtx.fillStyle = glowGrad;
          lCtx.beginPath();
          lCtx.arc(objScreenX, objScreenY, 120, 0, Math.PI * 2);
          lCtx.fill();
        }
      }

      // Draw composite darkness back onto main canvas
      ctx.drawImage(lightCanvas, cameraX, cameraY);
    }

    // 8. Draw Nearby Interactive Prompt Pill
    if (nearbyObject) {
      const objCenterX = nearbyObject.x + nearbyObject.width / 2;
      const promptY = nearbyObject.y - 18;

      ctx.save();
      ctx.textAlign = 'center';
      const promptText = `[E] ${nearbyObject.name}`;
      ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif';
      const textWidth = ctx.measureText(promptText).width;

      // Pill Background
      ctx.fillStyle = 'rgba(15, 17, 21, 0.9)';
      ctx.beginPath();
      ctx.roundRect(objCenterX - textWidth / 2 - 12, promptY - 14, textWidth + 24, 22, 11);
      ctx.fill();

      ctx.strokeStyle = '#D0B477';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pill Text
      ctx.fillStyle = '#D0B477';
      ctx.fillText(promptText, objCenterX, promptY + 1);

      ctx.restore();
    }

    ctx.restore();
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] rounded-xl overflow-hidden border border-line bg-obsidian select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onClick={() => {
          if (nearbyObject) {
            onInteract(nearbyObject);
          }
        }}
      />
    </div>
  );
}
