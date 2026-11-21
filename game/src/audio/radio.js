// Original synthesized 80s Synthwave / Outrun procedural radio station

export class RadioStation {
  constructor(soundEngine) {
    this.sound = soundEngine;
    this.stations = [
      { id: 'heatwave', name: 'HEATWAVE 105.5 FM (SYNTHWAVE)' },
      { id: 'vice',     name: 'CORAL VICE 98.2 FM (ELECTRO)' },
      { id: 'off',      name: 'RADIO OFF' },
    ];
    this.currentStationIndex = 0;
    this.isPlaying = false;
    this.step = 0;
    this.tempo = 118; // BPM
    this.timerId = null;

    // 16-step bassline arpeggio notes in Hz (Am - F - C - G)
    this.basslineAm = [110, 110, 220, 164.8, 110, 110, 220, 164.8]; // A2, A3, E3
    this.basslineF  = [87.3, 87.3, 174.6, 130.8, 87.3, 87.3, 174.6, 130.8]; // F2, F3, C3
    this.basslineC  = [130.8, 130.8, 261.6, 196.0, 130.8, 130.8, 261.6, 196.0]; // C3, C4, G3
    this.basslineG  = [98.0, 98.0, 196.0, 146.8, 98.0, 98.0, 196.0, 146.8]; // G2, G3, D3
  }

  toggleStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % this.stations.length;
    const current = this.stations[this.currentStationIndex];

    if (current.id === 'off') {
      this.stop();
    } else {
      this.start();
    }
    return current.name;
  }

  getCurrentName() {
    return this.stations[this.currentStationIndex].name;
  }

  start() {
    if (this.isPlaying) return;
    this.sound.ensureContext();
    if (!this.sound.ctx) return;

    this.isPlaying = true;
    const stepDurationMs = (60 / this.tempo / 4) * 1000;
    this.timerId = setInterval(() => this.tick(), stepDurationMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  tick() {
    if (!this.isPlaying || !this.sound.ctx) return;

    const ctx = this.sound.ctx;
    const t = ctx.currentTime;
    const s = this.step % 32;

    // Chord progression
    let bassFreq = 110;
    if (s < 8) {
      bassFreq = this.basslineAm[s % 8];
    } else if (s < 16) {
      bassFreq = this.basslineF[s % 8];
    } else if (s < 24) {
      bassFreq = this.basslineC[s % 8];
    } else {
      bassFreq = this.basslineG[s % 8];
    }

    // Synthesizer Bass note
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassFreq, t);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(900, t);
    bassFilter.frequency.exponentialRampToValueAtTime(220, t + 0.12);

    bassGain.gain.setValueAtTime(0.18, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.sound.masterGain);

    bassOsc.start(t);
    bassOsc.stop(t + 0.14);

    // 80s Drum Kit: Kick on 0, 4, 8, 12, 16, 20, 24, 28
    if (s % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      kickGain.gain.setValueAtTime(0.4, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      kickOsc.connect(kickGain);
      kickGain.connect(this.sound.masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.09);
    }

    // Snare with noise burst on 4, 12, 20, 28
    if (s % 8 === 4) {
      const snareBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const data = snareBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const snareSource = ctx.createBufferSource();
      snareSource.buffer = snareBuffer;

      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(0.25, t);
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      snareSource.connect(snareGain);
      snareGain.connect(this.sound.masterGain);
      snareSource.start(t);
    }

    this.step++;
  }
}
