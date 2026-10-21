import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  Copy,
  Zap,
  Swords,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { PostCommentSection } from './PostCommentSection';
import { db, auth } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import type { ChallengeInvite } from '@/pages/CommunityPage';

export interface CommunityPostItem {
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
  likeCount?: number;
  commentCount?: number;
}

interface CommunityPostCardProps {
  post: CommunityPostItem;
  isTargetPost?: boolean;
  onNavigate: (path: string) => void;
  onPostUpdate?: (postId: string, updates: Partial<CommunityPostItem>) => void;
}

export function CommunityPostCard({
  post,
  isTargetPost = false,
  onNavigate,
  onPostUpdate,
}: CommunityPostCardProps) {
  const { currentUser, openAuthModal } = useAuth();
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(isTargetPost);
  const [isLiking, setIsLiking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // Sync likeCount and commentCount from post prop if updated (unless like in-flight)
  useEffect(() => {
    if (isLiking) return;
    if (typeof post.likeCount === 'number') {
      setLikeCount(post.likeCount);
    }
    if (typeof post.commentCount === 'number') {
      setCommentCount(post.commentCount);
    }
  }, [post.likeCount, post.commentCount, isLiking]);

  // Deep-link scroll & highlight
  useEffect(() => {
    if (isTargetPost && cardRef.current) {
      setShowComments(true);
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isTargetPost]);

  // 1. Subscribe to active user's like status on this post in Firestore
  useEffect(() => {
    const authUid = auth.currentUser?.uid || currentUser?.uid;
    if (!authUid || post.id.startsWith('local-')) {
      setIsLikedByMe(false);
      return;
    }

    let isMounted = true;
    try {
      const userLikeRef = doc(db, 'community_messages', post.id, 'likes', authUid);
      const unsubscribe = onSnapshot(
        userLikeRef,
        (snap) => {
          if (!isMounted) return;
          setIsLikedByMe(snap.exists());
        },
        () => {}
      );
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch {
      // Ignore
    }
  }, [post.id, currentUser?.uid]);

  // 2. Handle Like Toggle
  const handleToggleLike = async () => {
    const authUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUser || !authUid) {
      openAuthModal();
      return;
    }

    if (isLiking) return; // Prevent duplicate rapid clicks
    setIsLiking(true);

    const prevLiked = isLikedByMe;
    const prevCount = likeCount;

    // Optimistic UI update
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setIsLikedByMe(nextLiked);
    setLikeCount(nextCount);
    onPostUpdate?.(post.id, { likeCount: nextCount });

    if (post.id.startsWith('local-')) {
      setIsLiking(false);
      return;
    }

    try {
      const postRef = doc(db, 'community_messages', post.id);
      const likeRef = doc(db, 'community_messages', post.id, 'likes', authUid);

      await runTransaction(db, async (tx) => {
        const likeSnap = await tx.get(likeRef);
        const postSnap = await tx.get(postRef);

        if (!postSnap.exists()) {
          throw new Error('Transmission does not exist.');
        }

        const currentLikes = Number(postSnap.data().likeCount ?? 0);

        if (likeSnap.exists()) {
          // Unlike
          tx.delete(likeRef);
          tx.update(postRef, {
            likeCount: Math.max(0, currentLikes - 1),
          });
        } else {
          // Like
          tx.set(likeRef, {
            uid: authUid,
            createdAt: Date.now(),
          });
          tx.update(postRef, {
            likeCount: currentLikes + 1,
          });
        }
      });
    } catch (err) {
      console.warn('[AVENIR ARENA] Like toggle rollback:', err);
      // Rollback optimistic state
      setIsLikedByMe(prevLiked);
      setLikeCount(prevCount);
      onPostUpdate?.(post.id, { likeCount: prevCount });
    } finally {
      setIsLiking(false);
    }
  };

  // 3. Handle Share Action (Web Share API with Clipboard Fallback)
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/community?post=${post.id}`;
    const shareTitle = `Avenir Arena — Transmission by @${post.username}`;
    const shareText = post.content.length > 120 ? `${post.content.slice(0, 117)}...` : post.content;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback('Transmission shared!');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: unknown) {
        // AbortError indicates user cancelled share dialog; do not claim share occurred
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setShareFeedback('Link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareFeedback(null);
      }, 2500);
    } catch {
      setShareFeedback('Unable to copy link.');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const handleCopyChallenge = () => {
    if (typeof window !== 'undefined' && post.challenge) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}#/community?invite=${post.challenge.id}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2500);
    }
  };

  const handleCommentCountChange = useCallback(
    (count: number) => {
      setCommentCount(count);
      onPostUpdate?.(post.id, { commentCount: count });
    },
    [post.id, onPostUpdate]
  );

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 ${
        isTargetPost
          ? 'ring-2 ring-gold-400 rounded-2xl shadow-[0_0_25px_rgba(208,180,119,0.3)]'
          : ''
      }`}
    >
      <Card className="p-5 border-line bg-graphite hover:border-line-light transition-all space-y-3.5 text-left">
        {/* Post Author Info */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate(`/player/${post.username}`)}
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

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted">{post.timestamp}</span>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-xs sm:text-sm text-ivory/90 leading-relaxed font-sans whitespace-pre-wrap break-words">
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
                type="button"
                onClick={handleCopyChallenge}
                className="text-xs font-mono text-muted hover:text-gold-400 transition-colors flex items-center gap-1.5"
              >
                {copiedChallenge ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Invite Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate(post.challenge!.route)}
                className="btn btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.3)] hover:scale-105 transition-transform"
              >
                <span>Accept Challenge & Play</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* POST ACTION BAR: [ ♡ Like ] [ 💬 Comment ] [ ↗ Share ] */}
        {/* ============================================================ */}
        <div className="pt-2 border-t border-line/50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* LIKE BUTTON */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-200 border ${
                isLikedByMe
                  ? 'border-red-500/40 bg-red-500/10 text-red-400 shadow-xs'
                  : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
              }`}
              title={isLikedByMe ? 'Unlike transmission' : 'Like transmission'}
              aria-label="Like transmission"
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isLikedByMe ? 'fill-red-400 text-red-400' : ''
                }`}
              />
              <span className="font-mono text-xs">{likeCount > 0 ? likeCount : 'Like'}</span>
            </button>

            {/* COMMENT BUTTON */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-200 border ${
                showComments
                  ? 'border-gold-400/50 bg-gold-400/10 text-gold-400'
                  : 'border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light'
              }`}
              title="View & add comments"
              aria-label="Comment on transmission"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-mono text-xs">
                {commentCount > 0 ? commentCount : 'Comment'}
              </span>
            </button>

            {/* SHARE BUTTON */}
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border border-line bg-obsidian text-muted hover:text-ivory hover:border-line-light transition-all duration-200"
              title="Share transmission"
              aria-label="Share transmission"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="font-mono text-xs">Share</span>
                </>
              )}
            </button>
          </div>

          {/* Toast / feedback message */}
          {shareFeedback && (
            <span className="text-[11px] font-mono text-gold-400 animate-fade-in">
              {shareFeedback}
            </span>
          )}
        </div>

        {/* ============================================================ */}
        {/* INSTAGRAM-STYLE COMMENTS DRAWER */}
        {/* ============================================================ */}
        {showComments && (
          <PostCommentSection
            postId={post.id}
            commentCount={commentCount}
            onCommentCountChange={handleCommentCountChange}
            autoFocusInput={true}
          />
        )}
      </Card>
    </div>
  );
}
