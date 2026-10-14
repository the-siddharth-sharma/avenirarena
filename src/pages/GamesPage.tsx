import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Code2, Gamepad2, LockKeyhole, RotateCcw, Swords, Zap } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { learningGames, type LearningGameDefinition } from '@/data/gameData';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { LearningGameId } from '@/types';
import type { NavigateProps } from './types';

const icons: Record<LearningGameId, typeof Code2> = {
  'code-sprint': Code2,
  'logic-grid': Swords,
  'bug-hunter': Gamepad2,
};

export function GamesPage({ navigate }: NavigateProps) {
  const { gameAttempts, gameCompletions, submitGame } = useStudentProfiles();
  const [activeGame, setActiveGame] = useState<LearningGameDefinition | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string; xp: number } | null>(null);

  const openGame = (game: LearningGameDefinition) => {
    setActiveGame(game);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const submitAnswer = () => {
    if (!activeGame || selectedAnswer === null) return;
    const result = submitGame(activeGame.id, selectedAnswer);
    setFeedback({ correct: result.attempt.correct, explanation: activeGame.explanation, xp: result.attempt.xpAwarded });
  };

  const completed = (gameId: LearningGameId) => gameCompletions.some((completion) => completion.gameId === gameId);

  if (activeGame) {
    const Icon = icons[activeGame.id];
    const alreadyCompleted = completed(activeGame.id);
    return <div className="animate-fade-in"><PageHeader title={activeGame.title} subtitle={`${activeGame.category} · ${activeGame.difficulty}`} /><div className="mx-auto max-w-3xl"><button onClick={() => setActiveGame(null)} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ivory"><ArrowLeft className="h-4 w-4" />Back to Games</button><Card className="overflow-hidden p-0"><div className="border-b border-line bg-elevated px-5 py-6 sm:px-7"><div className="flex items-start gap-4"><div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-3 text-gold-400"><Icon className="h-6 w-6" /></div><div><p className="section-label text-gold-400">Demo learning activity</p><h2 className="mt-1 font-display text-2xl font-semibold text-ivory">{activeGame.title}</h2><p className="mt-1 text-sm text-muted">A successful completion earns {activeGame.reward} XP once for this activity.</p></div></div></div><div className="px-5 py-7 sm:px-7"><p className="text-xs uppercase tracking-wide text-muted">Challenge</p><h3 className="mt-2 text-lg leading-relaxed text-ivory">{activeGame.prompt}</h3><div className="mt-6 grid gap-3">{activeGame.options.map((option, index) => <button key={option} onClick={() => { setSelectedAnswer(index); setFeedback(null); }} disabled={Boolean(feedback?.correct) || alreadyCompleted} className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all ${selectedAnswer === index ? 'border-gold-400 bg-gold-400/10 text-ivory' : 'border-line bg-graphite text-muted hover:border-line-light hover:text-ivory'}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line font-mono text-xs">{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{alreadyCompleted && !feedback && <p className="mt-5 rounded-md border border-gold-400/20 bg-gold-400/5 px-3 py-2 text-sm text-muted">This activity is already completed for this student. Replaying it will not award more XP.</p>}{feedback && <div className={`mt-5 rounded-md border p-4 ${feedback.correct ? 'border-gold-400/30 bg-gold-400/5' : 'border-line bg-elevated'}`}><div className="flex items-center gap-2 font-medium text-ivory">{feedback.correct ? <CheckCircle2 className="h-5 w-5 text-gold-400" /> : <LockKeyhole className="h-5 w-5 text-muted" />}{feedback.correct ? `Correct — +${feedback.xp} XP awarded` : 'Not quite — no XP awarded'}</div><p className="mt-2 text-sm leading-relaxed text-muted">{feedback.explanation}</p>{!feedback.correct && <button onClick={() => { setSelectedAnswer(null); setFeedback(null); }} className="btn btn-secondary mt-4"><RotateCcw className="h-4 w-4" />Try Again</button>}</div>}<div className="mt-7 flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-muted"><Zap className="h-4 w-4 text-gold-400" />Reward: {activeGame.reward} XP, once per student</span>{!feedback && !alreadyCompleted && <button onClick={submitAnswer} disabled={selectedAnswer === null} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">Submit Answer</button>}{(feedback?.correct || alreadyCompleted) && <button onClick={() => navigate('/quests')} className="btn btn-primary">View Quests</button>}</div></div></Card><p className="mt-4 text-center text-xs text-muted">Attempts recorded: {gameAttempts.filter((attempt) => attempt.gameId === activeGame.id).length}. Incorrect attempts never subtract XP.</p></div></div>;
  }

  return <div className="animate-fade-in"><PageHeader title="Games Hub" subtitle="Short, focused challenges that turn practice into progress." /><div className="demo-label mb-6"><Gamepad2 className="h-3.5 w-3.5 text-gold-400" /><span>Demo learning activities · rewards and completion are stored per selected student</span></div><div className="grid grid-cols-1 gap-5 lg:grid-cols-3">{learningGames.map((game) => { const Icon = icons[game.id]; const isCompleted = completed(game.id); return <Card key={game.id} className="flex h-full flex-col" hover><div className="flex items-start justify-between gap-3"><div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-3 text-gold-400"><Icon className="h-6 w-6" /></div>{isCompleted ? <span className="badge bg-gold-400/10 text-gold-400"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</span> : <span className="badge bg-elevated text-muted">{game.difficulty}</span>}</div><div className="mt-5 flex-1"><p className="section-label text-gold-400">{game.category}</p><h2 className="mt-1 font-display text-xl font-semibold text-ivory">{game.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted">{game.description}</p></div><div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4"><span className="text-xs text-muted"><Zap className="mr-1 inline h-3.5 w-3.5 text-gold-400" />{game.reward} XP once</span><button onClick={() => openGame(game)} className="btn btn-secondary">{isCompleted ? 'Review' : 'Play'}<ArrowLeft className="h-4 w-4 rotate-180" /></button></div></Card>; })}</div></div>;
}
