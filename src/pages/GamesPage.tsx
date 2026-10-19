import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  DoorOpen,
  Flame,
  Gamepad2,
  Lock,
  LockKeyhole,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Terminal,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { learningGames, type LearningGameDefinition } from '@/data/gameData';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { useAuth } from '@/context/AuthContext';
import { CodeRunnerGame } from '@/components/CodeRunner/CodeRunnerGame';
import { CodeHouseGame } from '@/components/CodeHouse/CodeHouseGame';
import type { LearningGameId } from '@/types';
import type { NavigateProps } from './types';

const icons: Record<LearningGameId, typeof Code2> = {
  'code-sprint': Code2,
  'logic-grid': Swords,
  'bug-hunter': Gamepad2,
};

export function GamesPage({ navigate }: NavigateProps) {
  const { gameAttempts, gameCompletions, submitGame } = useStudentProfiles();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [playingCodeRunner, setPlayingCodeRunner] = useState(false);
  const [playingCodeHouse, setPlayingCodeHouse] = useState(false);
  const [activeGame, setActiveGame] = useState<LearningGameDefinition | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string; xp: number } | null>(null);

  // If user is unauthenticated, restrict access to the Games Hub
  if (!currentUser) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Games Hub"
          subtitle="Live playable challenges and focused practice that turn skill into progress."
        />

        <Card className="relative overflow-hidden p-8 sm:p-12 border-gold-400/40 bg-gradient-to-b from-graphite via-elevated to-obsidian text-center max-w-2xl mx-auto shadow-2xl">
          <div className="h-16 w-16 rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-400 mx-auto mb-5 flex items-center justify-center shadow-[0_0_24px_rgba(208,180,119,0.3)]">
            <Lock className="h-8 w-8" />
          </div>

          <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold">
            AUTHENTICATION REQUIRED
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory mt-1">
            Arena Access Restricted
          </h2>
          <p className="text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
            Please sign in with your Google Student Account to access the Games Hub, play Code Runner 3D & The Code House, and record Academic XP.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openAuthModal}
              className="btn btn-primary px-8 py-3.5 text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
            >
              <span>Sign In with Google</span>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const openGame = (game: LearningGameDefinition) => {
    setActiveGame(game);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const submitAnswer = () => {
    if (!activeGame || selectedAnswer === null) return;
    const result = submitGame(activeGame.id, selectedAnswer);
    setFeedback({
      correct: result.attempt.correct,
      explanation: activeGame.explanation,
      xp: result.attempt.xpAwarded,
    });
  };

  const completed = (gameId: LearningGameId) =>
    gameCompletions.some((completion) => completion.gameId === gameId);

  // If active 2D Code House exploration game is launched
  if (playingCodeHouse) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="The Code House"
          subtitle="Mysterious C++ Exploration & Code Assembly · 4 Playable Mansion Floors"
        />
        <CodeHouseGame
          onExit={() => setPlayingCodeHouse(false)}
          username={userProfile?.username || currentUser.displayName}
          avatarUrl={userProfile?.avatarUrl || currentUser.photoURL}
        />
      </div>
    );
  }

  // If active 3D Code Runner game is launched
  if (playingCodeRunner) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Code Runner 3D"
          subtitle="Cyber Endless Syntax Runner · 3 Lanes · Full Playable Experience"
        />
        <CodeRunnerGame
          onExit={() => setPlayingCodeRunner(false)}
          username={userProfile?.username || currentUser.displayName}
          avatarUrl={userProfile?.avatarUrl || currentUser.photoURL}
        />
      </div>
    );
  }

  // If traditional multiple choice challenge is active
  if (activeGame) {
    const Icon = icons[activeGame.id];
    const alreadyCompleted = completed(activeGame.id);

    return (
      <div className="animate-fade-in">
        <PageHeader title={activeGame.title} subtitle={`${activeGame.category} · ${activeGame.difficulty}`} />

        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => setActiveGame(null)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ivory transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </button>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-elevated px-5 py-6 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-3 text-gold-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="section-label text-gold-400">Demo learning activity</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ivory">{activeGame.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    A successful completion earns {activeGame.reward} XP once for this activity.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-7 sm:px-7">
              <p className="text-xs uppercase tracking-wide text-muted">Challenge</p>
              <h3 className="mt-2 text-lg leading-relaxed text-ivory">{activeGame.prompt}</h3>

              <div className="mt-6 grid gap-3">
                {activeGame.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedAnswer(index);
                      setFeedback(null);
                    }}
                    disabled={Boolean(feedback?.correct) || alreadyCompleted}
                    className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all ${
                      selectedAnswer === index
                        ? 'border-gold-400 bg-gold-400/10 text-ivory'
                        : 'border-line bg-graphite text-muted hover:border-line-light hover:text-ivory'
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line font-mono text-xs">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {alreadyCompleted && !feedback && (
                <p className="mt-5 rounded-md border border-gold-400/20 bg-gold-400/5 px-3 py-2 text-sm text-muted">
                  This activity is already completed for this student. Replaying it will not award more XP.
                </p>
              )}

              {feedback && (
                <div
                  className={`mt-5 rounded-md border p-4 ${
                    feedback.correct ? 'border-gold-400/30 bg-gold-400/5' : 'border-line bg-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-ivory">
                    {feedback.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-gold-400" />
                    ) : (
                      <LockKeyhole className="h-5 w-5 text-muted" />
                    )}
                    {feedback.correct ? `Correct — +${feedback.xp} XP awarded` : 'Not quite — no XP awarded'}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feedback.explanation}</p>
                  {!feedback.correct && (
                    <button
                      onClick={() => {
                        setSelectedAnswer(null);
                        setFeedback(null);
                      }}
                      className="btn btn-secondary mt-4"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </button>
                  )}
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Zap className="h-4 w-4 text-gold-400" />
                  Reward: {activeGame.reward} XP, once per student
                </span>

                {!feedback && !alreadyCompleted && (
                  <button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null}
                    className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                )}

                {(feedback?.correct || alreadyCompleted) && (
                  <button onClick={() => navigate('/quests')} className="btn btn-primary">
                    View Quests
                  </button>
                )}
              </div>
            </div>
          </Card>

          <p className="mt-4 text-center text-xs text-muted">
            Attempts recorded: {gameAttempts.filter((attempt) => attempt.gameId === activeGame.id).length}. Incorrect
            attempts never subtract XP.
          </p>
        </div>
      </div>
    );
  }

  // Games Hub Main View
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Games Hub"
        subtitle="Live playable challenges and focused practice that turn skill into progress."
      />

      {/* FEATURED GAME 1: THE CODE HOUSE (EXPLORATION & PUZZLE) */}
      <Card className="relative overflow-hidden p-6 sm:p-8 border-gold-400/40 bg-gradient-to-r from-obsidian via-graphite to-elevated shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-gold-400/20 text-gold-400 border border-gold-400/40 text-xs font-mono font-semibold flex items-center gap-1">
                <DoorOpen className="h-3 w-3" />
                NEW FEATURED EXPLORATION GAME
              </span>
              <span className="text-xs text-muted">· 4 Mansion Floors</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">
              THE CODE HOUSE
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Enter an ancient, shadowed mansion. Walk between rooms, search bookcases, open locked chests with brass keys, and recover scattered C++ code fragments. Assemble and validate programs line by line at the Grand Terminal to ascend from foundational syntax to multi-branch loops and functions!
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-muted">
              <span className="flex items-center gap-1.5 text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> 4 Mansion Floors
              </span>
              <span className="flex items-center gap-1.5 text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Code Assembly Panel
              </span>
              <span className="flex items-center gap-1.5 text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Clue Journal & Key Quests
              </span>
              <span className="text-muted">WASD / Arrow Keys or Touch</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setPlayingCodeHouse(true)}
              className="btn btn-primary px-6 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(208,180,119,0.35)] hover:scale-105 transition-transform"
            >
              <DoorOpen className="h-4 w-4 fill-obsidian" />
              <span>EXPLORE THE CODE HOUSE</span>
            </button>
            <button
              onClick={() => navigate('/mansion-quest')}
              className="btn btn-secondary px-5 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors"
              title="Launch 10x10 Grid Quest with Drag & Drop Assembly"
            >
              <Terminal className="h-4 w-4" />
              <span>10x10 SYNTAX MANSION</span>
            </button>
          </div>
        </div>
      </Card>

      {/* FEATURED GAME 2: 3D CODE RUNNER ENDLESS RUNNER ARENA */}
      <Card className="relative overflow-hidden p-6 sm:p-8 border-gold-400/30 bg-gradient-to-r from-graphite via-elevated to-obsidian shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-gold-400/20 text-gold-400 border border-gold-400/40 text-xs font-mono font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                FEATURED 3D PLAYABLE GAME
              </span>
              <span className="text-xs text-muted">· Real-Time Runner</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ivory tracking-tight">
              CODE RUNNER 3D
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sprint through a 3-lane futuristic cyber arena. Approaching gateway portals display tokens from C++,
              JavaScript, Python, and Logic. Steer your runner through the correct syntax door to rack up multiplier
              streaks before running out of lives!
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-muted">
              <span className="flex items-center gap-1.5 text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> 3 Cyber Lanes
              </span>
              <span className="flex items-center gap-1.5 text-ivory">
                <Flame className="h-3.5 w-3.5 text-gold-400" /> Multiplier Combos
              </span>
              <span className="flex items-center gap-1.5 text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Real Code Syntax
              </span>
              <span className="text-muted">A / D or ← / → or Touch</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setPlayingCodeRunner(true)}
              className="btn btn-secondary px-7 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:border-gold-400 hover:text-gold-400 transition-colors"
            >
              <Play className="h-4 w-4 fill-obsidian" />
              <span>LAUNCH CODE RUNNER</span>
            </button>
          </div>
        </div>
      </Card>

      <div className="demo-label">
        <Gamepad2 className="h-3.5 w-3.5 text-gold-400" />
        <span>Classic practice activities · rewards and completion stored per selected student</span>
      </div>

      {/* Grid of standard practice activities */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {learningGames.map((game) => {
          const Icon = icons[game.id];
          const isCompleted = completed(game.id);

          return (
            <Card key={game.id} className="flex h-full flex-col" hover>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-3 text-gold-400">
                  <Icon className="h-6 w-6" />
                </div>
                {isCompleted ? (
                  <span className="badge bg-gold-400/10 text-gold-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </span>
                ) : (
                  <span className="badge bg-elevated text-muted">{game.difficulty}</span>
                )}
              </div>

              <div className="mt-5 flex-1">
                <p className="section-label text-gold-400">{game.category}</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-ivory">{game.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{game.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="text-xs text-muted">
                  <Zap className="mr-1 inline h-3.5 w-3.5 text-gold-400" />
                  {game.reward} XP once
                </span>

                <div className="flex items-center gap-2">
                  {game.id === 'code-sprint' && (
                    <button
                      onClick={() => setPlayingCodeRunner(true)}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      title="Launch 3D Code Runner"
                    >
                      <Play className="h-3 w-3 fill-obsidian" />
                      <span>3D Runner</span>
                    </button>
                  )}
                  {game.id === 'logic-grid' && (
                    <button
                      onClick={() => setPlayingCodeHouse(true)}
                      className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      title="Explore The Code House"
                    >
                      <DoorOpen className="h-3 w-3 fill-obsidian" />
                      <span>The Code House</span>
                    </button>
                  )}
                  <button onClick={() => openGame(game)} className="btn btn-secondary text-xs py-1.5 px-3">
                    {isCompleted ? 'Review' : 'Quiz'}
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
