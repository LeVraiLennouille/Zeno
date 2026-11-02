'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const SCENARIOS = [
  ['mercredi 14 h', new Date(2026, 9, 28, 14), 0],
  ['2 h 30 avec début de journée à 4 h', new Date(2026, 9, 29, 2, 30), 4],
  ['dimanche soir', new Date(2026, 9, 25, 21), 0],
  ['jour de pause', new Date(2026, 9, 20, 10), 0],
];

function pair(now, hour) {
  const raw = buildDb();
  raw.profile.dayStartHour = hour;
  const r = D.normalizeImported(raw, '2026-10-28');
  assert.ok(r.ok);
  const legacy = createLegacy({ now, db: JSON.parse(JSON.stringify(r.db)), dayStartHour: hour });
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(now) } };
}
const strip = (html) => String(html).replace(/<[^>]*>/g, '');

for (const [name, now, hour] of SCENARIOS) {
  test(`accueil · libellés et contrôles identiques au legacy : ${name}`, () => {
    const { legacy, ctx } = pair(now, hour);
    const key = D.today(ctx);
    const day = D.midnight(ctx);
    const model = D.todayModel(ctx);
    let checked = 0;
    for (const card of model.cards) {
      const h = card.habit;
      const hj = JSON.stringify(h.id);
      const html = (fn) => legacy.call(`${fn}(HABITS.find(h => h.id === ${hj}), '${key}', new Date(${day.getTime()}))`);
      // Sous-titre : on ignore le cas « accompli ! » que le legacy fabrique dans renderTodayTab.
      if (!(card.flourish && card.sub.length === 1 && card.sub[0].text === 'accompli !')) {
        assert.equal(D.plainSub(card.sub), strip(html('buildTodaySubLabel')), `sous-titre ${h.id}`);
      }
      const ctl = html('buildTodayControl');
      const c = card.control;
      if (c.kind === 'stepper') {
        assert.ok(strip(ctl).includes(c.hint), `${h.id} : ${c.hint}`);
        assert.equal(/step-btn-minus[^>]*disabled/.test(ctl), !c.canRemove, `${h.id} : bouton moins`);
        const adds = [...ctl.matchAll(/class="step-btn" onclick="(?:addDrinkAmount|addCounter)[^"]*">\+([^<]*)</g)].map((m) => m[1]);
        const expected = c.addAmounts.map((a) => `${D.fmtNum(a)} ${c.unit}`);
        assert.deepEqual(adds, expected, `${h.id} : boutons +`);
        assert.ok(ctl.includes(`aria-valuenow="${c.pct}"`), `${h.id} : barre à ${c.pct} %`);
      } else if (c.kind === 'badLevels') {
        const chips = [...ctl.matchAll(/<button[^>]*class="bad-chip[^"]*?( sel)?"[^>]*>([^<]*)</g)];
        assert.deepEqual(chips.map((m) => m[2]), c.options, `${h.id} : paliers`);
        assert.equal(chips.findIndex((m) => m[1]), c.selected, `${h.id} : palier choisi`);
      } else {
        assert.equal(/habit-toggle-btn done/.test(ctl), c.done, `${h.id} : coche`);
        assert.equal(/ done fail/.test(ctl), c.fail && c.done, `${h.id} : échec`);
      }
      checked++;
    }
    assert.ok(checked > 5 || model.empty === 'paused', 'des cartes ont été comparées');
  });

  test(`accueil · bandeau, vide et pause : ${name}`, () => {
    const { legacy, ctx } = pair(now, hour);
    const hero = D.heroModel(ctx);
    assert.equal(hero.done, legacy.call('countDoneToday()'));
    assert.equal(hero.required, legacy.call('requiredToday()'));
    assert.equal(hero.paused, !!legacy.call('isPaused(today())'));
    assert.equal(hero.level, legacy.call('calcLevel(DB.xp)'));
    assert.equal(hero.segments.length, hero.required);
    const day = D.midnight(ctx);
    const expectedCards = ctx.db.habitDefs.filter((h) => !h.archived && D.isDayActive(ctx.db, h, day)).length;
    assert.equal(D.todayModel(ctx).cards.length, expectedCards);
  });
}

test('accueil · jour de pause : aucune carte, message « pause »', () => {
  const { ctx } = pair(new Date(2026, 9, 20, 10), 0);
  assert.deepEqual(D.todayModel(ctx).cards.length, 0);
  assert.equal(D.todayModel(ctx).empty, 'paused');
  assert.equal(D.heroModel(ctx).paused, true);
});

test('accueil · aucune habitude : message « vide »', () => {
  const db = D.createInitialDb('2026-10-28');
  const ctx = { db: { ...db, habitDefs: [], habits: {} }, clock: D.fixedClock(new Date(2026, 9, 28, 12)) };
  assert.equal(D.todayModel(ctx).empty, 'empty');
  assert.equal(D.heroModel(ctx).required, 0);
});

test('accueil · mode zen : les cartes terminées se replient', () => {
  const { ctx } = pair(new Date(2026, 9, 28, 14), 0);
  const zen = { db: { ...ctx.db, profile: { ...ctx.db.profile, zenMode: true } }, clock: ctx.clock };
  const cards = D.todayModel(zen).cards;
  assert.ok(cards.some((c) => c.collapsed) && cards.some((c) => !c.collapsed));
  assert.ok(D.todayModel(ctx).cards.every((c) => !c.collapsed));
});

test('semaine · 7 cases par habitude, lundi → dimanche, aujourd’hui repéré', () => {
  const { ctx } = pair(new Date(2026, 9, 28, 14), 0); // mercredi
  const rows = D.weekModel(ctx);
  assert.equal(rows.length, ctx.db.habitDefs.filter((h) => !h.archived).length);
  for (const r of rows) {
    assert.equal(r.cells.length, 7);
    assert.deepEqual(r.cells.map((c) => c.label), ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
    assert.equal(r.cells[0].date, '2026-10-26');
    assert.equal(r.cells[6].date, '2026-11-01');
    assert.equal(r.cells.findIndex((c) => c.isToday), 2);
    assert.ok(r.cells.filter((c) => c.date > '2026-10-28').every((c) => !c.tappable), 'le futur n’est pas cochable');
  }
  const tt = rows.find((r) => r.habit.id === 'tt');
  assert.match(tt.freqText, /^3 fois par semaine · \d\/\d cette semaine$/);
  const paused = rows.find((r) => r.habit.id === 'gym').cells.find((c) => c.date === '2026-10-26');
  assert.equal(paused.paused, false);
});

test('semaine · cohérente avec la valeur du jour du domaine', () => {
  const { ctx } = pair(new Date(2026, 9, 28, 14), 0);
  for (const r of D.weekModel(ctx)) {
    for (const c of r.cells) {
      const d = D.parseDate(c.date);
      assert.equal(c.active, D.isDayActive(ctx.db, r.habit, d));
      assert.equal(c.done, c.active && D.getHabitDayValue(ctx.db, r.habit, c.date, d) === 1);
    }
  }
});

test('global · grille 7 × 16, états cohérents', () => {
  const { ctx } = pair(new Date(2026, 9, 28, 14), 0);
  for (const r of D.overallModel(ctx)) {
    assert.equal(r.grid.length, 7);
    assert.ok(r.grid.every((line) => line.length === 16));
    assert.equal(r.grid[0][15].date, '2026-10-26');
    const smoke = r.habit.id === 'smoke';
    const states = new Set(r.grid.flat().map((c) => c.state));
    if (smoke) assert.ok(states.has('failed') && states.has('done'));
    if (r.habit.type === 'times') assert.ok(!states.has('missed'));
    for (const c of r.grid.flat()) {
      if (c.state === 'failed') assert.match(c.title, /craqué/);
      if (c.paused && c.state === 'inactive') assert.match(c.title, /pause/);
    }
  }
});

test('mes habitudes · libellés par type', () => {
  const { ctx } = pair(new Date(2026, 9, 28, 14), 0);
  const rows = Object.fromEntries(D.myHabitsModel(ctx).map((r) => [r.habit.id, r]));
  assert.equal(rows.drink.meta, `${D.fmtNum(1750)} / ${D.fmtNum(2000)} ml`);
  assert.equal(rows.drink.progressPct, 88);
  assert.equal(rows.drink.canToggle, false);
  assert.equal(rows.smoke.canToggle, false, 'paliers : pas de simple bascule');
  assert.equal(rows.sugar.canToggle, true);
  assert.match(rows.tt.meta, /cette semaine$/);
  assert.equal(rows.gym.progressPct, null);
  assert.equal(rows.gym.meta, 'Lundi - Vendredi');
  assert.ok(!('old' in rows), 'les archivées n’apparaissent pas');
  const archived = D.archivedModel(ctx);
  assert.deepEqual(archived.map((a) => a.habit.id), ['old']);
  assert.equal(archived[0].archivedOn, '2026-08-15');
  assert.equal(D.fmtDay('2026-08-15'), '15 août');
});
