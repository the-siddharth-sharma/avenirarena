import type { ReactNode } from 'react';
import { Wrench } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  message: string;
  icon?: ReactNode;
}

export function Placeholder({ title, message, icon }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="p-4 rounded-md bg-gold-400/5 border border-gold-400/20 mb-5 text-gold-400">
        {icon || <Wrench className="w-7 h-7" />}
      </div>
      <h2 className="font-display font-medium text-xl text-ivory tracking-tight">{title}</h2>
      <p className="text-sm text-muted mt-2 max-w-md">{message}</p>
      <span className="badge bg-elevated text-muted mt-4">Coming in a future phase</span>
    </div>
  );
}
