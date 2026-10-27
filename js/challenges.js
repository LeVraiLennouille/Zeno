const SEASON_DEFS=[{key:"winter",name:"Hiver",emoji:"❄️",months:[11,0,1]},{key:"spring",name:"Printemps",emoji:"🌸",months:[2,3,4]},{key:"summer",name:"Été",emoji:"☀️",months:[5,6,7]},{key:"autumn",name:"Automne",emoji:"🍂",months:[8,9,10]}];
const SEASON_RANKS=[{xp:0,name:"Éveil"},{xp:300,name:"Élan"},{xp:700,name:"Rythme"},{xp:1200,name:"Flux"},{xp:1800,name:"Cap"},{xp:2500,name:"Ascension"},{xp:3300,name:"Sommet"},{xp:4200,name:"Éclat"},{xp:5200,name:"Maîtrise"},{xp:6300,name:"Légende"},{xp:7500,name:"Mythe"},{xp:9e3,name:"Éternité"}];
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
function seasonLabel(n,$){return n.key==="winter"?`${n.name} ${$}/${String($+1).slice(2)}`:`${n.name} ${$}`}
function seasonOf(e){const s=e.getMonth(),o=e.getFullYear(),n=SEASON_DEFS.find(r=>r.months.includes(s)),t=n.key==="winter"&&s<2?o-1:o,a=new Date(t,n.months[0],1),c=new Date(t,n.months[0]+3,0);return{id:`${n.key}-${t}`,def:n,start:a,end:c,label:seasonLabel(n,t)}}
function seasonFromId(n){const[s,S]=String(n).split("-"),e=SEASON_DEFS.find(l=>l.key===s);return e?{def:e,label:seasonLabel(e,Number(S))}:{def:SEASON_DEFS[0],label:n}}
function seasonRank(e){e=e||0;let n=0;SEASON_RANKS.forEach((t,r)=>{e>=t.xp&&(n=r)});const a=SEASON_RANKS[n],S=SEASON_RANKS[n+1]||null;return{index:n,rank:n+1,roman:ROMAN[n],name:a.name,next:S,pct:S?Math.round((e-a.xp)/(S.xp-a.xp)*100):100,needed:S?S.xp-e:0}}
function currentSeasonXp(){return(DB.seasonXp||{})[seasonOf(appNow()).id]||0}
function addSeasonXp(a){if(!(a>0))return;DB.seasonXp||(DB.seasonXp={});const s=seasonOf(appNow()).id,o=seasonRank(DB.seasonXp[s]||0).rank;DB.seasonXp[s]=(DB.seasonXp[s]||0)+a;const n=seasonRank(DB.seasonXp[s]);n.rank>o&&setTimeout(()=>{playSound("levelup"),showToast(`Saison : rang ${n.roman} · ${n.name}`,4e3,"star")},1800)}
function seasonCardHtml(){const n=seasonOf(appNow()),o=currentSeasonXp(),s=seasonRank(o),e=Math.max(0,Math.round((n.end-midnight())/864e5)),i=Object.keys(DB.seasonXp||{}).filter(a=>a!==n.id).sort().reverse().slice(0,6),d=i.length?`<div class="season-past"><div class="season-past-title">Saisons passées</div>${i.map(a=>{const t=seasonFromId(a),r=seasonRank(DB.seasonXp[a]);return`<div class="season-past-row"><span>${t.def.emoji} ${esc(t.label)}</span><span>Rang ${r.roman} · ${r.name} · ${fmtNum(DB.seasonXp[a])} XP</span></div>`}).join("")}</div>`:"";return`<div class="season-card">
    <div class="season-top">
      <div class="season-emoji" aria-hidden="true">${n.def.emoji}</div>
      <div class="season-main">
        <div class="season-label">Saison · ${esc(n.label)}</div>
        <div class="season-rank">Rang ${s.roman} <span>${s.name}</span></div>
      </div>
      <div class="season-left"><b>${e}</b><span>jour${e>1?"s":""}<br>restant${e>1?"s":""}</span></div>
    </div>
    <div class="season-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.pct}" aria-label="Progression vers le rang suivant"><div style="width:${s.pct}%"></div></div>
    <div class="season-foot"><span>${fmtNum(o)} XP cette saison</span><span>${s.next?`encore ${fmtNum(s.needed)} pour le rang ${ROMAN[s.index+1]}`:"Rang maximal !"}</span></div>
    ${d}
  </div>`}
const CHAL_DURATIONS=[7,14,21,30,60,90];
const CHAL_MAX_ACTIVE=5;
let achTab="challenges";
let _chalBusy=!1;
function setAchTab(e){achTab=e,renderAchievements()}
function wonChallenges(){return(DB.challenges||[]).filter(n=>n.status==="won")}
function evalChallenge(e,s){const o=midnight(),f=parseDate(e.start),v=today();let t=0,a=0,i=0;for(let r=0;r<e.days;r++){const n=addDays(f,r),y=fmtDate(n);if(!isDayActive(s,n))continue;if(a++,n>o){i++;continue}const m=y===v;if(s.type==="bad"){if(isBadFail(s.id,y))continue;m?i++:t++}else isHabitDoneOn(s,y,n)?t++:m&&i++}const l=e.required==="all"?a:Math.min(Number(e.required)||1,a),u=Math.min(e.days,Math.max(1,Math.round((o-f)/864e5)+1)),c=o>addDays(f,e.days-1);let d="active";return a===0?c&&(d="void"):t>=l?d="won":t+i<l&&(d="failed"),{success:t,pending:i,required:l,activeTotal:a,dayNo:u,over:c,state:d,daysLeft:Math.max(0,e.days-u)}}
function updateChallenges(){if(_chalBusy||!Array.isArray(DB.challenges))return!1;_chalBusy=!0;let t=!1;try{let a=0;DB.challenges.forEach(e=>{if(e.status!=="active")return;const n=HABITS.find(l=>l.id===e.habitId);if(!n||n.archived){e.status="abandoned",e.endedOn=today(),t=!0;return}const s=evalChallenge(e,n);s.state!=="active"&&(e.status=s.state,e.endedOn=today(),t=!0,s.state==="won"?(giveXP(e.reward),setTimeout(()=>{playSound("fanfare"),launchConfetti(),showToast(`Défi relevé : ${e.title} · +${e.reward} XP`,4200,"trophy")},500+a),a+=2600):s.state==="failed"&&(setTimeout(()=>showToast(`Défi manqué : ${e.title}`,3600,"alert"),500+a),a+=2600))}),t&&(saveData(),checkAchievements())}finally{_chalBusy=!1}return t}
function chalTitle(n,e,r,i){return n.type==="bad"?`${e} jours sans ${n.name}`:r==="min"?`${n.name} · ${i} fois en ${e} jours`:`${n.name} · ${e} jours d’affilée`}
function chalActiveDays(a,n){const c=midnight();let i=0;for(let t=0;t<n;t++)isDayActive(a,addDays(c,t))&&i++;return i}
function chalRewardFor(r){return Math.round(10+r*3)}
function fmtDay(e){const t=parseDate(e);return`${t.getDate()} ${MONTH_SHORT[t.getMonth()].toLowerCase()}`}
function chalCardHtml(a){const s=HABITS.find(t=>t.id===a.habitId);if(!s)return"";const e=evalChallenge(a,s),i=e.required>0?Math.min(100,Math.round(e.success/e.required*100)):0,l=fmtDate(addDays(parseDate(a.start),a.days-1)),d=e.daysLeft===0?`Dernier jour · fin le ${fmtDay(l)}`:`Jour ${e.dayNo} / ${a.days} · fin le ${fmtDay(l)}`;return`<div class="chal-card" style="--c:${esc(a.color||s.color)}">
    <div class="chal-top">
      <div class="chal-emoji" aria-hidden="true">${esc(a.emoji||"🎯")}</div>
      <div class="chal-main"><div class="chal-title">${esc(a.title)}</div><div class="chal-sub">${d}</div></div>
      <button type="button" class="chal-x" onclick="abandonChallenge('${a.id}')" aria-label="Abandonner le défi ${esc(a.title)}">✕</button>
    </div>
    <div class="chal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${i}" aria-label="${esc(a.title)}"><div style="width:${i}%"></div></div>
    <div class="chal-foot"><span><b>${e.success}</b> / ${e.required} jours</span><span>+${a.reward} XP à la clé</span></div>
  </div>`}
function chalHistoryRow(a){const s={won:["✓","Relevé","ok"],failed:["✗","Manqué","ko"],abandoned:["–","Abandonné","na"],void:["–","Annulé","na"]}[a.status]||["–","","na"];return`<div class="chal-hist ${s[2]}"><span class="chal-hist-ico">${s[0]}</span>
    <div class="chal-hist-main"><div>${esc(a.emoji||"🎯")} ${esc(a.title)}</div><div class="chal-hist-sub">${s[1]} · ${fmtDay(a.start)} → ${fmtDay(a.endedOn||a.start)}${a.status==="won"?` · +${a.reward} XP`:""}</div></div></div>`}
function challengesTabHtml(){const t=DB.challenges||[],e=t.filter(s=>s.status==="active"),i=t.filter(s=>s.status!=="active").sort((s,c)=>(c.endedOn||"").localeCompare(s.endedOn||"")).slice(0,8),l=e.length>=CHAL_MAX_ACTIVE,a=wonChallenges().length;return`${seasonCardHtml()}
    <div class="ach-section">
      <div class="chal-head">
        <div class="account-section-title" style="margin:0">Défis en cours</div>
        <button type="button" class="pref-edit" onclick="openChallengeForm()"${l?" disabled":""}>+ Nouveau défi</button>
      </div>
      ${e.length?`<div class="chal-list">${e.map(chalCardHtml).join("")}</div>`:'<div class="empty-note chal-empty">Lance-toi un défi : « 30 jours sans scroller », « Gym 12 fois en 30 jours »…<br>Chaque défi relevé rapporte de l’XP de saison et des succès.</div>'}
      ${l?`<div class="hf-hint">Maximum ${CHAL_MAX_ACTIVE} défis en cours.</div>`:""}
    </div>
    ${i.length?`<div class="ach-section"><div class="chal-head"><div class="account-section-title" style="margin:0">Historique · ${a} relevé${a>1?"s":""}</div>
      <button type="button" class="hf-link" onclick="clearChallengeHistory()">Effacer</button></div>
      <div class="chal-hist-list">${i.map(chalHistoryRow).join("")}</div></div>`:""}`}
let cf=null;
function chalCandidates(){return liveHabits().filter(e=>e.type!=="weekly"&&e.type!=="times"&&!(DB.challenges||[]).some(t=>t.status==="active"&&t.habitId===e.id))}
function openChallengeForm(){const e=chalCandidates();if((DB.challenges||[]).filter(t=>t.status==="active").length>=CHAL_MAX_ACTIVE){showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`,2800,"alert");return}if(!e.length){showToast("Toutes tes habitudes ont déjà un défi en cours",3200,"alert");return}const l=e.find(t=>t.type==="bad")||e[0];cf={habitId:l.id,days:30,mode:"all",min:20,title:"",titleTouched:!1},renderChallengeForm(),document.querySelector("#challengeModal .modal-card").scrollTop=0,document.getElementById("challengeModal").classList.add("open")}
function closeChallengeForm(){cf=null,document.getElementById("challengeModal").classList.remove("open")}
function cfSet(e,c){if(!cf)return;cf[e]=c;const f=HABITS.find(n=>n.id===cf.habitId);f&&f.type==="bad"&&(cf.mode="all"),renderChallengeForm()}
function cfInput(f,t){cf&&(cf[f]=t,f==="title"&&(cf.titleTouched=!0))}
function cfDuration(i){const n=parseInt(i,10);cf&&Number.isFinite(n)&&(cf.days=Math.max(3,Math.min(365,n)))}
function cfAutoTitle(){const c=HABITS.find(f=>f.id===cf.habitId);return c?chalTitle(c,cf.days,cf.mode,Math.min(cf.min,cf.days)):""}
function renderChallengeForm(){const s=document.getElementById("challengeFormBody");if(!s||!cf)return;const t=chalCandidates(),a=HABITS.find(e=>e.id===cf.habitId)||t[0],i=a.type==="bad",c=Math.min(Math.max(1,Number(cf.min)||1),cf.days),l=chalActiveDays(a,cf.days),n=cf.mode==="all"||i?l:Math.min(c,l),d=cf.titleTouched?cf.title:cfAutoTitle();s.innerHTML=`
    <div class="modal-section">
      <label class="modal-label" for="cfHabit">Habitude</label>
      <select id="cfHabit" class="pseudo-input hf-input" onchange="cfSet('habitId',this.value)">
        ${t.map(e=>`<option value="${e.id}"${e.id===a.id?" selected":""}>${esc(e.emoji||"")} ${esc(e.name)}${e.type==="bad"?" (à éviter)":""}</option>`).join("")}
      </select>
    </div>
    <div class="modal-section">
      <label class="modal-label">Durée</label>
      <div class="hf-days cf-durations" role="group" aria-label="Durée du défi">
        ${CHAL_DURATIONS.map(e=>`<button type="button" class="hf-day${cf.days===e?" selected":""}" aria-pressed="${cf.days===e}" onclick="cfSet('days',${e})">${e}</button>`).join("")}
      </div>
      <div class="hf-hint">jours, à partir d’aujourd’hui ·
        <label for="cfDays" class="cf-custom">autre :</label>
        <input id="cfDays" class="pseudo-input cf-days-input" type="number" min="3" max="365" inputmode="numeric" value="${cf.days}" onchange="cfDuration(this.value);cfSet('days',cf.days)"> j</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Objectif</label>
      ${i?`<div class="hf-fixed">Aucun écart pendant ${cf.days} jours</div><div class="hf-hint">Un seul écart et le défi est manqué.</div>`:`<div class="hf-seg" role="group" aria-label="Objectif">
            <button type="button" class="hf-chip hf-kind${cf.mode==="all"?" selected":""}" aria-pressed="${cf.mode==="all"}" onclick="cfSet('mode','all')"><b>Chaque jour</b><span>Tous les jours actifs</span></button>
            <button type="button" class="hf-chip hf-kind${cf.mode==="min"?" selected":""}" aria-pressed="${cf.mode==="min"}" onclick="cfSet('mode','min')"><b>Au moins…</b><span>Un nombre de jours</span></button>
          </div>
          ${cf.mode==="min"?`<div class="cf-min"><label for="cfMin">Réussir au moins</label>
            <input id="cfMin" class="pseudo-input cf-days-input" type="number" min="1" max="${cf.days}" inputmode="numeric" value="${c}" onchange="cfSet('min',Math.max(1,parseInt(this.value,10)||1))"> jours sur ${cf.days}</div>`:""}`}
    </div>
    <div class="modal-section">
      <label class="modal-label" for="cfTitle">Titre</label>
      <input id="cfTitle" class="pseudo-input hf-input" type="text" maxlength="50" value="${esc(d)}" oninput="cfInput('title',this.value)">
      <div class="hf-hint">Récompense : <b>+${chalRewardFor(n)} XP</b> (et autant d’XP de saison) si tu le relèves.</div>
    </div>
    <div class="hf-actions"><button type="button" class="modal-save-btn" onclick="saveChallenge()">Lancer le défi</button></div>`}
function saveChallenge(){if(!cf)return;const t=HABITS.find(e=>e.id===cf.habitId);if(!t)return;if((DB.challenges||[]).filter(e=>e.status==="active").length>=CHAL_MAX_ACTIVE){showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`,2800,"alert");return}if((DB.challenges||[]).some(e=>e.status==="active"&&e.habitId===t.id)){showToast("Cette habitude a déjà un défi en cours",3e3,"alert");return}const a=cf.days;if(!(a>=3&&a<=365)){showToast("Durée : entre 3 et 365 jours",2800,"alert");return}const o=t.type==="bad"?"all":cf.mode,c=Math.min(Math.max(1,Number(cf.min)||1),a),i=chalActiveDays(t,a);if(i===0){showToast("Cette habitude n’est active aucun de ces jours",3200,"alert");return}const s=o==="all"?"all":Math.min(c,i),r=(cf.titleTouched?cf.title:cfAutoTitle()).trim()||cfAutoTitle(),n={id:"ch_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),habitId:t.id,title:r.slice(0,50),emoji:t.emoji||"🎯",color:t.color,days:a,required:s,start:today(),status:"active",reward:chalRewardFor(s==="all"?i:s)};DB.challenges.push(n),saveData(),closeChallengeForm(),updateChallenges(),renderActivePage(),showToast("Défi lancé : bon courage !",2600,"trophy")}
function abandonChallenge(a){const n=(DB.challenges||[]).find(e=>e.id===a);!n||n.status!=="active"||confirm(`Abandonner le défi « ${n.title} » ?`)&&(n.status="abandoned",n.endedOn=today(),saveData(),renderActivePage(),showToast("Défi abandonné",2200))}
function clearChallengeHistory(){confirm("Effacer l’historique des défis terminés ?")&&(DB.challenges=(DB.challenges||[]).filter(e=>e.status==="active"),saveData(),renderActivePage())}
function seasonMiniHtml(){const a=seasonOf(appNow()),s=seasonRank(currentSeasonXp());return`<div class="xp-card-row" style="margin-top:14px"><span class="xp-label">${a.def.emoji} ${esc(a.label)}</span><span class="xp-value">Rang ${s.roman} · ${s.name}</span></div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${s.pct}%"></div></div>`}
document.addEventListener("visibilitychange",()=>{!document.hidden&&updateChallenges()&&renderActivePage()});
