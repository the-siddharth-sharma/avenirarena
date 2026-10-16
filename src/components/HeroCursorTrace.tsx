import { useEffect, useRef } from 'react';
import { useTheme } from '@/theme/ThemeContext';

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * HeroCursorTrace — A restrained, ambient cursor wake and geometric trace line
 * rendered on a canvas strictly inside the hero welcome banner.
 * - Champagne gold fine line trailing pointer movement.
 * - Soft ambient radial glow following current cursor position.
 * - Graceful fadeout over 900ms.
 * - Pauses RAF loop automatically when mouse leaves or document is hidden.
 * - Zero interference with clicks, text selection, or responsive layout.
 */
export function HeroCursorTrace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let points: TrailPoint[] = [];
    let rafId = 0;
    let isMouseOver = false;
    let currentX = -100;
    let currentY = -100;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);
    resize();

    const maxAge = 900; // ms trail lifetime

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, width, height);

      // Clean old points
      points = points.filter((p) => now - p.time < maxAge);

      const isDark = theme === 'dark';
      // Champagne gold rgb: dark mode #D0B477 (208, 180, 119), light mode #B39458 (179, 148, 88)
      const rgb = isDark ? '208, 180, 119' : '179, 148, 88';

      // 1. Draw subtle ambient radial glow if mouse is inside hero
      if (isMouseOver && currentX >= 0 && currentY >= 0) {
        const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 180);
        gradient.addColorStop(0, `rgba(${rgb}, ${isDark ? 0.08 : 0.06})`);
        gradient.addColorStop(0.5, `rgba(${rgb}, ${isDark ? 0.02 : 0.015})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw smooth fading trace line
      if (points.length >= 2) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const age = now - p2.time;
          const ratio = Math.max(0, 1 - age / maxAge);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineWidth = 1.6 * ratio + 0.4;
          ctx.strokeStyle = `rgba(${rgb}, ${ratio * (isDark ? 0.45 : 0.38)})`;
          ctx.stroke();
        }
      }

      // Loop continues if points remain or mouse is inside
      if (points.length > 0 || isMouseOver) {
        rafId = requestAnimationFrame(draw);
      } else {
        rafId = 0;
      }
    };

    const startLoop = () => {
      if (rafId === 0) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (document.hidden) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        isMouseOver = false;
        return;
      }

      isMouseOver = true;
      currentX = x;
      currentY = y;

      const now = performance.now();
      // Add point if distance is meaningful
      const last = points[points.length - 1];
      if (!last || Math.hypot(x - last.x, y - last.y) >= 4) {
        points.push({ x, y, time: now });
        if (points.length > 60) {
          points.shift();
        }
      }

      startLoop();
    };

    const handlePointerEnter = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      isMouseOver = true;
      startLoop();
    };

    const handlePointerLeave = () => {
      isMouseOver = false;
      currentX = -100;
      currentY = -100;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        points = [];
        isMouseOver = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="h-full w-full pointer-events-none" />
    </div>
  );
}
