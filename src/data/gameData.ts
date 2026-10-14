import type { LearningGameId } from '@/types';
import { rewardRules } from '@/engine/rewardRules';

export interface LearningGameDefinition {
  id: LearningGameId;
  title: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  reward: number;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export const learningGames: LearningGameDefinition[] = [
  {
    id: 'code-sprint',
    title: 'Code Sprint',
    category: 'Programming',
    description: 'Choose the output of a short C++ expression before the clock runs out.',
    difficulty: 'Beginner',
    reward: rewardRules.games['code-sprint'],
    prompt: 'What does this C++ expression print?  int x = 3; cout << x * 2 + 1;',
    options: ['5', '6', '7', '8'],
    correctOptionIndex: 2,
    explanation: 'Multiplication happens before addition, so 3 × 2 + 1 evaluates to 7.',
  },
  {
    id: 'logic-grid',
    title: 'Logic Grid',
    category: 'Algorithms',
    description: 'Use ordering logic to identify the only valid algorithm sequence.',
    difficulty: 'Intermediate',
    reward: rewardRules.games['logic-grid'],
    prompt: 'A queue starts empty. Enqueue A, enqueue B, dequeue once, then enqueue C. What is the queue order from front to back?',
    options: ['A, B, C', 'B, C', 'C, B', 'B, A, C'],
    correctOptionIndex: 1,
    explanation: 'The first dequeue removes A. B remains at the front, and C joins behind it, leaving B, C.',
  },
  {
    id: 'bug-hunter',
    title: 'Bug Hunter',
    category: 'Debugging',
    description: 'Find the incorrect line in a simple binary-search loop.',
    difficulty: 'Advanced',
    reward: rewardRules.games['bug-hunter'],
    prompt: 'Which line contains the bug if a binary search must continue searching the right half after target > values[mid]?',
    options: ['int mid = (low + high) / 2;', 'if (target > values[mid]) low = mid + 1;', 'else high = mid - 1;', 'return -1;'],
    correctOptionIndex: 2,
    explanation: 'The else branch must only handle target < values[mid]. Without an equality check, it can incorrectly move high when the target equals the midpoint.',
  },
];
