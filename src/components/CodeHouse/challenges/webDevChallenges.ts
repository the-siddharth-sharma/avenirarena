import type { WebDevChallenge } from '../types';

export const WEBDEV_CHALLENGES: Record<string, WebDevChallenge> = {
  'webdev-semantics': {
    id: 'webdev-semantics',
    roomId: 'wireframe-foyer',
    title: 'The Wireframe Foyer: HTML Semantics & Load-Bearing Architecture',
    topic: 'HTML Semantics',
    difficulty: 'Beginner',
    deviceLore:
      'The entrance hall is currently composed of unstable, unsemantic <div> boxes. Screen readers are lost, and the digital foundations are crumbling. Replace generic containers with semantic landmarks (<header>, <nav>, <main>, <footer>) to solidify the foyer walls into permanent stone architecture.',
    description:
      'Upgrade the raw wireframe markup using appropriate semantic HTML5 elements. Identify the banner, navigation, primary content, and footer.',
    initialHtml: `<div class="foyer-container">
  <!-- Replace with <header> -->
  <div class="top-bar">
    <h1>🏛️ The Grand Foyer</h1>
    <span class="status-pill">Wireframe Status: Draft</span>
  </div>

  <!-- Replace with <nav> -->
  <div class="navigation-hub">
    <a href="#study" class="nav-link">Retro Study</a>
    <a href="#living" class="nav-link">Living Quarters</a>
    <a href="#garden" class="nav-link">Courtyard</a>
  </div>

  <!-- Replace with <main> -->
  <div class="central-hall">
    <h2>Welcome, Web Architect</h2>
    <p>Semantic tags give accessibility, structure, and structural rigidity to digital spaces.</p>
  </div>

  <!-- Replace with <footer> -->
  <div class="bottom-ledger">
    <small>Mansion Blueprint Engine v3.0 · Built with HTML5</small>
  </div>
</div>`,
    initialCss: `.foyer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #0f172a;
  border: 2px dashed #38bdf8;
  padding: 24px;
  border-radius: 12px;
  color: #f8fafc;
  font-family: sans-serif;
}
header, .top-bar {
  background: #1e293b;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #38bdf8;
}
nav, .navigation-hub {
  display: flex;
  gap: 12px;
  background: #1e293b;
  padding: 12px 16px;
  border-radius: 8px;
}
.nav-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}
main, .central-hall {
  background: #1e293b;
  padding: 24px;
  border-radius: 8px;
  line-height: 1.6;
}
footer, .bottom-ledger {
  background: #090d16;
  padding: 12px;
  text-align: center;
  color: #94a3b8;
  border-radius: 8px;
}`,
    targetExplanation:
      'Transform the foyer from a generic <div> layout into clean semantic HTML5 by using <header>, <nav>, <main>, and <footer>.',
    rules: [
      {
        id: 'rule-header',
        description: 'Contains a semantic <header> element replacing the top bar div',
        requiredProperty: 'header',
      },
      {
        id: 'rule-nav',
        description: 'Contains a semantic <nav> element wrapping the navigation links',
        requiredProperty: 'nav',
      },
      {
        id: 'rule-main',
        description: 'Contains a semantic <main> element enclosing the central hall content',
        requiredProperty: 'main',
      },
      {
        id: 'rule-footer',
        description: 'Contains a semantic <footer> element for the bottom attribution',
        requiredProperty: 'footer',
      },
    ],
    hints: [
      'Replace <div class="top-bar"> with <header class="top-bar"> and close with </header>.',
      'Wrap links with <nav> instead of <div>.',
      'Use <main> for primary content and <footer> for bottom status.',
    ],
    xpReward: 150,
    previewType: 'cardboard-foyer',
  },

  'webdev-flexbox': {
    id: 'webdev-flexbox',
    roomId: 'living-room',
    title: 'The Living Room: CSS Flexbox & Grid Realignment',
    topic: 'Flexbox & Grid',
    difficulty: 'Intermediate',
    deviceLore:
      'A gravity distortion in the living room has tossed the furniture into total disarray. Sofas are stacked on top of TVs, and tables are pushed against the ceiling. Use CSS Flexbox to snap the furniture items into a balanced, spacious living room arrangement.',
    description:
      'Configure the .furniture-stage container using modern CSS Flexbox. Align the sofa, coffee table, and smart TV across the room with clean spacing.',
    initialHtml: `<div class="furniture-stage">
  <div class="furniture-piece sofa">
    <div class="icon">🛋️</div>
    <div class="label">Cyber Sofa</div>
  </div>
  <div class="furniture-piece table">
    <div class="icon">☕</div>
    <div class="label">Glass Table</div>
  </div>
  <div class="furniture-piece display">
    <div class="icon">🖥️</div>
    <div class="label">Holo TV</div>
  </div>
</div>`,
    initialCss: `.furniture-stage {
  /* BUG: Block display stacks everything vertically! */
  display: block;
  background: #18181b;
  border: 2px solid #3f3f46;
  border-radius: 12px;
  padding: 32px;
  min-height: 220px;
}

.furniture-piece {
  background: #27272a;
  border: 2px solid #52525b;
  border-radius: 8px;
  padding: 16px 24px;
  text-align: center;
  color: #f4f4f5;
  font-family: sans-serif;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}

.furniture-piece .icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.furniture-piece .label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,
    targetExplanation:
      'Change .furniture-stage to display: flex; with justify-content: space-between (or space-around) and align-items: center.',
    rules: [
      {
        id: 'rule-display-flex',
        description: '.furniture-stage must declare "display: flex"',
        selector: '.furniture-stage',
        requiredProperty: 'display',
        requiredValueRegex: 'flex',
      },
      {
        id: 'rule-justify',
        description: 'Declare "justify-content" with "space-between", "space-around", or "space-evenly"',
        selector: '.furniture-stage',
        requiredProperty: 'justify-content',
        requiredValueRegex: 'space-(between|around|evenly)|center',
      },
      {
        id: 'rule-align',
        description: 'Align items vertically with "align-items: center"',
        selector: '.furniture-stage',
        requiredProperty: 'align-items',
        requiredValueRegex: 'center',
      },
    ],
    hints: [
      'In .furniture-stage, replace "display: block;" with "display: flex;".',
      'Add "justify-content: space-between;" to spread the pieces across the width.',
      'Add "align-items: center;" to vertically center the pieces.',
    ],
    xpReward: 200,
    previewType: 'disarray-living-room',
  },

  'webdev-boxmodel': {
    id: 'webdev-boxmodel',
    roomId: 'bedroom',
    title: 'The Master Bedroom: CSS Box Model & Spatial Collisions',
    topic: 'CSS Box Model',
    difficulty: 'Intermediate',
    deviceLore:
      'The canopy bed, wardrobe, and ornamental area rugs are overlapping in glitchy collisions because standard box sizing and margins are missing. Re-establish harmonious proportions using the CSS Box Model (margin, padding, border-box).',
    description:
      'Tune the box model dimensions of the bedroom suite. Set box-sizing: border-box, add perimeter margins to eliminate collisions, and apply aesthetic border radii.',
    initialHtml: `<div class="bedroom-suite">
  <div class="decor-card bed">
    <div class="decor-header">🛏️ Master Canopy Bed</div>
    <p>Luxury cyber-foam mattress with integrated sleep metrics.</p>
  </div>
  <div class="decor-card wardrobe">
    <div class="decor-header">🚪 Nanotech Wardrobe</div>
    <p>Stores synthetic garments with instant automated steam cleaning.</p>
  </div>
  <div class="decor-card rug">
    <div class="decor-header">✨ Luminous Cyber Rug</div>
    <p>Floor rug with programmable light filaments.</p>
  </div>
</div>`,
    initialCss: `* {
  /* Set global box-sizing to border-box */
  box-sizing: border-box;
}

.bedroom-suite {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: #111827;
  padding: 24px;
  border-radius: 12px;
}

.decor-card {
  flex: 1 1 200px;
  background: #1f2937;
  color: #f3f4f6;
  font-family: sans-serif;
  /* Add margin, padding, and border */
  margin: 8px;
  padding: 20px;
  border: 2px solid #6366f1;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);
}

.decor-header {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #a5b4fc;
}

.decor-card p {
  font-size: 13px;
  line-height: 1.5;
  color: #9ca3af;
  margin: 0;
}`,
    targetExplanation:
      'Ensure box-sizing: border-box is applied, each card has healthy padding (>= 16px), margin spacing, and an active border.',
    rules: [
      {
        id: 'rule-box-sizing',
        description: 'Contains "box-sizing: border-box"',
        requiredProperty: 'box-sizing',
        requiredValueRegex: 'border-box',
      },
      {
        id: 'rule-padding',
        description: '.decor-card contains "padding" (at least 16px)',
        selector: '.decor-card',
        requiredProperty: 'padding',
      },
      {
        id: 'rule-border',
        description: '.decor-card specifies a stylized "border"',
        selector: '.decor-card',
        requiredProperty: 'border',
      },
    ],
    hints: [
      'Ensure box-sizing: border-box; is present.',
      'Provide padding: 20px; to the .decor-card class so the text has room to breathe.',
      'Set border: 2px solid #6366f1; to give clean neon edges.',
    ],
    xpReward: 200,
    previewType: 'overlapping-bedroom',
  },

  'webdev-animations': {
    id: 'webdev-animations',
    roomId: 'backyard-garden',
    title: 'The Courtyard Patio: Kinetic Keyframe Animations & Media Queries',
    topic: 'CSS Animations & Responsive',
    difficulty: 'Advanced',
    deviceLore:
      'The courtyard water feature has frozen into a static polygon, and the ambient lanterns are dark. Breathe life into the patio by authoring a @keyframes ripple animation, and provide a responsive @media query so the patio scales down seamlessly on mobile screens.',
    description:
      'Define a @keyframes animation that makes the fountain pulses ripple continuously, and include a @media (max-width: 768px) rule to ensure responsive layout behavior.',
    initialHtml: `<div class="patio-viewport">
  <div class="fountain-shrine">
    <div class="water-ring inner"></div>
    <div class="water-ring outer"></div>
    <div class="fountain-spout">⛲</div>
  </div>
  <div class="garden-chimes">
    <div class="chime-node">🎐 Zen Chime</div>
    <div class="chime-node">🏮 Cyber Lantern</div>
  </div>
</div>`,
    initialCss: `.patio-viewport {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: radial-gradient(circle, #064e3b 0%, #022c22 100%);
  padding: 40px;
  border-radius: 16px;
  border: 2px solid #10b981;
}

.fountain-shrine {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fountain-spout {
  font-size: 36px;
  z-index: 2;
}

.water-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid #34d399;
  /* Add animation: ripple 2s infinite */
  animation: ripple 2s infinite ease-out;
}

.water-ring.inner {
  width: 70px;
  height: 70px;
}

.water-ring.outer {
  width: 120px;
  height: 120px;
  animation-delay: 1s;
}

/* Define @keyframes ripple here */
@keyframes ripple {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* Add @media query */
@media (max-width: 768px) {
  .patio-viewport {
    flex-direction: column;
    gap: 24px;
  }
}`,
    targetExplanation:
      'Define a @keyframes ripple animation and apply it with animation: ripple ..., and include a @media rule.',
    rules: [
      {
        id: 'rule-keyframes',
        description: 'Defines a "@keyframes ripple" (or custom pulse) animation block',
        requiredProperty: '@keyframes',
      },
      {
        id: 'rule-animation-applied',
        description: 'Applies "animation:" to the .water-ring element',
        selector: '.water-ring',
        requiredProperty: 'animation',
      },
      {
        id: 'rule-media-query',
        description: 'Includes a "@media (max-width: ...)" responsive query',
        requiredProperty: '@media',
      },
    ],
    hints: [
      'Write @keyframes ripple { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }',
      'Assign animation: ripple 2s infinite ease-out; to the rings.',
      'Add @media (max-width: 768px) { .patio-viewport { flex-direction: column; } }',
    ],
    xpReward: 250,
    previewType: 'kinetic-backyard',
  },
};
