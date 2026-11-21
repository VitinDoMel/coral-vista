// Pure WebAudio synthesized sound effects: engine pitch, police sirens, gunshots, impacts, chimes

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;

    // Engine synth nodes
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;

    // Police siren nodes
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenLfo = null;
    this.isSirenRunning = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio context disabled or unavailable in headless
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playGunshot() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // White noise blast for muzzle snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // Sub-bass thump oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playPunch() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playCrash(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.35 * Math.min(intensity, 2.0);

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6 * Math.min(intensity, 1.5), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  playCollectMoney() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, t); // C6
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, t + 0.08); // E6

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc1.stop(t + 0.08);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.25);
  }

  startEngine() {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning) return;

    const t = this.ctx.currentTime;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, t);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(400, t);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.18, t);

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start(t);
    this.isEngineRunning = true;
  }

  updateEngine(speedRatio, isThrottling) {
    if (!this.isEngineRunning || !this.ctx) return;

    const baseFreq = 52 + speedRatio * 180 + (isThrottling ? 25 : 0);
    const filterFreq = 300 + speedRatio * 1200 + (isThrottling ? 350 : 0);
    const targetGain = 0.12 + speedRatio * 0.16 + (isThrottling ? 0.08 : 0);

    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
  }

  stopEngine() {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      this.engineOsc.stop();
      this.engineOsc.disconnect();
    } catch {}
    this.isEngineRunning = false;
  }

  startSiren() {
    this.ensureContext();
    if (!this.ctx || this.isSirenRunning) return;

    const t = this.ctx.currentTime;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(700, t);

    // LFO to oscillate between 650Hz and 950Hz
    this.sirenLfo = this.ctx.createOscillator();
    this.sirenLfo.frequency.setValueAtTime(1.8, t);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, t);

    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.12, t);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    this.sirenLfo.start(t);
    this.sirenOsc.start(t);
    this.isSirenRunning = true;
  }

  stopSiren() {
    if (!this.isSirenRunning || !this.ctx) return;
    try {
      this.sirenLfo.stop();
      this.sirenOsc.stop();
      this.sirenLfo.disconnect();
      this.sirenOsc.disconnect();
    } catch {}
    this.isSirenRunning = false;
  }
}
