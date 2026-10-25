// Procedural Web Audio Engine for The Secret Garden (Zero 404 external audio files)

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private isMuted = false;
  private micStream: MediaStream | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private isListeningMic = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.isInitialized = true;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientPad();
    } catch {
      // AudioContext not allowed or not supported yet
    }
  }

  public resume() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private startAmbientPad() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, now);
    this.ambientGain.connect(this.masterGain);

    // Warm Fmaj9 twilight drone: F, C, E, G, A with organic harmonics
    const freqs = [87.31, 130.81, 164.81, 196.0, 220.0, 261.63, 329.63];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340 + idx * 35, now);

      osc.connect(filter);
      filter.connect(this.ambientGain);
      osc.start();
    });

    // Gentle filtered pink noise generator for night breeze & stream whisper
    const noiseBufferSize = this.ctx.sampleRate * 2.0;
    const noiseBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < noiseBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      noiseData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = noiseData[i];
    }
    const breezeSource = this.ctx.createBufferSource();
    breezeSource.buffer = noiseBuffer;
    breezeSource.loop = true;
    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.setValueAtTime(420, now);
    breezeFilter.Q.setValueAtTime(1.2, now);
    const breezeGain = this.ctx.createGain();
    breezeGain.gain.setValueAtTime(0.018, now);
    breezeSource.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(this.ambientGain);
    breezeSource.start();
  }

  public playWindChime() {
    const chimeFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const pick1 = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
    const pick2 = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
    this.playChime(pick1, 2.0, 0.08);
    setTimeout(() => this.playChime(pick2, 2.2, 0.07), 160);
  }

  public playCampfireCrackle() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + Math.random() * 0.4;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 600, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.06, this.ctx.currentTime, 0.15);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1);
    }
  }

  public playChime(freq = 587.33, duration = 1.6, vol = 0.14) {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.005, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playChord(freqs: number[], duration = 2.4, staggerMs = 90) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.playChime(f, duration, 0.11), i * staggerMs);
    });
  }

  public playGateOpening() {
    this.playChord([196.0, 261.63, 329.63, 392.0, 523.25], 3.0, 110);
  }

  public playLanternBridge() {
    this.playChord([261.63, 329.63, 392.0, 523.25, 659.25], 2.8, 80);
  }

  public playFireworkBurst() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Pop / explosion sound via noise buffer
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  public playBirthdaySymphony() {
    if (this.isMuted) return;
    this.resume();

    // Orchestrated Happy Birthday melody
    const notes = [
      { f: 392.0, d: 0.35, t: 0.0 },
      { f: 392.0, d: 0.35, t: 0.38 },
      { f: 440.0, d: 0.65, t: 0.78 },
      { f: 392.0, d: 0.65, t: 1.48 },
      { f: 523.25, d: 0.65, t: 2.18 },
      { f: 493.88, d: 1.2, t: 2.88 },

      { f: 392.0, d: 0.35, t: 4.2 },
      { f: 392.0, d: 0.35, t: 4.58 },
      { f: 440.0, d: 0.65, t: 4.98 },
      { f: 392.0, d: 0.65, t: 5.68 },
      { f: 587.33, d: 0.65, t: 6.38 },
      { f: 523.25, d: 1.3, t: 7.08 },

      { f: 392.0, d: 0.35, t: 8.4 },
      { f: 392.0, d: 0.35, t: 8.78 },
      { f: 783.99, d: 0.65, t: 9.18 },
      { f: 659.25, d: 0.65, t: 9.88 },
      { f: 523.25, d: 0.65, t: 10.58 },
      { f: 493.88, d: 0.65, t: 11.28 },
      { f: 440.0, d: 1.2, t: 11.98 },

      { f: 698.46, d: 0.35, t: 13.2 },
      { f: 698.46, d: 0.35, t: 13.58 },
      { f: 659.25, d: 0.65, t: 13.98 },
      { f: 523.25, d: 0.65, t: 14.68 },
      { f: 587.33, d: 0.65, t: 15.38 },
      { f: 523.25, d: 2.0, t: 16.08 }
    ];

    notes.forEach((n) => {
      setTimeout(() => this.playChime(n.f, n.d * 1.8, 0.14), n.t * 1000);
    });
  }

  public startMicCandleListener(
    onListening: () => void,
    onBlowDetected: () => void,
    onError: (err: string) => void
  ) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError('Microphone not supported on this browser');
      return;
    }
    this.resume();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!this.ctx) return;
        this.isListeningMic = true;
        this.micStream = stream;
        const src = this.ctx.createMediaStreamSource(stream);
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        this.micAnalyser = analyser;

        onListening();

        const data = new Uint8Array(analyser.frequencyBinCount);
        const checkBlow = () => {
          if (!this.isListeningMic) return;
          analyser.getByteFrequencyData(data);
          let lowFreqEnergy = 0;
          for (let i = 0; i < 20; i++) {
            lowFreqEnergy += data[i];
          }
          const avg = lowFreqEnergy / 20;
          if (avg > 92) {
            this.stopMicListening();
            onBlowDetected();
          } else {
            requestAnimationFrame(checkBlow);
          }
        };
        requestAnimationFrame(checkBlow);
      })
      .catch((err) => {
        onError(err?.message || 'Mic access denied');
      });
  }

  public stopMicListening() {
    this.isListeningMic = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }
}

export const audioEngine = new AudioEngine();
