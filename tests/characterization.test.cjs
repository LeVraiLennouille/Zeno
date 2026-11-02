'use strict';
/**
 * Tests de caractérisation : le domaine TypeScript doit reproduire à l'identique
 * le comportement du code JavaScript d'origine (legacy/js), exécuté dans un bac à sable.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb, key, at } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0); // mercredi 28 octobre 2026, 14 h
const TODAY = '2026-10-28';

function pair({ now = NOW, dayStartHour = 0, db = buildDb() } = {}) {
  const raw = JSON.parse(JSON.stringify(db));
  raw.profile.dayStartHour = dayStartHour;
  const legacy = createLegacy({ now, db: raw, dayStartHour });
  const norm = D.normalizeImported(raw, TODAY);
  assert.ok(norm.ok, 'la base de test doit être acceptée par le validateur');
  return { legacy, ctx: { db: norm.db, clock: D.fixedClock(now) }, raw };
}

/** Vue comparable de la base (ignore les `vals` vides, que le legacy laisse traîner). */
function view(db) {
  const habits = {};
  for (const [id, h] of Object.entries(db.habits)) {
    habits[id] = { logs: h.logs, ...(h.vals && Object.keys(h.vals).length ? { vals: h.vals } : {}) };
  }
  return {
    xp: db.xp,
    xpWeek: db.xpWeek,
    seasonXp: db.seasonXp,
    perfectDaysClaimed: [...db.perfectDaysClaimed].sort(),
    unlockedAchievements: [...db.unlockedAchievements].sort(),
    challenges: db.challenges,
    habits,
  };
}

function soundsOf(events) {
  const out = [];
  for (const e of events) {
    if (e.type === 'sound') out.push(e.sound);
    else if (e.type === 'level_up' || e.type === 'season_rank_up') out.push('levelup');
    else if (e.type === 'achievement_unlocked') out.push('done');
    else if (e.type === 'perfect_day' || e.type === 'challenge_won') out.push('fanfare');
  }
  return out.sort();
}

const dayRange = (from, to) => {
  const days = [];
  for (let d = at(from); key(d) <= to; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
};

// ───────────────────────── Lectures ─────────────────────────

for (const scenario of [
  { name: 'journée normale (mercredi 14 h)', now: NOW, dayStartHour: 0 },
  { name: 'début de journée à 4 h, il est 2 h 30 (= encore la veille)', now: new Date(2026, 9, 29, 2, 30), dayStartHour: 4 },
  { name: 'dimanche soir', now: new Date(2026, 9, 25, 21, 0), dayStartHour: 0 },
]) {
  test(`séries : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    for (const h of ctx.db.habitDefs) {
      const expected = legacy.call(`calcStreak(HABITS.find(h => h.id === ${JSON.stringify(h.id)}))`);
      const actual = D.calcStreak(ctx, h);
      assert.deepEqual(actual, expected, `série de « ${h.id} »`);
    }
  });

  test(`valeur par jour, activité et progression : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    let compared = 0;
    for (const h of ctx.db.habitDefs) {
      const hj = JSON.stringify(h.id);
      for (const day of dayRange('2026-04-25', '2026-11-03')) {
        const k = key(day);
        const t = day.getTime();
        const val = legacy.call(`getHabitDayValue(HABITS.find(h => h.id === ${hj}), '${k}', new Date(${t}))`);
        assert.equal(D.getHabitDayValue(ctx.db, h, k, day), val, `valeur ${h.id} ${k}`);
        const act = legacy.call(`isDayActive(HABITS.find(h => h.id === ${hj}), new Date(${t}))`);
        assert.equal(D.isDayActive(ctx.db, h, day), act, `actif ${h.id} ${k}`);
        compared++;
      }
    }
    assert.ok(compared > 2000);
  });

  test(`agrégats du jour : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    assert.equal(D.requiredToday(ctx), legacy.call('requiredToday()'));
    assert.equal(D.countDoneToday(ctx), legacy.call('countDoneToday()'));
    assert.equal(D.checkPerfectWeek(ctx), legacy.call('checkPerfectWeek()'));
    assert.equal(D.checkGymMonth(ctx), legacy.call('checkGymMonth()'));
    assert.equal(D.today(ctx), legacy.call('today()'));
    assert.equal(D.getWeekMonday(D.appNow(ctx)), legacy.call('getWeekMonday(appNow())'));
  });

  test(`succès (24 conditions) : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    for (const a of D.ACHIEVEMENTS) {
      const expected = !!legacy.call(`ACHIEVEMENTS.find(a => a.id === '${a.id}').check()`);
      assert.equal(a.check(ctx), expected, `succès ${a.id}`);
    }
  });

  test(`défis : évaluation et jours actifs : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    for (const ch of ctx.db.challenges) {
      const habit = ctx.db.habitDefs.find((h) => h.id === ch.habitId);
      const expected = legacy.call(
        `evalChallenge(DB.challenges.find(c => c.id === '${ch.id}'), HABITS.find(h => h.id === '${ch.habitId}'))`,
      );
      assert.deepEqual({ ...D.evalChallenge(ctx, ch, habit) }, expected, `défi ${ch.id}`);
    }
    for (const h of ctx.db.habitDefs) {
      for (const n of [7, 30, 90]) {
        assert.equal(D.chalActiveDays(ctx, h, n), legacy.call(`chalActiveDays(HABITS.find(h => h.id === '${h.id}'), ${n})`));
      }
    }
  });

  test(`« X fois par semaine » et pauses : ${scenario.name}`, () => {
    const { legacy, ctx } = pair(scenario);
    const tt = ctx.db.habitDefs.find((h) => h.id === 'tt');
    for (const monday of ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']) {
      const expected = legacy.call(`timesWeekInfo(HABITS.find(h => h.id === 'tt'), '${monday}')`);
      assert.deepEqual({ ...D.timesWeekInfo(ctx, tt, monday) }, expected, `semaine ${monday}`);
      assert.equal(D.weekPausedCount(ctx.db, monday), legacy.call(`weekPausedCount('${monday}')`));
    }
    assert.equal(D.pausesLeft(ctx.db, '2026-07'), legacy.call(`pausesLeft('2026-07')`));
    assert.equal(D.pausesLeft(ctx.db, '2026-10'), legacy.call(`pausesLeft('2026-10')`));
    const b = legacy.call('pauseBounds()');
    assert.deepEqual(D.pauseBounds(ctx), { min: b.min, max: b.max });
  });
}

test('niveaux, XP et rangs de saison : toutes les bornes', () => {
  const { legacy } = pair();
  for (let xp = 0; xp <= 9500; xp += 7) {
    assert.equal(D.calcLevel(xp), legacy.call(`calcLevel(${xp})`), `niveau ${xp}`);
    assert.deepEqual({ ...D.xpProgress(xp) }, legacy.call(`xpProgress(${xp})`), `progression ${xp}`);
    const r = legacy.call(`seasonRank(${xp})`);
    const t = D.seasonRank(xp);
    assert.deepEqual({ rank: t.rank, roman: t.roman, name: t.name, pct: t.pct, needed: t.needed }, { rank: r.rank, roman: r.roman, name: r.name, pct: r.pct, needed: r.needed }, `rang ${xp}`);
  }
});

test('saisons : identifiant et libellé pour chaque mois de 2 ans', () => {
  const { legacy } = pair();
  for (let m = 0; m < 24; m++) {
    const d = new Date(2025, m, 15);
    const l = legacy.call(`(s => ({ id: s.id, label: s.label }))(seasonOf(new Date(${d.getTime()})))`);
    const s = D.seasonOf(d);
    assert.deepEqual({ id: s.id, label: s.label }, l, `mois ${m}`);
  }
});

// ───────────────────────── Actions ─────────────────────────

function runSteps(setup, steps) {
  const { legacy, ctx: ctx0 } = setup;
  let ctx = ctx0;
  steps.forEach(([label, legacyCall, tsCall, quirks = {}], i) => {
    legacy.resetCaptures();
    legacy.call(legacyCall);
    legacy.flush();
    const res = tsCall(ctx);
    ctx = { db: res.db, clock: ctx.clock };
    assert.deepEqual(view(ctx.db), view(legacy.db), `état après l'étape ${i + 1} : ${label}`);
    const legacySounds = [...legacy.sounds];
    // Écart volontaire : la PWA joue « undo » deux fois en décochant une habitude hebdomadaire.
    if (quirks.legacyDoubleUndo) legacySounds.splice(legacySounds.indexOf('undo'), 1);
    assert.deepEqual(soundsOf(res.events), legacySounds.sort(), `sons après l'étape ${i + 1} : ${label}`);
  });
}

test('actions : coches, annulations, quantités, écarts, journée parfaite', () => {
  const steps = [
    ['décocher gym', `toggleHabit('gym')`, (c) => D.toggleHabit(c, 'gym')],
    ['recocher gym', `toggleHabit('gym')`, (c) => D.toggleHabit(c, 'gym')],
    ['lecture +1 pas', `toggleHabit('read')`, (c) => D.toggleHabit(c, 'read')],
    ['lecture +1 pas', `addCounter('read')`, (c) => D.addCounter(c, 'read')],
    ['lecture -1 pas', `removeCounter('read')`, (c) => D.removeCounter(c, 'read')],
    ['cigarette : écart simple', `toggleHabit('smoke')`, (c) => D.toggleHabit(c, 'smoke')],
    ['cigarette : annule', `toggleHabit('smoke')`, (c) => D.toggleHabit(c, 'smoke')],
    ['cigarette : palier 2', `setBadLevel('smoke', 2)`, (c) => D.setBadLevel(c, 'smoke', 2)],
    ['cigarette : palier 3', `setBadLevel('smoke', 3)`, (c) => D.setBadLevel(c, 'smoke', 3)],
    ['cigarette : « Non »', `setBadLevel('smoke', 0)`, (c) => D.setBadLevel(c, 'smoke', 0)],
    ['sucre : écart', `toggleHabit('sugar')`, (c) => D.toggleHabit(c, 'sugar')],
    ['méditation (X fois)', `toggleHabit('tt')`, (c) => D.toggleHabit(c, 'tt')],
    ['méditation (annule)', `toggleHabit('tt')`, (c) => D.toggleHabit(c, 'tt')],
    ['méditation (recoche)', `toggleHabit('tt')`, (c) => D.toggleHabit(c, 'tt')],
    ['yoga', `toggleHabit('yoga')`, (c) => D.toggleHabit(c, 'yoga')],
    ['nettoyage hebdo : annule', `toggleHabit('cleaning')`, (c) => D.toggleHabit(c, 'cleaning'), { legacyDoubleUndo: true }],
    ['nettoyage hebdo : recoche', `toggleHabit('cleaning')`, (c) => D.toggleHabit(c, 'cleaning')],
    ['eau -250', `removeDrink()`, (c) => D.removeDrink(c)],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['marche +', `addCounter('newone')`, (c) => D.addCounter(c, 'newone')],
    ['pas +1000', `toggleHabit('setp')`, (c) => D.toggleHabit(c, 'setp')],
    ['running +1', `toggleHabit('running')`, (c) => D.toggleHabit(c, 'running')],
    ['eau +250', `toggleHabit('drink')`, (c) => D.toggleHabit(c, 'drink')],
    ['eau +250', `addDrinkAmount(250)`, (c) => D.addDrinkAmount(c, 250)],
    ['eau +250', `addDrinkAmount(250)`, (c) => D.addDrinkAmount(c, 250)],
    ['eau +1000 (plafond)', `addDrinkAmount(1000)`, (c) => D.addDrinkAmount(c, 1000)],
    ['eau +5000 (plafond)', `addDrinkAmount(5000)`, (c) => D.addDrinkAmount(c, 5000)],
  ];
  runSteps(pair(), steps);
});

test('actions : mêmes séquences avec début de journée à 4 h (2 h 30)', () => {
  const now = new Date(2026, 9, 29, 2, 30);
  const steps = [
    ['gym', `toggleHabit('gym')`, (c) => D.toggleHabit(c, 'gym')],
    ['gym', `toggleHabit('gym')`, (c) => D.toggleHabit(c, 'gym')],
    ['running', `toggleHabit('running')`, (c) => D.toggleHabit(c, 'running')],
    ['eau', `addDrinkAmount(500)`, (c) => D.addDrinkAmount(c, 500)],
    ['cigarette', `toggleHabit('smoke')`, (c) => D.toggleHabit(c, 'smoke')],
  ];
  runSteps(pair({ now, dayStartHour: 4 }), steps);
});

test('actions : montée de niveau (juste sous un seuil)', () => {
  const db = buildDb();
  db.xp = 495; // +10 pour « gym » franchit le niveau 4
  db.habits.gym.logs[TODAY] = undefined;
  delete db.habits.gym.logs[TODAY];
  runSteps(pair({ db }), [['gym', `toggleHabit('gym')`, (c) => D.toggleHabit(c, 'gym')]]);
});

test('actions : mise à jour des défis (aujourd’hui, puis plus tard)', () => {
  for (const now of [NOW, new Date(2026, 10, 2, 9, 0), new Date(2026, 11, 20, 9, 0)]) {
    const setup = pair({ now });
    runSteps(setup, [['défis', 'updateChallenges()', (c) => D.updateChallenges(c)]]);
  }
});

test('actions : défi dont l’habitude est archivée est abandonné', () => {
  const db = buildDb();
  db.challenges.push({ id: 'c_arch', habitId: 'old', title: 'x', emoji: '🎯', color: '#8EA2FF', days: 10, required: 'all', start: '2026-10-25', status: 'active', reward: 40 });
  runSteps(pair({ db }), [['défis', 'updateChallenges()', (c) => D.updateChallenges(c)]]);
});
