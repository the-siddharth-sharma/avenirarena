# AVENIR ARENA — Game Developer Architecture Guidelines

> **Status:** Mandatory Architectural Standard  
> **Applies to:** All present and future games (*Code Runner 3D*, *The Code House*, *Bug Hunter*, *Logic Grid*, *Cudo*, *Tech Match*, etc.)  
> **Package:** `@/components/game-core`

---

## 1. Architectural Vision & Core Standard

In **AVENIR ARENA**, player identity is an unbroken, cross-game continuity layer. Every cadet, engineer, and player navigates learning games using their personalized human-like avatar, callsign, and campus credentials.

To maintain 60 FPS performance, prevent garbage-collection stutter, and avoid fragmented identity logic:

1. **NO DIRECT AUTH PARSING IN GAMES**: Mini-games MUST NOT manually query `AuthContext`, hardcode avatar images, or implement one-off fallback circles.
2. **CENTRALIZED IDENTITY SYSTEM**: All games must consume `@/components/game-core` (`usePlayerIdentity`, `GamePlayerAvatar`, `drawPlayerAvatarToCanvas`).
3. **ZERO-ALLOCATION 60 FPS CANVAS RENDERING**: Game loops rendering to HTML5 Canvas must use `drawPlayerAvatarToCanvas` and maintain an identity reference to prevent GC thrashing and React re-render cascades.

---

## 2. Shared Game-Core Architecture

The `@/components/game-core` directory contains the complete identity toolkit:

```
src/components/game-core/
├── types.ts              # PlayerIdentity & CanvasAvatarRenderOptions interfaces
├── GamePlayerAvatar.tsx  # Universal HTML/DOM component + drawPlayerAvatarToCanvas()
├── usePlayerIdentity.ts  # Custom hook with preloading & global image caching
└── index.ts              # Barrel export
```

### Key Exports:

| Export | Type | Description |
| :--- | :--- | :--- |
| `usePlayerIdentity()` | React Hook | Connects to platform auth, resolves username/avatar, preloads `HTMLImageElement` with global cache. |
| `drawPlayerAvatarToCanvas()` | Function | Pure, zero-allocation 2D canvas drawing utility for 60 FPS `requestAnimationFrame` loops. |
| `<GamePlayerAvatar />` | React Component | Universal DOM element for HUDs, leaderboards, HTML overlays, and grid games. |

---

## 3. Implementation Patterns

### Pattern A: 2D/3D Canvas Games (60 FPS Loops)
*Example: Code Runner 3D, The Code House, Arcade Shooters*

Canvas loops execute 60 times per second via `requestAnimationFrame`. React hooks cannot be called inside the loop, and passing state directly into animation frames causes stale closure bugs.

**Rule**: Initialize `usePlayerIdentity()` in the component root, mirror it to a `useRef`, and invoke `drawPlayerAvatarToCanvas()` directly inside the frame loop.

```tsx
import { useEffect, useRef } from 'react';
import { usePlayerIdentity, drawPlayerAvatarToCanvas } from '@/components/game-core';

export function ArcadeMiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 1. Hook resolves player identity and preloads avatar image
  const playerIdentity = usePlayerIdentity();

  // 2. Mirror identity to ref to avoid stale closures in requestAnimationFrame
  const playerIdentityRef = useRef(playerIdentity);
  playerIdentityRef.current = playerIdentity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Draw Game Entities ---
      const playerX = 150;
      const playerY = 200;

      // 3. Render Player Avatar via Central Canvas Utility
      drawPlayerAvatarToCanvas(ctx, playerIdentityRef.current, {
        x: playerX,
        y: playerY,
        radius: 16,
        ringColor: '#D0B477',           // Champagne gold ring
        ringWidth: 2,
        shadowColor: '#D0B477',
        shadowBlur: 8,
        showDirectionPip: true,         // Directional visor
        facing: 'right',
        pipColor: '#00F0FF',
        showCallsignTag: true,          // Floating username badge
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

---

### Pattern B: DOM / Grid / HTML Overlay Games
*Example: Syntax Mansion, Grid Puzzle, Card Matching, Turn-Based RPGs*

For games rendered via DOM elements, CSS Grid, or HTML overlays, use `<GamePlayerAvatar />`:

```tsx
import { usePlayerIdentity, GamePlayerAvatar } from '@/components/game-core';

export function GridPuzzleGame() {
  const identity = usePlayerIdentity();

  return (
    <div className="grid grid-cols-8 gap-2 bg-slate-900 p-4">
      {/* HUD Header */}
      <div className="flex items-center gap-3 mb-4">
        <GamePlayerAvatar identity={identity} size="md" showRing={true} />
        <div>
          <h3 className="font-mono text-sm font-bold text-ivory">{identity.username}</h3>
          <p className="font-mono text-xs text-gold-400">{identity.campus}</p>
        </div>
      </div>

      {/* In-Game Grid Player Marker */}
      <div className="relative">
        <GamePlayerAvatar
          identity={identity}
          size="sm"
          showRing={true}
          showDirectionPip={true}
          facing="down"
        />
      </div>
    </div>
  );
}
```

---

### Pattern C: Three.js / WebGL Games
*Example: 3D Flight Simulator, 3D Arena*

For WebGL textures, project the canvas output from `drawPlayerAvatarToCanvas` onto an offscreen canvas texture, or position `<GamePlayerAvatar />` as a screen-space projected HTML overlay:

```tsx
import { usePlayerIdentity, GamePlayerAvatar } from '@/components/game-core';

export function ThreeDGameHUD({ screenPosition }: { screenPosition: { x: number; y: number } }) {
  const identity = usePlayerIdentity();

  return (
    <GamePlayerAvatar
      identity={identity}
      size="sm"
      showRing={true}
      showCallsign={true}
      style={{
        position: 'absolute',
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
```

---

## 4. Canvas Render Options Reference

The `CanvasAvatarRenderOptions` interface supports the following parameters in `drawPlayerAvatarToCanvas(ctx, identity, options)`:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `x` | `number` | *Required* | Center X coordinate on the canvas. |
| `y` | `number` | *Required* | Center Y coordinate on the canvas. |
| `radius` | `number` | `14` | Radius of the circular avatar sprite in pixels. |
| `bob` | `number` | `0` | Vertical bobbing displacement (useful for walking/hovering). |
| `ringColor` | `string` | `'#D0B477'` | Border color of the outer glowing halo. |
| `ringWidth` | `number` | `2` | Outer halo border thickness. |
| `shadowColor` | `string` | `'#D0B477'` | Glow color. |
| `shadowBlur` | `number` | `10` | Glow blur radius (`0` disables glow for performance). |
| `tetherStartY` | `number` | `undefined` | Starting Y position for a vehicle tether cable. |
| `tetherColor` | `string` | `'rgba(208, 180, 119, 0.55)'` | Vehicle tether line stroke color. |
| `showDirectionPip` | `boolean` | `false` | Renders a glowing directional visor pip on the rim. |
| `facing` | `'up' \| 'down' \| 'left' \| 'right'` | `'down'` | Controls the direction of the visor pip. |
| `pipColor` | `string` | `'#00F0FF'` | Visor pip color (cyan by default). |
| `showCallsignTag` | `boolean` | `false` | Renders the player's username badge above the avatar. |

---

## 5. Built-in Fallbacks & Edge Cases

The game core identity system guarantees 100% crash resistance:
1. **Offline / Image Load Failure**: If an avatar image fails to load or the player has no photo, `drawPlayerAvatarToCanvas` and `<GamePlayerAvatar>` automatically render a stylized metallic circle with the user's initials.
2. **Anonymous / Unauthenticated**: If `currentUser` is null, identity defaults to `'Operative'` with an initial badge `'O'`.
3. **Cross-Origin Images**: All images loaded through `usePlayerIdentity` set `img.crossOrigin = 'anonymous'` to avoid tainting HTML5 canvases when exporting or manipulating pixels.

---

## 6. Developer Checklist Before Releasing Any New Mini-Game

- [ ] Game imports from `@/components/game-core` (never imports `AuthContext` solely for avatar/username).
- [ ] 60 FPS canvas loop uses `drawPlayerAvatarToCanvas` (no new `Image()` allocations inside animation loop).
- [ ] Stored identity reference in a `useRef` to prevent closure capture lag.
- [ ] Tested with both custom Google photo and futuristic preset avatars.
- [ ] Tested fallback when avatar image URL is unavailable or network is disconnected.
