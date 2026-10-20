import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import type { DsaChallenge } from './types';
import { houseAudio } from './audio';

interface DsaTerminalModalProps {
  challenge: DsaChallenge;
  isSolved: boolean;
  onClose: () => void;
  onSolve: (code: string) => void;
}

export function DsaTerminalModal({
  challenge,
  isSolved,
  onClose,
  onSolve,
}: DsaTerminalModalProps) {
  const [code, setCode] = useState<string>(challenge.starterCode);
  const [activeTab, setActiveTab] = useState<'editor' | 'tests' | 'hints'>('editor');
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<
    Array<{ id: string; passed: boolean; actual: string; message: string }>
  >([]);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(false);

  // Run test cases against user code
  const handleRunTests = () => {
    houseAudio.playTerminalBeep();
    setIsRunningTests(true);
    setHasRun(true);

    setTimeout(() => {
      setIsRunningTests(false);

      // Lightweight heuristic validator simulating C++ test pass
      // Checks for key algorithmic solutions
      let allPass = true;
      const results = challenge.testCases.map((tc, idx) => {
        let passed = false;
        let actual = '';

        if (challenge.id === 'dsa-arrays') {
          const hasSort = code.includes('std::sort') || (code.includes('std::swap') && code.includes('slots[j]'));
          passed = hasSort;
          actual = passed ? tc.expectedOutput : '[4, 3, 2, 1, 0] (Unsorted)';
        } else if (challenge.id === 'dsa-pointers') {
          const hasPrev = code.includes('prev = curr') || code.includes('curr->next = prev');
          const hasNextTemp = code.includes('nextNode') || code.includes('next');
          passed = hasPrev && hasNextTemp;
          actual = passed ? tc.expectedOutput : '0x00 (Segmentation fault: nullptr dereference)';
        } else if (challenge.id === 'dsa-stacks') {
          const hasStack = code.includes('std::stack') && code.includes('s.pop()') && code.includes('s.empty()');
          passed = hasStack;
          actual = passed ? tc.expectedOutput : 'Stack overflow / unbalanced';
        } else if (challenge.id === 'dsa-graphs') {
          const hasQueue = code.includes('std::queue') && code.includes('visited[');
          passed = hasQueue;
          actual = passed ? tc.expectedOutput : '-1 (Infinite cycle loop)';
        } else if (challenge.id === 'dsa-dp') {
          const hasDp = code.includes('dp[') || code.includes('memo[');
          passed = hasDp;
          actual = passed ? tc.expectedOutput : 'Timeout (>5000ms O(2^n) recursion)';
        } else {
          passed = true;
          actual = tc.expectedOutput;
        }

        if (!passed) allPass = false;

        return {
          id: tc.id,
          passed,
          actual,
          message: passed ? 'Execution successful · within Big-O target' : 'Assertion failed',
        };
      });

      setTestResults(results);

      if (allPass) {
        houseAudio.playValidationSuccess();
      } else {
        houseAudio.playValidationError();
      }
    }, 600);
  };

  const handleApplySolution = () => {
    onSolve(code);
  };

  const allPassed = hasRun && testResults.every((r) => r.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-graphite border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-gold-400/10 border border-gold-400/20 text-gold-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ivory">
                  {challenge.title}
                </h3>
                <span className="badge bg-gold-400/10 text-gold-400 text-[10px] border border-gold-400/30">
                  {challenge.topic}
                </span>
                {isSolved && (
                  <span className="badge bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/40">
                    ✓ Calibrated
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Target: <span className="text-gold-400 font-mono">{challenge.timeComplexityTarget}</span> · Space: <span className="text-gold-400 font-mono">{challenge.spaceComplexityTarget}</span>
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

        {/* Device Lore Banner */}
        <div className="px-4 py-2.5 bg-obsidian/60 border-b border-line text-xs text-muted flex items-start gap-2">
          <Cpu className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{challenge.deviceLore}</p>
        </div>

        {/* Content Body: Dual Pane Editor & Tests */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left 7 Cols: C++ Code Editor */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-line bg-obsidian/40">
            <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-elevated/50 text-xs">
              <span className="font-mono text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> main.cpp
              </span>
              <button
                onClick={() => setCode(challenge.starterCode)}
                className="text-[11px] text-muted hover:text-gold-400 flex items-center gap-1"
                title="Reset starter snippet"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="relative flex-1 p-2">
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  houseAudio.playMechanicalKeyClick();
                }}
                className="w-full h-full min-h-[300px] p-3 font-mono text-xs text-ivory bg-transparent resize-none outline-none leading-relaxed selection:bg-gold-400/30"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Right 5 Cols: Test Cases & Validation Feedback */}
          <div className="lg:col-span-5 flex flex-col bg-graphite overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ivory uppercase tracking-wider">
                  Test Case Suite
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {challenge.testCases.length} assertions
                </span>
              </div>

              <div className="space-y-2">
                {challenge.testCases.map((tc, idx) => {
                  const result = testResults.find((r) => r.id === tc.id);

                  return (
                    <div
                      key={tc.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        result?.passed
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : result && !result.passed
                          ? 'border-red-500/40 bg-red-500/10'
                          : 'border-line bg-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono mb-1">
                        <span className="text-ivory font-bold">Case #{idx + 1}</span>
                        {result?.passed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : result && !result.passed ? (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        ) : (
                          <span className="text-muted">Awaiting run</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted">Input: <span className="font-mono text-ivory">{tc.input}</span></p>
                      <p className="text-[11px] text-muted">Expected: <span className="font-mono text-gold-400">{tc.expectedOutput}</span></p>
                      {result && !result.passed && (
                        <p className="text-[11px] text-red-300 mt-1 font-mono">
                          Actual: {result.actual}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="border border-line rounded-lg p-3 bg-elevated/40">
              <button
                onClick={() => setShowHints((h) => !h)}
                className="w-full flex items-center justify-between text-xs font-medium text-muted hover:text-ivory"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-gold-400" />
                  <span>Algorithmic Hints ({challenge.hints.length})</span>
                </span>
                {showHints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHints && (
                <ul className="mt-2.5 space-y-1.5 text-xs text-muted list-disc list-inside">
                  {challenge.hints.map((hint, i) => (
                    <li key={i} className="leading-relaxed">{hint}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-line bg-elevated">
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-2 border-gold-400/40 text-gold-400 hover:bg-gold-400/10"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunningTests ? 'Executing C++...' : 'Run Test Cases'}</span>
            </button>

            <button
              onClick={handleApplySolution}
              disabled={!allPassed && !isSolved}
              className="btn btn-primary text-xs px-5 py-2 flex items-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{allPassed || isSolved ? 'Calibrate & Power Room' : 'Pass Tests to Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
