import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-md bg-elevated border border-line mb-4 text-muted">
        {icon || <Info className="w-5 h-5" />}
      </div>
      <h3 className="font-display font-medium text-ivory">{title}</h3>
      <p className="text-sm text-muted mt-1 max-w-sm">{message}</p>
    </div>
  );
}
