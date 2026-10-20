import { useState, useEffect, useMemo, useRef } from 'react';
import { Terminal, SmilePlus, Sparkles } from 'lucide-react';
import { db } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import {
  AVAILABLE_REACTIONS,
  getDailyDeterministicQuote,
  type QuoteReactionEmoji,
} from '@/data/codeQuotes';

interface QuoteFooterProps {
  currentPath: string;
}

export function QuoteFooter({ currentPath }: QuoteFooterProps) {
  const { currentUser, openAuthModal } = useAuth();
  const quote = useMemo(() => getDailyDeterministicQuote(currentPath), [currentPath]);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<QuoteReactionEmoji | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPicker]);

  // 1. Listen to aggregate quote counts in Firestore Cloud
  useEffect(() => {
    let isMounted = true;
    try {
      const quoteDocRef = doc(db, 'quote_reactions', quote.id);
      const unsubscribe = onSnapshot(
        quoteDocRef,
        (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const data = snap.data();
            setCounts((data.counts as Record<string, number>) || {});
          } else {
            setCounts({});
          }
        },
        () => {
          // Graceful fallback if offline
        }
      );
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch {
      // Ignore
    }
  }, [quote.id]);

  // 2. Listen to authenticated user's active reaction for this quote
  useEffect(() => {
    if (!currentUser) {
      setMyReaction(null);
      return;
    }
    let isMounted = true;
    try {
      const userReactionRef = doc(db, 'quote_reactions', quote.id, 'reactions', currentUser.uid);
      const unsubscribe = onSnapshot(
        userReactionRef,
        (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const data = snap.data();
            setMyReaction((data.reaction as QuoteReactionEmoji) || null);
          } else {
            setMyReaction(null);
          }
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
  }, [quote.id, currentUser]);

  const handleSelectReaction = async (emoji: QuoteReactionEmoji) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setShowPicker(false);

    const prevReaction = myReaction;
    const isRemoving = prevReaction === emoji;
    const nextReaction: QuoteReactionEmoji | null = isRemoving ? null : emoji;

    // Optimistic UI updates
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
      const quoteDocRef = doc(db, 'quote_reactions', quote.id);
      const userReactionRef = doc(db, 'quote_reactions', quote.id, 'reactions', currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const quoteSnap = await transaction.get(quoteDocRef);
        const currentCounts = (quoteSnap.exists() ? (quoteSnap.data().counts as Record<string, number>) : {}) || {};
        const updatedCounts: Record<string, number> = { ...currentCounts };

        if (isRemoving) {
          // Remove existing reaction
          transaction.delete(userReactionRef);
          if (prevReaction && updatedCounts[prevReaction]) {
            updatedCounts[prevReaction] = Math.max(0, updatedCounts[prevReaction] - 1);
          }
        } else {
          // Add or update reaction
          transaction.set(userReactionRef, {
            uid: currentUser.uid,
            reaction: emoji,
            updatedAt: Date.now(),
          });
          if (prevReaction && updatedCounts[prevReaction]) {
            updatedCounts[prevReaction] = Math.max(0, updatedCounts[prevReaction] - 1);
          }
          updatedCounts[emoji] = (updatedCounts[emoji] || 0) + 1;
        }

        transaction.set(
          quoteDocRef,
          {
            quoteId: quote.id,
            counts: updatedCounts,
            lastUpdated: Date.now(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      console.warn('[AVENIR ARENA] Quote reaction sync rollback:', err);
      // Rollback to prior state
      setMyReaction(prevReaction);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter to emojis with at least 1 reaction
  const activeEmojisWithCounts = useMemo(() => {
    return AVAILABLE_REACTIONS.filter((emoji) => (counts[emoji] || 0) > 0);
  }, [counts]);

  return (
    <footer className="mt-14 pt-6 border-t border-line/40 select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-line/60 bg-graphite/40 backdrop-blur-sm transition-all hover:border-gold-400/30">
        {/* Left: Code Quote note */}
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-gold-400/10 border border-gold-400/25 text-gold-400 shrink-0 mt-0.5">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            {quote.codeSnippet ? (
              <p className="text-xs font-mono font-medium text-ivory tracking-wide">
                {quote.text}
              </p>
            ) : (
              <p className="text-xs font-sans italic text-ivory/90 leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </p>
            )}
            <p className="text-[10px] font-mono text-muted/80 mt-0.5 flex items-center gap-1.5">
              <span>{quote.author || 'Engineering Daily Note'}</span>
              <span>·</span>
              <span className="text-gold-400/90 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Continuous Learning
              </span>
            </p>
          </div>
        </div>

        {/* Right: WhatsApp-style Reactions Bar */}
        <div className="relative flex items-center gap-1.5 flex-wrap self-end sm:self-center" ref={pickerRef}>
          {/* Reaction badges with aggregate counts */}
          {activeEmojisWithCounts.map((emoji) => {
            const count = counts[emoji] || 0;
            const isSelected = myReaction === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectReaction(emoji)}
                disabled={isSubmitting}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono transition-all duration-200 border ${
                  isSelected
                    ? 'border-gold-400 bg-gold-400/20 text-gold-400 shadow-[0_0_10px_rgba(208,180,119,0.3)] font-bold scale-105'
                    : 'border-line bg-obsidian/70 text-muted hover:text-ivory hover:border-line-light'
                }`}
                title={isSelected ? `You reacted ${emoji}. Click to remove.` : `React with ${emoji}`}
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[11px]">{count}</span>
              </button>
            );
          })}

          {/* Trigger button for WhatsApp reaction popup */}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={`p-1.5 rounded-full border transition-all text-muted hover:text-gold-400 ${
              showPicker
                ? 'border-gold-400 bg-gold-400/15 text-gold-400'
                : 'border-line/70 bg-obsidian/60 hover:border-gold-400/50'
            }`}
            title="Add reaction"
            aria-label="Add reaction to daily quote"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>

          {/* WhatsApp-style Floating Reaction Bubble */}
          {showPicker && (
            <div className="absolute right-0 bottom-full mb-2 bg-graphite border border-line/90 rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1.5 z-40 animate-fade-in backdrop-blur-md">
              {AVAILABLE_REACTIONS.map((emoji) => {
                const isSelected = myReaction === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectReaction(emoji)}
                    className={`text-lg p-1 rounded-full transition-transform transform hover:scale-125 active:scale-95 duration-150 ${
                      isSelected ? 'bg-gold-400/25 ring-1 ring-gold-400' : 'hover:bg-elevated'
                    }`}
                    title={isSelected ? `Remove ${emoji}` : `React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Subtle brand subfooter */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted/60 px-1">
        <span>AVENIR ARENA · Quasar Engineering Labs</span>
        <span>Mirai School of Technology</span>
      </div>
    </footer>
  );
}
