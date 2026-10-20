import { useState, useMemo, useCallback } from 'react';
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
  Sparkles,
  Swords,
  Terminal,
  Zap,
  Search,
  Filter,
  Dices,
  Clock,
  Binary,
  Cpu,
  Server,
  GitBranch,
  Database,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { type LearningGameDefinition } from '@/data/gameData';
import {
  SUBJECT_TAXONOMY,
  CATALOG_GAMES,
  type CatalogGame,
  type SubjectId,
  type MechanicsFamily,
  type GameDifficulty,
  type DurationCategory,
} from '@/data/gamesCatalog';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import { useAuth } from '@/context/AuthContext';
import { CodeRunnerGame } from '@/components/CodeRunner/CodeRunnerGame';
import { CodeHouseGame } from '@/components/CodeHouse/CodeHouseGame';
import { CudoGame } from '@/components/Cudo/CudoGame';
import { InteractiveGameModal } from '@/components/Games/InteractiveGameModal';
import { GameLogo } from '@/components/Games/GameLogo';
import type { LearningGameId } from '@/types';
import type { NavigateProps } from './types';

const legacyIcons: Record<LearningGameId, typeof Code2> = {
  'code-sprint': Code2,
  'logic-grid': Swords,
  'bug-hunter': Gamepad2,
};

const SUBJECT_ICON_MAP: Record<SubjectId, typeof Code2> = {
  A: Code2,
  B: Binary,
  C: Cpu,
  D: Server,
  E: GitBranch,
  F: Sparkles,
  G: Database,
  H: GraduationCap,
};

export function GamesPage({ navigate }: NavigateProps) {
  const { gameCompletions, submitGame } = useStudentProfiles();
  const { currentUser, userProfile, openAuthModal } = useAuth();

  // Flagship game launch states
  const [playingCudo, setPlayingCudo] = useState(false);
  const [playingCodeRunner, setPlayingCodeRunner] = useState(false);
  const [playingCodeHouse, setPlayingCodeHouse] = useState(false);

  // Active modal game runner
  const [selectedCatalogGame, setSelectedCatalogGame] = useState<CatalogGame | null>(null);

  // Legacy game state
  const [activeLegacyGame, setActiveLegacyGame] = useState<LearningGameDefinition | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [legacyFeedback, setLegacyFeedback] = useState<{ correct: boolean; explanation: string; xp: number } | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'all' | SubjectId>('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | GameDifficulty>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | DurationCategory>('all');
  const [selectedMechanics, setSelectedMechanics] = useState<'all' | MechanicsFamily>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'played' | 'unplayed'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'difficulty' | 'duration' | 'xp' | 'title'>('recommended');

  // Track completed game IDs
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('avenir_completed_games') || '{}');
    } catch {
      return {};
    }
  });

  const isGameCompleted = useCallback(
    (id: string) => {
      return Boolean(completedMap[id] || gameCompletions.some((c) => c.gameId === id));
    },
    [completedMap, gameCompletions]
  );

  const handleGameCompleted = (gameId: string) => {
    setCompletedMap((prev) => {
      const next = { ...prev, [gameId]: true };
      localStorage.setItem('avenir_completed_games', JSON.stringify(next));
      return next;
    });
  };

  // Available topics scoped to active subject
  const availableTopics = useMemo(() => {
    if (selectedSubject === 'all') {
      const set = new Set<string>();
      CATALOG_GAMES.forEach((g) => set.add(g.topic));
      return Array.from(set);
    }
    const subj = SUBJECT_TAXONOMY.find((s) => s.id === selectedSubject);
    return subj ? subj.topics : [];
  }, [selectedSubject]);

  // Filtered and sorted 50 catalog games
  const filteredGames = useMemo(() => {
    return CATALOG_GAMES.filter((game) => {
      // Subject filter
      if (selectedSubject !== 'all' && game.subjectId !== selectedSubject) return false;

      // Topic filter
      if (selectedTopic !== 'all' && game.topic !== selectedTopic) return false;

      // Difficulty filter
      if (selectedDifficulty !== 'all' && game.difficulty !== selectedDifficulty) return false;

      // Duration filter
      if (selectedDuration !== 'all' && game.durationCategory !== selectedDuration) return false;

      // Mechanics filter
      if (selectedMechanics !== 'all' && game.mechanicsFamily !== selectedMechanics) return false;

      // Played / Unplayed filter
      if (selectedStatus === 'played' && !isGameCompleted(game.id)) return false;
      if (selectedStatus === 'unplayed' && isGameCompleted(game.id)) return false;

      // Search query filter (matches title, topic, subtopic, learning objectives, tags)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesTopic = game.topic.toLowerCase().includes(query);
        const matchesSubtopic = game.subtopic.toLowerCase().includes(query);
        const matchesDesc = game.description.toLowerCase().includes(query);
        const matchesTags = game.curriculumTags.some((t) => t.toLowerCase().includes(query));
        const matchesObj = game.learningObjectives.some((o) => o.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTopic && !matchesSubtopic && !matchesDesc && !matchesTags && !matchesObj) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'difficulty') {
        const order: Record<GameDifficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
        return order[a.difficulty] - order[b.difficulty];
      }
      if (sortBy === 'duration') {
        return a.duration.localeCompare(b.duration);
      }
      if (sortBy === 'xp') {
        return b.xpReward - a.xpReward;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0; // recommended order
    });
  }, [
    selectedSubject,
    selectedTopic,
    selectedDifficulty,
    selectedDuration,
    selectedMechanics,
    selectedStatus,
    searchQuery,
    sortBy,
    isGameCompleted,
  ]);

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
            Please sign in with your Google Student Account to access the Games Hub, play CUDO Multiplayer, Code Runner 3D & The Code House, and record Academic XP.
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

  // 1. CUDO MULTIPLAYER BOARD GAME LAUNCHED
  if (playingCudo) {
    return <CudoGame onExit={() => setPlayingCudo(false)} />;
  }

  // 2. THE CODE HOUSE (2D EXPLORATION MANSION) LAUNCHED
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

  // 3. CODE RUNNER 3D (CYBER ENDLESS RUNNER) LAUNCHED
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

  // 4. LEGACY MCQ MODAL
  if (activeLegacyGame) {
    const Icon = legacyIcons[activeLegacyGame.id];
    const alreadyCompleted = isGameCompleted(activeLegacyGame.id);

    return (
      <div className="animate-fade-in">
        <PageHeader title={activeLegacyGame.title} subtitle={`${activeLegacyGame.category} · ${activeLegacyGame.difficulty}`} />

        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => setActiveLegacyGame(null)}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ivory transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Games Hub
          </button>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-elevated px-5 py-6 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="rounded-md border border-gold-400/20 bg-gold-400/10 p-3 text-gold-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="section-label text-gold-400">Classic practice activity</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ivory">{activeLegacyGame.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    A successful completion earns {activeLegacyGame.reward} XP once for this activity.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-7 sm:px-7">
              <p className="text-xs uppercase tracking-wide text-muted">Challenge</p>
              <h3 className="mt-2 text-lg leading-relaxed text-ivory">{activeLegacyGame.prompt}</h3>

              <div className="mt-6 grid gap-3">
                {activeLegacyGame.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedAnswer(index);
                      setLegacyFeedback(null);
                    }}
                    disabled={Boolean(legacyFeedback?.correct) || alreadyCompleted}
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

              {alreadyCompleted && !legacyFeedback && (
                <p className="mt-5 rounded-md border border-gold-400/20 bg-gold-400/5 px-3 py-2 text-sm text-muted">
                  This activity is already completed for this student.
                </p>
              )}

              {legacyFeedback && (
                <div
                  className={`mt-5 rounded-md border p-4 ${
                    legacyFeedback.correct ? 'border-gold-400/30 bg-gold-400/5' : 'border-line bg-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-ivory">
                    {legacyFeedback.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-gold-400" />
                    ) : (
                      <LockKeyhole className="h-5 w-5 text-muted" />
                    )}
                    {legacyFeedback.correct ? `Correct — +${legacyFeedback.xp} XP awarded` : 'Not quite — no XP awarded'}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{legacyFeedback.explanation}</p>
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Zap className="h-4 w-4 text-gold-400" />
                  Reward: {activeLegacyGame.reward} XP, once per student
                </span>

                {!legacyFeedback && !alreadyCompleted && (
                  <button
                    onClick={() => {
                      if (selectedAnswer === null) return;
                      const res = submitGame(activeLegacyGame.id, selectedAnswer);
                      setLegacyFeedback({
                        correct: res.attempt.correct,
                        explanation: activeLegacyGame.explanation,
                        xp: res.attempt.xpAwarded,
                      });
                      if (res.attempt.correct) handleGameCompleted(activeLegacyGame.id);
                    }}
                    disabled={selectedAnswer === null}
                    className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 5. MAIN GAMES HUB
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono border border-gold-400/30 bg-gold-400/10 text-gold-400 flex items-center gap-1 font-bold">
              <Gamepad2 className="w-3.5 h-3.5 text-gold-400" />
              50 INTERACTIVE CS/AI GAMES
            </span>
            <span className="text-xs font-mono text-muted">• ACM/IEEE CS2023 Taxonomy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ivory">
            Interactive Games Hub
          </h1>
          <p className="text-xs text-muted mt-1">
            Playable simulations, syntax repair engines, and multiplayer board games that turn CS theory into verified mastery.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-obsidian border border-line text-muted">
            <span className="text-gold-400 font-bold">{Object.keys(completedMap).length}</span> / {CATALOG_GAMES.length} Mastered
          </div>
        </div>
      </div>

      {/* ── FEATURED FLAGSHIP GAMES BANNER ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flagship 1: CUDO Multiplayer Board Game */}
        <Card className="relative overflow-hidden p-6 border-gold-400/40 bg-gradient-to-br from-obsidian via-graphite to-elevated shadow-xl flex flex-col justify-between group hover:border-gold-400 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <GameLogo gameId="cudo" size="lg" />
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gold-400/20 text-gold-400 border border-gold-400/40 font-bold flex items-center gap-1">
                  <Dices className="w-3 h-3" />
                  BOARD GAME
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">+350 XP</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ivory group-hover:text-gold-400 transition-colors">
                CUDO: Code & Conquer
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Turn-based multiplayer CS board game. Roll dice across 32 circuit tiles, solve live algorithm challenges, and race to Production Deployment!
              </p>
            </div>
          </div>
          <button
            onClick={() => setPlayingCudo(true)}
            className="mt-5 btn btn-primary py-2.5 text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
          >
            <Play className="w-3.5 h-3.5 fill-obsidian" />
            <span>PLAY CUDO MULTIPLAYER</span>
          </button>
        </Card>

        {/* Flagship 2: The Code House 2D Mansion */}
        <Card className="relative overflow-hidden p-6 border-cyan-500/40 bg-gradient-to-br from-obsidian via-graphite to-elevated shadow-xl flex flex-col justify-between group hover:border-cyan-400 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <GameLogo gameId="code-house" size="lg" />
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold flex items-center gap-1">
                  <DoorOpen className="w-3 h-3" />
                  PUZZLE MANSION
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">4 Floors</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ivory group-hover:text-cyan-400 transition-colors">
                The Code House
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Step through shadowed rooms, search bookcases, open locked chests, recover C++ code fragments, and assemble programs at the Grand Terminal.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => setPlayingCodeHouse(true)}
              className="flex-1 btn btn-secondary py-2.5 text-xs font-mono flex items-center justify-center gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>EXPLORE MANSION</span>
            </button>
            <button
              onClick={() => navigate('/mansion-quest')}
              className="btn btn-secondary py-2.5 px-3 text-xs font-mono text-muted hover:text-ivory"
              title="10x10 Grid Quest"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Flagship 3: Code Runner 3D */}
        <Card className="relative overflow-hidden p-6 border-emerald-500/40 bg-gradient-to-br from-obsidian via-graphite to-elevated shadow-xl flex flex-col justify-between group hover:border-emerald-400 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <GameLogo gameId="code-runner" size="lg" />
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  CYBER RUNNER
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Real-Time</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ivory group-hover:text-emerald-400 transition-colors">
                Code Runner 3D
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Sprint through a 3-lane futuristic cyber track. Steer through correct C++, Python, and JS syntax gateway portals to rack up multiplier streaks.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPlayingCodeRunner(true)}
            className="mt-5 btn btn-secondary py-2.5 text-xs font-mono flex items-center justify-center gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>LAUNCH 3D RUNNER</span>
          </button>
        </Card>
      </div>

      {/* ── MULTI-CRITERIA FILTERING & SEARCH CONTROLS ── */}
      <Card className="p-5 border-line bg-graphite/95 space-y-4">
        {/* Search Bar & Sorter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 50 games by title, algorithm, topic, or objective..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-obsidian border border-line rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-ivory placeholder:text-muted/60 focus:border-gold-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ivory"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-muted flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-gold-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recommended' | 'difficulty' | 'duration' | 'xp' | 'title')}
              className="bg-obsidian border border-line rounded-lg px-2.5 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="recommended">Curriculum Recommended</option>
              <option value="difficulty">Difficulty (Low to High)</option>
              <option value="xp">Highest XP Reward</option>
              <option value="duration">Estimated Duration</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 8-Subject Taxonomy Filter Tabs */}
        <div className="space-y-1.5 pt-1 border-t border-line/60">
          <div className="text-[10px] font-mono uppercase text-muted tracking-wider">
            Subject Taxonomy (A - H):
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedTopic('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-gold-400 text-obsidian font-bold shadow-[0_0_10px_rgba(208,180,119,0.4)]'
                  : 'bg-obsidian border border-line text-muted hover:text-ivory'
              }`}
            >
              All Subjects ({CATALOG_GAMES.length})
            </button>
            {SUBJECT_TAXONOMY.map((subj) => {
              const Icon = SUBJECT_ICON_MAP[subj.id];
              const count = CATALOG_GAMES.filter((g) => g.subjectId === subj.id).length;
              const isSelected = selectedSubject === subj.id;
              return (
                <button
                  key={subj.id}
                  onClick={() => {
                    setSelectedSubject(subj.id);
                    setSelectedTopic('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gold-400 text-obsidian font-bold shadow-[0_0_10px_rgba(208,180,119,0.4)]'
                      : 'bg-obsidian border border-line text-muted hover:text-ivory'
                  }`}
                  title={subj.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{subj.code}: {subj.name.split(' ')[0]} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Grained Dropdowns (Topic, Difficulty, Duration, Mechanics, Status) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-line/60">
          {/* Topic Dropdown */}
          <div>
            <label className="block text-[9px] font-mono text-muted mb-1 uppercase">Topic Area</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-obsidian border border-line rounded-lg px-2 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <label className="block text-[9px] font-mono text-muted mb-1 uppercase">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as 'all' | GameDifficulty)}
              className="w-full bg-obsidian border border-line rounded-lg px-2 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          {/* Duration Dropdown */}
          <div>
            <label className="block text-[9px] font-mono text-muted mb-1 uppercase">Duration</label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value as 'all' | DurationCategory)}
              className="w-full bg-obsidian border border-line rounded-lg px-2 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Durations</option>
              <option value="< 5 min">&lt; 5 min</option>
              <option value="5-10 min">5 - 10 min</option>
              <option value="> 10 min">&gt; 10 min</option>
            </select>
          </div>

          {/* Mechanics Family */}
          <div>
            <label className="block text-[9px] font-mono text-muted mb-1 uppercase">Game Mechanics</label>
            <select
              value={selectedMechanics}
              onChange={(e) => setSelectedMechanics(e.target.value as 'all' | MechanicsFamily)}
              className="w-full bg-obsidian border border-line rounded-lg px-2 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Mechanics</option>
              <option value="syntax-debug">Syntax & Debugging</option>
              <option value="algo-trace">Algorithm Tracing</option>
              <option value="code-assembly">Code Assembly (Parsons)</option>
              <option value="pattern-logic">Pattern Logic & Circuits</option>
              <option value="systems-sim">Systems Simulation</option>
              <option value="ai-math">AI & Math Sliders</option>
              <option value="ds-manipulation">Data Structure Stack</option>
              <option value="spatial-visual">Spatial & Visual</option>
            </select>
          </div>

          {/* Mastery Status */}
          <div>
            <label className="block text-[9px] font-mono text-muted mb-1 uppercase">Mastery Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'played' | 'unplayed')}
              className="w-full bg-obsidian border border-line rounded-lg px-2 py-1.5 text-xs font-mono text-ivory focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unplayed">Unplayed Only</option>
              <option value="played">Mastered (Completed)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── 50-GAMES CATALOG GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-muted">
          <span>
            Displaying <strong className="text-ivory font-bold">{filteredGames.length}</strong> learning games
          </span>
          {(searchQuery || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedDifficulty !== 'all' || selectedMechanics !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedTopic('all');
                setSelectedDifficulty('all');
                setSelectedDuration('all');
                setSelectedMechanics('all');
                setSelectedStatus('all');
              }}
              className="text-gold-400 hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {filteredGames.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-graphite/40 border border-line rounded-2xl">
            <Filter className="w-8 h-8 text-muted mx-auto" />
            <h4 className="font-display font-semibold text-ivory text-base">No learning games matched your filter criteria</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Try resetting subject, mechanics, or search keywords to view the broader curriculum.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => {
              const completed = isGameCompleted(game.id);
              const SubjIcon = SUBJECT_ICON_MAP[game.subjectId];

              return (
                <Card
                  key={game.id}
                  className="p-5 border-line bg-graphite/90 hover:border-gold-400/50 hover:bg-graphite transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Top Row: Subject & Status */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-gold-400/30 bg-gold-400/10 text-gold-400 flex items-center gap-1">
                        <SubjIcon className="w-3 h-3" />
                        CS-{game.subjectId}: {game.topic}
                      </span>

                      {completed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> MASTERED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {game.duration}
                        </span>
                      )}
                    </div>

                    {/* Title, Visual Identity Logo & Description */}
                    <div className="flex items-start gap-3">
                      <GameLogo
                        gameId={game.id}
                        subjectId={game.subjectId}
                        mechanics={game.mechanicsFamily}
                        size="md"
                        className="shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-bold text-sm text-ivory group-hover:text-gold-400 transition-colors line-clamp-1">
                          {game.title}
                        </h4>
                        <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-obsidian border border-line text-[9px] font-mono text-cyan-300">
                        {game.mechanicsLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-obsidian border border-line text-[9px] font-mono text-muted">
                        {game.difficulty}
                      </span>
                      {game.curriculumTags[0] && (
                        <span className="px-2 py-0.5 rounded bg-obsidian border border-line text-[9px] font-mono text-gold-400/80">
                          {game.curriculumTags[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-gold-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-gold-400" />
                      +{game.xpReward} XP
                    </span>

                    <button
                      onClick={() => setSelectedCatalogGame(game)}
                      className={`btn text-xs py-1.5 px-3 font-mono flex items-center gap-1.5 ${
                        completed ? 'btn-secondary text-muted hover:text-ivory' : 'btn-primary shadow-[0_0_12px_rgba(208,180,119,0.2)]'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{completed ? 'Replay' : 'Play Challenge'}</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── INTERACTIVE GAME MODAL RUNNER ── */}
      {selectedCatalogGame && (
        <InteractiveGameModal
          game={selectedCatalogGame}
          onClose={() => setSelectedCatalogGame(null)}
          onComplete={() => handleGameCompleted(selectedCatalogGame.id)}
        />
      )}
    </div>
  );
}
