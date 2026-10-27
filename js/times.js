const TIMES_MAX=6;
const isRequiredHabit=i=>!i.optional&&i.type!=="times";
const weeklyUnit=e=>e.type==="weekly"||e.type==="times";
const streakLabel=(e,s)=>`${s} ${weeklyUnit(e)?"sem":"j"}`;
const streakWords=(e,s)=>weeklyUnit(e)?`${s} semaine${s>1?"s":""}`:`${s} jour${s>1?"s":""}`;
function timesWeekInfo(i,l){const d=(DB.habits[i.id]||{}).logs||{},m=today(),u=parseDate(l);let t=0,a=0,s=0;for(let o=0;o<7;o++){const f=addDays(u,o),r=fmtDate(f);r<DB.createdAt||!isDayActive(i,f)||(t++,d[r]==="done"?a++:r>=m&&s++)}const c=Math.max(1,Math.min(TIMES_MAX,Math.floor(i.target)||1)),n=Math.min(c,t);let e;return t===0?e="neutral":a>=n?e="success":a+s>=n?e="open":e="failed",{active:t,done:a,remaining:s,target:c,required:n,state:e}}
const timesThisWeek=e=>timesWeekInfo(e,getWeekMonday(appNow()));
function calcTimesStreak(s){const f=getWeekMonday(appNow()),i=[DB.createdAt,s.since||""].sort().pop(),r=e=>fmtDate(addDays(parseDate(e),6)),a=e=>fmtDate(addDays(parseDate(f),-e*7));let o=0;const l=timesWeekInfo(s,f);if(l.state!=="failed"){l.state==="success"&&o++;for(let e=1;e<156&&!(r(a(e))<i);e++){const t=timesWeekInfo(s,a(e)).state;if(t==="success")o++;else if(t==="failed")break}}let c=0,n=0;for(let e=155;e>=0;e--){if(r(a(e))<i)continue;const t=timesWeekInfo(s,a(e)).state;t==="success"?(n++,c=Math.max(c,n)):t==="failed"&&(n=0)}return{current:o,longest:Math.max(c,o)}}
function timesDots(t){const e=Math.max(1,t.required),a=Math.min(t.done,e);return`<span class="tdots" aria-hidden="true">${"●".repeat(a)}${"○".repeat(e-a)}</span>`}
function timesWeekText(t,e){return e=e||timesThisWeek(t),`${e.done}/${e.required} cette semaine`}
function timesSubLabel(e){const t=timesThisWeek(e),s=calcStreak(e).current;return`${timesDots(t)} ${timesWeekText(e,t)}${s>0?` · ${icon("flame")} ${s} sem`:""}`}
function announceTimesGoal(n){const e=timesThisWeek(n);return e.state==="success"&&e.done===e.required?(playSound("drink"),showToast(`Objectif de la semaine atteint : ${e.done}/${e.required} « ${n.name} »`,3400,"star"),!0):!1}
