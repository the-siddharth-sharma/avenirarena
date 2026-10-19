import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code,
  Eye,
  HelpCircle,
  Laptop,
  Maximize2,
  RotateCcw,
  Smartphone,
  Sparkles,
  Tablet,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import type { WebDevChallenge } from './types';
import { houseAudio } from './audio';

interface WebDevStudioModalProps {
  challenge: WebDevChallenge;
  isSolved: boolean;
  onClose: () => void;
  onSolve: (html: string, css: string) => void;
}

export function WebDevStudioModal({
  challenge,
  isSolved,
  onClose,
  onSolve,
}: WebDevStudioModalProps) {
  const [htmlCode, setHtmlCode] = useState<string>(challenge.initialHtml);
  const [cssCode, setCssCode] = useState<string>(challenge.initialCss);
  const [activeEditorTab, setActiveEditorTab] = useState<'html' | 'css'>('html');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showHints, setShowHints] = useState<boolean>(false);

  // Live Rule Evaluations
  const ruleEvaluations = useMemo(() => {
    return challenge.rules.map((rule) => {
      let passed = false;

      if (challenge.id === 'webdev-semantics') {
        const hasHeader = htmlCode.includes('<header');
        const hasNav = htmlCode.includes('<nav');
        const hasMain = htmlCode.includes('<main');
        const hasFooter = htmlCode.includes('<footer');

        if (rule.id === 'rule-header') passed = hasHeader;
        else if (rule.id === 'rule-nav') passed = hasNav;
        else if (rule.id === 'rule-main') passed = hasMain;
        else if (rule.id === 'rule-footer') passed = hasFooter;
      } else if (challenge.id === 'webdev-flexbox') {
        const hasFlex = cssCode.includes('display: flex') || cssCode.includes('display:flex');
        const hasJustify =
          cssCode.includes('justify-content: space-between') ||
          cssCode.includes('justify-content:space-between') ||
          cssCode.includes('justify-content: space-around') ||
          cssCode.includes('justify-content: space-evenly') ||
          cssCode.includes('justify-content: center');
        const hasAlign =
          cssCode.includes('align-items: center') || cssCode.includes('align-items:center');

        if (rule.id === 'rule-display-flex') passed = hasFlex;
        else if (rule.id === 'rule-justify') passed = hasJustify;
        else if (rule.id === 'rule-align') passed = hasAlign;
      } else if (challenge.id === 'webdev-boxmodel') {
        const hasBoxSizing = cssCode.includes('box-sizing: border-box') || cssCode.includes('border-box');
        const hasPadding = cssCode.includes('padding: 2') || cssCode.includes('padding:2') || cssCode.includes('padding: 1') || cssCode.includes('padding:1');
        const hasBorder = cssCode.includes('border:') || cssCode.includes('border: 2px');

        if (rule.id === 'rule-box-sizing') passed = hasBoxSizing;
        else if (rule.id === 'rule-padding') passed = hasPadding;
        else if (rule.id === 'rule-border') passed = hasBorder;
      } else if (challenge.id === 'webdev-animations') {
        const hasKeyframes = cssCode.includes('@keyframes');
        const hasAnimation = cssCode.includes('animation:') || cssCode.includes('animation :');
        const hasMedia = cssCode.includes('@media');

        if (rule.id === 'rule-keyframes') passed = hasKeyframes;
        else if (rule.id === 'rule-animation-applied') passed = hasAnimation;
        else if (rule.id === 'rule-media-query') passed = hasMedia;
      } else {
        passed = true;
      }

      return {
        ...rule,
        passed,
      };
    });
  }, [challenge, htmlCode, cssCode]);

  const allRulesPassed = ruleEvaluations.every((r) => r.passed);

  // Construct iframe srcDoc for live, real-time mini-preview
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
</body>
</html>`;
  }, [htmlCode, cssCode]);

  const handleApplyToRoom = () => {
    houseAudio.playValidationSuccess();
    onSolve(htmlCode, cssCode);
  };

  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'w-[480px]',
    mobile: 'w-[320px]',
  }[viewportMode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-graphite border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ivory">
                  {challenge.title}
                </h3>
                <span className="badge bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/30">
                  {challenge.topic}
                </span>
                {isSolved && (
                  <span className="badge bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/40">
                    ✓ Compiled to Estate
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {challenge.targetExplanation}
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

        {/* Studio Body: Split View (Editor on Left, Live Preview on Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[460px]">
          {/* Left 6 Cols: Code Editors & Rule Checklist */}
          <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-line bg-obsidian/40">
            {/* Editor Tab Switcher */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-elevated/50 text-xs">
              <div className="flex items-center gap-1.5 p-0.5 rounded bg-graphite border border-line">
                <button
                  onClick={() => setActiveEditorTab('html')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    activeEditorTab === 'html'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-muted hover:text-ivory'
                  }`}
                >
                  HTML Template
                </button>
                <button
                  onClick={() => setActiveEditorTab('css')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    activeEditorTab === 'css'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-muted hover:text-ivory'
                  }`}
                >
                  CSS Stylesheet
                </button>
              </div>

              <button
                onClick={() => {
                  setHtmlCode(challenge.initialHtml);
                  setCssCode(challenge.initialCss);
                }}
                className="text-[11px] text-muted hover:text-cyan-400 flex items-center gap-1"
                title="Reset to initial wireframe"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Active Code Textarea */}
            <div className="relative flex-1 p-2 bg-obsidian/60">
              {activeEditorTab === 'html' ? (
                <textarea
                  value={htmlCode}
                  onChange={(e) => {
                    setHtmlCode(e.target.value);
                    houseAudio.playMechanicalKeyClick();
                  }}
                  className="w-full h-full min-h-[240px] p-3 font-mono text-xs text-cyan-300 bg-transparent resize-none outline-none leading-relaxed selection:bg-cyan-500/30"
                  spellCheck={false}
                  placeholder="Enter HTML markup..."
                />
              ) : (
                <textarea
                  value={cssCode}
                  onChange={(e) => {
                    setCssCode(e.target.value);
                    houseAudio.playMechanicalKeyClick();
                  }}
                  className="w-full h-full min-h-[240px] p-3 font-mono text-xs text-purple-300 bg-transparent resize-none outline-none leading-relaxed selection:bg-purple-500/30"
                  spellCheck={false}
                  placeholder="Enter CSS rules..."
                />
              )}
            </div>

            {/* Live Requirements Checklist */}
            <div className="p-3 border-t border-line bg-graphite space-y-1.5 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                Live Verification Checklist
              </span>
              {ruleEvaluations.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-2 text-xs p-1.5 rounded border transition-colors ${
                    rule.passed
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-line bg-elevated text-muted'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      rule.passed ? 'text-emerald-400' : 'text-muted/40'
                    }`}
                  />
                  <span className="truncate">{rule.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Live Interactive Mini-Preview */}
          <div className="lg:col-span-6 flex flex-col bg-graphite">
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-elevated/50 text-xs">
              <span className="text-muted flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Room DOM Preview</span>
              </span>

              {/* Viewport Mode Switcher */}
              <div className="flex items-center gap-1 bg-graphite border border-line rounded p-0.5">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1 rounded ${
                    viewportMode === 'desktop' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted hover:text-ivory'
                  }`}
                  title="Desktop View (100%)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('tablet')}
                  className={`p-1 rounded ${
                    viewportMode === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted hover:text-ivory'
                  }`}
                  title="Tablet View (480px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1 rounded ${
                    viewportMode === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted hover:text-ivory'
                  }`}
                  title="Mobile View (320px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Preview Container */}
            <div className="flex-1 flex items-center justify-center p-3 bg-obsidian/80 overflow-auto">
              <div
                className={`h-full min-h-[300px] border border-cyan-500/20 rounded-lg shadow-xl overflow-hidden bg-obsidian transition-all duration-300 ${viewportWidthClass}`}
              >
                <iframe
                  title="Live Room Preview"
                  srcDoc={srcDoc}
                  className="w-full h-full min-h-[320px] border-none"
                  sandbox="allow-scripts"
                />
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="p-3 border-t border-line bg-elevated/40">
              <button
                onClick={() => setShowHints((h) => !h)}
                className="w-full flex items-center justify-between text-xs font-medium text-muted hover:text-ivory"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Web Architect Hints ({challenge.hints.length})</span>
                </span>
                {showHints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHints && (
                <ul className="mt-2 space-y-1 text-xs text-muted list-disc list-inside">
                  {challenge.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-line bg-elevated">
          <button onClick={onClose} className="btn btn-secondary text-xs px-4 py-2">
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:inline">
              {allRulesPassed ? 'All specifications satisfied!' : 'Satisfy checklist to compile'}
            </span>

            <button
              onClick={handleApplyToRoom}
              disabled={!allRulesPassed && !isSolved}
              className="btn btn-primary text-xs px-5 py-2 flex items-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{allRulesPassed || isSolved ? 'Compile & Apply to Room' : 'Fix Checklist to Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
