const rep={period:"week",offset:0,habit:"all"};
const REP_PERIODS=[["week","Semaine"],["month","Mois"],["year","Année"]];
const midnight=()=>{const t=appNow();return t.setHours(0,0,0,0),t};
const fmtShort=t=>`${t.getDate()} ${MONTH_SHORT[t.getMonth()].toLowerCase()}`;
function setRepPeriod(e){rep.period=e,rep.offset=0,renderReport()}
function cycleRepPeriod(){const e=REP_PERIODS.findIndex(P=>P[0]===rep.period);setRepPeriod(REP_PERIODS[(e+1)%REP_PERIODS.length][0])}
function setRepHabit(e){rep.habit=e,renderReport()}
function repNav(r){const e=rep.offset+r;e>0||(rep.offset=e,renderReport())}
function repRange(){const e=midnight();if(rep.period==="week"){const t=e.getDay()===0?6:e.getDay()-1,n=addDays(e,-t+rep.offset*7),a=addDays(n,6);return{start:n,end:a,t:e,label:`${fmtShort(n)} – ${fmtShort(a)}`}}if(rep.period==="month"){const t=new Date(e.getFullYear(),e.getMonth()+rep.offset,1),n=new Date(t.getFullYear(),t.getMonth()+1,0);return{start:t,end:n,t:e,label:`${MONTH_NAMES[t.getMonth()]} ${t.getFullYear()}`}}const r=e.getFullYear()+rep.offset;return{start:new Date(r,0,1),end:new Date(r,11,31),t:e,label:String(r)}}
function repHabits(){return rep.habit==="all"?HABITS:HABITS.filter(i=>i.id===rep.habit)}
function dayStat(t,u){const i=fmtDate(t);if(t>midnight()||i<DB.createdAt)return null;let e=0,n=0,l=0;return repHabits().forEach(a=>{if(rep.habit==="all"&&(a.type==="times"||a.optional&&!u)||!isDayActive(a,t))return;const r=getHabitDayValue(a,i,t);e++,r>=1&&l++,n+=rep.habit==="all"?r>=1?1:0:Math.min(1,r)}),e>0?{k:i,req:e,done:n,cnt:l,rate:n/e}:null}
function repStats(){const{start:n,end:s,t:p}=repRange();let c=0,o=0,i=0,f=0;for(let t=new Date(n);t<=s&&t<=p;t=addDays(t,1)){const e=dayStat(t),l=fmtDate(t);e&&(c+=e.req,o+=e.done,e.rate>=1&&f++),repHabits().forEach(r=>{r.type==="bad"||!isDayActive(r,t)||l<DB.createdAt||(r.type==="weekly"?DB.habits[r.id].logs[l]==="done"&&i++:isHabitDoneOn(r,l,t)&&i++)})}const a=rep.habit==="all"?null:HABITS.find(t=>t.id===rep.habit),d=a?calcStreak(a).current:liveHabits().filter(t=>!weeklyUnit(t)).reduce((t,e)=>Math.max(t,calcStreak(e).current),0),D=rep.habit==="all"?(DB.perfectDaysClaimed||[]).filter(t=>t>=fmtDate(n)&&t<=fmtDate(s)).length:f;if(a&&a.type==="times"){const t=timesRangeStats(a,n,s);return{streak:d,rate:t.tot>0?Math.round(t.ok/t.tot*100):0,validated:i,perfectDays:t.ok}}return{streak:d,rate:c>0?Math.round(o/c*100):0,validated:i,perfectDays:D}}
function timesRangeStats(i,s,n){let e=parseDate(getWeekMonday(s));e<s&&(e=addDays(e,7));let a=0,t=0;for(;e<=n;e=addDays(e,7)){const f=timesWeekInfo(i,fmtDate(e)).state;f==="success"?(a++,t++):f==="failed"&&t++}return{ok:a,tot:t}}
function repBuckets(){const{start:n,end:g,t:l}=repRange();if(rep.period==="year")return Array.from({length:12},(t,e)=>{let r=0,a=0,d=0;const i=new Date(n.getFullYear(),e+1,0).getDate();for(let s=1;s<=i;s++){const o=dayStat(new Date(n.getFullYear(),e,s),!0);o&&(r+=o.req,a+=o.done,d+=o.cnt)}const D=n.getFullYear()===l.getFullYear()&&e===l.getMonth();return{label:MONTH_SHORT[e].slice(0,3),barLabel:MONTH_SHORT[e][0],showLabel:!0,rate:r>0?a/r:null,cnt:d,req:r,isToday:D}});const u=[];let c=0;for(let t=new Date(n);t<=g;t=addDays(t,1),c++){const e=dayStat(t,!0),r=fmtDate(t)===fmtDate(l),a=rep.period==="week"?DAY_SHORT[c]:String(t.getDate());u.push({label:a,barLabel:a,showLabel:rep.period==="week"||t.getDate()===1||t.getDate()%5===0,rate:e?e.rate:null,cnt:e?e.cnt:0,req:e?e.req:0,isToday:r,future:t>l})}return u}
function repMoodPoints(){const{start:l,end:d,t:i}=repRange();if(rep.period==="year")return Array.from({length:12},(e,t)=>{const o=[],u=new Date(l.getFullYear(),t+1,0).getDate();for(let r=1;r<=u;r++){const a=DB.moods[fmtDate(new Date(l.getFullYear(),t,r))];a&&o.push(a)}return{label:MONTH_SHORT[t].slice(0,3),showLabel:!0,v:o.length?o.reduce((r,a)=>r+a,0)/o.length:null,emoji:!1}});const n=[];let s=0;for(let e=new Date(l);e<=d;e=addDays(e,1),s++){const t=DB.moods[fmtDate(e)];n.push({label:rep.period==="week"?DAY_SHORT[s][0]:String(e.getDate()),showLabel:rep.period==="week"||e.getDate()===1||e.getDate()%5===0,v:t&&e<=i?t:null,emoji:rep.period==="week"})}return n}
function buildCalStats(){const{end:n,t:i}=repRange(),o=n>i?i:n,s=o.getFullYear(),l=o.getMonth(),d=new Date(s,l,1),v=new Date(s,l+1,0),$=d.getDay()===0?6:d.getDay()-1,D=today();let e="";for(let t=0;t<$;t++)e+="<div></div>";for(let t=1;t<=v.getDate();t++){const r=new Date(s,l,t),c=fmtDate(r);if(c>D){e+=`<div class="cal-stats-cell future">${t}</div>`;continue}if(isPaused(c)){e+=`<div class="cal-stats-cell paused" title="Pause">${t}</div>`;continue}if(c<DB.createdAt){e+=`<div class="cal-stats-cell">${t}</div>`;continue}const a=dayStat(r);let u="cal-stats-cell",f="";a&&(f=` title="${a.cnt}/${a.req}"`,u+=a.rate>=1?" perfect":a.rate>=.7?" good":" missed"),e+=`<div class="${u}"${f}>${t}</div>`}return{html:e,label:`${MONTH_NAMES[l]} ${s}`}}
const CARET='<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="2 4 5 7 8 4"/></svg>';
const NAV_L='<svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg>';
const NAV_R='<svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg>';
function renderReport(){const l=document.getElementById("reportContent");if(!l)return;rep.habit!=="all"&&!HABITS.some(a=>a.id===rep.habit)&&(rep.habit="all");const n=repRange(),e=repStats(),r=repBuckets(),o=buildCalStats(),c=REP_PERIODS.find(a=>a[0]===rep.period)[1],t=rep.habit!=="all",i=t?HABITS.find(a=>a.id===rep.habit):null,v=r.length>12,s=`<button type="button" class="report-period-badge" onclick="cycleRepPeriod()" aria-label="Changer de période (actuelle : ${c})">${c} ${CARET}</button>`,p='<option value="all">Toutes les habitudes</option>'+repHabitOptions(),u=r.map(a=>({label:a.label,showLabel:a.showLabel,v:a.rate==null?null:Math.round(a.rate*100)})),b=repMoodPoints();l.innerHTML=`
    <div class="report-wrap">
      <div class="rep-controls">
        <div class="rep-seg" role="group" aria-label="Période">
          ${REP_PERIODS.map(([a,d])=>`<button type="button" class="rep-seg-btn${rep.period===a?" active":""}" aria-pressed="${rep.period===a}" onclick="setRepPeriod('${a}')">${d}</button>`).join("")}
        </div>
        <div class="rep-row">
          <div class="rep-nav">
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(-1)" aria-label="Période précédente">${NAV_L}</button>
            <div class="rep-range" aria-live="polite">${n.label}</div>
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(1)" aria-label="Période suivante"${rep.offset>=0?" disabled":""}>${NAV_R}</button>
          </div>
          <select class="pseudo-input rep-select" aria-label="Filtrer par habitude" onchange="setRepHabit(this.value)">${p}</select>
          ${t?`<button type="button" class="pref-edit rep-fiche" onclick="openHabitDetail('${rep.habit}')">Voir la fiche</button>`:""}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-val">${e.streak}</div><div class="stat-label">${i&&weeklyUnit(i)?"Série (semaines)":"Série en cours"}</div></div>
        <div class="stat-card"><div class="stat-val">${e.rate}%</div><div class="stat-label">Taux de réussite</div></div>
        <div class="stat-card"><div class="stat-val">${e.validated.toLocaleString("fr-FR")}</div><div class="stat-label">Habitudes validées</div></div>
        <div class="stat-card"><div class="stat-val">${e.perfectDays}</div><div class="stat-label">${i&&i.type==="times"?"Semaines réussies":t?"Jours réussis":"Journées parfaites"}</div></div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">${t?"Réussite par "+(rep.period==="year"?"mois":"jour"):"Habitudes validées"}</div>
          ${s}
        </div>
        <div class="bar-chart${v?" dense":""}" id="barChart">
          ${r.map(a=>{const d=a.rate==null?0:Math.max(a.rate>0?5:3,Math.round(a.rate*100)),h=a.req>0?`${a.label} : ${a.cnt}/${a.req}`:`${a.label} : –`;return`<div class="bar-col" title="${esc(h)}">
              <div class="bar-fill${a.isToday?" active":""}" style="height:${d}%;background:${a.isToday?"var(--accent)":"var(--accent-bg)"}">
                ${a.isToday&&!v?`<div class="bar-tooltip">${a.cnt} habitude${a.cnt>1?"s":""}</div>`:""}
              </div>
              <div class="bar-label">${a.showLabel?esc(rep.period==="year"?a.barLabel:a.label):"&nbsp;"}</div>
            </div>`}).join("")}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Évolution du taux de réussite</div>
          ${s}
        </div>
        <canvas id="lineChartReport" height="160" role="img" aria-label="Courbe du taux de réussite"></canvas>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier du mois</div>
          <div class="report-period-badge">${o.label}</div>
        </div>
        <div class="cal-stats-grid">
          ${DAY_SHORT.map(a=>`<div class="cal-stats-header">${a[0]}${a[1]}</div>`).join("")}
          ${o.html}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier d'humeur</div>
          <div class="report-period-badge" style="cursor:pointer" onclick="openMoodManual()">+ Saisir l'humeur</div>
        </div>
        ${buildMoodCalHtml()}
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Courbe d'humeur</div>
          ${s}
        </div>
        <canvas id="moodChartReport" height="100" role="img" aria-label="Courbe d'humeur"></canvas>
      </div>

      ${buildReviewCardHtml()}

      ${buildJournalHtml()}

      ${buildInsightsHtml()}
    </div>`,requestAnimationFrame(()=>{drawLineChart("lineChartReport",u),drawMoodChart("moodChartReport",b)})}
function chartColors(){const r=isDarkNow();return{grid:r?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",text:r?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.4)",accent:cssVar("--accent")||"#12131A"}}
function chartRuns(t,e,l){const u=[];let n=[];return t.forEach((h,s)=>{h.v==null?(n.length&&u.push(n),n=[]):n.push({x:e(s),y:l(h.v),p:h,i:s})}),n.length&&u.push(n),u}
function strokeRuns(e,f,a,d,h,y){f.forEach(o=>{if(o.length>1){const l=e.createLinearGradient(0,d,0,h);l.addColorStop(0,withAlpha(a.accent,.16)),l.addColorStop(1,withAlpha(a.accent,0)),e.beginPath(),e.moveTo(o[0].x,o[0].y),o.forEach((i,n)=>n>0&&e.lineTo(i.x,i.y)),e.lineTo(o[o.length-1].x,h),e.lineTo(o[0].x,h),e.closePath(),e.fillStyle=l,e.fill(),e.beginPath(),e.moveTo(o[0].x,o[0].y),o.forEach((i,n)=>n>0&&e.lineTo(i.x,i.y)),e.strokeStyle=a.accent,e.lineWidth=2.5,e.lineJoin="round",e.stroke()}o.forEach(l=>{e.beginPath(),e.arc(l.x,l.y,y,0,Math.PI*2),e.fillStyle=a.accent,e.fill()})})}
function chartEmpty(e,n,t,s){e.fillStyle=s.text,e.font="12px Instrument Sans,sans-serif",e.textAlign="center",e.fillText("Pas encore de données sur cette période",n/2,t/2)}
function drawLineChart(g,f){const s=document.getElementById(g);if(!s)return;const t=s.getContext("2d"),r=s.offsetWidth,i=160;s.width=r,s.height=i;const l=chartColors(),n={l:36,r:16,t:20,b:28},d=r-n.l-n.r,o=i-n.t-n.b,a=f.length;t.strokeStyle=l.grid,t.lineWidth=1,[0,20,40,60,80,100].forEach(e=>{const c=n.t+o-e/100*o;t.beginPath(),t.moveTo(n.l,c),t.lineTo(r-n.r,c),t.stroke(),t.fillStyle=l.text,t.font="10px Instrument Sans,sans-serif",t.textAlign="right",t.fillText(`${e}%`,n.l-6,c+4)});const h=e=>n.l+(a>1?e/(a-1):.5)*d,u=e=>n.t+o-e/100*o,x=chartRuns(f,h,u);x.length?strokeRuns(t,x,l,n.t,n.t+o,a>12?2.5:4):chartEmpty(t,r,i,l),t.fillStyle=l.text,t.font="10px Instrument Sans,sans-serif",t.textAlign="center",f.forEach((e,c)=>{e.showLabel&&t.fillText(e.label,h(c),i-4)})}
function drawMoodChart(x,c){const o=document.getElementById(x);if(!o)return;const n=o.getContext("2d"),l=o.offsetWidth,s=100;o.width=l,o.height=s;const r=chartColors(),e={l:16,r:16,t:16,b:24},g=l-e.l-e.r,f=s-e.t-e.b,a=c.length,i=t=>e.l+(a>1?t/(a-1):.5)*g,d=t=>e.t+f-(t-1)/4*f,u=chartRuns(c,i,d);u.length?strokeRuns(n,u,r,e.t,e.t+f,a>12?2.5:3.5):chartEmpty(n,l,s,r),n.fillStyle=r.text,n.font="10px Instrument Sans,sans-serif",n.textAlign="center",c.forEach((t,h)=>{t.showLabel&&n.fillText(t.label,i(h),s-4)}),c.forEach((t,h)=>{t.v!=null&&t.emoji&&(n.font="14px serif",n.fillText(MOOD_EMOJIS[Math.round(t.v)]||"",i(h),d(t.v)-8))})}
const INSIGHT_DAYS=90;
const INSIGHT_MIN_GROUP=5;
const f1=i=>i.toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1});
const avgOf=e=>e.reduce((c,g)=>c+g,0)/e.length;
function insightRows(u){const c=midnight(),l=[];for(let e=0;e<u;e++){const n=addDays(c,-e),o=fmtDate(n);if(o<DB.createdAt)break;const i=(DB.sleepLog||{})[o],s={};let d=0,r=0;HABITS.forEach(t=>{if(!isDayActive(t,n)){s[t.id]=null;return}const a=isHabitDoneOn(t,o,n);s[t.id]=a,isRequiredHabit(t)&&(d++,a&&r++)}),l.push({k:o,dow:n.getDay(),mood:DB.moods[o]==null?null:DB.moods[o],sleepH:i?i.hours+(i.minutes||0)/60:null,med:(DB.meditation||{})[o]||0,rate:d>0?r/d:null,done:s})}return l}
function compareMood(u,r){const n=[],o=[];if(u.forEach(t=>{if(t.mood==null)return;const f=r(t);f!=null&&(f?n:o).push(t.mood)}),n.length<INSIGHT_MIN_GROUP||o.length<INSIGHT_MIN_GROUP)return null;const e=avgOf(n),l=avgOf(o);return{a:e,b:l,diff:e-l,n:n.length+o.length}}
function compareRate(u,a){const n=[],t=[];if(u.forEach(e=>{if(e.rate==null)return;const f=a(e);f!=null&&(f?n:t).push(e.rate)}),n.length<INSIGHT_MIN_GROUP||t.length<INSIGHT_MIN_GROUP)return null;const l=avgOf(n),r=avgOf(t);return{a:l,b:r,diff:l-r,n:n.length+t.length}}
function computeInsights(n){const a=[],l=(e,t,o,u)=>{!o||Math.abs(o.diff)<(u||.3)||a.push({icon:e,text:t,delta:`${o.diff>0?"+":"−"}${f1(Math.abs(o.diff))}`,good:o.diff>0,n:o.n,score:Math.abs(o.diff)})};liveHabits().forEach(e=>{if(e.type==="weekly")return;const t=compareMood(n,i=>i.done[e.id]),o=`« ${esc(e.name)} »`,u=e.type==="bad"?`évites ${o}`:e.type==="counter"||e.type==="drink"?`atteins ton objectif ${o}`:`fais ${o}`;l(esc(e.emoji||"⭐"),`Les jours où tu ${u}, ton humeur moyenne est de <b>${t?f1(t.a):""}</b> (contre ${t?f1(t.b):""} sinon).`,t)}),l("😴",(()=>{const e=compareMood(n,t=>t.sleepH==null?null:t.sleepH>=7);return e?`Après une nuit d’au moins 7 h, ton humeur moyenne est de <b>${f1(e.a)}</b> (contre ${f1(e.b)}).`:""})(),compareMood(n,e=>e.sleepH==null?null:e.sleepH>=7)),l("🧘",(()=>{const e=compareMood(n,t=>t.med>0);return e?`Les jours où tu médites, ton humeur moyenne est de <b>${f1(e.a)}</b> (contre ${f1(e.b)}).`:""})(),compareMood(n,e=>e.med>0)),l("📈",(()=>{const e=compareMood(n,t=>t.rate==null?null:t.rate>=.8);return e?`Quand tu valides au moins 80 % de tes habitudes, ton humeur moyenne est de <b>${f1(e.a)}</b> (contre ${f1(e.b)}).`:""})(),compareMood(n,e=>e.rate==null?null:e.rate>=.8));const s=compareRate(n,e=>e.sleepH==null?null:e.sleepH>=7);s&&Math.abs(s.diff)>=.08&&a.push({icon:"🌙",text:`Après une nuit de 7 h ou plus, tu valides <b>${Math.round(s.a*100)} %</b> de tes habitudes (contre ${Math.round(s.b*100)} %).`,delta:`${s.diff>0?"+":"−"}${Math.round(Math.abs(s.diff)*100)} pts`,good:s.diff>0,n:s.n,score:Math.abs(s.diff)*4});const f={};n.forEach(e=>{e.mood!=null&&(f[e.dow]=f[e.dow]||[]).push(e.mood)});const d=Object.entries(f).filter(([,e])=>e.length>=3).map(([e,t])=>({d:Number(e),m:avgOf(t),n:t.length}));if(d.length>=4){d.sort((o,u)=>u.m-o.m);const e=d[0],t=d[d.length-1];e.m-t.m>=.5&&a.push({icon:"📅",text:`Ton jour le plus lumineux est le <b>${DAY_FULL[e.d].toLowerCase()}</b> (${f1(e.m)}), le plus difficile le <b>${DAY_FULL[t.d].toLowerCase()}</b> (${f1(t.m)}).`,delta:"",good:!0,n:d.reduce((o,u)=>o+u.n,0),score:(e.m-t.m)*.7})}return a.filter(e=>e.text).sort((e,t)=>t.score-e.score).slice(0,6)}
function buildInsightsHtml(){const d=insightRows(INSIGHT_DAYS),i=d.filter(e=>e.mood!=null);let n;if(i.length<7)n=`<div class="insight-empty">Il faut au moins 7 jours d’humeur renseignée pour dégager des tendances.
      <div class="insight-progress">${progressBar(Math.round(i.length/7*100),"Jours d’humeur renseignés")}<span>${i.length} / 7 jours</span></div></div>`;else{const e=computeInsights(d),t=avgOf(i.map(s=>s.mood));n=`<div class="insight-summary">Humeur moyenne : <b>${f1(t)}</b> / 5 sur ${i.length} jours renseignés</div>`+(e.length?e.map(s=>`<div class="insight-row">
          <div class="insight-ico" aria-hidden="true">${s.icon}</div>
          <div class="insight-main"><div class="insight-text">${s.text}</div><div class="insight-n">sur ${s.n} jours</div></div>
          ${s.delta?`<div class="insight-delta ${s.good?"up":"down"}">${s.delta}</div>`:""}
        </div>`).join(""):'<div class="insight-empty">Rien de marquant pour l’instant. Continue à renseigner ton humeur : les tendances apparaissent avec le temps.</div>')}return`<div class="report-card" id="insightsCard">
    <div class="report-card-header">
      <div class="report-card-title">Insights</div>
      <div class="report-period-badge">${INSIGHT_DAYS} derniers jours</div>
    </div>
    ${n}
    <div class="insight-note">Ce sont des corrélations, pas des causes.</div>
  </div>`}
