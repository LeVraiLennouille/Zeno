'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const norm = (t) => String(t).replace(/\s+/g, ' ');
const J = (x) => JSON.parse(JSON.stringify(x));
const strip = (html) => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function pair(raw = buildDb(), now = NOW) {
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  const legacy = createLegacy({ now, db: J(r.db) });
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(now) } };
}

/** Remplace `document` dans le bac à sable par un faux DOM qui enregistre les innerHTML et sert des valeurs de champs. */
function fakeDom(legacy, values = {}) {
  legacy.call(`globalThis.__html = {}; globalThis.__vals = ${JSON.stringify(values)};
    document = {
      getElementById: (id) => ({
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        set innerHTML(v) { __html[id] = v; }, get innerHTML() { return __html[id] || ''; },
        set textContent(v) {}, get value() { return __vals[id] ?? ''; }, set value(v) {},
        querySelector: () => null, dataset: {},
      }),
      querySelector: () => ({ scrollTop: 0, textContent: '' }),
      querySelectorAll: () => [], addEventListener() {},
    };`);
  return () => legacy.call('__html');
}

// ─────────────── Calendrier d'humeur ───────────────

function legacyCalTokens(html) {
  const re = /<div><\/div>|mood-cal-cell editable[^>]*onclick="openMoodModal\('([^']+)'\)"[\s\S]*?(?=<div class="mood-cal-cell|$)|mood-cal-empty" onclick="openMoodModal\('([^']+)'\)|<div class="mood-cal-cell"><div class="mood-cal-day-label" style="opacity:\.3">(\d+)/g;
  const grid = html.slice(html.indexOf('mood-cal-grid'));
  const out = [];
  let m;
  while ((m = re.exec(grid))) {
    if (m[0] === '<div></div>') out.push('blank');
    else if (m[1]) out.push(`mood:${m[1]}:${m[0].includes('mood-note-dot') ? 'note' : '-'}`);
    else if (m[2]) out.push(`empty:${m[2]}`);
    else out.push(`future:${m[3]}`);
  }
  return out;
}

for (const [year, month] of [[2026, 9], [2026, 8], [2026, 1], [2025, 11], [2026, 5], [2026, 10]]) {
  test(`calendrier d’humeur ${month + 1}/${year} : mêmes cases que la PWA`, () => {
    const { legacy, ctx } = pair();
    const html = legacy.call(`moodCalMonth = new Date(${year}, ${month}, 1); buildMoodCalHtml()`);
    const cal = D.moodCalendar(ctx, { year, month });
    const mine = [
      ...Array(cal.leading).fill('blank'),
      ...cal.cells.map((c) => (c.kind === 'mood' ? `mood:${c.date}:${c.hasNote ? 'note' : '-'}` : c.kind === 'empty' ? `empty:${c.date}` : `future:${c.day}`)),
    ];
    assert.deepEqual(mine, legacyCalTokens(html));
    assert.ok(strip(html).includes(cal.title), cal.title);
    assert.deepEqual(cal.headers, ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']);
  });
}

test('calendrier : navigation entre mois (jamais au-delà du mois courant)', () => {
  const { legacy, ctx } = pair();
  let ref = D.currentMonthRef(ctx);
  assert.deepEqual(ref, { year: 2026, month: 9 });
  assert.equal(D.shiftMonth(ctx, ref, 1), ref);
  legacy.call(`moodCalMonth = new Date(2026, 9, 1); moodCalNext(); `);
  assert.equal(legacy.call('moodCalMonth.getMonth()'), 9);
  ref = D.shiftMonth(ctx, ref, -1);
  assert.deepEqual(ref, { year: 2026, month: 8 });
  assert.deepEqual(D.shiftMonth(ctx, { year: 2026, month: 0 }, -1), { year: 2025, month: 11 });
  assert.deepEqual(D.shiftMonth(ctx, ref, 1), { year: 2026, month: 9 });
  assert.equal(D.moodCalendar(ctx, { year: 2026, month: 9 }).canGoNext, false);
  assert.equal(D.moodCalendar(ctx, { year: 2026, month: 8 }).canGoNext, true);
});

// ─────────────── Journal ───────────────

for (const [query, limit] of [['', 5], ['', 15], ['vélo', 5], ['VÉLO', 5], ['zzz', 5], ['journée', 5], ['', 2]]) {
  test(`journal « ${query} » / limite ${limit} : mêmes notes que la PWA`, () => {
    const { legacy, ctx } = pair();
    const html = legacy.call(`journalQuery = ${JSON.stringify(query)}; journalLimit = ${limit}; journalListHtml()`);
    const model = D.journalModel(ctx, query, limit);
    const dates = [...html.matchAll(/openMoodModal\('([^']+)',true\)/g)].map((m) => m[1]);
    assert.deepEqual(model.entries.map((e) => e.date), dates);
    const more = /Voir plus \((\d+)\)/.exec(html);
    assert.equal(model.remaining, more ? Number(more[1]) : 0);
    if (model.emptyText) assert.ok(strip(html).includes(model.emptyText));
    for (const e of model.entries) {
      const text = strip(html);
      assert.ok(text.includes(e.label), e.label);
      assert.ok(text.includes(e.text), e.text);
      for (const f of e.feelings) assert.ok(text.includes(f));
    }
  });
}

test('journal : étiquettes de date et recherche visible dès 3 notes', () => {
  const { legacy, ctx } = pair();
  for (const d of ['2026-10-27', '2025-12-24', '2026-01-01', '2026-02-28']) {
    assert.equal(D.journalDateLabel(ctx, d), legacy.call(`journalDateLabel('${d}')`), d);
  }
  assert.deepEqual(D.journalKeys(ctx.db), legacy.call('journalKeys()'));
  assert.equal(D.journalModel(ctx, '', 5).showSearch, true);
  const few = D.createInitialDb(TODAY);
  assert.equal(D.journalModel({ db: few, clock: ctx.clock }, '', 5).showSearch, false);
});

test('journal : suppression d’une note conserve l’humeur', () => {
  const { legacy, ctx } = pair();
  legacy.call(`deleteJournalNote('2026-10-27')`);
  const db = D.deleteJournalNote(ctx, '2026-10-27');
  assert.equal(db.journal['2026-10-27'], undefined);
  assert.equal(db.moods['2026-10-27'], 4);
  assert.deepEqual(J(db.journal), legacy.db.journal);
  assert.equal(D.deleteJournalNote({ db, clock: ctx.clock }, '2026-10-27'), db, 'déjà supprimée = même référence');
});

// ─────────────── Enregistrement de l'humeur ───────────────

const MOOD_CASES = [
  ['humeur seule', '2026-10-28', 4, [], ''],
  ['avec ressentis et note', '2026-10-28', 5, ['Joie', 'Courage'], '  Une belle journée  '],
  ['modifier une date passée, retirer la note', '2026-10-27', 2, ['Stress'], ''],
  ['même humeur, autres ressentis', '2026-10-24', 5, ['Calme'], 'Sortie vélo, super météo !'],
  ['note tronquée à 600', '2026-10-28', 3, ['Calme'], 'x'.repeat(700)],
];
for (const [label, date, value, feelings, note] of MOOD_CASES) {
  test(`humeur : ${label}`, () => {
    const { legacy, ctx } = pair();
    fakeDom(legacy, { journalInput: note });
    legacy.resetCaptures();
    legacy.call(`currentMoodDate = '${date}'; selectedMoodValue = ${value}; selectedFeelings = ${JSON.stringify(feelings)}; saveMoodWithFeelings();`);
    const r = D.saveMood(ctx, { date, value, feelings, journal: note });
    assert.ok(r.ok);
    const lg = legacy.db;
    assert.deepEqual(J(r.value.db.moods), lg.moods);
    assert.deepEqual(J(r.value.db.journal), lg.journal);
    assert.deepEqual(J(r.value.db.profile.moodFeelings), lg.profile.moodFeelings);
    assert.match(legacy.toasts[0], new RegExp(`^Humeur enregistrée\\s${D.MOOD_EMOJIS[value]}${r.value.hasNote ? ' · note ajoutée' : '$'}`));
  });
}

test('humeur : valeurs refusées et ressentis étrangers ignorés', () => {
  const { ctx } = pair();
  assert.deepEqual(D.saveMood(ctx, { date: TODAY, value: 0, feelings: [], journal: '' }), { ok: false, error: 'invalid_mood' });
  assert.deepEqual(D.saveMood(ctx, { date: TODAY, value: 3.5, feelings: [], journal: '' }), { ok: false, error: 'invalid_mood' });
  assert.deepEqual(D.saveMood(ctx, { date: '2026-10-29', value: 3, feelings: [], journal: '' }), { ok: false, error: 'invalid_date' });
  assert.deepEqual(D.saveMood(ctx, { date: 'hier', value: 3, feelings: [], journal: '' }), { ok: false, error: 'invalid_date' });
  const r = D.saveMood(ctx, { date: TODAY, value: 5, feelings: ['Joie', 'Colère', 'Joie'], journal: '' });
  assert.equal(r.value.db.profile.moodFeelings[TODAY], 'Joie');
  assert.deepEqual(D.savedFeelings(ctx.db, '2026-10-24', 5), ['Joie', 'Courage', 'Motivation', 'Calme', 'Gratitude', 'Amour']);
  assert.deepEqual(D.savedFeelings(ctx.db, '2026-10-24', 4), [], 'humeur différente = ressentis oubliés');
});

test('humeur : quand proposer la saisie du jour', () => {
  const { legacy, ctx } = pair();
  assert.equal(D.shouldPromptMood(ctx), true);
  const done = D.saveMood(ctx, { date: TODAY, value: 4, feelings: [], journal: '' }).value.db;
  assert.equal(D.shouldPromptMood({ db: done, clock: ctx.clock }), false);
  const early = { db: { ...ctx.db, createdAt: '2026-11-15' }, clock: ctx.clock };
  assert.equal(D.shouldPromptMood(early), false, 'pas avant la date de création');
  assert.ok(legacy);
});

// ─────────────── Sommeil ───────────────

for (const [label, vals] of [
  ['nuit complète', { sleepHours: '7', sleepMinutes: '30', sleepBedtime: '23:00', sleepWakeTime: '06:30', sleepDate: TODAY }],
  ['sans minutes ni horaires', { sleepHours: '8', sleepMinutes: '', sleepBedtime: '', sleepWakeTime: '', sleepDate: TODAY }],
  ['nuit passée', { sleepHours: '6', sleepMinutes: '05', sleepBedtime: '00:10', sleepWakeTime: '06:15', sleepDate: '2026-10-25' }],
  ['0 heure', { sleepHours: '0', sleepMinutes: '45', sleepBedtime: '', sleepWakeTime: '', sleepDate: TODAY }],
]) {
  test(`sommeil : ${label}`, () => {
    const { legacy, ctx } = pair();
    fakeDom(legacy, vals);
    legacy.resetCaptures();
    legacy.call('saveSleepEntry()');
    const r = D.saveSleep(ctx, { date: vals.sleepDate, hours: vals.sleepHours, minutes: vals.sleepMinutes, bedtime: vals.sleepBedtime, wakeTime: vals.sleepWakeTime });
    assert.ok(r.ok);
    assert.deepEqual(J(r.value.db.sleepLog), legacy.db.sleepLog);
    assert.deepEqual(J(r.value.db.habits.sleep.logs), legacy.db.habits.sleep.logs);
    assert.equal(r.value.db.xp, ctx.db.xp, 'aucune XP');
    assert.equal(legacy.toasts[0], `Sommeil enregistré : ${r.value.hours} h ${r.value.minutes} min`);
  });
}

test('sommeil : heures invalides refusées, minutes bornées (écart assumé)', () => {
  const { legacy, ctx } = pair();
  fakeDom(legacy, { sleepHours: '24', sleepMinutes: '0', sleepBedtime: '', sleepWakeTime: '', sleepDate: TODAY });
  legacy.resetCaptures();
  legacy.call('saveSleepEntry()');
  assert.equal(legacy.toasts[0], "Saisis un nombre d'heures valide (0 à 23)");
  for (const h of ['24', '-1', 'abc', '']) assert.deepEqual(D.saveSleep(ctx, { hours: h, minutes: '0', bedtime: '', wakeTime: '' }), { ok: false, error: 'invalid_hours' }, h);
  assert.deepEqual(D.saveSleep(ctx, { date: '2026-10-29', hours: '7', minutes: '0', bedtime: '', wakeTime: '' }), { ok: false, error: 'invalid_date' });
  const clamped = D.saveSleep(ctx, { hours: '7', minutes: '90', bedtime: '', wakeTime: '' });
  assert.equal(clamped.value.minutes, 59);
  assert.equal(D.sleepSummary(ctx).entry, null);
  assert.equal(D.sleepSummary({ db: clamped.value.db, clock: ctx.clock }).entry.hours, 7);
});

// ─────────────── Défis et saison ───────────────

for (const [name, now] of [['aujourd’hui', NOW], ['début de saison', new Date(2026, 8, 3, 9)], ['fin de saison', new Date(2026, 10, 29, 9)], ['hiver (janvier)', new Date(2027, 0, 15, 9)]]) {
  test(`défis : carte de saison et onglet — ${name}`, () => {
    const { legacy, ctx } = pair(buildDb(), now);
    const season = strip(legacy.call('seasonCardHtml()'));
    const m = D.seasonCardModel(ctx);
    assert.ok(season.includes(`Saison · ${m.label}`), m.label);
    assert.ok(season.includes(`Rang ${m.roman} ${m.rankName}`));
    const s = m.daysLeft > 1 ? 's' : '';
    assert.match(season, new RegExp(`${m.daysLeft}\\s*jour${s}\\s*restant${s}`), `${m.daysLeft} jours restants`);
    assert.ok(season.includes(norm(`${D.fmtNum(m.xp)} XP cette saison`)));
    assert.ok(season.includes(norm(m.footRight)));
    for (const p of m.past) assert.ok(season.includes(norm(`${p.emoji} ${p.label} Rang ${p.roman} · ${p.rankName} · ${D.fmtNum(p.xp)} XP`)), p.label);

    const tab = strip(legacy.call('challengesTabHtml()'));
    const cm = D.challengesModel(ctx);
    for (const c of cm.active) {
      assert.ok(tab.includes(c.title) && tab.includes(c.sub), c.title);
      assert.ok(tab.includes(`${c.success} / ${c.required} jours +${c.reward} XP à la clé`), c.title);
    }
    for (const h of cm.history) assert.ok(tab.includes(`${h.glyph} ${h.emoji} ${h.title} ${h.sub}`), h.title);
    assert.equal(tab.includes('Maximum 5 défis en cours.'), cm.atMax);
    assert.ok(tab.includes(`Historique · ${cm.wonCount} relevé${cm.wonCount > 1 ? 's' : ''}`) || cm.history.length === 0);
  });
}

test('défis : formulaire — candidats, titre automatique, aperçu', () => {
  const { legacy, ctx } = pair();
  assert.deepEqual(D.challengeCandidates(ctx).map((h) => h.id), legacy.call('chalCandidates().map(h => h.id)'));
  const start = D.startChallengeForm(ctx);
  assert.ok(start.ok);
  legacy.call(`cf = { habitId: ${JSON.stringify(start.form.habitId)}, days: 30, mode: 'all', min: 20, title: '', titleTouched: false }`);
  assert.equal(D.challengePreview(ctx, start.form).autoTitle, legacy.call('cfAutoTitle()'));
  for (const [habitId, days, mode, min] of [['sleep', 14, 'min', 9], ['yoga', 60, 'min', 100], ['smoke', 21, 'all', 1], ['running', 7, 'all', 5], ['sugar', 90, 'min', 3]]) {
    legacy.call(`cf = ${JSON.stringify({ habitId, days, mode, min, title: '', titleTouched: false })}`);
    const p = D.challengePreview(ctx, { habitId, days, mode, min, title: '', titleTouched: false });
    assert.equal(p.autoTitle, legacy.call('cfAutoTitle()'), habitId);
    const h = ctx.db.habitDefs.find((x) => x.id === habitId);
    assert.equal(p.activeDays, legacy.call(`chalActiveDays(HABITS.find(h => h.id === '${habitId}'), ${days})`));
    assert.equal(p.reward, legacy.call(`chalRewardFor(${p.requiredDays})`));
    assert.ok(h);
  }
  assert.equal(D.clampChallengeDays('2', 30), 3);
  assert.equal(D.clampChallengeDays('999', 30), 365);
  assert.equal(D.clampChallengeDays('abc', 30), 30);
  assert.equal(D.challengePreview(ctx, { ...start.form, title: 'Perso', titleTouched: true }).title, 'Perso');
});

test('défis : démarrage du formulaire refusé (max atteint, aucune habitude libre)', () => {
  const raw = buildDb();
  raw.challenges = ['sleep', 'projets', 'work', 'gym', 'yoga'].map((habitId) => ({ id: `a_${habitId}`, habitId, title: habitId, emoji: '🎯', color: '#8EA2FF', days: 30, required: 'all', start: TODAY, status: 'active', reward: 40 }));
  const full = pair(raw).ctx;
  assert.deepEqual(D.startChallengeForm(full), { ok: false, reason: 'max_active' });
  assert.equal(D.challengesModel(full).atMax, true);
  const one = buildDb();
  one.habitDefs = one.habitDefs.filter((h) => h.id === 'work');
  one.habits = { work: { logs: {} } };
  one.challenges = [{ id: 'w', habitId: 'work', title: 'w', emoji: '🎯', color: '#8EA2FF', days: 30, required: 'all', start: TODAY, status: 'active', reward: 40 }];
  assert.deepEqual(D.startChallengeForm(pair(one).ctx), { ok: false, reason: 'no_candidate' });
});

// ─────────────── Pauses ───────────────

test('pause : bandeau (reprise, pastille, masqué)', () => {
  const { legacy, ctx } = pair();
  const html = (c) => strip(legacy.call('1') && ''); // placeholder pour garder le bac à sable chargé
  void html;
  assert.deepEqual(D.pauseBanner(ctx), { kind: 'pill', left: 1, quota: 3 });
  const paused = pair(buildDb(), new Date(2026, 9, 20, 10)).ctx;
  const b = D.pauseBanner(paused);
  assert.equal(b.kind, 'paused');
  assert.equal(b.reason.label, 'Malade');
  const none = { db: { ...D.createInitialDb(TODAY), profile: { ...D.createInitialDb(TODAY).profile, pauseQuota: 0 } }, clock: ctx.clock };
  assert.deepEqual(D.pauseBanner(none), { kind: 'none' });
});

for (const [label, from, to, reason] of [
  ['un jour libre', '2026-10-29', '2026-10-29', 'trip'],
  ['plage dépassant le quota', '2026-10-29', '2026-11-01', 'sick'],
  ['jours déjà en pause', '2026-10-20', '2026-10-21', 'sick'],
  ['deux mois', '2026-10-30', '2026-11-03', 'work'],
  ['mois plein', '2026-11-05', '2026-11-06', 'party'],
]) {
  test(`pause : aperçu du formulaire — ${label}`, () => {
    const { legacy, ctx } = pair();
    const html = fakeDom(legacy);
    legacy.call(`pf = ${JSON.stringify({ from, to, reason })}; renderPauseForm();`);
    const text = strip(html().pauseFormBody);
    const m = D.pauseFormModel(ctx, { from, to, reason });
    assert.ok(text.includes(m.status.text), `${m.status.text}\n--- legacy: ${text.slice(0, 400)}`);
    for (const r of m.recent) assert.ok(text.includes(`${r.emoji} ${r.label} · ${r.reason}`), r.label);
    assert.equal(/pf-bad/.test(html().pauseFormBody), !m.status.ok);
    assert.deepEqual(m.bounds, legacy.call('pauseBounds()'));
  });
}

test('pause : formulaire — fin jamais avant le début, raccourcis', () => {
  const { legacy, ctx } = pair();
  let f = D.startPauseForm(ctx);
  assert.deepEqual(f, { from: TODAY, to: TODAY, reason: 'sick' });
  f = D.setPauseField(f, 'to', '2026-10-30');
  f = D.setPauseField(f, 'from', '2026-11-02');
  assert.equal(f.to, '2026-11-02', 'la fin suit le début');
  f = D.pausePreset(ctx, 'yesterday', f);
  assert.deepEqual([f.from, f.to], ['2026-10-27', '2026-10-27']);
  fakeDom(legacy);
  legacy.call(`pf = { from: '2026-10-28', to: '2026-10-30', reason: 'sick' }; pfSet('from', '2026-11-02');`);
  assert.equal(legacy.call('pf.to'), '2026-11-02');
  const s = D.pauseSectionModel(ctx);
  assert.deepEqual(s, { quota: 3, usedThisMonth: 2 });
});
