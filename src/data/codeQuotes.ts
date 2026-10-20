export interface CodeQuote {
  id: string;
  codeSnippet?: boolean;
  text: string;
  author?: string;
}

export const CODE_QUOTES: CodeQuote[] = [
  { id: 'quote-solve-first', text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { id: 'quote-while-learning', text: 'while (learning) { improve(); }', codeSnippet: true },
  { id: 'quote-bug-clue', text: 'Every bug is a clue waiting to be understood.', author: 'Engineering Codex' },
  { id: 'quote-if-failure', text: 'if (failure) { learn(); retry(); }', codeSnippet: true },
  { id: 'quote-small-commits', text: 'Small commits. Big progress.', author: 'Git Proverb' },
  { id: 'quote-const-growth', text: 'const growth = practice + curiosity;', codeSnippet: true },
  { id: 'quote-simplicity', text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  { id: 'quote-clean-code', text: 'Clean code always looks like it was written by someone who cares.', author: 'Michael Feathers' },
  { id: 'quote-make-it-work', text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { id: 'quote-read-more', text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Abelson & Sussman' },
  { id: 'quote-test-defect', text: 'Testing shows the presence, not the absence of bugs.', author: 'Edsger W. Dijkstra' },
  { id: 'quote-talk-code', text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { id: 'quote-optimize-later', text: 'Premature optimization is the root of all evil.', author: 'Donald Knuth' },
  { id: 'quote-think-twice', text: 'Think twice, code once.', author: 'Software Craftsmanship' },
];

export const AVAILABLE_REACTIONS = ['👍', '❤️', '💡', '🚀', '🔥', '😂'] as const;
export type QuoteReactionEmoji = typeof AVAILABLE_REACTIONS[number];

export function getDailyDeterministicQuote(path: string): CodeQuote {
  // Rotate deterministically per day and per path
  const dayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  let hash = 0;
  const key = `${path.split('?')[0].replace(/^#/, '')}-${dayEpoch}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CODE_QUOTES.length;
  return CODE_QUOTES[index];
}
