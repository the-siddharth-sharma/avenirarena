interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max,
  color,
  height = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const h = height === 'sm' ? 'h-1' : height === 'lg' ? 'h-2' : 'h-1.5';
  const fillColor = color || 'var(--c-progress-fill)';

  return (
    <div className={`w-full rounded-sm overflow-hidden ${h}`} style={{ backgroundColor: 'var(--c-progress-track)' }}>
      <div
        className="h-full rounded-sm transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: fillColor }}
      />
    </div>
  );
}
