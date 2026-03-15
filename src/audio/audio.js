// Drop Dead Keep — Web Audio API Sound Engine

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.5;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(soundName) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    switch (soundName) {
      case 'fire': this.playFire(); break;
      case 'impact_stone': this.playImpactStone(); break;
      case 'impact_wood': this.playImpactWood(); break;
      case 'bridge_collapse': this.playBridgeCollapse(); break;
      case 'zombie_fall': this.playZombieFall(); break;
      case 'zombie_splat': this.playZombieSplat(); break;
      case 'wave_horn': this.playWaveHorn(); break;
      case 'wave_clear': this.playWaveClear(); break;
      case 'gate_alarm': this.playGateAlarm(); break;
      case 'multi_kill': this.playMultiKill(); break;
      case 'ui_click': this.playUIClick(); break;
      case 'star': this.playStar(); break;
    }
  }

  noise(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    return buffer;
  }

  playFire() {
    const now = this.ctx.currentTime;
    // Deep thwack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Whoosh
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noise(0.3);
    const nGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.05);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(filter).connect(nGain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  playImpactStone() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Rumble
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noise(0.4);
    const nGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    nGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter).connect(nGain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  playImpactWood() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBridgeCollapse() {
    const now = this.ctx.currentTime;
    // Creaking
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.5);
    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Crash
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noise(0.6);
    const nGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.15);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(filter).connect(nGain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.6);
  }

  playZombieFall() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);
    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  playZombieSplat() {
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noise(0.15);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  playWaveHorn() {
    const now = this.ctx.currentTime;
    // Medieval trumpet
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const start = now + i * 0.15;
      osc.frequency.setValueAtTime(220 * (1 + i * 0.5), start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    }
  }

  playWaveClear() {
    const now = this.ctx.currentTime;
    const notes = [330, 392, 523, 659];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const start = now + i * 0.12;
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    }
  }

  playGateAlarm() {
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const start = now + i * 0.3;
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.2 * this.masterVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    }
  }

  playMultiKill() {
    const now = this.ctx.currentTime;
    const notes = [523, 659, 784];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const start = now + i * 0.08;
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.12 * this.masterVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    }
  }

  playUIClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playStar() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}
