interface XPProgressBarProps {
  current: number;
  max: number;
  showLabels?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export function XPProgressBar({
  current,
  max,
  showLabels = true,
  height = 'md',
}: XPProgressBarProps) {
  const pct = Math.min(100, (current / max) * 100);
  const h = height === 'sm' ? 'h-1' : height === 'lg' ? 'h-2.5' : 'h-1.5';

  return (
    <div className="w-full">
      <div className={`w-full rounded-sm overflow-hidden ${h}`} style={{ backgroundColor: 'var(--c-progress-track)' }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: 'var(--c-progress-fill)' }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1.5 text-xs text-muted">
          <span className="font-mono">{current.toLocaleString()} XP</span>
          <span className="font-mono">{max.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}
