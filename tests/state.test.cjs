'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const S = require('../.build/state');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const J = (x) => JSON.parse(JSON.stringify(x));

function fakeTimers() {
  const pending = new Map();
  let n = 0;
  return {
    set: (fn) => { pending.set(++n, fn); return n; },
    clear: (h) => pending.delete(h),
    run() { const fns = [...pending.values()]; pending.clear(); fns.forEach((f) => f()); },
    get size() { return pending.size; },
  };
}

function makeStore({ storage = S.createMemoryStorage(), legacy, now = NOW, id = 0 } = {}) {
  const timers = fakeTimers();
  let clockNow = now;
  const clock = { now: () => new Date(clockNow) };
  let seq = id;
  const store = new S.AppStore({ storage, clock, timers, legacy, appVersion: '9.9.9', newId: (p) => `${p}_${++seq}` });
  const feedback = [];
  store.subscribeFeedback((items) => feedback.push(...items));
  return { store, storage, timers, feedback, setNow: (d) => { clockNow = d; } };
}
const seed = (db = D.normalizeImported(buildDb(), TODAY).db) => ({ [S.STORAGE_KEYS.db]: S.serializeDb(db, NOW) });

// ─────────────── Persistance ───────────────

test('persistance : aller-retour sans perte', () => {
  const db = D.normalizeImported(buildDb(), TODAY).db;
  const r = S.deserializeDb(S.serializeDb(db, NOW), TODAY);
  assert.ok(r.ok);
  assert.deepEqual(r.db, db);
  assert.equal(r.savedAt, NOW.toISOString());
});

test('persistance : texte abîmé ou de mauvaise forme', () => {
  assert.deepEqual(S.deserializeDb('{pas json', TODAY), { ok: false, reason: 'invalid_json' });
  assert.deepEqual(S.deserializeDb('[]', TODAY), { ok: false, reason: 'invalid_shape' });
  assert.deepEqual(S.deserializeDb('{"v":1,"db":{"xp":3}}', TODAY), { ok: false, reason: 'invalid_shape' });
});

test('persistance : lecture de l’ancien localStorage', () => {
  const raw = JSON.stringify(buildDb());
  assert.equal(S.readLegacyLocalStorage({ getItem: (k) => (k === 'ht-v2.6' ? raw : null) })(), raw);
  assert.equal(S.readLegacyLocalStorage(undefined)(), null);
  assert.equal(S.readLegacyLocalStorage({ getItem: () => { throw new Error('bloqué'); } })(), null);
});

// ─────────────── Retours sensoriels ───────────────

const has = (items, pred) => items.some(pred);

test('retours : montée de niveau et rang de saison (délais de la PWA)', () => {
  const f = S.eventsToFeedback([
    { type: 'level_up', level: 4, name: 'Fervent' },
    { type: 'season_rank_up', roman: 'V', name: 'Cap' },
  ]);
  assert.deepEqual(f.filter((i) => i.kind === 'toast').map((t) => [t.text, t.icon, t.durationMs, t.delayMs]), [
    ['Niveau 4 atteint : Fervent', 'star', 4000, 300],
    ['Saison : rang V · Cap', 'star', 4000, 1800],
  ]);
  assert.ok(has(f, (i) => i.kind === 'sound' && i.sound === 'levelup' && i.delayMs === 300));
  assert.ok(has(f, (i) => i.kind === 'haptic' && i.style === 'success'));
});

test('retours : succès échelonnés de 700 ms', () => {
  const f = S.eventsToFeedback([
    { type: 'achievement_unlocked', id: 'a', name: 'A', order: 1 },
    { type: 'achievement_unlocked', id: 'b', name: 'B', order: 2 },
  ]);
  assert.deepEqual(f.filter((i) => i.kind === 'toast').map((t) => [t.text, t.delayMs]), [['Succès débloqué : A', 700], ['Succès débloqué : B', 1400]]);
});

test('retours : journée parfaite (confettis, fanfare, bonus à 600 ms) et répétition sans bonus', () => {
  const first = S.eventsToFeedback([{ type: 'perfect_day', bonusXp: 50 }]);
  assert.ok(has(first, (i) => i.kind === 'confetti'));
  assert.ok(has(first, (i) => i.kind === 'sound' && i.sound === 'fanfare'));
  assert.deepEqual(first.filter((i) => i.kind === 'toast').map((t) => [t.text, t.delayMs]), [['Journée parfaite ! +50 XP', 600]]);
  const again = S.eventsToFeedback([{ type: 'perfect_day', bonusXp: null }]);
  assert.ok(!has(again, (i) => i.kind === 'toast'));
});

test('retours : défis gagnés et manqués échelonnés de 2 600 ms', () => {
  const f = S.eventsToFeedback([
    { type: 'challenge_failed', id: 'a', title: 'A' },
    { type: 'challenge_won', id: 'b', title: 'B', reward: 40 },
    { type: 'challenge_failed', id: 'c', title: 'C' },
  ]);
  assert.deepEqual(f.filter((i) => i.kind === 'toast').map((t) => [t.text, t.icon, t.durationMs, t.delayMs]), [
    ['Défi manqué : A', 'alert', 3600, 500],
    ['Défi relevé : B · +40 XP', 'trophy', 4200, 3100],
    ['Défi manqué : C', 'alert', 3600, 5700],
  ]);
  assert.ok(has(f, (i) => i.kind === 'confetti' && i.delayMs === 3100));
});

test('retours : objectifs (eau, compteur, semaine) et vibrations', () => {
  const f = S.eventsToFeedback([
    { type: 'goal_reached', habitId: 'drink', habitName: 'Eau', kind: 'drink', xp: 10 },
    { type: 'goal_reached', habitId: 'running', habitName: 'Running', kind: 'counter', xp: 10 },
    { type: 'times_goal_reached', habitId: 'tt', habitName: 'Méditation', done: 3, required: 3 },
    { type: 'sound', sound: 'fail' },
    { type: 'xp_gained', amount: 10 },
    { type: 'habit_flash', habitId: 'gym' },
  ]);
  assert.deepEqual(f.filter((i) => i.kind === 'toast').map((t) => [t.text, t.icon]), [
    ["Objectif d'hydratation atteint ! +10 XP", 'drink'],
    ['Running : objectif atteint ! +10 XP', 'running'],
    ['Objectif de la semaine atteint : 3/3 « Méditation »', 'star'],
  ]);
  assert.ok(has(f, (i) => i.kind === 'haptic' && i.style === 'warning'));
  assert.ok(has(f, (i) => i.kind === 'flash' && i.habitId === 'gym'));
  assert.deepEqual(S.eventsToFeedback([]), []);
});

// ─────────────── Store ───────────────

test('store : première utilisation = base neuve, rien d’écrit avant la première action', async () => {
  const { store, storage, timers } = makeStore();
  assert.equal(store.getState().hydrated, false);
  store.toggleHabit('gym'); // ignoré avant l'hydratation
  await store.hydrate();
  assert.equal(store.getState().hydrated, true);
  assert.equal(store.getState().db.habitDefs.length, 9);
  assert.equal(storage.data.size, 0);
  assert.equal(timers.size, 0);
  assert.equal(store.getState().db.habits.gym.logs[TODAY], undefined);
});

test('store : une action met à jour l’état, notifie, puis sauvegarde en différé (anti-rebond)', async () => {
  const { store, storage, timers, feedback } = makeStore();
  await store.hydrate();
  let notified = 0;
  store.subscribe(() => notified++);
  store.toggleHabit('gym');
  store.toggleHabit('gym');
  store.toggleHabit('gym');
  assert.equal(store.getState().db.habits.gym.logs[TODAY], 'done');
  assert.ok(notified >= 3);
  assert.equal(storage.data.size, 0, 'pas encore écrit');
  assert.equal(timers.size, 1, 'un seul rendez-vous de sauvegarde malgré 3 actions');
  timers.run();
  await store.flush();
  const saved = S.deserializeDb(storage.data.get(S.STORAGE_KEYS.db), TODAY);
  assert.ok(saved.ok);
  assert.equal(saved.db.habits.gym.logs[TODAY], 'done');
  assert.ok(feedback.some((i) => i.kind === 'sound' && i.sound === 'done'));
  assert.ok(feedback.some((i) => i.kind === 'sound' && i.sound === 'undo'));
});

test('store : redémarrage = mêmes données', async () => {
  const a = makeStore();
  await a.store.hydrate();
  a.store.toggleHabit('projets');
  a.store.addDrink(500);
  await a.store.flush();
  const b = makeStore({ storage: a.storage });
  await b.store.hydrate();
  assert.deepEqual(b.store.getState().db, a.store.getState().db);
});

test('store : base corrompue → copie conservée, app utilisable, rien d’écrasé silencieusement', async () => {
  const storage = S.createMemoryStorage({ [S.STORAGE_KEYS.db]: '{"coupé' });
  const { store } = makeStore({ storage });
  await store.hydrate();
  assert.equal(store.getState().loadIssue, 'corrupt');
  assert.equal(storage.data.get(S.STORAGE_KEYS.corrupt), '{"coupé');
  assert.ok(store.getState().db.habitDefs.length > 0);
});

test('store : reprise unique de l’ancien localStorage de la PWA', async () => {
  const raw = JSON.stringify(buildDb());
  const first = makeStore({ legacy: () => raw });
  await first.store.hydrate();
  assert.equal(first.store.getState().loadIssue, 'legacy_imported');
  assert.equal(first.store.getState().db.habits.gym.logs['2026-10-26'], buildDb().habits.gym.logs['2026-10-26']);
  assert.ok(first.storage.data.has(S.STORAGE_KEYS.db), 'sauvegardé immédiatement');
  assert.equal(first.storage.data.get(S.STORAGE_KEYS.legacyImported), '1');
  // Une base existante prime toujours sur l'ancien stockage.
  const again = makeStore({ storage: first.storage, legacy: () => '{"habits":{}}' });
  await again.store.hydrate();
  assert.equal(again.store.getState().loadIssue, 'none');
  assert.ok(again.store.getState().db.xp >= 640);
});

test('store : ancien stockage illisible ou déjà repris → ignoré', async () => {
  const bad = makeStore({ legacy: () => 'nawak' });
  await bad.store.hydrate();
  assert.equal(bad.store.getState().loadIssue, 'none');
  const done = makeStore({ storage: S.createMemoryStorage({ [S.STORAGE_KEYS.legacyImported]: '1' }), legacy: () => JSON.stringify(buildDb()) });
  await done.store.hydrate();
  assert.equal(done.store.getState().loadIssue, 'none');
  assert.equal(done.store.getState().db.xp, 0);
});

test('store : les défis arrivés à terme sont réglés dès l’hydratation et annoncés', async () => {
  const { store, feedback } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  const status = Object.fromEntries(store.getState().db.challenges.map((c) => [c.id, c.status]));
  assert.equal(status.c_gym, 'failed');
  assert.ok(feedback.some((i) => i.kind === 'toast' && /^Défi manqué/.test(i.text)));
  assert.equal(S.deserializeDb(JSON.stringify({ db: store.getState().db }), TODAY).ok, true);
});

test('store : journée parfaite → confettis et bonus, une seule fois', async () => {
  const { store, feedback } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  feedback.length = 0;
  for (let i = 0; i < 8; i++) store.addCounter('newone');
  store.addCounter('setp');
  store.addCounter('running');
  store.addDrink(250);
  assert.ok(feedback.some((i) => i.kind === 'confetti'));
  assert.ok(feedback.some((i) => i.kind === 'toast' && i.text === 'Journée parfaite ! +50 XP'));
  assert.ok(store.getState().db.perfectDaysClaimed.includes(TODAY));
  feedback.length = 0;
  store.toggleHabit('gym'); store.toggleHabit('gym');
  assert.ok(!feedback.some((i) => i.kind === 'toast' && /Journée parfaite/.test(i.text)));
});

test('store : habitudes, annulations et ordre', async () => {
  const { store } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  const r = store.saveHabit({ ...D.emptyHabitForm(store.getState().db), name: 'Piano' });
  assert.ok(r.ok);
  assert.equal(r.value.habitId, 'c_1');
  assert.deepEqual(store.getState().db.habits.c_1, { logs: {} });
  assert.deepEqual(store.saveHabit({ ...D.emptyHabitForm(store.getState().db), name: '' }), { ok: false, error: 'name_required' });

  const undo = store.archiveHabit('c_1');
  assert.ok(undo);
  assert.equal(store.getState().db.habitDefs.find((h) => h.id === 'c_1').archived, true);
  assert.ok(store.restoreHabit('c_1', undo));
  assert.equal(store.getState().db.habitDefs.find((h) => h.id === 'c_1').archived, undefined);

  const purge = store.purgeHabit('c_1');
  assert.equal(store.getState().db.habits.c_1, undefined);
  store.undoPurge(purge);
  assert.ok(store.getState().db.habits.c_1);

  const before = store.getState().db.habitDefs.map((h) => h.id);
  assert.equal(store.moveHabit(before[1], -1), true);
  assert.equal(store.getState().db.habitDefs[0].id, before[1]);
  assert.equal(store.moveHabit(before[1], -1), false);
});

test('store : défis et pauses', async () => {
  const { store } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  const ok = store.createChallenge({ habitId: 'sleep', days: 7, mode: 'all', min: 1 });
  assert.deepEqual(ok, { ok: true, value: true });
  assert.ok(store.getState().db.challenges.some((c) => c.habitId === 'sleep' && c.status === 'active'));
  assert.deepEqual(store.createChallenge({ habitId: 'sleep', days: 7, mode: 'all', min: 1 }), { ok: false, error: 'already_active' });
  const id = store.getState().db.challenges.find((c) => c.habitId === 'sleep').id;
  store.abandonChallenge(id);
  assert.equal(store.getState().db.challenges.find((c) => c.id === id).status, 'abandoned');
  store.clearChallengeHistory();
  assert.ok(store.getState().db.challenges.every((c) => c.status === 'active'));

  assert.deepEqual(store.savePause({ from: '2026-10-29', to: '2026-10-29', reason: 'trip' }), { ok: true, value: 1 });
  assert.equal(store.savePause({ from: '2026-10-30', to: '2026-10-30', reason: 'trip' }).ok, false, 'quota d’octobre épuisé');
  store.removePause('2026-10-29');
  assert.equal(store.getState().db.pauses['2026-10-29'], undefined);
  store.changePauseQuota(+1);
  assert.equal(store.getState().db.profile.pauseQuota, 4);
});

test('store : profil et réglages (le début de journée rafraîchit les vues)', async () => {
  const { store } = makeStore();
  await store.hydrate();
  store.setName('  Mathilde  ');
  store.togglePref('zen');
  store.togglePref('sound');
  store.setThemeMode('dark');
  store.setAvatar('🦊 renard');
  const p = store.getState().db.profile;
  assert.deepEqual([p.name, p.zenMode, p.soundEnabled, p.themeMode, p.darkMode, p.avatar], ['Mathilde', true, false, 'dark', true, '🦊']);
  const rev = store.getState().revision;
  store.setDayStartHour(9);
  assert.equal(store.getState().db.profile.dayStartHour, 6, 'borné à 6 h');
  assert.equal(store.getState().revision, rev + 1);
  store.setAvatar('   ');
  assert.equal(store.getState().db.profile.avatar, '🦊', 'saisie vide ignorée');
  store.setAvatar(null);
  assert.equal(D.avatarEmoji(store.getState().db), '🙂');
});

test('store : export, import avec point de restauration, annulation de l’import', async () => {
  const { store, storage } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  store.toggleHabit('projets');
  const original = store.getState().db;
  const text = store.exportBackup();
  const env = JSON.parse(text);
  assert.deepEqual([env.app, env.schema, env.appVersion], ['Zeno', 'ht-v2.6', '9.9.9']);
  assert.equal(env.data.profile.lastBackup, NOW.toISOString());

  const other = D.createInitialDb(TODAY);
  const out = await store.importBackup(JSON.stringify(D.buildBackup(other, '1.0', NOW)));
  assert.equal(out.ok, true);
  assert.equal(out.summary.habits, 9);
  assert.equal(out.summary.xp, 0);
  assert.equal(store.getState().db.xp, 0);
  assert.equal(await store.hasRestorePoint(), true);

  assert.equal(await store.restorePreviousImport(), true);
  assert.equal(store.getState().db.xp, original.xp);
  assert.deepEqual(store.getState().db.habits.projets, original.habits.projets);
  assert.equal(await store.hasRestorePoint(), false);
  assert.equal(await store.restorePreviousImport(), false);
  assert.ok(storage.data.get(S.STORAGE_KEYS.db));
});

test('store : un import invalide ne touche à rien', async () => {
  const { store } = makeStore({ storage: S.createMemoryStorage(seed()) });
  await store.hydrate();
  const before = store.getState().db;
  const out = await store.importBackup('{"pas":"une sauvegarde"}');
  assert.equal(out.ok, false);
  assert.equal(store.getState().db, before);
  assert.equal(await store.hasRestorePoint(), false);
});

test('store : échec d’écriture signalé, puis nouvelle tentative réussie', async () => {
  const storage = S.createMemoryStorage();
  let fail = true;
  const real = storage.setItem;
  storage.setItem = (k, v) => (fail ? Promise.reject(new Error('disque plein')) : real(k, v));
  const { store } = makeStore({ storage });
  await store.hydrate();
  store.toggleHabit('gym');
  await store.flush();
  assert.equal(store.getState().saveFailed, true);
  fail = false;
  store.toggleHabit('work');
  await store.flush();
  assert.equal(store.getState().saveFailed, false);
  assert.ok(S.deserializeDb(storage.data.get(S.STORAGE_KEYS.db), TODAY).ok);
});

test('store : réinitialisation complète, sans reprise de l’ancien stockage', async () => {
  const storage = S.createMemoryStorage(seed());
  const { store } = makeStore({ storage, legacy: () => JSON.stringify(buildDb()) });
  await store.hydrate();
  assert.ok(store.getState().db.xp > 0);
  await store.resetAll();
  assert.equal(store.getState().db.xp, 0);
  assert.equal(store.getState().db.habitDefs.length, 9);
  assert.equal(storage.data.get(S.STORAGE_KEYS.legacyImported), '1');
  const again = makeStore({ storage, legacy: () => JSON.stringify(buildDb()) });
  await again.store.hydrate();
  assert.equal(again.store.getState().db.xp, 0, 'l’ancien stockage n’est pas ré-importé');
});

test('store : refresh après minuit change la journée et incrémente la révision', async () => {
  const ctx = makeStore({ storage: S.createMemoryStorage(seed()) });
  await ctx.store.hydrate();
  assert.equal(D.today(ctx.store.ctx), TODAY);
  const rev = ctx.store.getState().revision;
  ctx.setNow(new Date(2026, 9, 29, 0, 5));
  ctx.store.refresh();
  assert.equal(D.today(ctx.store.ctx), '2026-10-29');
  assert.equal(ctx.store.getState().revision, rev + 1);
});

test('horloge : délai avant le prochain changement de jour', () => {
  const db = D.createInitialDb(TODAY);
  const at = (h, m, hour = 0) => ({ db: { ...db, profile: { ...db.profile, dayStartHour: hour } }, clock: D.fixedClock(new Date(2026, 9, 28, h, m)) });
  assert.equal(D.msUntilNextDay(at(23, 0)), 3600e3);
  assert.equal(D.msUntilNextDay(at(1, 0, 4)), 3 * 3600e3, 'avant 4 h : la journée change à 4 h le même jour');
  assert.equal(D.msUntilNextDay(at(5, 0, 4)), 23 * 3600e3, 'après 4 h : demain 4 h');
});
