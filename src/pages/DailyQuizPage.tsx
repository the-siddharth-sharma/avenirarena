import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { dailyQuizId, dailyQuizQuestions } from '@/data/quizData';
import { getAcademicDate, quizXpRules } from '@/engine/xpRules';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { QuizAttempt } from '@/types';
import type { NavigateProps } from './types';

export function DailyQuizPage({ navigate }: NavigateProps) {
  const { selectedStudent, quizAttempts, xpTransactions, submitDailyQuiz } = useStudentProfiles();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => dailyQuizQuestions.map(() => -1));
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const question = dailyQuizQuestions[questionIndex];
  const today = getAcademicDate();
  const earnedToday = xpTransactions.some((transaction) => transaction.relatedQuizId === dailyQuizId && transaction.academicDate === today);
  const previousAttempt = useMemo(() => quizAttempts.find((attempt) => attempt.academicDate === today && attempt.quizId === dailyQuizId), [quizAttempts, today]);

  useEffect(() => {
    setQuestionIndex(0);
    setAnswers(dailyQuizQuestions.map(() => -1));
    setError('');
    setResult(null);
  }, [selectedStudent.id]);

  const selectAnswer = (optionIndex: number) => {
    setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer));
    setError('');
  };

  const submit = () => {
    if (answers[questionIndex] === -1) {
      setError('Choose an answer before continuing.');
      return;
    }
    const submission = submitDailyQuiz(dailyQuizId, dailyQuizQuestions, answers);
    setResult(submission.attempt);
  };

  const next = () => {
    if (answers[questionIndex] === -1) {
      setError('Choose an answer before continuing.');
      return;
    }
    if (questionIndex === dailyQuizQuestions.length - 1) {
      submit();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setError('');
  };

  const restart = () => {
    setQuestionIndex(0);
    setAnswers(dailyQuizQuestions.map(() => -1));
    setError('');
    setResult(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Daily Quiz" subtitle="A focused five-question check-in for your learning streak." />

      <div className="demo-label mb-6">
        <Sparkles className="h-3.5 w-3.5 text-gold-400" />
        <span>Demo question bank · C++, DSA, algorithms, and computer science fundamentals</span>
      </div>

      {result ? (
        <QuizResults attempt={result} answers={answers} awarded={result.xpAwarded > 0} navigate={navigate} onRetry={restart} />
      ) : (
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-elevated px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="section-label text-gold-400">Today’s challenge</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-ivory">Computer Science Foundations</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted"><Clock3 className="h-4 w-4" />{dailyQuizQuestions.length} questions · {question.topic}</div>
              </div>
              <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 rounded-full bg-obsidian"><div className="h-full rounded-full bg-gold-400 transition-all duration-300" style={{ width: `${((questionIndex + 1) / dailyQuizQuestions.length) * 100}%` }} /></div><span className="font-mono text-xs text-gold-400">{questionIndex + 1}/{dailyQuizQuestions.length}</span></div>
            </div>
            <div className="px-5 py-7 sm:px-7 sm:py-9">
              <div className="flex flex-wrap items-center gap-2 mb-4"><span className="badge bg-gold-400/10 text-gold-400">{question.topic}</span><span className="badge bg-elevated text-muted">{question.difficulty}</span></div>
              <h3 className="max-w-2xl text-xl font-display font-medium leading-snug text-ivory sm:text-2xl">{question.prompt}</h3>
              <div className="mt-7 grid gap-3">{question.options.map((option, optionIndex) => { const selected = answers[questionIndex] === optionIndex; return <button key={option} onClick={() => selectAnswer(optionIndex)} className={`flex w-full items-center gap-3 rounded-md border px-4 py-3.5 text-left text-sm transition-all ${selected ? 'border-gold-400 bg-gold-400/10 text-ivory' : 'border-line bg-graphite text-muted hover:border-line-light hover:text-ivory'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono text-xs ${selected ? 'border-gold-400 bg-gold-400 text-obsidian' : 'border-line text-muted'}`}>{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>; })}</div>
              {error && <p className="mt-4 text-sm text-crimson-400" role="alert">{error}</p>}
              {earnedToday && <p className="mt-4 rounded-md border border-gold-400/20 bg-gold-400/5 px-3 py-2 text-xs text-muted">You have already earned today’s quiz XP. You may review the quiz again, but another submission will award 0 XP.</p>}
              <div className="mt-7 flex items-center justify-between gap-3"><span className="text-xs text-muted">Question {questionIndex + 1} of {dailyQuizQuestions.length}</span><button onClick={next} className="btn btn-primary">{questionIndex === dailyQuizQuestions.length - 1 ? 'Submit Quiz' : 'Next Question'}<ArrowRight className="h-4 w-4" /></button></div>
            </div>
          </Card>
          <div className="mt-4 flex items-center justify-between text-xs text-muted"><span>Completion: +{quizXpRules.completion} XP</span><span>Correct answer: +{quizXpRules.correctAnswer} XP</span></div>
          {previousAttempt && <p className="mt-3 text-center text-xs text-muted">A completed attempt is already saved for today. Submitting again will not create another XP reward.</p>}
        </div>
      )}
    </div>
  );
}

function QuizResults({ attempt, answers, awarded, navigate, onRetry }: { attempt: QuizAttempt; answers: number[]; awarded: boolean; navigate: NavigateProps['navigate']; onRetry: () => void }) {
  return <div className="mx-auto max-w-4xl"><Card className="mb-6 overflow-hidden p-0"><div className="border-b border-line bg-elevated px-5 py-7 text-center sm:px-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400"><CheckCircle2 className="h-7 w-7" /></div><p className="section-label mt-4 text-gold-400">Quiz complete</p><h2 className="mt-2 font-display text-3xl font-semibold text-ivory">{attempt.score} / {attempt.totalQuestions} correct</h2><p className="mt-2 text-sm text-muted">{awarded ? `You earned ${attempt.xpAwarded} XP for today’s challenge.` : 'Today’s XP was already awarded on an earlier submission.'}</p></div><div className="grid grid-cols-2 divide-x divide-line"><div className="p-5 text-center"><p className="font-mono text-2xl text-gold-400">{attempt.xpAwarded}</p><p className="mt-1 text-xs uppercase tracking-wide text-muted">XP earned</p></div><div className="p-5 text-center"><p className="font-mono text-2xl text-ivory">{attempt.totalQuestions - attempt.score}</p><p className="mt-1 text-xs uppercase tracking-wide text-muted">To review</p></div></div></Card><div className="space-y-3">{dailyQuizQuestions.map((question, index) => { const correct = answers[index] === question.correctOptionIndex; return <Card key={question.id} className="p-5"><div className="flex items-start gap-3"><div className={`mt-0.5 ${correct ? 'text-gold-400' : 'text-crimson-400'}`}>{correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</div><div className="min-w-0"><p className="text-xs uppercase tracking-wide text-muted">Question {index + 1} · {question.topic}</p><h3 className="mt-1 text-sm font-medium text-ivory">{question.prompt}</h3><p className="mt-2 text-sm text-muted">Your answer: <span className="text-ivory">{answers[index] >= 0 ? question.options[answers[index]] : 'No answer'}</span></p>{!correct && <p className="mt-1 text-sm text-gold-400">Correct answer: {question.options[question.correctOptionIndex]}</p>}<p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">{question.explanation}</p></div></div></Card>; })}</div><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={onRetry} className="btn btn-secondary"><RotateCcw className="h-4 w-4" />Review Again</button><button onClick={() => navigate('/activity')} className="btn btn-primary">View XP History<ArrowRight className="h-4 w-4" /></button></div></div>;
}
