function addWeekXp(e){if(!(e>0))return;DB.xpWeek||(DB.xpWeek={});const k=getWeekMonday(appNow());DB.xpWeek[k]=(DB.xpWeek[k]||0)+e;const p=Object.keys(DB.xpWeek).sort();for(;p.length>20;)delete DB.xpWeek[p.shift()]}
function whenNoDialog(e,i){let o=0;const t=()=>{if(_dialogStack.length>0&&o++<400){setTimeout(t,800);return}e()};setTimeout(t,i||0)}
const lastWeekMonday=()=>fmtDate(addDays(parseDate(getWeekMonday(appNow())),-7));
const mondayLabel=a=>{const e=parseDate(a),t=addDays(e,6);return`${e.getDate()} ${MONTH_SHORT[e.getMonth()].toLowerCase()} – ${t.getDate()} ${MONTH_SHORT[t.getMonth()].toLowerCase()}`};
function weekReviewData(o){const u=parseDate(o),g=today();let i=0,a=0,q=0;const s={},f=[];for(let e=0;e<7;e++){const t=addDays(u,e),r=fmtDate(t);if(r>g)break;let n=0,c=0;HABITS.forEach(d=>{if(!isRequiredHabit(d)||!isDayActive(d,t)||r<DB.createdAt)return;n++;const m=getHabitDayValue(d,r,t)>=1;m&&c++;const p=s[d.id]||(s[d.id]={h:d,req:0,done:0});p.req++,m&&p.done++}),i+=n,a+=c,n>0&&q++,f.push({k:r,d:t,req:n,done:c,rate:n?c/n:null})}HABITS.forEach(e=>{if(e.type!=="times"||e.optional)return;const t=timesWeekInfo(e,o);if(t.required>0){const r=Math.min(t.done,t.required);i+=t.required,a+=r,s[e.id]={h:e,req:t.required,done:r,times:!0,count:t.done}}});const B=i>0?a/i:null,D=f.filter(e=>e.rate!=null).sort((e,t)=>t.rate-e.rate),k=D.length?D[0]:null,v=Object.values(s).filter(e=>e.req>=(e.times?1:3)&&e.done<e.req).sort((e,t)=>e.done/e.req-t.done/t.req||t.req-t.done-(e.req-e.done))[0]||null,y=fmtDate(addDays(u,6)),l=Object.keys(DB.moods).filter(e=>e>=o&&e<=y).map(e=>DB.moods[e]);return{mon:o,req:i,done:a,rate:B,activeDays:q,perDay:f,best:k,forgotten:v,perfect:(DB.perfectDaysClaimed||[]).filter(e=>e>=o&&e<=y).length,xp:(DB.xpWeek||{})[o],moodAvg:l.length?l.reduce((e,t)=>e+t,0)/l.length:null,moodN:l.length}}
function bestStreakNow(){let t=null;return liveHabits().forEach(e=>{const n=calcStreak(e).current;if(n<=0)return;const r=n*(weeklyUnit(e)?7:1);(!t||r>t.days)&&(t={h:e,n,days:r})}),t}
function verdictFor(e){return e==null?"Semaine calme":e>=.9?"Semaine exceptionnelle":e>=.7?"Belle semaine":e>=.5?"Semaine correcte":"Semaine difficile : on repart du bon pied"}
let reviewMon=null;
function reviewSummaryText(e,a){const t=[`Bilan Zeno · ${mondayLabel(e.mon)}`,`Score : ${e.rate==null?"–":Math.round(e.rate*100)+" %"}${a!=null&&e.rate!=null?` (${Math.round(e.rate*100)-Math.round(a*100)>=0?"+":""}${Math.round(e.rate*100)-Math.round(a*100)} pts)`:""}`],n=bestStreakNow();return n&&t.push(`Meilleure série : ${n.h.name} · ${streakWords(n.h,n.n)}`),e.xp!=null&&t.push(`XP : +${e.xp}`),t.push(`Journées parfaites : ${e.perfect}`),e.forgotten&&t.push(`À retravailler : ${e.forgotten.h.name} (${e.forgotten.done}/${e.forgotten.req})`),t.join(`
`)}
function renderReview(t){const d=document.getElementById("reviewBody");if(!d)return;const e=weekReviewData(t),o=fmtDate(addDays(parseDate(t),-7)),n=weekReviewData(o).rate,i=e.rate==null?null:Math.round(e.rate*100),r=i!=null&&n!=null?i-Math.round(n*100):null,v=bestStreakNow(),l=seasonOf(appNow()),a=seasonRank(currentSeasonXp()),c=e.moodAvg==null?"–":`${MOOD_EMOJIS[Math.round(e.moodAvg)]} ${f1(e.moodAvg)}`,s=e.forgotten,u=s&&chalCandidates().some($=>$.id===s.h.id);document.getElementById("reviewRange").textContent=mondayLabel(t),d.innerHTML=`
    <div class="rv-hero">
      <div class="rv-score" aria-label="Score de la semaine : ${i==null?"indisponible":i+" pour cent"}">${i??"–"}<span>%</span></div>
      ${r==null?"":`<div class="rv-delta ${r>0?"up":r<0?"down":""}">${r>0?"+":r<0?"−":"="}${Math.abs(r)} pts <small>vs semaine précédente</small></div>`}
      <div class="rv-verdict">${verdictFor(e.rate)}</div>
      <div class="rv-sub">${e.done} / ${e.req} objectifs atteints</div>
    </div>
    <div class="rv-grid">
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">🔥</div><div class="rv-val">${v?esc(streakWords(v.h,v.n)):"–"}</div><div class="rv-lab">${v?"Meilleure série · "+esc(v.h.name):"Meilleure série"}</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">⚡</div><div class="rv-val">${e.xp!=null?"+"+fmtNum(e.xp):"–"}</div><div class="rv-lab">XP gagnée</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">⭐</div><div class="rv-val">${e.perfect} / 7</div><div class="rv-lab">Journées parfaites</div></div>
      <div class="rv-tile"><div class="rv-ico" aria-hidden="true">😊</div><div class="rv-val">${c}</div><div class="rv-lab">Humeur moyenne</div></div>
    </div>
    <div class="rv-season">
      <div class="rv-season-top"><span class="rv-season-emoji" aria-hidden="true">${l.def.emoji}</span><div><div class="rv-season-label">Saison · ${esc(l.label)}</div><div class="rv-season-rank">Rang ${a.roman} · ${a.name}</div></div></div>
      <div class="season-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a.pct}" aria-label="Progression vers le rang suivant"><div style="width:${a.pct}%"></div></div>
      <div class="rv-season-foot">${a.next?`encore ${fmtNum(a.needed)} XP pour le rang ${ROMAN[a.index+1]}`:"Rang maximal atteint !"}</div>
    </div>
    <div class="rv-sec">
      ${s?`<div class="rv-sec-title">À retravailler</div>
        <div class="rv-forgot"><span class="rv-forgot-emoji" aria-hidden="true">${habitIconMarkup(s.h)}</span>
          <div class="rv-forgot-txt"><b>${esc(s.h.name)}</b><span>${s.times?`${s.count} séance${s.count>1?"s":""} sur ${s.h.target}`:`${s.done} jour${s.done>1?"s":""} sur ${s.req}`}</span></div>
          ${u?`<button type="button" class="pref-edit" onclick="startChallengeFor('${s.h.id}')">Lancer un défi</button>`:""}</div>`:`<div class="rv-sec-title">À retravailler</div><div class="rv-perfect">${e.req>0?"Rien à signaler : tout est tenu. Bravo !":"Pas assez de données cette semaine."}</div>`}
      ${e.best?`<div class="rv-best">Meilleur jour : <b>${DAY_FULL[e.best.d.getDay()].toLowerCase()}</b> · ${Math.round(e.best.rate*100)} %</div>`:""}
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="closeReview()">C’est reparti pour la semaine</button>
      <button type="button" class="hf-archive-btn" onclick="copyReview('${t}')">Copier le résumé</button>
    </div>`}
function openReview(e,a){e=e||lastWeekMonday(),reviewMon=e,renderReview(e);const d=document.querySelector("#reviewModal .modal-card");d&&(d.scrollTop=0),document.getElementById("reviewModal").classList.add("open"),a&&(DB.profile.reviewedWeek=e,saveData())}
function closeReview(){reviewMon=null,document.getElementById("reviewModal").classList.remove("open")}
function copyReview(e){const t=weekReviewData(e),i=weekReviewData(fmtDate(addDays(parseDate(e),-7))).rate,o=reviewSummaryText(t,i),r=()=>showToast("Résumé copié",2200,"star"),a=()=>showToast("Copie impossible sur cet appareil",3e3,"alert");navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(o).then(r,a):a()}
function startChallengeFor(e){closeReview(),setTimeout(()=>{openChallengeForm(),cf&&chalCandidates().some(l=>l.id===e)&&(cf.habitId=e,cf.titleTouched=!1,renderChallengeForm())},250)}
function reviewDue(){if(DB.profile.weeklyReview===!1)return!1;const e=lastWeekMonday();if(DB.profile.reviewedWeek&&DB.profile.reviewedWeek>=e||fmtDate(addDays(parseDate(e),6))<DB.createdAt)return!1;const r=weekReviewData(e);return r.req>0&&r.activeDays>=3}
function maybeShowWeeklyReview(){if(!reviewDue())return;const e=lastWeekMonday();whenNoDialog(()=>{reviewDue()&&lastWeekMonday()===e&&openReview(e,!0)},1200)}
function buildReviewCardHtml(){const i=lastWeekMonday(),e=weekReviewData(i),r=e.rate==null?"–":Math.round(e.rate*100)+" %";return`<div class="report-card" id="reviewCard">
    <div class="report-card-header"><div class="report-card-title">Bilan hebdomadaire</div><div class="report-period-badge">${mondayLabel(i)}</div></div>
    <div class="rv-mini"><div class="rv-mini-score">${r}</div><div class="rv-mini-txt">${verdictFor(e.rate)}<br><small>semaine dernière</small></div>
      <button type="button" class="pref-edit" onclick="openReview()">Ouvrir le bilan</button></div>
  </div>`}
