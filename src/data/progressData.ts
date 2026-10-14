import type { LearningGameId } from '@/types';

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly';
  target: number;
  reward: number;
  category: string;
}

export const questDefinitions: QuestDefinition[] = [
  { id: 'daily-learner', title: 'Daily Learner', description: 'Complete the daily quiz.', frequency: 'daily', target: 1, reward: 25, category: 'Quiz' },
  { id: 'perfect-precision', title: 'Perfect Precision', description: 'Answer every question correctly in the daily quiz.', frequency: 'daily', target: 1, reward: 30, category: 'Quiz' },
  { id: 'code-explorer', title: 'Code Explorer', description: 'Successfully complete Code Sprint.', frequency: 'daily', target: 1, reward: 25, category: 'Programming' },
  { id: 'logic-thinker', title: 'Logic Thinker', description: 'Successfully complete Logic Grid.', frequency: 'daily', target: 1, reward: 25, category: 'Algorithms' },
  { id: 'weekly-achiever', title: 'Weekly Achiever', description: 'Complete three eligible learning activities this week.', frequency: 'weekly', target: 3, reward: 50, category: 'Momentum' },
];

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const badgeDefinitions: BadgeDefinition[] = [
  { id: 'first-steps', title: 'First Steps', description: 'Complete your first eligible learning activity.', icon: 'Footprints' },
  { id: 'quiz-champion', title: 'Quiz Champion', description: 'Achieve a perfect daily quiz score.', icon: 'Trophy' },
  { id: 'code-explorer', title: 'Code Explorer', description: 'Successfully complete a coding mini-game.', icon: 'Code2' },
  { id: 'logic-master', title: 'Logic Master', description: 'Successfully complete a logic challenge.', icon: 'BrainCircuit' },
  { id: 'quest-finisher', title: 'Quest Finisher', description: 'Complete five eligible quests.', icon: 'Medal' },
];

export function getWeekKey(date = new Date()): string {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / 86400000) + 1;
  return `${date.getFullYear()}-W${Math.ceil(dayOfYear / 7)}`;
}

export function getPeriodKey(frequency: 'daily' | 'weekly', date = new Date()): string {
  if (frequency === 'weekly') return getWeekKey(date);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

export function isGameId(value: string): value is LearningGameId {
  return value === 'code-sprint' || value === 'logic-grid' || value === 'bug-hunter';
}
