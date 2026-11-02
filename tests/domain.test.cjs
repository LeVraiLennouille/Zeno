'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const ctxOf = (raw = buildDb(), now = NOW) => {
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  return { db: r.db, clock: D.fixedClock(now) };
};

// ─────────────── Import : parité avec backup.js sur des entrées hostiles ───────────────

const HOSTILE = {
  createdAt: 'pas-une-date',
  xp: -50.7,
  profile: { name: 'x'.repeat(100), avatar: 'y'.repeat(40), soundEnabled: false, themeMode: 'neon', darkMode: true, pauseQuota: 99, dayStartHour: 9.9, weeklyReview: false, lastBackup: 'n/a', backupSnooze: '2026-02-30x', reviewedWeek: '2026-10-19', moodFeelings: { '2026-10-01': 'Joie', bad: 'x', '2026-10-02': 5 } },
  habitDefs: [
    { id: 'ok1', name: '  Lire  ', type: 'counter', goal: 10, step: 1, max: 5, unit: 'pagesxxxxxxxxx', color: 'rouge', emoji: '' },
    { id: 'ok1', name: 'Doublon', type: 'good' },
    { id: 'bad id!', name: 'Invalide', type: 'good' },
    { id: 'notype', name: 'Sans type', type: 'wat' },
    { id: 'tm', name: 'Times', type: 'times', target: 99, activeDays: [1, 1, 3, 9, -1, 2.5] },
    { id: 'bd', name: 'Mauvaise', type: 'bad', levels: [' 5 min ', '', 3, 'x'.repeat(30)], since: '2026-05-01', archived: true, archivedOn: '2026-06-01', gaps: [{ from: '2026-06-01' }, { from: 'zz' }, { from: '2026-07-01', to: '2026-07-05' }], custom: 1 },
    { id: 'wk', name: 'Hebdo', type: 'weekly', optional: 1, weekdayOnly: 'oui' },
    { id: 'ct', name: 'Compteur ok', type: 'drink', goal: 2000, step: 250, max: 5000, unit: 'ml' },
    null, 42, 'str',
  ],
  habits: {
    ok1: { logs: { '2026-10-01': 'done', '2026-10-02': 3, '2026-10-03': -1, '2026-10-04': 'oops', 'bad-key': 'done', '2026-10-05': 2e6 } },
    bd: { logs: { '2026-10-01': 'fail' }, vals: { '2026-10-01': '15 minutes plus long', '2026-10-02': 7 } },
    ghost: { logs: { '2026-10-01': 'done' } },
  },
  moods: { '2026-10-01': 5, '2026-10-02': 6, '2026-10-03': 2.5, nope: 3 },
  journal: { '2026-10-01': '  ', '2026-10-02': 'z'.repeat(700), '2026-10-03': 'ok' },
  pauses: { '2026-10-01': { reason: 'sick' }, '2026-10-02': { reason: 'xyz' }, '2026-10-03': 'bof' },
  xpWeek: { '2026-10-05': 12.9, '2026-10-12': -4, '2026-10-19': 1e9 },
  meditation: { '2026-10-01': 5, '2026-10-02': 5000, '2026-10-03': -1 },
  sleepLog: { '2026-10-01': { hours: 30, minutes: 99, bedtime: '23:00:00', wakeTime: '7:00' }, '2026-10-02': { hours: 'x' } },
  reminders: [{ id: 'a b', title: '', hour: 30, minute: -5, days: [0, 7, 3, 3], habitId: 'ok1' }, { id: 'dup', title: 'A' }, { id: 'dup', title: 'B' }, 7],
  challenges: [
    { id: 'c1', habitId: 'ok1', start: '2026-10-01', days: 10, status: 'active', required: 'all', reward: 12.7, title: 't'.repeat(80), endedOn: '2026-10-11' },
    { id: 'c2', habitId: 'ok1', start: '2026-10-01', days: 2, status: 'active' },
    { id: 'c3', habitId: 'ok1', start: 'x', days: 10, status: 'active' },
    { id: 'c4', habitId: 'ok1', start: '2026-10-01', days: 10, status: 'weird' },
    { id: 'c5', habitId: 'ok1', start: '2026-10-01', days: 20, status: 'won', required: 0, reward: -3 },
  ],
  seasonXp: { 'winter-2026': 100.9, 'autumn-26': 5, 'spring-2026': -1 },
  unlockedAchievements: ['first_habit', 'nope', 3],
  perfectDaysClaimed: ['2026-10-01', 'bad'],
  penaltiesApplied: ['2026-10-02'],
  meditationXpDay: '2026-10-03',
};

for (const [name, input] of [
  ['entrée hostile', HOSTILE],
  ['base de test réaliste', buildDb()],
  ['minimale (habits vide)', { habits: {} }],
]) {
  test(`import : parité avec normalizeImported du legacy – ${name}`, () => {
    const legacy = createLegacy({ now: NOW, db: buildDb() });
    const expected = legacy.call(`normalizeImported(${JSON.stringify(input)})`);
    const actual = D.normalizeImported(JSON.parse(JSON.stringify(input)), TODAY);
    // Les deux n'utilisent « aujourd'hui » que comme repli de createdAt : aligné par la date figée.
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
  });
}

test('import : refuse ce qui n’est pas une sauvegarde', () => {
  assert.equal(D.normalizeImported(null, TODAY).ok, false);
  assert.equal(D.normalizeImported([], TODAY).ok, false);
  assert.equal(D.normalizeImported({ xp: 3 }, TODAY).ok, false);
});

test('import : enveloppe de la PWA, base nue et JSON invalide', () => {
  const db = ctxOf().db;
  const exported = JSON.stringify(D.buildBackup(db, '3.5.0', NOW));
  const a = D.parseBackup(exported, TODAY);
  assert.ok(a.ok);
  assert.equal(a.meta.schema, 'ht-v2.6');
  assert.equal(a.meta.app, 'Zeno');
  assert.deepEqual(a.db, db, 'export puis import = identité');
  const b = D.parseBackup(JSON.stringify(db), TODAY);
  assert.ok(b.ok);
  assert.deepEqual(b.db, db);
  assert.equal(D.parseBackup('{pas du json', TODAY).ok, false);
});

test('nouvelle installation : base initiale valide et stable à l’import', () => {
  const db = D.createInitialDb(TODAY);
  assert.equal(db.habitDefs.length, 9);
  const r = D.normalizeImported(JSON.parse(JSON.stringify(db)), TODAY);
  assert.ok(r.ok);
  assert.equal(r.db.habitDefs.length, 9);
  assert.equal(r.db.reminders.length, 4);
});

// ─────────────── Défis : création ───────────────

test('défis : création valide, titre automatique, récompense', () => {
  const ctx = ctxOf();
  let n = 0;
  const res = D.createChallenge(ctx, { habitId: 'sleep', days: 14, mode: 'all', min: 1 }, () => `ch${++n}`);
  assert.ok(res.ok);
  const ch = res.value.db.challenges.at(-1);
  assert.equal(ch.id, 'ch1');
  assert.equal(ch.title, 'Sommeil · 14 jours d’affilée');
  assert.equal(ch.required, 'all');
  assert.equal(ch.start, TODAY);
  assert.equal(ch.reward, D.chalRewardFor(D.chalActiveDays(ctx, ctx.db.habitDefs.find((h) => h.id === 'sleep'), 14)));
  assert.equal(ctx.db.challenges.length, 5, 'la base d’origine n’est pas modifiée');
});

test('défis : habitude « à éviter » = toujours tous les jours ; mode minimum borné', () => {
  const ctx = ctxOf();
  const bad = D.createChallenge(ctx, { habitId: 'sugar', days: 7, mode: 'min', min: 3 }, () => 'x1');
  assert.ok(bad.ok);
  assert.equal(bad.value.db.challenges.at(-1).required, 'all');
  assert.equal(bad.value.db.challenges.at(-1).title.startsWith('7 jours sans'), true);
  const min = D.createChallenge(ctx, { habitId: 'yoga', days: 7, mode: 'min', min: 99 }, () => 'x2');
  assert.ok(min.ok);
  assert.ok(min.value.db.challenges.at(-1).required <= 7);
});

test('défis : erreurs métier', () => {
  const ctx = ctxOf();
  const id = () => 'z';
  assert.deepEqual(D.createChallenge(ctx, { habitId: 'nope', days: 7, mode: 'all', min: 1 }, id), { ok: false, error: 'unknown_habit' });
  assert.deepEqual(D.createChallenge(ctx, { habitId: 'sleep', days: 2, mode: 'all', min: 1 }, id), { ok: false, error: 'bad_duration' });
  assert.deepEqual(D.createChallenge(ctx, { habitId: 'sleep', days: 400, mode: 'all', min: 1 }, id), { ok: false, error: 'bad_duration' });
  assert.deepEqual(D.createChallenge(ctx, { habitId: 'gym', days: 7, mode: 'all', min: 1 }, id), { ok: false, error: 'already_active' });
});

test('défis : au plus 5 défis actifs', () => {
  const raw = buildDb();
  const mk = (habitId) => ({ id: `a_${habitId}`, habitId, title: habitId, emoji: '🎯', color: '#8EA2FF', days: 30, required: 'all', start: TODAY, status: 'active', reward: 40 });
  raw.challenges = ['sleep', 'projets', 'work', 'gym', 'yoga'].map(mk);
  const ctx = ctxOf(raw);
  assert.equal(ctx.db.challenges.filter((c) => c.status === 'active').length, 5);
  assert.deepEqual(D.createChallenge(ctx, { habitId: 'sugar', days: 7, mode: 'all', min: 1 }, () => 'six'), { ok: false, error: 'max_active' });
});

test('défis : abandon et effacement de l’historique', () => {
  const ctx = ctxOf();
  const a = D.abandonChallenge(ctx, 'c_gym');
  const c = a.db.challenges.find((x) => x.id === 'c_gym');
  assert.equal(c.status, 'abandoned');
  assert.equal(c.endedOn, TODAY);
  assert.equal(D.abandonChallenge({ db: a.db, clock: ctx.clock }, 'c_gym').db, a.db, 'sans effet = même référence');
  const cleared = D.clearChallengeHistory({ db: a.db, clock: ctx.clock });
  assert.ok(cleared.db.challenges.every((x) => x.status === 'active'));
});

// ─────────────── Pauses ───────────────

test('pauses : pose, quota par mois, doublons, limites', () => {
  const ctx = ctxOf();
  // Octobre : 2 pauses déjà posées (20 et 21), quota 3 → il en reste 1.
  assert.equal(D.pausesLeft(ctx.db, '2026-10'), 1);
  const one = D.savePause(ctx, { from: '2026-10-29', to: '2026-10-29', reason: 'trip' });
  assert.ok(one.ok);
  assert.equal(one.value.days, 1);
  assert.deepEqual(one.value.db.pauses['2026-10-29'], { reason: 'trip' });
  const ctx2 = { db: one.value.db, clock: ctx.clock };
  const over = D.savePause(ctx2, { from: '2026-10-30', to: '2026-10-30', reason: 'sick' });
  assert.deepEqual(over, { ok: false, error: { code: 'quota_exceeded', month: '2026-10', left: 0 } });
  assert.deepEqual(D.savePause(ctx2, { from: '2026-10-29', to: '2026-10-29', reason: 'sick' }), { ok: false, error: { code: 'already_paused' } });
  assert.deepEqual(D.savePause(ctx, { from: '2026-11-05', to: '2026-12-31', reason: 'sick' }), { ok: false, error: { code: 'too_long', max: 14 } });
  assert.deepEqual(D.savePause(ctx, { from: '2026-09-01', to: '2026-09-02', reason: 'sick' }), { ok: false, error: { code: 'out_of_range' } });
  assert.deepEqual(D.savePause(ctx, { from: '2026-11-02', to: '2026-11-01', reason: 'sick' }), { ok: false, error: { code: 'empty_range' } });
});

test('pauses : une pause gèle la série et se retire', () => {
  const ctx = ctxOf();
  const before = D.calcStreak(ctx, ctx.db.habitDefs.find((h) => h.id === 'projets')).current;
  const paused = D.savePause(ctx, { from: '2026-10-29', to: '2026-10-29', reason: 'sick' });
  assert.ok(paused.ok);
  const removed = D.removePause({ db: paused.value.db, clock: ctx.clock }, '2026-10-29');
  assert.equal(removed.db.pauses['2026-10-29'], undefined);
  assert.equal(D.removePause(ctx, '2030-01-01').db, ctx.db);
  assert.equal(typeof before, 'number');
});

test('pauses : quota borné de 0 à 10', () => {
  let ctx = ctxOf();
  for (let i = 0; i < 20; i++) ctx = { db: D.changePauseQuota(ctx, +1).db, clock: ctx.clock };
  assert.equal(ctx.db.profile.pauseQuota, 10);
  for (let i = 0; i < 20; i++) ctx = { db: D.changePauseQuota(ctx, -1).db, clock: ctx.clock };
  assert.equal(ctx.db.profile.pauseQuota, 0);
});

// ─────────────── Immutabilité et robustesse ───────────────

test('les actions ne modifient jamais la base d’origine', () => {
  const ctx = ctxOf();
  const snapshot = JSON.stringify(ctx.db);
  D.toggleHabit(ctx, 'gym');
  D.addDrinkAmount(ctx, 250);
  D.addCounter(ctx, 'running');
  D.setBadLevel(ctx, 'smoke', 1);
  D.updateChallenges({ db: ctx.db, clock: D.fixedClock(new Date(2026, 11, 20)) });
  assert.equal(JSON.stringify(ctx.db), snapshot);
});

test('les actions sur une habitude inconnue sont sans effet (même référence)', () => {
  const ctx = ctxOf();
  for (const res of [D.toggleHabit(ctx, 'nope'), D.addCounter(ctx, 'gym'), D.removeCounter(ctx, 'nope'), D.setBadLevel(ctx, 'gym', 1), D.setBadLevel(ctx, 'smoke', 9)]) {
    assert.equal(res.db, ctx.db);
    assert.deepEqual(res.events, []);
  }
});

test('l’eau est plafonnée et ne récompense qu’une fois l’objectif', () => {
  let ctx = ctxOf();
  const first = D.addDrinkAmount(ctx, 250); // 1750 → 2000 : objectif atteint
  assert.ok(first.events.some((e) => e.type === 'goal_reached'));
  ctx = { db: first.db, clock: ctx.clock };
  const second = D.addDrinkAmount(ctx, 250); // déjà atteint : pas de nouvelle récompense
  assert.ok(!second.events.some((e) => e.type === 'goal_reached'));
  ctx = { db: second.db, clock: ctx.clock };
  const capped = D.addDrinkAmount(ctx, 99999);
  assert.equal(D.getDrinkMl(capped.db, TODAY), 5000);
  assert.equal(D.addDrinkAmount({ db: capped.db, clock: ctx.clock }, 250).db, capped.db);
});

test('dates : clés valides uniquement', () => {
  assert.equal(D.isDateKey('2026-02-30'), true, 'même tolérance que le legacy (Date.parse)');
  assert.equal(D.isDateKey('2026-13-01'), false);
  assert.equal(D.isDateKey('26-1-1'), false);
  assert.throws(() => D.asDateKey('hier'));
  assert.equal(D.fmtDate(D.parseDate('2026-03-08')), '2026-03-08');
});
