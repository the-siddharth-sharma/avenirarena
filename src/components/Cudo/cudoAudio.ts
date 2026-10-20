/**
 * CUDO Procedural Web Audio Sound Engine
 * Provides authentic synthesized chimes, dice rolls, tile effects,
 * and board ambience with zero external audio assets.
 */

export interface CudoAudioSettings {
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  masterVolume: number; // 0 to 1
  musicVolume: number;  // 0 to 1
  sfxVolume: number;    // 0 to 1
}

const SETTINGS_KEY = 'avenir-cudo-audio-v1';

const DEFAULT_SETTINGS: CudoAudioSettings = {
  masterMuted: false,
  musicMuted: false,
  sfxMuted: false,
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.8,
};

class CudoAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public settings: CudoAudioSettings = { ...DEFAULT_SETTINGS };
  private isMusicPlaying = false;
  private musicTimer: number | null = null;
  private musicStep = 0;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }

  public saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    this.applyGains();
  }

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    this.applyGains();
  }

  private applyGains() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const masterVol = this.settings.masterMuted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setValueAtTime(masterVol, t);

    const musicVol = this.settings.musicMuted ? 0 : this.settings.musicVolume;
    this.musicGain.gain.setValueAtTime(musicVol, t);

    const sfxVol = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;
    this.sfxGain.gain.setValueAtTime(sfxVol, t);
  }

  public ensureRunning() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ── SOUND EFFECTS ─────────────────────────────────────────────────────────

  /**
   * Sound of dice shaking and rolling across the board
   */
  public playDiceRoll() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 200, now + i * 0.1);

      gain.gain.setValueAtTime(0.3, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.08);
    }
  }

  /**
   * Pawn moving step
   */
  public playPawnStep() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Challenge trigger alert
   */
  public playChallengeAlert() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [330, 495, 660];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.18);
    });
  }

  /**
   * Correct challenge resolution + XP reward
   */
  public playSuccessChime() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  /**
   * Wrong challenge buzzer
   */
  public playFailureBuzz() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Boost tile sound
   */
  public playBoost() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Hazard tile sound
   */
  public playHazard() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Grand victory fanfare
   */
  public playVictory() {
    this.ensureRunning();
    if (!this.ctx || !this.sfxGain || this.settings.sfxMuted || this.settings.masterMuted) return;

    const now = this.ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.0], // C4
      [329.63, 392.0, 523.25], // E4
      [392.0, 523.25, 659.25], // G4
      [523.25, 659.25, 783.99, 1046.5], // C5
    ];

    chords.forEach((chord, chordIdx) => {
      chord.forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + chordIdx * 0.18);

        gain.gain.setValueAtTime(0.3, now + chordIdx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chordIdx * 0.18 + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + chordIdx * 0.18);
        osc.stop(now + chordIdx * 0.18 + 0.5);
      });
    });
  }

  // ── BACKGROUND AMBIENCE SEQUENCER ─────────────────────────────────────────

  public startBackgroundMusic() {
    this.ensureRunning();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const bassLine = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.settings.musicMuted || this.settings.masterMuted) {
        return;
      }
      const now = this.ctx.currentTime;
      const freq = bassLine[this.musicStep % bassLine.length];
      this.musicStep++;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 1.2);
    }, 1400);
  }

  public stopBackgroundMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }

  public stopAll() {
    this.stopBackgroundMusic();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  // ── SETTINGS MUTATORS ─────────────────────────────────────────────────────

  public setMasterMute(muted: boolean) {
    this.settings.masterMuted = muted;
    this.saveSettings();
  }

  public setMusicMute(muted: boolean) {
    this.settings.musicMuted = muted;
    this.saveSettings();
  }

  public setSfxMute(muted: boolean) {
    this.settings.sfxMuted = muted;
    this.saveSettings();
  }

  public setMasterVolume(vol: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setMusicVolume(vol: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }
}

export const cudoAudio = new CudoAudioController();
