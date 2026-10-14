import { Play } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { Game } from '@/types';
import { Card } from './Card';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const Icon = (Icons[game.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Gamepad2;

  const difficultyColor: Record<string, string> = {
    Beginner: 'bg-emerald-500/10 text-emerald-400',
    Intermediate: 'bg-gold-400/10 text-gold-300',
    Advanced: 'bg-amber-500/10 text-amber-400',
    Expert: 'bg-crimson-500/10 text-crimson-400',
  };

  return (
    <Card hover className="flex flex-col">
      <div className={`h-24 rounded bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 border border-line`}>
        <Icon className="w-10 h-10 text-muted" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="badge bg-elevated text-muted">{game.category}</span>
        <span className={`badge ${difficultyColor[game.difficulty]}`}>{game.difficulty}</span>
      </div>

      <h3 className="font-display font-medium text-ivory text-lg tracking-tight">{game.title}</h3>
      <p className="text-sm text-muted mt-1 flex-1">{game.description}</p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Icons.Users className="w-3.5 h-3.5" />
            {game.plays.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Icons.Star className="w-3.5 h-3.5 text-gold-400" />
            {game.rating}
          </span>
        </div>
        <button
          onClick={() => onPlay(game)}
          className="btn btn-primary text-xs px-3 py-1.5"
        >
          <Play className="w-3 h-3" />
          Play
        </button>
      </div>
    </Card>
  );
}
