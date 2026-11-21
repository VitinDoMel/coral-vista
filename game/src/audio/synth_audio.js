// WebAudio Synthesizer: Engine Pitch, Police Siren, Gunshots, and 80s Synthwave Radio

export class SynthAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.engineOsc = null;
    this.sirenOsc = null;
    this.radioPlaying = false;
  }

  _init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (_) {}
  }

  playGunshot() {
    this._init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      // White noise explosion burst
      const bufSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.22));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);

      // Low thump oscillator
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

      oscGain.gain.setValueAtTime(0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (_) {}
  }

  updateEngine(speedFraction) {
    this._init();
    if (!this.ctx || this.isMuted) return;

    try {
      if (!this.engineOsc) {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineGain.gain.value = 0.08;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      }

      const freq = 65 + speedFraction * 240;
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    } catch (_) {}
  }

  updateSiren(hasWanted) {
    this._init();
    if (!this.ctx || this.isMuted) return;

    try {
      if (hasWanted) {
        if (!this.sirenOsc) {
          this.sirenOsc = this.ctx.createOscillator();
          this.sirenGain = this.ctx.createGain();
          this.sirenOsc.type = 'sine';
          this.sirenGain.gain.value = 0.09;

          this.sirenOsc.connect(this.sirenGain);
          this.sirenGain.connect(this.ctx.destination);
          this.sirenOsc.start();
        }

        // Two-tone wailing siren
        const cycle = Math.sin(Date.now() * 0.005);
        const freq = 680 + cycle * 220;
        this.sirenOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      } else if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc = null;
      }
    } catch (_) {}
  }

  startRadio() {
    this._init();
    if (!this.ctx || this.radioPlaying || this.isMuted) return;
    this.radioPlaying = true;

    // Procedural Sunny Synthwave Arpeggio loop
    const chords = [220, 261.63, 293.66, 329.63]; // A minor / C major coastal chill
    let step = 0;

    const playNote = () => {
      if (!this.radioPlaying || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = chords[step % chords.length] * (1 + (step % 2) * 0.5);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.36);

        step++;
        setTimeout(playNote, 280);
      } catch (_) {}
    };

    playNote();
  }
}
