import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  Globe,
  Palette,
  RotateCcw,
  Sparkles,
  Terminal,
  Zap,
  Atom,
  Binary,
  Layers,
  Award,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { ACADEMIC_SUBJECTS, type AcademicSubject, type AcademicTopic } from '@/data/academicQuizzes';
import { quizXpRules } from '@/engine/xpRules';
import { useStudentProfiles } from '@/students/StudentProfileContext';
import type { QuizAttempt, QuizQuestion } from '@/types';
import type { NavigateProps } from './types';

// Map icon strings to Lucide components
const SUBJECT_ICONS: Record<string, typeof Cpu> = {
  Cpu,
  Globe,
  Palette,
  Terminal,
  Sigma: Binary,
  Atom,
};

export function DailyQuizPage({ navigate }: NavigateProps) {
  const { selectedStudent, submitDailyQuiz } = useStudentProfiles();

  // Navigation state within categorized quiz system
  const [selectedSubject, setSelectedSubject] = useState<AcademicSubject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<AcademicTopic | null>(null);

  // Quiz Runner state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizAttempt | null>(null);

  const activeQuestions: QuizQuestion[] = useMemo(() => {
    return selectedTopic ? selectedTopic.questions : [];
  }, [selectedTopic]);

  const currentQuestion = activeQuestions[questionIndex];

  // Start a specific topic quiz
  const handleSelectTopic = (topic: AcademicTopic) => {
    setSelectedTopic(topic);
    setQuestionIndex(0);
    setAnswers(topic.questions.map(() => -1));
    setError('');
    setResult(null);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setAnswers((prev) =>
      prev.map((ans, idx) => (idx === questionIndex ? optionIndex : ans))
    );
    setError('');
  };

  const handleNext = () => {
    if (answers[questionIndex] === -1) {
      setError('Please select an option before continuing.');
      return;
    }
    if (questionIndex === activeQuestions.length - 1) {
      handleSubmit();
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    setError('');
  };

  const handleSubmit = () => {
    if (answers[questionIndex] === -1) {
      setError('Please select an option before continuing.');
      return;
    }
    if (!selectedTopic) return;

    const quizId = `academic-quiz-${selectedSubject?.id}-${selectedTopic.id}`;
    const submission = submitDailyQuiz(quizId, activeQuestions, answers);
    setResult(submission.attempt);
  };

  const handleRestartQuiz = () => {
    if (!selectedTopic) return;
    setQuestionIndex(0);
    setAnswers(selectedTopic.questions.map(() => -1));
    setError('');
    setResult(null);
  };

  const resetToSubjects = () => {
    setSelectedSubject(null);
    setSelectedTopic(null);
    setResult(null);
  };

  const resetToTopics = () => {
    setSelectedTopic(null);
    setResult(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="B.Tech Academic Quizzes"
        subtitle="Subject-wise engineering syllabus assessments with verified Academic XP rewards."
      />

      {/* Breadcrumb Navigation Bar */}
      <nav className="flex items-center gap-2 text-xs font-mono text-muted flex-wrap pb-2 border-b border-line">
        <button
          onClick={resetToSubjects}
          className={`hover:text-gold-400 transition-colors flex items-center gap-1.5 ${
            !selectedSubject ? 'text-gold-400 font-bold' : ''
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>All Subjects</span>
        </button>

        {selectedSubject && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-line-light" />
            <button
              onClick={resetToTopics}
              className={`hover:text-gold-400 transition-colors ${
                !selectedTopic ? 'text-gold-400 font-bold' : ''
              }`}
            >
              {selectedSubject.name}
            </button>
          </>
        )}

        {selectedTopic && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-line-light" />
            <span className="text-ivory font-bold">{selectedTopic.name}</span>
          </>
        )}
      </nav>

      {/* LEVEL 1: SUBJECT SELECTION */}
      {!selectedSubject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-ivory">
              Select Curriculum Subject (B.Tech First-Year & Core)
            </h2>
            <span className="text-xs font-mono text-gold-400">
              {ACADEMIC_SUBJECTS.length} Subjects Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const IconComp = SUBJECT_ICONS[subject.iconName] || Cpu;
              const totalQuestions = subject.topics.reduce(
                (sum, t) => sum + t.questions.length,
                0
              );

              return (
                <Card
                  key={subject.id}
                  className="group relative cursor-pointer border-line hover:border-gold-400/60 bg-graphite hover:bg-elevated/70 transition-all duration-200 overflow-hidden p-5 flex flex-col justify-between"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ backgroundColor: subject.accentColor }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-line bg-obsidian text-ivory group-hover:scale-105 transition-transform"
                        style={{ color: subject.accentColor }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-line bg-obsidian/60 text-muted">
                        {subject.code}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-ivory group-hover:text-gold-300 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {subject.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-muted flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gold-400" />
                      {subject.topics.length} Topics · {totalQuestions} Qs
                    </span>
                    <span className="text-gold-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 2: TOPIC SELECTION */}
      {selectedSubject && !selectedTopic && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={resetToSubjects}
                className="text-xs font-mono text-muted hover:text-gold-400 transition-colors inline-flex items-center gap-1 mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Subjects
              </button>
              <h2 className="text-lg font-display font-bold text-ivory">
                {selectedSubject.name} — Core Topics
              </h2>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-elevated border border-line text-gold-400">
              {selectedSubject.syllabus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedSubject.topics.map((topic) => (
              <Card
                key={topic.id}
                className="group cursor-pointer border-line hover:border-gold-400/80 bg-graphite hover:bg-elevated transition-all p-5 flex flex-col justify-between"
                onClick={() => handleSelectTopic(topic)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        topic.difficulty === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : topic.difficulty === 'Intermediate'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {topic.difficulty}
                    </span>
                    <span className="text-xs font-mono text-muted flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      {topic.questions.length} Questions
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base text-ivory group-hover:text-gold-300 transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs font-mono">
                  <span className="text-gold-400 flex items-center gap-1 font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    +{topic.questions.length * quizXpRules.correctAnswer + quizXpRules.completion} Max XP
                  </span>
                  <span className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1 group-hover:scale-105 transition-transform">
                    Start Topic <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 3: ACTIVE QUIZ RUNNER OR RESULTS */}
      {selectedTopic && (
        <div className="max-w-3xl mx-auto space-y-4">
          <button
            onClick={resetToTopics}
            className="text-xs font-mono text-muted hover:text-gold-400 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Switch Topic ({selectedSubject?.name})
          </button>

          {/* RESULTS VIEW */}
          {result ? (
            <Card className="p-6 sm:p-8 border-gold-400/40 bg-graphite text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-gold-400/10 border-2 border-gold-400 flex items-center justify-center mx-auto text-gold-400 shadow-[0_0_30px_rgba(208,180,119,0.3)]">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-bold">
                  TOPIC ASSESSMENT COMPLETE
                </span>
                <h2 className="font-display text-2xl font-bold text-ivory mt-1">
                  {selectedTopic.name}
                </h2>
                <p className="text-xs text-muted mt-1">
                  {selectedSubject?.name} · {selectedSubject?.code}
                </p>
              </div>

              {/* Score Breakdown Pill */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-3 rounded-xl border border-line bg-obsidian font-mono">
                <div>
                  <p className="text-[10px] text-muted">SCORE</p>
                  <p className="text-lg font-bold text-ivory">
                    {result.score}/{result.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">ACCURACY</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {Math.round((result.score / result.totalQuestions) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">ACADEMIC XP</p>
                  <p className="text-lg font-bold text-gold-400">
                    +{result.xpAwarded} XP
                  </p>
                </div>
              </div>

              {/* Question Review Section */}
              <div className="space-y-3 text-left pt-4 border-t border-line">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  Detailed Answer Review
                </h4>
                {activeQuestions.map((q, idx) => {
                  const userAnswer = answers[idx];
                  const isCorrect = userAnswer === q.correctOptionIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-crimson-500/30 bg-crimson-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs text-muted">Q{idx + 1}.</span>
                        <p className="text-xs font-medium text-ivory flex-1">{q.prompt}</p>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isCorrect ? 'text-emerald-400' : 'text-crimson-400'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-2 pl-4 border-l-2 border-line">
                        <strong className="text-ivory">Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleRestartQuiz}
                  className="btn btn-secondary px-5 py-2.5 text-xs flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Topic
                </button>
                <button
                  onClick={resetToTopics}
                  className="btn btn-primary px-6 py-2.5 text-xs flex items-center gap-2"
                >
                  Next Topic <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ) : (
            /* ACTIVE QUESTION VIEW */
            <Card className="overflow-hidden p-0 border-line bg-graphite">
              {/* Header with Progress Bar */}
              <div className="border-b border-line bg-elevated px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-semibold">
                      {selectedSubject?.name}
                    </span>
                    <h3 className="font-display text-lg font-bold text-ivory mt-0.5">
                      {selectedTopic.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted">
                    <Clock3 className="w-4 h-4 text-gold-400" />
                    Question {questionIndex + 1} of {activeQuestions.length}
                  </div>
                </div>

                {/* Animated Progress Track */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-obsidian overflow-hidden">
                    <div
                      className="h-full bg-gold-400 transition-all duration-300"
                      style={{
                        width: `${((questionIndex + 1) / activeQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-gold-400">
                    {Math.round(((questionIndex + 1) / activeQuestions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div className="px-5 py-7 sm:px-7 sm:py-8 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="badge bg-gold-400/10 text-gold-400 text-[10px] font-mono">
                    {currentQuestion.topic}
                  </span>
                  <span className="badge bg-elevated text-muted text-[10px] font-mono">
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <h4 className="text-xl font-display font-medium text-ivory leading-snug">
                  {currentQuestion.prompt}
                </h4>

                {/* Option Buttons */}
                <div className="grid gap-2.5">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = answers[questionIndex] === optIdx;

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectAnswer(optIdx)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/15 text-ivory shadow-[0_0_15px_rgba(208,180,119,0.15)]'
                            : 'border-line bg-obsidian/60 text-muted hover:border-line-light hover:text-ivory'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold ${
                            isSelected
                              ? 'border-gold-400 bg-gold-400 text-obsidian'
                              : 'border-line bg-graphite text-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 text-xs sm:text-sm font-sans">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p className="text-xs text-crimson-400 font-mono" role="alert">
                    {error}
                  </p>
                )}

                {/* Navigation Footer */}
                <div className="pt-4 border-t border-line flex items-center justify-between">
                  <button
                    onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={questionIndex === 0}
                    className="btn btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    onClick={handleNext}
                    className="btn btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
                  >
                    {questionIndex === activeQuestions.length - 1
                      ? 'Submit Quiz'
                      : 'Next Question'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
