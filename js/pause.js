/* HabitsTracker · Jours de pause (jokers)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Pauses (jours de repos) ═══════════ */
const PAUSE_REASONS = [
  ['sick','🤒','Malade'], ['trip','✈️','Voyage'], ['tired','😴','Épuisé'],
  ['work','💼','Trop de travail'], ['party','🎉','Soirée'], ['other','❓','Autre'],
];
const pauseReasonInfo = id => PAUSE_REASONS.find(r => r[0] === id) || PAUSE_REASONS[5];
const PAUSE_PAST_DAYS = 7;     // on peut justifier jusqu'à 7 jours en arrière
const PAUSE_FUTURE_DAYS = 30;  // et en planifier jusqu'à 30 jours à l'avance
const PAUSE_MAX_RANGE = 14;

function isPaused(k) { return !!(DB.pauses && DB.pauses[k]); }
function pauseQuota() { const q = DB.profile.pauseQuota; return Number.isFinite(q) ? q : 3; }
function pausesInMonth(ym) { return Object.keys(DB.pauses || {}).filter(k => k.startsWith(ym)).length; }
function pausesLeft(ym) { return Math.max(0, pauseQuota() - pausesInMonth(ym)); }
function weekPausedCount(wm) {
  const s = parseDate(wm); let n = 0;
  for (let i = 0; i < 7; i++) if (isPaused(fmtDate(addDays(s, i)))) n++;
  return n;
}
function pausedDayNote() {
  return `<div class="empty-note pause-note"><span class="pause-note-ico">⏸</span><br>Jour de pause<br>Tes séries sont gelées. Profite de ta journée.</div>`;
}

function renderPauseBanner() {
  const el = document.getElementById('pauseBanner'); if (!el) return;
  const t = today(); const p = (DB.pauses || {})[t];
  if (p) {
    const r = pauseReasonInfo(p.reason);
    el.innerHTML = `<div class="pause-banner"><span class="pause-ico" aria-hidden="true">⏸</span>
      <div class="pause-txt"><b>Jour de pause</b><span>${r[1]} ${r[2]} · séries gelées</span></div>
      <button type="button" class="pause-btn" onclick="removePause('${t}')">Reprendre</button></div>`;
    return;
  }
  const q = pauseQuota();
  if (q === 0 && Object.keys(DB.pauses || {}).length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `<button type="button" class="pause-pill" onclick="openPause()">⏸ Pause <span>${pausesLeft(t.slice(0, 7))}/${q} ce mois-ci</span></button>`;
}

let pf = null; // {from,to,reason}
function pauseBounds() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let min = addDays(t, -PAUSE_PAST_DAYS);
  const created = parseDate(DB.createdAt);
  if (created > min) min = created;
  return { min: fmtDate(min), max: fmtDate(addDays(t, PAUSE_FUTURE_DAYS)) };
}
function openPause(dateKey) {
  const t = dateKey || today();
  pf = { from: t, to: t, reason: 'sick' };
  renderPauseForm();
  document.querySelector('#pauseModal .modal-card').scrollTop = 0;
  document.getElementById('pauseModal').classList.add('open');
}
function closePause() { pf = null; document.getElementById('pauseModal').classList.remove('open'); }
function pfSet(key, val) {
  if (!pf) return;
  pf[key] = val;
  if (pf.to < pf.from) pf.to = pf.from;
  renderPauseForm();
}
function pfPreset(kind) {
  if (!pf) return;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const k = fmtDate(kind === 'yesterday' ? addDays(t, -1) : t);
  pf.from = k; pf.to = k; renderPauseForm();
}
function pauseRangeDays() {
  if (!pf || !pf.from || !pf.to) return [];
  const out = []; let d = parseDate(pf.from); const end = parseDate(pf.to);
  for (let i = 0; i < 40 && d <= end; i++) { out.push(fmtDate(d)); d = addDays(d, 1); }
  return out;
}
function pauseMonthSummary() {
  const days = pauseRangeDays().filter(k => !isPaused(k));
  const byMonth = {};
  days.forEach(k => { const ym = k.slice(0, 7); byMonth[ym] = (byMonth[ym] || 0) + 1; });
  return { days, byMonth };
}

function renderPauseForm() {
  const el = document.getElementById('pauseFormBody'); if (!el || !pf) return;
  const b = pauseBounds();
  const { days, byMonth } = pauseMonthSummary();
  const q = pauseQuota();
  const ymNow = pf.from.slice(0, 7);
  const left = pausesLeft(ymNow);
  const [yy, mm] = ymNow.split('-').map(Number);
  const monthLbl = MONTH_NAMES[mm - 1].toLowerCase();
  let status;
  const over = Object.entries(byMonth).find(([ym, n]) => n > pausesLeft(ym));
  if (days.length === 0) status = `<span class="pf-ok">Ces jours sont déjà en pause.</span>`;
  else if (over) status = `<span class="pf-bad">Quota dépassé : il reste ${pausesLeft(over[0])} jour(s) de pause en ${MONTH_NAMES[Number(over[0].slice(5)) - 1].toLowerCase()}.</span>`;
  else status = `<span class="pf-ok">${days.length} jour${days.length > 1 ? 's' : ''} de pause · il restera ${Math.max(0, left - (byMonth[ymNow] || 0))}/${q} en ${monthLbl}.</span>`;

  const list = Object.keys(DB.pauses || {}).filter(k => k >= fmtDate(addDays(parseDate(today()), -PAUSE_PAST_DAYS))).sort();
  const listHtml = list.length ? `<div class="modal-section"><label class="modal-label">Pauses récentes et à venir</label>
      <div class="pf-list">${list.map(k => {
        const r = pauseReasonInfo(DB.pauses[k].reason); const d = parseDate(k);
        return `<div class="pf-item"><span>${r[1]} ${DAY_FULL[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()} · ${r[2]}</span>
          <button type="button" class="pf-del" onclick="removePause('${k}', true)" aria-label="Retirer la pause du ${k}">${icon('trash')}</button></div>`;
      }).join('')}</div></div>` : '';

  el.innerHTML = `
    <div class="modal-section">
      <div class="hf-hint" style="margin:0 0 12px">Une pause <b>gèle tes séries</b> : ces jours ne comptent ni comme réussis, ni comme manqués.</div>
      <div class="hf-presets" style="margin:0 0 12px">
        <button type="button" class="hf-link" onclick="pfPreset('today')">Aujourd’hui</button>
        <button type="button" class="hf-link" onclick="pfPreset('yesterday')">Hier</button>
      </div>
      <div class="hf-num-grid">
        <div class="hf-num-field"><label for="pfFrom">Du</label>
          <input id="pfFrom" class="sleep-time-input" type="date" min="${b.min}" max="${b.max}" value="${pf.from}" onchange="pfSet('from',this.value||pf.from)"></div>
        <div class="hf-num-field"><label for="pfTo">Au</label>
          <input id="pfTo" class="sleep-time-input" type="date" min="${pf.from}" max="${b.max}" value="${pf.to}" onchange="pfSet('to',this.value||pf.to)"></div>
      </div>
      <div class="hf-hint pf-status" role="status">${status}</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Raison</label>
      <div class="pf-reasons" role="group" aria-label="Raison de la pause">
        ${PAUSE_REASONS.map(r => `<button type="button" class="hf-chip pf-reason${pf.reason === r[0] ? ' selected' : ''}" aria-pressed="${pf.reason === r[0]}" onclick="pfSet('reason','${r[0]}')"><span>${r[1]}</span><b>${r[2]}</b></button>`).join('')}
      </div>
    </div>
    ${listHtml}
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="savePause()">Prendre une pause</button>
    </div>`;
}

function savePause() {
  if (!pf) return;
  const b = pauseBounds();
  const all = pauseRangeDays();
  if (all.length === 0) return;
  if (all.length > PAUSE_MAX_RANGE) { showToast(`Une pause dure ${PAUSE_MAX_RANGE} jours maximum`, 3000, 'alert'); return; }
  if (all.some(k => k < b.min || k > b.max)) { showToast('Date hors de la période autorisée', 3000, 'alert'); return; }
  const { days, byMonth } = pauseMonthSummary();
  if (days.length === 0) { showToast('Ces jours sont déjà en pause', 2500, 'alert'); return; }
  for (const [ym, n] of Object.entries(byMonth)) {
    if (n > pausesLeft(ym)) {
      showToast(`Quota dépassé : ${pausesLeft(ym)} jour(s) restant(s) en ${MONTH_NAMES[Number(ym.slice(5)) - 1].toLowerCase()}`, 3500, 'alert');
      return;
    }
  }
  if (!DB.pauses) DB.pauses = {};
  days.forEach(k => { DB.pauses[k] = { reason: pf.reason }; });
  saveData();
  closePause();
  renderActivePage();
  showToast(`Pause enregistrée · ${days.length} jour${days.length > 1 ? 's' : ''}`, 2800, 'moon');
}
function removePause(k, keepOpen) {
  if (!DB.pauses || !DB.pauses[k]) return;
  delete DB.pauses[k];
  saveData();
  if (keepOpen && pf) renderPauseForm();
  renderActivePage();
  if (!keepOpen) showToast('Pause annulée', 2200);
}
function changePauseQuota(delta) {
  DB.profile.pauseQuota = Math.max(0, Math.min(10, pauseQuota() + delta));
  saveData(); renderAccount();
}
function pauseSectionHtml() {
  const q = pauseQuota(); const ym = today().slice(0, 7); const used = pausesInMonth(ym);
  return `<div>
    <div class="account-section-title">Jours de pause</div>
    <div class="pref-card">
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">⏸</span><div><div class="pref-label-text">Quota mensuel</div><div class="pref-hint">Jours de repos qui gèlent tes séries</div></div></div>
        <div class="stepper" role="group" aria-label="Quota de pauses par mois">
          <button type="button" onclick="changePauseQuota(-1)" aria-label="Moins"${q <= 0 ? ' disabled' : ''}>−</button>
          <span aria-live="polite">${q}</span>
          <button type="button" onclick="changePauseQuota(1)" aria-label="Plus"${q >= 10 ? ' disabled' : ''}>+</button>
        </div>
      </div>
      <div class="pref-row">
        <div class="pref-hint">Ce mois-ci : ${used} / ${q} utilisé${used > 1 ? 's' : ''}</div>
        <button type="button" class="pref-edit" onclick="openPause()">Poser une pause</button>
      </div>
    </div>
  </div>`;
}
