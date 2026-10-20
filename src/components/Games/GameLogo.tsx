import React from 'react';
import {
  Code2,
  Binary,
  Cpu,
  Server,
  GitBranch,
  Sparkles,
  Database,
  GraduationCap,
  Dices,
  DoorOpen,
  Flame,
  Shield,
  Terminal,
  Brain,
  Network,
  GitMerge,
  Layers,
  Activity,
} from 'lucide-react';
import type { SubjectId, MechanicsFamily } from '@/data/gamesCatalog';

export interface GameVisualIdentity {
  gradient: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  IconComponent: React.ComponentType<{ className?: string }>;
}

/**
 * Returns a rich, vibrant visual identity tailored to each game's subject, mechanics, and individual theme.
 */
export function getGameVisualIdentity(
  gameId: string,
  subjectId?: SubjectId,
  mechanics?: MechanicsFamily
): GameVisualIdentity {
  // 1. Flagship Game Custom Identities
  if (gameId === 'cudo' || gameId.includes('cudo')) {
    return {
      gradient: 'from-purple-600 via-pink-600 to-amber-500',
      glowColor: 'rgba(236, 72, 153, 0.35)',
      badgeBg: 'bg-pink-500/15',
      badgeText: 'text-pink-400',
      borderColor: 'border-pink-500/40',
      IconComponent: Dices,
    };
  }

  if (gameId === 'code-runner' || gameId.includes('runner')) {
    return {
      gradient: 'from-orange-600 via-red-600 to-amber-500',
      glowColor: 'rgba(239, 68, 68, 0.35)',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      borderColor: 'border-orange-500/40',
      IconComponent: Flame,
    };
  }

  if (gameId === 'code-house' || gameId.includes('mansion') || gameId.includes('house')) {
    return {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
      glowColor: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      IconComponent: DoorOpen,
    };
  }

  // 2. Specific Game Mechanics Overrides
  if (gameId.includes('security') || gameId.includes('shield') || gameId.includes('crypto')) {
    return {
      gradient: 'from-rose-600 via-red-600 to-amber-600',
      glowColor: 'rgba(225, 29, 72, 0.3)',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      IconComponent: Shield,
    };
  }

  if (gameId.includes('git') || gameId.includes('merge')) {
    return {
      gradient: 'from-amber-600 via-orange-500 to-red-500',
      glowColor: 'rgba(245, 158, 11, 0.3)',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      IconComponent: GitMerge,
    };
  }

  if (gameId.includes('dijkstra') || gameId.includes('graph') || gameId.includes('mesh')) {
    return {
      gradient: 'from-blue-600 via-indigo-600 to-cyan-400',
      glowColor: 'rgba(59, 130, 246, 0.35)',
      badgeBg: 'bg-blue-500/15',
      badgeText: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      IconComponent: Network,
    };
  }

  if (gameId.includes('gradient') || gameId.includes('descent') || gameId.includes('neural')) {
    return {
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-500',
      glowColor: 'rgba(139, 92, 246, 0.35)',
      badgeBg: 'bg-purple-500/15',
      badgeText: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      IconComponent: Brain,
    };
  }

  if (mechanics === 'code-assembly') {
    return {
      gradient: 'from-cyan-600 via-blue-600 to-indigo-500',
      glowColor: 'rgba(6, 182, 212, 0.3)',
      badgeBg: 'bg-cyan-500/15',
      badgeText: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      IconComponent: Layers,
    };
  }

  if (mechanics === 'algo-trace') {
    return {
      gradient: 'from-indigo-600 via-purple-600 to-pink-500',
      glowColor: 'rgba(99, 102, 241, 0.3)',
      badgeBg: 'bg-indigo-500/15',
      badgeText: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      IconComponent: Activity,
    };
  }

  // 3. Subject-Specific Palettes
  switch (subjectId) {
    case 'A': // Programming Fundamentals
      return {
        gradient: 'from-sky-600 via-blue-600 to-indigo-600',
        glowColor: 'rgba(14, 165, 233, 0.3)',
        badgeBg: 'bg-sky-500/15',
        badgeText: 'text-sky-400',
        borderColor: 'border-sky-500/40',
        IconComponent: Code2,
      };
    case 'B': // Data Structures & Algorithms
      return {
        gradient: 'from-blue-600 via-cyan-600 to-teal-400',
        glowColor: 'rgba(6, 182, 212, 0.3)',
        badgeBg: 'bg-cyan-500/15',
        badgeText: 'text-cyan-400',
        borderColor: 'border-cyan-500/40',
        IconComponent: Binary,
      };
    case 'C': // Mathematics for Computing
      return {
        gradient: 'from-amber-600 via-orange-600 to-yellow-500',
        glowColor: 'rgba(245, 158, 11, 0.3)',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        IconComponent: Cpu,
      };
    case 'D': // Core Computer Science (OS, DB, Networks)
      return {
        gradient: 'from-teal-600 via-emerald-600 to-cyan-500',
        glowColor: 'rgba(20, 184, 166, 0.3)',
        badgeBg: 'bg-teal-500/15',
        badgeText: 'text-teal-400',
        borderColor: 'border-teal-500/40',
        IconComponent: Server,
      };
    case 'E': // Software Engineering & Systems
      return {
        gradient: 'from-emerald-600 via-teal-600 to-green-400',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        IconComponent: GitBranch,
      };
    case 'F': // Artificial Intelligence & Machine Learning
      return {
        gradient: 'from-fuchsia-600 via-purple-600 to-indigo-500',
        glowColor: 'rgba(192, 38, 211, 0.35)',
        badgeBg: 'bg-fuchsia-500/15',
        badgeText: 'text-fuchsia-400',
        borderColor: 'border-fuchsia-500/40',
        IconComponent: Sparkles,
      };
    case 'G': // Data Science & Big Data
      return {
        gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
        glowColor: 'rgba(99, 102, 241, 0.3)',
        badgeBg: 'bg-indigo-500/15',
        badgeText: 'text-indigo-400',
        borderColor: 'border-indigo-500/40',
        IconComponent: Database,
      };
    case 'H': // Academic & Tech Skills
      return {
        gradient: 'from-yellow-600 via-amber-600 to-orange-500',
        glowColor: 'rgba(217, 119, 6, 0.3)',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        IconComponent: GraduationCap,
      };
    default:
      return {
        gradient: 'from-gold-600 via-gold-500 to-amber-400',
        glowColor: 'rgba(208, 180, 119, 0.3)',
        badgeBg: 'bg-gold-400/15',
        badgeText: 'text-gold-400',
        borderColor: 'border-gold-400/40',
        IconComponent: Terminal,
      };
  }
}

interface GameLogoProps {
  gameId: string;
  subjectId?: SubjectId;
  mechanics?: MechanicsFamily;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GameLogo({
  gameId,
  subjectId,
  mechanics,
  size = 'md',
  className = '',
}: GameLogoProps) {
  const identity = getGameVisualIdentity(gameId, subjectId, mechanics);
  const Icon = identity.IconComponent;

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl text-base',
    md: 'w-12 h-12 rounded-2xl text-xl',
    lg: 'w-16 h-16 rounded-3xl text-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center p-0.5 border ${identity.borderColor} bg-gradient-to-br ${identity.gradient} text-white shadow-md transition-all duration-300 group-hover:scale-105 ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: `0 4px 15px ${identity.glowColor}`,
      }}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />
      <Icon className={`relative z-10 ${iconSizes[size]} drop-shadow-md text-white`} />
    </div>
  );
}
