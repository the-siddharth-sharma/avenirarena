import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ChevronRight, Loader2, MessageCircleQuestion } from 'lucide-react';
import { db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
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

export function ArenaFunLounge() {
  const { currentUser, openAuthModal } = useAuth();

  // 1. Rotation State
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * FUN_LOUNGE_ITEMS.length));
  const [isFading, setIsFading] = useState(false);

  // 2. Persistent Reaction State for the active quote
  const currentItem = FUN_LOUNGE_ITEMS[currentIndex];
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<FunReactionEmoji | null>(null);
  const [isLoadingReactions, setIsLoadingReactions] = useState(true);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Five-Second Rotation Engine
  const advanceToNext = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => getNextRandomIndex(prev, FUN_LOUNGE_ITEMS.length));
      setIsFading(false);
    }, 180);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Pause rotation if document is hidden (tab switched)
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        advanceToNext();
      }
    }, 5000);
  }, [advanceToNext]);

  // Set up rotation timer and visibility change listener
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

  // 4. Real-time Firestore Subscription for Active Quote Reactions
  // Binds strictly to currentItem.id, never carrying over stale counts
  useEffect(() => {
    setIsLoadingReactions(true);
    setCounts({});
    setMyReaction(null);

    let isMounted = true;
    const quoteDocRef = doc(db, 'quote_reactions', currentItem.id);

    const unsubQuote = onSnapshot(
      quoteDocRef,
      (snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const remoteCounts = (snap.data().counts as Record<string, number>) || {};
          setCounts(remoteCounts);
        } else {
          setCounts({});
        }
        setIsLoadingReactions(false);
      },
      (err) => {
        console.warn('[ARENA FUN LOUNGE] Reaction counts fallback:', err);
        if (isMounted) setIsLoadingReactions(false);
      }
    );

    let unsubUser: (() => void) | undefined;
    if (currentUser) {
      const userReactionRef = doc(db, 'quote_reactions', currentItem.id, 'reactions', currentUser.uid);
      unsubUser = onSnapshot(
        userReactionRef,
        (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            setMyReaction((snap.data().reaction as FunReactionEmoji) || null);
          } else {
            setMyReaction(null);
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
  }, [currentItem.id, currentUser]);

  // 5. Concurrency-Safe Reaction Handler
  const handleToggleReaction = async (emoji: FunReactionEmoji) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (isSubmittingReaction) return;
    setIsSubmittingReaction(true);

    const prevReaction = myReaction;
    const isRemoving = prevReaction === emoji;
    const nextReaction: FunReactionEmoji | null = isRemoving ? null : emoji;

    // Optimistic UI update
    setMyReaction(nextReaction);
    setCounts((prev) => {
      const copy = { ...prev };
      if (prevReaction) {
        copy[prevReaction] = Math.max(0, (copy[prevReaction] || 1) - 1);
        if (copy[prevReaction] === 0) delete copy[prevReaction];
      }
      if (nextReaction) {
        copy[nextReaction] = (copy[nextReaction] || 0) + 1;
      }
      return copy;
    });

    try {
      const quoteDocRef = doc(db, 'quote_reactions', currentItem.id);
      const userReactionRef = doc(db, 'quote_reactions', currentItem.id, 'reactions', currentUser.uid);

      await runTransaction(db, async (tx) => {
        const quoteSnap = await tx.get(quoteDocRef);
        const userSnap = await tx.get(userReactionRef);

        const currentCounts = (quoteSnap.exists() ? (quoteSnap.data().counts as Record<string, number>) : {}) || {};
        const updatedCounts: Record<string, number> = { ...currentCounts };

        const existingReaction = userSnap.exists() ? (userSnap.data().reaction as string) : null;

        if (isRemoving) {
          tx.delete(userReactionRef);
          if (existingReaction && updatedCounts[existingReaction]) {
            updatedCounts[existingReaction] = Math.max(0, updatedCounts[existingReaction] - 1);
            if (updatedCounts[existingReaction] === 0) delete updatedCounts[existingReaction];
          }
        } else {
          tx.set(userReactionRef, {
            uid: currentUser.uid,
            reaction: emoji,
            updatedAt: Date.now(),
          });
          if (existingReaction && updatedCounts[existingReaction]) {
            updatedCounts[existingReaction] = Math.max(0, updatedCounts[existingReaction] - 1);
            if (updatedCounts[existingReaction] === 0) delete updatedCounts[existingReaction];
          }
          updatedCounts[emoji] = (updatedCounts[emoji] || 0) + 1;
        }

        tx.set(
          quoteDocRef,
          {
            quoteId: currentItem.id,
            counts: updatedCounts,
            lastUpdated: Date.now(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      console.warn('[ARENA FUN LOUNGE] Reaction write failed, reverting:', err);
      // Rollback optimistic state
      setMyReaction(prevReaction);
      setCounts((prev) => {
        const copy = { ...prev };
        if (nextReaction) {
          copy[nextReaction] = Math.max(0, (copy[nextReaction] || 1) - 1);
          if (copy[nextReaction] === 0) delete copy[nextReaction];
        }
        if (prevReaction) {
          copy[prevReaction] = (copy[prevReaction] || 0) + 1;
        }
        return copy;
      });
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  const categoryStyle = CATEGORY_COLORS[currentItem.category] || CATEGORY_COLORS.CODING;

  return (
    <footer className="mt-14 pt-6 border-t border-line/40 select-none">
      <div className="p-4 sm:p-5 rounded-2xl border border-line/70 bg-graphite/50 backdrop-blur-md shadow-lg transition-all hover:border-gold-400/35 space-y-3.5 text-left">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line/40 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs tracking-wider uppercase text-ivory">
                  ARENA FUN LOUNGE
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                >
                  {currentItem.category}
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted/80">
                Thoda code, thoda chaos, full engineering vibes.
              </p>
            </div>
          </div>

          {/* Manual Next Button */}
          <button
            type="button"
            onClick={handleManualNext}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-gold-400 hover:text-gold-300 bg-gold-400/5 hover:bg-gold-400/10 border border-gold-400/30 transition-all shrink-0 active:scale-95"
            title="Next joke (resets 5s timer)"
          >
            <span>Next joke</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Rotating Content with Fade Transition */}
        <div
          className={`min-h-[44px] flex items-center transition-opacity duration-200 ${
            isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          {currentItem.isQuestion ? (
            <div className="flex items-start gap-2 text-ivory">
              <MessageCircleQuestion className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
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

        {/* Global Persistent Reactions Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/30 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {FUN_LOUNGE_REACTIONS.map((emoji) => {
              const count = counts[emoji] || 0;
              const isSelected = myReaction === emoji;

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggleReaction(emoji)}
                  disabled={isSubmittingReaction}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-150 border ${
                    isSelected
                      ? 'border-gold-400 bg-gold-400/20 text-gold-400 font-bold shadow-[0_0_12px_rgba(208,180,119,0.35)] scale-105'
                      : count > 0
                      ? 'border-line bg-obsidian text-ivory/90 hover:border-gold-400/50'
                      : 'border-line/60 bg-obsidian/60 text-muted/70 hover:text-ivory hover:border-line'
                  }`}
                  title={isSelected ? `You reacted ${emoji}. Click to remove.` : `React with ${emoji}`}
                >
                  <span className="text-sm">{emoji}</span>
                  {isLoadingReactions ? (
                    <span className="text-[10px] text-muted/40">·</span>
                  ) : count > 0 ? (
                    <span className={`text-[11px] ${isSelected ? 'text-gold-400 font-bold' : 'text-muted'}`}>
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Subtitle / Rotation indicator */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted/60 ml-auto">
            {isLoadingReactions && (
              <span className="flex items-center gap-1 text-gold-400/80">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Syncing vibes...</span>
              </span>
            )}
            <span className="hidden sm:inline">#{currentItem.id}</span>
            <span>·</span>
            <span className="text-gold-400/70">Rotates every 5s</span>
          </div>
        </div>
      </div>

      {/* Subtle brand attribution */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-muted/50 px-1">
        <span>AVENIR ARENA v2.4 · Engineering Fun Lounge</span>
        <span>Mirai School of Technology</span>
      </div>
    </footer>
  );
}
