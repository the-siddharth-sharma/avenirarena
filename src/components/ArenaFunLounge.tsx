import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ChevronRight, Loader2, MessageCircleQuestion, AlertCircle } from 'lucide-react';
import { db, auth } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { getVerifiedAuthUid } from '@/utils/authHelper';
import { doc, onSnapshot, runTransaction, setDoc, deleteDoc } from 'firebase/firestore';
import {
  FUN_LOUNGE_ITEMS,
  FUN_LOUNGE_REACTIONS,
  type FunReactionEmoji,
  type FunLoungeCategory,
} from '@/data/funLoungeData';

const CATEGORY_COLORS: Record<FunLoungeCategory, { bg: string; text: string; border: string }> = {
  CODING: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/25' },
  COLLEGE: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/25' },
  EXAMS: { bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/25' },
  DEBUGGING: { bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/25' },
  AI_ML: { bg: 'bg-purple-400/10', text: 'text-purple-400', border: 'border-purple-400/25' },
  WEB_DEV: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', border: 'border-cyan-400/25' },
  DSA: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/25' },
  HOSTEL: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/25' },
  PLACEMENTS: { bg: 'bg-green-400/10', text: 'text-green-400', border: 'border-green-400/25' },
  QUESTION: { bg: 'bg-gold-400/10', text: 'text-gold-400', border: 'border-gold-400/30' },
};

function getNextRandomIndex(current: number, total: number): number {
  if (total <= 1) return 0;
  let next = Math.floor(Math.random() * total);
  if (next === current) {
    next = (current + 1) % total;
  }
  return next;
}

interface QuoteCacheRecord {
  counts: Record<string, number>;
  myReaction: FunReactionEmoji | null;
}

export function ArenaFunLounge() {
  const { currentUser, openAuthModal } = useAuth();

  // 1. Rotation State
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * FUN_LOUNGE_ITEMS.length)
  );
  const [isFading, setIsFading] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // 2. Persistent Reaction State for the active quote
  const currentItem = FUN_LOUNGE_ITEMS[currentIndex];
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<FunReactionEmoji | null>(null);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);

  // In-memory cache ensures rotating back to a quote immediately restores reactions
  const reactionsCacheRef = useRef<Record<string, QuoteCacheRecord>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Rotation Engine with subtle transition
  const advanceToNext = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => getNextRandomIndex(prev, FUN_LOUNGE_ITEMS.length));
      setIsFading(false);
      setCountdown(10);
    }, 150);
  }, []);

  // 4. Visible 10-Second Countdown Engine
  // Counts down 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 -> Next quote
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(10);

    timerRef.current = setInterval(() => {
      // Pause countdown if browser tab is hidden or backgrounded
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      setCountdown((prev) => {
        if (prev <= 1) {
          advanceToNext();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  }, [advanceToNext]);

  useEffect(() => {
    resetTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimer]);

  const handleManualNext = () => {
    advanceToNext();
    resetTimer();
  };

  // 5. Persistent Real-time Reactions Subscription for Current Quote
  useEffect(() => {
    const quoteId = currentItem.id;
    const authUid = auth.currentUser?.uid || currentUser?.uid;

    // Check in-memory cache for immediate zero-latency display across rotations
    const cached = reactionsCacheRef.current[quoteId];
    if (cached) {
      setCounts(cached.counts);
      setMyReaction(cached.myReaction);
      setIsLoadingReactions(false);
    } else {
      setCounts({});
      setMyReaction(null);
      setIsLoadingReactions(true);
    }
    setReactionError(null);

    let isMounted = true;
    const quoteDocRef = doc(db, 'quote_reactions', quoteId);

    const unsubQuote = onSnapshot(
      quoteDocRef,
      (snap) => {
        if (!isMounted) return;
        const remoteCounts = snap.exists()
          ? (snap.data().counts as Record<string, number>) || {}
          : {};

        setCounts(remoteCounts);
        setIsLoadingReactions(false);

        // Update in-memory cache
        reactionsCacheRef.current[quoteId] = {
          counts: remoteCounts,
          myReaction: reactionsCacheRef.current[quoteId]?.myReaction ?? null,
        };
      },
      (err) => {
        console.warn('[ARENA FUN LOUNGE] Reaction counts listener fallback:', err);
        if (isMounted) setIsLoadingReactions(false);
      }
    );

    let unsubUser: (() => void) | undefined;
    if (authUid) {
      const userReactionRef = doc(db, 'quote_reactions', quoteId, 'reactions', authUid);
      unsubUser = onSnapshot(
        userReactionRef,
        (snap) => {
          if (!isMounted) return;
          const userEmoji = snap.exists()
            ? (snap.data().reaction as FunReactionEmoji) || null
            : null;
          setMyReaction(userEmoji);

          if (reactionsCacheRef.current[quoteId]) {
            reactionsCacheRef.current[quoteId].myReaction = userEmoji;
          }
        },
        () => {}
      );
    }

    return () => {
      isMounted = false;
      unsubQuote();
      if (unsubUser) unsubUser();
    };
  }, [currentItem.id, currentUser?.uid]);

  // 6. Concurrency-Safe Persistent Reaction Handler
  const handleToggleReaction = async (emoji: FunReactionEmoji) => {
    const verifiedUid = await getVerifiedAuthUid();
    if (!currentUser || !verifiedUid) {
      openAuthModal();
      return;
    }

    if (isSubmittingReaction) return;
    setIsSubmittingReaction(true);
    setReactionError(null);

    const prevReaction = myReaction;
    const isRemoving = prevReaction === emoji;
    const nextReaction: FunReactionEmoji | null = isRemoving ? null : emoji;

    // Optimistic UI update
    setMyReaction(nextReaction);
    const updatedLocalCounts = { ...counts };
    if (prevReaction && updatedLocalCounts[prevReaction]) {
      updatedLocalCounts[prevReaction] = Math.max(0, updatedLocalCounts[prevReaction] - 1);
      if (updatedLocalCounts[prevReaction] === 0) delete updatedLocalCounts[prevReaction];
    }
    if (nextReaction) {
      updatedLocalCounts[nextReaction] = (updatedLocalCounts[nextReaction] || 0) + 1;
    }
    setCounts(updatedLocalCounts);

    // Save to cache immediately
    reactionsCacheRef.current[currentItem.id] = {
      counts: updatedLocalCounts,
      myReaction: nextReaction,
    };

    try {
      const quoteDocRef = doc(db, 'quote_reactions', currentItem.id);
      const userReactionRef = doc(
        db,
        'quote_reactions',
        currentItem.id,
        'reactions',
        verifiedUid
      );

      // 1. Primary write: persist or remove deterministic user reaction document
      if (isRemoving) {
        await deleteDoc(userReactionRef);
      } else {
        await setDoc(userReactionRef, {
          uid: verifiedUid,
          reaction: emoji,
          updatedAt: Date.now(),
        });
      }

      // 2. Secondary non-blocking write: update aggregate counts on quote doc
      try {
        await runTransaction(db, async (tx) => {
          const quoteSnap = await tx.get(quoteDocRef);
          const serverCounts =
            (quoteSnap.exists()
              ? (quoteSnap.data().counts as Record<string, number>)
              : {}) || {};
          const freshCounts: Record<string, number> = { ...serverCounts };

          if (isRemoving) {
            if (prevReaction && freshCounts[prevReaction]) {
              freshCounts[prevReaction] = Math.max(0, freshCounts[prevReaction] - 1);
              if (freshCounts[prevReaction] === 0) delete freshCounts[prevReaction];
            }
          } else {
            if (prevReaction && freshCounts[prevReaction]) {
              freshCounts[prevReaction] = Math.max(0, freshCounts[prevReaction] - 1);
              if (freshCounts[prevReaction] === 0) delete freshCounts[prevReaction];
            }
            freshCounts[emoji] = (freshCounts[emoji] || 0) + 1;
          }

          tx.set(
            quoteDocRef,
            {
              quoteId: currentItem.id,
              counts: freshCounts,
              lastUpdated: Date.now(),
            },
            { merge: true }
          );
        });
      } catch (aggregateErr) {
        console.warn('[ARENA FUN LOUNGE] Non-critical aggregate update notice:', aggregateErr);
      }
    } catch (err) {
      console.warn('[ARENA FUN LOUNGE] Reaction write failed, reverting:', err);
      // Rollback optimistic state
      setMyReaction(prevReaction);
      setCounts(counts);
      if (reactionsCacheRef.current[currentItem.id]) {
        reactionsCacheRef.current[currentItem.id] = {
          counts,
          myReaction: prevReaction,
        };
      }
      setReactionError('Failed to save reaction. Tap to retry.');
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  const categoryStyle = CATEGORY_COLORS[currentItem.category] || CATEGORY_COLORS.CODING;

  return (
    <footer className="mt-8 pt-4 border-t border-line/40 select-none">
      <div className="p-3 sm:p-4 rounded-xl border border-line/60 bg-graphite/40 backdrop-blur-sm transition-all hover:border-gold-400/30 space-y-2.5 text-left">
        {/* Subtle Compact Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-line/30 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display font-bold text-[11px] tracking-wider uppercase text-ivory shrink-0">
                ARENA FUN LOUNGE
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
              >
                {currentItem.category}
              </span>
            </div>
          </div>

          {/* Numerical Countdown & Manual Next Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Visual Numerical Countdown Cue */}
            <div
              className="flex items-center gap-1 text-[11px] font-mono text-muted/80 bg-obsidian/60 px-2 py-0.5 rounded-md border border-line/50"
              title="Next quote countdown"
            >
              <span className="text-[10px] text-muted/60">Next in:</span>
              <span className="text-gold-400 font-bold w-4 text-center">{countdown}s</span>
            </div>

            {/* Manual Next Button */}
            <button
              type="button"
              onClick={handleManualNext}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-mono text-gold-400 hover:text-gold-300 bg-gold-400/5 hover:bg-gold-400/10 border border-gold-400/30 transition-all active:scale-95"
              title="Next quote"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Dynamic Rotating Quote / Question Content */}
        <div
          className={`min-h-[38px] flex items-center transition-opacity duration-150 motion-reduce:transition-none ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentItem.isQuestion ? (
            <div className="flex items-start gap-2 text-ivory">
              <MessageCircleQuestion className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-sans font-medium text-ivory/95 leading-relaxed">
                {currentItem.text}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-sans italic text-ivory/95 leading-relaxed">
              &ldquo;{currentItem.text}&rdquo;
            </p>
          )}
        </div>

        {/* Reaction Bar & Feedback */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-line/25 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FUN_LOUNGE_REACTIONS.map((emoji) => {
              const count = counts[emoji] || 0;
              const isSelected = myReaction === emoji;

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggleReaction(emoji)}
                  disabled={isSubmittingReaction}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono transition-all duration-150 border ${
                    isSelected
                      ? 'border-gold-400 bg-gold-400/20 text-gold-400 font-bold shadow-[0_0_8px_rgba(208,180,119,0.3)] scale-105'
                      : count > 0
                      ? 'border-line bg-obsidian text-ivory hover:border-gold-400/50'
                      : 'border-line/50 bg-obsidian/50 text-muted/70 hover:text-ivory hover:border-line'
                  }`}
                  title={
                    isSelected
                      ? `You reacted ${emoji}. Click to remove.`
                      : `React with ${emoji}`
                  }
                >
                  <span className="text-xs">{emoji}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-gold-400 font-bold' : 'text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sync indicator & Error state */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted/60 ml-auto">
            {isLoadingReactions && (
              <span className="flex items-center gap-1 text-gold-400/70">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
            {reactionError && (
              <button
                type="button"
                onClick={() => handleToggleReaction(myReaction || '👍')}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 underline"
              >
                <AlertCircle className="w-2.5 h-2.5" />
                <span>{reactionError}</span>
              </button>
            )}
            <span className="text-muted/40">#{currentItem.id}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
