import { demoStudentProfiles } from '@/data/studentProfiles';

/**
 * Infinite Trace Engine
 *
 * Dedicated pointer and scroll telemetry score with a continuous Motion Streak mechanic.
 * - Stored separately for each unique student ID (zero score or telemetry leakage across accounts).
 * - Completely decoupled from academic XP, badges, quests, and leaderboards.
 * - Active motion streak tracks unbroken pointer travel.
 * - Inactivity timeout (320ms) identifies genuine pauses.
 * - Streak breaks launch an HUD-style upward floating exit animation.
 * - Session total and scroll contribution remain completely independent.
 * - Filters sensor jitter (<3px threshold).
 */

export interface StudentTraceRecord {
  score: number;
  bestStreak: number;
  distancePx: number;
  scrollPx: number;
  traceScore: number;
  scrollScore: number;
}

export interface TraceState {
  score: number; // Total session score (pointer + scroll)
  motionStreak: number; // Active continuous pointer motion streak
  bestStreak: number; // Highest streak recorded
  distancePx: number; // Total pointer travel in pixels
  scrollPx: number; // Total scroll travel in pixels
  traceScore: number; // Total pointer points
  scrollScore: number; // Total scroll points
  isPointerMoving: boolean; // True while pointer is actively moving
  isActive: boolean; // True if recently active
  studentId: string; // The associated student ID
}

export interface StreakBreakEvent {
  studentId: string;
  score: number;
  x: number;
  y: number;
}

const STORAGE_KEY = 'avenir-infinite-trace-students-v1';
const MOVE_THRESHOLD = 3; // pixels
const PIXELS_PER_POINT = 16; // 16px of mouse travel = 1 point
const SCROLL_THRESHOLD = 4; // pixels
const SCROLL_PER_POINT = 22; // 22px of scroll travel = 1 point
const STREAK_INACTIVITY_TIMEOUT_MS = 320; // 320ms pause breaks the streak

export class TraceEngine {
  private activeStudentId: string = '';
  private studentRecords: Record<string, StudentTraceRecord> = {};

  private state: TraceState = {
    score: 0,
    motionStreak: 0,
    bestStreak: 0,
    distancePx: 0,
    scrollPx: 0,
    traceScore: 0,
    scrollScore: 0,
    isPointerMoving: false,
    isActive: false,
    studentId: '',
  };

  private lastPointerX = -1;
  private lastPointerY = -1;
  private lastScrollY = -1;
  private lastActiveTimestamp = 0;
  private accumulatedMoveDistance = 0;
  private accumulatedScrollDistance = 0;

  private streakTimer: ReturnType<typeof setTimeout> | null = null;
  private notifyTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeResetTimeout: ReturnType<typeof setTimeout> | null = null;

  private listeners = new Set<(state: TraceState) => void>();
  private streakBreakListeners = new Set<(event: StreakBreakEvent) => void>();
  private accountSwitchListeners = new Set<(newStudentId: string, prevStudentId: string) => void>();
  private isInitialized = false;

  constructor() {
    this.studentRecords = this.loadAllRecords();
    const initialStudentId = this.resolveInitialStudentId();
    if (initialStudentId) {
      this.setActiveStudent(initialStudentId);
    }
  }

  private resolveInitialStudentId(): string {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('avenir-selected-student');
        if (stored && typeof stored === 'string') return stored;
      } catch {
        // Fallback
      }
    }
    return demoStudentProfiles[0]?.id || '';
  }

  private loadAllRecords(): Record<string, StudentTraceRecord> {
    if (typeof window === 'undefined') return {};
    try {
      // Clear legacy unscoped session item if present
      sessionStorage.removeItem('avenir-infinite-trace-session');

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, StudentTraceRecord>;
        }
      }
    } catch {
      // Fallback to empty records
    }
    return {};
  }

  private persistAllRecords() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.studentRecords));
    } catch {
      // Ignore storage quota/access errors
    }
  }

  private saveCurrentStudentToRecords() {
    if (!this.activeStudentId) return;
    this.studentRecords[this.activeStudentId] = {
      score: this.state.score,
      bestStreak: this.state.bestStreak,
      distancePx: this.state.distancePx,
      scrollPx: this.state.scrollPx,
      traceScore: this.state.traceScore,
      scrollScore: this.state.scrollScore,
    };
  }

  /**
   * Switch the active student context.
   * Completely resets transient motion streaks, timers, and in-flight animations
   * while seamlessly persisting the prior student and loading the new student.
   */
  public setActiveStudent(studentId: string) {
    if (!studentId) return;
    if (studentId === this.activeStudentId) return;

    // 1. Persist the currently active student's metrics
    if (this.activeStudentId) {
      this.saveCurrentStudentToRecords();
      this.persistAllRecords();
    }

    // 2. Clear all active timers to prevent delayed callbacks writing to the wrong student
    if (this.streakTimer) {
      clearTimeout(this.streakTimer);
      this.streakTimer = null;
    }
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
      this.notifyTimeout = null;
    }
    if (this.activeResetTimeout) {
      clearTimeout(this.activeResetTimeout);
      this.activeResetTimeout = null;
    }

    // 3. Reset transient tracking state
    this.accumulatedMoveDistance = 0;
    this.accumulatedScrollDistance = 0;
    this.lastPointerX = -1;
    this.lastPointerY = -1;
    this.lastScrollY = -1;
    this.lastActiveTimestamp = 0;

    const previousStudentId = this.activeStudentId;
    this.activeStudentId = studentId;

    // 4. Load the target student's saved data or initialize a clean zero record
    const saved = this.studentRecords[studentId];
    if (saved) {
      this.state = {
        score: Math.max(0, Math.floor(saved.score || 0)),
        motionStreak: 0,
        bestStreak: Math.max(0, Math.floor(saved.bestStreak || 0)),
        distancePx: Math.max(0, Math.floor(saved.distancePx || 0)),
        scrollPx: Math.max(0, Math.floor(saved.scrollPx || 0)),
        traceScore: Math.max(0, Math.floor(saved.traceScore || 0)),
        scrollScore: Math.max(0, Math.floor(saved.scrollScore || 0)),
        isPointerMoving: false,
        isActive: false,
        studentId,
      };
    } else {
      this.state = {
        score: 0,
        motionStreak: 0,
        bestStreak: 0,
        distancePx: 0,
        scrollPx: 0,
        traceScore: 0,
        scrollScore: 0,
        isPointerMoving: false,
        isActive: false,
        studentId,
      };
      this.studentRecords[studentId] = {
        score: 0,
        bestStreak: 0,
        distancePx: 0,
        scrollPx: 0,
        traceScore: 0,
        scrollScore: 0,
      };
      this.persistAllRecords();
    }

    // 5. Notify all telemetry listeners immediately
    this.notifyListeners();

    // 6. Notify account switch listeners (to clean up flying streak HUD elements, etc.)
    this.accountSwitchListeners.forEach((fn) => {
      try {
        fn(studentId, previousStudentId);
      } catch (err) {
        console.error('Error in account switch listener:', err);
      }
    });
  }

  public getActiveStudentId(): string {
    return this.activeStudentId;
  }

  public getStudentRecord(studentId: string): StudentTraceRecord | null {
    if (studentId === this.activeStudentId) {
      return {
        score: this.state.score,
        bestStreak: this.state.bestStreak,
        distancePx: this.state.distancePx,
        scrollPx: this.state.scrollPx,
        traceScore: this.state.traceScore,
        scrollScore: this.state.scrollScore,
      };
    }
    return this.studentRecords[studentId] ? { ...this.studentRecords[studentId] } : null;
  }

  public getAllStudentRecords(): Record<string, StudentTraceRecord> {
    this.saveCurrentStudentToRecords();
    return JSON.parse(JSON.stringify(this.studentRecords));
  }

  /**
   * Directly sets the current active student's score.
   * Useful for deterministic testing and administrative resets.
   */
  public setScore(score: number) {
    if (!this.activeStudentId) return;
    const cleanScore = Math.max(0, Math.floor(score));
    this.state.score = cleanScore;
    this.state.traceScore = cleanScore;
    this.saveCurrentStudentToRecords();
    this.persistAllRecords();
    this.notifyListeners();
  }

  /**
   * Adds points to the active student's score.
   */
  public addTracePoints(points: number) {
    if (!this.activeStudentId || points <= 0) return;
    const cleanPoints = Math.max(0, Math.floor(points));
    this.state.score += cleanPoints;
    this.state.traceScore += cleanPoints;
    this.saveCurrentStudentToRecords();
    this.persistAllRecords();
    this.notifyListeners();
  }

  /**
   * Resets transient motion streak, position caches, and timers without altering persisted scores.
   */
  public clearTransientState() {
    if (this.streakTimer) {
      clearTimeout(this.streakTimer);
      this.streakTimer = null;
    }
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
      this.notifyTimeout = null;
    }
    if (this.activeResetTimeout) {
      clearTimeout(this.activeResetTimeout);
      this.activeResetTimeout = null;
    }

    this.accumulatedMoveDistance = 0;
    this.accumulatedScrollDistance = 0;
    this.lastPointerX = -1;
    this.lastPointerY = -1;
    this.lastScrollY = -1;
    this.state.motionStreak = 0;
    this.state.isPointerMoving = false;
    this.state.isActive = false;
    this.notifyListeners();
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    const onPointerMove = (e: PointerEvent) => {
      if (document.hidden) return;

      // Strictly scope streak tracking to Left Section Bar (Sidebar) AND Dashboard section
      const target = e.target as HTMLElement | null;
      const hashPath =
        typeof window !== 'undefined'
          ? window.location.hash.replace(/^#/, '') || '/dashboard'
          : '/dashboard';
      const isDashboard = hashPath === '/dashboard' || hashPath === '/';
      const isInsideSidebar = Boolean(target?.closest('aside, [data-sidebar="true"]'));
      const isRegistrationTerminal = Boolean(
        target?.closest('[data-registration-terminal="true"]') ||
        (typeof document !== 'undefined' && document.querySelector('[data-registration-terminal="true"]'))
      );

      // MUST NOT track streaks on the Student Registration Terminal, nor on internal pages outside sidebar
      if (isRegistrationTerminal || (!isDashboard && !isInsideSidebar)) {
        if (this.state.motionStreak > 0 || this.state.isPointerMoving) {
          this.breakCurrentStreak();
        }
        this.lastPointerX = -1;
        this.lastPointerY = -1;
        return;
      }

      if (this.lastPointerX < 0 || this.lastPointerY < 0) {
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        return;
      }

      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Filter warps (e.g. alt-tab jumps across screen)
      if (dist > 800) {
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        return;
      }

      // Filter micro sensor noise (< MOVE_THRESHOLD)
      if (dist < MOVE_THRESHOLD) return;

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.recordPointerMovement(dist, e.clientX, e.clientY);
    };

    const onScroll = () => {
      if (document.hidden) return;

      const hashPath =
        typeof window !== 'undefined'
          ? window.location.hash.replace(/^#/, '') || '/dashboard'
          : '/dashboard';
      const isDashboard = hashPath === '/dashboard' || hashPath === '/';
      const isRegistrationTerminal = Boolean(
        typeof document !== 'undefined' && document.querySelector('[data-registration-terminal="true"]')
      );
      if (isRegistrationTerminal || !isDashboard) return;

      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      if (this.lastScrollY < 0) {
        this.lastScrollY = currentScrollY;
        return;
      }

      const delta = Math.abs(currentScrollY - this.lastScrollY);

      if (delta > 1200) {
        this.lastScrollY = currentScrollY;
        return;
      }

      if (delta < SCROLL_THRESHOLD) return;

      this.lastScrollY = currentScrollY;
      // Scrolling accumulates session total, but strictly does NOT keep pointer streak alive
      this.recordScroll(delta);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.breakCurrentStreak();
        this.lastPointerX = -1;
        this.lastPointerY = -1;
        this.lastScrollY = -1;
        this.setActive(false);
      }
    };

    const onBeforeUnload = () => {
      this.saveCurrentStudentToRecords();
      this.persistAllRecords();
    };

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.studentRecords = JSON.parse(e.newValue);
          const activeRecord = this.studentRecords[this.activeStudentId];
          if (activeRecord) {
            this.state.score = Math.max(0, Math.floor(activeRecord.score || 0));
            this.state.bestStreak = Math.max(0, Math.floor(activeRecord.bestStreak || 0));
            this.state.distancePx = Math.max(0, Math.floor(activeRecord.distancePx || 0));
            this.state.scrollPx = Math.max(0, Math.floor(activeRecord.scrollPx || 0));
            this.state.traceScore = Math.max(0, Math.floor(activeRecord.traceScore || 0));
            this.state.scrollScore = Math.max(0, Math.floor(activeRecord.scrollScore || 0));
            this.notifyListeners();
          }
        } catch {
          // Ignore parse errors from concurrent writes
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('storage', onStorageChange);
  }

  private recordPointerMovement(dist: number, clientX: number, clientY: number) {
    if (!this.activeStudentId) return;
    const currentStudent = this.activeStudentId;

    this.state.distancePx += dist;
    this.accumulatedMoveDistance += dist;

    if (this.accumulatedMoveDistance >= PIXELS_PER_POINT) {
      const addedPoints = Math.floor(this.accumulatedMoveDistance / PIXELS_PER_POINT);
      this.accumulatedMoveDistance %= PIXELS_PER_POINT;

      this.state.traceScore += addedPoints;
      this.state.score += addedPoints;
      this.state.motionStreak += addedPoints;

      if (this.state.motionStreak > this.state.bestStreak) {
        this.state.bestStreak = this.state.motionStreak;
      }
    }

    this.state.isPointerMoving = true;
    this.markActive();

    // Reset inactivity timer for continuous motion streak
    if (this.streakTimer) {
      clearTimeout(this.streakTimer);
    }

    this.streakTimer = setTimeout(() => {
      // Guard: only execute if the active student is still the one who initiated it
      if (this.activeStudentId !== currentStudent) return;
      this.breakCurrentStreak(clientX, clientY);
    }, STREAK_INACTIVITY_TIMEOUT_MS);

    this.scheduleNotify();
  }

  private breakCurrentStreak(breakX?: number, breakY?: number) {
    if (this.streakTimer) {
      clearTimeout(this.streakTimer);
      this.streakTimer = null;
    }

    const finalStreak = this.state.motionStreak;
    this.state.isPointerMoving = false;

    if (finalStreak > 0) {
      const studentId = this.activeStudentId;
      const x = typeof breakX === 'number' ? breakX : this.lastPointerX;
      const y = typeof breakY === 'number' ? breakY : this.lastPointerY;

      this.streakBreakListeners.forEach((fn) =>
        fn({
          studentId,
          score: finalStreak,
          x: x >= 0 ? x : (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
          y: y >= 0 ? y : (typeof window !== 'undefined' ? window.innerHeight / 2 : 0),
        })
      );

      this.state.motionStreak = 0;
      this.scheduleNotify();
    }
  }

  private recordScroll(delta: number) {
    if (!this.activeStudentId) return;

    this.state.scrollPx += delta;
    this.accumulatedScrollDistance += delta;

    if (this.accumulatedScrollDistance >= SCROLL_PER_POINT) {
      const addedPoints = Math.floor(this.accumulatedScrollDistance / SCROLL_PER_POINT);
      this.accumulatedScrollDistance %= SCROLL_PER_POINT;
      this.state.scrollScore += addedPoints;
      this.state.score += addedPoints;
    }

    this.markActive();
    this.scheduleNotify();
  }

  private markActive() {
    const currentStudent = this.activeStudentId;
    this.lastActiveTimestamp = Date.now();
    if (!this.state.isActive) {
      this.state.isActive = true;
    }

    if (this.activeResetTimeout) {
      clearTimeout(this.activeResetTimeout);
    }

    this.activeResetTimeout = setTimeout(() => {
      if (this.activeStudentId !== currentStudent) return;
      if (Date.now() - this.lastActiveTimestamp >= 800) {
        this.setActive(false);
      }
    }, 900);
  }

  private setActive(active: boolean) {
    if (this.state.isActive !== active) {
      this.state.isActive = active;
      this.scheduleNotify();
    }
  }

  private scheduleNotify() {
    if (this.notifyTimeout) return;
    const targetStudentId = this.activeStudentId;

    this.notifyTimeout = setTimeout(() => {
      this.notifyTimeout = null;
      if (this.activeStudentId !== targetStudentId) return;

      this.saveCurrentStudentToRecords();
      this.persistAllRecords();
      this.notifyListeners();
    }, 100); // 10 FPS React notification throttle
  }

  private notifyListeners() {
    const snapshot = { ...this.state };
    this.listeners.forEach((listener) => listener(snapshot));
  }

  public getState(): TraceState {
    return { ...this.state };
  }

  public subscribe(listener: (state: TraceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStreakBreak(listener: (event: StreakBreakEvent) => void): () => void {
    this.streakBreakListeners.add(listener);
    return () => {
      this.streakBreakListeners.delete(listener);
    };
  }

  public onAccountSwitch(listener: (newStudentId: string, prevStudentId: string) => void): () => void {
    this.accountSwitchListeners.add(listener);
    return () => {
      this.accountSwitchListeners.delete(listener);
    };
  }
}

export const traceEngine = new TraceEngine();
if (typeof window !== 'undefined') {
  traceEngine.init();
  (window as unknown as { traceEngine?: TraceEngine }).traceEngine = traceEngine;
}
