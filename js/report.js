/* HabitsTracker · Rapport interactif, graphiques et insights croisés
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Rapport interactif ═══════════ */
const rep = { period: 'week', offset: 0, habit: 'all' };
const REP_PERIODS = [['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']];
const midnight = () => { const d = appNow(); d.setHours(0, 0, 0, 0); return d; };
const fmtShort = d => `${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}`;

function setRepPeriod(p) { rep.period = p; rep.offset = 0; renderReport(); }
function cycleRepPeriod() { const i = REP_PERIODS.findIndex(x => x[0] === rep.period); setRepPeriod(REP_PERIODS[(i + 1) % REP_PERIODS.length][0]); }
function setRepHabit(id) { rep.habit = id; renderReport(); }
function repNav(delta) { const n = rep.offset + delta; if (n > 0) return; rep.offset = n; renderReport(); }

function repRange() {
  const t = midnight();
  if (rep.period === 'week') {
    const dow = t.getDay() === 0 ? 6 : t.getDay() - 1;
    const start = addDays(t, -dow + rep.offset * 7), end = addDays(start, 6);
    return { start, end, t, label: `${fmtShort(start)} – ${fmtShort(end)}` };
  }
  if (rep.period === 'month') {
    const start = new Date(t.getFullYear(), t.getMonth() + rep.offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end, t, label: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}` };
  }
  const y = t.getFullYear() + rep.offset;
  return { start: new Date(y, 0, 1), end: new Date(y, 11, 31), t, label: String(y) };
}
function repHabits() { return rep.habit === 'all' ? HABITS : HABITS.filter(h => h.id === rep.habit); }

// Statistiques d'une journée selon le filtre courant (null si rien à mesurer).
function dayStat(d, includeOptional) {
  const k = fmtDate(d);
  if (d > midnight() || k < DB.createdAt) return null;
  let req = 0, done = 0, cnt = 0;
  repHabits().forEach(h => {
    if (rep.habit === 'all' && (h.type === 'times' || (h.optional && !includeOptional))) return;   // « X fois / semaine » : pas de jour dû
    if (!isDayActive(h, d)) return;
    const v = getHabitDayValue(h, k, d);
    req++; if (v >= 1) cnt++;
    done += rep.habit === 'all' ? (v >= 1 ? 1 : 0) : Math.min(1, v);
  });
  return req > 0 ? { k, req, done, cnt, rate: done / req } : null;
}

function repStats() {
  const { start, end, t } = repRange();
  let req = 0, done = 0, validated = 0, perfect = 0;
  for (let d = new Date(start); d <= end && d <= t; d = addDays(d, 1)) {
    const s = dayStat(d); const k = fmtDate(d);
    if (s) { req += s.req; done += s.done; if (s.rate >= 1) perfect++; }
    repHabits().forEach(h => {
      if (h.type === 'bad' || !isDayActive(h, d) || k < DB.createdAt) return;
      if (h.type === 'weekly') { if (DB.habits[h.id].logs[k] === 'done') validated++; }
      else if (isHabitDoneOn(h, k, d)) validated++;
    });
  }
  const sel = rep.habit === 'all' ? null : HABITS.find(h => h.id === rep.habit);
  const streak = !sel
    ? liveHabits().filter(h => !weeklyUnit(h)).reduce((m, h) => Math.max(m, calcStreak(h).current), 0)   // séries en jours uniquement
    : calcStreak(sel).current;
  const perfectDays = rep.habit === 'all'
    ? (DB.perfectDaysClaimed || []).filter(k => k >= fmtDate(start) && k <= fmtDate(end)).length
    : perfect;
  if (sel && sel.type === 'times') {
    const w = timesRangeStats(sel, start, end);
    return { streak, rate: w.tot > 0 ? Math.round(w.ok / w.tot * 100) : 0, validated, perfectDays: w.ok };
  }
  return { streak, rate: req > 0 ? Math.round(done / req * 100) : 0, validated, perfectDays };
}

// Semaines (lundi → dimanche) dont le lundi tombe dans la période : réussies / jugées.
function timesRangeStats(h, start, end) {
  let m = parseDate(getWeekMonday(start)); if (m < start) m = addDays(m, 7);
  let ok = 0, tot = 0;
  for (; m <= end; m = addDays(m, 7)) { const st = timesWeekInfo(h, fmtDate(m)).state; if (st === 'success') { ok++; tot++; } else if (st === 'failed') tot++; }
  return { ok, tot };
}

// Points pour le graphique en barres et la courbe de réussite.
function repBuckets() {
  const { start, end, t } = repRange();
  if (rep.period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      let req = 0, done = 0, cnt = 0;
      const last = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let day = 1; day <= last; day++) {
        const s = dayStat(new Date(start.getFullYear(), m, day), true);
        if (s) { req += s.req; done += s.done; cnt += s.cnt; }
      }
      const cur = start.getFullYear() === t.getFullYear() && m === t.getMonth();
      return { label: MONTH_SHORT[m].slice(0, 3), barLabel: MONTH_SHORT[m][0], showLabel: true, rate: req > 0 ? done / req : null, cnt, req, isToday: cur };
    });
  }
  const out = []; let i = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1), i++) {
    const s = dayStat(d, true);
    const isToday = fmtDate(d) === fmtDate(t);
    const label = rep.period === 'week' ? DAY_SHORT[i] : String(d.getDate());
    out.push({ label, barLabel: label, showLabel: rep.period === 'week' || d.getDate() === 1 || d.getDate() % 5 === 0,
      rate: s ? s.rate : null, cnt: s ? s.cnt : 0, req: s ? s.req : 0, isToday, future: d > t });
  }
  return out;
}
function repMoodPoints() {
  const { start, end, t } = repRange();
  if (rep.period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      const vals = [];
      const last = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let day = 1; day <= last; day++) { const v = DB.moods[fmtDate(new Date(start.getFullYear(), m, day))]; if (v) vals.push(v); }
      return { label: MONTH_SHORT[m].slice(0, 3), showLabel: true, v: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, emoji: false };
    });
  }
  const out = []; let i = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1), i++) {
    const v = DB.moods[fmtDate(d)];
    out.push({ label: rep.period === 'week' ? DAY_SHORT[i][0] : String(d.getDate()),
      showLabel: rep.period === 'week' || d.getDate() === 1 || d.getDate() % 5 === 0,
      v: (v && d <= t) ? v : null, emoji: rep.period === 'week' });
  }
  return out;
}

function buildCalStats() {
  const { end, t } = repRange();
  const anchor = end > t ? t : end;
  const year = anchor.getFullYear(), month = anchor.getMonth();
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const todayKey = today(); let html = '';
  for (let i = 0; i < startDow; i++) html += `<div></div>`;
  for (let d = 1; d <= last.getDate(); d++) {
    const dateObj = new Date(year, month, d); const k = fmtDate(dateObj);
    if (k > todayKey) { html += `<div class="cal-stats-cell future">${d}</div>`; continue; }
    if (isPaused(k)) { html += `<div class="cal-stats-cell paused" title="Pause">${d}</div>`; continue; }
    if (k < DB.createdAt) { html += `<div class="cal-stats-cell">${d}</div>`; continue; }
    const s = dayStat(dateObj);
    let cls = 'cal-stats-cell'; let title = '';
    if (s) { title = ` title="${s.cnt}/${s.req}"`; cls += s.rate >= 1 ? ' perfect' : s.rate >= 0.7 ? ' good' : ' missed'; }
    html += `<div class="${cls}"${title}>${d}</div>`;
  }
  return { html, label: `${MONTH_NAMES[month]} ${year}` };
}

const CARET = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="2 4 5 7 8 4"/></svg>`;
const NAV_L = `<svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg>`;
const NAV_R = `<svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg>`;

function renderReport() {
  const container = document.getElementById('reportContent'); if (!container) return;
  if (rep.habit !== 'all' && !HABITS.some(h => h.id === rep.habit)) rep.habit = 'all';
  const R = repRange(), st = repStats(), buckets = repBuckets(), cal = buildCalStats();
  const periodName = REP_PERIODS.find(p => p[0] === rep.period)[1];
  const single = rep.habit !== 'all';
  const selH = single ? HABITS.find(h => h.id === rep.habit) : null;
  const dense = buckets.length > 12;
  const badge = `<button type="button" class="report-period-badge" onclick="cycleRepPeriod()" aria-label="Changer de période (actuelle : ${periodName})">${periodName} ${CARET}</button>`;
  const habitOpts = `<option value="all">Toutes les habitudes</option>` +
    repHabitOptions();

  const linePts = buckets.map(b => ({ label: b.label, showLabel: b.showLabel, v: b.rate == null ? null : Math.round(b.rate * 100) }));
  const moodPts = repMoodPoints();

  container.innerHTML = `
    <div class="report-wrap">
      <div class="rep-controls">
        <div class="rep-seg" role="group" aria-label="Période">
          ${REP_PERIODS.map(([k, l]) => `<button type="button" class="rep-seg-btn${rep.period === k ? ' active' : ''}" aria-pressed="${rep.period === k}" onclick="setRepPeriod('${k}')">${l}</button>`).join('')}
        </div>
        <div class="rep-row">
          <div class="rep-nav">
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(-1)" aria-label="Période précédente">${NAV_L}</button>
            <div class="rep-range" aria-live="polite">${R.label}</div>
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(1)" aria-label="Période suivante"${rep.offset >= 0 ? ' disabled' : ''}>${NAV_R}</button>
          </div>
          <select class="pseudo-input rep-select" aria-label="Filtrer par habitude" onchange="setRepHabit(this.value)">${habitOpts}</select>
          ${single ? `<button type="button" class="pref-edit rep-fiche" onclick="openHabitDetail('${rep.habit}')">Voir la fiche</button>` : ''}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-val">${st.streak}</div><div class="stat-label">${selH && weeklyUnit(selH) ? 'Série (semaines)' : 'Série en cours'}</div></div>
        <div class="stat-card"><div class="stat-val">${st.rate}%</div><div class="stat-label">Taux de réussite</div></div>
        <div class="stat-card"><div class="stat-val">${st.validated.toLocaleString('fr-FR')}</div><div class="stat-label">Habitudes validées</div></div>
        <div class="stat-card"><div class="stat-val">${st.perfectDays}</div><div class="stat-label">${selH && selH.type === 'times' ? 'Semaines réussies' : single ? 'Jours réussis' : 'Journées parfaites'}</div></div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">${single ? 'Réussite par ' + (rep.period === 'year' ? 'mois' : 'jour') : 'Habitudes validées'}</div>
          ${badge}
        </div>
        <div class="bar-chart${dense ? ' dense' : ''}" id="barChart">
          ${buckets.map(b => {
            const pct = b.rate == null ? 0 : Math.max(b.rate > 0 ? 5 : 3, Math.round(b.rate * 100));
            const tip = b.req > 0 ? `${b.label} : ${b.cnt}/${b.req}` : `${b.label} : –`;
            return `<div class="bar-col" title="${esc(tip)}">
              <div class="bar-fill${b.isToday ? ' active' : ''}" style="height:${pct}%;background:${b.isToday ? 'var(--accent)' : 'var(--accent-bg)'}">
                ${b.isToday && !dense ? `<div class="bar-tooltip">${b.cnt} habitude${b.cnt > 1 ? 's' : ''}</div>` : ''}
              </div>
              <div class="bar-label">${b.showLabel ? esc(rep.period === 'year' ? b.barLabel : b.label) : '&nbsp;'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Évolution du taux de réussite</div>
          ${badge}
        </div>
        <canvas id="lineChartReport" height="160" role="img" aria-label="Courbe du taux de réussite"></canvas>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier du mois</div>
          <div class="report-period-badge">${cal.label}</div>
        </div>
        <div class="cal-stats-grid">
          ${DAY_SHORT.map(d => `<div class="cal-stats-header">${d[0]}${d[1]}</div>`).join('')}
          ${cal.html}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier d'humeur</div>
          <div class="report-period-badge" style="cursor:pointer" onclick="openMoodManual()">+ Saisir l'humeur</div>
        </div>
        ${buildMoodCalHtml()}
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Courbe d'humeur</div>
          ${badge}
        </div>
        <canvas id="moodChartReport" height="100" role="img" aria-label="Courbe d'humeur"></canvas>
      </div>

      ${buildReviewCardHtml()}

      ${buildJournalHtml()}

      ${buildInsightsHtml()}
    </div>`;

  requestAnimationFrame(() => {
    drawLineChart('lineChartReport', linePts);
    drawMoodChart('moodChartReport', moodPts);
  });
}

function chartColors() {
  const dark = isDarkNow();
  return {
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    accent: cssVar('--accent') || '#12131A',
  };
}
// Découpe en séries continues (les valeurs null interrompent la courbe).
function chartRuns(pts, xOf, yOf) {
  const runs = []; let cur = [];
  pts.forEach((p, i) => { if (p.v == null) { if (cur.length) runs.push(cur); cur = []; } else cur.push({ x: xOf(i), y: yOf(p.v), p, i }); });
  if (cur.length) runs.push(cur);
  return runs;
}
function strokeRuns(ctx, runs, c, padTop, base, radius) {
  runs.forEach(run => {
    if (run.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, base);
      grad.addColorStop(0, withAlpha(c.accent, 0.16)); grad.addColorStop(1, withAlpha(c.accent, 0));
      ctx.beginPath(); ctx.moveTo(run[0].x, run[0].y); run.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
      ctx.lineTo(run[run.length - 1].x, base); ctx.lineTo(run[0].x, base); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(run[0].x, run[0].y); run.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    }
    run.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = c.accent; ctx.fill(); });
  });
}
function chartEmpty(ctx, W, H, c) {
  ctx.fillStyle = c.text; ctx.font = '12px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Pas encore de données sur cette période', W / 2, H / 2);
}

function drawLineChart(canvasId, pts) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = 160; canvas.width = W; canvas.height = H;
  const c = chartColors();
  const pad = { l: 36, r: 16, t: 20, b: 28 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b, n = pts.length;
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  [0, 20, 40, 60, 80, 100].forEach(v => {
    const y = pad.t + cH - (v / 100) * cH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'right'; ctx.fillText(`${v}%`, pad.l - 6, y + 4);
  });
  const xOf = i => pad.l + (n > 1 ? i / (n - 1) : 0.5) * cW;
  const yOf = v => pad.t + cH - (v / 100) * cH;
  const runs = chartRuns(pts, xOf, yOf);
  if (!runs.length) { chartEmpty(ctx, W, H, c); } else strokeRuns(ctx, runs, c, pad.t, pad.t + cH, n > 12 ? 2.5 : 4);
  ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  pts.forEach((p, i) => { if (p.showLabel) ctx.fillText(p.label, xOf(i), H - 4); });
}

function drawMoodChart(canvasId, pts) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = 100; canvas.width = W; canvas.height = H;
  const c = chartColors();
  const pad = { l: 16, r: 16, t: 16, b: 24 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b, n = pts.length;
  const xOf = i => pad.l + (n > 1 ? i / (n - 1) : 0.5) * cW;
  const yOf = v => pad.t + cH - ((v - 1) / 4) * cH;
  const runs = chartRuns(pts, xOf, yOf);
  if (!runs.length) chartEmpty(ctx, W, H, c);
  else strokeRuns(ctx, runs, c, pad.t, pad.t + cH, n > 12 ? 2.5 : 3.5);
  ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  pts.forEach((p, i) => { if (p.showLabel) ctx.fillText(p.label, xOf(i), H - 4); });
  pts.forEach((p, i) => { if (p.v != null && p.emoji) { ctx.font = '14px serif'; ctx.fillText(MOOD_EMOJIS[Math.round(p.v)] || '', xOf(i), yOf(p.v) - 8); } });
}

/* ═══════════ Insights croisés ═══════════ */
const INSIGHT_DAYS = 90;
const INSIGHT_MIN_GROUP = 5;
const f1 = n => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const avgOf = a => a.reduce((s, x) => s + x, 0) / a.length;

function insightRows(days) {
  const now = midnight(); const rows = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(now, -i), k = fmtDate(d);
    if (k < DB.createdAt) break;
    const sl = (DB.sleepLog || {})[k];
    const done = {}; let req = 0, dn = 0;
    HABITS.forEach(h => {
      if (!isDayActive(h, d)) { done[h.id] = null; return; }
      const ok = isHabitDoneOn(h, k, d); done[h.id] = ok;
      if (isRequiredHabit(h)) { req++; if (ok) dn++; }
    });
    rows.push({ k, dow: d.getDay(), mood: DB.moods[k] == null ? null : DB.moods[k],
      sleepH: sl ? (sl.hours + (sl.minutes || 0) / 60) : null,
      med: (DB.meditation || {})[k] || 0, rate: req > 0 ? dn / req : null, done });
  }
  return rows;
}
function compareMood(rows, pred) {
  const yes = [], no = [];
  rows.forEach(r => { if (r.mood == null) return; const v = pred(r); if (v == null) return; (v ? yes : no).push(r.mood); });
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes), b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}
function compareRate(rows, pred) {
  const yes = [], no = [];
  rows.forEach(r => { if (r.rate == null) return; const v = pred(r); if (v == null) return; (v ? yes : no).push(r.rate); });
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes), b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}

function computeInsights(rows) {
  const out = [];
  const addMood = (icon, text, c, minDiff) => {
    if (!c || Math.abs(c.diff) < (minDiff || 0.3)) return;
    out.push({ icon, text, delta: `${c.diff > 0 ? '+' : '−'}${f1(Math.abs(c.diff))}`, good: c.diff > 0, n: c.n, score: Math.abs(c.diff) });
  };
  liveHabits().forEach(h => {
    if (h.type === 'weekly') return;
    const c = compareMood(rows, r => r.done[h.id]);
    const nm = `« ${esc(h.name)} »`;
    const verb = h.type === 'bad' ? `évites ${nm}` : (h.type === 'counter' || h.type === 'drink') ? `atteins ton objectif ${nm}` : `fais ${nm}`;
    addMood(esc(h.emoji || '⭐'), `Les jours où tu ${verb}, ton humeur moyenne est de <b>${c ? f1(c.a) : ''}</b> (contre ${c ? f1(c.b) : ''} sinon).`, c);
  });
  addMood('😴', (() => { const c = compareMood(rows, r => r.sleepH == null ? null : r.sleepH >= 7);
    return c ? `Après une nuit d’au moins 7 h, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.sleepH == null ? null : r.sleepH >= 7));
  addMood('🧘', (() => { const c = compareMood(rows, r => r.med > 0);
    return c ? `Les jours où tu médites, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.med > 0));
  addMood('📈', (() => { const c = compareMood(rows, r => r.rate == null ? null : r.rate >= 0.8);
    return c ? `Quand tu valides au moins 80 % de tes habitudes, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.rate == null ? null : r.rate >= 0.8));

  const cr = compareRate(rows, r => r.sleepH == null ? null : r.sleepH >= 7);
  if (cr && Math.abs(cr.diff) >= 0.08) {
    out.push({ icon: '🌙', text: `Après une nuit de 7 h ou plus, tu valides <b>${Math.round(cr.a * 100)} %</b> de tes habitudes (contre ${Math.round(cr.b * 100)} %).`,
      delta: `${cr.diff > 0 ? '+' : '−'}${Math.round(Math.abs(cr.diff) * 100)} pts`, good: cr.diff > 0, n: cr.n, score: Math.abs(cr.diff) * 4 });
  }
  // Meilleur / pire jour de la semaine
  const byDow = {};
  rows.forEach(r => { if (r.mood != null) (byDow[r.dow] = byDow[r.dow] || []).push(r.mood); });
  const dows = Object.entries(byDow).filter(([, v]) => v.length >= 3).map(([d, v]) => ({ d: Number(d), m: avgOf(v), n: v.length }));
  if (dows.length >= 4) {
    dows.sort((a, b) => b.m - a.m);
    const best = dows[0], worst = dows[dows.length - 1];
    if (best.m - worst.m >= 0.5) {
      out.push({ icon: '📅', text: `Ton jour le plus lumineux est le <b>${DAY_FULL[best.d].toLowerCase()}</b> (${f1(best.m)}), le plus difficile le <b>${DAY_FULL[worst.d].toLowerCase()}</b> (${f1(worst.m)}).`,
        delta: '', good: true, n: dows.reduce((s, x) => s + x.n, 0), score: (best.m - worst.m) * 0.7 });
    }
  }
  return out.filter(x => x.text).sort((a, b) => b.score - a.score).slice(0, 6);
}

function buildInsightsHtml() {
  const rows = insightRows(INSIGHT_DAYS);
  const moods = rows.filter(r => r.mood != null);
  let body;
  if (moods.length < 7) {
    body = `<div class="insight-empty">Il faut au moins 7 jours d’humeur renseignée pour dégager des tendances.
      <div class="insight-progress">${progressBar(Math.round(moods.length / 7 * 100), 'Jours d’humeur renseignés')}<span>${moods.length} / 7 jours</span></div></div>`;
  } else {
    const list = computeInsights(rows);
    const mean = avgOf(moods.map(r => r.mood));
    const head = `<div class="insight-summary">Humeur moyenne : <b>${f1(mean)}</b> / 5 sur ${moods.length} jours renseignés</div>`;
    body = head + (list.length
      ? list.map(x => `<div class="insight-row">
          <div class="insight-ico" aria-hidden="true">${x.icon}</div>
          <div class="insight-main"><div class="insight-text">${x.text}</div><div class="insight-n">sur ${x.n} jours</div></div>
          ${x.delta ? `<div class="insight-delta ${x.good ? 'up' : 'down'}">${x.delta}</div>` : ''}
        </div>`).join('')
      : `<div class="insight-empty">Rien de marquant pour l’instant. Continue à renseigner ton humeur : les tendances apparaissent avec le temps.</div>`);
  }
  return `<div class="report-card" id="insightsCard">
    <div class="report-card-header">
      <div class="report-card-title">Insights</div>
      <div class="report-period-badge">${INSIGHT_DAYS} derniers jours</div>
    </div>
    ${body}
    <div class="insight-note">Ce sont des corrélations, pas des causes.</div>
  </div>`;
}