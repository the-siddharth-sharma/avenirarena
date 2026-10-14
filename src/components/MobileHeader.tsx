import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <button
      onClick={onMenuClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-md bg-graphite border border-line text-muted hover:text-ivory hover:border-line-light transition-all"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
