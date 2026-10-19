import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
  X,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  type CodeRunnerLevel,
  evaluateSolution,
  type EvaluationResult,
} from '@/data/codeRunnerLevels';

interface DsaCodeLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: CodeRunnerLevel;
  onCompleteLevel: (levelId: string, earnedXP: number) => void;
  isAlreadyCompleted: boolean;
}

export function DsaCodeLabModal({
  isOpen,
  onClose,
  level,
  onCompleteLevel,
  isAlreadyCompleted,
}: DsaCodeLabModalProps) {
  const [code, setCode] = useState(level.initialCode);
  const [activeTab, setActiveTab] = useState<'problem' | 'editor'>('editor');
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    // Slight simulated frame delay for tactile execution feel
    setTimeout(() => {
      const result = evaluateSolution(code, level.functionName, level.testCases);
      setEvalResult(result);
      setIsRunning(false);

      if (result.allPassed) {
        onCompleteLevel(level.id, level.xpReward);
      }
    }, 120);
  };

  const handleResetCode = () => {
    setCode(level.initialCode);
    setEvalResult(null);
  };

  const revealNextHint = () => {
    if (hintsRevealed < level.hints.length) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-obsidian/95 backdrop-blur-md animate-fade-in text-left">
      <div className="relative flex flex-col max-w-4xl w-full h-[92vh] rounded-2xl border border-line bg-graphite shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-line bg-elevated/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-gold-400/30 bg-gold-400/10 text-gold-400 shadow-[0_0_15px_rgba(208,180,119,0.2)]">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-gold-400 tracking-wider">
                  DSA CODE LAB · LEVEL 0{level.order}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-gold-400/30 bg-gold-400/10 text-gold-300">
                  {level.topic}
                </span>
                {isAlreadyCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="h-3 w-3" />
                    Cleared
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-ivory tracking-tight">
                {level.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-400/20 bg-gold-400/10 font-mono text-xs text-gold-400">
              <Zap className="h-3.5 w-3.5 fill-gold-400" />
              <span>+{level.xpReward} XP</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-ivory hover:bg-elevated transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-line bg-graphite text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono transition-colors ${
                activeTab === 'editor'
                  ? 'bg-elevated text-ivory border border-line font-semibold'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-gold-400" />
              <span>Code & Tests</span>
            </button>
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono transition-colors ${
                activeTab === 'problem'
                  ? 'bg-elevated text-ivory border border-line font-semibold'
                  : 'text-muted hover:text-ivory'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 text-gold-400" />
              <span>Problem Description</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCode}
              className="text-xs text-muted hover:text-ivory flex items-center gap-1 px-2.5 py-1 rounded border border-line/60 bg-elevated/40 hover:bg-elevated"
              title="Reset code to starter template"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset Code</span>
            </button>
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-[0_0_15px_rgba(208,180,119,0.25)]"
            >
              <Play className="h-3.5 w-3.5 fill-obsidian" />
              <span>{isRunning ? 'Running...' : 'Run All Tests'}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {activeTab === 'problem' ? (
            /* Problem Description Tab */
            <div className="space-y-5 max-w-2xl">
              <div>
                <h4 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold mb-1">
                  MISSION OBJECTIVE
                </h4>
                <p className="text-sm sm:text-base text-ivory leading-relaxed">
                  {level.detailedInstructions}
                </p>
              </div>

              {/* Sample Test Case Previews */}
              <div>
                <h5 className="text-xs uppercase font-mono tracking-wider text-muted font-bold mb-2">
                  Example Test Scenarios:
                </h5>
                <div className="space-y-2 font-mono text-xs">
                  {level.testCases.slice(0, 2).map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-line bg-elevated space-y-1"
                    >
                      <div className="text-gold-400 font-bold">
                        Input: {JSON.stringify(tc.input)}
                      </div>
                      <div className="text-emerald-400">
                        Expected Output: {JSON.stringify(tc.expectedOutput)}
                      </div>
                      {tc.label && <div className="text-muted text-[11px]">{tc.label}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hints Disclosure */}
              <div className="p-4 rounded-xl border border-line bg-elevated/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-gold-400" />
                    <span className="font-mono text-xs font-bold text-ivory">
                      Algorithmic Hints ({hintsRevealed}/{level.hints.length})
                    </span>
                  </div>
                  {hintsRevealed < level.hints.length && (
                    <button
                      onClick={revealNextHint}
                      className="text-xs font-mono text-gold-400 hover:underline flex items-center gap-1"
                    >
                      <span>Reveal Hint #{hintsRevealed + 1}</span>
                    </button>
                  )}
                </div>

                {hintsRevealed === 0 ? (
                  <p className="text-xs text-muted font-mono italic">
                    Hints are hidden to test your independent problem-solving skills. Click
                    &quot;Reveal Hint&quot; if you need guidance.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {level.hints.slice(0, hintsRevealed).map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-gold-400/30 bg-gold-400/5 text-xs text-ivory font-mono leading-relaxed"
                      >
                        <span className="text-gold-400 font-bold mr-2">Hint {idx + 1}:</span>
                        {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Code Editor & Test Results Split View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[460px]">
              {/* Code Editor Panel */}
              <div className="lg:col-span-7 flex flex-col rounded-xl border border-line bg-obsidian overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-elevated/60 text-xs font-mono text-muted">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" />
                    </div>
                    <span className="text-ivory font-semibold">{level.functionName}.js</span>
                  </div>
                  <span>JavaScript / TypeScript</span>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full p-4 bg-transparent text-ivory font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none custom-scrollbar min-h-[280px]"
                />
              </div>

              {/* Test Cases & Validation Panel */}
              <div className="lg:col-span-5 flex flex-col rounded-xl border border-line bg-elevated/30 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-elevated/60 text-xs font-mono">
                  <span className="text-ivory font-semibold">Test Results</span>
                  {evalResult ? (
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        evalResult.allPassed ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {evalResult.allPassed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>All {evalResult.passedCount} Passed</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>
                            {evalResult.passedCount}/{evalResult.totalCount} Passed
                          </span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">Ready to test</span>
                  )}
                </div>

                {/* Overall Banner if all passed */}
                {evalResult?.allPassed && (
                  <div className="m-3 p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">LEVEL COMPLETE!</div>
                        <div className="text-[11px] text-emerald-400/90">
                          +{level.xpReward} XP earned. Next level unlocked!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Case Tab Buttons */}
                <div className="flex items-center gap-1 p-2 border-b border-line/60 bg-elevated/20 overflow-x-auto text-xs font-mono">
                  {level.testCases.map((tc, idx) => {
                    const result = evalResult?.results[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveTestCaseIndex(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors shrink-0 ${
                          activeTestCaseIndex === idx
                            ? 'bg-elevated text-ivory border border-line font-bold'
                            : 'text-muted hover:text-ivory'
                        }`}
                      >
                        {result ? (
                          result.passed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-400" />
                          )
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-muted inline-block" />
                        )}
                        <span>Case {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Test Case Detail */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs font-mono custom-scrollbar">
                  {(() => {
                    const tc = level.testCases[activeTestCaseIndex];
                    const res = evalResult?.results[activeTestCaseIndex];

                    return (
                      <div className="space-y-2.5">
                        {tc.label && (
                          <div className="text-muted text-[11px] pb-1 border-b border-line/40">
                            {tc.label}
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] uppercase text-muted block mb-0.5">
                            Input
                          </span>
                          <pre className="p-2 rounded bg-obsidian border border-line text-ivory text-[11px] overflow-x-auto">
                            {JSON.stringify(tc.input, null, 2)}
                          </pre>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase text-muted block mb-0.5">
                            Expected Output
                          </span>
                          <pre className="p-2 rounded bg-obsidian border border-line text-emerald-400 text-[11px] overflow-x-auto">
                            {JSON.stringify(tc.expectedOutput, null, 2)}
                          </pre>
                        </div>

                        {res && (
                          <div>
                            <span className="text-[10px] uppercase text-muted block mb-0.5">
                              Actual Output
                            </span>
                            <pre
                              className={`p-2 rounded border text-[11px] overflow-x-auto ${
                                res.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-red-500/10 border-red-500/30 text-red-300'
                              }`}
                            >
                              {res.error
                                ? `Error: ${res.error}`
                                : JSON.stringify(res.actualOutput, null, 2)}
                            </pre>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{res.executionTimeMs} ms</span>
                              </span>
                              <span
                                className={`font-bold ${
                                  res.passed ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {res.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-line bg-elevated/70 flex items-center justify-between text-xs font-mono">
          <div className="text-muted flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-gold-400" />
            <span>Pass all test cases to complete level and unlock next milestone</span>
          </div>

          <button onClick={onClose} className="btn btn-secondary text-xs py-1.5 px-4">
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
}
