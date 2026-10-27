/* HabitsTracker · Toast « Annuler » et archivage des habitudes
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Annulation (toast « Annuler ») ═══════════ */
let _undoTimer = null, _undoFn = null;
function showUndoToast(msg, fn, ms) {
  const el = document.getElementById('undoToast'); if (!el) return;
  document.getElementById('undoToastMsg').textContent = msg;
  _undoFn = fn;
  el.classList.add('show');
  clearTimeout(_undoTimer); _undoTimer = setTimeout(hideUndoToast, ms || 8000);
}
function hideUndoToast() {
  const el = document.getElementById('undoToast'); if (el) el.classList.remove('show');
  clearTimeout(_undoTimer); _undoFn = null;
}
function runUndo() { const f = _undoFn; hideUndoToast(); if (f) f(); }

/* ═══════════ Archivage des habitudes ═══════════ */
const liveHabits = () => HABITS.filter(h => !h.archived);
const archivedHabits = () => HABITS.filter(h => h.archived);
// Une habitude archivée reste dans l'historique : seuls les jours « hors plage » (gaps) sont inactifs.
function habitGapAt(h, k) { return (h.gaps || []).some(g => k >= g.from && (!g.to || k <= g.to)); }

function archiveHabit(id) {
  const h = HABITS.find(x => x.id === id); if (!h || h.archived) return;
  const t = today();
  h.archived = true; h.archivedOn = t;
  (h.gaps = h.gaps || []).push({ from: t });
  const off = (DB.reminders || []).filter(r => r.habitId === id && r.enabled);
  off.forEach(r => { r.enabled = false; });
  const chalIds = (DB.challenges || []).filter(c => c.habitId === id && c.status === 'active').map(c => c.id);
  saveData(); scheduleLocalNotifications(); renderActivePage();
  const extra = off.length ? ` · ${off.length} rappel${off.length > 1 ? 's' : ''} désactivé${off.length > 1 ? 's' : ''}` : '';
  showUndoToast(`« ${h.name} » archivée${extra}`, () => restoreHabit(id, { reEnable: off.map(r => r.id), reactivate: chalIds, silent: true }));
}
function restoreHabit(id, opts) {
  opts = opts || {};
  const h = HABITS.find(x => x.id === id); if (!h || !h.archived) return;
  const t = today(), yest = fmtDate(addDays(appNow(), -1));
  // On referme la plage ouverte à hier : les jours archivés restent « hors plage » (ni réussis, ni manqués).
  h.gaps = (h.gaps || []).map(g => g.to ? g : (g.from >= t ? null : { from: g.from, to: yest })).filter(g => g && (!g.to || g.to >= g.from));
  delete h.archived; delete h.archivedOn;
  if (!h.gaps.length) delete h.gaps;
  (opts.reactivate || []).forEach(cid => { const c = (DB.challenges || []).find(x => x.id === cid); if (c && c.status === 'abandoned') { c.status = 'active'; delete c.endedOn; } });
  (opts.reEnable || []).forEach(rid => { const r = (DB.reminders || []).find(x => x.id === rid); if (r) r.enabled = true; });
  saveData(); scheduleLocalNotifications(); renderActivePage();
  if (!opts.silent) showToast(`« ${h.name} » restaurée`, 2600, 'star');
}
function archiveHabitFromForm() {
  if (!hf || hf.mode !== 'edit') return;
  const id = hf.id; closeHabitForm(); archiveHabit(id);
}

// Suppression définitive : confirmation + possibilité d'annuler pendant quelques secondes.
function purgeHabit(id, fromForm) {
  const h = HABITS.find(x => x.id === id); if (!h) return;
  if (!confirm(`Supprimer définitivement « ${h.name} » ?\n\nSon historique sera effacé (tu pourras annuler quelques secondes).`)) return;
  const snap = {
    def: JSON.parse(JSON.stringify(h)), idx: HABITS.indexOf(h),
    data: JSON.parse(JSON.stringify(DB.habits[id] || { logs: {} })),
    rems: (DB.reminders || []).filter(r => r.habitId === id).map(r => r.id),
    chals: JSON.parse(JSON.stringify((DB.challenges || []).filter(c => c.habitId === id))),
  };
  HABITS.splice(snap.idx, 1); delete DB.habits[id];
  (DB.reminders || []).forEach(r => { if (r.habitId === id) r.habitId = ''; });
  saveData();
  if (fromForm) closeHabitForm();
  renderActivePage();
  showUndoToast(`« ${h.name} » supprimée`, () => undoPurge(snap));
}
function undoPurge(s) {
  if (HABITS.some(x => x.id === s.def.id)) return;
  HABITS.splice(Math.min(s.idx, HABITS.length), 0, s.def);
  DB.habits[s.def.id] = s.data;
  s.rems.forEach(rid => { const r = (DB.reminders || []).find(x => x.id === rid); if (r) r.habitId = s.def.id; });
  s.chals.forEach(c => { const i = DB.challenges.findIndex(x => x.id === c.id); if (i >= 0) DB.challenges[i] = c; else DB.challenges.push(c); });
  saveData(); renderActivePage();
  showToast('Habitude rétablie', 2400, 'star');
}
function deleteHabitFromForm() { if (hf && hf.mode === 'edit') purgeHabit(hf.id, true); }

function archivedSectionHtml() {
  const list = archivedHabits(); if (!list.length) return '';
  return `<div class="archived-section">
    <div class="account-section-title">Archivées</div>
    <div class="archived-list">${list.map(h => `<div class="archived-row" data-habit-id="${h.id}">
      <div class="archived-emoji" style="--ink:${h.color}">${habitIconMarkup(h)}</div>
      <div class="archived-info"><div class="archived-name">${esc(h.name)}</div>
        <div class="archived-meta">${h.archivedOn ? `Archivée le ${fmtDay(h.archivedOn)} · ` : ''}meilleure série ${streakLabel(h, calcStreak(h).longest)}</div></div>
      <button type="button" class="pref-edit" onclick="restoreHabit('${h.id}')">Restaurer</button>
      <button type="button" class="archived-del" onclick="purgeHabit('${h.id}')" aria-label="Supprimer définitivement ${esc(h.name)}">${icon('trash')}</button>
    </div>`).join('')}</div>
  </div>`;
}
function repHabitOptions() {
  const opt = h => `<option value="${h.id}"${rep.habit === h.id ? ' selected' : ''}>${esc(h.name)}</option>`;
  const arch = archivedHabits();
  return liveHabits().map(opt).join('') + (arch.length ? `<optgroup label="Archivées">${arch.map(opt).join('')}</optgroup>` : '');
}