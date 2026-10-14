import type { QuizQuestion } from '@/types';

export const dailyQuizId = 'daily-quiz-cs-foundations';

export const dailyQuizQuestions: QuizQuestion[] = [
  {
    id: 'quiz-q-001',
    topic: 'C++',
    difficulty: 'Beginner',
    prompt: 'Which data type is commonly used to store a whole number in C++?',
    options: ['int', 'string', 'bool', 'double'],
    correctOptionIndex: 0,
    explanation: 'The int type stores signed whole numbers. Strings store text, bool stores true or false, and double stores decimal values.',
  },
  {
    id: 'quiz-q-002',
    topic: 'Data Structures',
    difficulty: 'Intermediate',
    prompt: 'Which data structure follows the Last In, First Out principle?',
    options: ['Queue', 'Stack', 'Hash table', 'Binary tree'],
    correctOptionIndex: 1,
    explanation: 'A stack removes the most recently added item first, which is the Last In, First Out principle.',
  },
  {
    id: 'quiz-q-003',
    topic: 'Algorithms',
    difficulty: 'Intermediate',
    prompt: 'What is the average time complexity of binary search on a sorted array?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctOptionIndex: 1,
    explanation: 'Binary search halves the remaining search range after each comparison, giving an average complexity of O(log n).',
  },
  {
    id: 'quiz-q-004',
    topic: 'Computer Science',
    difficulty: 'Beginner',
    prompt: 'What does RAM primarily provide to a running program?',
    options: ['Permanent file storage', 'Temporary working memory', 'A network connection', 'Power regulation'],
    correctOptionIndex: 1,
    explanation: 'RAM provides fast, temporary working memory for data and instructions being used by running programs.',
  },
  {
    id: 'quiz-q-005',
    topic: 'Algorithms',
    difficulty: 'Advanced',
    prompt: 'Which traversal visits a binary search tree in ascending key order?',
    options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
    correctOptionIndex: 2,
    explanation: 'In-order traversal visits the left subtree, the node, and then the right subtree, producing ascending keys in a binary search tree.',
  },
];
