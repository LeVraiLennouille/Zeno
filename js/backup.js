/* HabitsTracker · Sauvegarde : export / import, stockage persistant, rappel de sauvegarde
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Sauvegarde : export / import ═══════════ */
const APP_VERSION = '3.1.4';
const BACKUP_STALE_DAYS = 14;
const IMPORT_MAX_BYTES = 15 * 1024 * 1024;
const HABIT_TYPES = ['good', 'bad', 'drink', 'counter', 'weekly'];
const THEME_IDS = ['light', 'dark', 'system'];
const PAUSE_REASON_IDS = ['sick', 'trip', 'tired', 'work', 'party', 'other'];
const CHAL_STATUSES = ['active', 'won', 'failed', 'abandoned', 'void'];

const isDateKey = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00'));
const isHex = s => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
const clipStr = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
const nOr = (v, d) => Number.isFinite(v) ? v : d;
const isPlainObj = o => !!o && typeof o === 'object' && !Array.isArray(o);

/* ── Nettoyage strict d'une sauvegarde importée : liste blanche de champs et de formats ── */
function sanitizeHabitDef(h) {
  if (!isPlainObj(h) || typeof h.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(h.id)) return null;
  const name = clipStr(h.name, 30).trim();
  if (!name || !HABIT_TYPES.includes(h.type)) return null;
  const o = { id: h.id, name, type: h.type, emoji: clipStr(h.emoji, 8) || '⭐', color: isHex(h.color) ? h.color : '#8EA2FF',
    freq: clipStr(h.freq, 40) || 'Tous les jours', weekdayOnly: !!h.weekdayOnly, optional: !!h.optional };
  if (Array.isArray(h.activeDays)) {
    const d = [...new Set(h.activeDays.filter(x => Number.isInteger(x) && x >= 0 && x <= 6))];
    if (d.length) o.activeDays = d;
  }
  if (h.type === 'drink' || h.type === 'counter') {
    let goal = nOr(h.goal, NaN), step = nOr(h.step, NaN), max = nOr(h.max, NaN);
    if (!(goal > 0 && step > 0 && max > 0 && max >= goal)) { goal = 10; step = 1; max = 20; }
    o.goal = goal; o.step = step; o.max = max; o.unit = clipStr(h.unit, 8);
  }
  if (h.type === 'bad' && Array.isArray(h.levels)) {
    const lv = h.levels.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 10)).slice(0, 8);
    if (lv.length) o.levels = lv;
  }
  if (h.custom) o.custom = true;
  if (isDateKey(h.since)) o.since = h.since;
  if (h.archived) { o.archived = true; if (isDateKey(h.archivedOn)) o.archivedOn = h.archivedOn; }
  if (Array.isArray(h.gaps)) {
    const g = h.gaps.filter(x => isPlainObj(x) && isDateKey(x.from) && (x.to === undefined || isDateKey(x.to)))
      .map(x => x.to ? { from: x.from, to: x.to } : { from: x.from }).slice(0, 200);
    if (g.length) o.gaps = g;
  }
  return o;
}
function sanitizeLogs(src) {
  const logs = {};
  if (!isPlainObj(src)) return logs;
  Object.keys(src).forEach(k => {
    if (!isDateKey(k)) return;
    const v = src[k];
    if (v === 'done' || v === 'fail') logs[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e6) logs[k] = v;
  });
  return logs;
}
function mapDates(src, fn) {
  const out = {};
  if (!isPlainObj(src)) return out;
  Object.keys(src).forEach(k => { if (isDateKey(k)) { const v = fn(src[k]); if (v !== undefined) out[k] = v; } });
  return out;
}
function normalizeImported(raw) {
  if (!isPlainObj(raw)) return { ok: false, error: 'Format non reconnu.' };
  if (!isPlainObj(raw.habits)) return { ok: false, error: 'Ce fichier ne ressemble pas à une sauvegarde HabitsTracker.' };
  const db = {};
  db.createdAt = isDateKey(raw.createdAt) ? raw.createdAt : today();
  db.xp = Math.max(0, Math.floor(nOr(raw.xp, 0)));

  const p = isPlainObj(raw.profile) ? raw.profile : {};
  db.profile = { name: clipStr(p.name, 40), soundEnabled: p.soundEnabled !== false, notifsEnabled: !!p.notifsEnabled, zenMode: !!p.zenMode,
    darkMode: !!p.darkMode, themeMode: THEME_IDS.includes(p.themeMode) ? p.themeMode : (p.darkMode === true ? 'dark' : 'light'),
    pauseQuota: Math.min(10, Math.max(0, Math.floor(nOr(p.pauseQuota, 3)))),
    moodFeelings: mapDates(p.moodFeelings, v => typeof v === 'string' ? v.slice(0, 200) : undefined) };
  if (typeof p.lastBackup === 'string' && !isNaN(Date.parse(p.lastBackup))) db.profile.lastBackup = p.lastBackup;
  if (isDateKey(p.backupSnooze)) db.profile.backupSnooze = p.backupSnooze;

  // Habitudes (les anciennes sauvegardes sans définitions repartent des habitudes par défaut)
  let defs = Array.isArray(raw.habitDefs) ? raw.habitDefs.map(sanitizeHabitDef).filter(Boolean) : JSON.parse(JSON.stringify(DEFAULT_HABITS));
  const seen = new Set(); defs = defs.filter(d => !seen.has(d.id) && seen.add(d.id)).slice(0, 100);
  db.habitDefs = defs;
  db.habits = {};
  defs.forEach(d => {
    const src = isPlainObj(raw.habits[d.id]) ? raw.habits[d.id] : {};
    const e = { logs: sanitizeLogs(src.logs) };
    if (isPlainObj(src.vals)) { const vals = mapDates(src.vals, v => typeof v === 'string' ? v.slice(0, 10) : undefined); if (Object.keys(vals).length) e.vals = vals; }
    db.habits[d.id] = e;
  });

  db.moods = mapDates(raw.moods, v => Number.isInteger(v) && v >= 1 && v <= 5 ? v : undefined);
  db.journal = mapDates(raw.journal, v => typeof v === 'string' && v.trim() ? v.slice(0, 600) : undefined);
  db.pauses = mapDates(raw.pauses, v => ({ reason: isPlainObj(v) && PAUSE_REASON_IDS.includes(v.reason) ? v.reason : 'other' }));
  db.meditation = mapDates(raw.meditation, v => Number.isFinite(v) && v >= 0 && v <= 1440 ? v : undefined);
  db.sleepLog = mapDates(raw.sleepLog, v => isPlainObj(v) && Number.isFinite(v.hours)
    ? { hours: Math.min(24, Math.max(0, v.hours)), minutes: Math.min(59, Math.max(0, nOr(v.minutes, 0))), bedtime: clipStr(v.bedtime, 5), wakeTime: clipStr(v.wakeTime, 5) } : undefined);

  db.reminders = (Array.isArray(raw.reminders) ? raw.reminders : JSON.parse(JSON.stringify(DEFAULT_REMINDERS))).filter(isPlainObj).slice(0, 50).map((r, i) => ({
    id: /^[A-Za-z0-9_-]{1,40}$/.test(r.id) ? r.id : 'r_imp' + i, title: clipStr(r.title, 40) || 'Rappel', body: clipStr(r.body, 80),
    hour: Math.min(23, Math.max(0, Math.floor(nOr(r.hour, 9)))), minute: Math.min(59, Math.max(0, Math.floor(nOr(r.minute, 0)))),
    days: [...new Set((Array.isArray(r.days) ? r.days : []).filter(x => Number.isInteger(x) && x >= 0 && x <= 6))],
    habitId: typeof r.habitId === 'string' && seen.has(r.habitId) ? r.habitId : '', enabled: r.enabled !== false }));
  const rseen = new Set(); db.reminders = db.reminders.filter(r => !rseen.has(r.id) && rseen.add(r.id));

  db.challenges = (Array.isArray(raw.challenges) ? raw.challenges : []).filter(c => isPlainObj(c) && CHAL_STATUSES.includes(c.status)
    && /^[A-Za-z0-9_-]{1,40}$/.test(c.id) && typeof c.habitId === 'string' && isDateKey(c.start)
    && Number.isInteger(c.days) && c.days >= 3 && c.days <= 365).slice(0, 200).map(c => ({
    id: c.id, habitId: c.habitId, title: clipStr(c.title, 50) || 'Défi', emoji: clipStr(c.emoji, 8) || '🎯', color: isHex(c.color) ? c.color : '#8EA2FF',
    days: c.days, required: c.required === 'all' ? 'all' : Math.max(1, Math.floor(nOr(c.required, c.days))), start: c.start,
    status: c.status, reward: Math.max(0, Math.floor(nOr(c.reward, 0))), ...(isDateKey(c.endedOn) ? { endedOn: c.endedOn } : {}) }));

  db.seasonXp = {};
  if (isPlainObj(raw.seasonXp)) Object.keys(raw.seasonXp).forEach(k => {
    if (/^(winter|spring|summer|autumn)-\d{4}$/.test(k) && Number.isFinite(raw.seasonXp[k]) && raw.seasonXp[k] >= 0) db.seasonXp[k] = Math.floor(raw.seasonXp[k]);
  });
  const known = new Set(ACHIEVEMENTS.map(a => a.id));
  db.unlockedAchievements = (Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements : []).filter(x => known.has(x));
  db.perfectDaysClaimed = (Array.isArray(raw.perfectDaysClaimed) ? raw.perfectDaysClaimed : []).filter(isDateKey);
  db.penaltiesApplied = (Array.isArray(raw.penaltiesApplied) ? raw.penaltiesApplied : []).filter(isDateKey);
  if (isDateKey(raw.meditationXpDay)) db.meditationXpDay = raw.meditationXpDay;
  return { ok: true, db };
}

/* ── Libellés ── */
function daysSince(date) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(date); if (isNaN(b)) return null; b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
}
function agoLabel(n) {
  if (n <= 0) return 'aujourd’hui';
  if (n === 1) return 'hier';
  if (n < 31) return `il y a ${n} jours`;
  const m = Math.floor(n / 30); return `il y a ${m} mois`;
}
function lastBackupLabel() {
  const n = DB.profile.lastBackup ? daysSince(DB.profile.lastBackup) : null;
  return n == null ? 'Jamais sauvegardé' : `Dernière sauvegarde : ${agoLabel(n)}`;
}
function backupStale() {
  const n = DB.profile.lastBackup ? daysSince(DB.profile.lastBackup) : null;
  if (n != null) return n >= BACKUP_STALE_DAYS;
  const c = daysSince(parseDate(DB.createdAt));
  return c != null && c >= 7;
}
function importSummary(db, exportedAt) {
  const live = db.habitDefs.filter(h => !h.archived).length, arch = db.habitDefs.length - live;
  const lines = [
    `• ${live} habitude${live > 1 ? 's' : ''}${arch ? ` (+ ${arch} archivée${arch > 1 ? 's' : ''})` : ''}`,
    `• ${fmtNum(db.xp)} XP · niveau ${calcLevel(db.xp)}`,
    `• ${Object.keys(db.moods).length} humeur${Object.keys(db.moods).length > 1 ? 's' : ''}, ${Object.keys(db.journal).length} note${Object.keys(db.journal).length > 1 ? 's' : ''}`,
    `• utilisée depuis le ${fmtDay(db.createdAt)} ${db.createdAt.slice(0, 4)}`,
  ];
  if (typeof exportedAt === 'string' && !isNaN(Date.parse(exportedAt))) lines.unshift(`Sauvegarde du ${new Date(exportedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  return lines.join('\n');
}

/* ── Export ── */
async function exportData() {
  const now = new Date().toISOString();
  const snapshot = JSON.parse(JSON.stringify(DB)); snapshot.profile.lastBackup = now;
  const payload = JSON.stringify({ app: 'HabitsTracker', schema: STORE_KEY, appVersion: APP_VERSION, exportedAt: now, data: snapshot }, null, 2);
  const name = `habitstracker-${today()}.json`;
  let done = false;
  try {
    const file = new File([payload], name, { type: 'application/json' });
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde HabitsTracker' });
      done = true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;   // l'utilisateur a fermé la feuille de partage
  }
  if (!done) {
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  DB.profile.lastBackup = now; delete DB.profile.backupSnooze; saveData();
  showToast('Sauvegarde exportée', 2600, 'star');
  if (activePage === 'account' || activePage === 'home') renderActivePage();
}

/* ── Import ── */
function openImportPicker() { const i = document.getElementById('importFile'); if (i) i.click(); }
function onImportFile(ev) {
  const f = ev.target.files && ev.target.files[0]; ev.target.value = '';
  if (!f) return;
  if (f.size > IMPORT_MAX_BYTES) { showToast('Fichier trop volumineux (15 Mo max)', 3500, 'alert'); return; }
  const r = new FileReader();
  r.onload = () => handleImportText(String(r.result));
  r.onerror = () => showToast('Impossible de lire le fichier', 3000, 'alert');
  r.readAsText(f);
}
function handleImportText(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { showToast('Fichier illisible : ce n’est pas du JSON valide', 3800, 'alert'); return; }
  const raw = isPlainObj(obj) && isPlainObj(obj.data) ? obj.data : obj;   // accepte l'enveloppe d'export ou une base brute
  const res = normalizeImported(raw);
  if (!res.ok) { showToast(res.error, 4000, 'alert'); return; }
  const summary = importSummary(res.db, obj && obj.exportedAt);
  if (!confirm(`Remplacer tes données actuelles par cette sauvegarde ?\n\n${summary}\n\nTes données actuelles sont conservées : tu pourras annuler l’import.`)) return;
  try {
    localStorage.setItem(BAK_KEY, localStorage.getItem(STORE_KEY) || '');
    localStorage.setItem(BAK_KEY + '.at', new Date().toISOString());
  } catch (e) {
    if (!confirm('Impossible de créer un point de restauration (stockage plein).\n\nImporter quand même ?')) return;
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(res.db)); }
  catch (e) { showToast('Import impossible : stockage plein', 4000, 'alert'); return; }
  sessionStorage.setItem('ht-flash', 'import');
  location.reload();
}
function hasRestorePoint() { try { return !!localStorage.getItem(BAK_KEY); } catch (e) { return false; } }
function restorePointLabel() {
  try { const at = localStorage.getItem(BAK_KEY + '.at'); if (at) return new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); } catch (e) {}
  return '';
}
function restoreBackup() {
  let b = null; try { b = localStorage.getItem(BAK_KEY); } catch (e) {}
  if (!b) { showToast('Aucun point de restauration', 2800, 'alert'); return; }
  try { localStorage.setItem(STORE_KEY, b); localStorage.removeItem(BAK_KEY); localStorage.removeItem(BAK_KEY + '.at'); }
  catch (e) { showToast('Restauration impossible', 3000, 'alert'); return; }
  sessionStorage.setItem('ht-flash', 'restore');
  location.reload();
}
function confirmRestore() {
  if (confirm(`Revenir aux données d’avant le dernier import${restorePointLabel() ? ' (' + restorePointLabel() + ')' : ''} ?\n\nLes données actuelles seront remplacées.`)) restoreBackup();
}
function handleFlash() {
  const f = sessionStorage.getItem('ht-flash'); if (!f) return;
  sessionStorage.removeItem('ht-flash');
  if (f === 'import') showUndoToast('Sauvegarde importée', restoreBackup, 12000);
  else if (f === 'restore') showToast('Données précédentes restaurées', 3200, 'star');
}

/* ── Stockage persistant ── */
async function storageInfo() {
  const info = { supported: !!(navigator.storage && navigator.storage.persist), persisted: null, usage: null };
  try { if (navigator.storage && navigator.storage.persisted) info.persisted = await navigator.storage.persisted(); } catch (e) {}
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); info.usage = e.usage; } } catch (e) {}
  return info;
}
async function requestPersistence(manual) {
  if (!(navigator.storage && navigator.storage.persist)) { if (manual) showToast('Non pris en charge par ce navigateur', 3000, 'alert'); return null; }
  let ok = null;
  try { ok = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch (e) {}
  if (manual) showToast(ok ? 'Stockage protégé : le navigateur ne l’effacera pas' : 'Le navigateur a refusé (installe l’app pour augmenter tes chances)', 4200, ok ? 'star' : 'alert');
  if (manual && activePage === 'account') renderAccount();
  return ok;
}
async function refreshStorageInfo() {
  const el = document.getElementById('storageInfo'); if (!el) return;
  const i = await storageInfo();
  const mo = i.usage != null ? ` · ${(i.usage / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo utilisés` : '';
  const el2 = document.getElementById('storageInfo'); if (!el2) return;
  el2.textContent = (!i.supported ? 'Non pris en charge' : i.persisted ? 'Protégé ✓ (persistant)' : 'Non garanti : le navigateur peut vider les données') + mo;
  const btn = document.getElementById('storageBtn'); if (btn) btn.hidden = !i.supported || !!i.persisted;
}

/* ── Interface ── */
function backupSectionHtml() {
  const stale = backupStale();
  setTimeout(refreshStorageInfo, 0);
  return `<div>
    <div class="account-section-title">Sauvegarde</div>
    <div class="pref-card">
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">💾</span><div><div class="pref-label-text">Exporter mes données</div><div class="pref-hint${stale ? ' warn' : ''}">${lastBackupLabel()}</div></div></div>
        <button type="button" class="pref-edit" onclick="exportData()">Exporter</button>
      </div>
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">📂</span><div><div class="pref-label-text">Importer une sauvegarde</div><div class="pref-hint">Remplace les données actuelles</div></div></div>
        <button type="button" class="pref-edit" onclick="openImportPicker()">Importer</button>
      </div>
      ${hasRestorePoint() ? `<div class="pref-row">
        <div class="pref-info"><span class="pref-icon">↩️</span><div><div class="pref-label-text">Annuler le dernier import</div><div class="pref-hint">Point de restauration${restorePointLabel() ? ' du ' + restorePointLabel() : ''}</div></div></div>
        <button type="button" class="pref-edit" onclick="confirmRestore()">Restaurer</button>
      </div>` : ''}
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">🛡️</span><div><div class="pref-label-text">Stockage protégé</div><div class="pref-hint" id="storageInfo">Vérification…</div></div></div>
        <button type="button" class="pref-edit" id="storageBtn" onclick="requestPersistence(true)" hidden>Protéger</button>
      </div>
    </div>
  </div>`;
}
function renderBackupNudge() {
  const el = document.getElementById('backupNudge'); if (!el) return;
  const snooze = DB.profile.backupSnooze;
  if (!backupStale() || (snooze && snooze > today())) { el.innerHTML = ''; return; }
  const n = DB.profile.lastBackup ? daysSince(DB.profile.lastBackup) : null;
  el.innerHTML = `<div class="backup-nudge"><span aria-hidden="true">💾</span>
    <div class="backup-nudge-txt">${n == null ? 'Tes données ne sont pas sauvegardées' : `Dernière sauvegarde ${agoLabel(n)}`}</div>
    <button type="button" class="pause-btn" onclick="exportData()">Sauvegarder</button>
    <button type="button" class="backup-x" onclick="snoozeBackupNudge()" aria-label="Me le rappeler dans 7 jours">✕</button></div>`;
}
function snoozeBackupNudge() { DB.profile.backupSnooze = fmtDate(addDays(new Date(), 7)); saveData(); renderBackupNudge(); }
