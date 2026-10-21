import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Heart,
  Send,
  Loader2,
  Trash2,
  CornerDownRight,
  AlertCircle,
} from 'lucide-react';
import { db, auth } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  limit,
} from 'firebase/firestore';

export interface CommentData {
  id: string;
  postId: string;
  senderUid: string;
  authorName: string;
  username: string;
  avatarUrl: string;
  campus: string;
  content: string;
  likeCount: number;
  createdAt: string;
  timestamp: number;
}

interface PostCommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange?: (newCount: number) => void;
  autoFocusInput?: boolean;
}

function formatRelativeTime(dateOrTimestamp: string | number | undefined): string {
  if (!dateOrTimestamp) return 'Just now';
  const millis =
    typeof dateOrTimestamp === 'number'
      ? dateOrTimestamp
      : new Date(dateOrTimestamp).getTime();
  if (isNaN(millis)) return 'Just now';

  const diffSec = Math.floor((Date.now() - millis) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  onDelete: (commentId: string) => void;
  canDelete: boolean;
  onLikeChange?: (commentId: string, newLiked: boolean, newCount: number) => void;
}

function CommentItem({
  comment,
  postId,
  onDelete,
  canDelete,
  onLikeChange,
}: CommentItemProps) {
  const { currentUser, openAuthModal } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  // Sync likeCount whenever remote comment changes
  useEffect(() => {
    if (typeof comment.likeCount === 'number') {
      setLikeCount(comment.likeCount);
    }
  }, [comment.likeCount]);

  // Dedicated, deterministic listener for current user's reaction document
  useEffect(() => {
    const authUid = auth.currentUser?.uid || currentUser?.uid;
    if (!authUid || postId.startsWith('local-') || comment.id.startsWith('local-')) {
      setIsLiked(false);
      return;
    }

    let isMounted = true;
    const likeDocRef = doc(
      db,
      'community_messages',
      postId,
      'comments',
      comment.id,
      'likes',
      authUid
    );

    const unsub = onSnapshot(
      likeDocRef,
      (snap) => {
        if (!isMounted) return;
        setIsLiked(snap.exists());
      },
      (err) => {
        console.warn('[AVENIR ARENA] Comment like listener notice:', err);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [postId, comment.id, currentUser?.uid]);

  const handleToggleLike = async () => {
    const authUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUser || !authUid) {
      openAuthModal();
      return;
    }

    // Prevent duplicate clicks or race conditions
    if (isLiking) return;
    setIsLiking(true);
    setLikeError(null);

    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic UI updates
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    onLikeChange?.(comment.id, nextLiked, nextCount);

    if (postId.startsWith('local-') || comment.id.startsWith('local-')) {
      setIsLiking(false);
      return;
    }

    try {
      const commentRef = doc(db, 'community_messages', postId, 'comments', comment.id);
      const likeRef = doc(
        db,
        'community_messages',
        postId,
        'comments',
        comment.id,
        'likes',
        authUid
      );

      await runTransaction(db, async (tx) => {
        const likeSnap = await tx.get(likeRef);
        const commentSnap = await tx.get(commentRef);

        if (!commentSnap.exists()) {
          throw new Error('Comment does not exist.');
        }

        const currentLikes = Number(commentSnap.data().likeCount ?? 0);

        if (likeSnap.exists()) {
          // Unlike: delete deterministic reaction document and decrement aggregate count
          tx.delete(likeRef);
          tx.update(commentRef, {
            likeCount: Math.max(0, currentLikes - 1),
          });
        } else {
          // Like: create deterministic reaction document and increment aggregate count
          tx.set(likeRef, {
            uid: authUid,
            createdAt: Date.now(),
          });
          tx.update(commentRef, {
            likeCount: currentLikes + 1,
          });
        }
      });
    } catch (err: unknown) {
      console.error('[AVENIR ARENA] Comment like write failed, reverting:', err);
      // Revert optimistic update on failure and present clear feedback
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      onLikeChange?.(comment.id, prevLiked, prevCount);
      setLikeError('Failed to like. Retry.');
      setTimeout(() => setLikeError(null), 3000);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border border-line/60 bg-obsidian/60 hover:border-line-light transition-all flex items-start justify-between gap-3 group">
      {/* Author Avatar */}
      <div className="w-7 h-7 rounded-full bg-graphite border border-line overflow-hidden shrink-0 mt-0.5">
        {comment.avatarUrl ? (
          <img
            src={comment.avatarUrl}
            alt={comment.authorName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gold-400 font-mono">
            {comment.authorName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-ivory">
            {comment.authorName}
          </span>
          <span className="text-[10px] font-mono text-gold-400">
            @{comment.username}
          </span>
          <span className="text-[10px] font-mono text-muted/70">·</span>
          <span className="text-[10px] font-mono text-muted/80">
            {formatRelativeTime(comment.timestamp)}
          </span>
        </div>

        <p className="text-xs text-ivory/90 font-sans mt-1 leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-muted">
          <span className="text-muted/60">{comment.campus}</span>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-muted hover:text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Small Instagram-style Comment Like Action */}
      <div className="shrink-0 flex flex-col items-center pt-0.5">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={isLiking}
          className={`p-1 rounded-full transition-transform transform active:scale-125 disabled:opacity-50 ${
            isLiked
              ? 'text-red-400 hover:text-red-300'
              : 'text-muted hover:text-ivory'
          }`}
          title={likeError ? likeError : isLiked ? 'Unlike comment' : 'Like comment'}
          aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isLiked ? 'fill-red-400 text-red-400' : ''
            }`}
          />
        </button>
        {likeCount > 0 && (
          <span
            className={`text-[10px] font-mono ${
              isLiked ? 'text-red-400 font-bold' : 'text-muted'
            }`}
          >
            {likeCount}
          </span>
        )}
        {likeError && (
          <span className="text-[9px] font-mono text-red-400 animate-fade-in text-center leading-none mt-0.5">
            !
          </span>
        )}
      </div>
    </div>
  );
}

export function PostCommentSection({
  postId,
  onCommentCountChange,
  autoFocusInput = false,
}: PostCommentSectionProps) {
  const { currentUser, userProfile, openAuthModal, isAdmin } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [visibleLimit, setVisibleLimit] = useState(10);

  const isSubmittingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onCountChangeRef = useRef(onCommentCountChange);

  useEffect(() => {
    onCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  // Auto focus input when requested
  useEffect(() => {
    if (autoFocusInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput]);

  // 1. Subscribe in real-time to comments on this post
  useEffect(() => {
    let isMounted = true;
    try {
      const commentsCol = collection(db, 'community_messages', postId, 'comments');
      // Fetch up to 100 recent comments
      const q = query(commentsCol, orderBy('timestamp', 'desc'), limit(100));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const remoteComments: CommentData[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              postId,
              senderUid: data.senderUid || '',
              authorName: data.authorName || 'Cadet',
              username: data.username || 'cadet',
              avatarUrl: data.avatarUrl || '',
              campus: data.campus || 'MSOT Ghaziabad',
              content: data.content || '',
              likeCount: Number.isFinite(data.likeCount) ? data.likeCount : 0,
              createdAt: data.createdAt || new Date().toISOString(),
              timestamp: data.timestamp || Date.now(),
            };
          });

          setComments(remoteComments);
          setLoading(false);
          onCountChangeRef.current?.(remoteComments.length);
        },
        (err) => {
          console.warn('[AVENIR ARENA] Comments listener fallback:', err);
          if (isMounted) setLoading(false);
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('[AVENIR ARENA] Error attaching comments listener:', err);
      setLoading(false);
    }
  }, [postId]);

  // 2. Handle comment submission with atomic batch & duplicate prevention
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);

    const authUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUser || !authUid) {
      openAuthModal();
      return;
    }

    if (isSubmitting || isSubmittingRef.current) return;

    const trimmed = newCommentText.trim();
    if (!trimmed) {
      setSubmitError('Comment cannot be empty.');
      return;
    }

    if (trimmed.length > 500) {
      setSubmitError('Comment exceeds 500 characters.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const authorFullName =
      userProfile?.firstName && userProfile?.lastName
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : currentUser.displayName || 'Cadet Operative';

    const commentPayload = {
      postId,
      senderUid: authUid,
      authorName: authorFullName,
      username: userProfile?.username || 'cadet',
      avatarUrl: userProfile?.avatarUrl || currentUser.photoURL || '',
      campus: userProfile?.campus || 'MSOT Ghaziabad',
      content: trimmed,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    try {
      const commentDocRef = doc(collection(db, 'community_messages', postId, 'comments'));
      const postRef = doc(db, 'community_messages', postId);

      // Atomically write comment document AND increment post commentCount
      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        if (!postSnap.exists()) {
          throw new Error('Transmission no longer exists in Arena Comms.');
        }

        const currentCount = Number(postSnap.data().commentCount ?? 0);

        tx.set(commentDocRef, commentPayload);
        tx.update(postRef, {
          commentCount: currentCount + 1,
        });
      });

      // Clear input only after successful database write
      setNewCommentText('');
    } catch (err: unknown) {
      console.error('[AVENIR ARENA] Failed to post comment:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to publish comment.';
      setSubmitError(`${errMsg} Please retry.`);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Keyboard submission handler: Enter submits, Shift+Enter adds newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && newCommentText.trim()) {
        handleSubmitComment();
      }
    }
  };

  // 3. Handle delete comment (Author or Admin)
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      const commentRef = doc(db, 'community_messages', postId, 'comments', commentId);
      const postRef = doc(db, 'community_messages', postId);

      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        tx.delete(commentRef);
        if (postSnap.exists()) {
          const currentCount = Number(postSnap.data().commentCount ?? 1);
          tx.update(postRef, {
            commentCount: Math.max(0, currentCount - 1),
          });
        }
      });
    } catch (err) {
      console.warn('[AVENIR ARENA] Delete comment failed:', err);
    }
  };

  // Immediate synchronous optimistic update to parent comments array
  const handleCommentLikeChange = (commentId: string, _newLiked: boolean, newCount: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likeCount: newCount } : c))
    );
  };

  // 4. Deterministic Comment Ranking:
  // Top: higher likeCount first; if equal, newer timestamp first.
  // Newest: strictly timestamp descending.
  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortBy === 'top') {
      return list.sort((a, b) => {
        const likesDiff = (b.likeCount || 0) - (a.likeCount || 0);
        if (likesDiff !== 0) return likesDiff;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
    }
    // 'newest'
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [comments, sortBy]);

  const visibleComments = sortedComments.slice(0, visibleLimit);
  const hasMoreComments = sortedComments.length > visibleLimit;

  return (
    <div className="pt-3 border-t border-line/60 space-y-3.5 animate-fade-in text-left">
      {/* Header Bar with Sort Selector */}
      <div className="flex items-center justify-between text-xs font-mono text-muted">
        <span className="flex items-center gap-1.5 font-bold text-ivory">
          <CornerDownRight className="w-3.5 h-3.5 text-gold-400" />
          <span>Comments ({comments.length})</span>
        </span>

        {comments.length > 1 && (
          <div className="flex items-center gap-1 bg-obsidian/80 p-0.5 rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setSortBy('top')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                sortBy === 'top'
                  ? 'bg-gold-400 text-obsidian font-bold shadow-xs'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              Top Comments
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                sortBy === 'newest'
                  ? 'bg-gold-400 text-obsidian font-bold shadow-xs'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              Newest
            </button>
          </div>
        )}
      </div>

      {/* Write a comment input form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentUser
                ? `Write a comment as @${userProfile?.username || 'cadet'}... (Enter to post)`
                : 'Sign in to join this peer discussion...'
            }
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-obsidian text-ivory placeholder:text-muted/60 focus:border-gold-400 focus:outline-none resize-none font-sans leading-relaxed transition-colors"
          />
          <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-muted/70 px-1">
            <span>
              {newCommentText.length > 400 && (
                <span
                  className={
                    newCommentText.length >= 500 ? 'text-red-400 font-bold' : 'text-gold-400'
                  }
                >
                  {500 - newCommentText.length} chars remaining
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !newCommentText.trim() || !currentUser}
                className="btn btn-primary text-xs px-3 py-1 flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-2 rounded-lg border border-red-500/40 bg-red-950/40 text-red-200 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="font-mono text-[11px]">{submitError}</span>
          </div>
        )}
      </form>

      {/* Comment List */}
      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-4 h-4 animate-spin text-gold-400 mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-xs font-mono text-muted bg-obsidian/30 rounded-lg border border-line/40">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleComments.map((comment) => {
            const canDelete =
              currentUser &&
              (currentUser.uid === comment.senderUid || isAdmin);

            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                onDelete={handleDeleteComment}
                canDelete={Boolean(canDelete)}
                onLikeChange={handleCommentLikeChange}
              />
            );
          })}

          {/* Pagination / Load more */}
          {hasMoreComments && (
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + 10)}
              className="w-full py-1.5 text-center text-[11px] font-mono text-gold-400 hover:text-gold-300 bg-obsidian/40 border border-line rounded-lg transition-colors cursor-pointer"
            >
              Load more comments ({comments.length - visibleLimit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
