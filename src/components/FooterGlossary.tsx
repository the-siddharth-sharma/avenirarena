import { BookOpen, Flame, Zap, Gamepad2, Terminal, Info } from 'lucide-react';

export function FooterGlossary() {
  const terms = [
    {
      term: 'Infinite Trace',
      badge: 'Streak Engine',
      icon: Flame,
      color: 'text-orange-400',
      borderColor: 'border-orange-500/20',
      bgGlow: 'bg-orange-500/5',
      definition:
        'A kinetic pointer tracking system that measures engineering flow and sustained study momentum without breaking focus.',
    },
    {
      term: 'Academic XP',
      badge: 'Progression Metric',
      icon: Zap,
      color: 'text-gold-400',
      borderColor: 'border-gold-400/20',
      bgGlow: 'bg-gold-400/5',
      definition:
        'Standardized experience points awarded for assembling valid C++ logic, clearing curriculum gates, and completing B.Tech modules.',
    },
    {
      term: 'Code Runner 3D',
      badge: 'Speed Arcade',
      icon: Gamepad2,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/20',
      bgGlow: 'bg-sky-500/5',
      definition:
        'A 3-lane cyber syntax flight game challenging students to identify correct code tokens under accelerating time pressure.',
    },
    {
      term: 'The Code House',
      badge: 'Exploration Puzzle',
      icon: Terminal,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bgGlow: 'bg-emerald-500/5',
      definition:
        'A 2D top-down mystery mansion where cadets explore dark corridors with lanterns, hunt hidden C++ snippets, and assemble line-by-line solutions.',
    },
  ];

  return (
    <footer className="mt-16 pt-8 border-t border-line/60">
      <div className="flex items-center gap-2 mb-4 text-xs font-mono text-gold-400 uppercase tracking-widest font-semibold">
        <BookOpen className="w-3.5 h-3.5" />
        <span>ARENA TERMINOLOGY & CODEX</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {terms.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.term}
              className={`p-3.5 rounded-xl border ${item.borderColor} ${item.bgGlow} bg-obsidian/40 backdrop-blur-sm transition-all hover:border-gold-400/40`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-display font-semibold text-xs text-ivory">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.term}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-elevated border border-line text-muted">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed font-sans">
                {item.definition}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-line/30 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2">
        <span>AVENIR ARENA v2.4 · Engineering Learning Portal</span>
        <div className="flex items-center gap-3">
          <span>Mirai School of Technology</span>
          <span>·</span>
          <span>Quasar Engineering Labs</span>
        </div>
      </div>
    </footer>
  );
}
