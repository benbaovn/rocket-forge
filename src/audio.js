// Synthesized audio (Web Audio API) – no audio files required
class AudioEngine {
  constructor() { this.ctx = null; this.enabled = true; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    // noise buffers
    const len = ctx.sampleRate * 4;
    const white = ctx.createBuffer(1, len, ctx.sampleRate);
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = white.getChannelData(0), b = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + 0.02 * w[i]) / 1.02;
      b[i] = last * 3.5;
    }
    this.white = white; this.brown = brown;

    // engine roar chain
    const roarSrc = this.loop(white);
    this.roarFilter = ctx.createBiquadFilter(); this.roarFilter.type = 'lowpass'; this.roarFilter.frequency.value = 700; this.roarFilter.Q.value = 0.7;
    this.roarGain = ctx.createGain(); this.roarGain.gain.value = 0;
    roarSrc.connect(this.roarFilter).connect(this.roarGain).connect(this.master);
    // rumble
    const rumbleSrc = this.loop(brown);
    this.rumbleFilter = ctx.createBiquadFilter(); this.rumbleFilter.type = 'lowpass'; this.rumbleFilter.frequency.value = 140;
    this.rumbleGain = ctx.createGain(); this.rumbleGain.gain.value = 0;
    rumbleSrc.connect(this.rumbleFilter).connect(this.rumbleGain).connect(this.master);
    // crackle (amplitude-modulated bandpass noise)
    const crSrc = this.loop(white);
    this.crFilter = ctx.createBiquadFilter(); this.crFilter.type = 'bandpass'; this.crFilter.frequency.value = 1800; this.crFilter.Q.value = 0.8;
    this.crGain = ctx.createGain(); this.crGain.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 23;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.5;
    this.crAmp = ctx.createGain(); this.crAmp.gain.value = 0.5;
    lfo.connect(lfoGain).connect(this.crAmp.gain);
    lfo.start();
    crSrc.connect(this.crFilter).connect(this.crAmp).connect(this.crGain).connect(this.master);
    // hangar ambience
    const amb = this.loop(brown);
    this.ambFilter = ctx.createBiquadFilter(); this.ambFilter.type = 'lowpass'; this.ambFilter.frequency.value = 220;
    this.ambGain = ctx.createGain(); this.ambGain.gain.value = 0;
    amb.connect(this.ambFilter).connect(this.ambGain).connect(this.master);
    const hum = ctx.createOscillator(); hum.frequency.value = 50; hum.type = 'sine';
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0;
    hum.connect(this.humGain).connect(this.master); hum.start();
    // wind
    const wind = this.loop(white);
    this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'bandpass'; this.windFilter.frequency.value = 500; this.windFilter.Q.value = 0.5;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
    wind.connect(this.windFilter).connect(this.windGain).connect(this.master);
  }

  loop(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    s.start(0, Math.random() * 3);
    return s;
  }

  set(param, v, tc = 0.08) { if (this.ctx) param.setTargetAtTime(v, this.ctx.currentTime, tc); }

  /** level 0..1 thrust; air 0..1 (atmospheric density); dist factor 0..1 */
  engine(level, air, near = 1) {
    if (!this.ctx) return;
    const a = Math.max(0.04, air);
    this.set(this.roarGain.gain, level * 0.55 * a * near);
    this.set(this.roarFilter.frequency, 300 + 900 * level * a);
    this.set(this.rumbleGain.gain, level * 1.0 * Math.max(0.15, a) * near);
    this.set(this.crGain.gain, level * 0.25 * a * near);
    this.crFilter.frequency.value = 1400 + Math.random() * 1200;
  }

  wind(q) { if (this.ctx) { this.set(this.windGain.gain, Math.min(0.35, q / 60000)); this.set(this.windFilter.frequency, 300 + Math.min(1500, q / 20)); } }

  ambience(on) {
    if (!this.ctx) return;
    this.set(this.ambGain.gain, on ? 0.12 : 0, 0.5);
    this.set(this.humGain.gain, on ? 0.015 : 0, 0.5);
  }

  beep(freq = 880, dur = 0.12, vol = 0.25) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }

  click() { this.beep(1600, 0.05, 0.12); setTimeout(() => this.beep(900, 0.06, 0.08), 30); }

  thunk(vol = 0.7) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.brown;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + 0.7);
    const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    const og = this.ctx.createGain(); og.gain.setValueAtTime(vol * 0.6, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.4);
  }

  explosion(vol = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.white;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(120, t + 3);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 4);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + 4.2);
    const b = this.ctx.createBufferSource(); b.buffer = this.brown;
    const bg = this.ctx.createGain(); bg.gain.setValueAtTime(vol * 1.5, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 5);
    b.connect(bg).connect(this.master); b.start(t); b.stop(t + 5.2);
  }

  silenceEngine() {
    if (!this.ctx) return;
    this.engine(0, 0); this.wind(0);
  }

  laserShot(vol = 0.32) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1450, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.16);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.2);
  }

  waterBlast(vol = 0.38) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.white;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(2200, t);
    f.frequency.exponentialRampToValueAtTime(950, t + 0.22);
    f.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.27);
  }

  acidSpray(vol = 0.36) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.white;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1650, t);
    f.frequency.exponentialRampToValueAtTime(620, t + 0.24);
    f.Q.value = 3.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.28);

    const o = this.ctx.createOscillator();
    const go = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.22);
    go.gain.setValueAtTime(vol * 0.45, t);
    go.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(go).connect(this.master);
    o.start(t);
    o.stop(t + 0.25);
  }

  electricZap(vol = 0.38) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // 1,000,000 WATT high-voltage Tesla arc crackle + FM buzz
    const s = this.ctx.createBufferSource();
    s.buffer = this.pink;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.setValueAtTime(2200, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.24);

    const o = this.ctx.createOscillator();
    const go = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(980, t);
    o.frequency.setValueAtTime(420, t + 0.04);
    o.frequency.setValueAtTime(1350, t + 0.08);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.21);
    go.gain.setValueAtTime(vol * 0.55, t);
    go.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(go).connect(this.master);
    o.start(t);
    o.stop(t + 0.23);
  }

  alienBoom(vol = 0.65) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.55);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.65);
    this.thunk(vol * 0.8);
  }

  supernova(vol = 0.9) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Implosion sweep + deep cosmic sub-bass + resonant pulsar shimmer + shockwave roar
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(180, t);
    o1.frequency.exponentialRampToValueAtTime(920, t + 0.18);
    o1.frequency.exponentialRampToValueAtTime(28, t + 2.8);
    g1.gain.setValueAtTime(vol * 0.65, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 2.9);
    o1.connect(g1).connect(this.master);
    o1.start(t);
    o1.stop(t + 2.95);

    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(110, t + 0.12);
    o2.frequency.exponentialRampToValueAtTime(22, t + 3.2);
    g2.gain.setValueAtTime(0.001, t);
    g2.gain.linearRampToValueAtTime(vol * 0.95, t + 0.16);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 3.3);
    o2.connect(g2).connect(this.master);
    o2.start(t);
    o2.stop(t + 3.35);

    this.explosion(1.3);
  }
}

export const audio = new AudioEngine();
