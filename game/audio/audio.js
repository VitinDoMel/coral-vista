export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
    this.muted = false;
    this.radioEnabled = true;

    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;

    this.radioStep = 0;
    this.radioTimer = 0;
    this.noiseBuffer = null;

    this._bindUnlock();
  }

  _bindUnlock() {
    const unlock = () => {
      this.init();
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('mousedown', unlock);
    };
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('mousedown', unlock, { once: true });
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.24;
      this.masterGain.connect(this.ctx.destination);

      // Shared white-noise buffer for gunshots & collisions
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.4);
      this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Continuous engine oscillator (filtered sawtooth)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 48;

      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 260;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();

      // Continuous CVPD siren oscillator
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 660;

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();

      this.initialized = true;
    } catch (_err) {
      // Audio unavailable in headless / restricted environments
    }
  }

  toggleRadio() {
    this.radioEnabled = !this.radioEnabled;
    return this.radioEnabled;
  }

  playGunshot() {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Punchy noise crack
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.value = 0.9;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.17);

    // Sub punch
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.42, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playImpact(intensity = 0.6) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.6, 0.25 + intensity * 0.35), now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.23);
  }

  _playRadioNote(freq, duration = 0.18, type = 'triangle', vol = 0.08) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  update(dt, activeVehicle, wantedStars) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Engine sound
    if (activeVehicle) {
      const speedRatio = Math.min(1, Math.abs(activeVehicle.speed) / 34);
      const targetFreq = 46 + speedRatio * 96;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);
      this.engineGain.gain.setTargetAtTime(0.11 + speedRatio * 0.14, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    }

    // 2. Siren wail when wantedStars > 0
    if (wantedStars > 0) {
      const wail = 0.5 + 0.5 * Math.sin(now * 5.2);
      const freq = 610 + wail * 370;
      this.sirenOsc.frequency.setTargetAtTime(freq, now, 0.04);
      this.sirenGain.gain.setTargetAtTime(0.08, now, 0.08);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.08);
    }

    // 3. Original Coral Vista Synthwave Radio loop (120 BPM eighth-notes)
    if (activeVehicle && this.radioEnabled) {
      this.radioTimer += dt;
      if (this.radioTimer >= 0.25) {
        this.radioTimer = 0;
        const bassPattern = [110, 110, 146.83, 130.81, 98, 98, 130.81, 110];
        const leadPattern = [440, 0, 523.25, 587.33, 392, 0, 523.25, 493.88];
        const stepIdx = this.radioStep % bassPattern.length;
        this._playRadioNote(bassPattern[stepIdx], 0.2, 'sawtooth', 0.06);
        const leadNote = leadPattern[stepIdx];
        if (leadNote > 0) {
          this._playRadioNote(leadNote, 0.22, 'triangle', 0.055);
        }
        this.radioStep++;
      }
    }
  }
}
