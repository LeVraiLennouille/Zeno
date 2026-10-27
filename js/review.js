/* HabitsTracker · Bilan hebdomadaire du lundi
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* XP gagnée par semaine (clé = lundi), conservée sur ~20 semaines. */
function addWeekXp(amount) {
  if (!(amount > 0)) return;
  if (!DB.xpWeek) DB.xpWeek = {};
  const wk = getWeekMonday(appNow());
  DB.xpWeek[wk] = (DB.xpWeek[wk] || 0) + amount;
  const keys = Object.keys(DB.xpWeek).sort();
  while (keys.length > 20) delete DB.xpWeek[keys.shift()];
}

// Exécute fn quand plus aucune fenêtre n'est ouverte (évite d'empiler bilan et invite d'humeur).
function whenNoDialog(fn, delay) {
  let tries = 0;
  const attempt = () => {
    if (_dialogStack.length > 0 && tries++ < 400) { setTimeout(attempt, 800); return; }
    fn();
  };
  setTimeout(attempt, delay || 0);
}

const lastWeekMonday = () => fmtDate(addDays(parseDate(getWeekMonday(appNow())), -7));
const mondayLabel = mon => { const a = parseDate(mon), b = addDays(a, 6); return `${a.getDate()} ${MONTH_SHORT[a.getMonth()].toLowerCase()} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()].toLowerCase()}`; };

/* Données d'une semaine (mon = lundi, 'AAAA-MM-JJ'). Les habitudes « X fois / semaine » comptent pour
 * leur objectif de séances ; les autres, jour par jour (habitudes optionnelles exclues du score). */
function weekReviewData(mon) {
  const start = parseDate(mon), todayKey = today();
  let req = 0, done = 0, activeDays = 0;
  const perHabit = {}, perDay = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i), k = fmtDate(d);
    if (k > todayKey) break;
    let dr = 0, dd = 0;
    HABITS.forEach(h => {
      if (!isRequiredHabit(h) || !isDayActive(h, d) || k < DB.createdAt) return;
      dr++;
      const ok = getHabitDayValue(h, k, d) >= 1;
      if (ok) dd++;
      const ph = perHabit[h.id] || (perHabit[h.id] = { h, req: 0, done: 0 });
      ph.req++; if (ok) ph.done++;
    });
    req += dr; done += dd; if (dr > 0) activeDays++;
    perDay.push({ k, d, req: dr, done: dd, rate: dr ? dd / dr : null });
  }
  HABITS.forEach(h => {
    if (h.type !== 'times' || h.optional) return;
    const info = timesWeekInfo(h, mon);
    if (info.required > 0) {
      const dn = Math.min(info.done, info.required);
      req += info.required; done += dn;
      perHabit[h.id] = { h, req: info.required, done: dn, times: true, count: info.done };
    }
  });
  const rate = req > 0 ? done / req : null;
  const ranked = perDay.filter(x => x.rate != null).sort((a, b) => b.rate - a.rate);
  const best = ranked.length ? ranked[0] : null;
  const forgotten = Object.values(perHabit).filter(p => p.req >= (p.times ? 1 : 3) && p.done < p.req)
    .sort((a, b) => (a.done / a.req) - (b.done / b.req) || (b.req - b.done) - (a.req - a.done))[0] || null;
  const monEnd = fmtDate(addDays(start, 6));
  const moods = Object.keys(DB.moods).filter(k => k >= mon && k <= monEnd).map(k => DB.moods[k]);
  return { mon, req, done, rate, activeDays, perDay, best, forgotten,
    perfect: (DB.perfectDaysClaimed || []).filter(k => k >= mon && k <= monEnd).length,
    xp: (DB.xpWeek || {})[mon], moodAvg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null, moodN: moods.length };
}
function bestStreakNow() {
  let best = null;
  liveHabits().forEach(h => {
    const n = calcStreak(h).current; if (n <= 0) return;
    const days = n * (weeklyUnit(h) ? 7 : 1);
    if (!best || days > best.days) best = { h, n, days };
  });
  return best;
}
function verdictFor(rate) {
  if (rate == null) return 'Semaine calme';
  if (rate >= 0.9) return 'Semaine exceptionnelle';
  if (rate >= 0.7) return 'Belle semaine';
  if (rate >= 0.5) return 'Semaine correcte';
  return 'Semaine difficile : on repart du bon pied';
}

/* ── Affichage ── */
let reviewMon = null;
function reviewSummaryText(r, prev) {
  const lines = [`Bilan HabitsTracker · ${mondayLabel(r.mon)}`, `Score : ${r.rate == null ? '–' : Math.round(r.rate * 100) + ' %'}${prev != null && r.rate != null ? ` (${Math.round(r.rate * 100) - Math.round(prev * 100) >= 0 ? '+' : ''}${Math.round(r.rate * 100) - Math.round(prev * 100)} pts)` : ''}`];
  const bs = bestStreakNow(); if (bs) lines.push(`Meilleure série : ${bs.h.name} · ${streakWords(bs.h, bs.n)}`);
  if (r.xp != null) lines.push(`XP : +${r.xp}`);
  lines.push(`Journées parfaites : ${r.perfect}`);
  if (r.forgotten) lines.push(`À retravailler : ${r.forgotten.h.name} (${r.forgotten.done}/${r.forgotten.req})`);
  return lines.join('\n');
}
function renderReview(mon) {
  const el = document.getElementById('reviewBody'); if (!el) return;
  const r = weekReviewData(mon);
  const prevMon = fmtDate(addDays(parseDate(mon), -7));
  const prev = weekReviewData(prevMon).rate;
  const pct = r.rate == null ? null : Math.round(r.rate * 100);
  const diff = (pct != null && prev != null) ? pct - Math.round(prev * 100) : null;
  const bs = bestStreakNow();
  const s = seasonOf(appNow()), sr = seasonRank(currentSeasonXp());
  const moodTile = r.moodAvg == null ? '–' : `${MOOD_EMOJIS[Math.round(r.moodAvg)]} ${f1(r.moodAvg)}`;
  const f = r.forgotten;
  const canChallenge = f && chalCandidates().some(x => x.id === f.h.id);
  document.getElementById('reviewRange').textContent = mondayLabel(mon);
  el.innerHTML = `
    <div class="rv-hero">
      <div class="rv-score" aria-label="Score de la semaine : ${pct == null ? 'indisponible' : pct + ' pour cent'}">${pct == null ? '–' : pct}<span>%</span></div>
      ${diff == null ? '' : `<div class="rv-delta ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${diff > 0 ? '+' : diff < 0 ? '−' : '='}${Math.abs(diff)} pts <small>vs semaine précédente</small></div>`}
      <div class="rv-verdict">${verdictFor(r.rate)}</div>
      <div class="rv-sub">${r.done} / ${r.req} objectifs atteints</div>
    </div>
    <div class="rv-grid">
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">🔥</div><div class="rv-val">${bs ? esc(streakWords(bs.h, bs.n)) : '–'}</div><div class="rv-lab">${bs ? 'Meilleure série · ' + esc(bs.h.name) : 'Meilleure série'}</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">⚡</div><div class="rv-val">${r.xp != null ? '+' + fmtNum(r.xp) : '–'}</div><div class="rv-lab">XP gagnée</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">⭐</div><div class="rv-val">${r.perfect} / 7</div><div class="rv-lab">Journées parfaites</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">😊</div><div class="rv-val">${moodTile}</div><div class="rv-lab">Humeur moyenne</div></div>
    </div>
    <div class="rv-season">
      <div class="rv-season-top"><span class="rv-season-emoji" aria-hidden="true">${s.def.emoji}</span><div><div class="rv-season-label">Saison · ${esc(s.label)}</div><div class="rv-season-rank">Rang ${sr.roman} · ${sr.name}</div></div></div>
      <div class="season-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${sr.pct}" aria-label="Progression vers le rang suivant"><div style="width:${sr.pct}%"></div></div>
      <div class="rv-season-foot">${sr.next ? `encore ${fmtNum(sr.needed)} XP pour le rang ${ROMAN[sr.index + 1]}` : 'Rang maximal atteint !'}</div>
    </div>
    <div class="rv-sec">
      ${f ? `<div class="rv-sec-title">À retravailler</div>
        <div class="rv-forgot"><span class="rv-forgot-emoji" aria-hidden="true">${habitIconMarkup(f.h)}</span>
          <div class="rv-forgot-txt"><b>${esc(f.h.name)}</b><span>${f.times ? `${f.count} séance${f.count > 1 ? 's' : ''} sur ${f.h.target}` : `${f.done} jour${f.done > 1 ? 's' : ''} sur ${f.req}`}</span></div>
          ${canChallenge ? `<button type="button" class="pref-edit" onclick="startChallengeFor('${f.h.id}')">Lancer un défi</button>` : ''}</div>`
        : `<div class="rv-sec-title">À retravailler</div><div class="rv-perfect">${r.req > 0 ? 'Rien à signaler : tout est tenu. Bravo !' : 'Pas assez de données cette semaine.'}</div>`}
      ${r.best ? `<div class="rv-best">Meilleur jour : <b>${DAY_FULL[r.best.d.getDay()].toLowerCase()}</b> · ${Math.round(r.best.rate * 100)} %</div>` : ''}
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="closeReview()">C’est reparti pour la semaine</button>
      <button type="button" class="hf-archive-btn" onclick="copyReview('${mon}')">Copier le résumé</button>
    </div>`;
}
function openReview(mon, auto) {
  mon = mon || lastWeekMonday(); reviewMon = mon;
  renderReview(mon);
  const card = document.querySelector('#reviewModal .modal-card'); if (card) card.scrollTop = 0;
  document.getElementById('reviewModal').classList.add('open');
  if (auto) { DB.profile.reviewedWeek = mon; saveData(); }
}
function closeReview() { reviewMon = null; document.getElementById('reviewModal').classList.remove('open'); }
function copyReview(mon) {
  const r = weekReviewData(mon), p = weekReviewData(fmtDate(addDays(parseDate(mon), -7))).rate;
  const text = reviewSummaryText(r, p);
  const ok = () => showToast('Résumé copié', 2200, 'star'), ko = () => showToast('Copie impossible sur cet appareil', 3000, 'alert');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, ko); else ko();
}
function startChallengeFor(id) {
  closeReview();
  setTimeout(() => { openChallengeForm(); if (cf && chalCandidates().some(x => x.id === id)) { cf.habitId = id; cf.titleTouched = false; renderChallengeForm(); } }, 250);
}

/* ── Déclenchement automatique : une fois par semaine, au premier lancement après la fin de la semaine ── */
function reviewDue() {
  if (DB.profile.weeklyReview === false) return false;
  const mon = lastWeekMonday();
  if (DB.profile.reviewedWeek && DB.profile.reviewedWeek >= mon) return false;
  if (fmtDate(addDays(parseDate(mon), 6)) < DB.createdAt) return false;     // l'app n'existait pas encore
  const d = weekReviewData(mon);
  return d.req > 0 && d.activeDays >= 3;                                     // assez de données pour être utile
}
function maybeShowWeeklyReview() {
  if (!reviewDue()) return;
  const mon = lastWeekMonday();
  whenNoDialog(() => { if (reviewDue() && lastWeekMonday() === mon) openReview(mon, true); }, 1200);
}

/* ── Carte dans le Rapport ── */
function buildReviewCardHtml() {
  const mon = lastWeekMonday(), r = weekReviewData(mon);
  const pct = r.rate == null ? '–' : Math.round(r.rate * 100) + ' %';
  return `<div class="report-card" id="reviewCard">
    <div class="report-card-header"><div class="report-card-title">Bilan hebdomadaire</div><div class="report-period-badge">${mondayLabel(mon)}</div></div>
    <div class="rv-mini"><div class="rv-mini-score">${pct}</div><div class="rv-mini-txt">${verdictFor(r.rate)}<br><small>semaine dernière</small></div>
      <button type="button" class="pref-edit" onclick="openReview()">Ouvrir le bilan</button></div>
  </div>`;
}