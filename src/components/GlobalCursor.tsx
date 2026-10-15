import { useEffect, useRef, useState } from 'react';
import { traceEngine, type StreakBreakEvent } from '@/engine/infiniteTrace';
import { useStudentProfiles } from '@/students/StudentProfileContext';

interface FlyingStreakItem {
  id: number;
  el: HTMLDivElement;
  startX: number;
  startY: number;
  startTime: number;
  duration: number;
}

/**
 * GlobalCursor — Premium cursor trail with active Motion Streak and
 * futuristic HUD-style upward streak-break exit animations.
 *
 * - Live motion streak tracking pointer travel.
 * - Inactivity timeout (320ms) freezes score and launches an accelerating upward flight.
 * - Complete fade-out on text inputs and form fields.
 * - Guaranteed memory cleanup with DOM removal on flight completion.
 * - Bypasses decorative flight on prefers-reduced-motion and touch devices.
 */
export function GlobalCursor() {
  const [enabled, setEnabled] = useState(false);
  const { selectedStudent } = useStudentProfiles();

  const dotRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const scoreBadgeRef = useRef<HTMLDivElement>(null);
  const scoreTextRef = useRef<HTMLSpanElement>(null);
  const flyingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStudent?.id) {
      traceEngine.setActiveStudent(selectedStudent.id);
    }
  }, [selectedStudent?.id]);

  useEffect(() => {
    // Only enable on devices with a fine pointer (mouse/trackpad)
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer) return;

    setEnabled(true);

    const pos = {
      targetX: -100,
      targetY: -100,
      dotX: -100,
      dotY: -100,
      auraX: -100,
      auraY: -100,
      tailX: -100,
      tailY: -100,
      isHovering: false,
      isDown: false,
      isText: false,
      isVisible: false,
    };

    let rafId = 0;
    let initialized = false;
    let streakCounterId = 0;
    let flyingStreaks: FlyingStreakItem[] = [];

    const handlePointerMove = (e: PointerEvent) => {
      pos.targetX = e.clientX;
      pos.targetY = e.clientY;

      if (!initialized) {
        pos.dotX = pos.targetX;
        pos.dotY = pos.targetY;
        pos.auraX = pos.targetX;
        pos.auraY = pos.targetY;
        pos.tailX = pos.targetX;
        pos.tailY = pos.targetY;
        initialized = true;
      }

      pos.isVisible = true;

      // Detect interactive vs text target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest(
            'button, a, [role="button"], input[type="button"], input[type="submit"], select, .card-hover, .tab-button, .nav-item'
          )
        );
        const isTextField = Boolean(
          target.closest(
            'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
          )
        );

        pos.isHovering = isInteractive;
        pos.isText = isTextField;
      }
    };

    const handlePointerDown = () => {
      pos.isDown = true;
    };

    const handlePointerUp = () => {
      pos.isDown = false;
    };

    const handleMouseLeave = () => {
      pos.isVisible = false;
    };

    const handleMouseEnter = () => {
      pos.isVisible = true;
    };

    // Listen for streak break events from the trace engine
    const unsubscribeStreakBreak = traceEngine.onStreakBreak((event: StreakBreakEvent) => {
      // Guard: strictly ignore streak break events that do not match the current student
      if (event.studentId !== traceEngine.getActiveStudentId()) return;

      // If score is tiny or reduced motion is on, don't animate flight
      if (event.score <= 0 || prefersReducedMotion || !flyingContainerRef.current) return;

      const container = flyingContainerRef.current;
      const el = document.createElement('div');
      el.className =
        'pointer-events-none fixed font-mono select-none flex items-center gap-1.5 px-2 py-0.5 rounded border border-gold-400/40 bg-graphite/90 backdrop-blur-sm shadow-[0_0_14px_rgba(208,180,119,0.25)] z-[9998] will-change-transform';
      el.style.opacity = '1';

      // Edge safe starting X/Y
      let startX = event.x + 16;
      let startY = event.y + 12;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (startX > winW - 80) startX = event.x - 70;
      if (startY > winH - 40) startY = event.y - 28;

      el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
      el.innerHTML = `
        <span class="text-[8px] uppercase tracking-wider text-muted font-semibold">STREAK</span>
        <span class="text-[11px] font-bold text-gold-400">+${event.score.toLocaleString()}</span>
      `;

      container.appendChild(el);

      const streakItem: FlyingStreakItem = {
        id: ++streakCounterId,
        el,
        startX,
        startY,
        startTime: performance.now(),
        duration: 850, // ms upward flight duration
      };

      flyingStreaks.push(streakItem);

      // Failsafe cleanup in case frame loop skips
      setTimeout(() => {
        if (el.parentNode) {
          el.remove();
        }
      }, 1200);
    });

    // Listen for account switch events to instantly purge any in-flight streak animations
    const unsubscribeAccountSwitch = traceEngine.onAccountSwitch(() => {
      flyingStreaks.forEach((item) => {
        if (item.el.parentNode) {
          item.el.remove();
        }
      });
      flyingStreaks = [];

      if (scoreBadgeRef.current) {
        scoreBadgeRef.current.style.opacity = '0';
      }
      if (scoreTextRef.current) {
        scoreTextRef.current.textContent = '0';
      }
    });

    const loop = () => {
      const now = performance.now();

      // Lerp physics
      pos.dotX += (pos.targetX - pos.dotX) * 0.72;
      pos.dotY += (pos.targetY - pos.dotY) * 0.72;

      pos.auraX += (pos.targetX - pos.auraX) * 0.18;
      pos.auraY += (pos.targetY - pos.auraY) * 0.18;

      pos.tailX += (pos.targetX - pos.tailX) * 0.09;
      pos.tailY += (pos.targetY - pos.tailY) * 0.09;

      // Calculate state-based scale & opacity
      const opacity = !pos.isVisible || pos.isText ? 0 : 1;
      const dotScale = pos.isDown ? 0.75 : pos.isHovering ? 1.4 : 1;
      const auraScale = pos.isDown ? 0.85 : pos.isHovering ? 1.55 : 1;
      const tailScale = pos.isHovering ? 1.3 : 1;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.dotX}px, ${pos.dotY}px, 0) translate(-50%, -50%) scale(${dotScale})`;
        dotRef.current.style.opacity = `${opacity}`;
      }

      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${pos.auraX}px, ${pos.auraY}px, 0) translate(-50%, -50%) scale(${auraScale})`;
        auraRef.current.style.opacity = `${opacity * (pos.isHovering ? 0.9 : 0.65)}`;
      }

      if (tailRef.current) {
        tailRef.current.style.transform = `translate3d(${pos.tailX}px, ${pos.tailY}px, 0) translate(-50%, -50%) scale(${tailScale})`;
        tailRef.current.style.opacity = `${opacity * (pos.isHovering ? 0.45 : 0.3)}`;
      }

      // Read current active Motion Streak
      const traceState = traceEngine.getState();
      const currentStreak = traceState.motionStreak;

      // Active streak badge near cursor
      if (scoreBadgeRef.current && scoreTextRef.current) {
        scoreTextRef.current.textContent = currentStreak > 0 ? currentStreak.toLocaleString() : '0';

        let badgeX = pos.dotX + 16;
        let badgeY = pos.dotY + 12;

        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Viewport edge collision safety
        if (badgeX > winW - 75) {
          badgeX = pos.dotX - 60;
        }
        if (badgeY > winH - 35) {
          badgeY = pos.dotY - 26;
        }

        scoreBadgeRef.current.style.transform = `translate3d(${badgeX}px, ${badgeY}px, 0)`;

        // Show badge brightly while motion streak is active, fade when idle
        const isStreakActive = currentStreak > 0 && traceState.isPointerMoving;
        const badgeOpacity = isStreakActive ? opacity * (pos.isHovering ? 0.95 : 0.85) : 0;
        scoreBadgeRef.current.style.opacity = `${badgeOpacity}`;
      }

      // Animate active flying streaks upward toward the top of the viewport
      if (flyingStreaks.length > 0) {
        const remaining: FlyingStreakItem[] = [];

        for (const item of flyingStreaks) {
          const elapsed = now - item.startTime;
          const progress = Math.min(1, elapsed / item.duration);

          // Accelerating upward ease (quadratic acceleration)
          const ease = progress * progress;
          // Distance to fly: travels up past the top of the viewport
          const targetFlyDistance = item.startY + 60;
          const currentY = item.startY - ease * targetFlyDistance;

          // Fade out as it nears top edge (starts fading in second half)
          const flightOpacity = progress > 0.45 ? Math.max(0, 1 - (progress - 0.45) / 0.55) : 1;

          item.el.style.transform = `translate3d(${item.startX}px, ${currentY}px, 0) scale(${1 + progress * 0.12})`;
          item.el.style.opacity = `${flightOpacity}`;

          if (progress < 1 && currentY > -50) {
            remaining.push(item);
          } else {
            item.el.remove();
          }
        }

        flyingStreaks = remaining;
      }

      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      unsubscribeStreakBreak();
      unsubscribeAccountSwitch();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);

      // Clean up any remaining flying DOM elements
      flyingStreaks.forEach((item) => item.el.remove());
      flyingStreaks = [];
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Container for upward flying streak break HUD elements */}
      <div
        ref={flyingContainerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none"
      />

      {/* Main cursor graphics & active live streak indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none transition-opacity duration-300"
      >
        {/* Soft trailing micro-ghost (furthest delay) */}
        <div
          ref={tailRef}
          className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(circle, var(--c-accent) 0%, transparent 70%)',
            transition: 'opacity 0.25s ease',
            opacity: 0,
          }}
        />

        {/* Primary aura ring (smooth lag) */}
        <div
          ref={auraRef}
          className="pointer-events-none absolute left-0 top-0 h-8 w-8 rounded-full will-change-transform"
          style={{
            border: '1px solid color-mix(in srgb, var(--c-accent) 45%, transparent)',
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--c-accent) 14%, transparent) 0%, transparent 80%)',
            boxShadow: '0 0 16px color-mix(in srgb, var(--c-accent) 22%, transparent)',
            transition: 'border-color 0.2s ease, opacity 0.2s ease',
            opacity: 0,
          }}
        />

        {/* Precision leading dot (immediate follow) */}
        <div
          ref={dotRef}
          className="pointer-events-none absolute left-0 top-0 h-1.5 w-1.5 rounded-full will-change-transform"
          style={{
            backgroundColor: 'var(--c-accent)',
            boxShadow: '0 0 6px var(--c-accent)',
            transition: 'opacity 0.15s ease',
            opacity: 0,
          }}
        />

        {/* Live active motion streak tag beside pointer */}
        <div
          ref={scoreBadgeRef}
          className="pointer-events-none absolute left-0 top-0 will-change-transform flex items-center gap-1 px-1.5 py-0.5 rounded border border-line bg-graphite/85 backdrop-blur-sm shadow-sm transition-opacity duration-150"
          style={{ opacity: 0 }}
        >
          <span className="text-[7.5px] uppercase tracking-wider text-muted font-semibold">STREAK</span>
          <span className="font-mono text-[9px] font-bold text-gold-400 tracking-wider">
            <span ref={scoreTextRef}>0</span>
          </span>
        </div>
      </div>
    </>
  );
}
