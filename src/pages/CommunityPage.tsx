import { useState, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Gamepad2,
  Heart,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Sparkles,
  Swords,
  Terminal,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { GamePlayerAvatar } from '@/components/game-core';

export interface ChallengeInvite {
  id: string;
  type: 'coderunner' | 'codehouse' | 'quiz';
  title: string;
  targetScoreOrTopic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  route: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  username: string;
  avatarUrl: string;
  campus: string;
  timestamp: string;
  content: string;
  challenge?: ChallengeInvite;
  reactions: {
    flame: number;
    code: number;
    zap: number;
    heart: number;
  };
  userReactions?: Record<string, boolean>;
}

const PRESET_CHALLENGES: ChallengeInvite[] = [
  {
    id: 'ch-coderunner-1',
    type: 'coderunner',
    title: 'Code Runner 3D — Syntax Sprint Challenge',
    targetScoreOrTopic: 'Target: 1,450+ Points without crashing',
    difficulty: 'Intermediate',
    xpReward: 120,
    route: '/games',
  },
  {
    id: 'ch-codehouse-2',
    type: 'codehouse',
    title: 'The Code House — Floor 2 Memory Vault',
    targetScoreOrTopic: 'Find all 4 hidden C++ fragments under 90s',
    difficulty: 'Advanced',
    xpReward: 180,
    route: '/games',
  },
  {
    id: 'ch-quiz-pointers',
    type: 'quiz',
    title: 'C++ Systems Quiz — Pointers & Memory',
    targetScoreOrTopic: 'Score 100% on 3 Pointer Arithmetic Questions',
    difficulty: 'Intermediate',
    xpReward: 90,
    route: '/quiz',
  },
  {
    id: 'ch-quiz-matrices',
    type: 'quiz',
    title: 'Engineering Mathematics — Eigenvalue Duel',
    targetScoreOrTopic: 'Score 100% on Characteristic Polynomials',
    difficulty: 'Advanced',
    xpReward: 100,
    route: '/quiz',
  },
];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: 'Alex Chen',
    username: 'alex_chen',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    campus: 'Mirai Ghaziabad',
    timestamp: '14 minutes ago',
    content:
      'Just cleared Floor 3 in The Code House! Make sure to watch out for the moving shadows near the library terminal. Dropping a challenge invite for anyone trying to beat my gate speed in Code Runner 3D.',
    challenge: PRESET_CHALLENGES[0],
    reactions: { flame: 18, code: 12, zap: 9, heart: 5 },
  },
  {
    id: 'post-2',
    authorName: 'Rhea Kapoor',
    username: 'rhea_k',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    campus: 'Mirai Bangalore',
    timestamp: '1 hour ago',
    content:
      'Pro-tip for first-year B.Tech cadets taking the C++ Pointers module: remember that `*(arr + i)` is mathematically identical to `arr[i]`. Try this quiz challenge to test your pointer arithmetic under pressure!',
    challenge: PRESET_CHALLENGES[2],
    reactions: { flame: 24, code: 31, zap: 15, heart: 8 },
  },
  {
    id: 'post-3',
    authorName: 'Marcus Vance',
    username: 'marcus_v',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    campus: 'Mirai Jaipur',
    timestamp: '3 hours ago',
    content:
      'Currently maintaining a 16-day Infinite Trace streak on the Left Navigation bar and Dashboard. The kinetic feedback loop is addictive. Who else is in the 10+ day club?',
    reactions: { flame: 42, code: 8, zap: 27, heart: 14 },
  },
];

interface CommunityPageProps {
  navigate: (path: string) => void;
}

export function CommunityPage({ navigate }: CommunityPageProps) {
  const { currentUser, userProfile } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('avenir_community_feed_v1');
        if (stored) return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    return INITIAL_POSTS;
  });

  const [filter, setFilter] = useState<'all' | 'challenges' | 'general'>('all');
  const [newContent, setNewContent] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeInvite | null>(null);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeAuthor = useMemo(() => {
    const fullName =
      userProfile?.firstName && userProfile?.lastName
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : currentUser?.displayName || 'Operative';
    return {
      name: fullName,
      username: userProfile?.username || 'operative',
      avatarUrl: userProfile?.avatarUrl || currentUser?.photoURL || '',
      campus: userProfile?.campus || 'Mirai Ghaziabad',
    };
  }, [userProfile, currentUser]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: activeAuthor.name,
      username: activeAuthor.username,
      avatarUrl: activeAuthor.avatarUrl,
      campus: activeAuthor.campus,
      timestamp: 'Just now',
      content: newContent.trim(),
      challenge: selectedChallenge || undefined,
      reactions: { flame: 1, code: 0, zap: 0, heart: 0 },
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    setNewContent('');
    setSelectedChallenge(null);
    setShowChallengePicker(false);

    try {
      localStorage.setItem('avenir_community_feed_v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleToggleReaction = (postId: string, key: 'flame' | 'code' | 'zap' | 'heart') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const userReactions = p.userReactions || {};
        const isReacted = Boolean(userReactions[key]);

        const nextReactions = {
          ...p.reactions,
          [key]: isReacted ? Math.max(0, p.reactions[key] - 1) : p.reactions[key] + 1,
        };

        return {
          ...p,
          reactions: nextReactions,
          userReactions: {
            ...userReactions,
            [key]: !isReacted,
          },
        };
      })
    );
  };

  const handleCopyChallenge = (post: CommunityPost) => {
    if (typeof window !== 'undefined' && post.challenge) {
      const inviteUrl = `${window.location.origin}/#community?invite=${post.challenge.id}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'challenges') return Boolean(p.challenge);
    if (filter === 'general') return !p.challenge;
    return true;
  });

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Engineering Community Hub"
        subtitle="Live cross-campus transmission feed, peer study threads, and multiplayer challenge invites."
      />

      {/* Online Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Cadets Online</p>
            <p className="text-sm font-bold font-mono text-ivory">482 Cadets</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Active Invites</p>
            <p className="text-sm font-bold font-mono text-gold-400">38 Challenges</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Max Trace Streak</p>
            <p className="text-sm font-bold font-mono text-cyan-400">24 Days</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted uppercase">Mesh Status</p>
            <p className="text-sm font-bold font-mono text-emerald-400">3 Campuses Sync</p>
          </div>
        </div>
      </div>

      {/* Broadcast Transmission Composer */}
      <Card className="p-5 border-gold-400/40 bg-graphite shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gold-400/40 overflow-hidden bg-obsidian shrink-0">
            {activeAuthor.avatarUrl ? (
              <img
                src={activeAuthor.avatarUrl}
                alt={activeAuthor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-gold-400">
                {activeAuthor.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-ivory flex items-center gap-2">
              Broadcast to Arena Comms
              <span className="text-[10px] font-mono text-gold-400 font-normal">
                @{activeAuthor.username}
              </span>
            </p>
            <p className="text-[10px] text-muted font-mono">{activeAuthor.campus}</p>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share code insights, ask B.Tech questions, or challenge peers..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-obsidian text-ivory text-xs placeholder:text-muted/60 focus:border-gold-400 focus:outline-none resize-none leading-relaxed font-sans"
          />

          {/* Attached Challenge Preview */}
          {selectedChallenge && (
            <div className="p-3 rounded-xl border border-gold-400/50 bg-gold-400/10 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Swords className="w-4 h-4 text-gold-400 shrink-0" />
                <div>
                  <p className="font-bold text-ivory">{selectedChallenge.title}</p>
                  <p className="text-[11px] text-gold-300 font-mono">
                    {selectedChallenge.targetScoreOrTopic} · +{selectedChallenge.xpReward} XP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChallenge(null)}
                className="text-xs font-mono text-muted hover:text-red-400 px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-line flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowChallengePicker(!showChallengePicker)}
              className="text-xs font-mono text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-gold-400/30 bg-gold-400/5 hover:bg-gold-400/10"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{selectedChallenge ? 'Change Challenge' : 'Attach Game/Quiz Invite'}</span>
            </button>

            <button
              type="submit"
              disabled={!newContent.trim()}
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.25)] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Transmission</span>
            </button>
          </div>

          {/* Challenge Selector Drawer */}
          {showChallengePicker && (
            <div className="p-3 rounded-xl border border-line bg-obsidian space-y-2 mt-2 animate-fade-in">
              <p className="text-[11px] font-mono uppercase text-muted font-bold">
                Select Rich Challenge Invite Card:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_CHALLENGES.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setSelectedChallenge(ch);
                      setShowChallengePicker(false);
                    }}
                    className="p-2.5 rounded-lg border border-line hover:border-gold-400/70 bg-graphite hover:bg-elevated text-left transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gold-400/10 text-gold-400 font-bold uppercase">
                        {ch.type}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        +{ch.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ivory">{ch.title}</p>
                    <p className="text-[10px] text-muted truncate mt-0.5">
                      {ch.targetScoreOrTopic}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Feed Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-gold-400 text-obsidian font-bold'
              : 'text-muted hover:text-ivory'
          }`}
        >
          All Transmissions ({posts.length})
        </button>
        <button
          onClick={() => setFilter('challenges')}
          className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'challenges'
              ? 'bg-gold-400 text-obsidian font-bold'
              : 'text-muted hover:text-ivory'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Game & Quiz Challenges</span>
        </button>
        <button
          onClick={() => setFilter('general')}
          className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'general'
              ? 'bg-gold-400 text-obsidian font-bold'
              : 'text-muted hover:text-ivory'
          }`}
        >
          Study Lounge
        </button>
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            className="p-5 border-line bg-graphite hover:border-line-light transition-all space-y-3.5"
          >
            {/* Post Author Info */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/player/${post.username}`)}
              >
                <div className="w-10 h-10 rounded-full border border-line group-hover:border-gold-400 overflow-hidden bg-obsidian shrink-0 transition-colors">
                  <img
                    src={post.avatarUrl}
                    alt={post.authorName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-ivory group-hover:text-gold-300 transition-colors">
                      {post.authorName}
                    </p>
                    <span className="text-[10px] font-mono text-muted">@{post.username}</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted">{post.campus}</p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-muted">{post.timestamp}</span>
            </div>

            {/* Post Content */}
            <p className="text-xs sm:text-sm text-ivory/90 leading-relaxed font-sans">
              {post.content}
            </p>

            {/* Rich Embed Card for Game/Quiz Challenge */}
            {post.challenge && (
              <div className="p-4 rounded-xl border border-gold-400/40 bg-gradient-to-r from-obsidian via-elevated to-obsidian shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gold-400/15 text-gold-400 border border-gold-400/30 flex items-center gap-1">
                      <Swords className="w-3 h-3 text-gold-400" />
                      CHALLENGE INVITE
                    </span>
                    <span className="text-[10px] font-mono text-muted uppercase">
                      {post.challenge.difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-gold-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-gold-400" />
                    +{post.challenge.xpReward} XP
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-ivory">
                    {post.challenge.title}
                  </h4>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {post.challenge.targetScoreOrTopic}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60 flex-wrap gap-2">
                  <button
                    onClick={() => handleCopyChallenge(post)}
                    className="text-xs font-mono text-muted hover:text-gold-400 transition-colors flex items-center gap-1.5"
                  >
                    {copiedId === post.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Invite Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(post.challenge!.route)}
                    className="btn btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
                  >
                    <span>Accept Challenge & Play</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Reactions Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-line/50">
              <button
                onClick={() => handleToggleReaction(post.id, 'flame')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                  post.userReactions?.flame
                    ? 'border-orange-500/50 bg-orange-500/15 text-orange-400 shadow-sm'
                    : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
                }`}
              >
                <span>🔥</span>
                <span>{post.reactions.flame}</span>
              </button>

              <button
                onClick={() => handleToggleReaction(post.id, 'code')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                  post.userReactions?.code
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-400 shadow-sm'
                    : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
                }`}
              >
                <span>💻</span>
                <span>{post.reactions.code}</span>
              </button>

              <button
                onClick={() => handleToggleReaction(post.id, 'zap')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                  post.userReactions?.zap
                    ? 'border-gold-400/50 bg-gold-400/15 text-gold-400 shadow-sm'
                    : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
                }`}
              >
                <span>⚡</span>
                <span>{post.reactions.zap}</span>
              </button>

              <button
                onClick={() => handleToggleReaction(post.id, 'heart')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                  post.userReactions?.heart
                    ? 'border-red-500/50 bg-red-500/15 text-red-400 shadow-sm'
                    : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
                }`}
              >
                <span>❤️</span>
                <span>{post.reactions.heart}</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
