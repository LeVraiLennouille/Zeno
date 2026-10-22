/* HabitsTracker · Page Habitudes, formulaire d'habitude personnalisée et habitudes « à éviter »
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

function renderMyHabits() {
  const container=document.getElementById('myHabitsContent'); if(!container) return;
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const t=today();
  if(liveHabits().length===0){ container.innerHTML=`<div class="empty-note">Aucune habitude pour l'instant.<br>Appuie sur + pour créer la première.</div>${archivedSectionHtml()}`; return; }
  container.innerHTML=`<div class="my-habits-list">
    ${liveHabits().map(h=>{
      const streak=calcStreak(h).current;
      const done=isHabitDoneOn(h,t,todayDate);
      const live=h.type==='drink'||h.type==='counter';
      const inert=h.type==='bad'&&!!h.levels;
      let meta=h.freq||'Tous les jours';
      if(live){ const p=habitProgress(h,t); meta=`${fmtNum(p.v)} / ${fmtNum(p.goal)} ${p.unit}`; }
      if(h.type==='bad'){ const f=isBadFail(h.id,t); const bv=badVal(h.id,t); meta=f?('Craqué'+(bv?' · '+esc(bv):'')):'Tenu bon'; }
      return `<div class="my-habit-row" data-habit-id="${h.id}" style="--ink:${h.color}">
        <div class="my-habit-emoji">${habitIconMarkup(h)}</div>
        <div class="my-habit-info">
          <div class="my-habit-name">${esc(h.name)}</div>
          <div class="my-habit-meta"><span>${meta}</span><span class="streak-inline">${icon('flame')}${streak} j</span></div>
          ${live?progressBar(Math.min(100,Math.round(dayProgress(h,t,todayDate)*100)),h.name).replace('class="pbar"','class="pbar pbar-thin"'):''}
        </div>
        <button type="button" class="my-habit-edit" onclick="openHabitForm('${h.id}')" aria-label="Modifier ${esc(h.name)}">${icon('edit')}</button>
        <div class="habit-toggle-btn${done?' done':''}"${(live||inert)?' aria-hidden="true"':` onclick="toggleHabit('${h.id}')"`}>
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    }).join('')}
  </div>${archivedSectionHtml()}`;
}

/* ═══════════ Habitudes personnalisées ═══════════ */
const HABIT_COLORS = ['#8EA2FF','#C79BFF','#FFD23F','#52E0A1','#FF8A4C','#2EC4B6','#52C7F2','#FF7EB0','#C3E34A','#FF6B6B','#F7B267','#9BE0C4'];
const HABIT_EMOJIS = ['⭐','🎯','🧘','🍎','🥗','💊','🦷','🛏️','🚿','🎸','✍️','🎨','🧠','🌱','🐕','☕','🚭','💰','🏊','🚴','🧗','📝','🎮','🌞'];
const ALL_DAYS = [0,1,2,3,4,5,6];
const WEEKDAYS = [1,2,3,4,5];
const DOW_ORDER = [1,2,3,4,5,6,0];
const DOW_LETTER = {1:'L',2:'M',3:'M',4:'J',5:'V',6:'S',0:'D'};
const KIND_INFO = [
  { k:'good',    label:'Case à cocher', hint:'Un tap par jour' },
  { k:'counter', label:'Compteur',      hint:'Une quantité à atteindre' },
  { k:'water',   label:'Eau',           hint:'Une boisson, en ml' },
  { k:'weekly',  label:'Hebdomadaire',  hint:'Une fois par semaine suffit' },
  { k:'bad',     label:'À éviter',      hint:'Un comportement à limiter' },
];
const KIND_DEFAULTS = {
  counter: { goal:10,   step:1,   max:20,   unit:'' },
  water:   { goal:2000, step:250, max:5000, unit:'ml' },
};

const pad2 = n => String(n).padStart(2,'0');
const num  = v => { const n = parseFloat(String(v).replace(',','.')); return Number.isFinite(n) ? n : NaN; };
const nz   = (v,d) => v == null ? d : v;

function kindLabel(k) {
  if (k === 'drink') return 'Eau';
  const i = KIND_INFO.find(x => x.k === k);
  return i ? i.label : k;
}
function daysLabel(days) {
  const d = [...new Set(days)].sort((a,b) => ((a+6)%7) - ((b+6)%7));
  if (d.length === 7) return 'Tous les jours';
  if (d.length === 5 && WEEKDAYS.every(x => d.includes(x))) return 'Lundi - Vendredi';
  if (d.length === 2 && d.includes(6) && d.includes(0)) return 'Week-end';
  return d.map(x => DAY_SHORT[(x+6)%7]).join(', ');
}
function habitDays(h) {
  if (h.activeDays) return h.activeDays.slice();
  return h.weekdayOnly ? WEEKDAYS.slice() : ALL_DAYS.slice();
}

let hf = null; // état du formulaire habitude

function openAddHabit() { openHabitForm(); }

function openHabitForm(id) {
  const h = id ? HABITS.find(x => x.id === id) : null;
  if (id && !h) return;
  if (h) {
    hf = {
      mode:'edit', id:h.id, builtin:!h.custom, type:h.type,
      kind: h.type === 'drink' ? 'drink' : h.type,
      name:h.name, emoji:h.emoji || '⭐', color:h.color,
      days:habitDays(h), daysTouched:false, optional:!!h.optional,
      goal:nz(h.goal,''), step:nz(h.step,''), max:nz(h.max,''), unit:h.unit || '',
      levels:(h.levels || []).join(', '), badMode:h.levels ? 'levels' : 'simple',
    };
  } else {
    const used = HABITS.map(x => x.color);
    hf = {
      mode:'create', id:null, builtin:false, type:'good', kind:'good',
      name:'', emoji:'⭐', color:HABIT_COLORS.find(c => !used.includes(c)) || HABIT_COLORS[0],
      days:ALL_DAYS.slice(), daysTouched:true, optional:false,
      goal:'', step:'', max:'', unit:'',
      levels:'', badMode:'simple',
    };
  }
  document.getElementById('habitFormTitle').textContent = h ? 'Modifier l’habitude' : 'Nouvelle habitude';
  renderHabitForm();
  document.querySelector('#habitModal .modal-card').scrollTop = 0;
  document.getElementById('habitModal').classList.add('open');
  if (!h) setTimeout(() => { const el = document.getElementById('hfName'); if (el) el.focus(); }, 120);
}
function closeHabitForm() {
  hf = null;
  document.getElementById('habitModal').classList.remove('open');
}

function hfInput(key, val) { if (hf) hf[key] = val; }
function hfSet(key, val)   { if (!hf) return; hf[key] = val; renderHabitForm(); }
function hfToggleDay(d) {
  if (!hf) return;
  hf.days = hf.days.includes(d) ? hf.days.filter(x => x !== d) : [...hf.days, d];
  hf.daysTouched = true;
  renderHabitForm();
}
function hfDays(preset) {
  if (!hf) return;
  hf.days = preset === 'week' ? WEEKDAYS.slice() : ALL_DAYS.slice();
  hf.daysTouched = true;
  renderHabitForm();
}
function setHabitKind(k) {
  if (!hf || hf.mode !== 'create') return;
  hf.kind = k;
  const d = KIND_DEFAULTS[k];
  if (d) { hf.goal = d.goal; hf.step = d.step; hf.max = d.max; hf.unit = d.unit; }
  renderHabitForm();
}

function renderHabitForm() {
  const el = document.getElementById('habitFormBody');
  if (!el || !hf) return;
  const isEdit = hf.mode === 'edit';
  const k = hf.kind;
  const counterLike = k === 'counter' || k === 'water' || k === 'drink';
  const waterLike   = k === 'water' || k === 'drink';

  const kindBlock = isEdit
    ? `<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-fixed">${esc(kindLabel(k))}</div>
         <div class="hf-hint">Le type ne peut pas être modifié après la création.</div>
       </div>`
    : `<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-seg" role="group" aria-label="Type d’habitude">
           ${KIND_INFO.map(i => `<button type="button" class="hf-chip hf-kind${k === i.k ? ' selected' : ''}" aria-pressed="${k === i.k}" onclick="setHabitKind('${i.k}')"><b>${i.label}</b><span>${i.hint}</span></button>`).join('')}
         </div>
       </div>`;

  const emojiBlock = hf.builtin ? '' : `
    <div class="modal-section">
      <label class="modal-label" for="hfEmoji">Icône</label>
      <div class="hf-emoji-row">
        <input id="hfEmoji" class="pseudo-input hf-emoji-input" maxlength="8" value="${esc(hf.emoji)}" aria-label="Emoji de l’habitude" oninput="hfInput('emoji',this.value)">
        <span class="hf-hint" style="margin:0">Tape un emoji ou choisis-en un.</span>
      </div>
      <div class="hf-grid">
        ${HABIT_EMOJIS.map(e => `<button type="button" class="hf-emoji-btn${hf.emoji === e ? ' selected' : ''}" onclick="hfSet('emoji','${e}')" aria-label="Emoji ${e}">${e}</button>`).join('')}
      </div>
    </div>`;

  const colorBlock = `
    <div class="modal-section">
      <label class="modal-label">Couleur</label>
      <div class="hf-swatches">
        ${HABIT_COLORS.map(c => `<button type="button" class="hf-swatch${hf.color === c ? ' selected' : ''}" style="--c:${c}" aria-label="Couleur ${c}" aria-pressed="${hf.color === c}" onclick="hfSet('color','${c}')"></button>`).join('')}
      </div>
    </div>`;

  const daysBlock = k === 'weekly' ? '' : `
    <div class="modal-section">
      <label class="modal-label">Jours actifs</label>
      <div class="hf-days" role="group" aria-label="Jours actifs">
        ${DOW_ORDER.map(d => `<button type="button" class="hf-day${hf.days.includes(d) ? ' selected' : ''}" aria-pressed="${hf.days.includes(d)}" aria-label="${DAY_FULL[d]}" onclick="hfToggleDay(${d})">${DOW_LETTER[d]}</button>`).join('')}
      </div>
      <div class="hf-presets">
        <button type="button" class="hf-link" onclick="hfDays('all')">Tous les jours</button>
        <button type="button" class="hf-link" onclick="hfDays('week')">Lun – Ven</button>
      </div>
    </div>`;

  const badBlock = k !== 'bad' ? '' : `
    <div class="modal-section">
      ${!isEdit ? `<label class="modal-label">Suggestions</label>
      <div class="hf-presets-wrap" style="margin-bottom:16px">${BAD_PRESETS.map((p, i) => `<button type="button" class="hf-suggest" onclick="applyBadPreset(${i})">${p.emoji} ${esc(p.name)}</button>`).join('')}</div>` : ''}
      <label class="modal-label">Suivi</label>
      <div class="hf-seg" role="group" aria-label="Mode de suivi">
        <button type="button" class="hf-chip hf-kind${hf.badMode !== 'levels' ? ' selected' : ''}" aria-pressed="${hf.badMode !== 'levels'}" onclick="hfSet('badMode','simple')"><b>Simple</b><span>Un tap = échec du jour</span></button>
        <button type="button" class="hf-chip hf-kind${hf.badMode === 'levels' ? ' selected' : ''}" aria-pressed="${hf.badMode === 'levels'}" onclick="hfSet('badMode','levels')"><b>Par durée</b><span>Choisir un palier</span></button>
      </div>
      ${hf.badMode === 'levels'
        ? `<label class="modal-label" for="hfLevels" style="margin-top:16px">Paliers <span class="hf-opt">(séparés par des virgules)</span></label>
           <input id="hfLevels" class="pseudo-input hf-input" type="text" maxlength="80" placeholder="15 min, 30 min, 1 h, 2 h" value="${esc(hf.levels)}" oninput="hfInput('levels',this.value)">
           <div class="hf-hint">« Non » (aucun écart) est toujours proposé en premier : il valide la journée. Tout autre palier compte comme un échec.</div>`
        : `<div class="hf-hint">La journée est validée par défaut ; un tap marque l’échec et casse la série.</div>`}
    </div>`;

  const goalBlock = !counterLike ? '' : `
    <div class="modal-section">
      <label class="modal-label">Objectif</label>
      <div class="hf-num-grid">
        <div class="hf-num-field"><label for="hfGoal">Objectif du jour</label>
          <input id="hfGoal" class="pseudo-input hf-input" type="number" inputmode="decimal" step="any" min="0" value="${esc(hf.goal)}" oninput="hfInput('goal',this.value)"></div>
        <div class="hf-num-field"><label for="hfStep">Ajout par tap</label>
          <input id="hfStep" class="pseudo-input hf-input" type="number" inputmode="decimal" step="any" min="0" value="${esc(hf.step)}" oninput="hfInput('step',this.value)"></div>
        <div class="hf-num-field"><label for="hfMax">Maximum</label>
          <input id="hfMax" class="pseudo-input hf-input" type="number" inputmode="decimal" step="any" min="0" value="${esc(hf.max)}" oninput="hfInput('max',this.value)"></div>
        <div class="hf-num-field"><label for="hfUnit">Unité</label>
          <input id="hfUnit" class="pseudo-input hf-input" type="text" maxlength="8" placeholder="km, pages…" value="${esc(waterLike ? 'ml' : hf.unit)}"${waterLike ? ' readonly' : ''} oninput="hfInput('unit',this.value)"></div>
      </div>
    </div>`;

  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="hfName">Nom</label>
      <input id="hfName" class="pseudo-input hf-input" type="text" maxlength="30" placeholder="Ex. Méditer, Vitamines…" value="${esc(hf.name)}" oninput="hfInput('name',this.value)" onkeydown="if(event.key==='Enter') saveHabitForm()">
    </div>
    ${kindBlock}
    ${emojiBlock}
    ${colorBlock}
    ${daysBlock}
    ${goalBlock}
    ${badBlock}
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Optionnelle</div>
        <div class="pref-hint">Ne compte pas dans la journée parfaite</div>
      </div>
      <button type="button" class="pref-toggle ${hf.optional ? 'on' : 'off'}" role="switch" aria-checked="${hf.optional}" aria-label="Habitude optionnelle" onclick="hfSet('optional',!hf.optional)">${hf.optional ? 'Activé' : 'Désactivé'}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveHabitForm()">${isEdit ? 'Enregistrer' : 'Créer l’habitude'}</button>
      ${isEdit ? `<button type="button" class="hf-archive-btn" onclick="archiveHabitFromForm()">📦 Archiver l’habitude</button>
      <div class="hf-hint" style="margin:0;text-align:center">L’archive masque l’habitude mais garde son historique et tes statistiques.</div>
      <button type="button" class="modal-reset-btn" onclick="deleteHabitFromForm()">${icon('trash')} Supprimer définitivement</button>` : ''}
    </div>`;
}

function saveHabitForm() {
  if (!hf) return;
  const name = hf.name.trim();
  if (!name) { showToast('Donne un nom à ton habitude', 2500, 'alert'); return; }
  if (HABITS.some(x => x.id !== hf.id && x.name.trim().toLowerCase() === name.toLowerCase())) {
    showToast('Une habitude (peut-être archivée) porte déjà ce nom', 3200, 'alert'); return;
  }
  const k = hf.kind;
  const counterLike = k === 'counter' || k === 'water' || k === 'drink';
  const waterLike   = k === 'water' || k === 'drink';
  if (k !== 'weekly' && hf.days.length === 0) { showToast('Choisis au moins un jour', 2800, 'alert'); return; }

  let goal, step, max;
  if (counterLike) {
    goal = num(hf.goal); step = num(hf.step); max = num(hf.max);
    if (!(goal > 0 && step > 0 && max > 0)) { showToast('Objectif, ajout et maximum doivent être positifs', 3200, 'alert'); return; }
    if (max < goal)  { showToast('Le maximum doit être au moins égal à l’objectif', 3200, 'alert'); return; }
    if (step > max)  { showToast('L’ajout par tap dépasse le maximum', 3000, 'alert'); return; }
  }
  const unit = waterLike ? 'ml' : String(hf.unit || '').trim().slice(0, 8);
  let levels = null;
  if (k === 'bad' && hf.badMode === 'levels') {
    levels = parseLevels(hf.levels).slice(0, 8);
    if (levels.length === 0) { showToast('Ajoute au moins un palier (ex. 15 min, 1 h)', 3200, 'alert'); return; }
  }

  if (hf.mode === 'create') {
    const h = {
      id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name, emoji: (hf.emoji || '').trim() || '⭐',
      type: k === 'water' ? 'counter' : k,
      color: hf.color, custom: true, since: today(),
      optional: hf.optional, weekdayOnly: false,
    };
    if (k === 'weekly') h.freq = 'Chaque semaine';
    else {
      if (hf.days.length < 7) h.activeDays = hf.days.slice();
      h.freq = daysLabel(hf.days);
    }
    if (counterLike) { h.goal = goal; h.step = step; h.max = max; h.unit = unit; }
    if (levels) h.levels = levels;
    HABITS.push(h);
    DB.habits[h.id] = { logs:{} };
    saveData();
    closeHabitForm();
    renderActivePage();
    showToast(`« ${name} » ajoutée`, 2600, 'star');
    return;
  }

  const h = HABITS.find(x => x.id === hf.id);
  if (!h) { closeHabitForm(); return; }
  h.name = name;
  h.color = hf.color;
  h.optional = hf.optional;
  if (!hf.builtin) h.emoji = (hf.emoji || '').trim() || '⭐';
  if (counterLike) { h.goal = goal; h.step = step; h.max = max; h.unit = unit; }
  if (k === 'bad') { if (levels) h.levels = levels; else delete h.levels; }
  if (k !== 'weekly' && hf.daysTouched) {
    h.weekdayOnly = false;
    if (hf.days.length === 7) delete h.activeDays; else h.activeDays = hf.days.slice();
    h.freq = daysLabel(hf.days);
  }
  saveData();
  closeHabitForm();
  renderActivePage();
  showToast('Habitude mise à jour', 2200);
}

/* ═══════════ Habitudes « à éviter » ═══════════ */
const BAD_PRESETS = [
  { name:'Jeux vidéo',     emoji:'🎮', levels:'15 min, 30 min, 1 h, 2 h, +3 h' },
  { name:'Scroll',         emoji:'📱', levels:'15 min, 30 min, 1 h, +2 h' },
  { name:'Films / séries', emoji:'🎬', levels:'1, 2, +3' },
  { name:'Sucre ajouté',   emoji:'🍬', levels:'' },
  { name:'Alcool',         emoji:'🍷', levels:'' },
  { name:'Tabac',          emoji:'🚬', levels:'' },
];
function badVal(id, k) { const e = DB.habits[id]; return (e && e.vals && e.vals[k]) || ''; }
function clearBadVal(id, k) { const e = DB.habits[id]; if (e && e.vals) delete e.vals[k]; }
function parseLevels(str) {
  const seen = new Set(); const out = [];
  String(str || '').split(',').forEach(s => { const v = s.trim().slice(0, 10); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); } });
  return out;
}
function setBadLevel(id, i) {
  const h = HABITS.find(x => x.id === id); if (!h || !h.levels) return;
  const t = today(); const e = DB.habits[id]; if (!e.vals) e.vals = {};
  const wasFail = e.logs[t] === 'fail';
  if (i === 0) { delete e.logs[t]; delete e.vals[t]; if (wasFail) playSound('undo'); }
  else { e.logs[t] = 'fail'; e.vals[t] = h.levels[i - 1]; playSound('fail'); }
  saveData(); checkAchievements(); afterToggle(id);
}
function buildBadLevels(habit, t) {
  const fail = isBadFail(habit.id, t); const cur = fail ? badVal(habit.id, t) : '';
  const chips = ['Non', ...habit.levels].map((lbl, i) => {
    const sel = i === 0 ? !fail : (fail && cur === habit.levels[i - 1]);
    return `<button type="button" class="bad-chip${i === 0 ? ' bad-chip-ok' : ''}${sel ? ' sel' : ''}" aria-pressed="${sel}" onclick="setBadLevel('${habit.id}',${i})">${esc(lbl)}</button>`;
  }).join('');
  return `<div class="bad-levels" role="group" aria-label="${esc(habit.name)}">${chips}</div>`;
}
function applyBadPreset(i) {
  const p = BAD_PRESETS[i]; if (!hf || !p) return;
  hf.name = p.name; hf.emoji = p.emoji;
  hf.badMode = p.levels ? 'levels' : 'simple'; hf.levels = p.levels;
  renderHabitForm();
}
