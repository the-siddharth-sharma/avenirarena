import { Compass, Flame, MousePointerClick, Move } from 'lucide-react';
import { Card } from './Card';
import { useInfiniteTrace } from '@/engine/useInfiniteTrace';
import { useStudentProfiles } from '@/students/StudentProfileContext';

/**
 * InfiniteTraceWidget — A compact dashboard telemetry widget showing live
 * session cursor travel, active motion streak, best streak, and scroll depth.
 * Clearly demarcated as session-only exploration (independent of academic XP).
 */
export function InfiniteTraceWidget() {
  const { selectedStudent } = useStudentProfiles();
  const { score, motionStreak, bestStreak, distancePx, scrollPx, scrollScore, isActive, isPointerMoving } =
    useInfiniteTrace(selectedStudent.id);

  // Convert pixels to approximate meters based on standard 96 DPI screen (~37.8 px/cm -> ~3780 px/m)
  const distanceFormatted =
    distancePx >= 3780
      ? `${(distancePx / 3780).toFixed(1)} m`
      : `${Math.round(distancePx / 38)} cm`;

  const scrollFormatted =
    scrollPx >= 3780
      ? `${(scrollPx / 3780).toFixed(1)} m`
      : `${Math.round(scrollPx / 38)} cm`;

  return (
    <Card className="p-4" hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-gold-400/20 bg-gold-400/10 text-gold-400">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="section-label text-gold-400">Infinite Trace</span>
            <span className="text-[10px] text-muted ml-2">Session Telemetry</span>
          </div>
        </div>

        {/* Live Activity & Streak status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isPointerMoving && motionStreak > 0 && (
            <span className="badge bg-gold-400/15 text-gold-400 text-[10px] flex items-center gap-1 font-mono">
              <Flame className="w-3 h-3 text-gold-400" />
              Streak Active
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-gold-400 shadow-[0_0_8px_var(--c-accent)] animate-pulse'
                  : 'bg-muted/40'
              }`}
            />
            <span className="text-[11px] font-mono text-muted">
              {isActive ? 'Tracking' : 'Idle'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Session Trace Score */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Session Score</p>
          <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-gold-400 tracking-tight">
            {score.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted mt-0.5">Points accumulated</p>
        </div>

        {/* Metric 2: Live Motion Streak */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-gold-400" /> Motion Streak
          </p>
          <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-ivory tracking-tight">
            {motionStreak > 0 ? (
              <span className="text-gold-400">+{motionStreak}</span>
            ) : (
              <span className="text-muted">0</span>
            )}
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            Best streak: <span className="font-mono text-ivory">{bestStreak}</span> pts
          </p>
        </div>

        {/* Metric 3: Distance Traced */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted flex items-center gap-1">
            <Move className="w-2.5 h-2.5 text-muted" /> Distance
          </p>
          <p className="mt-1 font-mono text-lg sm:text-xl font-medium text-ivory tracking-tight">
            {distanceFormatted}
          </p>
          <p className="text-[10px] text-muted mt-0.5">{Math.round(distancePx).toLocaleString()} px pointer</p>
        </div>

        {/* Metric 4: Scroll Contribution */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted flex items-center gap-1">
            <MousePointerClick className="w-2.5 h-2.5 text-muted" /> Scroll
          </p>
          <p className="mt-1 font-mono text-lg sm:text-xl font-medium text-ivory tracking-tight">
            +{scrollScore} <span className="text-xs font-normal text-muted">pts</span>
          </p>
          <p className="text-[10px] text-muted mt-0.5">{scrollFormatted} depth</p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
        <span>Session-based exploration</span>
        <span className="italic opacity-80">Separate from academic XP & leaderboard</span>
      </div>
    </Card>
  );
}
