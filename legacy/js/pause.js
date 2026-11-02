const PAUSE_REASONS=[["sick","🤒","Malade"],["trip","✈️","Voyage"],["tired","😴","Épuisé"],["work","💼","Trop de travail"],["party","🎉","Soirée"],["other","❓","Autre"]];
const pauseReasonInfo=S=>PAUSE_REASONS.find(n=>n[0]===S)||PAUSE_REASONS[5];
const PAUSE_PAST_DAYS=7;
const PAUSE_FUTURE_DAYS=30;
const PAUSE_MAX_RANGE=14;
function isPaused(s){return!!(DB.pauses&&DB.pauses[s])}
function pauseQuota(){const u=DB.profile.pauseQuota;return Number.isFinite(u)?u:3}
function pausesInMonth(t){return Object.keys(DB.pauses||{}).filter(e=>e.startsWith(t)).length}
function pausesLeft(a){return Math.max(0,pauseQuota()-pausesInMonth(a))}
function weekPausedCount(a){const s=parseDate(a);let t=0;for(let e=0;e<7;e++)isPaused(fmtDate(addDays(s,e)))&&t++;return t}
function pausedDayNote(){return'<div class="empty-note pause-note"><span class="pause-note-ico">⏸</span><br>Jour de pause<br>Tes séries sont gelées. Profite de ta journée.</div>'}
function renderPauseBanner(){const e=document.getElementById("pauseBanner");if(!e)return;const s=today(),n=(DB.pauses||{})[s];if(n){const t=pauseReasonInfo(n.reason);e.innerHTML=`<div class="pause-banner"><span class="pause-ico" aria-hidden="true">⏸</span>
      <div class="pause-txt"><b>Jour de pause</b><span>${t[1]} ${t[2]} · séries gelées</span></div>
      <button type="button" class="pause-btn" onclick="removePause('${s}')">Reprendre</button></div>`;return}const a=pauseQuota();if(a===0&&Object.keys(DB.pauses||{}).length===0){e.innerHTML="";return}e.innerHTML=`<button type="button" class="pause-pill" onclick="openPause()">⏸ Pause <span>${pausesLeft(s.slice(0,7))}/${a} ce mois-ci</span></button>`}
let pf=null;
function pauseBounds(){const t=appNow();t.setHours(0,0,0,0);let a=addDays(t,-PAUSE_PAST_DAYS);const e=parseDate(DB.createdAt);return e>a&&(a=e),{min:fmtDate(a),max:fmtDate(addDays(t,PAUSE_FUTURE_DAYS))}}
function openPause(o){const e=o||today();pf={from:e,to:e,reason:"sick"},renderPauseForm(),document.querySelector("#pauseModal .modal-card").scrollTop=0,document.getElementById("pauseModal").classList.add("open")}
function closePause(){pf=null,document.getElementById("pauseModal").classList.remove("open")}
function pfSet(f,p){pf&&(pf[f]=p,pf.to<pf.from&&(pf.to=pf.from),renderPauseForm())}
function pfPreset(r){if(!pf)return;const t=appNow();t.setHours(0,0,0,0);const e=fmtDate(r==="yesterday"?addDays(t,-1):t);pf.from=e,pf.to=e,renderPauseForm()}
function pauseRangeDays(){if(!pf||!pf.from||!pf.to)return[];const e=[];let t=parseDate(pf.from);const a=parseDate(pf.to);for(let f=0;f<40&&t<=a;f++)e.push(fmtDate(t)),t=addDays(t,1);return e}
function pauseMonthSummary(){const a=pauseRangeDays().filter(n=>!isPaused(n)),s={};return a.forEach(n=>{const t=n.slice(0,7);s[t]=(s[t]||0)+1}),{days:a,byMonth:s}}
function renderPauseForm(){const p=document.getElementById("pauseFormBody");if(!p||!pf)return;const a=pauseBounds(),{days:n,byMonth:u}=pauseMonthSummary(),r=pauseQuota(),o=pf.from.slice(0,7),d=pausesLeft(o),[v,f]=o.split("-").map(Number),m=MONTH_NAMES[f-1].toLowerCase();let e;const l=Object.entries(u).find(([s,t])=>t>pausesLeft(s));n.length===0?e='<span class="pf-ok">Ces jours sont déjà en pause.</span>':l?e=`<span class="pf-bad">Quota dépassé : il reste ${pausesLeft(l[0])} jour(s) de pause en ${MONTH_NAMES[Number(l[0].slice(5))-1].toLowerCase()}.</span>`:e=`<span class="pf-ok">${n.length} jour${n.length>1?"s":""} de pause · il restera ${Math.max(0,d-(u[o]||0))}/${r} en ${m}.</span>`;const c=Object.keys(DB.pauses||{}).filter(s=>s>=fmtDate(addDays(parseDate(today()),-PAUSE_PAST_DAYS))).sort(),b=c.length?`<div class="modal-section"><label class="modal-label">Pauses récentes et à venir</label>
      <div class="pf-list">${c.map(s=>{const t=pauseReasonInfo(DB.pauses[s].reason),i=parseDate(s);return`<div class="pf-item"><span>${t[1]} ${DAY_FULL[i.getDay()].slice(0,3)}. ${i.getDate()} ${MONTH_SHORT[i.getMonth()].toLowerCase()} · ${t[2]}</span>
          <button type="button" class="pf-del" onclick="removePause('${s}', true)" aria-label="Retirer la pause du ${s}">${icon("trash")}</button></div>`}).join("")}</div></div>`:"";p.innerHTML=`
    <div class="modal-section">
      <div class="hf-hint" style="margin:0 0 12px">Une pause <b>gèle tes séries</b> : ces jours ne comptent ni comme réussis, ni comme manqués.</div>
      <div class="hf-presets" style="margin:0 0 12px">
        <button type="button" class="hf-link" onclick="pfPreset('today')">Aujourd’hui</button>
        <button type="button" class="hf-link" onclick="pfPreset('yesterday')">Hier</button>
      </div>
      <div class="hf-num-grid">
        <div class="hf-num-field"><label for="pfFrom">Du</label>
          <input id="pfFrom" class="sleep-time-input" type="date" min="${a.min}" max="${a.max}" value="${pf.from}" onchange="pfSet('from',this.value||pf.from)"></div>
        <div class="hf-num-field"><label for="pfTo">Au</label>
          <input id="pfTo" class="sleep-time-input" type="date" min="${pf.from}" max="${a.max}" value="${pf.to}" onchange="pfSet('to',this.value||pf.to)"></div>
      </div>
      <div class="hf-hint pf-status" role="status">${e}</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Raison</label>
      <div class="pf-reasons" role="group" aria-label="Raison de la pause">
        ${PAUSE_REASONS.map(s=>`<button type="button" class="hf-chip pf-reason${pf.reason===s[0]?" selected":""}" aria-pressed="${pf.reason===s[0]}" onclick="pfSet('reason','${s[0]}')"><span>${s[1]}</span><b>${s[2]}</b></button>`).join("")}
      </div>
    </div>
    ${b}
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="savePause()">Prendre une pause</button>
    </div>`}
function savePause(){if(!pf)return;const t=pauseBounds(),a=pauseRangeDays();if(a.length===0)return;if(a.length>PAUSE_MAX_RANGE){showToast(`Une pause dure ${PAUSE_MAX_RANGE} jours maximum`,3e3,"alert");return}if(a.some(e=>e<t.min||e>t.max)){showToast("Date hors de la période autorisée",3e3,"alert");return}const{days:s,byMonth:o}=pauseMonthSummary();if(s.length===0){showToast("Ces jours sont déjà en pause",2500,"alert");return}for(const[e,r]of Object.entries(o))if(r>pausesLeft(e)){showToast(`Quota dépassé : ${pausesLeft(e)} jour(s) restant(s) en ${MONTH_NAMES[Number(e.slice(5))-1].toLowerCase()}`,3500,"alert");return}DB.pauses||(DB.pauses={}),s.forEach(e=>{DB.pauses[e]={reason:pf.reason}}),saveData(),closePause(),renderActivePage(),showToast(`Pause enregistrée · ${s.length} jour${s.length>1?"s":""}`,2800,"moon")}
function removePause(e,a){!DB.pauses||!DB.pauses[e]||(delete DB.pauses[e],saveData(),a&&pf&&renderPauseForm(),renderActivePage(),a||showToast("Pause annulée",2200))}
function changePauseQuota(a){DB.profile.pauseQuota=Math.max(0,Math.min(10,pauseQuota()+a)),saveData(),renderAccount()}
function pauseSectionHtml(){const s=pauseQuota(),i=today().slice(0,7),e=pausesInMonth(i);return`<div>
    <div class="account-section-title">Jours de pause</div>
    <div class="pref-card">
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">⏸</span><div><div class="pref-label-text">Quota mensuel</div><div class="pref-hint">Jours de repos qui gèlent tes séries</div></div></div>
        <div class="stepper" role="group" aria-label="Quota de pauses par mois">
          <button type="button" onclick="changePauseQuota(-1)" aria-label="Moins"${s<=0?" disabled":""}>−</button>
          <span aria-live="polite">${s}</span>
          <button type="button" onclick="changePauseQuota(1)" aria-label="Plus"${s>=10?" disabled":""}>+</button>
        </div>
      </div>
      <div class="pref-row">
        <div class="pref-hint">Ce mois-ci : ${e} / ${s} utilisé${e>1?"s":""}</div>
        <button type="button" class="pref-edit" onclick="openPause()">Poser une pause</button>
      </div>
    </div>
  </div>`}
