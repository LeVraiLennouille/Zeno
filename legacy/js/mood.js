function moodCalPrev(){moodCalMonth.setMonth(moodCalMonth.getMonth()-1),renderActivePage()}
function moodCalNext(){const o=new Date(moodCalMonth);o.setMonth(o.getMonth()+1),o<=appNow()&&(moodCalMonth=o),renderActivePage()}
let currentMoodDate=null;
let selectedMoodValue=null;
let selectedFeelings=[];
function checkDailyMood(){if(sessionStorage.getItem("moodChecked"))return;sessionStorage.setItem("moodChecked","1");const e=today();e<DB.createdAt||DB.moods[e]===void 0&&whenNoDialog(()=>{DB.moods[e]===void 0&&today()===e&&openMoodModal(e)},2e3)}
function openMoodManual(){openMoodModal(today())}
function openMoodModal(e,s){currentMoodDate=e,selectedMoodValue=null,selectedFeelings=[];const o=DB.moods[e];document.getElementById("moodStep1").classList.remove("hidden"),document.getElementById("moodStep2").classList.add("hidden"),document.querySelectorAll(".mood-emoji-card").forEach(t=>t.classList.remove("selected"));const d=document.getElementById("moodConfirmBtn");d.disabled=!0,d.textContent="Je me sens…";const n=document.querySelector("#moodStep1 .mood-sheet-title");if(n){const t=parseDate(e);n.textContent=e===today()?"Comment te sens-tu ?":`Comment te sentais-tu le ${t.getDate()} ${MONTH_SHORT[t.getMonth()].toLowerCase()} ?`}o!==void 0&&selectMoodCard(o),document.getElementById("moodModal").classList.add("open"),o!==void 0&&s&&goToMoodStep2()}
function closeMoodModal(){currentMoodDate=null,document.getElementById("moodModal").classList.remove("open")}
function selectMoodCard(e){selectedMoodValue=e,document.querySelectorAll(".mood-emoji-card").forEach(o=>o.classList.toggle("selected",parseInt(o.dataset.value)===e));const t=document.getElementById("moodConfirmBtn");t.disabled=!1,t.textContent=`Je me sens ${MOOD_LABELS[e].toLowerCase()}`}
function goToMoodStep2(){if(!selectedMoodValue)return;const t=currentMoodDate,o=FEELINGS_BY_MOOD[selectedMoodValue]||[],n=DB.moods[t]===selectedMoodValue&&DB.profile.moodFeelings&&DB.profile.moodFeelings[t]?DB.profile.moodFeelings[t].split(","):[];selectedFeelings=n.filter(e=>o.includes(e));const l=document.getElementById("moodStep2Title");l.textContent=`${MOOD_LABELS[selectedMoodValue]} ! Comment décris-tu ton ressenti ?`;const d=document.getElementById("feelingsGrid");d.innerHTML=o.map(e=>`<button class="feeling-tag${selectedFeelings.includes(e)?" selected":""}" onclick="selectFeeling('${e}',this)">${e}</button>`).join("");const s=document.getElementById("journalInput");s.value=DB.journal&&DB.journal[t]||"",updateJournalCount(),document.getElementById("feelingsConfirmBtn").textContent="Valider",document.getElementById("moodStep1").classList.add("hidden"),document.getElementById("moodStep2").classList.remove("hidden")}
function selectFeeling(e,s){s.classList.toggle("selected"),s.classList.contains("selected")?selectedFeelings.includes(e)||selectedFeelings.push(e):selectedFeelings=selectedFeelings.filter(l=>l!==e)}
function saveMoodWithFeelings(){if(!currentMoodDate||!selectedMoodValue)return;const e=currentMoodDate;DB.moods[e]=selectedMoodValue,DB.profile.moodFeelings||(DB.profile.moodFeelings={}),selectedFeelings.length>0?DB.profile.moodFeelings[e]=selectedFeelings.join(","):delete DB.profile.moodFeelings[e];const l=document.getElementById("journalInput"),o=l?l.value.trim().slice(0,JOURNAL_MAX):"";DB.journal||(DB.journal={}),o?DB.journal[e]=o:delete DB.journal[e],saveData(),closeMoodModal(),renderActivePage(),showToast(`Humeur enregistrée ${MOOD_EMOJIS[selectedMoodValue]}${o?" · note ajoutée":""}`,2200)}
function buildMoodCalHtml(){const t=moodCalMonth.getFullYear(),a=moodCalMonth.getMonth(),d=new Date(t,a,1),i=new Date(t,a+1,0),c=d.getDay()===0?6:d.getDay()-1,v=today();let m=DAY_SHORT.map(o=>`<div class="mood-cal-header">${o[0]}${o[1]}</div>`).join(""),e="";for(let o=0;o<c;o++)e+="<div></div>";for(let o=1;o<=i.getDate();o++){const r=new Date(t,a,o),l=fmtDate(r),s=DB.moods[l],n=l>v;if(s!==void 0&&!n){const y=!!(DB.journal&&DB.journal[l]);e+=`<div class="mood-cal-cell editable" role="button" tabindex="0" aria-label="Modifier l'humeur du ${o}" onclick="openMoodModal('${l}')" onkeydown="if(event.key==='Enter')openMoodModal('${l}')">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[s]||"😐"}${y?'<span class="mood-note-dot" title="Note"></span>':""}</div>
        <div class="mood-cal-day-label" style="font-size:.55rem">${o}</div>
      </div>`}else n?e+=`<div class="mood-cal-cell"><div class="mood-cal-day-label" style="opacity:.3">${o}</div></div>`:e+=`<div class="mood-cal-cell">
        <div class="mood-cal-empty" onclick="openMoodModal('${l}')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="7" y1="3" x2="7" y2="11"/><line x1="3" y1="7" x2="11" y2="7"/></svg>
        </div>
        <div class="mood-cal-day-label">${o}</div>
      </div>`}return`<div class="mood-cal-nav" style="margin-bottom:16px">
    <button class="mood-cal-nav-btn" onclick="moodCalPrev()"><svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg></button>
    <div class="mood-cal-month">${MONTH_NAMES[a]} ${t}</div>
    <button class="mood-cal-nav-btn" onclick="moodCalNext()"><svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg></button>
  </div>
  <div class="mood-cal-grid">${m}${e}</div>`}
const JOURNAL_MAX=600;
let journalLimit=5;
let journalQuery="";
function updateJournalCount(){const t=document.getElementById("journalInput"),n=document.getElementById("journalCount");t&&n&&(n.textContent=t.value.length)}
function journalKeys(){return Object.keys(DB.journal||{}).filter(r=>DB.journal[r]).sort().reverse()}
function journalDateLabel(t){const e=parseDate(t),a=e.getFullYear()!==appNow().getFullYear()?` ${e.getFullYear()}`:"";return`${DAY_FULL[e.getDay()].slice(0,3)}. ${e.getDate()} ${MONTH_SHORT[e.getMonth()].toLowerCase()}${a}`}
function journalEntryHtml(a){const o=DB.moods[a],n=(DB.profile.moodFeelings||{})[a],t=n?n.split(",").slice(0,4).map(l=>`<span class="journal-tag">${esc(l)}</span>`).join(""):"";return`<div class="journal-entry">
    <div class="journal-head">
      <span class="journal-emoji" aria-hidden="true">${MOOD_EMOJIS[o]||"📝"}</span>
      <div class="journal-date">${journalDateLabel(a)}${o?` · <span class="journal-mood">${MOOD_LABELS[o]}</span>`:""}</div>
      <div class="journal-actions">
        <button type="button" onclick="openMoodModal('${a}',true)" aria-label="Modifier la note du ${a}">${icon("edit")}</button>
        <button type="button" onclick="deleteJournalNote('${a}')" aria-label="Supprimer la note du ${a}">${icon("trash")}</button>
      </div>
    </div>
    ${t?`<div class="journal-tags">${t}</div>`:""}
    <div class="journal-text">${esc(DB.journal[a])}</div>
  </div>`}
function journalListHtml(){let n=journalKeys();const e=journalQuery.trim().toLowerCase();if(e&&(n=n.filter(r=>DB.journal[r].toLowerCase().includes(e))),!n.length)return`<div class="journal-empty">${e?"Aucune note ne correspond à ta recherche.":"Aucune note pour l’instant. Écris-en une quand tu enregistres ton humeur."}</div>`;const t=e?n:n.slice(0,journalLimit),o=!e&&n.length>t.length?`<button type="button" class="journal-more" onclick="moreJournal()">Voir plus (${n.length-t.length})</button>`:"";return t.map(journalEntryHtml).join("")+o}
function buildJournalHtml(){const r=journalKeys().length,a=r>=3?`<input id="journalSearch" class="pseudo-input journal-search" type="search" placeholder="Rechercher dans le journal" value="${esc(journalQuery)}" aria-label="Rechercher dans le journal" oninput="searchJournal(this.value)">`:"";return`<div class="report-card" id="journalCard">
    <div class="report-card-header">
      <div class="report-card-title">Journal</div>
      <div class="report-period-badge">${r} note${r>1?"s":""}</div>
    </div>
    ${a}
    <div id="journalList">${journalListHtml()}</div>
  </div>`}
function searchJournal(e){journalQuery=e||"";const n=document.getElementById("journalList");n&&(n.innerHTML=journalListHtml())}
function moreJournal(){journalLimit+=10;const n=document.getElementById("journalList");n&&(n.innerHTML=journalListHtml())}
function deleteJournalNote(e){!DB.journal||!DB.journal[e]||confirm(`Supprimer la note du ${journalDateLabel(e)} ?

Ton humeur de ce jour est conservée.`)&&(delete DB.journal[e],saveData(),renderActivePage(),showToast("Note supprimée",2e3,"trash"))}
