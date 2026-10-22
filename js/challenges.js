/* HabitsTracker · Saisons et défis
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Saisons ═══════════ */
const SEASON_DEFS = [
  { key:'winter', name:'Hiver',     emoji:'❄️', months:[11,0,1] },
  { key:'spring', name:'Printemps', emoji:'🌸', months:[2,3,4] },
  { key:'summer', name:'Été',       emoji:'☀️', months:[5,6,7] },
  { key:'autumn', name:'Automne',   emoji:'🍂', months:[8,9,10] },
];
const SEASON_RANKS = [
  { xp:0,    name:'Éveil' },     { xp:300,  name:'Élan' },     { xp:700,  name:'Rythme' },
  { xp:1200, name:'Flux' },      { xp:1800, name:'Cap' },      { xp:2500, name:'Ascension' },
  { xp:3300, name:'Sommet' },    { xp:4200, name:'Éclat' },    { xp:5200, name:'Maîtrise' },
  { xp:6300, name:'Légende' },   { xp:7500, name:'Mythe' },    { xp:9000, name:'Éternité' },
];
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function seasonLabel(def, startYear) {
  return def.key === 'winter' ? `${def.name} ${startYear}/${String(startYear + 1).slice(2)}` : `${def.name} ${startYear}`;
}
function seasonOf(date) {
  const m = date.getMonth(), y = date.getFullYear();
  const def = SEASON_DEFS.find(s => s.months.includes(m));
  const startYear = (def.key === 'winter' && m < 2) ? y - 1 : y;
  const start = new Date(startYear, def.months[0], 1);
  const end = new Date(startYear, def.months[0] + 3, 0);
  return { id: `${def.key}-${startYear}`, def, start, end, label: seasonLabel(def, startYear) };
}
function seasonFromId(id) {
  const [key, y] = String(id).split('-'); const def = SEASON_DEFS.find(s => s.key === key);
  return def ? { def, label: seasonLabel(def, Number(y)) } : { def: SEASON_DEFS[0], label: id };
}
function seasonRank(xp) {
  xp = xp || 0; let i = 0;
  SEASON_RANKS.forEach((r, idx) => { if (xp >= r.xp) i = idx; });
  const cur = SEASON_RANKS[i], nxt = SEASON_RANKS[i + 1] || null;
  return { index: i, rank: i + 1, roman: ROMAN[i], name: cur.name, next: nxt,
    pct: nxt ? Math.round((xp - cur.xp) / (nxt.xp - cur.xp) * 100) : 100, needed: nxt ? nxt.xp - xp : 0 };
}
function currentSeasonXp() { return (DB.seasonXp || {})[seasonOf(new Date()).id] || 0; }
// Appelé par giveXP : crédite la saison en cours et annonce un changement de rang.
function addSeasonXp(amount) {
  if (!(amount > 0)) return;
  if (!DB.seasonXp) DB.seasonXp = {};
  const id = seasonOf(new Date()).id;
  const before = seasonRank(DB.seasonXp[id] || 0).rank;
  DB.seasonXp[id] = (DB.seasonXp[id] || 0) + amount;
  const after = seasonRank(DB.seasonXp[id]);
  if (after.rank > before) {
    setTimeout(() => { playSound('levelup'); showToast(`Saison : rang ${after.roman} · ${after.name}`, 4000, 'star'); }, 1800);
  }
}
function seasonCardHtml() {
  const s = seasonOf(new Date()); const xp = currentSeasonXp(); const r = seasonRank(xp);
  const daysLeft = Math.max(0, Math.round((s.end - midnight()) / 86400000));
  const past = Object.keys(DB.seasonXp || {}).filter(id => id !== s.id).sort().reverse().slice(0, 6);
  const pastHtml = past.length ? `<div class="season-past"><div class="season-past-title">Saisons passées</div>${past.map(id => {
    const si = seasonFromId(id); const pr = seasonRank(DB.seasonXp[id]);
    return `<div class="season-past-row"><span>${si.def.emoji} ${esc(si.label)}</span><span>Rang ${pr.roman} · ${pr.name} · ${fmtNum(DB.seasonXp[id])} XP</span></div>`;
  }).join('')}</div>` : '';
  return `<div class="season-card">
    <div class="season-top">
      <div class="season-emoji" aria-hidden="true">${s.def.emoji}</div>
      <div class="season-main">
        <div class="season-label">Saison · ${esc(s.label)}</div>
        <div class="season-rank">Rang ${r.roman} <span>${r.name}</span></div>
      </div>
      <div class="season-left"><b>${daysLeft}</b><span>jour${daysLeft > 1 ? 's' : ''}<br>restant${daysLeft > 1 ? 's' : ''}</span></div>
    </div>
    <div class="season-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.pct}" aria-label="Progression vers le rang suivant"><div style="width:${r.pct}%"></div></div>
    <div class="season-foot"><span>${fmtNum(xp)} XP cette saison</span><span>${r.next ? `encore ${fmtNum(r.needed)} pour le rang ${ROMAN[r.index + 1]}` : 'Rang maximal !'}</span></div>
    ${pastHtml}
  </div>`;
}

/* ═══════════ Défis ═══════════ */
const CHAL_DURATIONS = [7, 14, 21, 30, 60, 90];
const CHAL_MAX_ACTIVE = 5;
let achTab = 'challenges';
let _chalBusy = false;

function setAchTab(t) { achTab = t; renderAchievements(); }
function wonChallenges() { return (DB.challenges || []).filter(c => c.status === 'won'); }

// Évalue un défi : jours réussis, jours restants possibles, état.
function evalChallenge(c, h) {
  const t = midnight(), start = parseDate(c.start), todayKey = today();
  let success = 0, activeTotal = 0, pending = 0;
  for (let i = 0; i < c.days; i++) {
    const d = addDays(start, i), k = fmtDate(d);
    if (!isDayActive(h, d)) continue;
    activeTotal++;
    if (d > t) { pending++; continue; }
    const isToday = k === todayKey;
    if (h.type === 'bad') {
      if (isBadFail(h.id, k)) continue;
      if (isToday) pending++; else success++;          // un jour « propre » ne compte qu'une fois terminé
    } else if (isHabitDoneOn(h, k, d)) success++;
    else if (isToday) pending++;
  }
  const required = c.required === 'all' ? activeTotal : Math.min(Number(c.required) || 1, activeTotal);
  const dayNo = Math.min(c.days, Math.max(1, Math.round((t - start) / 86400000) + 1));
  const over = t > addDays(start, c.days - 1);
  let state = 'active';
  if (activeTotal === 0) { if (over) state = 'void'; }
  else if (success >= required) state = 'won';
  else if (success + pending < required) state = 'failed';
  return { success, pending, required, activeTotal, dayNo, over, state, daysLeft: Math.max(0, c.days - dayNo) };
}

function updateChallenges() {
  if (_chalBusy || !Array.isArray(DB.challenges)) return false;
  _chalBusy = true;
  let changed = false;
  try {
    let delay = 0;
    DB.challenges.forEach(c => {
      if (c.status !== 'active') return;
      const h = HABITS.find(x => x.id === c.habitId);
      if (!h || h.archived) { c.status = 'abandoned'; c.endedOn = today(); changed = true; return; }
      const ev = evalChallenge(c, h);
      if (ev.state === 'active') return;
      c.status = ev.state; c.endedOn = today(); changed = true;
      if (ev.state === 'won') {
        giveXP(c.reward);
        setTimeout(() => { playSound('fanfare'); launchConfetti(); showToast(`Défi relevé : ${c.title} · +${c.reward} XP`, 4200, 'trophy'); }, 500 + delay);
        delay += 2600;
      } else if (ev.state === 'failed') {
        setTimeout(() => showToast(`Défi manqué : ${c.title}`, 3600, 'alert'), 500 + delay);
        delay += 2600;
      }
    });
    if (changed) { saveData(); checkAchievements(); }
  } finally { _chalBusy = false; }
  return changed;
}

function chalTitle(h, days, mode, min) {
  if (h.type === 'bad') return `${days} jours sans ${h.name}`;
  if (mode === 'min') return `${h.name} · ${min} fois en ${days} jours`;
  return `${h.name} · ${days} jours d’affilée`;
}
function chalActiveDays(h, days) {
  const start = midnight(); let n = 0;
  for (let i = 0; i < days; i++) if (isDayActive(h, addDays(start, i))) n++;
  return n;
}
function chalRewardFor(required) { return Math.round(10 + required * 3); }
function fmtDay(k) { const d = parseDate(k); return `${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}`; }

function chalCardHtml(c) {
  const h = HABITS.find(x => x.id === c.habitId);
  if (!h) return '';
  const ev = evalChallenge(c, h);
  const pct = ev.required > 0 ? Math.min(100, Math.round(ev.success / ev.required * 100)) : 0;
  const endK = fmtDate(addDays(parseDate(c.start), c.days - 1));
  const sub = ev.daysLeft === 0 ? `Dernier jour · fin le ${fmtDay(endK)}` : `Jour ${ev.dayNo} / ${c.days} · fin le ${fmtDay(endK)}`;
  return `<div class="chal-card" style="--c:${esc(c.color || h.color)}">
    <div class="chal-top">
      <div class="chal-emoji" aria-hidden="true">${esc(c.emoji || '🎯')}</div>
      <div class="chal-main"><div class="chal-title">${esc(c.title)}</div><div class="chal-sub">${sub}</div></div>
      <button type="button" class="chal-x" onclick="abandonChallenge('${c.id}')" aria-label="Abandonner le défi ${esc(c.title)}">✕</button>
    </div>
    <div class="chal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(c.title)}"><div style="width:${pct}%"></div></div>
    <div class="chal-foot"><span><b>${ev.success}</b> / ${ev.required} jours</span><span>+${c.reward} XP à la clé</span></div>
  </div>`;
}
function chalHistoryRow(c) {
  const st = { won: ['✓', 'Relevé', 'ok'], failed: ['✗', 'Manqué', 'ko'], abandoned: ['–', 'Abandonné', 'na'], void: ['–', 'Annulé', 'na'] }[c.status] || ['–', '', 'na'];
  return `<div class="chal-hist ${st[2]}"><span class="chal-hist-ico">${st[0]}</span>
    <div class="chal-hist-main"><div>${esc(c.emoji || '🎯')} ${esc(c.title)}</div><div class="chal-hist-sub">${st[1]} · ${fmtDay(c.start)} → ${fmtDay(c.endedOn || c.start)}${c.status === 'won' ? ` · +${c.reward} XP` : ''}</div></div></div>`;
}
function challengesTabHtml() {
  const list = DB.challenges || [];
  const active = list.filter(c => c.status === 'active');
  const done = list.filter(c => c.status !== 'active').sort((a, b) => (b.endedOn || '').localeCompare(a.endedOn || '')).slice(0, 8);
  const full = active.length >= CHAL_MAX_ACTIVE;
  const wonN = wonChallenges().length;
  return `${seasonCardHtml()}
    <div class="ach-section">
      <div class="chal-head">
        <div class="account-section-title" style="margin:0">Défis en cours</div>
        <button type="button" class="pref-edit" onclick="openChallengeForm()"${full ? ' disabled' : ''}>+ Nouveau défi</button>
      </div>
      ${active.length ? `<div class="chal-list">${active.map(chalCardHtml).join('')}</div>`
        : `<div class="empty-note chal-empty">Lance-toi un défi : « 30 jours sans scroller », « Gym 12 fois en 30 jours »…<br>Chaque défi relevé rapporte de l’XP de saison et des succès.</div>`}
      ${full ? `<div class="hf-hint">Maximum ${CHAL_MAX_ACTIVE} défis en cours.</div>` : ''}
    </div>
    ${done.length ? `<div class="ach-section"><div class="chal-head"><div class="account-section-title" style="margin:0">Historique · ${wonN} relevé${wonN > 1 ? 's' : ''}</div>
      <button type="button" class="hf-link" onclick="clearChallengeHistory()">Effacer</button></div>
      <div class="chal-hist-list">${done.map(chalHistoryRow).join('')}</div></div>` : ''}`;
}

/* ── Formulaire de création ── */
let cf = null;
function chalCandidates() { return liveHabits().filter(h => h.type !== 'weekly' && !(DB.challenges || []).some(c => c.status === 'active' && c.habitId === h.id)); }
function openChallengeForm() {
  const cands = chalCandidates();
  if ((DB.challenges || []).filter(c => c.status === 'active').length >= CHAL_MAX_ACTIVE) { showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`, 2800, 'alert'); return; }
  if (!cands.length) { showToast('Toutes tes habitudes ont déjà un défi en cours', 3200, 'alert'); return; }
  const first = cands.find(h => h.type === 'bad') || cands[0];
  cf = { habitId: first.id, days: 30, mode: 'all', min: 20, title: '', titleTouched: false };
  renderChallengeForm();
  document.querySelector('#challengeModal .modal-card').scrollTop = 0;
  document.getElementById('challengeModal').classList.add('open');
}
function closeChallengeForm() { cf = null; document.getElementById('challengeModal').classList.remove('open'); }
function cfSet(key, val) {
  if (!cf) return;
  cf[key] = val;
  const h = HABITS.find(x => x.id === cf.habitId);
  if (h && h.type === 'bad') cf.mode = 'all';
  renderChallengeForm();
}
function cfInput(key, val) { if (cf) { cf[key] = val; if (key === 'title') cf.titleTouched = true; } }
function cfDuration(v) { const n = parseInt(v, 10); if (cf && Number.isFinite(n)) { cf.days = Math.max(3, Math.min(365, n)); } }
function cfAutoTitle() {
  const h = HABITS.find(x => x.id === cf.habitId); if (!h) return '';
  return chalTitle(h, cf.days, cf.mode, Math.min(cf.min, cf.days));
}
function renderChallengeForm() {
  const el = document.getElementById('challengeFormBody'); if (!el || !cf) return;
  const cands = chalCandidates();
  const h = HABITS.find(x => x.id === cf.habitId) || cands[0];
  const isBad = h.type === 'bad';
  const minV = Math.min(Math.max(1, Number(cf.min) || 1), cf.days);
  const activeDays = chalActiveDays(h, cf.days);
  const required = cf.mode === 'all' || isBad ? activeDays : Math.min(minV, activeDays);
  const title = cf.titleTouched ? cf.title : cfAutoTitle();
  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="cfHabit">Habitude</label>
      <select id="cfHabit" class="pseudo-input hf-input" onchange="cfSet('habitId',this.value)">
        ${cands.map(x => `<option value="${x.id}"${x.id === h.id ? ' selected' : ''}>${esc(x.emoji || '')} ${esc(x.name)}${x.type === 'bad' ? ' (à éviter)' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="modal-section">
      <label class="modal-label">Durée</label>
      <div class="hf-days cf-durations" role="group" aria-label="Durée du défi">
        ${CHAL_DURATIONS.map(d => `<button type="button" class="hf-day${cf.days === d ? ' selected' : ''}" aria-pressed="${cf.days === d}" onclick="cfSet('days',${d})">${d}</button>`).join('')}
      </div>
      <div class="hf-hint">jours, à partir d’aujourd’hui ·
        <label for="cfDays" class="cf-custom">autre :</label>
        <input id="cfDays" class="pseudo-input cf-days-input" type="number" min="3" max="365" inputmode="numeric" value="${cf.days}" onchange="cfDuration(this.value);cfSet('days',cf.days)"> j</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Objectif</label>
      ${isBad
        ? `<div class="hf-fixed">Aucun écart pendant ${cf.days} jours</div><div class="hf-hint">Un seul écart et le défi est manqué.</div>`
        : `<div class="hf-seg" role="group" aria-label="Objectif">
            <button type="button" class="hf-chip hf-kind${cf.mode === 'all' ? ' selected' : ''}" aria-pressed="${cf.mode === 'all'}" onclick="cfSet('mode','all')"><b>Chaque jour</b><span>Tous les jours actifs</span></button>
            <button type="button" class="hf-chip hf-kind${cf.mode === 'min' ? ' selected' : ''}" aria-pressed="${cf.mode === 'min'}" onclick="cfSet('mode','min')"><b>Au moins…</b><span>Un nombre de jours</span></button>
          </div>
          ${cf.mode === 'min' ? `<div class="cf-min"><label for="cfMin">Réussir au moins</label>
            <input id="cfMin" class="pseudo-input cf-days-input" type="number" min="1" max="${cf.days}" inputmode="numeric" value="${minV}" onchange="cfSet('min',Math.max(1,parseInt(this.value,10)||1))"> jours sur ${cf.days}</div>` : ''}`}
    </div>
    <div class="modal-section">
      <label class="modal-label" for="cfTitle">Titre</label>
      <input id="cfTitle" class="pseudo-input hf-input" type="text" maxlength="50" value="${esc(title)}" oninput="cfInput('title',this.value)">
      <div class="hf-hint">Récompense : <b>+${chalRewardFor(required)} XP</b> (et autant d’XP de saison) si tu le relèves.</div>
    </div>
    <div class="hf-actions"><button type="button" class="modal-save-btn" onclick="saveChallenge()">Lancer le défi</button></div>`;
}
function saveChallenge() {
  if (!cf) return;
  const h = HABITS.find(x => x.id === cf.habitId); if (!h) return;
  if ((DB.challenges || []).filter(c => c.status === 'active').length >= CHAL_MAX_ACTIVE) { showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`, 2800, 'alert'); return; }
  if ((DB.challenges || []).some(c => c.status === 'active' && c.habitId === h.id)) { showToast('Cette habitude a déjà un défi en cours', 3000, 'alert'); return; }
  const days = cf.days;
  if (!(days >= 3 && days <= 365)) { showToast('Durée : entre 3 et 365 jours', 2800, 'alert'); return; }
  const mode = h.type === 'bad' ? 'all' : cf.mode;
  const min = Math.min(Math.max(1, Number(cf.min) || 1), days);
  const activeDays = chalActiveDays(h, days);
  if (activeDays === 0) { showToast('Cette habitude n’est active aucun de ces jours', 3200, 'alert'); return; }
  const required = mode === 'all' ? 'all' : Math.min(min, activeDays);
  const title = (cf.titleTouched ? cf.title : cfAutoTitle()).trim() || cfAutoTitle();
  const c = {
    id: 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    habitId: h.id, title: title.slice(0, 50), emoji: h.emoji || '🎯', color: h.color,
    days, required, start: today(), status: 'active',
    reward: chalRewardFor(required === 'all' ? activeDays : required),
  };
  DB.challenges.push(c);
  saveData();
  closeChallengeForm();
  updateChallenges();
  renderActivePage();
  showToast('Défi lancé : bon courage !', 2600, 'trophy');
}
function abandonChallenge(id) {
  const c = (DB.challenges || []).find(x => x.id === id); if (!c || c.status !== 'active') return;
  if (!confirm(`Abandonner le défi « ${c.title} » ?`)) return;
  c.status = 'abandoned'; c.endedOn = today();
  saveData(); renderActivePage();
  showToast('Défi abandonné', 2200);
}
function clearChallengeHistory() {
  if (!confirm('Effacer l’historique des défis terminés ?')) return;
  DB.challenges = (DB.challenges || []).filter(c => c.status === 'active');
  saveData(); renderActivePage();
}

// Petit bloc « saison » affiché sous la barre d'XP de la page Compte.
function seasonMiniHtml() {
  const s = seasonOf(new Date()); const r = seasonRank(currentSeasonXp());
  return `<div class="xp-card-row" style="margin-top:14px"><span class="xp-label">${s.def.emoji} ${esc(s.label)}</span><span class="xp-value">Rang ${r.roman} · ${r.name}</span></div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${r.pct}%"></div></div>`;
}
// Un défi peut se terminer pendant que l'app est en arrière-plan (changement de jour).
document.addEventListener('visibilitychange', () => { if (!document.hidden && updateChallenges()) renderActivePage(); });
