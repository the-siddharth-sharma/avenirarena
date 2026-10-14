/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All colors map to CSS variables so they switch with the theme.
        // Light = Mech Lab Cockpit, Dark = Cyberpunk HUD.
        obsidian: 'var(--c-bg)',
        graphite: {
          DEFAULT: 'var(--c-surface)',
          light: 'var(--c-surface-2)',
        },
        elevated: {
          DEFAULT: 'var(--c-elevated)',
          light: 'var(--c-elevated-2)',
        },
        ivory: 'var(--c-text)',
        muted: 'var(--c-text-muted)',
        gold: {
          300: 'var(--c-accent-light)',
          400: 'var(--c-accent)',
          500: 'var(--c-accent)',
          700: 'var(--c-accent-dark)',
        },
        accent: {
          300: 'var(--c-accent-light)',
          400: 'var(--c-accent)',
          500: 'var(--c-accent)',
          600: 'var(--c-accent)',
          700: 'var(--c-accent-dark)',
        },
        line: {
          DEFAULT: 'var(--c-border)',
          light: 'var(--c-border-light)',
        },
        emerald: {
          400: 'var(--c-success)',
          500: 'var(--c-success)',
          600: 'var(--c-success)',
        },
        amber: {
          400: 'var(--c-warning)',
          500: 'var(--c-warning)',
          600: 'var(--c-warning)',
        },
        crimson: {
          400: 'var(--c-error)',
          500: 'var(--c-error)',
          600: 'var(--c-error)',
        },
        ocean: {
          400: 'var(--c-accent-2)',
          500: 'var(--c-accent-2)',
          600: 'var(--c-accent-2)',
        },
        // Semantic shorthands used by pages
        success: {
          400: 'var(--c-success)',
          500: 'var(--c-success)',
        },
        warning: {
          400: 'var(--c-warning)',
          500: 'var(--c-warning)',
        },
        error: {
          400: 'var(--c-error)',
          500: 'var(--c-error)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'scan-beam': 'scanBeam 10s linear infinite',
        'shimmer': 'shimmer 4s ease-in-out infinite',
        'circuit-sweep': 'circuitSweep 5s ease-in-out infinite',
        'grid-pulse': 'gridPulse 6s ease-in-out infinite',
        'crosshair-rotate': 'crosshairRotate 30s linear infinite',
        'status-pulse': 'statusPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scanBeam: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%, 100%': { transform: 'translateX(-150%)' },
          '50%': { transform: 'translateX(150%)' },
        },
        circuitSweep: {
          '0%, 100%': { opacity: '0', transform: 'translateX(-100%)' },
          '50%': { opacity: '0.6', transform: 'translateX(100%)' },
        },
        gridPulse: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.35' },
        },
        crosshairRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        statusPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};
