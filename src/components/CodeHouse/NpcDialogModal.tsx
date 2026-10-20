import { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  X,
  MessageSquare,
  Lightbulb,
  Code2,
  FileCode,
} from 'lucide-react';
import { NPC_CHARACTERS, getContextualNpcHint } from './npcDialog';
import type { CodeHouseMode, FloorId, NpcCharacter } from './types';
import { houseAudio } from './audio';

interface NpcDialogModalProps {
  npc: NpcCharacter;
  mode: CodeHouseMode;
  floorId: FloorId;
  isSolved: boolean;
  onClose: () => void;
}

export function NpcDialogModal({
  npc,
  mode,
  floorId,
  isSolved,
  onClose,
}: NpcDialogModalProps) {
  const [hintTier, setHintTier] = useState<1 | 2 | 3>(1);

  const character = NPC_CHARACTERS[npc.id] || npc;
  const currentHint = getContextualNpcHint(character.id, mode, floorId, hintTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-graphite border border-line rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-elevated">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl border shadow-inner"
              style={{
                backgroundColor: `${character.color}20`,
                borderColor: `${character.color}50`,
              }}
            >
              {character.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ivory">
                  {character.name}
                </h3>
                <span
                  className="badge text-[10px] uppercase font-mono px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${character.color}15`,
                    borderColor: `${character.color}40`,
                    color: character.color,
                  }}
                >
                  {character.title}
                </span>
              </div>
              <p className="text-xs text-muted">
                Resident Coding Advisor · Interactive Debugger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-muted hover:text-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NPC Introduction Bubble */}
        <div className="p-4 border-b border-line bg-obsidian/50">
          <div className="p-3 rounded-lg bg-elevated/60 border border-line text-sm text-ivory leading-relaxed italic relative">
            <span className="text-gold-400 font-bold not-italic mr-1.5">“</span>
            {isSolved ? character.dialogues.solvedCongrats : character.dialogues.intro}
            <span className="text-gold-400 font-bold not-italic ml-1">”</span>
          </div>
        </div>

        {/* Progressive Hint Level Selector */}
        {!isSolved && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ivory uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gold-400" /> Consult Progressive Hint
              </span>
              <span className="text-[10px] text-muted font-mono">
                Current Level: Tier {hintTier}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  houseAudio.playLineClick();
                  setHintTier(1);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  hintTier === 1
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-elevated/40 border-line text-muted hover:text-ivory'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Level 1</span>
                </div>
                <div className="text-[10px] opacity-75">Gentle Nudge</div>
              </button>

              <button
                onClick={() => {
                  houseAudio.playLineClick();
                  setHintTier(2);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  hintTier === 2
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-elevated/40 border-line text-muted hover:text-ivory'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Level 2</span>
                </div>
                <div className="text-[10px] opacity-75">Syntax Clue</div>
              </button>

              <button
                onClick={() => {
                  houseAudio.playLineClick();
                  setHintTier(3);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  hintTier === 3
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-elevated/40 border-line text-muted hover:text-ivory'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Level 3</span>
                </div>
                <div className="text-[10px] opacity-75">Pseudocode</div>
              </button>
            </div>

            {/* Hint Content Card */}
            <div className="p-3.5 rounded-lg bg-obsidian border border-line/80 min-h-[90px] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-gold-400 block">
                  {hintTier === 1 && 'Conceptual Direction'}
                  {hintTier === 2 && 'Syntax & Structural Pointer'}
                  {hintTier === 3 && 'Algorithmic Walkthrough'}
                </span>
                <p className="text-xs text-ivory/90 leading-relaxed font-mono">
                  {currentHint}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-line bg-elevated/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-400/20 text-gold-300 border border-gold-400/40 hover:bg-gold-400/30 transition-all"
          >
            Thank you, {character.name}!
          </button>
        </div>
      </div>
    </div>
  );
}
