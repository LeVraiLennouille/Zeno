'use strict';
/**
 * Génère assets/sounds/*.wav à partir des formules de la PWA (Web Audio) :
 *  - effets : done, undo, fail, drink, fanfare, levelup (playSound) et bell (playBell) ;
 *  - ambiances en boucle : rain, ocean, drone (startAmbience).
 * Déterministe (PRNG à graine) : relancer le script donne exactement les mêmes fichiers.
 *
 * Usage : node scripts/generate-sounds.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'sounds');
const TAU = Math.PI * 2;

// ─────────────── Outils ───────────────

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wave(type, phase) {
  const p = phase - Math.floor(phase);
  if (type === 'sine') return Math.sin(TAU * p);
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(TAU * p));
  if (type === 'sawtooth') return 2 * (p - Math.floor(p + 0.5));
  throw new Error(`forme d'onde inconnue : ${type}`);
}

/** Note de playSound : `e(freq, dur, type, gain, floor)` — décroissance exponentielle de `gain` à `floor`. */
function addNote(buf, sr, start, freq, dur, type = 'sine', gain = 0.2, floor = 0.001) {
  const i0 = Math.round(start * sr);
  const n = Math.round(dur * sr);
  for (let i = 0; i < n && i0 + i < buf.length; i++) {
    const t = i / sr;
    buf[i0 + i] += wave(type, freq * t) * gain * Math.pow(floor / gain, t / dur);
  }
}

/** Partiel de cloche : 1e-4 → c·0,5 en 12 ms, puis décroissance exponentielle jusqu'à 1e-4 à `len` s. */
function addBellPartial(buf, sr, freq, amp, len) {
  const n = Math.round((len + 0.1) * sr);
  const peak = amp * 0.5;
  for (let i = 0; i < n && i < buf.length; i++) {
    const t = i / sr;
    let g;
    if (t < 0.012) g = 1e-4 * Math.pow(peak / 1e-4, t / 0.012);
    else if (t < len) g = peak * Math.pow(1e-4 / peak, (t - 0.012) / (len - 0.012));
    else g = 0;
    buf[i] += Math.sin(TAU * freq * t) * g;
  }
}

/** Filtre biquad RBJ identique à BiquadFilterNode (Q en dB pour passe-bas / passe-haut, Q = 1 par défaut). */
function biquad(type, freq, sr, qDb = 1) {
  const w0 = (TAU * freq) / sr;
  const alpha = Math.sin(w0) / (2 * Math.pow(10, qDb / 20));
  const cos = Math.cos(w0);
  let b0, b1, b2;
  if (type === 'lowpass') {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = (1 - cos) / 2;
  } else {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = (1 + cos) / 2;
  }
  const a0 = 1 + alpha;
  const c = [b0 / a0, b1 / a0, b2 / a0, (-2 * cos) / a0, (1 - alpha) / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function noise(kind, n, rand) {
  const out = new Float32Array(n);
  if (kind === 'brown') {
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = rand() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      out[i] = last * 3.5;
    }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = rand() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return out;
}

/** Boucle sans couture : on génère `fade` secondes de plus et on les mêle (fondu linéaire) au début. */
function makeLoop(render, sr, seconds, fadeSeconds) {
  const n = Math.round(seconds * sr);
  const f = Math.round(fadeSeconds * sr);
  const raw = render(n + f);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = raw[i];
  for (let i = 0; i < f; i++) {
    const k = i / f;
    out[i] = raw[i] * k + raw[n + i] * (1 - k);
  }
  return out;
}

function toWav(samples, sr) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(sr, 24);
  head.writeUInt32LE(sr * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

// ─────────────── Effets (playSound / playBell) ───────────────

const FX_SR = 44100;
const effect = (seconds, fn) => {
  const buf = new Float32Array(Math.round(seconds * FX_SR));
  fn(buf);
  return buf;
};

const EFFECTS = {
  done: effect(0.3, (b) => {
    addNote(b, FX_SR, 0, 659, 0.05);
    addNote(b, FX_SR, 0.05, 880, 0.2);
  }),
  undo: effect(0.35, (b) => {
    addNote(b, FX_SR, 0, 440, 0.15);
    addNote(b, FX_SR, 0.08, 330, 0.2);
  }),
  fail: effect(0.4, (b) => addNote(b, FX_SR, 0, 280, 0.35, 'sawtooth', 0.18)),
  drink: effect(0.45, (b) => [523, 659].forEach((f, i) => addNote(b, FX_SR, i * 0.1, f, 0.3))),
  fanfare: effect(1, (b) => [523, 659, 784, 1047].forEach((f, i) => addNote(b, FX_SR, i * 0.13, f, 0.5, 'triangle', 0.22))),
  levelup: effect(1.05, (b) => [523, 659, 784, 1047, 1319].forEach((f, i) => addNote(b, FX_SR, i * 0.1, f, 0.55, 'sine', 0.28))),
  bell: effect(7.3, (b) => {
    const base = 196;
    [[1, 0.55, 7], [2.76, 0.28, 4.5], [5.4, 0.14, 3], [8.93, 0.07, 2]].forEach(([u, c, len]) => addBellPartial(b, FX_SR, base * u, c, len));
  }),
};

// ─────────────── Ambiances (startAmbience) ───────────────

const AMB_SR = 22050;

const AMBIENCES = {
  // Bruit rose → passe-haut 900 Hz → passe-bas 7 kHz → gain 0,5.
  rain: makeLoop(
    (n) => {
      const src = noise('pink', n, rng(1001));
      const hp = biquad('highpass', 900, AMB_SR);
      const lp = biquad('lowpass', 7000, AMB_SR);
      return src.map((x) => lp(hp(x)) * 0.5);
    },
    AMB_SR, 20, 2,
  ),
  // Bruit brun → passe-bas 650 Hz → gain 0,45 modulé par un LFO de 0,09 Hz (amplitude 0,35).
  // 3 périodes du LFO = 33,33 s : la modulation boucle sans saut.
  ocean: makeLoop(
    (n) => {
      const src = noise('brown', n, rng(2002));
      const lp = biquad('lowpass', 650, AMB_SR);
      return src.map((x, i) => lp(x) * (0.45 + 0.35 * Math.sin(TAU * 0.09 * (i / AMB_SR))));
    },
    AMB_SR, 3 / 0.09, 3,
  ),
  // 4 sinus (110 / 164,81 / 220 / 329,63 Hz, désaccordés de 0/3/−3/2 cents) → gain 0,9 modulé à 0,07 Hz (± 0,12).
  // 2 périodes du LFO = 28,57 s.
  drone: makeLoop(
    (n) => {
      const out = new Float32Array(n);
      const partials = [[110, 0.1, 0], [164.81, 0.07, 3], [220, 0.06, -3], [329.63, 0.025, 2]];
      for (let i = 0; i < n; i++) {
        const t = i / AMB_SR;
        let sum = 0;
        for (const [f, g, cents] of partials) sum += Math.sin(TAU * f * Math.pow(2, cents / 1200) * t) * g;
        out[i] = sum * (0.9 + 0.12 * Math.sin(TAU * 0.07 * t));
      }
      return out;
    },
    AMB_SR, 2 / 0.07, 3,
  ),
};

// ─────────────── Écriture ───────────────

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
const write = (name, samples, sr) => {
  let peak = 0;
  let sum = 0;
  for (const s of samples) {
    peak = Math.max(peak, Math.abs(s));
    sum += s * s;
  }
  const wav = toWav(samples, sr);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), wav);
  total += wav.length;
  console.log(`${name.padEnd(8)} ${(samples.length / sr).toFixed(2).padStart(6)} s  ${String(sr).padStart(5)} Hz  crête ${peak.toFixed(3)}  rms ${Math.sqrt(sum / samples.length).toFixed(3)}  ${(wav.length / 1024).toFixed(0)} Ko`);
};
for (const [name, s] of Object.entries(EFFECTS)) write(name, s, FX_SR);
for (const [name, s] of Object.entries(AMBIENCES)) write(name, s, AMB_SR);
console.log(`total ${(total / 1024 / 1024).toFixed(2)} Mo`);
