/* HabitsTracker · Humeur, calendrier d'humeur et journal du jour
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

function moodCalPrev() { moodCalMonth.setMonth(moodCalMonth.getMonth()-1); renderActivePage(); }
function moodCalNext() { const nm=new Date(moodCalMonth); nm.setMonth(nm.getMonth()+1); if(nm<=appNow()) moodCalMonth=nm; renderActivePage(); }

let currentMoodDate=null;
let selectedMoodValue=null;
let selectedFeelings=[];

function checkDailyMood() {
  if(sessionStorage.getItem('moodChecked')) return;
  sessionStorage.setItem('moodChecked','1');
  const t=today(); if(t<DB.createdAt) return;
  if(DB.moods[t]!==undefined) return;
  whenNoDialog(()=>{ if(DB.moods[t]===undefined && today()===t) openMoodModal(t); },2000);
}

function openMoodManual() { openMoodModal(today()); }

function openMoodModal(dateKey, toNotes) {
  currentMoodDate=dateKey; selectedMoodValue=null; selectedFeelings=[];
  const existing=DB.moods[dateKey];
  document.getElementById('moodStep1').classList.remove('hidden');
  document.getElementById('moodStep2').classList.add('hidden');
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.remove('selected'));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=true; btn.textContent='Je me sens…';
  const ttl=document.querySelector('#moodStep1 .mood-sheet-title');
  if(ttl){ const d=parseDate(dateKey); ttl.textContent = dateKey===today() ? 'Comment te sens-tu ?' : `Comment te sentais-tu le ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()} ?`; }
  if(existing!==undefined) selectMoodCard(existing);
  document.getElementById('moodModal').classList.add('open');
  if(existing!==undefined && toNotes) goToMoodStep2();
}

function closeMoodModal() { currentMoodDate=null; document.getElementById('moodModal').classList.remove('open'); }

function selectMoodCard(value) {
  selectedMoodValue=value;
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.value)===value));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=false;
  btn.textContent=`Je me sens ${MOOD_LABELS[value].toLowerCase()}`;
}

function goToMoodStep2() {
  if(!selectedMoodValue) return;
  const k=currentMoodDate;
  const feelings=FEELINGS_BY_MOOD[selectedMoodValue]||[];
  const prev=(DB.moods[k]===selectedMoodValue && DB.profile.moodFeelings && DB.profile.moodFeelings[k]) ? DB.profile.moodFeelings[k].split(',') : [];
  selectedFeelings=prev.filter(f=>feelings.includes(f));
  const title=document.getElementById('moodStep2Title');
  title.textContent=`${MOOD_LABELS[selectedMoodValue]} ! Comment décris-tu ton ressenti ?`;
  const grid=document.getElementById('feelingsGrid');
  grid.innerHTML=feelings.map(f=>`<button class="feeling-tag${selectedFeelings.includes(f)?' selected':''}" onclick="selectFeeling('${f}',this)">${f}</button>`).join('');
  const ta=document.getElementById('journalInput'); ta.value=(DB.journal&&DB.journal[k])||''; updateJournalCount();
  document.getElementById('feelingsConfirmBtn').textContent='Valider';
  document.getElementById('moodStep1').classList.add('hidden');
  document.getElementById('moodStep2').classList.remove('hidden');
}

function selectFeeling(feeling, btn) {
  btn.classList.toggle('selected');
  if(btn.classList.contains('selected')) {
    if(!selectedFeelings.includes(feeling)) selectedFeelings.push(feeling);
  } else {
    selectedFeelings=selectedFeelings.filter(f=>f!==feeling);
  }
}

function saveMoodWithFeelings() {
  if(!currentMoodDate||!selectedMoodValue) return;
  const k=currentMoodDate;
  DB.moods[k]=selectedMoodValue;
  if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};
  if(selectedFeelings.length>0) DB.profile.moodFeelings[k]=selectedFeelings.join(',');
  else delete DB.profile.moodFeelings[k];
  const ta=document.getElementById('journalInput');
  const note=ta?ta.value.trim().slice(0,JOURNAL_MAX):'';
  if(!DB.journal) DB.journal={};
  if(note) DB.journal[k]=note; else delete DB.journal[k];
  saveData();
  closeMoodModal();
  renderActivePage();
  showToast(`Humeur enregistrée ${MOOD_EMOJIS[selectedMoodValue]}${note?' · note ajoutée':''}`,2200);
}

function buildMoodCalHtml() {
  const year=moodCalMonth.getFullYear(); const month=moodCalMonth.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today();
  let headers=DAY_SHORT.map(d=>`<div class="mood-cal-header">${d[0]}${d[1]}</div>`).join('');
  let cells='';
  for(let i=0;i<startDow;i++) cells+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d); const k=fmtDate(dateObj); const mood=DB.moods[k];
    const isFuture=k>today_;
    if(mood!==undefined&&!isFuture){
      const hasNote=!!(DB.journal&&DB.journal[k]);
      cells+=`<div class="mood-cal-cell editable" role="button" tabindex="0" aria-label="Modifier l'humeur du ${d}" onclick="openMoodModal('${k}')" onkeydown="if(event.key==='Enter')openMoodModal('${k}')">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}${hasNote?'<span class="mood-note-dot" title="Note"></span>':''}</div>
        <div class="mood-cal-day-label" style="font-size:.55rem">${d}</div>
      </div>`;
    } else if(!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-empty" onclick="openMoodModal('${k}')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="7" y1="3" x2="7" y2="11"/><line x1="3" y1="7" x2="11" y2="7"/></svg>
        </div>
        <div class="mood-cal-day-label">${d}</div>
      </div>`;
    } else {
      cells+=`<div class="mood-cal-cell"><div class="mood-cal-day-label" style="opacity:.3">${d}</div></div>`;
    }
  }
  return `<div class="mood-cal-nav" style="margin-bottom:16px">
    <button class="mood-cal-nav-btn" onclick="moodCalPrev()"><svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg></button>
    <div class="mood-cal-month">${MONTH_NAMES[month]} ${year}</div>
    <button class="mood-cal-nav-btn" onclick="moodCalNext()"><svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg></button>
  </div>
  <div class="mood-cal-grid">${headers}${cells}</div>`;
}

/* ═══════════ Journal du jour (note attachée à l'humeur) ═══════════ */
const JOURNAL_MAX = 600;
let journalLimit = 5;
let journalQuery = '';

function updateJournalCount() {
  const ta = document.getElementById('journalInput'), c = document.getElementById('journalCount');
  if (ta && c) c.textContent = ta.value.length;
}
function journalKeys() { return Object.keys(DB.journal || {}).filter(k => DB.journal[k]).sort().reverse(); }
function journalDateLabel(k) {
  const d = parseDate(k); const y = d.getFullYear() !== appNow().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${DAY_FULL[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}${y}`;
}
function journalEntryHtml(k) {
  const mood = DB.moods[k]; const f = (DB.profile.moodFeelings || {})[k];
  const tags = f ? f.split(',').slice(0, 4).map(t => `<span class="journal-tag">${esc(t)}</span>`).join('') : '';
  return `<div class="journal-entry">
    <div class="journal-head">
      <span class="journal-emoji" aria-hidden="true">${MOOD_EMOJIS[mood] || '📝'}</span>
      <div class="journal-date">${journalDateLabel(k)}${mood ? ` · <span class="journal-mood">${MOOD_LABELS[mood]}</span>` : ''}</div>
      <div class="journal-actions">
        <button type="button" onclick="openMoodModal('${k}',true)" aria-label="Modifier la note du ${k}">${icon('edit')}</button>
        <button type="button" onclick="deleteJournalNote('${k}')" aria-label="Supprimer la note du ${k}">${icon('trash')}</button>
      </div>
    </div>
    ${tags ? `<div class="journal-tags">${tags}</div>` : ''}
    <div class="journal-text">${esc(DB.journal[k])}</div>
  </div>`;
}
function journalListHtml() {
  let keys = journalKeys();
  const q = journalQuery.trim().toLowerCase();
  if (q) keys = keys.filter(k => DB.journal[k].toLowerCase().includes(q));
  if (!keys.length) return `<div class="journal-empty">${q ? 'Aucune note ne correspond à ta recherche.' : 'Aucune note pour l’instant. Écris-en une quand tu enregistres ton humeur.'}</div>`;
  const shown = q ? keys : keys.slice(0, journalLimit);
  const more = !q && keys.length > shown.length
    ? `<button type="button" class="journal-more" onclick="moreJournal()">Voir plus (${keys.length - shown.length})</button>` : '';
  return shown.map(journalEntryHtml).join('') + more;
}
function buildJournalHtml() {
  const n = journalKeys().length;
  const search = n >= 3 ? `<input id="journalSearch" class="pseudo-input journal-search" type="search" placeholder="Rechercher dans le journal" value="${esc(journalQuery)}" aria-label="Rechercher dans le journal" oninput="searchJournal(this.value)">` : '';
  return `<div class="report-card" id="journalCard">
    <div class="report-card-header">
      <div class="report-card-title">Journal</div>
      <div class="report-period-badge">${n} note${n > 1 ? 's' : ''}</div>
    </div>
    ${search}
    <div id="journalList">${journalListHtml()}</div>
  </div>`;
}
function searchJournal(v) {
  journalQuery = v || '';
  const el = document.getElementById('journalList'); if (el) el.innerHTML = journalListHtml();
}
function moreJournal() { journalLimit += 10; const el = document.getElementById('journalList'); if (el) el.innerHTML = journalListHtml(); }
function deleteJournalNote(k) {
  if (!DB.journal || !DB.journal[k]) return;
  if (!confirm(`Supprimer la note du ${journalDateLabel(k)} ?\n\nTon humeur de ce jour est conservée.`)) return;
  delete DB.journal[k]; saveData();
  renderActivePage();
  showToast('Note supprimée', 2000, 'trash');
}