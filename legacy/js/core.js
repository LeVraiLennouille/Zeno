const DEFAULT_HABITS=[{id:"sleep",name:"Sommeil",emoji:"💤",type:"good",color:"#8EA2FF",freq:"Lundi - Vendredi",weekdayOnly:!0},{id:"projets",name:"Projets perso",emoji:"🚀",type:"good",color:"#C79BFF",freq:"Tous les jours",weekdayOnly:!1},{id:"work",name:"Travail",emoji:"💼",type:"good",color:"#FFD23F",freq:"Lundi - Vendredi",weekdayOnly:!0},{id:"gym",name:"Gym",emoji:"🏋️",type:"good",color:"#52E0A1",freq:"Lundi - Vendredi",weekdayOnly:!0},{id:"running",name:"Running",emoji:"🏃",type:"counter",color:"#FF8A4C",freq:"5 jours par semaine",weekdayOnly:!1,step:1,goal:5,max:15,unit:"km"},{id:"setp",name:"Pas",emoji:"👣",type:"counter",color:"#2EC4B6",freq:"Tous les jours",weekdayOnly:!1,step:1e3,goal:1e4,max:2e4,unit:"pas"},{id:"drink",name:"Boire de l'eau",emoji:"💧",type:"drink",color:"#52C7F2",freq:"Tous les jours",weekdayOnly:!1,step:250,goal:2e3,max:5e3,unit:"ml"},{id:"read",name:"15min Lecture",emoji:"📚",type:"counter",color:"#FF7EB0",freq:"Tous les jours",weekdayOnly:!1,optional:!0,step:5,goal:15,max:30,unit:"min"},{id:"cleaning",name:"Nettoyage",emoji:"🧹",type:"weekly",color:"#C3E34A",freq:"Tous les dimanches",weekdayOnly:!1,optional:!0}];
const DRINK_GOAL=2e3;
const DRINK_STEP=250;
const DRINK_MAX=5e3;
const HABIT_ICONS={sleep:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',projets:'<path d="M12 2.5c2.3 2.1 3.7 5.3 3.7 8.5 0 1.9-.4 3.4-1 4.8l-2.7 2.7-2.7-2.7c-.6-1.4-1-2.9-1-4.8 0-3.2 1.4-6.4 3.7-8.5z"/><circle cx="12" cy="10.5" r="1.4"/><path d="M9.3 15.5L7 17M14.7 15.5L17 17M10.3 18.7L12 21.5l1.7-2.8"/>',work:'<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12.5h18"/>',gym:'<rect x="1.5" y="9" width="3" height="6" rx="1"/><rect x="19.5" y="9" width="3" height="6" rx="1"/><rect x="4.5" y="10.3" width="3" height="3.4" rx="0.6"/><rect x="16.5" y="10.3" width="3" height="3.4" rx="0.6"/><line x1="7.5" y1="12" x2="16.5" y2="12"/>',running:'<circle cx="14.2" cy="4.2" r="1.6"/><path d="M9.5 20l2-5.5 3 1.8 2 3.7"/><path d="M7.3 13.2l2.9-2.7 2.1 1 2.8-1.2"/><path d="M5.5 17l3-2.2"/>',setp:'<ellipse cx="9" cy="7.3" rx="2.6" ry="3.7" fill="currentColor" stroke="none" transform="rotate(-14 9 7.3)"/><ellipse cx="15.5" cy="15.6" rx="2.6" ry="3.7" fill="currentColor" stroke="none" transform="rotate(14 15.5 15.6)"/>',drink:'<path d="M12 3.3c3.6 4.6 6.3 7.9 6.3 11.2a6.3 6.3 0 1 1-12.6 0c0-3.3 3-6.6 6.3-11.2z"/>',read:'<path d="M4 5.8c0-1 .8-1.8 1.8-1.8H11v15.5H5.8A1.8 1.8 0 0 1 4 17.7V5.8z"/><path d="M20 5.8c0-1-.8-1.8-1.8-1.8H13v15.5h5.2c1 0 1.8-.8 1.8-1.8V5.8z"/>',cleaning:'<line x1="18.5" y1="4" x2="10" y2="12.5"/><path d="M10 12.5l-4.3 7 2.6 1 3-6.3 1.7-1.7"/><path d="M4.5 21l1.8-2.8"/>',bad:'<circle cx="12" cy="12" r="8.5"/>'};
function habitIconMarkup(o){const n=HABIT_ICONS[o.id];return n?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${n}</svg>`:esc(o.emoji||"⭐")}
const ICONS={play:'<polygon points="7 4 20 12 7 20 7 4"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',trophy:'<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',bellOff:'<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>',moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',volume:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',zen:'<circle cx="12" cy="6" r="2.5"/><path d="M12 9.5v4"/><path d="M4 19c2.2-.6 4.5-2 8-2s5.8 1.4 8 2"/><path d="M8 13.5c1 .6 2.4 1 4 1s3-.4 4-1"/>',edit:'<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'};
function icon(o){const n=ICONS[o]||HABIT_ICONS[o];return n?`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n}</svg>`:""}
const fmtNum=t=>Number(t).toLocaleString("fr-FR");
const esc=t=>String(t??"").replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]);
function progressBar(a,r){return`<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a}" aria-label="${esc(r)}"><div class="pbar-fill" style="width:${a}%"></div></div>`}
function drinkCfg(){const n=HABITS.find(i=>i.type==="drink"&&!i.archived)||HABITS.find(i=>i.type==="drink");return{goal:n&&n.goal||DRINK_GOAL,step:n&&n.step||DRINK_STEP,max:n&&n.max||DRINK_MAX}}
function habitProgress(t,n){if(t.type==="drink"){const e=drinkCfg();return{v:getDrinkMl(n),goal:e.goal,max:e.max,step:e.step,unit:"ml"}}return{v:getCounterVal(t.id,n),goal:t.goal,max:t.max,step:t.step,unit:esc(t.unit||"")}}
function dayProgress(t,r,n){if(t.type==="drink"||t.type==="counter"){const e=habitProgress(t,r);return Math.min(1,e.v/e.goal)}return getHabitDayValue(t,r,n)}
const LEVEL_THRESHOLDS=[0,100,250,500,800,1200,1700,2400,3200,4200];
const LEVEL_NAMES=["Novice","Apprenti","Pratiquant","Fervent","Discipliné","Concentré","Maître","Grand maître","Légende","Transcendant"];
const MOOD_LABELS=["","Mal","Bof","Neutre","Bien","Super"];
const MOOD_EMOJIS=["","😡","😢","😐","😊","😎"];
const FEELINGS_BY_MOOD={5:["Joie","Courage","Motivation","Créativité","Confiance","Calme","Gratitude","Sérénité","Enthousiasme","Amour","Espoir","Inspiration","Fierté","Euphorie","Nostalgie"],4:["Détente","Contentement","Optimisme","Énergie","Concentration","Gaieté","Satisfaction","Légèreté","Gratitude","Fraîcheur"],3:["Neutre","Calme","Indifférence","Stabilité","Équilibre","Normalité","Routine","Rien de spécial"],2:["Fatigue","Anxiété","Stress","Inquiétude","Surcharge","Tristesse","Solitude","Frustration"],1:["Colère","Épuisement","Désespoir","Détresse","Déprime","Irritation","Burn-out"]};
const MONTH_NAMES=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTH_SHORT=["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"];
const DAY_FULL=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const DAY_SHORT=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const cssVar=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim();
const withAlpha=(a,e)=>{const n=a.replace("#",""),o=n.length===3?n.split("").map(s=>s+s).join(""):n,t=parseInt(o,16);return`rgba(${t>>16&255},${t>>8&255},${t&255},${e})`};
const fmtDate=t=>{const a=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),e=String(t.getDate()).padStart(2,"0");return`${a}-${n}-${e}`};
const parseDate=e=>{const[t,a,n]=e.split("-").map(Number);return new Date(t,a-1,n)};
const addDays=(e,a)=>{const t=new Date(e);return t.setDate(t.getDate()+a),t};
let _dayStartHour=0;
function setDayStartHour(t){_dayStartHour=Math.max(0,Math.min(6,Math.floor(Number(t))||0))}
const appNow=()=>new Date(Date.now()-_dayStartHour*36e5);
const today=()=>fmtDate(appNow());
const isWeekend=n=>{const e=n.getDay();return e===0||e===6};
const isDayActive=(e,s)=>e.since&&fmtDate(s)<e.since||isPaused(fmtDate(s))||e.gaps&&habitGapAt(e,fmtDate(s))?!1:e.activeDays?e.activeDays.includes(s.getDay()):e.weekdayOnly?!isWeekend(s):!0;
function getDrinkMl(t){const r=DB.habits.drink;if(!r)return 0;const n=r.logs[t];return typeof n=="number"?n:n==="done"?drinkCfg().goal:0}
function isDrinkDone(n){return getDrinkMl(n)>=drinkCfg().goal}
function isBadFail(i,a){return DB.habits[i].logs[a]==="fail"}
function getCounterVal(n,e){const t=DB.habits[n].logs[e];return typeof t=="number"?t:0}
function isCounterDone(n,e){return getCounterVal(n.id,e)>=n.goal}
function getWeekMonday(e){const t=new Date(e);t.setHours(0,0,0,0);const a=t.getDay()===0?6:t.getDay()-1;return t.setDate(t.getDate()-a),fmtDate(t)}
function isWeeklyDoneForWeek(t,s){const o=DB.habits[t].logs,n=parseDate(s);for(let e=0;e<7;e++){const r=fmtDate(addDays(n,e));if(o[r]==="done")return!0}return!1}
function getHabitDayValue(e,n,r){if(e.type==="drink")return isDrinkDone(n)?1:0;if(e.type==="counter")return isCounterDone(e,n)?1:getCounterVal(e.id,n)/e.goal;if(e.type==="weekly"){const o=getWeekMonday(r||parseDate(n));return isWeeklyDoneForWeek(e.id,o)?1:0}return e.type==="bad"?isBadFail(e.id,n)?0:1:DB.habits[e.id].logs[n]==="done"?1:0}
function isHabitDoneOn(n,t,a){return getHabitDayValue(n,t,a)===1}
const STORE_KEY="ht-v2.6",BAK_KEY="ht-v2.6.bak";
function loadData(){try{const e=localStorage.getItem(STORE_KEY);if(e)return JSON.parse(e)}catch{}const t={createdAt:today(),habits:{},profile:{name:""},xp:0,moods:{},unlockedAchievements:[],perfectDaysClaimed:[],penaltiesApplied:[]};return DEFAULT_HABITS.forEach(e=>t.habits[e.id]={logs:{}}),t}
function saveData(){try{localStorage.setItem(STORE_KEY,JSON.stringify(DB))}catch{if(!saveData._warned){saveData._warned=!0;try{showToast("Stockage plein : impossible d’enregistrer. Exporte tes données.",6e3,"alert")}catch{}}}}
let DB=loadData();
const DEFAULT_REMINDERS=[{id:"r_work",title:"💼 Mode travail",body:"Mode concentration activé.",hour:8,minute:30,days:[1,2,3,4,5],habitId:"work",enabled:!0},{id:"r_running",title:"🏃 Heure de courir",body:"Enfile tes baskets !",hour:17,minute:30,days:[1,2,3,4,5],habitId:"running",enabled:!0},{id:"r_sleep",title:"💤 Extinction des feux",body:"Ton lit te réclame.",hour:21,minute:0,days:[1,2,3,4,5],habitId:"",enabled:!0},{id:"r_phone",title:"📵 Téléphone posé",body:"Branche ton téléphone loin.",hour:21,minute:0,days:[0,1,2,3,4,5,6],habitId:"",enabled:!0}];
Array.isArray(DB.habitDefs)||(DB.habitDefs=JSON.parse(JSON.stringify(DEFAULT_HABITS)));
let HABITS=DB.habitDefs;
HABITS.forEach(i=>{DB.habits[i.id]||(DB.habits[i.id]={logs:{}})});
Array.isArray(DB.reminders)||(DB.reminders=JSON.parse(JSON.stringify(DEFAULT_REMINDERS)));
DB.createdAt||(DB.createdAt=today());
DB.profile||(DB.profile={name:""});
DB.profile.soundEnabled===void 0&&(DB.profile.soundEnabled=!0);
DB.xp||(DB.xp=0);
DB.unlockedAchievements||(DB.unlockedAchievements=[]);
DB.moods||(DB.moods={});
DB.perfectDaysClaimed||(DB.perfectDaysClaimed=[]);
DB.penaltiesApplied||(DB.penaltiesApplied=[]);
DB.profile.notifsEnabled===void 0&&(DB.profile.notifsEnabled=!1);
DB.profile.dayStartHour===void 0&&(DB.profile.dayStartHour=0);
DB.profile.weeklyReview===void 0&&(DB.profile.weeklyReview=!0);
DB.xpWeek||(DB.xpWeek={});
setDayStartHour(DB.profile.dayStartHour);
DB.profile.themeMode===void 0&&(DB.profile.themeMode=DB.profile.darkMode===void 0?"system":DB.profile.darkMode===!0?"dark":"light");
DB.profile.darkMode===void 0&&(DB.profile.darkMode=!1);
DB.pauses||(DB.pauses={});
DB.meditation||(DB.meditation={});
DB.journal||(DB.journal={});
DB.challenges||(DB.challenges=[]);
DB.seasonXp||(DB.seasonXp={});
DB.profile.moodFeelings||(DB.profile.moodFeelings={});
