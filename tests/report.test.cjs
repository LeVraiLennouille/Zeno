'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../.build/domain');
const { createLegacy } = require('./legacy-harness.cjs');
const { buildDb } = require('./fixtures.cjs');

const NOW = new Date(2026, 9, 28, 14, 0, 0);
const TODAY = '2026-10-28';
const J = (x) => JSON.parse(JSON.stringify(x));
const decode = (t) => t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = (html) => decode(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const norm = (t) => String(t).replace(/\s+/g, ' ');

function pair(raw = buildDb(), now = NOW, hour = 0) {
  raw.profile.dayStartHour = hour;
  const r = D.normalizeImported(raw, TODAY);
  assert.ok(r.ok);
  const legacy = createLegacy({ now, db: J(r.db), dayStartHour: hour });
  return { legacy, ctx: { db: r.db, clock: D.fixedClock(now) } };
}
function fakeDom(legacy) {
  legacy.call(`globalThis.__html = {}; document = { getElementById: (id) => ({ classList: { add() {}, remove() {}, toggle() {} }, set innerHTML(v) { __html[id] = v; }, get innerHTML() { return __html[id] || ''; }, set textContent(v) { __html[id + ':text'] = v; }, get value() { return ''; }, set value(v) {}, querySelector: () => null }), querySelector: () => ({ scrollTop: 0 }), querySelectorAll: () => [], addEventListener() {} };`);
  return () => legacy.call('__html');
}
const setRep = (legacy, cfg) => legacy.call(`rep.period = ${JSON.stringify(cfg.period)}; rep.offset = ${cfg.offset}; rep.habit = ${JSON.stringify(cfg.habit)};`);
const keyOf = (d) => D.fmtDate(new Date(d));

const HABITS = ['all', 'gym', 'tt', 'smoke', 'running', 'cleaning', 'drink', 'old', 'yoga'];
const PERIODS = [['week', [0, -1, -4]], ['month', [0, -1, -6]], ['year', [0, -1]]];

for (const [period, offsets] of PERIODS) {
  for (const offset of offsets) {
    test(`rapport ${period} (${offset}) : plage, stats, barres, courbes, calendrier — toutes habitudes`, () => {
      const { legacy, ctx } = pair();
      for (const habit of HABITS) {
        const cfg = { period, offset, habit };
        setRep(legacy, cfg);
        const tag = `${period}/${offset}/${habit}`;

        const range = legacy.call('repRange()');
        const mine = D.reportRange(ctx, cfg);
        assert.deepEqual([keyOf(mine.start), keyOf(mine.end), mine.label], [keyOf(range.start), keyOf(range.end), range.label], `plage ${tag}`);

        assert.deepEqual(J(D.reportStats(ctx, cfg)), legacy.call('repStats()'), `stats ${tag}`);

        const lb = legacy.call('repBuckets()').map((b) => ({ ...b, future: !!b.future }));
        assert.deepEqual(J(D.reportBuckets(ctx, cfg)), lb, `barres ${tag}`);

        assert.deepEqual(J(D.moodPoints(ctx, cfg)), legacy.call('repMoodPoints()'), `humeur ${tag}`);

        const html = legacy.call('buildCalStats().html');
        const legacyCal = [];
        for (const m of html.matchAll(/<div><\/div>|<div class="cal-stats-cell([^"]*)"(?: title="([^"]*)")?>(\d+)<\/div>/g)) {
          legacyCal.push(m[0] === '<div></div>' ? 'blank' : `${m[3]}:${m[1].trim() || 'none'}:${m[2] ?? ''}`);
        }
        const cal = D.calendarStats(ctx, cfg);
        const mineCal = [
          ...Array(cal.leading).fill('blank'),
          ...cal.cells.map((c) => {
            const kind = c.kind === 'plain' || c.kind === 'none' ? 'none' : c.kind;
            return `${c.day}:${kind}:${c.title}`;
          }),
        ];
        assert.deepEqual(mineCal, legacyCal, `calendrier ${tag}`);
        assert.equal(cal.label, legacy.call('buildCalStats().label'));
      }
    });
  }
}

test('rapport : jour décalé (début à 4 h, 2 h 30) et dimanche soir', () => {
  for (const [now, hour] of [[new Date(2026, 9, 29, 2, 30), 4], [new Date(2026, 9, 25, 21), 0], [new Date(2026, 10, 1, 9), 0]]) {
    const { legacy, ctx } = pair(buildDb(), now, hour);
    for (const habit of ['all', 'smoke', 'tt']) {
      for (const period of ['week', 'month']) {
        const cfg = { period, offset: 0, habit };
        setRep(legacy, cfg);
        assert.deepEqual(J(D.reportStats(ctx, cfg)), legacy.call('repStats()'));
        assert.deepEqual(J(D.reportBuckets(ctx, cfg)), legacy.call('repBuckets()').map((b) => ({ ...b, future: !!b.future })));
      }
    }
  }
});

test('rapport : navigation, période suivante, habitude disparue', () => {
  const { ctx } = pair();
  const cfg = D.defaultReportConfig;
  assert.equal(D.shiftReport(cfg, 1), cfg, 'jamais dans le futur');
  assert.equal(D.shiftReport(cfg, -1).offset, -1);
  assert.deepEqual(['week', 'month', 'year'].map(D.nextPeriod), ['month', 'year', 'week']);
  const model = D.reportModel(ctx, { period: 'week', offset: 0, habit: 'fantome' });
  assert.equal(model.cfg.habit, 'all');
  assert.equal(model.canGoNext, false);
  assert.equal(D.reportModel(ctx, { period: 'week', offset: -2, habit: 'gym' }).canGoNext, true);
  assert.equal(model.periodLabel, 'Semaine');
  assert.ok(model.habitOptions.every((h) => !h.archived));
});

test('courbes : tronçons continus', () => {
  const pts = [1, 2, null, 3, null, null, 4, 5, 6].map((v, i) => ({ label: String(i), showLabel: true, v }));
  const runs = D.chartRuns(pts);
  assert.deepEqual(runs.map((r) => r.map((p) => p.index)), [[0, 1], [3], [6, 7, 8]]);
  assert.deepEqual(D.chartRuns([]), []);
  assert.deepEqual(D.chartRuns([{ label: '', showLabel: false, v: null }]), []);
});

// ─────────────── Insights ───────────────

test('insights : lignes quotidiennes et comparaisons identiques', () => {
  const { legacy, ctx } = pair();
  assert.deepEqual(J(D.insightRows(ctx, 90)), legacy.call('insightRows(90)').map((r) => ({ ...r })));
  assert.deepEqual(J(D.insightRows(ctx, 120)), legacy.call('insightRows(120)'));
  const rows = D.insightRows(ctx, 90);
  for (const id of ['gym', 'drink', 'smoke', 'sleep']) {
    const mine = D.compareMood(rows, (r) => r.done[id]);
    const theirs = legacy.call(`compareMood(insightRows(90), r => r.done['${id}'])`);
    assert.deepEqual(mine && J(mine), theirs, id);
  }
  assert.deepEqual(J(D.compareRate(rows, (r) => (r.sleepH == null ? null : r.sleepH >= 7))), legacy.call('compareRate(insightRows(90), r => r.sleepH == null ? null : r.sleepH >= 7)'));
});

test('insights : textes, deltas et ordre identiques (jeu de données avec beaucoup d’humeurs)', () => {
  const raw = buildDb();
  // 100 jours d'humeur corrélée à la gym et au sommeil, pour déclencher les comparaisons.
  const { key, at } = require('./fixtures.cjs');
  for (let d = at('2026-07-20'); key(d) <= '2026-10-27'; d.setDate(d.getDate() + 1)) {
    const k = key(d);
    const gym = raw.habits.gym.logs[k] === 'done';
    raw.moods[k] = Math.max(1, Math.min(5, (gym ? 4 : 2) + (d.getDate() % 3 === 0 ? 1 : 0)));
    raw.sleepLog[k] = { hours: gym ? 8 : 6, minutes: 10, bedtime: '', wakeTime: '' };
    if (d.getDate() % 4 === 0) raw.meditation[k] = 6;
  }
  const { legacy, ctx } = pair(raw);
  const mine = D.computeInsights(ctx, D.insightRows(ctx, 90));
  const theirs = legacy.call('computeInsights(insightRows(90))');
  assert.ok(mine.length >= 3, `${mine.length} insights`);
  assert.deepEqual(mine.map((i) => ({ icon: i.icon, text: norm(D.plainText(i.parts)), delta: i.delta, good: i.good, n: i.n, score: i.score })),
    theirs.map((i) => ({ icon: i.icon, text: norm(i.text.replace(/<[^>]*>/g, '')), delta: i.delta, good: i.good, n: i.n, score: i.score })));
  const html = strip(legacy.call('buildInsightsHtml()'));
  const m = D.insightsModel(ctx);
  assert.ok(m.enough);
  assert.ok(html.includes(norm(`Humeur moyenne : ${D.f1(m.averageMood)} / 5 sur ${m.daysWithMood} jours renseignés`)), html.slice(0, 200));
});

test('insights : pas assez de jours d’humeur', () => {
  const { legacy, ctx } = pair();
  const m = D.insightsModel(ctx);
  const html = strip(legacy.call('buildInsightsHtml()'));
  assert.equal(m.enough, m.daysWithMood >= 7);
  if (!m.enough) assert.ok(html.includes(`${m.daysWithMood} / 7 jours`));
});

// ─────────────── Bilan hebdomadaire ───────────────

const MONDAYS = ['2026-10-19', '2026-10-12', '2026-10-26', '2026-09-28', '2026-07-06', '2026-04-20'];

for (const [label, now, hour] of [['mercredi', NOW, 0], ['lundi matin', new Date(2026, 10, 2, 9), 0], ['2 h 30 / début 4 h', new Date(2026, 9, 29, 2, 30), 4]]) {
  test(`bilan : données hebdomadaires identiques — ${label}`, () => {
    const { legacy, ctx } = pair(buildDb(), now, hour);
    for (const mon of MONDAYS) {
      const a = D.weekReviewData(ctx, mon);
      const b = legacy.call(`weekReviewData('${mon}')`);
      const shape = (r) => ({
        req: r.req, done: r.done, rate: r.rate, activeDays: r.activeDays, perfect: r.perfect,
        xp: r.xp ?? null, moodAvg: r.moodAvg, moodN: r.moodN,
        perDay: r.perDay.map((d) => [d.k, d.req, d.done, d.rate]),
        best: r.best ? r.best.k : null,
        forgotten: r.forgotten ? [(r.forgotten.habit ?? r.forgotten.h).id, r.forgotten.req, r.forgotten.done, !!r.forgotten.times, r.forgotten.count ?? null] : null,
      });
      assert.deepEqual(shape(J(a)), shape(b), mon);
    }
    assert.equal(D.lastWeekMonday(ctx), legacy.call('lastWeekMonday()'));
    for (const r of [null, 0.2, 0.5, 0.69, 0.7, 0.9, 1]) assert.equal(D.verdictFor(r), legacy.call(`verdictFor(${r})`));
    const bs = legacy.call('bestStreakNow()');
    const mine = D.bestStreakNow(ctx);
    assert.deepEqual(mine ? [mine.habit.id, mine.n, mine.days] : null, bs ? [bs.h.id, bs.n, bs.days] : null);
    assert.equal(D.reviewDue(ctx), legacy.call('reviewDue()'));
    for (const mon of MONDAYS) assert.equal(D.mondayLabel(mon), legacy.call(`mondayLabel('${mon}')`));
  });
}

test('bilan : résumé partageable identique', () => {
  const { legacy, ctx } = pair();
  for (const mon of ['2026-10-19', '2026-10-12']) {
    const prevMon = D.fmtDate(D.addDays(D.parseDate(mon), -7));
    const prev = D.weekReviewData(ctx, prevMon).rate;
    const text = D.reviewSummaryText(ctx, D.weekReviewData(ctx, mon), prev);
    const expected = legacy.call(`reviewSummaryText(weekReviewData('${mon}'), weekReviewData('${prevMon}').rate)`);
    assert.equal(text, expected, mon);
  }
});

test('bilan : quand est-il proposé ?', () => {
  const base = pair().ctx;
  const mutate = (patch) => {
    const raw = buildDb();
    Object.assign(raw.profile, patch.profile ?? {});
    if (patch.createdAt) raw.createdAt = patch.createdAt;
    return pair(raw);
  };
  for (const p of [{}, { profile: { weeklyReview: false } }, { profile: { reviewedWeek: '2026-10-19' } }, { profile: { reviewedWeek: '2026-10-12' } }, { createdAt: '2026-10-27' }]) {
    const { legacy, ctx } = mutate(p);
    assert.equal(D.reviewDue(ctx), legacy.call('reviewDue()'), JSON.stringify(p));
  }
  assert.equal(D.reviewDue(base), true);
  const seen = D.markReviewed(base, '2026-10-19');
  assert.equal(seen.profile.reviewedWeek, '2026-10-19');
  assert.equal(D.reviewDue({ db: seen, clock: base.clock }), false);
});

test('bilan : textes de l’écran identiques à renderReview', () => {
  const { legacy, ctx } = pair();
  const html = fakeDom(legacy);
  for (const mon of ['2026-10-19', '2026-10-12', '2026-04-20']) {
    legacy.call(`renderReview('${mon}')`);
    const text = strip(html().reviewBody);
    const m = D.reviewModel(ctx, mon);
    const must = [
      m.verdict, m.sub, m.season.label, m.season.rank, m.season.foot,
      ...m.tiles.flatMap((t) => [t.icon, t.value, t.label]),
      m.forgotten ? `${m.forgotten.habit.name}` : m.emptyForgotten,
      m.forgotten ? m.forgotten.detail : '',
      m.bestDay ? `Meilleur jour : ${m.bestDay.day} · ${m.bestDay.pct} %` : '',
      m.delta ? `${m.delta.sign}${m.delta.pts} pts` : '',
    ].filter(Boolean);
    for (const s of must) assert.ok(text.includes(norm(s)), `« ${s} » absent pour ${mon}\n${text.slice(0, 500)}`);
    assert.equal(/Lancer un défi/.test(text), !!m.forgotten?.canChallenge, `bouton défi ${mon}`);
    assert.equal(legacy.db.profile.reviewedWeek, undefined);
    assert.equal(legacy.call('1') && html()['reviewRange:text'], m.range);
  }
});

test('bilan : carte du rapport', () => {
  const { legacy, ctx } = pair();
  const text = strip(legacy.call('buildReviewCardHtml()'));
  const c = D.reviewCardModel(ctx);
  assert.ok(text.includes(c.label) && text.includes(c.score) && text.includes(c.verdict), text);
});

// ─────────────── Fiche détaillée ───────────────

test('fiche : chaque case de la grille annuelle', () => {
  const { legacy, ctx } = pair();
  for (const h of ctx.db.habitDefs) {
    for (const year of [2026, 2025]) {
      const html = legacy.call(`detailGridHtml(HABITS.find(h => h.id === '${h.id}'), ${year}).html`);
      const doneCount = legacy.call(`detailGridHtml(HABITS.find(h => h.id === '${h.id}'), ${year}).doneCount`);
      const legacyCells = [...html.matchAll(/<i class="dg-cell dg-(\w+)"(?: style="--a:([\d.]+)")?(?: title="([^"]*)")?><\/i>/g)].map((m) => `${m[1]}|${m[2] ?? ''}|${m[3] ?? ''}`);
      const grid = D.detailGrid(ctx, h, year);
      const mine = grid.weeks.flatMap((w) => w.map((c) => (c === null ? 'blank||' : `${c.cell.c}|${c.cell.a == null ? '' : c.cell.a.toFixed(2)}|${c.cell.t ? `${D.fmtDay(c.date)} · ${c.cell.t}` : ''}`)));
      assert.deepEqual(mine, legacyCells, `${h.id} ${year}`);
      assert.equal(grid.doneCount, doneCount, `${h.id} ${year} : jours réussis`);
      const months = [...html.matchAll(/<span style="grid-column:(\d+)">([^<]*)<\/span>/g)].map((m) => `${Number(m[1]) - 1}:${m[2]}`);
      assert.deepEqual(grid.months.map((m) => `${m.week}:${m.label}`), months, `${h.id} mois`);
    }
  }
});

test('fiche : totaux, jours de la semaine, tendance', () => {
  const { legacy, ctx } = pair();
  for (const h of ctx.db.habitDefs) {
    const sel = `HABITS.find(h => h.id === '${h.id}')`;
    const t = legacy.call(`detailTotals(${sel})`);
    const mine = D.detailTotals(ctx, h);
    assert.deepEqual(J({ cur: mine.cur, best: mine.best, rate: mine.rate, rateLabel: mine.rateLabel, t4: mine.t4 }), t, `totaux ${h.id}`);
    assert.deepEqual(J(D.detailWeekdays(ctx, h)), legacy.call(`detailWeekdays(${sel})`), `semaine ${h.id}`);
    assert.deepEqual(J(D.detailTrend(ctx, h)), legacy.call(`detailTrend(${sel})`), `tendance ${h.id}`);
  }
});

test('fiche : textes de l’écran identiques à renderHabitDetail', () => {
  const raw = buildDb();
  const { key, at } = require('./fixtures.cjs');
  for (let d = at('2026-07-20'); key(d) <= '2026-10-27'; d.setDate(d.getDate() + 1)) raw.moods[key(d)] = raw.habits.gym.logs[key(d)] === 'done' ? 5 : 2;
  const { legacy, ctx } = pair(raw);
  const html = fakeDom(legacy);
  for (const h of ctx.db.habitDefs) {
    legacy.call(`detailId = '${h.id}'; detailYear = 2026; renderHabitDetail();`);
    const text = strip(html().detailBody);
    const m = D.detailModel(ctx, h.id, 2026);
    for (const tile of m.tiles) assert.ok(text.includes(norm(`${tile.value} ${tile.label}`)), `${h.id} : tuile ${tile.label}\n${text.slice(0, 300)}`);
    assert.ok(text.includes(norm(D.plainText(m.weekdayText))), `${h.id} : ${D.plainText(m.weekdayText)}`);
    assert.ok(text.includes(norm(m.freqText)), m.freqText);
    if (m.moodNote) assert.ok(text.includes(norm(D.plainText(m.moodNote.parts))), `${h.id} : humeur`);
    else assert.ok(!/Humeur moyenne les jours/.test(text), `${h.id} : humeur inattendue`);
    for (const l of m.levels) assert.ok(text.includes(`${l.level} ${l.count}×`));
    assert.equal(/Répartition des écarts/.test(text), m.levels.length > 0);
  }
  assert.equal(D.detailModel(ctx, 'fantome'), null);
});

test('fiche : navigation d’année bornée', () => {
  const { ctx } = pair();
  assert.equal(D.clampDetailYear(ctx, 2030), 2026);
  assert.equal(D.clampDetailYear(ctx, 2010), 2026, 'création en 2026');
  const old = pair({ ...buildDb(), createdAt: '2024-03-01' }).ctx;
  assert.equal(D.clampDetailYear(old, 2010), 2024);
  const m = D.detailModel(old, 'gym', 2025);
  assert.deepEqual([m.canPrevYear, m.canNextYear], [true, true]);
  const now = D.detailModel(ctx, 'gym');
  assert.deepEqual([now.canPrevYear, now.canNextYear, now.grid.year], [false, false, 2026]);
});
