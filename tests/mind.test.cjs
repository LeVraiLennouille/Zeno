'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const S = require('../.build/state');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const J = (x) => JSON.parse(JSON.stringify(x));

function pair(raw = buildDb()) {
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  const legacy = createLegacy({ now: NOW, db: J(r.db) });
  legacy.call(`globalThis.__html = {}; globalThis.__els = {};
    document = {
      getElementById: (id) => (__els[id] ||= {
        classList: { add() {}, remove() {}, toggle() {} }, style: { setProperty() {} }, dataset: {},
        set innerHTML(v) { __html[id] = v; }, get innerHTML() { return __html[id] || ''; },
        set textContent(v) { __html[id + ':text'] = v; }, get textContent() { return __html[id + ':text']; },
        setAttribute() {}, querySelector: () => null, disabled: false, value: '',
      }),
      querySelector: () => ({ scrollTop: 0 }),
      querySelectorAll: () => [], addEventListener() {},
    };`);
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(NOW) } };
}
const text = (legacy, id) => legacy.call(`__html['${id}:text']`);

// ─────────────── Respiration ───────────────

for (const pattern of ['box', '478', 'calm']) {
  test(`respiration « ${pattern} » : phases, décompte et cycles identiques seconde par seconde`, () => {
    const { legacy } = pair();
    legacy.call(`selectBreathPattern('${pattern}'); startBreathing();`);
    let mine = D.startBreath(pattern);
    const total = D.BREATHING_PATTERNS[pattern].durations.reduce((a, b) => a + b, 0);
    assert.equal(text(legacy, 'breathPhaseLabel'), D.breathPhaseLabel(mine));
    assert.equal(text(legacy, 'breathCountdown'), mine.secondsLeft);
    for (let sec = 1; sec <= total * 3 + 2; sec++) {
      assert.equal(legacy.peek(), 1000, 'la minuterie suivante est le décompte');
      legacy.step();
      if (legacy.peek() === 100) legacy.step(); // enchaînement de phase
      mine = D.tickBreath(mine);
      const where = `seconde ${sec}`;
      assert.equal(text(legacy, 'breathCountdown'), mine.secondsLeft, `${where} : décompte`);
      assert.equal(text(legacy, 'breathPhaseLabel'), D.breathPhaseLabel(mine), `${where} : consigne`);
      assert.equal(legacy.call('breath.phaseIdx'), mine.phaseIdx, `${where} : phase`);
      assert.equal(legacy.call('breath.rounds'), mine.rounds, `${where} : cycles`);
    }
    assert.equal(mine.rounds, 3);
  });
}

test('respiration : arrêt, changement de rythme, libellés et mouvements', () => {
  const { legacy } = pair();
  legacy.call(`selectBreathPattern('478'); startBreathing(); stopBreathing();`);
  let s = D.stopBreath(D.startBreath('478'));
  assert.equal(text(legacy, 'breathPhaseLabel'), D.breathPhaseLabel(s));
  assert.equal(D.tickBreath(s), s, 'plus de décompte après l’arrêt');
  s = D.selectBreathPattern('calm');
  assert.deepEqual([s.status, s.secondsLeft, s.rounds, D.breathPhaseLabel(s)], ['ready', 5, 0, 'Prêt']);
  assert.equal(D.breathRoundsLabel(0), 'cycle terminé');
  assert.equal(D.breathRoundsLabel(1), 'cycle terminé');
  assert.equal(D.breathRoundsLabel(2), 'cycles terminés');
  const run = D.startBreath('box');
  assert.deepEqual(['Inhale', 'Hold', 'Exhale', 'Hold out'].map((p, i) => D.breathMotion({ ...run, phaseIdx: i })), ['inhale', 'hold', 'exhale', 'hold']);
  assert.equal(D.breathMotion(s), 'rest');
  for (const p of ['Inhale', 'Hold', 'Hold out', 'Exhale']) {
    assert.equal(D.BREATH_LABEL[p], legacy.call(`BREATH_LABEL['${p}']`));
    assert.equal(D.BREATH_SHORT[p], legacy.call(`BREATH_SHORT['${p}']`));
  }
  assert.deepEqual(J(D.BREATHING_PATTERNS), legacy.call('BREATHING_PATTERNS'));
});

// ─────────────── Méditation : machine à états ───────────────

function setMed(legacy, over) {
  legacy.call(`med = Object.assign(med, { iv: null, nodes: null, wake: null }, ${JSON.stringify(over)});`);
}

test('méditation : temps écoulé, horloge et anneau identiques', () => {
  const { legacy } = pair();
  const now = NOW.getTime();
  const cases = [
    { dur: 600, state: 'idle', remaining: 600, endAt: 0 },
    { dur: 600, state: 'running', remaining: 600, endAt: now + 450_000 },
    { dur: 600, state: 'running', remaining: 600, endAt: now + 449_100 },
    { dur: 1200, state: 'paused', remaining: 777, endAt: 0 },
    { dur: 300, state: 'done', remaining: 0, endAt: 0 },
    { dur: 300, state: 'running', remaining: 300, endAt: now - 5000 },
  ];
  for (const c of cases) {
    setMed(legacy, c);
    const s = { ...D.initialMed(), ...c, amb: 'silence' };
    assert.equal(D.medElapsed(s, now), legacy.call('medElapsed()'), JSON.stringify(c));
    const legacyProgress = (() => {
      legacy.call('updateMedClock()');
      return 1 - Number(legacy.call("document.getElementById('medRing').style.strokeDashoffset")) / 880;
    })();
    assert.ok(Math.abs(D.medProgress(s, now) - legacyProgress) < 1e-9 || c.state === 'running', `anneau ${JSON.stringify(c)}`);
  }
  for (const sec of [0, 5, 59, 60, 61, 600, 3599, 1200]) assert.equal(D.medClock(sec), legacy.call(`medFmt(${sec})`));
});

test('méditation : démarrer, pause, reprise, fin — mêmes valeurs', () => {
  const t0 = NOW.getTime();
  let s = D.medSelectDuration(D.initialMed(), 5);
  assert.equal(s.remaining, 300);
  s = D.medRun(s, t0, true);
  assert.deepEqual([s.state, s.remaining, s.endAt], ['running', 300, t0 + 300_000]);
  let r = D.medTick(s, t0 + 100_000);
  assert.deepEqual([r.state.remaining, r.completed], [200, false]);
  s = D.medPause(r.state, t0 + 100_000);
  assert.deepEqual([s.state, s.remaining], ['paused', 200]);
  assert.equal(D.medSelectDuration(s, 20), s, 'durée figée pendant la séance');
  assert.equal(D.medTick(s, t0 + 999_000).completed, false, 'rien ne bouge en pause');
  s = D.medRun(s, t0 + 500_000, false);
  assert.equal(s.endAt, t0 + 700_000);
  r = D.medTick(s, t0 + 700_000);
  assert.deepEqual([r.state.state, r.state.remaining, r.completed], ['done', 0, true]);
  assert.equal(D.medStatusLabel(r.state), 'Session terminée ✓');
  assert.equal(D.medStartLabel(r.state), 'Recommencer');
  assert.deepEqual(D.medStop(r.state), r.state, 'rien à arrêter une fois terminée');
  const stopped = D.medStop(D.medPause(D.medRun(D.initialMed(), t0, true), t0 + 10_000));
  assert.deepEqual([stopped.state, stopped.remaining], ['idle', 600]);
  assert.equal(D.medPause(D.initialMed(), t0).state, 'idle');
  assert.equal(D.medDescription('rain', false).endsWith('(Les sons sont désactivés dans ton compte.)'), true);
  assert.equal(D.medDescription('rain', true), D.MED_DESC.rain);
});

// ─────────────── Méditation : enregistrement ───────────────

for (const [label, minutes, prior] of [
  ['première séance du jour', 10, null],
  ['deuxième séance du jour (pas d’XP)', 5, TODAY],
  ['séance de 20 min', 20, null],
]) {
  test(`méditation : fin de séance — ${label}`, () => {
    const raw = buildDb();
    if (prior) raw.meditationXpDay = prior;
    const { legacy, ctx } = pair(raw);
    setMed(legacy, { dur: minutes * 60, state: 'running', remaining: minutes * 60, endAt: NOW.getTime() - 1 });
    legacy.resetCaptures();
    legacy.call('completeMeditation()');
    legacy.flush();
    const mine = D.completeMeditation(ctx, minutes);
    const lg = legacy.db;
    const pick = (db) => ({ meditation: J(db.meditation), xp: db.xp, day: db.meditationXpDay ?? null, ach: [...db.unlockedAchievements].sort(), xpWeek: J(db.xpWeek), seasonXp: J(db.seasonXp) });
    assert.deepEqual(pick(mine.db), pick(lg));
    const done = mine.events.find((e) => e.type === 'meditation_done');
    assert.deepEqual([done.minutes, done.xp], [minutes, prior ? null : 10]);
    const toast = S.eventsToFeedback(mine.events).find((i) => i.kind === 'toast' && i.icon === 'zen');
    assert.equal(toast.text, legacy.toasts.find((t) => /Session terminée/.test(t)));
    assert.equal(toast.durationMs, prior ? 3000 : 3600);
    assert.equal(legacy.sounds.filter((x) => x === 'levelup').length > 0, mine.events.some((e) => e.type === 'level_up'));
  });
}

test('méditation : cloche début et fin (deux coups à 2,6 s) et vibration', () => {
  const f = S.eventsToFeedback([{ type: 'meditation_done', minutes: 10, xp: 10 }]);
  assert.deepEqual(f.filter((i) => i.kind === 'sound').map((i) => [i.sound, i.delayMs]), [['bell', 0], ['bell', 2600]]);
  assert.ok(f.some((i) => i.kind === 'haptic' && i.style === 'success'));
});

for (const [label, state, remaining, expectedMinutes] of [
  ['en pause après 5 min 50 s', 'paused', 250, 5],
  ['en pause après 59 s', 'paused', 541, 0],
  ['en pause après 60 s', 'paused', 540, 1],
  ['en cours après 2 min 10 s', 'running', null, 2],
]) {
  test(`méditation : arrêt volontaire — ${label}`, () => {
    const { legacy, ctx } = pair();
    const endAt = NOW.getTime() + (600 - 130) * 1000;
    setMed(legacy, { dur: 600, state, remaining: remaining ?? 470, endAt: state === 'running' ? endAt : 0 });
    legacy.call('stopMeditation(true)');
    const elapsed = state === 'running' ? 130 : 600 - remaining;
    const mine = D.stopMeditationSession(ctx, elapsed);
    assert.deepEqual(J(mine.db.meditation), legacy.db.meditation);
    assert.equal(mine.db.xp, legacy.db.xp, 'aucune XP à l’arrêt');
    assert.equal((mine.db.meditation[TODAY] ?? 0) - (ctx.db.meditation[TODAY] ?? 0), expectedMinutes);
    assert.deepEqual(mine.db === ctx.db, expectedMinutes === 0, 'moins d’une minute : rien n’est enregistré');
  });
}

test('méditation : minutes du jour et succès liés', () => {
  const { ctx } = pair();
  assert.equal(D.meditationToday(ctx), 0);
  const raw = buildDb();
  raw.meditation = {};
  const fresh = pair(raw).ctx;
  let db = fresh.db;
  for (let i = 0; i < 2; i++) db = D.completeMeditation({ db, clock: fresh.clock }, 5).db;
  assert.equal(db.meditation[TODAY], 10);
  assert.ok(db.unlockedAchievements.includes('calm_mind'), 'Esprit calme dès 5 minutes');
  assert.equal(D.meditationToday({ db, clock: fresh.clock }), 10);
});

test('méditation : le store enregistre et notifie', async () => {
  const storage = S.createMemoryStorage({ [S.STORAGE_KEYS.db]: S.serializeDb(D.normalizeImported(buildDb(), TODAY).db, NOW) });
  let seq = 0;
  const store = new S.AppStore({ storage, clock: { now: () => new Date(NOW) }, timers: { set: () => 0, clear() {} }, appVersion: '1', newId: (p) => `${p}${++seq}` });
  const got = [];
  store.subscribeFeedback((items) => got.push(...items));
  await store.hydrate();
  got.length = 0;
  store.completeMeditation(10);
  assert.equal(store.getState().db.meditation[TODAY], 10);
  assert.ok(got.some((i) => i.kind === 'toast' && /Session terminée : 10 min/.test(i.text)));
  store.stopMeditation(30);
  assert.equal(store.getState().db.meditation[TODAY], 10, 'moins d’une minute : inchangé');
  store.stopMeditation(185);
  assert.equal(store.getState().db.meditation[TODAY], 13, '3 minutes entières ajoutées');
});
