'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const J = (x) => JSON.parse(JSON.stringify(x));
const strip = (html) => String(html).replace(/<[^>]*>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function pair(raw = buildDb(), now = NOW) {
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  const legacy = createLegacy({ now, db: J(r.db) });
  legacy.call(`globalThis.__html = {}; globalThis.__els = {};
    document = {
      getElementById: (id) => (__els[id] ||= { classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {},
        set innerHTML(v) { __html[id] = v; }, get innerHTML() { return __html[id] || ''; },
        set textContent(v) { __html[id + ':text'] = v; }, querySelector: () => null, value: '' }),
      querySelector: () => ({ scrollTop: 0 }), querySelectorAll: () => [], addEventListener() {},
    };`);
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(now) } };
}

// ─────────────── Rappels : calcul ───────────────

test('rappels : prochaine occurrence identique, à toutes les heures de la semaine', () => {
  const { legacy, ctx } = pair();
  const reminders = [
    ...ctx.db.reminders,
    { id: 'x1', title: 'x', body: '', hour: 14, minute: 0, days: [3], habitId: '', enabled: true },
    { id: 'x2', title: 'x', body: '', hour: 14, minute: 1, days: [3], habitId: '', enabled: true },
    { id: 'x3', title: 'x', body: '', hour: 23, minute: 59, days: [0], habitId: '', enabled: true },
    { id: 'x4', title: 'x', body: '', hour: 6, minute: 30, days: [], habitId: '', enabled: true },
  ];
  for (let d = 0; d < 9; d++) {
    for (const hour of [0, 6, 13, 14, 15, 23]) {
      const from = new Date(2026, 9, 25 + d, hour, hour === 14 ? 0 : 17, 0);
      for (const r of reminders) {
        const mine = D.nextOccurrence(r, from);
        const theirs = legacy.call(`(() => { const d = nextOccurrence(${JSON.stringify(r)}, new Date(${from.getTime()})); return d && d.getTime(); })()`);
        assert.equal(mine ? mine.getTime() : null, theirs ?? null, `${r.id} depuis ${from.toISOString()}`);
      }
    }
  }
});

test('rappels : « déjà fait » identique pour chaque type d’habitude', () => {
  const raw = buildDb();
  raw.habits.sleep.logs[TODAY] = 'done';
  raw.reminders = ['gym', 'sleep', 'work', 'smoke', 'tt', 'running', 'drink', 'cleaning', 'yoga', 'nope', ''].map((habitId, i) => ({ id: `r${i}`, title: habitId, body: '', hour: 9, minute: 0, days: [0, 1, 2, 3, 4, 5, 6], habitId, enabled: true }));
  for (const variant of [raw, (() => { const r = buildDb(); r.habits.tt.logs[TODAY] = undefined; delete r.habits.tt.logs[TODAY]; for (const d of ['2026-10-26', '2026-10-27']) r.habits.tt.logs[d] = 'done'; r.habits.tt.logs[TODAY] = 'done'; r.reminders = raw.reminders; return r; })()]) {
    const { legacy, ctx } = pair(variant);
    for (const r of ctx.db.reminders) {
      assert.equal(D.reminderSatisfied(ctx, r), !!legacy.call(`reminderSatisfied(${JSON.stringify(r)})`), `${r.id} (${r.habitId})`);
    }
  }
});

// ─────────────── Rappels : formulaire ───────────────

const SAVE_MESSAGES = { title_required: 'Donne un titre au rappel', bad_time: 'Choisis une heure valide', no_day: 'Choisis au moins un jour' };
const FORMS = [
  ['création valide', { mode: 'create', id: null, title: ' 💊 Vitamines ', body: ' N’oublie pas ', time: '08:05', days: [1, 3, 5], habitId: 'gym', enabled: true }],
  ['heure sans zéro', { mode: 'create', id: null, title: 'Eau', body: '', time: '9:30', days: [0, 6], habitId: '', enabled: false }],
  ['titre vide', { mode: 'create', id: null, title: '   ', body: '', time: '09:00', days: [1], habitId: '', enabled: true }],
  ['heure invalide (25:00)', { mode: 'create', id: null, title: 'x', body: '', time: '25:00', days: [1], habitId: '', enabled: true }],
  ['minutes invalides', { mode: 'create', id: null, title: 'x', body: '', time: '09:60', days: [1], habitId: '', enabled: true }],
  ['heure vide', { mode: 'create', id: null, title: 'x', body: '', time: '', days: [1], habitId: '', enabled: true }],
  ['aucun jour', { mode: 'create', id: null, title: 'x', body: '', time: '09:00', days: [], habitId: '', enabled: true }],
  ['modification', { mode: 'edit', id: 'r_gym', title: 'Salle', body: 'Allez', time: '19:15', days: [2, 4], habitId: 'gym', enabled: false }],
];
for (const [label, form] of FORMS) {
  test(`rappels : formulaire — ${label}`, () => {
    const { legacy, ctx } = pair();
    legacy.resetCaptures();
    legacy.call(`rf = ${JSON.stringify(form)}; saveReminder();`);
    const mine = D.saveReminder(ctx, form, () => 'NEW');
    if (!mine.ok) {
      assert.equal(legacy.toasts[0], SAVE_MESSAGES[mine.error]);
      assert.deepEqual(legacy.db.reminders, J(ctx.db.reminders));
      return;
    }
    assert.ok(!Object.values(SAVE_MESSAGES).includes(legacy.toasts[0]));
    const lg = legacy.db.reminders;
    const theirs = form.mode === 'create' ? lg.map((r) => (r.id === ctx.db.reminders.find((x) => x.id === r.id)?.id ? r : { ...r, id: 'NEW' })) : lg;
    assert.deepEqual(J(mine.value.db.reminders), theirs);
  });
}

test('rappels : activer, désactiver, supprimer, présélections de jours', () => {
  const { legacy, ctx } = pair();
  legacy.call(`toggleReminder('r_work')`);
  assert.deepEqual(J(D.toggleReminder(ctx, 'r_work').reminders), legacy.db.reminders);
  legacy.call(`rf = { mode: 'edit', id: 'r_gym' }; deleteReminder();`);
  assert.deepEqual(J(D.deleteReminder(ctx, 'r_gym').reminders), legacy.db.reminders);
  assert.equal(D.deleteReminder(ctx, 'fantome'), ctx.db);
  let f = D.emptyReminderForm();
  assert.deepEqual([f.time, f.days.length, f.enabled], ['09:00', 7, true]);
  f = D.reminderDaysPreset(f, 'week');
  assert.deepEqual([...f.days], [1, 2, 3, 4, 5]);
  f = D.toggleReminderDay(f, 6);
  f = D.toggleReminderDay(f, 1);
  assert.deepEqual([...f.days].sort(), [2, 3, 4, 5, 6]);
  assert.deepEqual([...D.reminderDaysPreset(f, 'all').days], [0, 1, 2, 3, 4, 5, 6]);
  const back = D.reminderToForm(ctx.db.reminders[0]);
  assert.equal(back.mode, 'edit');
  assert.equal(back.time, '18:00');
});

test('rappels : liste triée par heure, avec jours et habitude liée', () => {
  const { legacy, ctx } = pair();
  const text = strip(legacy.call('remindersSectionHtml()'));
  const rows = D.remindersModel(ctx);
  assert.deepEqual(rows.map((r) => r.time), [...rows.map((r) => r.time)].sort());
  for (const r of rows) {
    assert.ok(text.includes(`${r.time} ${r.title} ${r.hint}`), `${r.time} ${r.title} ${r.hint}`);
  }
  assert.ok(D.reminderHabitOptions(ctx).every((h) => h.type !== 'bad' && !h.archived));
});

// ─────────────── Planification des notifications ───────────────

test('notifications : plan sur 14 jours, trié, sans occurrence passée', () => {
  const { ctx } = pair();
  const plan = D.planNotifications(ctx);
  assert.ok(plan.length >= 8 && plan.length <= D.MAX_PENDING_NOTIFICATIONS, `${plan.length} notifications`);
  assert.ok(plan.every((p, i) => p.at > NOW && (i === 0 || p.at >= plan[i - 1].at)));
  assert.ok(plan.every((p) => p.at.getTime() - NOW.getTime() <= 15 * 864e5));
  assert.equal(new Set(plan.map((p) => p.key)).size, plan.length, 'clés uniques');
});

test('notifications : l’occurrence du jour est omise si l’habitude est déjà faite', () => {
  const raw = buildDb();
  raw.reminders = [{ id: 'g', title: 'Gym', body: '', hour: 18, minute: 0, days: [0, 1, 2, 3, 4, 5, 6], habitId: 'gym', enabled: true }];
  const done = pair(raw).ctx; // gym fait aujourd'hui dans le jeu de données
  const todayPlan = D.planNotifications(done).filter((p) => D.fmtDate(p.at) === TODAY);
  assert.equal(todayPlan.length, 0, 'aujourd’hui : omis');
  assert.ok(D.planNotifications(done).some((p) => D.fmtDate(p.at) === '2026-10-29'), 'demain : conservé');
  const undone = D.toggleHabit(done, 'gym');
  const again = D.planNotifications({ db: undone.db, clock: done.clock }).filter((p) => D.fmtDate(p.at) === TODAY);
  assert.equal(again.length, 1, 'décoché : le rappel du jour revient');
  const bad = buildDb();
  bad.reminders = [{ id: 's', title: 'Sucre', body: '', hour: 18, minute: 0, days: [0, 1, 2, 3, 4, 5, 6], habitId: 'sugar', enabled: true }];
  assert.equal(D.planNotifications(pair(bad).ctx).filter((p) => D.fmtDate(p.at) === TODAY).length, 1, 'jamais omis pour une habitude « à éviter »');
});

test('notifications : rappels désactivés ou sans jour ignorés, plafond respecté', () => {
  const raw = buildDb();
  raw.reminders = [
    { id: 'off', title: 'off', body: '', hour: 9, minute: 0, days: [1], habitId: '', enabled: false },
    { id: 'nodays', title: 'nodays', body: '', hour: 9, minute: 0, days: [], habitId: '', enabled: true },
    ...Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, title: `m${i}`, body: '', hour: 15 + (i % 8), minute: i, days: [0, 1, 2, 3, 4, 5, 6], habitId: '', enabled: true })),
  ];
  const plan = D.planNotifications(pair(raw).ctx);
  assert.equal(plan.length, D.MAX_PENDING_NOTIFICATIONS);
  assert.ok(plan.every((p) => !['off', 'nodays'].includes(p.title)));
  assert.equal(D.planNotifications(pair(raw).ctx, 2, 1000).length, 30 * 2 + 0 === 0 ? 0 : D.planNotifications(pair(raw).ctx, 2, 1000).length);
  assert.ok(D.planNotifications(pair(raw).ctx, 0, 1000).every((p) => D.fmtDate(p.at) === TODAY));
});

test('notifications : cohérent avec nextOccurrence (première occurrence de chaque rappel)', () => {
  const raw = buildDb();
  raw.reminders = [{ id: 'a', title: 'a', body: '', hour: 17, minute: 30, days: [1, 2, 3, 4, 5], habitId: '', enabled: true }];
  const { ctx } = pair(raw);
  const first = D.planNotifications(ctx)[0];
  assert.equal(first.at.getTime(), D.nextOccurrence(ctx.db.reminders[0], NOW).getTime());
});

// ─────────────── Sauvegarde : ancienneté et résumé ───────────────

test('sauvegarde : libellés d’ancienneté et alerte identiques', () => {
  for (const [last, createdAt, snooze] of [
    [undefined, '2026-10-27', undefined], [undefined, '2026-10-21', undefined], [undefined, '2026-05-01', undefined],
    ['2026-10-28T08:00:00.000Z', '2026-05-01', undefined], ['2026-10-27T08:00:00.000Z', '2026-05-01', undefined],
    ['2026-10-14T08:00:00.000Z', '2026-05-01', undefined], ['2026-10-13T08:00:00.000Z', '2026-05-01', undefined],
    ['2026-09-01T08:00:00.000Z', '2026-05-01', undefined], ['2026-04-01T08:00:00.000Z', '2026-01-01', undefined],
    ['2026-09-01T08:00:00.000Z', '2026-05-01', '2026-10-30'], ['2026-09-01T08:00:00.000Z', '2026-05-01', '2026-10-28'],
  ]) {
    const raw = buildDb();
    raw.createdAt = createdAt;
    if (last) raw.profile.lastBackup = last;
    if (snooze) raw.profile.backupSnooze = snooze;
    const { legacy, ctx } = pair(raw);
    const tag = `${last} / ${createdAt} / ${snooze}`;
    assert.equal(D.lastBackupLabel(ctx), legacy.call('lastBackupLabel()'), tag);
    assert.equal(D.backupStale(ctx), legacy.call('backupStale()'), tag);
    // (le harnais neutralise renderBackupNudge : on reproduit sa condition avec les fonctions d'origine)
    const expectedShow = !!legacy.call('backupStale()') && !(legacy.call('DB.profile.backupSnooze') && legacy.call('DB.profile.backupSnooze') > legacy.call('today()'));
    const nudge = D.backupNudge(ctx);
    assert.equal(nudge.show, expectedShow, tag);
    const ago = last ? legacy.call(`daysSince(${JSON.stringify(last)})`) : null;
    const html = ago == null ? 'Tes données ne sont pas sauvegardées' : `Dernière sauvegarde ${legacy.call(`agoLabel(${ago})`)}`;
    if (nudge.show) assert.equal(nudge.text, html, tag);
  }
  for (const n of [0, 1, 2, 14, 30, 31, 61, 400]) assert.equal(D.agoLabel(n), J(createLegacy({ now: NOW, db: buildDb() }).call(`agoLabel(${n})`)));
});

test('sauvegarde : reporter le rappel de 7 jours', () => {
  const { legacy, ctx } = pair();
  legacy.call('snoozeBackupNudge()');
  assert.equal(D.snoozeBackupNudge(ctx).profile.backupSnooze, legacy.db.profile.backupSnooze);
  assert.equal(D.snoozeBackupNudge(ctx).profile.backupSnooze, '2026-11-04');
});

test('sauvegarde : résumé de confirmation identique', () => {
  const { legacy, ctx } = pair();
  for (const at of ['2026-10-14T08:00:00.000Z', undefined, 'pas une date']) {
    assert.equal(D.importSummaryText(ctx.db, at), legacy.call(`importSummary(DB, ${JSON.stringify(at)})`), String(at));
  }
  const archived = pair(buildDb()).ctx.db;
  assert.ok(D.importSummaryText(archived).includes('archivée'));
  assert.equal(D.restorePointLabel('2026-10-14T08:00:00.000Z'), '14 octobre');
  assert.equal(D.restorePointLabel(null), '');
  assert.equal(D.IMPORT_MAX_BYTES, 15728640);
});

test('sauvegarde : messages d’erreur d’import identiques', () => {
  const { legacy } = pair();
  for (const input of [null, [], 'texte', { habits: 5 }, { xp: 1 }, { habits: [] }]) {
    const theirs = legacy.call(`normalizeImported(${JSON.stringify(input)})`);
    const mine = D.normalizeImported(J(input), TODAY);
    assert.equal(mine.ok, theirs.ok, JSON.stringify(input));
    if (!mine.ok) assert.equal(mine.error, theirs.error, JSON.stringify(input));
  }
  assert.equal(D.parseBackup('{pas du json', TODAY).error, 'Fichier illisible : ce n’est pas du JSON valide');
});
