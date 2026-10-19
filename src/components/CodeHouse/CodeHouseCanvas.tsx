import { useEffect, useRef, useCallback } from 'react';
import type {
  BugEntity,
  DecorItem,
  FloorDefinition,
  FuseBoxState,
  PlacedDecor,
  Position,
  RoomConnection,
  RoomState,
  WorldObject,
} from './types';
import { houseAudio } from './audio';
import { DECOR_CATALOG } from './decorShop';

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
  roomStates?: Record<string, RoomState>;
  // Dynamic Game Systems Props
  bugs?: BugEntity[];
  onSquashBug?: (bug: BugEntity) => void;
  fuseBoxState?: FuseBoxState;
  placedDecors?: PlacedDecor[];
  shakeScreen?: boolean;
  confettiActive?: boolean;
  onRoomConnection?: (conn: RoomConnection) => void;
  onSegfaultTrap?: (pointerAddress?: string) => void;
}

const PLAYER_RADIUS = 16;
const MOVE_SPEED = 220; // pixels per second

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
  roomStates = {},
  bugs = [],
  onSquashBug,
  fuseBoxState,
  placedDecors = [],
  shakeScreen = false,
  confettiActive = false,
  onRoomConnection,
  onSegfaultTrap,
}: CodeHouseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const flameTimerRef = useRef<number>(0);

  // Screen shake and floating text state
  const shakeTimerRef = useRef<number>(0);
  const floatingTextsRef = useRef<
    Array<{ x: number; y: number; text: string; color: string; alpha: number; vy: number }>
  >([]);

  // Confetti particles
  const confettiRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rotSpeed: number; alpha: number }>
  >([]);

  // Atmospheric dust motes
  const dustParticlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }>
  >([]);

  // Local mutable copy of bugs for smooth 60fps physics
  const bugsRef = useRef<BugEntity[]>([]);

  useEffect(() => {
    bugsRef.current = bugs.map((b) => ({ ...b }));
  }, [bugs]);

  // Screen Shake trigger
  useEffect(() => {
    if (shakeScreen) {
      shakeTimerRef.current = 0.45; // 450ms shake duration
    }
  }, [shakeScreen]);

  // Confetti burst trigger
  useEffect(() => {
    if (confettiActive) {
      const colors = ['#FACC15', '#38BDF8', '#EC4899', '#10B981', '#A855F7', '#F97316'];
      const particles = [];
      for (let i = 0; i < 75; i++) {
        particles.push({
          x: playerPos.x + (Math.random() - 0.5) * 80,
          y: playerPos.y + (Math.random() - 0.5) * 80,
          vx: (Math.random() - 0.5) * 260,
          vy: -150 - Math.random() * 250,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 10,
          alpha: 1,
        });
      }
      confettiRef.current = particles;
    }
  }, [confettiActive, playerPos.x, playerPos.y]);

  // Initialize atmospheric dust motes
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * floor.mapWidth,
        y: Math.random() * floor.mapHeight,
        vx: (Math.random() - 0.5) * 14,
        vy: -4 - Math.random() * 12,
        alpha: 0.2 + Math.random() * 0.4,
        size: 1 + Math.random() * 2.5,
      });
    }
    dustParticlesRef.current = particles;
  }, [floor.mapWidth, floor.mapHeight]);

  // Collision detection against boundaries, walls, and obstacles
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

      // 3. Object collisions (except grand terminal & doors & NPCs)
      for (const obj of floor.objects) {
        if (
          obj.type === 'grand-terminal' ||
          obj.type === 'door' ||
          obj.type === 'npc-duck' ||
          obj.type === 'npc-sysadmin' ||
          obj.type === 'npc-designer'
        ) {
          continue;
        }
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
        const radius = obj.interactRadius || Math.max(obj.width, obj.height) / 2 + 55;

        if (dist <= radius && dist < minDistance) {
          minDistance = dist;
          nearest = obj;
        }
      }
      return nearest;
    },
    [floor.objects]
  );

  // Check doorway connections or segfault traps
  const checkDoorConnections = useCallback(
    (px: number, py: number) => {
      if (!floor.connections) return;
      for (const conn of floor.connections) {
        if (
          px >= conn.x &&
          px <= conn.x + conn.width &&
          py >= conn.y &&
          py <= conn.y + conn.height
        ) {
          if (conn.isSegfaultTrap) {
            onSegfaultTrap?.(conn.pointerAddress);
            return;
          }
          if (!conn.isLocked) {
            onRoomConnection?.(conn);
            return;
          }
        }
      }
    },
    [floor.connections, onRoomConnection, onSegfaultTrap]
  );

  // Squash bug helper
  const handleSquashBug = useCallback(
    (bug: BugEntity) => {
      if (bug.isSquashed) return;
      bug.isSquashed = true;
      houseAudio.playBugSquish();

      floatingTextsRef.current.push({
        x: bug.x,
        y: bug.y,
        text: `+${bug.bounty} Bits!`,
        color: '#FACC15',
        alpha: 1,
        vy: -40,
      });

      onSquashBug?.(bug);
    },
    [onSquashBug]
  );

  // Canvas mouse click to squash bugs or interact
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;

    let cameraX = playerPos.x - viewW / 2;
    let cameraY = playerPos.y - viewH / 2;
    cameraX = Math.max(0, Math.min(floor.mapWidth - viewW, cameraX));
    cameraY = Math.max(0, Math.min(floor.mapHeight - viewH, cameraY));

    const clickX = (e.clientX - rect.left) + cameraX;
    const clickY = (e.clientY - rect.top) + cameraY;

    // Check if clicked on an active bug
    for (const bug of bugsRef.current) {
      if (!bug.isSquashed) {
        const dist = Math.hypot(clickX - bug.x, clickY - bug.y);
        if (dist <= bug.size + 16) {
          handleSquashBug(bug);
          return;
        }
      }
    }
  };

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
      flameTimerRef.current += dt * 4;

      if (shakeTimerRef.current > 0) {
        shakeTimerRef.current = Math.max(0, shakeTimerRef.current - dt);
      }

      // Handle keyboard movement vector
      let dx = 0;
      let dy = 0;

      if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= 1;
      if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += 1;
      if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= 1;
      if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += 1;

      const moving = dx !== 0 || dy !== 0;

      if (moving) {
        const len = Math.hypot(dx, dy);
        dx = (dx / len) * MOVE_SPEED * dt;
        dy = (dy / len) * MOVE_SPEED * dt;

        if (Math.abs(dx) > Math.abs(dy)) {
          currentFacing = dx > 0 ? 'right' : 'left';
        } else {
          currentFacing = dy > 0 ? 'down' : 'up';
        }

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

      const nearest = findNearbyObject(currentX, currentY);
      if (nearest?.id !== nearbyObject?.id) {
        onNearbyObjectChange(nearest);
      }

      // Check portal connection collisions
      checkDoorConnections(currentX, currentY);

      // Update Roaming Bugs physics & collision with player
      for (const bug of bugsRef.current) {
        if (!bug.isSquashed) {
          bug.x += bug.vx * dt;
          bug.y += bug.vy * dt;

          // Bounce inside map bounds
          if (bug.x < 70 || bug.x > floor.mapWidth - 70) bug.vx = -bug.vx;
          if (bug.y < 80 || bug.y > floor.mapHeight - 80) bug.vy = -bug.vy;

          // Squash when player steps near bug
          const distToPlayer = Math.hypot(currentX - bug.x, currentY - bug.y);
          if (distToPlayer <= PLAYER_RADIUS + bug.size + 4) {
            handleSquashBug(bug);
          }
        }
      }

      // Update Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 0.9;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Update Confetti
      for (let i = confettiRef.current.length - 1; i >= 0; i--) {
        const c = confettiRef.current[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 320 * dt; // gravity
        c.rotation += c.rotSpeed * dt;
        c.alpha -= dt * 0.45;
        if (c.alpha <= 0) {
          confettiRef.current.splice(i, 1);
        }
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
    checkDoorConnections,
    findNearbyObject,
    floor,
    handleSquashBug,
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

    let cameraX = px - viewW / 2;
    let cameraY = py - viewH / 2;
    cameraX = Math.max(0, Math.min(floor.mapWidth - viewW, cameraX));
    cameraY = Math.max(0, Math.min(floor.mapHeight - viewH, cameraY));

    // Screen shake offset calculation
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (shakeTimerRef.current > 0) {
      const mag = shakeTimerRef.current * 14;
      shakeOffsetX = (Math.random() - 0.5) * mag;
      shakeOffsetY = (Math.random() - 0.5) * mag;
    }

    ctx.save();
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.translate(-cameraX + shakeOffsetX, -cameraY + shakeOffsetY);

    // 1. Mansion Void Background
    ctx.fillStyle = '#07090C';
    ctx.fillRect(0, 0, floor.mapWidth, floor.mapHeight);

    // 2. Draw Floor Rooms & Textures
    for (const room of floor.rooms) {
      const b = room.bounds;
      const isRoomSolved = roomStates[room.id]?.isSolved || false;

      // Base Room Texture
      if (room.floorTexture === 'wood') {
        ctx.fillStyle = isRoomSolved ? '#241D17' : '#1C1612';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = '#2B231D';
        ctx.lineWidth = 1;
        for (let y = b.y; y < b.y + b.height; y += 32) {
          ctx.beginPath();
          ctx.moveTo(b.x, y);
          ctx.lineTo(b.x + b.width, y);
          ctx.stroke();
        }
      } else if (room.floorTexture === 'metal') {
        ctx.fillStyle = isRoomSolved ? '#16222A' : '#14181B';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = isRoomSolved ? '#20323D' : '#1E2429';
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
      } else if (room.floorTexture === 'wireframe') {
        // Mode 2: Blueprint Wireframe Texture
        ctx.fillStyle = '#0B132B';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (let x = b.x; x < b.x + b.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, b.y);
          ctx.lineTo(x, b.y + b.height);
          ctx.stroke();
        }
        for (let y = b.y; y < b.y + b.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(b.x, y);
          ctx.lineTo(b.x + b.width, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      } else if (room.floorTexture === 'grass') {
        ctx.fillStyle = '#062B1D';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = '#0A3D2A';
        ctx.lineWidth = 1;
        for (let x = b.x; x < b.x + b.width; x += 48) {
          for (let y = b.y; y < b.y + b.height; y += 48) {
            ctx.strokeRect(x, y, 48, 48);
          }
        }
      } else {
        // Stone Slabs
        ctx.fillStyle = isRoomSolved ? '#1E232A' : '#171A1E';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = '#22262C';
        ctx.lineWidth = 1;
        for (let x = b.x; x < b.x + b.width; x += 48) {
          for (let y = b.y; y < b.y + b.height; y += 48) {
            ctx.strokeRect(x, y, 48, 48);
          }
        }
      }

      // Dynamic Ambient Glow
      if (isRoomSolved) {
        const glowGradient = ctx.createRadialGradient(
          b.x + b.width / 2,
          b.y + b.height / 2,
          20,
          b.x + b.width / 2,
          b.y + b.height / 2,
          b.width * 0.6
        );
        glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      } else if (room.ambientColor) {
        ctx.fillStyle = room.ambientColor;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }

      // Room Title Label on Floor
      ctx.fillStyle = isRoomSolved ? 'rgba(52, 211, 153, 0.25)' : 'rgba(208, 180, 119, 0.12)';
      ctx.font = '600 12px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText((room.themeTitle || room.name).toUpperCase(), b.x + 16, b.y + 24);
    }

    // 3. Walls & Architectural Dividers
    for (const wall of floor.walls) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(wall.x + 4, wall.y + 4, wall.width, wall.height);

      ctx.fillStyle = '#262A32';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      ctx.fillStyle = '#3A404B';
      ctx.fillRect(wall.x, wall.y, wall.width, Math.min(4, wall.height));
      ctx.fillStyle = '#171A1F';
      ctx.fillRect(wall.x, wall.y + wall.height - 4, wall.width, Math.min(4, wall.height));
    }

    // 3.5 Doorway Connection Portals & Memory Addresses
    if (floor.connections) {
      for (const conn of floor.connections) {
        ctx.fillStyle = conn.isSegfaultTrap
          ? 'rgba(239, 68, 68, 0.25)'
          : conn.isLocked
          ? 'rgba(100, 116, 139, 0.25)'
          : 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(conn.x, conn.y, conn.width, conn.height);

        ctx.strokeStyle = conn.isSegfaultTrap ? '#EF4444' : conn.isLocked ? '#64748B' : '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(conn.x, conn.y, conn.width, conn.height);
        ctx.setLineDash([]);

        // Memory pointer badge
        if (conn.pointerAddress) {
          const badgeText = `[${conn.pointerAddress}]`;
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = conn.isSegfaultTrap ? '#F87171' : '#38BDF8';
          ctx.textAlign = 'center';
          ctx.fillText(badgeText, conn.x + conn.width / 2, conn.y - 6);
        }
      }
    }

    // 4. Placed Decor Items ("The Sims" Layer)
    const floorPlaced = placedDecors.filter((d) => d.floorId === floor.id);
    for (const placed of floorPlaced) {
      const itemDef = DECOR_CATALOG.find((d) => d.id === placed.decorId);
      if (!itemDef) continue;

      const dw = itemDef.width;
      const dh = itemDef.height;
      const dx = placed.x - dw / 2;
      const dy = placed.y - dh / 2;

      // Soft glow
      const decorGlow = ctx.createRadialGradient(placed.x, placed.y, 4, placed.x, placed.y, dw);
      decorGlow.addColorStop(0, `${itemDef.color}40`);
      decorGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = decorGlow;
      ctx.fillRect(dx - 10, dy - 10, dw + 20, dh + 20);

      // Decor Body
      ctx.fillStyle = '#13171F';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = itemDef.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, dw, dh);

      // Icon & Name tag
      ctx.fillStyle = itemDef.color;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(itemDef.name.slice(0, 10), placed.x, dy + dh / 2 + 3);
    }

    // 5. Interactive Objects & Dynamic Props
    for (const obj of floor.objects) {
      const isLooted =
        (obj.givesFragmentId && discoveredFragmentIds.includes(obj.givesFragmentId)) ||
        (obj.givesKeyId && collectedKeyIds.includes(obj.givesKeyId));
      const isNearby = nearbyObject?.id === obj.id;
      const isSolved = obj.linkedChallengeId ? roomStates[floor.id]?.isSolved : false;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(obj.x + 3, obj.y + 3, obj.width, obj.height);

      // Render based on object type
      if (obj.type === 'terminal' || obj.type === 'grand-terminal') {
        ctx.fillStyle = '#181B22';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = isSolved ? '#10B981' : obj.isBroken ? '#EF4444' : '#D0B477';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        const pulse = Math.sin(flameTimerRef.current * 2) * 0.15 + 0.85;
        const screenColor = isSolved
          ? `rgba(16, 185, 129, ${0.45 * pulse})`
          : obj.isBroken
          ? `rgba(239, 68, 68, ${0.5 * pulse})`
          : `rgba(0, 240, 255, ${0.4 * pulse})`;
        ctx.fillStyle = screenColor;
        ctx.fillRect(obj.x + 6, obj.y + 6, obj.width - 12, obj.height - 16);

        ctx.fillStyle = isSolved ? '#34D399' : obj.isBroken ? '#F87171' : '#00F0FF';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isSolved ? 'ONLINE' : obj.isBroken ? 'OFFLINE' : 'SYSTEM', obj.x + obj.width / 2, obj.y + 20);
      } else if (obj.type === 'npc-duck') {
        // Quacky the Rubber Duck
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(obj.x + obj.width / 2 + 10, obj.y + obj.height / 2 - 2, 6, 4);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2 + 5, obj.y + obj.height / 2 - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'npc-sysadmin') {
        // Viktor the SysAdmin
        ctx.fillStyle = '#06B6D4';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(obj.x + 4, obj.y + 6, obj.width - 8, 6); // sunglasses
      } else if (obj.type === 'npc-designer') {
        // Chloe the Designer
        ctx.fillStyle = '#EC4899';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#F472B6';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + 6, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'server-rack') {
        ctx.fillStyle = '#14171E';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = isSolved ? '#06B6D4' : '#DC2626';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        for (let sx = obj.x + 8; sx < obj.x + obj.width - 12; sx += 14) {
          ctx.fillStyle = '#1E232D';
          ctx.fillRect(sx, obj.y + 6, 10, obj.height - 12);
          const ledBlink = Math.sin(flameTimerRef.current * 3 + sx) > 0;
          ctx.fillStyle = isSolved
            ? ledBlink ? '#22D3EE' : '#0891B2'
            : ledBlink ? '#EF4444' : '#7F1D1D';
          ctx.fillRect(sx + 3, obj.y + 10, 4, 4);
        }
      } else if (obj.type === 'fountain') {
        ctx.fillStyle = '#082F49';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.stroke();

        const ripple = (flameTimerRef.current * 10) % 25;
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - ripple / 25)})`;
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, 10 + ripple, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obj.type === 'plate-dispenser') {
        ctx.fillStyle = '#2A2E37';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#D0B477';
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#FAFAFA';
        for (let py = obj.y + 10; py < obj.y + obj.height - 10; py += 8) {
          ctx.fillRect(obj.x + 8, py, obj.width - 16, 4);
        }
      } else if (obj.type === 'pantry-queue') {
        ctx.fillStyle = '#1E232B';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = '#70B8D6';
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#70B8D6';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIFO ➔', obj.x + obj.width / 2, obj.y + obj.height / 2 + 3);
      } else if (obj.type === 'bookshelf') {
        ctx.fillStyle = '#34251B';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = '#201610';
        ctx.fillRect(obj.x + 4, obj.y + 4, obj.width - 8, obj.height - 8);
        const bookColors = ['#991B1B', '#D0B477', '#2563EB', '#059669', '#7C3AED'];
        for (let bx = obj.x + 8; bx < obj.x + obj.width - 12; bx += 9) {
          ctx.fillStyle = bookColors[Math.floor((bx * 11) % bookColors.length)];
          ctx.fillRect(bx, obj.y + 6, 7, obj.height - 12);
        }
      } else if (obj.type === 'door') {
        ctx.fillStyle = isSolved ? '#064E3B' : '#7F1D1D';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = isSolved ? '#10B981' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.fillStyle = isSolved ? '#34D399' : '#FCA5A5';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isSolved ? 'OPEN' : 'LOCKED', obj.x + obj.width / 2, obj.y + 16);
      } else {
        ctx.fillStyle = obj.color || '#3F444E';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      }

      if (isSolved || isLooted) {
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', obj.x + obj.width / 2, obj.y - 6);
      }

      // Proximity selection ring & Interaction badge
      if (isNearby) {
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6);

        const promptText = `[E] ${obj.name}`;
        ctx.font = 'bold 10px sans-serif';
        const textWidth = ctx.measureText(promptText).width;
        const badgeX = obj.x + obj.width / 2 - textWidth / 2 - 8;
        const badgeY = obj.y - 24;

        ctx.fillStyle = 'rgba(15, 17, 23, 0.9)';
        ctx.fillRect(badgeX, badgeY, textWidth + 16, 18);
        ctx.strokeStyle = '#D0B477';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, textWidth + 16, 18);

        ctx.fillStyle = '#D0B477';
        ctx.textAlign = 'center';
        ctx.fillText(promptText, obj.x + obj.width / 2, badgeY + 13);
      }
    }

    // 6. Roaming Bug Critters
    for (const bug of bugsRef.current) {
      if (bug.isSquashed) continue;

      const bugColor =
        bug.type === 'syntax-bug'
          ? '#A855F7'
          : bug.type === 'memory-leak'
          ? '#EF4444'
          : '#00F0FF';

      // Bug body
      ctx.fillStyle = bugColor;
      ctx.beginPath();
      ctx.arc(bug.x, bug.y, bug.size, 0, Math.PI * 2);
      ctx.fill();

      // Twitching bug legs
      const legTwitch = Math.sin(flameTimerRef.current * 12) * 3;
      ctx.strokeStyle = bugColor;
      ctx.lineWidth = 1.5;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        const lx = bug.x + Math.cos(angle) * (bug.size + 4 + legTwitch);
        const ly = bug.y + Math.sin(angle) * (bug.size + 4 + legTwitch);
        ctx.beginPath();
        ctx.moveTo(bug.x, bug.y);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }

      // Antennae
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bug.x - 2, bug.y - bug.size);
      ctx.lineTo(bug.x - 6, bug.y - bug.size - 5);
      ctx.moveTo(bug.x + 2, bug.y - bug.size);
      ctx.lineTo(bug.x + 6, bug.y - bug.size - 5);
      ctx.stroke();
    }

    // 7. Floating Text Notifications
    for (const ft of floatingTextsRef.current) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 8. Confetti Particles
    for (const c of confettiRef.current) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    }

    // 9. Atmospheric Floating Motes
    ctx.fillStyle = 'rgba(208, 180, 119, 0.35)';
    for (const p of dustParticlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Draw Player Avatar
    ctx.save();
    ctx.translate(px, py);

    const bob = moving ? Math.sin(flameTimerRef.current * 3) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 10, PLAYER_RADIUS * 0.9, PLAYER_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Cloak
    ctx.fillStyle = '#1E232A';
    ctx.beginPath();
    ctx.arc(0, bob, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0B477';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head Visor / Directional Indicator
    ctx.fillStyle = '#D0B477';
    if (facing === 'down') {
      ctx.fillRect(-6, bob + 2, 12, 5);
    } else if (facing === 'up') {
      ctx.fillRect(-6, bob - 7, 12, 5);
    } else if (facing === 'left') {
      ctx.fillRect(-8, bob - 2, 5, 10);
    } else {
      ctx.fillRect(3, bob - 2, 5, 10);
    }

    ctx.restore();

    // 11. Screen-Space Overlays (Camera Independent)
    ctx.restore(); // Restore world camera translation

    // 11a. Fuse Box Countdown HUD
    if (fuseBoxState?.active) {
      const timeRemaining = Math.max(0, fuseBoxState.timeRemaining);
      const pct = (timeRemaining / (fuseBoxState.maxTime || 60)) * 100;

      const barW = Math.min(300, viewW - 40);
      const barH = 12;
      const barX = (viewW - barW) / 2;
      const barY = 16;

      ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
      ctx.fillRect(barX - 8, barY - 14, barW + 16, barH + 24);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 8, barY - 14, barW + 16, barH + 24);

      // Bar track
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(barX, barY + 2, barW, barH - 4);

      // Bar fill
      ctx.fillStyle = timeRemaining > 20 ? '#10B981' : timeRemaining > 10 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(barX, barY + 2, (barW * pct) / 100, barH - 4);

      ctx.fillStyle = timeRemaining <= 10 ? '#EF4444' : '#E0E7FF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `FUSE BOX: ${Math.ceil(timeRemaining)}s REMAINING`,
        viewW / 2,
        barY - 2
      );
    }

    // 11b. Emergency Blackout Red Strobe
    if (fuseBoxState?.isTripped) {
      const strobe = (Math.sin(flameTimerRef.current * 7) + 1) * 0.5;
      ctx.fillStyle = `rgba(185, 28, 28, ${0.45 + strobe * 0.25})`;
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ EMERGENCY BLACKOUT - CIRCUIT BREAKER TRIPPED ⚠', viewW / 2, viewH / 2);
    }
  };

  return (
    <div className="relative w-full h-[540px] sm:h-[600px] rounded-xl overflow-hidden border border-line bg-obsidian">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair select-none"
      />
    </div>
  );
}
