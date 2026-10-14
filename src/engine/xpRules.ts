import type { QuizQuestion } from '@/types';
import { rewardRules } from './rewardRules';

export const quizXpRules = rewardRules.dailyQuiz;

export function getAcademicDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

export interface QuizScore {
  score: number;
  xp: number;
}

export function calculateDailyQuizScore(questions: QuizQuestion[], answers: number[]): QuizScore {
  const score = questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctOptionIndex ? 1 : 0),
    0,
  );
  return {
    score,
    xp: quizXpRules.completion + score * quizXpRules.correctAnswer,
  };
}
