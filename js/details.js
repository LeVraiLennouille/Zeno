/* HabitsTracker · Fiche détaillée d'une habitude
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* Grille annuelle, meilleure série, jour de la semaine le plus fort, évolution sur 26 semaines,
 * lien avec l'humeur. Tout est calculé à partir de l'historique existant. */
let detailId = null, detailYear = null;
const DETAIL_TREND_WEEKS = 26, DETAIL_DOW_DAYS = 84;

function openHabitDetail(id) {
  const h = HABITS.find(x => x.id === id); if (!h) return;
  detailId = id; detailYear = appNow().getFullYear();
  renderHabitDetail();
  const card = document.querySelector('#detailModal .modal-card'); if (card) card.scrollTop = 0;
  document.getElementById('detailModal').classList.add('open');
  setTimeout(drawDetailChart, 80);
}
function closeHabitDetail() { detailId = null; document.getElementById('detailModal').classList.remove('open'); }
function detailEdit() { const id = detailId; closeHabitDetail(); if (id) setTimeout(() => openHabitForm(id), 50); }
function detailYearNav(delta) {
  const y = detailYear + delta, minY = parseDate(DB.createdAt).getFullYear();
  if (y > appNow().getFullYear() || y < minY) return;
  detailYear = y; renderHabitDetail(); setTimeout(drawDetailChart, 30);
}

/* ── État d'une journée pour la grille ── */
function detailCell(h, d) {
  const k = fmtDate(d), logs = (DB.habits[h.id] || { logs: {} }).logs;
  if (k > today()) return { c: 'future', t: '' };
  if (k < DB.createdAt) return { c: 'none', t: '' };
  if (isPaused(k)) return { c: 'paused', t: 'pause' };
  if (!isDayActive(h, d)) return { c: 'off', t: 'inactif' };
  if (h.type === 'bad') { const f = isBadFail(h.id, k); const v = badVal(h.id, k); return f ? { c: 'fail', t: 'craqué' + (v ? ` (${v})` : '') } : { c: 'done', t: 'tenu bon' }; }
  if (h.type === 'weekly' || h.type === 'times') return logs[k] === 'done' ? { c: 'done', t: 'fait' } : { c: 'rest', t: '–' };
  const v = getHabitDayValue(h, k, d);
  if (v >= 1) return { c: 'done', t: 'objectif atteint' };
  if (v > 0) return { c: 'part', t: `${Math.round(v * 100)} %`, a: v };
  return { c: 'miss', t: 'manqué' };
}
function detailGridHtml(h, year) {
  const jan1 = new Date(year, 0, 1), dec31 = new Date(year, 11, 31);
  const start = parseDate(getWeekMonday(jan1));
  const weeks = Math.round((parseDate(getWeekMonday(dec31)) - start) / 604800000) + 1;
  let cells = '', months = '', doneCount = 0;
  for (let w = 0; w < weeks; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const d = addDays(start, w * 7 + dow);
      if (d.getFullYear() !== year) { cells += `<i class="dg-cell dg-blank"></i>`; continue; }
      const c = detailCell(h, d);
      if (c.c === 'done') doneCount++;
      const style = c.a ? ` style="--a:${c.a.toFixed(2)}"` : '';
      cells += `<i class="dg-cell dg-${c.c}"${style}${c.t ? ` title="${fmtDay(fmtDate(d))} · ${esc(c.t)}"` : ''}></i>`;
      if (d.getDate() === 1) months += `<span style="grid-column:${w + 1}">${MONTH_SHORT[d.getMonth()].slice(0, 3)}</span>`;
    }
  }
  return { html: `<div class="dg-scroll" id="dgScroll" tabindex="0" role="group" aria-label="Grille annuelle ${year} : ${doneCount} jour${doneCount > 1 ? 's' : ''} réussi${doneCount > 1 ? 's' : ''}">
      <div class="dg-inner" style="--weeks:${weeks};--hc:${h.color}">
        <div class="dg-months" style="grid-template-columns:repeat(${weeks},var(--dg-cell))">${months}</div>
        <div class="dg-grid">${cells}</div>
      </div></div>`, doneCount };
}

/* ── Statistiques ── */
function detailTotals(h) {
  const logs = (DB.habits[h.id] || { logs: {} }).logs;
  const st = calcStreak(h);
  const doneDays = Object.keys(logs).filter(k => logs[k] === 'done').length;
  const todayD = appNow(); todayD.setHours(0, 0, 0, 0);
  // taux sur 30 jours (ou 8 semaines pour les habitudes hebdomadaires)
  let rate = null, rateLabel = 'Taux sur 30 jours';
  if (h.type === 'times') { const w = timesRangeStats(h, addDays(todayD, -55), todayD); rate = w.tot ? Math.round(w.ok / w.tot * 100) : null; rateLabel = 'Semaines réussies (8 dern.)'; }
  else if (h.type === 'weekly') {
    let ok = 0, tot = 0;
    for (let o = 0; o < 8; o++) { const wm = fmtDate(addDays(parseDate(getWeekMonday(todayD)), -o * 7)); if (wm < DB.createdAt && o > 0) break; tot++; if (isWeeklyDoneForWeek(h.id, wm)) ok++; }
    rate = tot ? Math.round(ok / tot * 100) : null; rateLabel = 'Semaines faites (8 dern.)';
  } else {
    let req = 0, done = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(todayD, -i), k = fmtDate(d);
      if (k < DB.createdAt || !isDayActive(h, d)) continue;
      req++; done += Math.min(1, getHabitDayValue(h, k, d));
    }
    rate = req ? Math.round(done / req * 100) : null;
  }
  let t4;
  if (h.type === 'counter' || h.type === 'drink') {
    const sum = Object.values(logs).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
    t4 = [`${fmtNum(Math.round(sum * 10) / 10)} ${esc(h.type === 'drink' ? 'ml' : (h.unit || ''))}`.trim(), 'Total cumulé'];
  } else if (h.type === 'bad') t4 = [String(Object.keys(logs).filter(k => logs[k] === 'fail').length), 'Craquages'];
  else if (h.type === 'times' || h.type === 'weekly') t4 = [String(doneDays), h.type === 'times' ? 'Séances au total' : 'Fois au total'];
  else t4 = [String(doneDays), 'Jours réussis'];
  return { cur: st.current, best: st.longest, rate, rateLabel, t4 };
}
function detailWeekdays(h) {
  const todayD = appNow(); todayD.setHours(0, 0, 0, 0);
  const acc = Array.from({ length: 7 }, () => ({ req: 0, done: 0 }));
  for (let i = 0; i < DETAIL_DOW_DAYS; i++) {
    const d = addDays(todayD, -i), k = fmtDate(d);
    if (k < DB.createdAt || !isDayActive(h, d)) continue;
    const idx = (d.getDay() + 6) % 7;
    acc[idx].req++;
    let ok;
    if (h.type === 'bad') ok = !isBadFail(h.id, k);
    else if (h.type === 'weekly' || h.type === 'times') ok = (DB.habits[h.id].logs[k] === 'done');
    else ok = getHabitDayValue(h, k, d) >= 1;
    if (ok) acc[idx].done++;
  }
  return acc.map((a, i) => ({ label: DAY_SHORT[i], rate: a.req >= 3 ? Math.round(a.done / a.req * 100) : null, n: a.req }));
}
function detailTrend(h) {
  const todayD = appNow(); todayD.setHours(0, 0, 0, 0);
  const cwm = parseDate(getWeekMonday(todayD)); const pts = [];
  for (let o = DETAIL_TREND_WEEKS - 1; o >= 0; o--) {
    const ws = addDays(cwm, -o * 7), wk = fmtDate(ws);
    let v = null;
    if (fmtDate(addDays(ws, 6)) >= DB.createdAt) {
      if (h.type === 'times') { const i = timesWeekInfo(h, wk); v = i.required > 0 ? Math.round(Math.min(1, i.done / i.required) * 100) : null; }
      else if (h.type === 'weekly') { v = isWeeklyDoneForWeek(h.id, wk) ? 100 : 0; }
      else {
        let req = 0, done = 0;
        for (let i = 0; i < 7; i++) {
          const d = addDays(ws, i), k = fmtDate(d);
          if (k > today() || k < DB.createdAt || !isDayActive(h, d)) continue;
          req++; done += h.type === 'bad' ? (isBadFail(h.id, k) ? 0 : 1) : Math.min(1, getHabitDayValue(h, k, d));
        }
        v = req ? Math.round(done / req * 100) : null;
      }
    }
    pts.push({ label: `${ws.getDate()}/${ws.getMonth() + 1}`, showLabel: o % 5 === 0, v });
  }
  return pts;
}
// La grille est plus large que l'écran : on l'ouvre sur la période en cours (année courante) plutôt que sur janvier.
function positionDetailGrid() {
  const sc = document.getElementById('dgScroll'); if (!sc) return;
  if (detailYear === appNow().getFullYear()) {
    const col = Math.round((parseDate(getWeekMonday(appNow())) - parseDate(getWeekMonday(new Date(detailYear, 0, 1)))) / 604800000);
    sc.scrollLeft = Math.max(0, (col + 1) * 15 - sc.clientWidth + 36);
  } else sc.scrollLeft = 0;
}
function drawDetailChart() {
  const h = HABITS.find(x => x.id === detailId); if (!h) return;
  positionDetailGrid();
  drawLineChart('detailChart', detailTrend(h));
}

function renderHabitDetail() {
  const el = document.getElementById('detailBody'); if (!el) return;
  const h = HABITS.find(x => x.id === detailId); if (!h) return;
  const tt = detailTotals(h), grid = detailGridHtml(h, detailYear), dow = detailWeekdays(h);
  document.getElementById('detailTitle').textContent = h.name;
  const rated = dow.filter(x => x.rate != null);
  let dowText = 'Pas encore assez de données (3 jours par jour de la semaine).';
  if (rated.length >= 4) {
    const best = rated.reduce((a, b) => b.rate > a.rate ? b : a), worst = rated.reduce((a, b) => b.rate < a.rate ? b : a);
    const full = x => DAY_FULL[(DAY_SHORT.indexOf(x.label) + 1) % 7].toLowerCase();
    dowText = h.type === 'bad'
      ? `Ton jour le plus solide : <b>${full(best)}</b> (${best.rate} %) · le plus risqué : <b>${full(worst)}</b> (${worst.rate} %).`
      : best.rate === worst.rate ? 'Régulier toute la semaine.'
      : `Ton jour fort : <b>${full(best)}</b> (${best.rate} %) · le plus faible : <b>${full(worst)}</b> (${worst.rate} %).`;
  }
  const maxRate = Math.max(1, ...dow.map(x => x.rate || 0));
  const bars = dow.map(x => `<div class="dw-col" title="${x.rate == null ? 'pas assez de données' : x.rate + ' %'}">
      <div class="dw-bar"><i style="height:${x.rate == null ? 0 : Math.max(4, Math.round(x.rate / maxRate * 100))}%"></i></div>
      <div class="dw-val">${x.rate == null ? '–' : x.rate}</div><div class="dw-lab">${x.label[0]}</div></div>`).join('');
  // lien avec l'humeur
  let moodHtml = '';
  if (h.type !== 'weekly') {
    const c = compareMood(insightRows(120), r => r.done[h.id]);
    if (c && Math.abs(c.diff) >= 0.2) moodHtml = `<div class="dt-mood"><span aria-hidden="true">${MOOD_EMOJIS[Math.round(c.a)] || '😐'}</span><div>Humeur moyenne les jours où c’est fait : <b>${f1(c.a)}</b> (contre ${f1(c.b)} sinon), sur ${c.n} jours.</div></div>`;
  }
  // paliers des habitudes à éviter
  let levelsHtml = '';
  if (h.type === 'bad' && h.levels) {
    const vals = (DB.habits[h.id] || {}).vals || {}; const count = {};
    Object.keys(vals).forEach(k => { count[vals[k]] = (count[vals[k]] || 0) + 1; });
    const rows = h.levels.filter(l => count[l]).map(l => `<span class="dt-chip">${esc(l)} <b>${count[l]}×</b></span>`).join('');
    if (rows) levelsHtml = `<div class="dt-levels"><div class="dt-sub">Répartition des écarts</div>${rows}</div>`;
  }
  const canPrev = detailYear > parseDate(DB.createdAt).getFullYear(), canNext = detailYear < appNow().getFullYear();
  el.innerHTML = `
    <div class="dt-head" style="--ink:${h.color}">
      <div class="dt-emoji">${habitIconMarkup(h)}</div>
      <div class="dt-head-txt"><div class="dt-name">${esc(h.name)}</div><div class="dt-freq">${esc(h.freq || 'Tous les jours')}${h.archived ? ' · archivée' : ''}</div></div>
    </div>
    <div class="dt-tiles">
      <div class="dt-tile"><div class="dt-val">${esc(streakLabel(h, tt.cur))}</div><div class="dt-lab">Série en cours</div></div>
      <div class="dt-tile"><div class="dt-val">${esc(streakLabel(h, tt.best))}</div><div class="dt-lab">Meilleure série</div></div>
      <div class="dt-tile"><div class="dt-val">${tt.rate == null ? '–' : tt.rate + ' %'}</div><div class="dt-lab">${tt.rateLabel}</div></div>
      <div class="dt-tile"><div class="dt-val">${tt.t4[0]}</div><div class="dt-lab">${tt.t4[1]}</div></div>
    </div>
    ${moodHtml}${levelsHtml}
    <div class="dt-section">
      <div class="dt-section-head"><div class="dt-section-title">Grille ${detailYear}</div>
        <div class="dt-nav"><button type="button" class="mood-cal-nav-btn" onclick="detailYearNav(-1)" aria-label="Année précédente"${canPrev ? '' : ' disabled'}><svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg></button>
        <button type="button" class="mood-cal-nav-btn" onclick="detailYearNav(1)" aria-label="Année suivante"${canNext ? '' : ' disabled'}><svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg></button></div></div>
      ${grid.html}
      <div class="dg-legend"><span><i class="dg-cell dg-done" style="--hc:${h.color}"></i> fait</span><span><i class="dg-cell dg-part" style="--hc:${h.color};--a:.5"></i> partiel</span><span><i class="dg-cell dg-miss"></i> manqué</span><span><i class="dg-cell dg-paused"></i> pause</span></div>
    </div>
    <div class="dt-section">
      <div class="dt-section-title">Jour de la semaine</div>
      <div class="dw-chart" style="--hc:${h.color}" role="img" aria-label="Taux de réussite par jour de la semaine">${bars}</div>
      <div class="dt-text">${dowText}</div>
    </div>
    <div class="dt-section">
      <div class="dt-section-title">Évolution · ${DETAIL_TREND_WEEKS} semaines</div>
      <canvas id="detailChart" height="160" role="img" aria-label="Évolution hebdomadaire"></canvas>
    </div>
    <div class="hf-actions"><button type="button" class="modal-save-btn" onclick="detailEdit()">Modifier l’habitude</button></div>`;
}