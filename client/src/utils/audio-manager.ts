/**
 * AudioManager — all sounds generated procedurally via Web Audio API.
 * No external files required.
 */

type LoopId = 'lobbyMusic' | 'countdownMusic';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private loopTimers = new Map<LoopId, ReturnType<typeof setTimeout>>();
  private loopNextStart = new Map<LoopId, number>();
  private noiseBuffer: AudioBuffer | null = null;

  // ── Context ───────────────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private get master(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  // ── Mute ──────────────────────────────────────────────────────────────────

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      const ctx = this.getCtx();
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    }
    // Loops keep scheduling silently — masterGain handles silence.
    // This way unmuting resumes music without needing to restart it.
  }

  isMuted(): boolean { return this.muted; }

  // ── Primitives ────────────────────────────────────────────────────────────

  private note(
    freq: number,
    startAt: number,
    duration: number,
    type: OscillatorType = 'sine',
    vol = 0.25,
  ): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(this.master);

    const atk = Math.min(0.02, duration * 0.15);
    const rel = Math.min(0.06, duration * 0.25);
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(vol, startAt + atk);
    g.gain.setValueAtTime(vol, startAt + duration - rel);
    g.gain.linearRampToValueAtTime(0, startAt + duration);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.001);
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.noiseBuffer) {
      const ctx = this.getCtx();
      const samples = Math.ceil(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  private snareHit(startAt: number, duration: number, vol: number): void {
    const ctx = this.getCtx();
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(vol, startAt + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(startAt);
    src.stop(startAt + duration + 0.005);
  }

  // ── Loop engine ───────────────────────────────────────────────────────────

  private runLoop(id: LoopId, pattern: (startAt: number) => number): void {
    const ctx = this.getCtx();
    const startAt = this.loopNextStart.get(id) ?? ctx.currentTime;
    const duration = pattern(startAt);
    this.loopNextStart.set(id, startAt + duration);

    // Reschedule 150 ms before this iteration ends to avoid gaps
    const msDelay = Math.max(0, (startAt + duration - 0.15 - ctx.currentTime) * 1000);
    const timer = setTimeout(() => {
      if (this.loopTimers.has(id)) this.runLoop(id, pattern);
    }, msDelay);
    this.loopTimers.set(id, timer);
  }

  private startLoop(id: LoopId, pattern: (startAt: number) => number): void {
    this.stopLoop(id);
    this.loopNextStart.delete(id);
    this.runLoop(id, pattern);
  }

  private stopLoop(id: LoopId): void {
    const t = this.loopTimers.get(id);
    if (t !== undefined) clearTimeout(t);
    this.loopTimers.delete(id);
    this.loopNextStart.delete(id);
  }

  // ── Lobby music ───────────────────────────────────────────────────────────

  startLobbyMusic(): void {
    const beat = 0.5; // 120 BPM

    this.startLoop('lobbyMusic', (t) => {
      // 8-beat C major pentatonic melody
      const melody: [number, number, number][] = [
        [523.25, 0,          0.38],  // C5
        [659.25, beat,       0.38],  // E5
        [783.99, beat * 2,   0.38],  // G5
        [1046.5, beat * 3,   0.38],  // C6
        [783.99, beat * 4,   0.38],  // G5
        [659.25, beat * 5,   0.38],  // E5
        [523.25, beat * 6,   0.72],  // C5 held
      ];
      const bass: [number, number, number][] = [
        [130.81, 0,          1.9],   // C3
        [174.61, beat * 4,   1.9],   // F3
      ];
      melody.forEach(([f, d, dur]) => this.note(f, t + d, dur, 'triangle', 0.15));
      bass.forEach(([f, d, dur]) => this.note(f, t + d, dur, 'sine', 0.10));
      return beat * 8; // 4 s loop
    });
  }

  stopLobbyMusic(): void { this.stopLoop('lobbyMusic'); }

  // ── Countdown / thinking music ────────────────────────────────────────────

  startCountdownMusic(): void {
    const beat = 0.5;

    this.startLoop('countdownMusic', (t) => {
      for (let i = 0; i < 4; i++) {
        const time = t + i * beat;
        this.note(880, time, 0.05, 'square', 0.09);           // high tick
        this.note(660, time + beat * 0.5, 0.04, 'square', 0.05); // off-beat tock
        if (i % 2 === 0) this.note(110, time, 0.14, 'sine', 0.07); // bass pulse
      }
      return beat * 4; // 2 s loop
    });
  }

  stopCountdownMusic(): void { this.stopLoop('countdownMusic'); }

  // ── Correct answer ────────────────────────────────────────────────────────

  playCorrect(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Ascending arpeggio C5 → E5 → G5 → C6
    const arp: [number, number][] = [
      [523.25, 0], [659.25, 0.09], [783.99, 0.18], [1046.5, 0.27],
    ];
    arp.forEach(([f, d]) => this.note(f, t + d, 0.14, 'triangle', 0.38));
    // Sustain chord
    [[523.25, 0.16], [659.25, 0.12], [783.99, 0.10]].forEach(([f, vol]) =>
      this.note(f, t + 0.45, 0.35, 'sine', vol)
    );
  }

  // ── Incorrect answer ──────────────────────────────────────────────────────

  playIncorrect(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.note(311.13, t,       0.18, 'sawtooth', 0.22);
    this.note(277.18, t + 0.2, 0.28, 'sawtooth', 0.28);
  }

  // ── Drumroll (before leaderboard) ─────────────────────────────────────────

  playDrumroll(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    let elapsed = 0;
    let interval = 0.13;
    const total = 2.0;
    while (elapsed < total) {
      const progress = elapsed / total;
      this.snareHit(t + elapsed, Math.min(interval * 0.88, 0.08), 0.11 + progress * 0.22);
      elapsed += interval;
      interval = Math.max(0.03, interval * 0.95);
    }
    // Final crash hit
    this.snareHit(t + total, 0.20, 0.48);
    this.note(1400, t + total, 0.10, 'sine', 0.14);
  }

  // ── Victory fanfare (podium) ──────────────────────────────────────────────

  playFanfare(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    // Rising fanfare: C5 D5 E5 G5 → C6 held
    const melody: [number, number, number][] = [
      [523.25, 0,    0.15],
      [587.33, 0.16, 0.15],
      [659.25, 0.32, 0.15],
      [783.99, 0.48, 0.13],
      [1046.5, 0.63, 0.85],
    ];
    const harmony: [number, number, number][] = [
      [392.00, 0,    0.15],
      [440.00, 0.16, 0.15],
      [523.25, 0.32, 0.15],
      [659.25, 0.48, 0.13],
      [783.99, 0.63, 0.85],
    ];
    const bass: [number, number, number][] = [
      [130.81, 0,    0.55],
      [174.61, 0.32, 0.58],
      [130.81, 0.63, 0.85],
    ];
    melody.forEach(([f, d, dur]) => this.note(f, t + d, dur, 'triangle', 0.40));
    harmony.forEach(([f, d, dur]) => this.note(f, t + d, dur, 'triangle', 0.20));
    bass.forEach(([f, d, dur]) => this.note(f, t + d, dur, 'sine', 0.22));
  }
}

export const audioManager = new AudioManager();
