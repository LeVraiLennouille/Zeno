'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';

/** Le legacy démarre exactement sur la base déjà normalisée : les deux partent de l'identique. */
function pairNorm(raw = buildDb()) {
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  const legacy = createLegacy({ now: NOW, db: JSON.parse(JSON.stringify(r.db)) });
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(NOW) } };
}
const J = (x) => JSON.parse(JSON.stringify(x));
const sub = (db) => J({ habitDefs: db.habitDefs, reminders: db.reminders, challenges: db.challenges, habits: db.habits });

test('archivage puis restauration (avec annulation des rappels et défis)', () => {
  const { legacy, ctx } = pairNorm();
  legacy.call(`archiveHabit('gym')`);
  const a = D.archiveHabit(ctx, 'gym');
  assert.ok(a);
  assert.deepEqual(sub(a.db), sub(legacy.db));
  assert.deepEqual(J(a.undo), { habitId: 'gym', reEnable: ['r_gym'], reactivate: ['c_gym'] });
  assert.equal(D.archiveHabit({ db: a.db, clock: ctx.clock }, 'gym'), null, 'déjà archivée');

  legacy.call(`restoreHabit('gym', { reEnable: ['r_gym'], reactivate: ['c_gym'], silent: true })`);
  const restored = D.restoreHabit({ db: a.db, clock: ctx.clock }, 'gym', a.undo);
  assert.deepEqual(sub(restored), sub(legacy.db));
});

test('restauration d’une habitude archivée depuis plusieurs jours (période fermée à la veille)', () => {
  const raw = buildDb();
  const old = raw.habitDefs.find((h) => h.id === 'old'); // archivée le 15/08, période ouverte
  assert.ok(old.archived);
  const { legacy, ctx } = pairNorm(raw);
  legacy.call(`restoreHabit('old', { silent: true })`);
  const restored = D.restoreHabit(ctx, 'old');
  assert.deepEqual(sub(restored), sub(legacy.db));
  const h = restored.habitDefs.find((x) => x.id === 'old');
  assert.deepEqual(J(h.gaps), [{ from: '2026-08-15', to: '2026-10-27' }]);
  assert.equal(h.archived, undefined);
});

test('suppression définitive puis annulation', () => {
  const { legacy, ctx } = pairNorm();
  legacy.call(`purgeHabit('gym')`);
  const p = D.purgeHabit(ctx, 'gym');
  assert.ok(p);
  assert.deepEqual(sub(p.db), sub(legacy.db));
  assert.equal(p.db.habits.gym, undefined);
  legacy.runUndo();
  assert.deepEqual(sub(D.undoPurge(p.db, p.undo)), sub(legacy.db));
  assert.equal(D.undoPurge(ctx.db, p.undo), ctx.db, 'rien à faire si l’habitude existe déjà');
});

test('ordre : déplacer, refuser les listes invalides, archivées immobiles', () => {
  const { legacy, ctx } = pairNorm();
  for (const [id, delta] of [['gym', -1], ['gym', -1], ['projets', 1], ['sleep', -1]]) {
    legacy.call(`moveHabit('${id}', ${delta})`);
  }
  let db = ctx.db;
  for (const [id, delta] of [['gym', -1], ['gym', -1], ['projets', 1], ['sleep', -1]]) {
    db = D.moveHabit(db, id, delta) ?? db;
  }
  assert.deepEqual(db.habitDefs.map((h) => h.id), legacy.db.habitDefs.map((h) => h.id));
  assert.equal(db.habitDefs.find((h) => h.id === 'old').archived, true);
  const ids = db.habitDefs.filter((h) => !h.archived).map((h) => h.id);
  assert.equal(D.applyHabitOrder(db, ids.slice(1)), null, 'longueur différente');
  assert.equal(D.applyHabitOrder(db, [...ids.slice(1), 'old']), null, 'archivée refusée');
  assert.equal(D.moveHabit(db, ids[0], -1), null, 'déjà en tête');
});

test('coche d’un jour passé depuis la vue Semaine', () => {
  const { legacy, ctx } = pairNorm();
  let db = ctx.db;
  const steps = [
    ['gym', '2026-10-26'], ['gym', '2026-10-26'], ['smoke', '2026-10-25'], ['smoke', '2026-10-25'],
    ['running', '2026-10-27'], ['running', '2026-10-27'], ['drink', '2026-10-26'], ['drink', '2026-10-26'],
    ['cleaning', '2026-10-25'], ['tt', '2026-10-24'],
  ];
  for (const [id, date] of steps) {
    legacy.call(`toggleHabitOnDate('${id}', '${date}', null)`);
    db = D.toggleHabitOnDate({ db, clock: ctx.clock }, id, date);
    assert.deepEqual(sub(db).habits, sub(legacy.db).habits, `${id} ${date}`);
  }
  assert.equal(db.xp, ctx.db.xp, 'aucune XP pour un jour passé');
});

// ─────────────── Formulaire : parité avec saveHabitForm ───────────────

const MESSAGES = {
  name_required: 'Donne un nom à ton habitude',
  name_taken: 'Une habitude (peut-être archivée) porte déjà ce nom',
  no_day: 'Choisis au moins un jour',
  bad_numbers: 'Objectif, ajout et maximum doivent être positifs',
  max_below_goal: 'Le maximum doit être au moins égal à l’objectif',
  step_above_max: 'L’ajout par tap dépasse le maximum',
  no_level: 'Ajoute au moins un palier (ex. 15 min, 1 h)',
};
const base = (db, over = {}) => ({ ...D.emptyHabitForm(db), ...over });

const FORM_CASES = [
  ['case à cocher, tous les jours', (db) => base(db, { name: 'Méditer', kind: 'good' })],
  ['case à cocher, lun-ven', (db) => base(db, { name: 'Bureau', days: [1, 2, 3, 4, 5], optional: true })],
  ['case à cocher, week-end', (db) => base(db, { name: 'Brunch', days: [6, 0] })],
  ['case à cocher, jours épars', (db) => base(db, { name: 'Piano', days: [1, 3, 6] })],
  ['compteur (virgule décimale)', (db) => base(db, { name: 'Natation', kind: 'counter', goal: '1,5', step: '0,5', max: '4', unit: ' kilomètres-parcourus ' })],
  ['eau (type compteur en ml)', (db) => base(db, { name: 'Tisane', kind: 'water', goal: '1000', step: '200', max: '2000', unit: 'zzz' })],
  ['hebdomadaire', (db) => base(db, { name: 'Courses', kind: 'weekly', days: [] })],
  ['x fois par semaine (cible bornée)', (db) => base(db, { name: 'Sport', kind: 'times', target: 99, days: [] })],
  ['à éviter simple', (db) => base(db, { name: 'Ongles', kind: 'bad' })],
  ['à éviter avec paliers (doublons ignorés)', (db) => base(db, { name: 'Écrans', kind: 'bad', badMode: 'levels', levels: '15 min, 30 MIN,15 min, 1 h ,, +2 h' })],
  ['nom vide', (db) => base(db, { name: '   ' })],
  ['nom déjà pris (casse ignorée)', (db) => base(db, { name: 'gYm' })],
  ['nom d’une habitude archivée', (db) => base(db, { name: 'ancienne' })],
  ['aucun jour', (db) => base(db, { name: 'X', days: [] })],
  ['objectifs non positifs', (db) => base(db, { name: 'Y', kind: 'counter', goal: '0', step: '1', max: '5' })],
  ['objectif non numérique', (db) => base(db, { name: 'Y', kind: 'counter', goal: 'abc', step: '1', max: '5' })],
  ['maximum sous l’objectif', (db) => base(db, { name: 'Y', kind: 'counter', goal: '10', step: '1', max: '5' })],
  ['pas au-dessus du maximum', (db) => base(db, { name: 'Y', kind: 'counter', goal: '3', step: '9', max: '5' })],
  ['paliers vides', (db) => base(db, { name: 'Y', kind: 'bad', badMode: 'levels', levels: ' , ,' })],
  ['édition : habitude livrée (emoji figé), nouveaux jours', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'gym')), name: 'Salle', emoji: '🔥', color: '#112233', daysTouched: true, days: [1, 3] })],
  ['édition : jours inchangés', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'projets')), name: 'Side projects', optional: true })],
  ['édition : tous les jours (efface activeDays)', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'yoga')), daysTouched: true, days: [0, 1, 2, 3, 4, 5, 6] })],
  ['édition : compteur personnalisé', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'newone')), goal: '4000', step: '250', max: '8000', unit: 'mètres', emoji: '🥾' })],
  ['édition : eau', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'drink')), goal: '2500', step: '500', max: '4000' })],
  ['édition : à éviter → paliers', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'sugar')), badMode: 'levels', levels: '1 carré, 2 carrés' })],
  ['édition : à éviter → simple', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'smoke')), badMode: 'simple' })],
  ['édition : x fois par semaine', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'tt')), target: 5 })],
  ['édition : hebdomadaire', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'cleaning')), name: 'Ménage', color: '#abcdef' })],
  ['édition : habitude disparue', (db) => ({ ...D.habitToForm(db.habitDefs.find((h) => h.id === 'gym')), id: 'fantome' })],
];

for (const [label, make] of FORM_CASES) {
  test(`formulaire d’habitude : ${label}`, () => {
    const { legacy, ctx } = pairNorm();
    const form = make(ctx.db);
    legacy.resetCaptures();
    legacy.call(`hf = ${JSON.stringify({ ...form, type: form.kind })}; saveHabitForm();`);
    const before = ctx.db;
    const res = D.saveHabit(ctx, form, () => 'NEWID');
    if (!res.ok) {
      assert.deepEqual(legacy.toasts, [MESSAGES[res.error]], 'même message d’erreur');
      assert.deepEqual(sub(legacy.db), sub(before), 'le legacy n’a rien modifié non plus');
      return;
    }
    assert.ok(!Object.values(MESSAGES).includes(legacy.toasts[0]), `le legacy a refusé : ${legacy.toasts[0]}`);
    const idOf = (db) => (res.value.created ? db.habitDefs.at(-1).id : res.value.habitId);
    const ours = sub(res.value.db);
    const theirs = sub(legacy.db);
    // Seuls les identifiants aléatoires du legacy diffèrent.
    const legacyId = idOf(legacy.db);
    const swap = (o) => JSON.parse(JSON.stringify(o).split(legacyId).join('NEWID'));
    assert.deepEqual(ours, res.value.created ? swap(theirs) : theirs);
    if (res.value.created) assert.equal(res.value.habitId, 'NEWID');
  });
}

test('formulaire : création = nouvelle habitude vide dans l’historique, base d’origine intacte', () => {
  const { ctx } = pairNorm();
  const snapshot = JSON.stringify(ctx.db);
  const res = D.saveHabit(ctx, { ...D.emptyHabitForm(ctx.db), name: 'Neuf' }, () => 'n1');
  assert.ok(res.ok && res.value.created);
  assert.deepEqual(J(res.value.db.habits.n1), { logs: {} });
  assert.equal(res.value.db.habitDefs.at(-1).since, TODAY);
  assert.equal(JSON.stringify(ctx.db), snapshot);
});

test('formulaire : la couleur proposée est la première encre libre', () => {
  const { ctx } = pairNorm();
  const used = ctx.db.habitDefs.map((h) => h.color);
  const f = D.emptyHabitForm(ctx.db);
  assert.ok(D.HABIT_COLORS.includes(f.color));
  assert.ok(!used.includes(f.color) || D.HABIT_COLORS.every((c) => used.includes(c)));
});

test('étiquettes de jours et paliers', () => {
  const { legacy } = pairNorm();
  for (const days of [[0, 1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5], [6, 0], [0, 6], [1, 3, 5], [2], [4, 4, 1], []]) {
    assert.equal(D.daysLabel(days), legacy.call(`daysLabel(${JSON.stringify(days)})`), JSON.stringify(days));
  }
  for (const t of ['', '15 min, 1 h', 'A, a, B,  , c'.repeat(2), 'x'.repeat(30) + ', y']) {
    assert.deepEqual(D.parseLevels(t), legacy.call(`parseLevels(${JSON.stringify(t)})`));
  }
});
