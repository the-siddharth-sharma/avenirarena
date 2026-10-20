import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Flame,
  Heart,
  Loader2,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
  Swords,
  Users,
  Zap,
  AlertCircle,
  Shield,
  Circle,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { fetchRealtimeCadets, type RealtimeCadet } from '@/firebaseConfig';

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
  senderUid?: string;
  authorName: string;
  username: string;
  avatarUrl: string;
  campus: string;
  timestamp: string;
  rawTimestamp?: number;
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

export interface OnlineCadetRecord {
  uid: string;
  username: string;
  avatarUrl?: string;
  campus?: string;
  lastSeen: number;
  status: 'online' | 'offline';
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

const COMMUNITY_STORAGE_KEY = 'avenir_community_feed_v2';

function formatRelativeTime(dateOrTimestamp: string | number | undefined): string {
  if (!dateOrTimestamp) return 'Just now';
  const millis = typeof dateOrTimestamp === 'number'
    ? dateOrTimestamp
    : new Date(dateOrTimestamp).getTime();
  if (isNaN(millis)) return 'Just now';

  const diffSec = Math.floor((Date.now() - millis) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

interface CommunityPageProps {
  navigate: (path: string) => void;
}

export function CommunityPage({ navigate }: CommunityPageProps) {
  const { currentUser, userProfile } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(COMMUNITY_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {
        // Fallback to empty
      }
    }
    return [];
  });

  const [filter, setFilter] = useState<'all' | 'challenges' | 'general'>('all');
  const [newContent, setNewContent] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeInvite | null>(null);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real-time telemetry state
  const [onlineCadets, setOnlineCadets] = useState<OnlineCadetRecord[]>([]);
  const [registeredCadets, setRegisteredCadets] = useState<RealtimeCadet[]>([]);
  const [showOnlineTray, setShowOnlineTray] = useState(false);

  const activeAuthor = useMemo(() => {
    const fullName =
      userProfile?.firstName && userProfile?.lastName
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : currentUser?.displayName || 'Cadet Operative';
    return {
      name: fullName,
      username: userProfile?.username || 'cadet',
      avatarUrl: userProfile?.avatarUrl || currentUser?.photoURL || '',
      campus: userProfile?.campus || 'MSOT Ghaziabad',
    };
  }, [userProfile, currentUser]);

  // 1. Synchronize real-time community messages from Firestore Cloud
  useEffect(() => {
    let isMounted = true;

    try {
      const q = query(
        collection(db, 'community_messages'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const remotePosts: CommunityPost[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              senderUid: data.senderUid,
              authorName: data.authorName || 'Cadet Operative',
              username: data.username || 'cadet',
              avatarUrl: data.avatarUrl || '',
              campus: data.campus || 'MSOT Ghaziabad',
              timestamp: formatRelativeTime(data.timestamp || data.createdAt),
              rawTimestamp: data.timestamp || (data.createdAt ? new Date(data.createdAt).getTime() : Date.now()),
              content: data.content || '',
              challenge: data.challenge || undefined,
              reactions: data.reactions || { flame: 0, code: 0, zap: 0, heart: 0 },
              userReactions: {},
            };
          });

          setPosts(remotePosts);
          setIsLoadingFeed(false);

          try {
            localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(remotePosts));
          } catch {
            // Ignore storage limits
          }
        },
        (err) => {
          console.warn('[AVENIR ARENA COMMUNITY] Firestore messages listener fallback:', err);
          if (isMounted) setIsLoadingFeed(false);
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('[AVENIR ARENA COMMUNITY] Error setting up messages listener:', err);
      setIsLoadingFeed(false);
    }
  }, []);

  // 2. Synchronize real-time online presence from Firestore Cloud
  useEffect(() => {
    let isMounted = true;

    try {
      const presenceCol = collection(db, 'presence');
      const unsubscribe = onSnapshot(
        presenceCol,
        (snapshot) => {
          if (!isMounted) return;
          const now = Date.now();
          const records: OnlineCadetRecord[] = [];

          snapshot.docs.forEach((docSnap) => {
            const d = docSnap.data() as OnlineCadetRecord;
            // A cadet is actively online if heartbeat is within last 120 seconds and status is online
            if (d && d.status === 'online' && d.lastSeen && now - d.lastSeen < 120000) {
              records.push({
                uid: docSnap.id,
                username: d.username || 'Cadet',
                avatarUrl: d.avatarUrl || '',
                campus: d.campus || 'MSOT Ghaziabad',
                lastSeen: d.lastSeen,
                status: 'online',
              });
            }
          });

          // Ensure current user is recognized if active
          if (currentUser?.uid && !records.some((r) => r.uid === currentUser.uid)) {
            records.push({
              uid: currentUser.uid,
              username: userProfile?.username || currentUser.displayName || 'Cadet',
              avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
              campus: userProfile?.campus || 'MSOT Ghaziabad',
              lastSeen: now,
              status: 'online',
            });
          }

          setOnlineCadets(records);
        },
        (err) => {
          console.warn('[AVENIR ARENA COMMUNITY] Presence listener fallback:', err);
          if (isMounted && currentUser?.uid) {
            setOnlineCadets([
              {
                uid: currentUser.uid,
                username: userProfile?.username || currentUser.displayName || 'Cadet',
                avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
                campus: userProfile?.campus || 'MSOT Ghaziabad',
                lastSeen: Date.now(),
                status: 'online',
              },
            ]);
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch {
      // Ignore
    }
  }, [currentUser?.uid, userProfile?.username, userProfile?.avatarUrl, userProfile?.campus]);

  // 3. Load eligible real cadets for metric derivations
  useEffect(() => {
    let isMounted = true;
    fetchRealtimeCadets().then((cadets) => {
      if (!isMounted) return;
      setRegisteredCadets(cadets);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Derived Real Metrics ──
  const cadetsOnlineCount = onlineCadets.length;

  const averageXP = useMemo(() => {
    if (registeredCadets.length === 0) return 0;
    const total = registeredCadets.reduce((acc, c) => acc + (c.academicXP || c.xp || 0), 0);
    return Math.round(total / registeredCadets.length);
  }, [registeredCadets]);

  const maxTraceStreak = useMemo(() => {
    if (registeredCadets.length === 0) return 0;
    return Math.max(...registeredCadets.map((c) => c.infiniteTraceStreak || 0), 0);
  }, [registeredCadets]);

  const activeInvitesCount = useMemo(() => {
    return posts.filter((p) => Boolean(p.challenge)).length;
  }, [posts]);

  const campusesSyncedCount = useMemo(() => {
    const campuses = new Set(registeredCadets.map((c) => c.campus).filter(Boolean));
    return Math.max(campuses.size, 1);
  }, [registeredCadets]);

  // ── Broadcast Transmission Handler ──
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!currentUser) {
      setSubmitError('Authentication clearance required to broadcast transmissions.');
      return;
    }

    const trimmed = newContent.trim();
    if (!trimmed) {
      setSubmitError('Transmission payload cannot be empty.');
      return;
    }

    if (trimmed.length > 1000) {
      setSubmitError('Transmission payload exceeds 1,000 character limit.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      senderUid: currentUser.uid,
      authorName: activeAuthor.name,
      username: activeAuthor.username,
      avatarUrl: activeAuthor.avatarUrl,
      campus: activeAuthor.campus,
      content: trimmed,
      challenge: selectedChallenge ? {
        id: selectedChallenge.id,
        type: selectedChallenge.type,
        title: selectedChallenge.title,
        targetScoreOrTopic: selectedChallenge.targetScoreOrTopic,
        difficulty: selectedChallenge.difficulty,
        xpReward: selectedChallenge.xpReward,
        route: selectedChallenge.route,
      } : null,
      reactions: { flame: 0, code: 0, zap: 0, heart: 0 },
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'community_messages'), payload);

      // Optimistically insert into local view
      const localPost: CommunityPost = {
        ...payload,
        id: docRef.id,
        timestamp: 'Just now',
        rawTimestamp: Date.now(),
        challenge: selectedChallenge || undefined,
        userReactions: {},
      };
      setPosts((prev) => [localPost, ...prev]);

      setNewContent('');
      setSelectedChallenge(null);
      setShowChallengePicker(false);
    } catch (err: unknown) {
      console.error('[AVENIR ARENA COMMUNITY] Broadcast transmission failed:', err);
      // Fallback local persistence if Firestore write is blocked
      const localFallbackPost: CommunityPost = {
        ...payload,
        id: `local-post-${Date.now()}`,
        timestamp: 'Just now',
        rawTimestamp: Date.now(),
        challenge: selectedChallenge || undefined,
        userReactions: {},
      };
      setPosts((prev) => [localFallbackPost, ...prev]);
      try {
        const existing = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
        localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify([localFallbackPost, ...existing]));
      } catch {}
      setNewContent('');
      setSelectedChallenge(null);
      setShowChallengePicker(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reaction Handler ──
  const handleToggleReaction = async (postId: string, key: 'flame' | 'code' | 'zap' | 'heart') => {
    let shouldIncrementRemote = false;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const userReactions = p.userReactions || {};
        const isReacted = Boolean(userReactions[key]);
        shouldIncrementRemote = !isReacted;

        const nextReactions = {
          ...p.reactions,
          [key]: isReacted ? Math.max(0, (p.reactions[key] || 1) - 1) : (p.reactions[key] || 0) + 1,
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

    // Sync to Firestore Cloud in background
    if (!postId.startsWith('local-')) {
      try {
        const msgRef = doc(db, 'community_messages', postId);
        await updateDoc(msgRef, {
          [`reactions.${key}`]: increment(shouldIncrementRemote ? 1 : -1),
        });
      } catch {
        // Ignore reaction write errors
      }
    }
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
        {/* Real-time Cadets Online */}
        <div
          onClick={() => setShowOnlineTray(!showOnlineTray)}
          className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5 cursor-pointer hover:border-gold-400/50 transition-all group"
          title="Click to view online cadets"
        >
          <div className="relative w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase">Cadets Online</p>
            <p className="text-sm font-bold font-mono text-ivory group-hover:text-emerald-400 transition-colors">
              {cadetsOnlineCount} {cadetsOnlineCount === 1 ? 'Cadet' : 'Cadets'}
            </p>
          </div>
        </div>

        {/* Real-time Average XP */}
        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase">Arena Avg XP</p>
            <p className="text-sm font-bold font-mono text-gold-400">
              {averageXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Real Max Trace Streak */}
        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase">Max Trace Streak</p>
            <p className="text-sm font-bold font-mono text-cyan-400">
              {maxTraceStreak} {maxTraceStreak === 1 ? 'Day' : 'Days'}
            </p>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="p-3 rounded-xl border border-line bg-graphite flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
            <Swords className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted uppercase">Active Invites</p>
            <p className="text-sm font-bold font-mono text-purple-300">
              {activeInvitesCount} {activeInvitesCount === 1 ? 'Challenge' : 'Challenges'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Online Cadets Roster Drawer */}
      {showOnlineTray && (
        <Card className="p-4 border-emerald-500/30 bg-graphite/95 animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                Connected Cadets ({onlineCadets.length})
              </span>
            </div>
            <button
              onClick={() => setShowOnlineTray(false)}
              className="text-[11px] font-mono text-muted hover:text-ivory"
            >
              Close Roster [x]
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
            {onlineCadets.map((c) => (
              <div
                key={c.uid}
                onClick={() => navigate(`/player/${c.username}`)}
                className="p-2 rounded-lg border border-line bg-obsidian/80 hover:border-gold-400/50 flex items-center gap-2.5 cursor-pointer transition-all"
              >
                <div className="relative w-7 h-7 rounded-full bg-graphite border border-line overflow-hidden shrink-0">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gold-400">
                      {c.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-obsidian" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ivory truncate font-mono">@{c.username}</p>
                  <p className="text-[10px] text-muted truncate">{c.campus || 'MSOT Sector'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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

        {submitError && (
          <div className="p-2.5 rounded-lg border border-red-500/40 bg-red-950/40 text-red-200 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share code insights, ask B.Tech systems questions, or challenge peers in real time..."
            rows={3}
            maxLength={1000}
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
              disabled={isSubmitting || !newContent.trim()}
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.25)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Transmission</span>
                </>
              )}
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
      {isLoadingFeed ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-gold-400 mx-auto" />
          <p className="text-xs font-mono text-gold-400 uppercase tracking-widest">
            Synchronizing Arena Transmissions...
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-2xl border border-line bg-graphite/40 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 mx-auto shadow-[0_0_20px_rgba(208,180,119,0.15)]">
            <Radio className="w-7 h-7 animate-pulse text-gold-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ivory">
              {filter === 'all'
                ? 'No Active Transmissions'
                : filter === 'challenges'
                ? 'No Active Game Challenges'
                : 'Study Lounge Quiet'}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto mt-1 leading-relaxed">
              {filter === 'all'
                ? 'Be the first authenticated cadet to broadcast a transmission or game challenge to the cross-campus feed!'
                : 'Attach a Code Runner 3D or Code House challenge to your transmission to invite peers to duel!'}
            </p>
          </div>
        </div>
      ) : (
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
                    {post.avatarUrl ? (
                      <img
                        src={post.avatarUrl}
                        alt={post.authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gold-400 font-mono">
                        {post.authorName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
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
              <p className="text-xs sm:text-sm text-ivory/90 leading-relaxed font-sans whitespace-pre-wrap">
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
                  <span>{post.reactions?.flame || 0}</span>
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
                  <span>{post.reactions?.code || 0}</span>
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
                  <span>{post.reactions?.zap || 0}</span>
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
                  <span>{post.reactions?.heart || 0}</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
