'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const DIR = path.join(__dirname, '..', 'assets', 'sounds');

const peakOf = (x) => {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  return m;
};

function readWav(name) {
  const b = fs.readFileSync(path.join(DIR, `${name}.wav`));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  assert.equal(b.toString('ascii', 8, 12), 'WAVE');
  assert.equal(b.readUInt16LE(20), 1, 'PCM');
  assert.equal(b.readUInt16LE(22), 1, 'mono');
  assert.equal(b.readUInt16LE(34), 16, '16 bits');
  const sr = b.readUInt32LE(24);
  const n = b.readUInt32LE(40) / 2;
  assert.equal(b.length, 44 + n * 2, 'taille cohérente');
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(44 + i * 2) / 32768;
  return { x, sr };
}

/** FFT radix-2 ; renvoie les magnitudes. */
function spectrum(samples, size) {
  const n = size;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < Math.min(n, samples.length); i++) re[i] = samples[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (Math.min(n, samples.length) - 1)));
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
      }
    }
  }
  const mag = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

const SIZE = 16384;
const peakFreq = (x, sr, from, to) => {
  const seg = x.subarray(Math.round(from * sr), Math.round(to * sr));
  const mag = spectrum(seg, SIZE);
  let best = 1;
  for (let i = 2; i < mag.length; i++) if (mag[i] > mag[best]) best = i;
  return (best * sr) / SIZE;
};
const magAt = (x, sr, from, to, hz) => {
  const seg = x.subarray(Math.round(from * sr), Math.round(to * sr));
  const mag = spectrum(seg, SIZE);
  const k = Math.round((hz * SIZE) / sr);
  return Math.max(mag[k - 1], mag[k], mag[k + 1]);
};
const bandEnergy = (x, sr, lo, hi) => {
  const mag = spectrum(x.subarray(0, Math.min(x.length, 65536)), 65536);
  let e = 0;
  for (let i = 0; i < mag.length; i++) {
    const f = (i * sr) / 65536;
    if (f >= lo && f < hi) e += mag[i] * mag[i];
  }
  return e;
};
const near = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg} : ${actual.toFixed(1)} Hz au lieu de ${expected} Hz`);

test('sons : fichiers valides, durées attendues, aucune saturation', () => {
  const expected = { done: 0.3, undo: 0.35, fail: 0.4, drink: 0.45, fanfare: 1, levelup: 1.05, bell: 7.3, rain: 20, ocean: 33.33, drone: 28.57 };
  for (const [name, dur] of Object.entries(expected)) {
    const { x, sr } = readWav(name);
    assert.ok(Math.abs(x.length / sr - dur) < 0.02, `${name} : ${x.length / sr} s`);
    assert.ok(peakOf(x) < 0.95, `${name} sature`);
    assert.ok(peakOf(x) > 0.1, `${name} trop faible`);
  }
});

test('sons : les effets finissent près de zéro (pas de claquement final)', () => {
  for (const name of ['done', 'undo', 'fail', 'drink', 'fanfare', 'levelup', 'bell']) {
    const { x } = readWav(name);
    assert.ok(Math.abs(x[x.length - 1]) < 0.01, `${name} : ${x[x.length - 1]}`);
  }
});

test('sons : « done » = 659 Hz puis 880 Hz', () => {
  const { x, sr } = readWav('done');
  near(peakFreq(x, sr, 0, 0.05), 659, 25, 'première note');
  near(peakFreq(x, sr, 0.06, 0.25), 880, 15, 'seconde note');
});

test('sons : « undo » = 440 Hz puis 330 Hz', () => {
  const { x, sr } = readWav('undo');
  near(peakFreq(x, sr, 0, 0.07), 440, 25, 'première note');
  near(peakFreq(x, sr, 0.13, 0.28), 330, 15, 'seconde note');
});

test('sons : « fail » = dent de scie à 280 Hz (harmoniques 560, 840)', () => {
  const { x, sr } = readWav('fail');
  near(peakFreq(x, sr, 0, 0.15), 280, 12, 'fondamentale');
  const f1 = magAt(x, sr, 0, 0.15, 280);
  assert.ok(magAt(x, sr, 0, 0.15, 560) > f1 * 0.3, 'harmonique 2');
  assert.ok(magAt(x, sr, 0, 0.15, 840) > f1 * 0.15, 'harmonique 3');
});

test('sons : « drink » = 523 Hz puis 659 Hz', () => {
  const { x, sr } = readWav('drink');
  near(peakFreq(x, sr, 0, 0.09), 523, 20, 'première');
  near(peakFreq(x, sr, 0.14, 0.4), 659, 15, 'seconde');
});

test('sons : « fanfare » = 523, 659, 784, 1047 Hz toutes les 130 ms', () => {
  const { x, sr } = readWav('fanfare');
  [523, 659, 784, 1047].forEach((f, i) => near(peakFreq(x, sr, i * 0.13 + 0.01, i * 0.13 + 0.12), f, 20, `note ${i + 1}`));
  const tri = readWav('fanfare');
  assert.ok(magAt(tri.x, tri.sr, 0, 0.12, 523 * 3) < magAt(tri.x, tri.sr, 0, 0.12, 523) * 0.25, 'triangle : harmonique 3 faible');
});

test('sons : « levelup » = 523, 659, 784, 1047, 1319 Hz toutes les 100 ms', () => {
  const { x, sr } = readWav('levelup');
  [523, 659, 784, 1047, 1319].forEach((f, i) => near(peakFreq(x, sr, i * 0.1 + 0.01, i * 0.1 + 0.09), f, 25, `note ${i + 1}`));
});

test('sons : cloche = partiels 196 × (1 ; 2,76 ; 5,4 ; 8,93), du plus fort au plus faible', () => {
  const { x, sr } = readWav('bell');
  const partials = [[196, 0.55], [196 * 2.76, 0.28], [196 * 5.4, 0.14], [196 * 8.93, 0.07]];
  const mags = partials.map(([f]) => magAt(x, sr, 0.02, 0.4, f));
  near(peakFreq(x, sr, 0.02, 0.4), 196, 8, 'fondamentale');
  for (let i = 0; i < 3; i++) assert.ok(mags[i] > mags[i + 1], `partiel ${i + 1} > ${i + 2}`);
  assert.ok(mags[0] / mags[3] > 4 && mags[0] / mags[3] < 14, `rapport 1/4 ≈ ${(0.55 / 0.07).toFixed(1)} (mesuré ${(mags[0] / mags[3]).toFixed(1)})`);
  // Les partiels aigus s'éteignent plus vite (2 s) que le fondamental (7 s).
  assert.ok(magAt(x, sr, 3, 3.4, 196 * 8.93) < magAt(x, sr, 0.02, 0.4, 196 * 8.93) * 0.02, 'aigus éteints');
  // Enveloppe exponentielle 0,275 → 1e-4 sur 7 s : à t = 3,2 s (contre 0,2 s) le niveau vaut (3,6e-4)^(3/7) ≈ 0,034.
  const decay = magAt(x, sr, 3, 3.4, 196) / magAt(x, sr, 0.02, 0.4, 196);
  assert.ok(decay > 0.02 && decay < 0.06, `fondamental à 3 s : ${decay.toFixed(3)} (attendu ≈ 0,034)`);
});

test('ambiances : boucles sans couture (le dernier échantillon enchaîne avec le premier)', () => {
  for (const name of ['rain', 'ocean', 'drone']) {
    const { x } = readWav(name);
    let sum = 0;
    for (let i = 1; i < x.length; i++) sum += Math.abs(x[i] - x[i - 1]);
    const typical = sum / (x.length - 1);
    const seam = Math.abs(x[0] - x[x.length - 1]);
    assert.ok(seam < typical * 8, `${name} : saut ${seam.toFixed(4)} vs écart typique ${typical.toFixed(4)}`);
  }
});

test('ambiances : pluie = bruit rose filtré entre 900 Hz et 7 kHz', () => {
  const { x, sr } = readWav('rain');
  const low = bandEnergy(x, sr, 20, 300);
  const mid = bandEnergy(x, sr, 1000, 5000);
  const high = bandEnergy(x, sr, 8000, 11000);
  assert.ok(mid > low * 20, `médium/grave = ${(mid / low).toFixed(0)}`);
  assert.ok(mid > high * 3, `médium/aigu = ${(mid / high).toFixed(1)}`);
});

test('ambiances : océan = grave (< 650 Hz) et vagues lentes (LFO 0,09 Hz)', () => {
  const { x, sr } = readWav('ocean');
  const low = bandEnergy(x, sr, 20, 800);
  const high = bandEnergy(x, sr, 1500, 11000);
  assert.ok(low > high * 30, `grave/aigu = ${(low / high).toFixed(0)}`);
  const block = sr; // 1 s
  const rms = [];
  for (let s = 0; s + block <= x.length; s += block) {
    let e = 0;
    for (let i = s; i < s + block; i++) e += x[i] * x[i];
    rms.push(Math.sqrt(e / block));
  }
  assert.ok(Math.max(...rms) / Math.min(...rms) > 2.5, 'les vagues montent et descendent');
  // Période ≈ 11,1 s : le niveau à t et t + 11 s se ressemble plus qu'à t + 5,5 s.
  const lag = (k) => rms.slice(0, rms.length - 12).reduce((a, v, i) => a + Math.abs(v - rms[i + k]), 0);
  assert.ok(lag(11) < lag(6), 'périodicité de 11 s');
});

test('ambiances : drone = 110, 164,8, 220 et 329,6 Hz dans les bonnes proportions', () => {
  const { x, sr } = readWav('drone');
  const seg = x.subarray(0, 65536);
  const mag = spectrum(seg, 65536);
  const at = (hz) => {
    const k = Math.round((hz * 65536) / sr);
    return Math.max(...mag.subarray(k - 3, k + 4));
  };
  const m = [110, 164.81, 220, 329.63].map(at);
  const noise = at(700);
  m.forEach((v, i) => assert.ok(v > noise * 30, `raie ${i + 1} émerge du bruit de fond`));
  const ratio = m[0] / m[1];
  assert.ok(ratio > 1.1 && ratio < 1.8, `110/164,8 ≈ 1,43 (mesuré ${ratio.toFixed(2)})`);
  assert.ok(m[1] > m[3], '164,8 plus fort que 329,6');
});

test('sons : le générateur est déterministe (mêmes octets à chaque exécution)', () => {
  const hash = (n) => crypto.createHash('sha256').update(fs.readFileSync(path.join(DIR, `${n}.wav`))).digest('hex');
  const names = ['done', 'bell', 'rain', 'ocean', 'drone'];
  const before = names.map(hash);
  execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'generate-sounds.cjs')], { stdio: 'pipe' });
  assert.deepEqual(names.map(hash), before);
});
