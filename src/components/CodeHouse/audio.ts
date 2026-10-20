/**
 * The Code House - Atmospheric Procedural Web Audio Engine
 * Provides eerie mansion ambience, footstep acoustics, item discovery chimes,
 * terminal bleeps, and validation feedback with zero external audio assets.
 */

export interface HouseAudioSettings {
  masterMuted: boolean;
  ambienceMuted: boolean;
  sfxMuted: boolean;
  masterVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
}

const SETTINGS_KEY = 'avenir-codehouse-audio-v1';

const DEFAULT_SETTINGS: HouseAudioSettings = {
  masterMuted: false,
  ambienceMuted: false,
  sfxMuted: false,
  masterVolume: 0.7,
  ambienceVolume: 0.4,
  sfxVolume: 0.65,
};

class CodeHouseAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public settings: HouseAudioSettings = { ...DEFAULT_SETTINGS };

  // Ambience generators
  private isAmbienceRunning = false;
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private lastFootstepTime = 0;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
    this.applyGains();
  }

  public initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);

        this.applyGains();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private applyGains() {
    if (!this.ctx || !this.masterGain || !this.ambienceGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const masterVal = this.settings.masterMuted ? 0 : this.settings.masterVolume;
    const ambVal = this.settings.ambienceMuted ? 0 : this.settings.ambienceVolume;
    const sfxVal = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;

    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, masterVal)), now, 0.05);
    this.ambienceGain.gain.setTargetAtTime(Math.max(0, Math.min(1, ambVal)), now, 0.05);
    this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, sfxVal)), now, 0.05);
  }

  // --- Volume / Mute Controls ---
  public setMasterMute(muted: boolean) {
    this.settings.masterMuted = muted;
    this.saveSettings();
  }

  public setAmbienceMute(muted: boolean) {
    this.settings.ambienceMuted = muted;
    this.saveSettings();
  }

  public setSfxMute(muted: boolean) {
    this.settings.sfxMuted = muted;
    this.saveSettings();
  }

  public setMasterVolume(val: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public setAmbienceVolume(val: number) {
    this.settings.ambienceVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public setSfxVolume(val: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  // --- Eerie Ambience Drone ---
  public startAmbience() {
    this.initContext();
    if (this.isAmbienceRunning || !this.ctx || !this.ambienceGain) return;

    try {
      this.isAmbienceRunning = true;
      const now = this.ctx.currentTime;

      // Low sub drone (55Hz - A1)
      this.ambienceOsc1 = this.ctx.createOscillator();
      this.ambienceOsc1.type = 'triangle';
      this.ambienceOsc1.frequency.setValueAtTime(55, now);

      // Mystery pad fifth (82.4Hz - E2)
      this.ambienceOsc2 = this.ctx.createOscillator();
      this.ambienceOsc2.type = 'sine';
      this.ambienceOsc2.frequency.setValueAtTime(82.4, now);

      // Filter with gentle slow movement
      this.ambienceFilter = this.ctx.createBiquadFilter();
      this.ambienceFilter.type = 'lowpass';
      this.ambienceFilter.frequency.setValueAtTime(260, now);
      this.ambienceFilter.Q.setValueAtTime(2.5, now);

      // Low Frequency Oscillator for subtle breathing air
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, now); // slow 8-second cycle
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(70, now);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.ambienceFilter.frequency);

      this.ambienceOsc1.connect(this.ambienceFilter);
      this.ambienceOsc2.connect(this.ambienceFilter);
      this.ambienceFilter.connect(this.ambienceGain);

      this.ambienceOsc1.start(now);
      this.ambienceOsc2.start(now);
      this.lfo.start(now);
    } catch {
      // Audio fallback
    }
  }

  public stopAmbience() {
    if (!this.isAmbienceRunning) return;
    this.isAmbienceRunning = false;

    try {
      this.ambienceOsc1?.stop();
      this.ambienceOsc1?.disconnect();
      this.ambienceOsc2?.stop();
      this.ambienceOsc2?.disconnect();
      this.lfo?.stop();
      this.lfo?.disconnect();
      this.lfoGain?.disconnect();
      this.ambienceFilter?.disconnect();
    } catch {
      // Ignore
    }

    this.ambienceOsc1 = null;
    this.ambienceOsc2 = null;
    this.lfo = null;
    this.lfoGain = null;
    this.ambienceFilter = null;
  }

  // --- Sound Effects ---

  /** Subtle footstep sound when walking */
  public playFootstep() {
    const now = performance.now();
    if (now - this.lastFootstepTime < 320) return; // limit footstep frequency
    this.lastFootstepTime = now;

    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft stone footstep: low frequency noise-like thud
      const freq = 75 + Math.random() * 20;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore
    }
  }

  /** Object inspection chime */
  public playInspect() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }

  /** Fragment pickup chord */
  public playFragmentPickup() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const startTime = this.ctx!.currentTime + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  /** Key collected chime */
  public playKeyPickup() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const startTime = this.ctx!.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  /** Door unlocked sound */
  public playDoorUnlock() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  }

  /** Terminal beep / access chirp */
  public playTerminalBeep() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(960, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1440, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  /** Code line inserted or removed */
  public playLineClick() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  /** Validation Success Fanfare */
  public playValidationSuccess() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      // Ascending triumphant champagne chord: D4, A4, D5, F#5, A5, D6
      const chord = [293.66, 440.0, 587.33, 739.99, 880.0, 1174.66];
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const startTime = this.ctx!.currentTime + idx * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
    } catch {
      // Ignore
    }
  }

  /** Validation Error Sound */
  public playValidationError() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch {
      // Ignore
    }
  }

  /** Mechanical keyboard click for code editing */
  public playMechanicalKeyClick() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      // High crisp click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const baseFreq = 2200 + Math.random() * 400;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore
    }
  }

  /** Bug squishing sound when catching roaming bugs */
  public playBugSquish() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  /** Emergency siren when fuse box timer trips */
  public playEmergencySiren() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // High-low wail
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.2);
      osc.frequency.linearRampToValueAtTime(920, now + 0.4);
      osc.frequency.linearRampToValueAtTime(580, now + 0.6);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // Ignore
    }
  }

  /** Decor item placed sound (satisfying mechanical snap) */
  public playDecorPlace() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(580, now + 0.08);

      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);

      osc1.start(now);
      osc1.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  /** Triumphant Fanfare */
  public playFanfare() {
    this.playValidationSuccess();
  }


  public teardown() {
    this.stopAmbience();
  }
}

export const houseAudio = new CodeHouseAudioEngine();
