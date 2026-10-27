/* HabitsTracker · Rappels configurables et notifications
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Rappels configurables ═══════════ */
let _notifTimers = [];

function notifsGranted() {
  return !!DB.profile.notifsEnabled && ('Notification' in window) && Notification.permission === 'granted';
}

function initNotifications() {
  const on = !!DB.profile.notifsEnabled;
  updateToggleBtn('notifsToggle', on);
  if (notifsGranted()) scheduleLocalNotifications();
}

async function toggleNotifications() {
  if (!('Notification' in window)) { alert('Les notifications ne sont pas prises en charge sur cet appareil.'); return; }
  if (DB.profile.notifsEnabled) {
    DB.profile.notifsEnabled = false;
    _notifTimers.forEach(id => clearTimeout(id)); _notifTimers = [];
    saveData();
    updateToggleBtn('notifsToggle', false);
    showToast('Notifications désactivées', 2500, 'bellOff');
    if (activePage === 'account') renderAccount();
    return;
  }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm === 'granted') {
    DB.profile.notifsEnabled = true; saveData();
    updateToggleBtn('notifsToggle', true);
    scheduleLocalNotifications();
    const n = (DB.reminders || []).filter(r => r.enabled).length;
    showToast(`${n} rappel${n > 1 ? 's' : ''} programmé${n > 1 ? 's' : ''}`, 3000, 'bell');
  } else {
    showToast('Notifications bloquées : vérifie les réglages du navigateur', 3500, 'alert');
  }
  if (activePage === 'account') renderAccount();
}

/* Prochaine occurrence (Date) d'un rappel, en respectant ses jours. */
function nextOccurrence(r, from) {
  from = from || new Date();
  if (!r.days || !r.days.length) return null;
  for (let i = 0; i < 8; i++) {
    const t = new Date(from);
    t.setDate(t.getDate() + i);
    t.setHours(r.hour, r.minute, 0, 0);
    if (t > from && r.days.includes(t.getDay())) return t;
  }
  return null;
}

function scheduleLocalNotifications() {
  _notifTimers.forEach(id => clearTimeout(id)); _notifTimers = [];
  if (!notifsGranted()) return;
  (DB.reminders || []).forEach(r => {
    if (!r.enabled) return;
    const t = nextOccurrence(r); if (!t) return;
    const ms = t.getTime() - Date.now();
    if (ms <= 0) return;
    _notifTimers.push(setTimeout(() => fireReminder(r.id, t.getTime()), ms));
  });
}

function reminderSatisfied(r) {
  if (!r.habitId) return false;
  const h = HABITS.find(x => x.id === r.habitId);
  if (!h || h.type === 'bad') return false;
  const d = appNow(); d.setHours(0, 0, 0, 0);
  if (h.type === 'times' && timesThisWeek(h).state === 'success') return true;   // objectif de la semaine déjà atteint
  return isHabitDoneOn(h, today(), d);
}

async function fireReminder(id, targetTs) {
  const r = (DB.reminders || []).find(x => x.id === id);
  const late = Date.now() - targetTs;
  // Ignore un rappel arrivé très en retard (appareil en veille) ou déjà accompli.
  if (r && r.enabled && late < 10 * 60 * 1000 && !reminderSatisfied(r)) await showReminderNotification(r);
  scheduleLocalNotifications();
}

async function showReminderNotification(r) {
  const opts = { body: r.body || '', icon: './assets/icon-192.png', badge: './assets/icon-192.png', tag: 'ht-' + r.id, data: { url: './' } };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(res => setTimeout(() => res(null), 1500))]);
      if (reg && reg.showNotification) { await reg.showNotification(r.title, opts); return true; }
    }
  } catch (e) {}
  try { new Notification(r.title, opts); return true; } catch (e) { return false; }
}

async function sendTestNotification() {
  if (!notifsGranted()) { showToast('Active d’abord les notifications', 3000, 'alert'); return; }
  const ok = await showReminderNotification({ id: 'test', title: '🔔 Notification test', body: 'Tout fonctionne : tes rappels te parviendront.' });
  showToast(ok ? 'Notification envoyée' : 'Impossible d’afficher la notification', 2600, ok ? 'bell' : 'alert');
}

// Les minuteries sont suspendues quand l'app passe en arrière-plan : on replanifie au retour.
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleLocalNotifications(); });

/* ── Liste des rappels (page Compte) ── */
function remindersSectionHtml() {
  const list = [...(DB.reminders || [])].sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  const on = notifsGranted();
  const rows = list.map(r => {
    const h = r.habitId ? HABITS.find(x => x.id === r.habitId) : null;
    const sub = daysLabel(r.days) + (h ? ` · ${esc(h.name)}` : '');
    return `<div class="pref-row reminder-row${r.enabled ? '' : ' off'}" role="button" tabindex="0" onclick="openReminder('${r.id}')" onkeydown="if(event.key==='Enter')openReminder('${r.id}')">
      <div class="reminder-time">${pad2(r.hour)}:${pad2(r.minute)}</div>
      <div class="pref-info reminder-info"><div><div class="pref-label-text">${esc(r.title)}</div><div class="pref-hint">${sub}</div></div></div>
      <button type="button" class="pref-toggle ${r.enabled ? 'on' : 'off'}" role="switch" aria-checked="${r.enabled}" aria-label="Activer le rappel ${esc(r.title)}" onclick="event.stopPropagation();toggleReminder('${r.id}')">${r.enabled ? 'Activé' : 'Désactivé'}</button>
    </div>`;
  }).join('');
  return `<div>
    <div class="account-section-title">Rappels</div>
    <div class="pref-card">
      ${rows || `<div class="pref-row"><div class="pref-hint">Aucun rappel pour l’instant.</div></div>`}
      <div class="pref-row"><button type="button" class="reminder-add" onclick="openReminder()">+ Ajouter un rappel</button></div>
    </div>
    <div class="hf-hint reminders-note">${on
      ? 'Les rappels sonnent tant que l’app est ouverte ou active en arrière-plan.'
      : 'Active les notifications dans les préférences pour recevoir tes rappels.'}</div>
    ${on ? `<button type="button" class="pref-edit reminder-test" onclick="sendTestNotification()">Envoyer une notification test</button>` : ''}
  </div>`;
}

function toggleReminder(id) {
  const r = (DB.reminders || []).find(x => x.id === id); if (!r) return;
  r.enabled = !r.enabled;
  saveData(); scheduleLocalNotifications();
  if (activePage === 'account') renderAccount();
}

/* ── Formulaire de rappel ── */
let rf = null;

function openReminder(id) {
  const r = id ? (DB.reminders || []).find(x => x.id === id) : null;
  if (id && !r) return;
  rf = r
    ? { mode:'edit', id:r.id, title:r.title, body:r.body || '', time:`${pad2(r.hour)}:${pad2(r.minute)}`, days:r.days.slice(), habitId:r.habitId || '', enabled:r.enabled !== false }
    : { mode:'create', id:null, title:'', body:'', time:'09:00', days:ALL_DAYS.slice(), habitId:'', enabled:true };
  document.getElementById('reminderFormTitle').textContent = r ? 'Modifier le rappel' : 'Nouveau rappel';
  renderReminderForm();
  document.querySelector('#reminderModal .modal-card').scrollTop = 0;
  document.getElementById('reminderModal').classList.add('open');
  if (!r) setTimeout(() => { const el = document.getElementById('rfTitle'); if (el) el.focus(); }, 120);
}
function closeReminder() {
  rf = null;
  document.getElementById('reminderModal').classList.remove('open');
}
function rfInput(key, val) { if (rf) rf[key] = val; }
function rfSet(key, val)   { if (!rf) return; rf[key] = val; renderReminderForm(); }
function rfToggleDay(d) {
  if (!rf) return;
  rf.days = rf.days.includes(d) ? rf.days.filter(x => x !== d) : [...rf.days, d];
  renderReminderForm();
}
function rfDays(preset) {
  if (!rf) return;
  rf.days = preset === 'week' ? WEEKDAYS.slice() : ALL_DAYS.slice();
  renderReminderForm();
}

function renderReminderForm() {
  const el = document.getElementById('reminderFormBody');
  if (!el || !rf) return;
  const isEdit = rf.mode === 'edit';
  const habitOpts = liveHabits().filter(h => h.type !== 'bad')
    .map(h => `<option value="${h.id}"${rf.habitId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('');
  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="rfTitle">Titre</label>
      <input id="rfTitle" class="pseudo-input hf-input" type="text" maxlength="40" placeholder="Ex. 💊 Vitamines" value="${esc(rf.title)}" oninput="rfInput('title',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfBody">Message <span class="hf-opt">(facultatif)</span></label>
      <input id="rfBody" class="pseudo-input hf-input" type="text" maxlength="80" placeholder="Ex. N’oublie pas !" value="${esc(rf.body)}" oninput="rfInput('body',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfTime">Heure</label>
      <input id="rfTime" class="sleep-time-input" type="time" value="${esc(rf.time)}" oninput="rfInput('time',this.value)" onchange="rfInput('time',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label">Jours</label>
      <div class="hf-days" role="group" aria-label="Jours du rappel">
        ${DOW_ORDER.map(d => `<button type="button" class="hf-day${rf.days.includes(d) ? ' selected' : ''}" aria-pressed="${rf.days.includes(d)}" aria-label="${DAY_FULL[d]}" onclick="rfToggleDay(${d})">${DOW_LETTER[d]}</button>`).join('')}
      </div>
      <div class="hf-presets">
        <button type="button" class="hf-link" onclick="rfDays('all')">Tous les jours</button>
        <button type="button" class="hf-link" onclick="rfDays('week')">Lun – Ven</button>
      </div>
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfHabit">Habitude liée <span class="hf-opt">(facultatif)</span></label>
      <select id="rfHabit" class="pseudo-input hf-input" onchange="rfInput('habitId',this.value)">
        <option value="">Aucune</option>
        ${habitOpts}
      </select>
      <div class="hf-hint">Si l’habitude est déjà faite à l’heure du rappel, la notification est ignorée.</div>
    </div>
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Rappel actif</div>
        <div class="pref-hint">Désactive-le sans le supprimer</div>
      </div>
      <button type="button" class="pref-toggle ${rf.enabled ? 'on' : 'off'}" role="switch" aria-checked="${rf.enabled}" aria-label="Rappel actif" onclick="rfSet('enabled',!rf.enabled)">${rf.enabled ? 'Activé' : 'Désactivé'}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveReminder()">${isEdit ? 'Enregistrer' : 'Créer le rappel'}</button>
      ${isEdit ? `<button type="button" class="modal-reset-btn" onclick="deleteReminder()">${icon('trash')} Supprimer le rappel</button>` : ''}
    </div>`;
}

function saveReminder() {
  if (!rf) return;
  const title = rf.title.trim();
  if (!title) { showToast('Donne un titre au rappel', 2500, 'alert'); return; }
  const m = /^(\d{1,2}):(\d{2})$/.exec(rf.time || '');
  if (!m || +m[1] > 23 || +m[2] > 59) { showToast('Choisis une heure valide', 2500, 'alert'); return; }
  if (rf.days.length === 0) { showToast('Choisis au moins un jour', 2800, 'alert'); return; }

  const data = { title, body: rf.body.trim(), hour: +m[1], minute: +m[2], days: rf.days.slice(), habitId: rf.habitId || '', enabled: rf.enabled };
  if (!Array.isArray(DB.reminders)) DB.reminders = [];
  if (rf.mode === 'create') {
    DB.reminders.push({ id: 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...data });
  } else {
    const r = DB.reminders.find(x => x.id === rf.id);
    if (r) Object.assign(r, data);
  }
  saveData();
  scheduleLocalNotifications();
  closeReminder();
  if (activePage === 'account') renderAccount();
  showToast(notifsGranted() ? 'Rappel enregistré' : 'Rappel enregistré : active les notifications pour le recevoir', notifsGranted() ? 2200 : 3600, 'bell');
}

function deleteReminder() {
  if (!rf || rf.mode !== 'edit') return;
  const r = (DB.reminders || []).find(x => x.id === rf.id);
  if (!r) { closeReminder(); return; }
  if (!confirm(`Supprimer le rappel « ${r.title} » ?`)) return;
  DB.reminders = DB.reminders.filter(x => x.id !== r.id);
  saveData(); scheduleLocalNotifications();
  closeReminder();
  if (activePage === 'account') renderAccount();
  showToast('Rappel supprimé', 2200, 'trash');
}