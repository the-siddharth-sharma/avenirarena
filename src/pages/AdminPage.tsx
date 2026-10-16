import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  BrainCircuit,
  PlusCircle,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Search,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useAuth, ADMIN_EMAIL } from '@/context/AuthContext';
import { firestoreService, type UserProfileDoc, type QuizDoc } from '@/firebaseConfig';

interface AdminPageProps {
  navigate: (path: string) => void;
}

const PRESET_SUBJECTS = [
  'C++',
  'HTML',
  'Engineering Mathematics',
  'Computer Systems & Architecture',
  'Data Structures & Algorithms',
  'Custom Subject',
];

export function AdminPage({ navigate }: AdminPageProps) {
  const { currentUser, isAdmin } = useAuth();

  const isSessionAdmin =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('avenir_admin_session') === 'true';

  const isAuthorized = isAdmin || isSessionAdmin;

  // Enforce strict RBAC redirect
  useEffect(() => {
    if (!isAuthorized) {
      console.warn('[AVENIR ARENA RBAC] Unauthorized access attempt to /admin. Redirecting to dashboard.');
      navigate('/dashboard');
    }
  }, [isAuthorized, navigate]);

  const [activeTab, setActiveTab] = useState<'users' | 'quizzes' | 'system'>('users');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Directory State
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Quiz Manager State
  const [quizzes, setQuizzes] = useState<QuizDoc[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Quiz Form State
  const [subject, setSubject] = useState('C++');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Maintenance State
  const [clearingCache, setClearingCache] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const allUsers = await firestoreService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Quizzes
  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const allQuizzes = await firestoreService.getQuizzes();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
      fetchQuizzes();
    }
  }, [isAuthorized]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('avenir_admin_session');
    sessionStorage.removeItem('avenir_admin_email');
    navigate('/dashboard');
  };

  // Quiz form option change helper
  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev] as [string, string, string, string];
      next[index] = value;
      return next;
    });
  };

  // Submit new Quiz Question
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const resolvedSubject = subject === 'Custom Subject' ? customSubject.trim() : subject;

    if (!resolvedSubject) {
      setFormError('Please select or specify an academic subject.');
      return;
    }

    if (!topic.trim()) {
      setFormError('Please provide a specific syllabus topic (e.g., Pointers, Semantics).');
      return;
    }

    if (!questionText.trim() || questionText.trim().length < 10) {
      setFormError('Question text must be at least 10 characters.');
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      setFormError('All 4 answer options (A, B, C, D) are required.');
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      await firestoreService.createQuiz({
        subject: resolvedSubject,
        topic: topic.trim(),
        questionText: questionText.trim(),
        options: options.map((o) => o.trim()),
        correctOptionIndex,
        createdBy: currentUser?.email || ADMIN_EMAIL,
      });

      // Reset form
      setTopic('');
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      if (subject === 'Custom Subject') setCustomSubject('');

      showToast('Academic question published to Firestore arena successfully!');
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to create quiz:', err);
      setFormError('An error occurred while publishing the quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this academic question from Firestore?')) {
      return;
    }

    try {
      await firestoreService.deleteQuiz(quizId);
      showToast('Question purged from Firestore.');
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  // Maintenance Cache Flush
  const handleFlushCache = () => {
    setClearingCache(true);
    setTimeout(() => {
      setClearingCache(false);
      showToast('Platform caches and temporary memory buffers flushed.');
    }, 600);
  };

  // Filtered users for data grid
  const filteredUsers = users.filter((u) => {
    if (!userSearchTerm.trim()) return true;
    const term = userSearchTerm.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.campus.toLowerCase().includes(term)
    );
  });

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      {/* Top Admin Security Notice Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
                RESTRICTED ADMIN COMMAND CENTER
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                SECURITY LEVEL 5
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              Authorized Root Account: <strong className="text-ivory">{ADMIN_EMAIL}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-1 sm:flex-initial"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Arena
          </button>
          <button
            onClick={handleLogoutAdmin}
            className="btn text-xs px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 flex items-center gap-1.5 flex-1 sm:flex-initial"
          >
            <LogOut className="w-3.5 h-3.5" /> End Session
          </button>
        </div>
      </div>

      <PageHeader
        title="Admin Mainframe Portal"
        subtitle="Live Firestore cadet directory, academic curriculum quiz management, and system operations."
      />

      {toastMessage && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-mono shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tab Navigation Navigation Controls */}
      <div className="flex border-b border-line gap-2 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-gold-400 text-gold-400 font-bold bg-gold-400/5'
              : 'border-transparent text-muted hover:text-ivory'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs border-b-2 transition-all ${
            activeTab === 'quizzes'
              ? 'border-gold-400 text-gold-400 font-bold bg-gold-400/5'
              : 'border-transparent text-muted hover:text-ivory'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Quiz Management ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs border-b-2 transition-all ${
            activeTab === 'system'
              ? 'border-gold-400 text-gold-400 font-bold bg-gold-400/5'
              : 'border-transparent text-muted hover:text-ivory'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Telemetry & System Health</span>
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY DATA GRID */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Filter cadet records by name, username, or campus..."
                className="w-full pl-9 pr-3 py-2 bg-obsidian border border-line rounded-lg text-xs font-mono text-ivory placeholder-muted focus:outline-none focus:border-gold-400"
              />
            </div>

            <button
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 self-end"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              Refresh Registry
            </button>
          </div>

          <Card className="p-0 overflow-hidden border-line bg-graphite">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-line bg-elevated/60 text-muted uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Cadet / Operative</th>
                    <th className="py-3 px-4">Callsign</th>
                    <th className="py-3 px-4">Campus Sector</th>
                    <th className="py-3 px-4 text-right">Academic XP</th>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4 text-center">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const fullName =
                        user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username || user.email;

                      return (
                        <tr key={user.uid} className="hover:bg-elevated/40 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-gold-400/30 overflow-hidden bg-obsidian shrink-0">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-gold-400">
                                  {fullName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-ivory">{fullName}</p>
                              <p className="text-[10px] text-muted">{user.email}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-gold-400">
                            @{user.username || 'unregistered'}
                          </td>

                          <td className="py-3 px-4 text-muted">{user.campus}</td>

                          <td className="py-3 px-4 text-right font-bold text-ivory">
                            {user.xp?.toLocaleString() || 0} XP
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                user.role === 'admin'
                                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                  : 'bg-gold-400/10 border-gold-400/30 text-gold-400'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-muted">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => navigate(`/player/${user.uid}`)}
                              className="p-1 rounded text-muted hover:text-gold-400 hover:bg-obsidian transition-colors"
                              title="Inspect Public Dossier"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        No registered cadets match the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: QUIZ MANAGEMENT */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Academic Question Creator */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 border-line bg-graphite space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <PlusCircle className="w-4 h-4 text-gold-400" />
                <h3 className="font-display font-semibold text-ivory text-sm">
                  Publish Academic Question
                </h3>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-xs font-mono">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateQuiz} className="space-y-3.5 text-xs">
                {/* Subject Dropdown */}
                <div>
                  <label className="block font-mono text-muted mb-1">Academic Subject *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-obsidian border border-line text-ivory font-mono focus:outline-none focus:border-gold-400"
                  >
                    {PRESET_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub} className="bg-obsidian text-ivory">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {subject === 'Custom Subject' && (
                  <div>
                    <label className="block font-mono text-muted mb-1">Custom Subject Name *</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. Operating Systems"
                      className="w-full p-2.5 rounded-lg bg-obsidian border border-line text-ivory font-mono focus:outline-none focus:border-gold-400"
                    />
                  </div>
                )}

                {/* Topic */}
                <div>
                  <label className="block font-mono text-muted mb-1">Syllabus Topic *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Pointers, Memory Allocation, Semantics"
                    className="w-full p-2.5 rounded-lg bg-obsidian border border-line text-ivory font-mono focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Question Text */}
                <div>
                  <label className="block font-mono text-muted mb-1">Question Prompt *</label>
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the full question prompt clearly..."
                    className="w-full p-2.5 rounded-lg bg-obsidian border border-line text-ivory font-sans focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* 4 Options */}
                <div className="space-y-2 pt-1">
                  <label className="block font-mono text-muted">
                    Options & Correct Answer Selection *
                  </label>
                  <p className="text-[11px] text-muted font-mono mb-2">
                    Click the radio indicator beside the option that represents the correct answer.
                  </p>

                  {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                    <div
                      key={letter}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        correctOptionIndex === idx
                          ? 'bg-emerald-950/20 border-emerald-500/50'
                          : 'bg-obsidian border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`option-${idx}`}
                        name="correctOption"
                        checked={correctOptionIndex === idx}
                        onChange={() => setCorrectOptionIndex(idx)}
                        className="accent-gold-400 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-gold-400 w-5">{letter}.</span>
                      <input
                        type="text"
                        value={options[idx]}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${letter} text...`}
                        className="flex-1 bg-transparent border-none text-ivory text-xs focus:outline-none"
                      />
                      {correctOptionIndex === idx && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          CORRECT
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingQuiz}
                  className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 font-mono shadow-[0_0_15px_rgba(208,180,119,0.25)]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {isSubmittingQuiz ? 'Publishing to Firestore...' : 'Publish Question to Arena'}
                </button>
              </form>
            </Card>
          </div>

          {/* Right Table: Active Firestore Quizzes */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400" />
                <h3 className="font-display font-semibold text-ivory text-sm">
                  Active Arena Quizzes ({quizzes.length})
                </h3>
              </div>

              <button
                onClick={fetchQuizzes}
                disabled={isLoadingQuizzes}
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuizzes ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {quizzes.length > 0 ? (
                quizzes.map((q, idx) => (
                  <Card key={q.id} className="p-4 border-line bg-graphite space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gold-400/10 border border-gold-400/30 text-gold-400 font-bold">
                            {q.subject}
                          </span>
                          <span className="text-muted font-mono text-[11px]">• {q.topic}</span>
                        </div>
                        <h4 className="font-semibold text-ivory text-sm mt-1.5">
                          {idx + 1}. {q.questionText}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteQuiz(q.id)}
                        className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        title="Delete Question from Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-obsidian border-line text-muted'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}.</span>
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-line/40 font-mono">
                      <span>Created by: {q.createdBy}</span>
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-12 text-center text-muted font-mono border border-dashed border-line rounded-xl">
                  No academic questions found in Firestore. Use the form to publish the first question.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TELEMETRY & SYSTEM MAINTENANCE */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-line bg-graphite flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase">Active Cadets</p>
                <p className="text-xl font-bold font-mono text-ivory mt-0.5">{users.length}</p>
              </div>
            </Card>

            <Card className="p-4 border-line bg-graphite flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase">Curriculum Quizzes</p>
                <p className="text-xl font-bold font-mono text-ivory mt-0.5">{quizzes.length}</p>
              </div>
            </Card>

            <Card className="p-4 border-line bg-graphite flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase">Total Arena XP</p>
                <p className="text-xl font-bold font-mono text-ivory mt-0.5">
                  {users.reduce((acc, u) => acc + (u.xp || 0), 0).toLocaleString()} XP
                </p>
              </div>
            </Card>

            <Card className="p-4 border-line bg-graphite flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase">Mainframe Nodes</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">99.98% Live</p>
              </div>
            </Card>
          </div>

          <Card className="p-5 border-line bg-graphite space-y-4">
            <h3 className="font-display font-semibold text-ivory text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-400" />
              Engine Operations & Memory Flushing
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-line bg-obsidian space-y-1">
                <p className="text-ivory font-semibold">Engine Telemetry</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted pt-1">
                  <div>• Firestore Service: <span className="text-emerald-400">Connected</span></div>
                  <div>• Role-Based Access: <span className="text-emerald-400">Strict Enforced</span></div>
                  <div>• Google OAuth 2.0: <span className="text-emerald-400">Active</span></div>
                  <div>• Code Runner 3D: <span className="text-emerald-400">60 FPS Standby</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-line bg-obsidian space-y-2">
                <p className="text-ivory font-semibold">Maintenance Tools</p>
                <p className="text-[11px] text-muted">
                  Flush transient local caches and re-synchronize student profiles.
                </p>
                <button
                  onClick={handleFlushCache}
                  disabled={clearingCache}
                  className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${clearingCache ? 'animate-spin' : ''}`} />
                  {clearingCache ? 'Flushing System Cache...' : 'Flush Transient Memory Cache'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
