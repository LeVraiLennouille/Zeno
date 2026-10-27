function renderMyHabits(){const n=document.getElementById("myHabitsContent");if(!n)return;const o=appNow();o.setHours(0,0,0,0);const e=today();if(reorderMode&&liveHabits().length>0){renderReorderList(n);return}if(liveHabits().length===0){n.innerHTML=`<div class="empty-note">Aucune habitude pour l'instant.<br>Appuie sur + pour créer la première.</div>${archivedSectionHtml()}`;return}n.innerHTML=`<div class="my-habits-list">
    ${liveHabits().map(t=>{const c=calcStreak(t).current,l=isHabitDoneOn(t,e,o),s=t.type==="drink"||t.type==="counter",d=t.type==="bad"&&!!t.levels;let a=t.freq||"Tous les jours";if(t.type==="times"&&(a=timesWeekText(t)),s){const i=habitProgress(t,e);a=`${fmtNum(i.v)} / ${fmtNum(i.goal)} ${i.unit}`}if(t.type==="bad"){const i=isBadFail(t.id,e),r=badVal(t.id,e);a=i?"Craqué"+(r?" · "+esc(r):""):"Tenu bon"}return`<div class="my-habit-row" data-habit-id="${t.id}" style="--ink:${t.color}">
        <button type="button" class="my-habit-emoji my-habit-open" onclick="openHabitDetail('${t.id}')" aria-label="Voir la fiche de ${esc(t.name)}">${habitIconMarkup(t)}</button>
        <div class="my-habit-info">
          <div class="my-habit-name"><button type="button" class="my-habit-open" onclick="openHabitDetail('${t.id}')">${esc(t.name)}</button></div>
          <div class="my-habit-meta"><span>${a}</span><span class="streak-inline">${icon("flame")}${streakLabel(t,c)}</span></div>
          ${s?progressBar(Math.min(100,Math.round(dayProgress(t,e,o)*100)),t.name).replace('class="pbar"','class="pbar pbar-thin"'):""}
        </div>
        <button type="button" class="my-habit-edit" onclick="openHabitForm('${t.id}')" aria-label="Modifier ${esc(t.name)}">${icon("edit")}</button>
        <div class="habit-toggle-btn${l?" done":""}"${s||d?' aria-hidden="true"':` onclick="toggleHabit('${t.id}')"`}>
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`}).join("")}
  </div>${archivedSectionHtml()}`}
const HABIT_COLORS=["#8EA2FF","#C79BFF","#FFD23F","#52E0A1","#FF8A4C","#2EC4B6","#52C7F2","#FF7EB0","#C3E34A","#FF6B6B","#F7B267","#9BE0C4"];
const HABIT_EMOJIS=["⭐","🎯","🧘","🍎","🥗","💊","🦷","🛏️","🚿","🎸","✍️","🎨","🧠","🌱","🐕","☕","🚭","💰","🏊","🚴","🧗","📝","🎮","🌞"];
const ALL_DAYS=[0,1,2,3,4,5,6];
const WEEKDAYS=[1,2,3,4,5];
const DOW_ORDER=[1,2,3,4,5,6,0];
const DOW_LETTER={1:"L",2:"M",3:"M",4:"J",5:"V",6:"S",0:"D"};
const KIND_INFO=[{k:"good",label:"Case à cocher",hint:"Un tap par jour"},{k:"counter",label:"Compteur",hint:"Une quantité à atteindre"},{k:"water",label:"Eau",hint:"Une boisson, en ml"},{k:"weekly",label:"Hebdomadaire",hint:"Une fois par semaine suffit"},{k:"bad",label:"À éviter",hint:"Un comportement à limiter"},{k:"times",label:"X fois / semaine",hint:"Quels que soient les jours"}];
const KIND_DEFAULTS={counter:{goal:10,step:1,max:20,unit:""},water:{goal:2e3,step:250,max:5e3,unit:"ml"}};
const pad2=t=>String(t).padStart(2,"0");
const num=e=>{const n=parseFloat(String(e).replace(",","."));return Number.isFinite(n)?n:NaN};
const nz=(n,l)=>n??l;
function kindLabel(n){if(n==="drink")return"Eau";const i=KIND_INFO.find(r=>r.k===n);return i?i.label:n}
function daysLabel(r){const e=[...new Set(r)].sort((n,t)=>(n+6)%7-(t+6)%7);return e.length===7?"Tous les jours":e.length===5&&WEEKDAYS.every(n=>e.includes(n))?"Lundi - Vendredi":e.length===2&&e.includes(6)&&e.includes(0)?"Week-end":e.map(n=>DAY_SHORT[(n+6)%7]).join(", ")}
function habitDays(e){return e.activeDays?e.activeDays.slice():e.weekdayOnly?WEEKDAYS.slice():ALL_DAYS.slice()}
let hf=null;
function openAddHabit(){openHabitForm()}
function openHabitForm(o){const e=o?HABITS.find(t=>t.id===o):null;if(!(o&&!e)){if(e)hf={mode:"edit",id:e.id,builtin:!e.custom,type:e.type,kind:e.type==="drink"?"drink":e.type,name:e.name,emoji:e.emoji||"⭐",color:e.color,days:habitDays(e),daysTouched:!1,optional:!!e.optional,goal:nz(e.goal,""),step:nz(e.step,""),max:nz(e.max,""),unit:e.unit||"",levels:(e.levels||[]).join(", "),badMode:e.levels?"levels":"simple",target:nz(e.target,3)};else{const t=HABITS.map(l=>l.color);hf={mode:"create",id:null,builtin:!1,type:"good",kind:"good",name:"",emoji:"⭐",color:HABIT_COLORS.find(l=>!t.includes(l))||HABIT_COLORS[0],days:ALL_DAYS.slice(),daysTouched:!0,optional:!1,goal:"",step:"",max:"",unit:"",levels:"",badMode:"simple",target:3}}document.getElementById("habitFormTitle").textContent=e?"Modifier l’habitude":"Nouvelle habitude",renderHabitForm(),document.querySelector("#habitModal .modal-card").scrollTop=0,document.getElementById("habitModal").classList.add("open"),e||setTimeout(()=>{const t=document.getElementById("hfName");t&&t.focus()},120)}}
function closeHabitForm(){hf=null,document.getElementById("habitModal").classList.remove("open")}
function hfInput(f,h){hf&&(hf[f]=h)}
function hfSet(f,r){hf&&(hf[f]=r,renderHabitForm())}
function hfToggleDay(f){hf&&(hf.days=hf.days.includes(f)?hf.days.filter(e=>e!==f):[...hf.days,f],hf.daysTouched=!0,renderHabitForm())}
function hfDays(e){hf&&(hf.days=e==="week"?WEEKDAYS.slice():ALL_DAYS.slice(),hf.daysTouched=!0,renderHabitForm())}
function setHabitKind(f){if(!hf||hf.mode!=="create")return;hf.kind=f;const t=KIND_DEFAULTS[f];t&&(hf.goal=t.goal,hf.step=t.step,hf.max=t.max,hf.unit=t.unit),renderHabitForm()}
function renderHabitForm(){const t=document.getElementById("habitFormBody");if(!t||!hf)return;const l=hf.mode==="edit",a=hf.kind,i=a==="counter"||a==="water"||a==="drink",s=a==="water"||a==="drink",o=l?`<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-fixed">${esc(kindLabel(a))}</div>
         <div class="hf-hint">Le type ne peut pas être modifié après la création.</div>
       </div>`:`<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-seg" role="group" aria-label="Type d’habitude">
           ${KIND_INFO.map(e=>`<button type="button" class="hf-chip hf-kind${a===e.k?" selected":""}" aria-pressed="${a===e.k}" onclick="setHabitKind('${e.k}')"><b>${e.label}</b><span>${e.hint}</span></button>`).join("")}
         </div>
       </div>`,n=hf.builtin?"":`
    <div class="modal-section">
      <label class="modal-label" for="hfEmoji">Icône</label>
      <div class="hf-emoji-row">
        <input id="hfEmoji" class="pseudo-input hf-emoji-input" maxlength="8" value="${esc(hf.emoji)}" aria-label="Emoji de l’habitude" oninput="hfInput('emoji',this.value)">
        <span class="hf-hint" style="margin:0">Tape un emoji ou choisis-en un.</span>
      </div>
      <div class="hf-grid">
        ${HABIT_EMOJIS.map(e=>`<button type="button" class="hf-emoji-btn${hf.emoji===e?" selected":""}" onclick="hfSet('emoji','${e}')" aria-label="Emoji ${e}">${e}</button>`).join("")}
      </div>
    </div>`,d=`
    <div class="modal-section">
      <label class="modal-label">Couleur</label>
      <div class="hf-swatches">
        ${HABIT_COLORS.map(e=>`<button type="button" class="hf-swatch${hf.color===e?" selected":""}" style="--c:${e}" aria-label="Couleur ${e}" aria-pressed="${hf.color===e}" onclick="hfSet('color','${e}')"></button>`).join("")}
      </div>
    </div>`,c=a!=="times"?"":`
    <div class="modal-section">
      <label class="modal-label">Objectif par semaine</label>
      <div class="hf-days" role="group" aria-label="Nombre de fois par semaine">
        ${[1,2,3,4,5,6].map(e=>`<button type="button" class="hf-day${hf.target===e?" selected":""}" aria-pressed="${hf.target===e}" onclick="hfSet('target',${e})">${e}</button>`).join("")}
      </div>
      <div class="hf-hint"><b>${hf.target} fois par semaine</b> (du lundi au dimanche), peu importe les jours. Tu coches chaque séance ; la série compte les <b>semaines réussies</b>.</div>
    </div>`,u=a==="weekly"||a==="times"?"":`
    <div class="modal-section">
      <label class="modal-label">Jours actifs</label>
      <div class="hf-days" role="group" aria-label="Jours actifs">
        ${DOW_ORDER.map(e=>`<button type="button" class="hf-day${hf.days.includes(e)?" selected":""}" aria-pressed="${hf.days.includes(e)}" aria-label="${DAY_FULL[e]}" onclick="hfToggleDay(${e})">${DOW_LETTER[e]}</button>`).join("")}
      </div>
      <div class="hf-presets">
        <button type="button" class="hf-link" onclick="hfDays('all')">Tous les jours</button>
        <button type="button" class="hf-link" onclick="hfDays('week')">Lun – Ven</button>
      </div>
    </div>`,p=a!=="bad"?"":`
    <div class="modal-section">
      ${l?"":`<label class="modal-label">Suggestions</label>
      <div class="hf-presets-wrap" style="margin-bottom:16px">${BAD_PRESETS.map((e,r)=>`<button type="button" class="hf-suggest" onclick="applyBadPreset(${r})">${e.emoji} ${esc(e.name)}</button>`).join("")}</div>`}
      <label class="modal-label">Suivi</label>
      <div class="hf-seg" role="group" aria-label="Mode de suivi">
        <button type="button" class="hf-chip hf-kind${hf.badMode!=="levels"?" selected":""}" aria-pressed="${hf.badMode!=="levels"}" onclick="hfSet('badMode','simple')"><b>Simple</b><span>Un tap = échec du jour</span></button>
        <button type="button" class="hf-chip hf-kind${hf.badMode==="levels"?" selected":""}" aria-pressed="${hf.badMode==="levels"}" onclick="hfSet('badMode','levels')"><b>Par durée</b><span>Choisir un palier</span></button>
      </div>
      ${hf.badMode==="levels"?`<label class="modal-label" for="hfLevels" style="margin-top:16px">Paliers <span class="hf-opt">(séparés par des virgules)</span></label>
           <input id="hfLevels" class="pseudo-input hf-input" type="text" maxlength="80" placeholder="15 min, 30 min, 1 h, 2 h" value="${esc(hf.levels)}" oninput="hfInput('levels',this.value)">
           <div class="hf-hint">« Non » (aucun écart) est toujours proposé en premier : il valide la journée. Tout autre palier compte comme un échec.</div>`:'<div class="hf-hint">La journée est validée par défaut ; un tap marque l’échec et casse la série.</div>'}
    </div>`,h=i?`
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
          <input id="hfUnit" class="pseudo-input hf-input" type="text" maxlength="8" placeholder="km, pages…" value="${esc(s?"ml":hf.unit)}"${s?" readonly":""} oninput="hfInput('unit',this.value)"></div>
      </div>
    </div>`:"";t.innerHTML=`
    <div class="modal-section">
      <label class="modal-label" for="hfName">Nom</label>
      <input id="hfName" class="pseudo-input hf-input" type="text" maxlength="30" placeholder="Ex. Méditer, Vitamines…" value="${esc(hf.name)}" oninput="hfInput('name',this.value)" onkeydown="if(event.key==='Enter') saveHabitForm()">
    </div>
    ${o}
    ${n}
    ${d}
    ${c}
    ${u}
    ${h}
    ${p}
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Optionnelle</div>
        <div class="pref-hint">Ne compte pas dans la journée parfaite</div>
      </div>
      <button type="button" class="pref-toggle ${hf.optional?"on":"off"}" role="switch" aria-checked="${hf.optional}" aria-label="Habitude optionnelle" onclick="hfSet('optional',!hf.optional)">${hf.optional?"Activé":"Désactivé"}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveHabitForm()">${l?"Enregistrer":"Créer l’habitude"}</button>
      ${l?`<button type="button" class="hf-archive-btn" onclick="archiveHabitFromForm()">📦 Archiver l’habitude</button>
      <div class="hf-hint" style="margin:0;text-align:center">L’archive masque l’habitude mais garde son historique et tes statistiques.</div>
      <button type="button" class="modal-reset-btn" onclick="deleteHabitFromForm()">${icon("trash")} Supprimer définitivement</button>`:""}
    </div>`}
function saveHabitForm(){if(!hf)return;const s=hf.name.trim();if(!s){showToast("Donne un nom à ton habitude",2500,"alert");return}if(HABITS.some(t=>t.id!==hf.id&&t.name.trim().toLowerCase()===s.toLowerCase())){showToast("Une habitude (peut-être archivée) porte déjà ce nom",3200,"alert");return}const a=hf.kind,l=a==="counter"||a==="water"||a==="drink",h=a==="water"||a==="drink";if(a!=="weekly"&&a!=="times"&&hf.days.length===0){showToast("Choisis au moins un jour",2800,"alert");return}let r,n,i;if(l){if(r=num(hf.goal),n=num(hf.step),i=num(hf.max),!(r>0&&n>0&&i>0)){showToast("Objectif, ajout et maximum doivent être positifs",3200,"alert");return}if(i<r){showToast("Le maximum doit être au moins égal à l’objectif",3200,"alert");return}if(n>i){showToast("L’ajout par tap dépasse le maximum",3e3,"alert");return}}const f=h?"ml":String(hf.unit||"").trim().slice(0,8);let o=null;if(a==="bad"&&hf.badMode==="levels"&&(o=parseLevels(hf.levels).slice(0,8),o.length===0)){showToast("Ajoute au moins un palier (ex. 15 min, 1 h)",3200,"alert");return}if(hf.mode==="create"){const t={id:"c_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:s,emoji:(hf.emoji||"").trim()||"⭐",type:a==="water"?"counter":a,color:hf.color,custom:!0,since:today(),optional:hf.optional,weekdayOnly:!1};a==="weekly"?t.freq="Chaque semaine":a==="times"?(t.target=Math.max(1,Math.min(TIMES_MAX,Math.floor(hf.target)||3)),t.freq=`${t.target} fois par semaine`):(hf.days.length<7&&(t.activeDays=hf.days.slice()),t.freq=daysLabel(hf.days)),l&&(t.goal=r,t.step=n,t.max=i,t.unit=f),o&&(t.levels=o),HABITS.push(t),DB.habits[t.id]={logs:{}},saveData(),closeHabitForm(),renderActivePage(),showToast(`« ${s} » ajoutée`,2600,"star");return}const e=HABITS.find(t=>t.id===hf.id);if(!e){closeHabitForm();return}e.name=s,e.color=hf.color,e.optional=hf.optional,hf.builtin||(e.emoji=(hf.emoji||"").trim()||"⭐"),l&&(e.goal=r,e.step=n,e.max=i,e.unit=f),a==="bad"&&(o?e.levels=o:delete e.levels),a==="times"&&(e.target=Math.max(1,Math.min(TIMES_MAX,Math.floor(hf.target)||3)),e.freq=`${e.target} fois par semaine`),a!=="weekly"&&a!=="times"&&hf.daysTouched&&(e.weekdayOnly=!1,hf.days.length===7?delete e.activeDays:e.activeDays=hf.days.slice(),e.freq=daysLabel(hf.days)),saveData(),closeHabitForm(),renderActivePage(),showToast("Habitude mise à jour",2200)}
const BAD_PRESETS=[{name:"Jeux vidéo",emoji:"🎮",levels:"15 min, 30 min, 1 h, 2 h, +3 h"},{name:"Scroll",emoji:"📱",levels:"15 min, 30 min, 1 h, +2 h"},{name:"Films / séries",emoji:"🎬",levels:"1, 2, +3"},{name:"Sucre ajouté",emoji:"🍬",levels:""},{name:"Alcool",emoji:"🍷",levels:""},{name:"Tabac",emoji:"🚬",levels:""}];
function badVal(n,s){const a=DB.habits[n];return a&&a.vals&&a.vals[s]||""}
function clearBadVal(e,l){const a=DB.habits[e];a&&a.vals&&delete a.vals[l]}
function parseLevels(o){const s=new Set,t=[];return String(o||"").split(",").forEach(n=>{const e=n.trim().slice(0,10);e&&!s.has(e.toLowerCase())&&(s.add(e.toLowerCase()),t.push(e))}),t}
function setBadLevel(s,t){const a=HABITS.find(n=>n.id===s);if(!a||!a.levels)return;const l=today(),e=DB.habits[s];e.vals||(e.vals={});const o=e.logs[l]==="fail";t===0?(delete e.logs[l],delete e.vals[l],o&&playSound("undo")):(e.logs[l]="fail",e.vals[l]=a.levels[t-1],playSound("fail")),saveData(),checkAchievements(),afterToggle(s)}
function buildBadLevels(e,c){const l=isBadFail(e.id,c),a=l?badVal(e.id,c):"",d=["Non",...e.levels].map((o,s)=>{const n=s===0?!l:l&&a===e.levels[s-1];return`<button type="button" class="bad-chip${s===0?" bad-chip-ok":""}${n?" sel":""}" aria-pressed="${n}" onclick="setBadLevel('${e.id}',${s})">${esc(o)}</button>`}).join("");return`<div class="bad-levels" role="group" aria-label="${esc(e.name)}">${d}</div>`}
function applyBadPreset(l){const e=BAD_PRESETS[l];!hf||!e||(hf.name=e.name,hf.emoji=e.emoji,hf.badMode=e.levels?"levels":"simple",hf.levels=e.levels,renderHabitForm())}
