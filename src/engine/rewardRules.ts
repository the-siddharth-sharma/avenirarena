export const rewardRules = {
  dailyQuiz: {
    completion: 15,
    correctAnswer: 5,
  },
  games: {
    'code-sprint': 20,
    'logic-grid': 20,
    'bug-hunter': 25,
  },
  quests: {
    'daily-learner': 25,
    'perfect-precision': 30,
    'code-explorer': 25,
    'logic-thinker': 25,
    'weekly-achiever': 50,
  },
} as const;
