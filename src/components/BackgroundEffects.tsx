import { useRef, useEffect, type ReactNode } from 'react';
import { useTheme } from '@/theme/ThemeContext';

interface BackgroundEffectsProps {
  children: ReactNode;
  showDashboardEffects?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function BackgroundEffects({ children, showDashboardEffects = false }: BackgroundEffectsProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Dark-mode particle field on a lightweight canvas
  useEffect(() => {
    if (theme !== 'dark' || !showDashboardEffects) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let running = true;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;

      const count = Math.min(40, Math.floor((rect.width * rect.height) / 25000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.1 - Math.random() * 0.25,
        size: 1 + Math.random() * 2,
        opacity: 0.04 + Math.random() * 0.08,
        color: Math.random() > 0.5 ? '208, 180, 119' : '196, 197, 193',
      }));
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    // Pause when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else {
        running = true;
        draw();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [theme, showDashboardEffects]);

  return (
    <div className="relative">
      {/* Decorative layers — behind content, non-interactive */}
      {showDashboardEffects && <div className="grid-overlay" />}
      {showDashboardEffects && <div className="scan-beam" />}
      {showDashboardEffects && theme === 'dark' && (
        <canvas ref={canvasRef} className="dark-particles" />
      )}

      {/* Light-mode telemetry crosshairs */}
      {showDashboardEffects && theme === 'light' && (
        <>
          {/* Top-right crosshair */}
          <svg
            className="absolute top-4 right-4 opacity-[0.07] pointer-events-none z-0 animate-crosshair-rotate"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            stroke="#B39458"
            strokeWidth="1"
          >
            <circle cx="20" cy="20" r="14" />
            <line x1="20" y1="2" x2="20" y2="10" />
            <line x1="20" y1="30" x2="20" y2="38" />
            <line x1="2" y1="20" x2="10" y2="20" />
            <line x1="30" y1="20" x2="38" y2="20" />
          </svg>
          {/* Bottom-left status pulse */}
          <div
            className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-[#B39458] opacity-30 pointer-events-none z-0 animate-status-pulse"
          />
        </>
      )}

      {/* Content above decorations */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
