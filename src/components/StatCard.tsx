import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accentColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  accentColor = 'text-gold-400',
}: StatCardProps) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-mono font-medium text-ivory mt-1.5 tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
        </div>
        <div className={`p-2 rounded-md bg-elevated ${accentColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
