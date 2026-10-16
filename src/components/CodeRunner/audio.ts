/**
 * Complete Procedural Web Audio Sound Engine for Code Runner
 * Features:
 * - Driving cyberpunk background music sequencer
 * - Atmospheric menu ambience pad
 * - Rich SFX suite: lane switch, correct, wrong, combo milestones, countdown, UI clicks
 * - Independent master, music, and SFX volume & mute controls
 * - Persistent preferences in localStorage
 * - Clean teardown and zero audio leaks
 */

export interface AudioSettings {
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  masterVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
}

const SETTINGS_KEY = 'avenir-coderunner-audio-v2';

const DEFAULT_SETTINGS: AudioSettings = {
  masterMuted: false,
  musicMuted: false,
  sfxMuted: false,
  masterVolume: 0.7,
  musicVolume: 0.45,
  sfxVolume: 0.75,
};

class SoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public settings: AudioSettings = { ...DEFAULT_SETTINGS };

  // Music sequencer state
  private isMusicRunning = false;
  private musicMode: 'none' | 'menu' | 'game' = 'none';
  private sequencerTimer: number | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;

  // Ambience nodes
  private menuOscillators: OscillatorNode[] = [];
  private menuGain: GainNode | null = null;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
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

        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);

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
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const masterVal = this.settings.masterMuted ? 0 : this.settings.masterVolume;
    const musicVal = this.settings.musicMuted ? 0 : this.settings.musicVolume;
    const sfxVal = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;

    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, masterVal)), now, 0.05);
    this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, musicVal)), now, 0.05);
    this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, sfxVal)), now, 0.05);
  }

  // ================= SETTINGS CONTROLS =================

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

  public setMasterVolume(val: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public setMusicVolume(val: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public setSfxVolume(val: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  // ================= MUSIC SEQUENCER =================

  /**
   * Start cyberpunk gameplay background music loop.
   */
  public startGameplayMusic() {
    this.initContext();
    this.stopMenuAmbience();
    if (this.musicMode === 'game' && this.isMusicRunning) return;

    this.musicMode = 'game';
    this.isMusicRunning = true;
    this.currentStep = 0;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }

    this.scheduleGameplayLoop();
  }

  private scheduleGameplayLoop = () => {
    if (!this.isMusicRunning || this.musicMode !== 'game' || !this.ctx || !this.musicGain) return;

    // Lookahead: schedule notes up to 0.15s ahead
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playSequencerStep(this.currentStep, this.nextNoteTime);

      // 128 BPM -> 16th note = (60 / 128) / 4 = 0.1171875s
      const stepDuration = 0.1172;
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 32;
    }

    this.sequencerTimer = window.setTimeout(this.scheduleGameplayLoop, 40);
  };

  private playSequencerStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain || this.settings.musicMuted) return;

    // Bassline in D minor (D1=36.7Hz, D2=73.4Hz, F2=87.3Hz, G2=98Hz, A2=110Hz, C3=130.8Hz)
    const bassNotes = [
      73.42, 73.42, 73.42, 87.31, 73.42, 73.42, 98.0, 110.0,
      73.42, 73.42, 73.42, 87.31, 130.81, 110.0, 98.0, 87.31,
    ];
    const bassFreq = bassNotes[step % 16];

    // Play bass synth on every 16th step
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(bassFreq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.09);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.1);

    // Arpeggio lead melody on upper octave (D minor pentatonic)
    const leadNotes: (number | null)[] = [
      293.66, null, 349.23, null, 440.0, 523.25, 440.0, null,
      349.23, null, 293.66, 440.0, null, 349.23, 392.0, null,
      587.33, null, 523.25, null, 440.0, null, 349.23, 440.0,
      523.25, 440.0, 392.0, 349.23, 293.66, null, null, null,
    ];
    const leadFreq = leadNotes[step];

    if (leadFreq) {
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, time);

      leadGain.gain.setValueAtTime(0.12, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(time);
      leadOsc.stop(time + 0.19);
    }

    // Hi-hat / pulse noise on off-beats (step 2, 6, 10, 14...)
    if (step % 4 === 2) {
      this.playHatPulse(time);
    }
  }

  private playHatPulse(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(6500, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.045);
  }

  /**
   * Pause gameplay music (e.g. on game pause or modal)
   */
  public pauseGameplayMusic() {
    this.isMusicRunning = false;
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  /**
   * Resume gameplay music after unpausing
   */
  public resumeGameplayMusic() {
    if (this.musicMode === 'game' && !this.isMusicRunning) {
      this.isMusicRunning = true;
      if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }
      this.scheduleGameplayLoop();
    }
  }

  /**
   * Stop gameplay music completely
   */
  public stopGameplayMusic() {
    this.isMusicRunning = false;
    this.musicMode = 'none';
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  // ================= MENU AMBIENCE =================

  /**
   * Start soft, futuristic ambient pad for menus and title screens
   */
  public startMenuAmbience() {
    this.initContext();
    this.stopGameplayMusic();
    if (this.musicMode === 'menu') return;

    this.musicMode = 'menu';
    if (!this.ctx || !this.musicGain) return;

    // Create dual warm sine pad chord (D minor: D3=146.8Hz, A3=220Hz, F4=349.2Hz)
    const freqs = [146.83, 220.0, 349.23];
    this.menuGain = this.ctx.createGain();
    this.menuGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.menuGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
    this.menuGain.connect(this.musicGain);

    this.menuOscillators = freqs.map((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
      osc.connect(this.menuGain!);
      osc.start();
      return osc;
    });
  }

  /**
   * Stop menu ambient pad
   */
  public stopMenuAmbience() {
    if (this.menuOscillators.length > 0) {
      this.menuOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      });
      this.menuOscillators = [];
    }
    if (this.menuGain) {
      try {
        this.menuGain.disconnect();
      } catch {
        // Ignore
      }
      this.menuGain = null;
    }
    if (this.musicMode === 'menu') {
      this.musicMode = 'none';
    }
  }

  // ================= SOUND EFFECTS (SFX) =================

  /**
   * Start run whoosh / cyber engine flare
   */
  public playStartRun() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  /**
   * Lane switch: rapid aerodynamic whoosh
   */
  public playLaneSwitch(direction: 'left' | 'right') {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const startFreq = direction === 'right' ? 320 : 440;
    const endFreq = direction === 'right' ? 480 : 300;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Countdown beep: high clean synth blip
   */
  public playCountdownBeep(isGo = false) {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 520, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.28 : 0.12));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + (isGo ? 0.28 : 0.12));
  }

  /**
   * Correct gate choice: triumphant sparkling champagne chord
   */
  public playCorrectChoice() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.035);

      gain.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35 + idx * 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime + idx * 0.035);
      osc.stop(this.ctx.currentTime + 0.4 + idx * 0.035);
    });
  }

  /**
   * Wrong gate or obstacle collision: aggressive digital glitch & impact
   */
  public playWrongChoice() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  /**
   * Combo streak milestone stinger (e.g. x3, x5, x10)
   */
  public playComboMilestone() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chords = [659.25, 830.61, 987.77, 1318.51]; // E major 7th stinger
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

      gain.gain.setValueAtTime(0.16, this.ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45 + idx * 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime + idx * 0.04);
      osc.stop(this.ctx.currentTime + 0.5 + idx * 0.04);
    });
  }

  /**
   * Subtle UI button click
   */
  public playButtonClick() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  /**
   * Pause sound
   */
  public playPause() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /**
   * Resume sound
   */
  public playResume() {
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /**
   * Game Over: dramatic low decaying drone
   */
  public playGameOver() {
    this.stopGameplayMusic();
    if (this.settings.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.75);
  }

  /**
   * Master cleanup on unmount
   */
  public teardown() {
    this.stopGameplayMusic();
    this.stopMenuAmbience();
  }
}

export const soundCtrl = new SoundController();
