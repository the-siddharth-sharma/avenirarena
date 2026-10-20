import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/theme/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-graphite border border-line text-muted hover:text-ivory hover:border-line-light transition-all shrink-0"
      title={isDark ? 'Switch to Mech Lab (Light)' : 'Switch to Cyberpunk HUD (Dark)'}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
