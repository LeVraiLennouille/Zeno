let activePage="home";
let activeHomeTab="today";
let moodCalMonth=appNow();
moodCalMonth.setDate(1);
function showPage(e){document.querySelectorAll(".page").forEach(t=>t.classList.add("hidden")),document.getElementById(`page-${e}`).classList.remove("hidden"),document.querySelectorAll(".nav-btn").forEach(t=>t.classList.remove("active")),document.getElementById(`nav-${e}`).classList.add("active"),activePage=e,renderActivePage()}
function renderActivePage(){updateChallenges(),activePage==="home"&&renderHome(),activePage==="achievements"&&renderAchievements(),activePage==="report"&&renderReport(),activePage==="myhabits"&&renderMyHabits(),activePage==="account"&&renderAccount()}
function switchHomeTab(t){activeHomeTab=t,["today","weekly","overall"].forEach(e=>{document.getElementById(`tab-${e}`).classList.toggle("hidden",e!==t),document.getElementById(`tab-btn-${e}`).classList.toggle("active",e===t)}),renderHome()}
function renderHome(){activeHomeTab==="today"&&renderTodayTab(),activeHomeTab==="weekly"&&renderWeeklyTab(),activeHomeTab==="overall"&&renderOverallTab(),renderHero(),renderPauseBanner(),renderBackupNudge();const e=document.getElementById("home-wellness");e&&e.classList.toggle("hidden",activeHomeTab!=="today"),renderSleepSummary()}
function renderHero(){const a=document.getElementById("todayHero");if(!a)return;const s=appNow();s.setHours(0,0,0,0);const i=today(),t=HABITS.filter(e=>isRequiredHabit(e)&&isDayActive(e,s)),n=t.filter(e=>isHabitDoneOn(e,i,s)),o=t.length>0&&n.length===t.length,d=appNow().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}),l=calcLevel(DB.xp),c=t.map(e=>{const r=dayProgress(e,i,s);return`<span class="ink-seg${r>=1?" done":""}" style="--ink:${e.color};--fill:${Math.round(r*100)}%" title="${esc(e.name)}"></span>`}).join("");a.innerHTML=`
    <div class="hero-date">${d}</div>
    <div class="hero-score">
      <div class="hero-count${o?" perfect":""}" role="img" aria-label="${n.length} habitudes sur ${t.length}">${n.length}<small>/${t.length}</small></div>
      <div class="hero-side">
        <div class="hero-caption">${isPaused(i)?"Jour de pause · séries gelées":o?"Journée parfaite":"habitudes faites"}</div>
        <div class="hero-level">Niv. ${l} · ${LEVEL_NAMES[l-1]||"Novice"}</div>
      </div>
    </div>
    <div class="ink-strip" aria-hidden="true">${c}</div>`}
function renderTodayTab(){const a=document.getElementById("todayHabits");if(!a)return;const o=today(),d=appNow();d.setHours(0,0,0,0),a.innerHTML="",HABITS.some(e=>isDayActive(e,d))||(a.innerHTML=isPaused(o)?pausedDayNote():todayEmptyNote()),liveHabits().forEach(e=>{if(!isDayActive(e,d))return;const s=document.createElement("div"),t=["good","weekly","times"].includes(e.type)||e.type==="bad"&&!e.levels,n=e.type!=="bad"&&isHabitDoneOn(e,o,d);s.className="habit-card today-card"+(n?" done":""),s.dataset.habitId=e.id,s.style.setProperty("--ink",e.color);const i=buildTodayControl(e,o,d),c=n&&t&&e.type!=="times"?'<div class="today-card-sub done-flourish">accompli !</div>':`<div class="today-card-sub${n&&e.type==="times"?" done-flourish":""}">${buildTodaySubLabel(e,o,d)}</div>`;s.innerHTML=`
      <div class="today-card-top">
        <div class="today-card-left">
          <div class="today-emoji-box">${habitIconMarkup(e)}</div>
          <div class="today-card-info">
            <div class="today-card-name">${esc(e.name)}</div>
            ${c}
          </div>
        </div>
        ${t?i:""}
      </div>
      ${t?"":i}
    `,a.appendChild(s),DB.profile.zenMode&&(isHabitDoneOn(e,o,d)||e.type==="bad"&&!isBadFail(e.id,o))&&setTimeout(()=>s.classList.add("zen-collapse"),10)})}
function todayEmptyNote(){return`<div class="empty-note">Aucune habitude prévue aujourd'hui.<br>Appuie sur + pour en créer une.</div>`}
function buildTodaySubLabel(e,s,o){if(e.type==="times")return timesSubLabel(e);const r=calcStreak(e).current;if(e.type==="bad"){const n=isBadFail(e.id,s),u=n?badVal(e.id,s):"";return`${n?"Craqué"+(u?" · "+esc(u):""):"Tenu bon"} · ${icon("flame")} ${r} j`}return r>0?`${icon("flame")} ${streakWords(e,r)} de suite`:e.freq||"Tous les jours"}
function buildTodayControl(n,o,s){if(n.type==="drink"||n.type==="counter"){const e=n.type==="drink",t=habitProgress(n,o),l=Math.min(100,Math.round(t.v/t.goal*100)),i=t.v>=t.max,c=t.v>=t.goal?"Objectif atteint":`reste ${fmtNum(t.goal-t.v)} ${t.unit}`,d=`<button class="step-btn step-btn-minus" aria-label="Retirer ${fmtNum(t.step)} ${t.unit}" onclick="${e?"removeDrink()":`removeCounter('${n.id}')`}"${t.v<=0?" disabled":""}>−</button>`,r=i?"":e?`<button class="step-btn" onclick="addDrinkAmount(${t.step})">+${fmtNum(t.step)} ml</button><button class="step-btn" onclick="addDrinkAmount(${t.step*2})">+${fmtNum(t.step*2)} ml</button>`:`<button class="step-btn" onclick="addCounter('${n.id}')">+${fmtNum(t.step)} ${t.unit}</button>`;return`<div class="ctl">
      <div class="ctl-head">
        <span class="ctl-value">${fmtNum(t.v)}<small> / ${fmtNum(t.goal)} ${t.unit}</small></span>
        <span class="ctl-hint">${c}</span>
      </div>
      ${progressBar(l,n.name)}
      <div class="step-btns">${d}${r}</div>
    </div>`}if(n.type==="bad"&&n.levels)return buildBadLevels(n,o);if(n.type==="bad"){const e=isBadFail(n.id,o);return`<button class="habit-toggle-btn${e?" done fail":""}"
      onclick="toggleHabit('${n.id}')">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="20" height="20" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${e?'<line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>':'<polyline points="4 10 8 14 16 6"/>'}
      </svg>
    </button>`}return`<button class="habit-toggle-btn${(n.type==="weekly"?isWeeklyDoneForWeek(n.id,getWeekMonday(s)):DB.habits[n.id].logs[o]==="done")?" done":""}" onclick="toggleHabit('${n.id}')">
    <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
  </button>`}
function renderWeeklyTab(){const c=document.getElementById("weeklyHabits");if(!c)return;c.innerHTML="";const d=appNow();d.setHours(0,0,0,0);const l=d.getDay()===0?6:d.getDay()-1,v=addDays(d,-l);liveHabits().forEach(e=>{const s=document.createElement("div");s.className="habit-card",s.dataset.habitId=e.id,s.style.setProperty("--ink",e.color);let i="";DAY_SHORT.forEach((y,t)=>{const a=addDays(v,t),r=fmtDate(a),o=isDayActive(e,a),n=o&&isHabitDoneOn(e,r,a),$=t===l,u=t===6,k=a>d;i+=`<div class="week-day-cell">
        <div class="week-day-label${$?" today-label":u?" sunday-label":""}">${y}</div>
        <div class="week-day-dot${n?" done":""}${o?"":" inactive"}${isPaused(r)?" paused":""}" 
          style="${n?`background:${e.color};border-color:${e.color}`:o?`border-color:${e.color+"50"}`:"border-color:var(--border)"}"
          ${!k&&o?`onclick="toggleHabitOnDate('${e.id}','${r}',this)"`:""}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`}),s.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(e)}</div>
          <div>
            <div class="habit-card-name">${esc(e.name)}</div>
            <div class="habit-card-freq">${e.type==="times"?`${e.freq} · ${timesWeekText(e)}`:e.freq||"Tous les jours"}</div>
          </div>
        </div>
        <div class="streak-pill">${icon("flame")}${streakLabel(e,calcStreak(e).current)}</div>
      </div>
      <div class="week-day-row">${i}</div>
    `,c.appendChild(s)})}
function toggleHabitOnDate(l,s,t){const o=HABITS.find(e=>e.id===l);if(o.type==="bad")DB.habits[l].logs[s]==="fail"?(delete DB.habits[l].logs[s],clearBadVal(l,s)):DB.habits[l].logs[s]="fail";else if(o.type==="counter"||o.type==="drink"){const e=o.type==="drink"?drinkCfg().goal:o.goal;(o.type==="drink"?getDrinkMl(s):getCounterVal(l,s))>=e?delete DB.habits[l].logs[s]:DB.habits[l].logs[s]=e}else o.type,DB.habits[l].logs[s]==="done"?delete DB.habits[l].logs[s]:DB.habits[l].logs[s]="done";saveData(),renderWeeklyTab()}
function renderOverallTab(){const l=document.getElementById("overallHabits");if(!l)return;l.innerHTML="";const a=appNow();a.setHours(0,0,0,0);const v=16,f=a.getDay()===0?6:a.getDay()-1,m=addDays(a,-f),y=addDays(m,-((v-1)*7));liveHabits().forEach(e=>{const d=document.createElement("div");d.className="habit-card",d.dataset.habitId=e.id,d.style.setProperty("--ink",e.color);let i="";DAY_SHORT.forEach(($,p)=>{i+=`<div class="overall-row-label">${$[0]}</div>`;for(let o=0;o<v;o++){const c=addDays(y,o*7+p),s=fmtDate(c),D=c>a,k=isDayActive(e,c);let t="overall-dot",r="",n=s;if(!k||D)t+=" inactive"+(isPaused(s)?" paused":""),isPaused(s)&&(n+=" · pause");else if(e.type==="bad"&&isBadFail(e.id,s)){t+=" failed";const u=badVal(e.id,s);n+=" · craqué"+(u?` (${u})`:"")}else isHabitDoneOn(e,s,c)?(t+=" done",r=`background:${e.color}`):s>=DB.createdAt&&e.type!=="times"&&(t+=" missed",r=`background:${e.color}20;border:1.5px solid ${e.color}40`);i+=`<div class="${t}" style="${r}" title="${esc(n)}"></div>`}}),d.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(e)}</div>
          <div>
            <div class="habit-card-name">${esc(e.name)}</div>
            <div class="habit-card-freq">${e.type==="times"?`${e.freq} · ${timesWeekText(e)}`:e.freq||"Tous les jours"}</div>
          </div>
        </div>
        <div class="streak-pill">${icon("flame")}${streakLabel(e,calcStreak(e).current)}</div>
      </div>
      <div class="overall-dot-grid">${i}</div>
    `,l.appendChild(d)})}
