import { useState, type ReactNode } from 'react';
import { CheckCircle2, Clock3, Lock, PlayCircle, Trophy, Zap } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { getAcademicDate } from '@/engine/xpRules';
import { getPeriodKey, getWeekKey, questDefinitions, type QuestDefinition } from '@/data/progressData';
import { dailyQuizId } from '@/data/quizData';
import { useStudentProfiles } from '@/students/StudentProfileContext';

type TabFilter = 'all' | 'daily' | 'weekly';

export function QuestsPage() {
  const { quizAttempts, gameCompletions, questCompletions } = useStudentProfiles();
  const [tab, setTab] = useState<TabFilter>('all');
  const now = new Date();
  const today = getAcademicDate();
  const week = getWeekKey(now);
  const todayQuiz = quizAttempts.find((attempt) => attempt.quizId === dailyQuizId && attempt.academicDate === today);
  const todayGames = new Set(gameCompletions.filter((completion) => completion.academicDate === today).map((completion) => completion.gameId));
  const weeklyActivities = quizAttempts.filter((attempt) => getWeekKey(new Date(attempt.submittedAt)) === week).length + gameCompletions.filter((completion) => getWeekKey(new Date(completion.completedAt)) === week).length;
  const getProgress = (quest: QuestDefinition) => ({
    'daily-learner': todayQuiz ? 1 : 0,
    'perfect-precision': todayQuiz?.score === todayQuiz?.totalQuestions ? 1 : 0,
    'code-explorer': todayGames.has('code-sprint') ? 1 : 0,
    'logic-thinker': todayGames.has('logic-grid') ? 1 : 0,
    'weekly-achiever': weeklyActivities,
  })[quest.id] || 0;
  const visible = questDefinitions.filter((quest) => tab === 'all' || quest.frequency === tab);
  const completed = visible.filter((quest) => questCompletions.some((completion) => completion.questId === quest.id && completion.periodKey === getPeriodKey(quest.frequency, now))).length;
  const inProgress = visible.filter((quest) => getProgress(quest) > 0 && getProgress(quest) < quest.target).length;
  const tabs: { key: TabFilter; label: string }[] = [{ key: 'all', label: 'All Quests' }, { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }];

  return <div className="animate-fade-in"><PageHeader title="Quests" subtitle="Complete real learning activities to unlock missions and rewards." /><div className="demo-label mb-6"><Trophy className="h-3.5 w-3.5 text-gold-400" /><span>Prototype quest tracking · progress resets with the local daily and weekly calendar</span></div><div className="grid grid-cols-3 gap-4 mb-6"><Summary label="Completed" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} /><Summary label="In Progress" value={inProgress} icon={<PlayCircle className="h-5 w-5" />} /><Summary label="Quest XP" value={questCompletions.reduce((total, completion) => total + completion.xpAwarded, 0)} icon={<Zap className="h-5 w-5" />} /></div><div className="mb-6 flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-md border border-line bg-graphite p-1 no-scrollbar">{tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`tab-button ${tab === item.key ? 'tab-active' : 'tab-inactive'}`}>{item.label}</button>)}</div>{visible.length ? <div className="space-y-3">{visible.map((quest) => <QuestRow key={quest.id} quest={quest} progress={Math.min(getProgress(quest), quest.target)} completed={questCompletions.some((completion) => completion.questId === quest.id && completion.periodKey === getPeriodKey(quest.frequency, now))} />)}</div> : <Card><EmptyState title="No quests here" message="Check back later for new missions." /></Card>}</div>;
}

function Summary({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <Card><div className="flex items-center gap-3"><div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-2.5 text-gold-400">{icon}</div><div><p className="font-display text-2xl font-bold text-ivory">{value}</p><p className="text-xs text-muted">{label}</p></div></div></Card>;
}

function QuestRow({ quest, progress, completed }: { quest: QuestDefinition; progress: number; completed: boolean }) {
  const locked = false;
  return <Card className={completed ? 'border-gold-400/30' : ''}><div className="flex items-start gap-4"><div className={`rounded-md border p-2.5 ${completed ? 'border-gold-400/30 bg-gold-400/10 text-gold-400' : 'border-line bg-elevated text-muted'}`}>{completed ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-medium text-ivory">{quest.title}</h3><p className="mt-0.5 text-sm text-muted">{quest.description}</p></div><span className={`badge shrink-0 ${completed ? 'bg-gold-400/10 text-gold-400' : 'bg-elevated text-muted'}`}>{completed ? 'Completed' : quest.frequency === 'daily' ? 'Daily' : 'Weekly'}</span></div><div className="mt-3 flex flex-wrap items-center gap-4"><span className="flex items-center gap-1.5 text-xs text-muted"><Zap className="h-3.5 w-3.5 text-gold-400" />{quest.reward} XP reward</span><span className="badge bg-elevated text-muted">{quest.category}</span></div><div className="mt-3"><div className="mb-1 flex items-center justify-between text-xs font-mono text-muted"><span>{progress} / {quest.target}</span><span>{Math.round((progress / quest.target) * 100)}%</span></div><ProgressBar value={progress} max={quest.target} color={completed ? 'from-[var(--c-accent)] to-[var(--c-accent-2)]' : 'from-[var(--c-accent)] to-[var(--c-accent-2)]'} height="sm" /></div></div></div></Card>;
}

