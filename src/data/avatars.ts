/**
 * Human-like Futuristic Avatars for AVENIR ARENA Character Creation
 * High-quality stylized SVG placeholders portraying human characters (faces, hair, visors, headsets, high collars)
 * alongside their Google profile picture.
 */

export interface AvatarOption {
  id: string;
  name: string;
  callsign: string;
  role: string;
  url: string;
  accentColor: string;
}

export const FUTURISTIC_AVATARS: AvatarOption[] = [
  {
    id: 'cyber-student-kai',
    name: 'Cyber Cadet',
    callsign: 'KAI-01',
    role: 'Cyberpunk Student',
    accentColor: '#D0B477',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230D1117"/><circle cx="50" cy="50" r="46" stroke="%23D0B477" stroke-width="1.5" stroke-opacity="0.3"/><path d="M24 88C24 74 35 66 50 66C65 66 76 74 76 88" fill="%231E2430" stroke="%23D0B477" stroke-width="1.5"/><path d="M38 68L50 78L62 68" stroke="%23D0B477" stroke-width="2" stroke-linecap="round"/><path d="M36 48C36 38 42 28 50 28C58 28 64 38 64 48C64 58 58 64 50 64C42 64 36 58 36 48Z" fill="%23E8C4A2"/><path d="M32 38C32 26 40 18 50 18C60 18 68 24 68 34C64 30 58 28 50 28C42 28 36 32 32 38Z" fill="%231E232E"/><path d="M30 42C30 42 34 26 52 26C66 26 68 36 68 36C68 36 62 34 50 34C40 34 34 38 30 42Z" fill="%23D0B477"/><rect x="40" y="44" width="20" height="5" rx="2.5" fill="%230F172A" stroke="%23D0B477" stroke-width="1"/><circle cx="45" cy="46.5" r="1.5" fill="%2338BDF8"/><circle cx="55" cy="46.5" r="1.5" fill="%2338BDF8"/><circle cx="63" cy="48" r="2" fill="%23D0B477" stroke="%230F172A" stroke-width="1"/></svg>`,
  },
  {
    id: 'scifi-engineer-aria',
    name: 'Tech Specialist',
    callsign: 'ARIA-02',
    role: 'Sci-Fi Engineer',
    accentColor: '#38BDF8',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23081420"/><circle cx="50" cy="50" r="46" stroke="%2338BDF8" stroke-width="1.5" stroke-opacity="0.3"/><path d="M22 88C22 72 34 65 50 65C66 65 78 72 78 88" fill="%23112233" stroke="%2338BDF8" stroke-width="1.5"/><path d="M36 50C36 40 42 30 50 30C58 30 64 40 64 50C64 60 58 65 50 65C42 65 36 60 36 50Z" fill="%23DDB896"/><path d="M32 34C32 22 42 16 52 16C62 16 70 24 70 36C68 46 68 56 68 56C64 52 64 40 64 34C60 26 48 24 38 30L32 34Z" fill="%23223344"/><rect x="36" y="38" width="28" height="8" rx="4" fill="%230E1F2F" stroke="%2338BDF8" stroke-width="1.5"/><circle cx="43" cy="42" r="2.5" fill="%2338BDF8"/><circle cx="57" cy="42" r="2.5" fill="%2338BDF8"/><line x1="43" y1="46" x2="43" y2="52" stroke="%2338BDF8" stroke-width="1.5"/><circle cx="43" cy="53" r="2" fill="%2338BDF8"/></svg>`,
  },
  {
    id: 'pilot-rory',
    name: 'Arena Pilot',
    callsign: 'RORY-03',
    role: 'Futuristic Pilot',
    accentColor: '#F59E0B',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%231A1206"/><circle cx="50" cy="50" r="46" stroke="%23F59E0B" stroke-width="1.5" stroke-opacity="0.3"/><path d="M22 88C22 72 34 66 50 66C66 66 78 72 78 88" fill="%232C1E0D" stroke="%23F59E0B" stroke-width="1.5"/><path d="M30 48C30 32 38 20 50 20C62 20 70 32 70 48C70 64 62 68 50 68C38 68 30 64 30 48Z" fill="%231E1710" stroke="%23F59E0B" stroke-width="2"/><path d="M36 50C36 42 42 34 50 34C58 34 64 42 64 50C64 56 58 60 50 60C42 60 36 56 36 50Z" fill="%23E2B895"/><path d="M35 44H65L62 52H38L35 44Z" fill="%230F172A" stroke="%23F59E0B" stroke-width="1.5"/><circle cx="44" cy="48" r="2" fill="%23F59E0B"/><circle cx="56" cy="48" r="2" fill="%23F59E0B"/><line x1="50" y1="20" x2="50" y2="34" stroke="%23F59E0B" stroke-width="2"/></svg>`,
  },
  {
    id: 'quantum-hacker-nyx',
    name: 'Neural Operative',
    callsign: 'NYX-04',
    role: 'Quantum Hacker',
    accentColor: '#34D399',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23071A14"/><circle cx="50" cy="50" r="46" stroke="%2334D399" stroke-width="1.5" stroke-opacity="0.3"/><path d="M20 88C20 70 32 64 50 64C68 64 80 70 80 88" fill="%230E2920" stroke="%2334D399" stroke-width="1.5"/><path d="M28 46C28 30 38 18 50 18C62 18 72 30 72 46C72 64 64 74 50 74C36 74 28 64 28 46Z" fill="%2312382C"/><path d="M38 52C38 44 43 38 50 38C57 38 62 44 62 52C62 58 57 62 50 62C43 62 38 58 38 52Z" fill="%23DFBEA0"/><circle cx="45" cy="50" r="2" fill="%231E293B"/><circle cx="55" cy="50" r="3" fill="%23061A14" stroke="%2334D399" stroke-width="1.5"/><circle cx="55" cy="50" r="1.5" fill="%2334D399"/><path d="M38 60L50 66L62 60V70L50 76L38 70Z" fill="%230A241C" stroke="%2334D399" stroke-width="1"/></svg>`,
  },
  {
    id: 'tactician-zane',
    name: 'Apex Tactician',
    callsign: 'ZANE-05',
    role: 'Tactical Officer',
    accentColor: '#A855F7',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23140A24"/><circle cx="50" cy="50" r="46" stroke="%23A855F7" stroke-width="1.5" stroke-opacity="0.3"/><path d="M22 88C22 72 34 65 50 65C66 65 78 72 78 88" fill="%2324123E" stroke="%23A855F7" stroke-width="1.5"/><path d="M36 48C36 38 42 28 50 28C58 28 64 38 64 48C64 58 58 64 50 64C42 64 36 58 36 48Z" fill="%23DAB292"/><path d="M34 32C34 22 42 18 52 18C62 18 68 26 68 34L60 30L52 28L40 32L34 32Z" fill="%231A1D2A"/><rect x="38" y="44" width="24" height="6" rx="2" fill="%23120624" stroke="%23A855F7" stroke-width="1"/><circle cx="44" cy="47" r="1.5" fill="%23FFFFFF"/><circle cx="56" cy="47" r="1.5" fill="%23FFFFFF"/><path d="M63 46V54L61 55" stroke="%23A855F7" stroke-width="1.5" stroke-linecap="round"/><circle cx="63" cy="45" r="2" fill="%23A855F7"/></svg>`,
  },
];
