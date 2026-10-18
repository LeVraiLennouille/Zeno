const HABITS = [
  {id:'sleep',    name:'Sommeil',           emoji:'💤', type:'good',    color:'#8EA2FF', freq:'Tous les jours',      weekdayOnly:true},
  {id:'projets',  name:'Projets perso',     emoji:'🚀', type:'good',    color:'#C79BFF', freq:'Tous les jours',      weekdayOnly:false},
  {id:'work',     name:'Travail',           emoji:'💼', type:'good',    color:'#FFD23F', freq:'Lundi - Vendredi',    weekdayOnly:true},
  {id:'gym',      name:'Gym',               emoji:'🏋️', type:'good',    color:'#52E0A1', freq:'Lundi - Vendredi',    weekdayOnly:true},
  {id:'running',  name:'Running',           emoji:'🏃', type:'counter', color:'#FF8A4C', freq:'5 jours par semaine', weekdayOnly:false, step:1, goal:5, max:15, unit:'km'},
  {id:'setp',     name:'Pas',               emoji:'👣', type:'counter', color:'#2EC4B6', freq:'Tous les jours',      weekdayOnly:false, step:1000, goal:10000, max:20000, unit:'pas'},
  {id:'drink',    name:"Boire de l'eau",    emoji:'💧', type:'drink',   color:'#52C7F2', freq:'Tous les jours',      weekdayOnly:false},
  {id:'read',     name:'15min Lecture',     emoji:'📚', type:'counter', color:'#FF7EB0', freq:'Tous les jours',      weekdayOnly:false, optional:true, step:5, goal:15, max:30, unit:'min'},
  {id:'cleaning', name:'Nettoyage',         emoji:'🧹', type:'weekly',  color:'#C3E34A', freq:'Tous les dimanches',  weekdayOnly:false, optional:true},
];

const DRINK_GOAL = 2000;
const DRINK_STEP = 250;
const DRINK_MAX  = 5000;

// Icônes ligne (style Feather) affichées dans les badges des habit-cards, à la place de l'emoji brut.
const HABIT_ICONS = {
  sleep:    '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  projets:  '<path d="M12 2.5c2.3 2.1 3.7 5.3 3.7 8.5 0 1.9-.4 3.4-1 4.8l-2.7 2.7-2.7-2.7c-.6-1.4-1-2.9-1-4.8 0-3.2 1.4-6.4 3.7-8.5z"/><circle cx="12" cy="10.5" r="1.4"/><path d="M9.3 15.5L7 17M14.7 15.5L17 17M10.3 18.7L12 21.5l1.7-2.8"/>',
  work:     '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12.5h18"/>',
  gym:      '<rect x="1.5" y="9" width="3" height="6" rx="1"/><rect x="19.5" y="9" width="3" height="6" rx="1"/><rect x="4.5" y="10.3" width="3" height="3.4" rx="0.6"/><rect x="16.5" y="10.3" width="3" height="3.4" rx="0.6"/><line x1="7.5" y1="12" x2="16.5" y2="12"/>',
  running:  '<circle cx="14.2" cy="4.2" r="1.6"/><path d="M9.5 20l2-5.5 3 1.8 2 3.7"/><path d="M7.3 13.2l2.9-2.7 2.1 1 2.8-1.2"/><path d="M5.5 17l3-2.2"/>',
  setp:     '<ellipse cx="9" cy="7.3" rx="2.6" ry="3.7" fill="currentColor" stroke="none" transform="rotate(-14 9 7.3)"/><ellipse cx="15.5" cy="15.6" rx="2.6" ry="3.7" fill="currentColor" stroke="none" transform="rotate(14 15.5 15.6)"/>',
  drink:    '<path d="M12 3.3c3.6 4.6 6.3 7.9 6.3 11.2a6.3 6.3 0 1 1-12.6 0c0-3.3 3-6.6 6.3-11.2z"/>',
  read:     '<path d="M4 5.8c0-1 .8-1.8 1.8-1.8H11v15.5H5.8A1.8 1.8 0 0 1 4 17.7V5.8z"/><path d="M20 5.8c0-1-.8-1.8-1.8-1.8H13v15.5h5.2c1 0 1.8-.8 1.8-1.8V5.8z"/>',
  cleaning: '<line x1="18.5" y1="4" x2="10" y2="12.5"/><path d="M10 12.5l-4.3 7 2.6 1 3-6.3 1.7-1.7"/><path d="M4.5 21l1.8-2.8"/>',
  bad:      '<circle cx="12" cy="12" r="8.5"/>',
};

function habitIconMarkup(habit) {
  const p = HABIT_ICONS[habit.id];
  if (!p) return habit.emoji;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

const ICONS = {"play":"<polygon points=\"7 4 20 12 7 20 7 4\"/>","stop":"<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/>","flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>", "trophy": "<circle cx=\"12\" cy=\"8\" r=\"7\"/><polyline points=\"8.21 13.89 7 23 12 20 17 23 15.79 13.88\"/>", "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/>", "alert": "<path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>", "bell": "<path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/>", "bellOff": "<path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/><path d=\"M18.63 13A17.89 17.89 0 0 1 18 8\"/><path d=\"M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14\"/><path d=\"M18 8a6 6 0 0 0-9.33-5\"/><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"/>", "moon": "<path d=\"M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z\"/>", "sun": "<circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42\"/>", "volume": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07\"/>", "zen": "<circle cx=\"12\" cy=\"6\" r=\"2.5\"/><path d=\"M12 9.5v4\"/><path d=\"M4 19c2.2-.6 4.5-2 8-2s5.8 1.4 8 2\"/><path d=\"M8 13.5c1 .6 2.4 1 4 1s3-.4 4-1\"/>", "edit": "<path d=\"M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z\"/>", "trash": "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/><path d=\"M10 11v6M14 11v6\"/><path d=\"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\"/>", "user": "<path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>"};
function icon(name) {
  const p = ICONS[name] || HABIT_ICONS[name];
  return p ? `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : '';
}
const fmtNum = n => Number(n).toLocaleString('fr-FR');

function progressBar(pct, label) {
  return `<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${label}"><div class="pbar-fill" style="width:${pct}%"></div></div>`;
}
function habitProgress(h, k) {
  if (h.type === 'drink') return { v: getDrinkMl(k), goal: DRINK_GOAL, max: DRINK_MAX, step: DRINK_STEP, unit: 'ml' };
  return { v: getCounterVal(h.id, k), goal: h.goal, max: h.max, step: h.step, unit: h.unit || '' };
}
function dayProgress(h, k, d) {
  if (h.type === 'drink' || h.type === 'counter') { const p = habitProgress(h, k); return Math.min(1, p.v / p.goal); }
  return getHabitDayValue(h, k, d);
}

const LEVEL_THRESHOLDS = [0,100,250,500,800,1200,1700,2400,3200,4200];
const LEVEL_NAMES = ['Novice','Apprenti','Pratiquant','Fervent','Discipliné','Concentré','Maître','Grand maître','Légende','Transcendant'];

const MOOD_LABELS  = ['','Mal','Bof','Neutre','Bien','Super'];
const MOOD_EMOJIS  = ['','😡','😢','😐','😊','😎'];
const MOOD_COLORS  = ['','#FF6B6B','#FF8A4C','#FFD23F','#52E0A1','#8EA2FF'];

const FEELINGS_BY_MOOD = {
  5: ['Joie','Courage','Motivation','Créativité','Confiance','Calme','Gratitude','Sérénité','Enthousiasme','Amour','Espoir','Inspiration','Fierté','Euphorie','Nostalgie'],
  4: ['Détente','Contentement','Optimisme','Énergie','Concentration','Gaieté','Satisfaction','Légèreté','Gratitude','Fraîcheur'],
  3: ['Neutre','Calme','Indifférence','Stabilité','Équilibre','Normalité','Routine','Rien de spécial'],
  2: ['Fatigue','Anxiété','Stress','Inquiétude','Surcharge','Tristesse','Solitude','Frustration'],
  1: ['Colère','Épuisement','Désespoir','Détresse','Déprime','Irritation','Burn-out'],
};

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTH_SHORT  = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

const DAY_FULL    = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const DAY_SHORT   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const withAlpha = (hex,a) => { const h=hex.replace('#',''); const f=h.length===3?h.split('').map(c=>c+c).join(''):h; const n=parseInt(f,16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; };
const fmtDate = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const parseDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays   = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const today     = () => fmtDate(new Date());
const isWeekend = d => { const dow=d.getDay(); return dow===0||dow===6; };
const isDayActive = (habit, dateObj) => {
  if (habit.activeDays) return habit.activeDays.includes(dateObj.getDay());
  if (habit.weekdayOnly) return !isWeekend(dateObj);
  return true;
};

function getDrinkMl(k) { const v=DB.habits['drink'].logs[k]; return typeof v==='number'?v:v==='done'?DRINK_GOAL:0; }
function isDrinkDone(k) { return getDrinkMl(k)>=DRINK_GOAL; }
function isBadFail(id,k) { return DB.habits[id].logs[k]==='fail'; }
function getCounterVal(id,k) { const v=DB.habits[id].logs[k]; return typeof v==='number'?v:0; }
function isCounterDone(habit,k) { return getCounterVal(habit.id,k)>=habit.goal; }
function getWeekMonday(dateObj) { const d=new Date(dateObj); d.setHours(0,0,0,0); const dow=d.getDay()===0?6:d.getDay()-1; d.setDate(d.getDate()-dow); return fmtDate(d); }
function isWeeklyDoneForWeek(id,wk) { const logs=DB.habits[id].logs; const s=parseDate(wk); for(let i=0;i<7;i++){const k=fmtDate(addDays(s,i));if(logs[k]==='done')return true;} return false; }

function getHabitDayValue(habit,k,dateObj) {
  if(habit.type==='drink')   return isDrinkDone(k)?1:0;
  if(habit.type==='counter') return isCounterDone(habit,k)?1:getCounterVal(habit.id,k)/habit.goal;
  if(habit.type==='weekly')  { const wk=getWeekMonday(dateObj||parseDate(k)); return isWeeklyDoneForWeek(habit.id,wk)?1:0; }
  if(habit.type==='bad')     return isBadFail(habit.id,k)?0:1;
  return DB.habits[habit.id].logs[k]==='done'?1:0;
}

function isHabitDoneOn(habit,k,dateObj) {
  const v = getHabitDayValue(habit,k,dateObj);
  return v===1;
}

function loadData() {
  try { const raw=localStorage.getItem('ht-v2.6'); if(raw) return JSON.parse(raw); } catch(e){}
  const d={createdAt:today(),habits:{},profile:{name:''},xp:0,moods:{},unlockedAchievements:[],perfectDaysClaimed:[],penaltiesApplied:[]};
  HABITS.forEach(h=>d.habits[h.id]={logs:{}});
  return d;
}
function saveData() { localStorage.setItem('ht-v2.6',JSON.stringify(DB)); }

let DB = loadData();
HABITS.forEach(h=>{ if(!DB.habits[h.id]) DB.habits[h.id]={logs:{}}; });
if(!DB.createdAt) DB.createdAt=today();
if(!DB.profile) DB.profile={name:''};
if(DB.profile.soundEnabled===undefined) DB.profile.soundEnabled=true;
if(!DB.xp) DB.xp=0;
if(!DB.unlockedAchievements) DB.unlockedAchievements=[];
if(!DB.moods) DB.moods={};
if(!DB.perfectDaysClaimed) DB.perfectDaysClaimed=[];
if(!DB.penaltiesApplied) DB.penaltiesApplied=[];
if(DB.profile.notifsEnabled===undefined) DB.profile.notifsEnabled=false;
if(DB.profile.darkMode===undefined) DB.profile.darkMode=false;
if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};

function initTheme() {
  const dark = DB.profile.darkMode===true;
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  const btn=document.getElementById('themeToggle');
  if(btn){ btn.textContent=dark?'Activé':'Désactivé'; btn.className=`pref-toggle ${dark?'on':'off'}`; }
}
function toggleTheme() {
  DB.profile.darkMode = !DB.profile.darkMode;
  saveData(); initTheme();
}
initTheme();

const audioCtx = (() => { try { return new (window.AudioContext||window.webkitAudioContext)(); } catch(e){ return null; } })();
function playSound(type) {
  if(!DB.profile.soundEnabled||!audioCtx) return;
  try {
    if(audioCtx.state==='suspended') audioCtx.resume();
    const play=(freq,dur,waveType='sine',startGain=0.2,endGain=0.001)=>{
      const osc=audioCtx.createOscillator(); const g=audioCtx.createGain();
      osc.connect(g); g.connect(audioCtx.destination);
      osc.type=waveType; osc.frequency.value=freq;
      g.gain.setValueAtTime(startGain,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(endGain,audioCtx.currentTime+dur);
      osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+dur);
    };
    if(type==='done')    { play(659,0.05); setTimeout(()=>play(880,0.2),50); }
    if(type==='undo')    { play(440,0.15); setTimeout(()=>play(330,0.2),80); }
    if(type==='fail')    { play(280,0.35,'sawtooth',0.18); }
    if(type==='drink')   { [523,659].forEach((f,i)=>setTimeout(()=>play(f,0.3),i*100)); }
    if(type==='fanfare') { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>play(f,0.5,'triangle',0.22),i*130)); }
    if(type==='levelup') { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>play(f,0.55,'sine',0.28),i*100)); }
  } catch(e){}
}

function showToast(msg, dur=3200, ic) {
  const toast=document.getElementById('toast');
  toast.innerHTML=ic?icon(ic):'';
  const s=document.createElement('span'); s.textContent=msg; toast.appendChild(s);
  toast.classList.add('show');
  clearTimeout(showToast._t); showToast._t=setTimeout(()=>toast.classList.remove('show'), dur);
}

function calcLevel(xp) {
  xp=xp||0; let level=1;
  for(let i=0;i<LEVEL_THRESHOLDS.length;i++){ if(xp>=LEVEL_THRESHOLDS[i]) level=i+1; else break; }
  return Math.min(level,LEVEL_THRESHOLDS.length);
}
function xpProgress(xp) {
  xp=xp||0; const level=calcLevel(xp);
  if(level>=LEVEL_THRESHOLDS.length) return {pct:100,needed:0};
  const cur=LEVEL_THRESHOLDS[level-1]||0; const next=LEVEL_THRESHOLDS[level];
  return {pct:Math.round(((xp-cur)/(next-cur))*100),needed:next-xp};
}
function giveXP(amount) {
  const prev=calcLevel(DB.xp); DB.xp=(DB.xp||0)+amount;
  const nw=calcLevel(DB.xp); saveData();
  if(nw>prev){ const name=LEVEL_NAMES[nw-1]||`Niveau ${nw}`; setTimeout(()=>{ playSound('levelup'); showToast(`Niveau ${nw} atteint : ${name}`,4000,'star'); },300); }
}
function loseXP(amount) { DB.xp=Math.max(0,(DB.xp||0)-amount); saveData(); }

function calcWeeklyStreak(habit) {
  const cwm=getWeekMonday(new Date()); const cur=isWeeklyDoneForWeek(habit.id,cwm);
  const start=cur?0:1; let streak=0;
  for(let o=start;o<104;o++){ const wm=fmtDate(addDays(parseDate(cwm),-o*7)); if(wm<DB.createdAt) break; if(!isWeeklyDoneForWeek(habit.id,wm)) break; streak++; }
  return streak;
}
function calcStreak(habit) {
  if(habit.type==='weekly') { const s=calcWeeklyStreak(habit); return {current:s,longest:s}; }
  const logs=DB.habits[habit.id].logs; const todayKey=today(); const createdAt=DB.createdAt;
  if(habit.type==='bad') {
    let streak=0; let d=new Date();
    for(let i=0;i<730;i++){ const k=fmtDate(d); if(k<createdAt) break; if(!isDayActive(habit,d)){d=addDays(d,-1);continue;} if(isBadFail(habit.id,k)) break; if(k<=todayKey) streak++; d=addDays(d,-1); }
    return {current:streak,longest:streak};
  }
  const logDone=k=>{ if(habit.type==='drink') return isDrinkDone(k); if(habit.type==='counter') return isCounterDone(habit,k); return logs[k]==='done'; };
  const todayDone=logDone(todayKey); const todayObj=new Date(); const todayInactive=!isDayActive(habit,todayObj); const todayEffDone=todayDone||todayInactive;
  let d=new Date(); if(!todayEffDone) d=addDays(d,-1);
  let streak=0;
  for(let i=0;i<730;i++){ const k=fmtDate(d); if(k<createdAt) break; if(!isDayActive(habit,d)){d=addDays(d,-1);continue;} if(logDone(k)) streak++; else break; d=addDays(d,-1); }
  let best=0,run=0; let dd=new Date(parseDate(createdAt));
  while(fmtDate(dd)<=todayKey){ const k=fmtDate(dd); if(!isDayActive(habit,dd)){dd=addDays(dd,1);continue;} if(logDone(k)){run++;best=Math.max(best,run);}else run=0; dd=addDays(dd,1); }
  return {current:streak,longest:Math.max(streak,best)};
}

function countDoneToday() {
  const t=today(); const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  return HABITS.filter(h=>!h.optional && isDayActive(h,todayDate) && isHabitDoneOn(h,t,todayDate)).length;
}
function requiredToday() { const todayDate=new Date(); todayDate.setHours(0,0,0,0); return HABITS.filter(h=>!h.optional&&isDayActive(h,todayDate)).length; }

const ACHIEVEMENTS = [
  { id:'first_habit', emoji:'🌱', name:"Premier pas",       desc:"Valide ta première habitude",              check:()=>Object.values(DB.habits).some(h=>Object.keys(h.logs).length>0) },
  { id:'camel',       emoji:'🐫', name:"Chameau",            desc:"7 jours d'affilée à l'objectif eau",                check:()=>{const h=HABITS.find(x=>x.id==='drink');return h&&calcStreak(h).current>=7;} },
  { id:'perfect_wk',  emoji:'⭐', name:"Semaine parfaite",     desc:"100 % de réussite sur une semaine complète",           check:()=>checkPerfectWeek() },
  { id:'king',        emoji:'👑', name:"Maîtrise de soi",             desc:"Aucune mauvaise habitude pendant 14 jours",     check:()=>{const b=HABITS.filter(h=>h.type==='bad');return b.length>0&&b.every(h=>calcStreak(h).current>=14);} },
  { id:'centurion',   emoji:'⚔️', name:"Centurion",        desc:"Cumule 100 XP",                      check:()=>(DB.xp||0)>=100 },
  { id:'on_fire',     emoji:'🔥', name:"En feu",          desc:"Atteins le niveau 5",                          check:()=>calcLevel(DB.xp)>=5 },
  { id:'bookworm',    emoji:'📖', name:"Rat de bibliothèque",         desc:"Série de lecture de 14 jours",                  check:()=>{const h=HABITS.find(x=>x.id==='read');return h&&calcStreak(h).current>=14;} },
  { id:'ironwill',    emoji:'💪', name:"Volonté de fer",        desc:"20 séances de gym dans le mois",             check:()=>checkGymMonth() },
  { id:'consistent',  emoji:'🌅', name:"Régularité",       desc:"Série de 30 jours ou plus sur une habitude",            check:()=>HABITS.some(h=>calcStreak(h).current>=30) },
  { id:'night_tmd',   emoji:'🌙', name:"Hibou apprivoisé",  desc:"Série de sommeil de 14 jours",                    check:()=>{const h=HABITS.find(x=>x.id==='sleep');return h&&calcStreak(h).current>=14;} },
  { id:'xp_500',      emoji:'💎', name:"Réserve d'XP",       desc:"Cumule 500 XP",                      check:()=>(DB.xp||0)>=500 },
  { id:'dedicated',   emoji:'🎯', name:"Dévouement",        desc:"Série de 60 jours ou plus sur une habitude",            check:()=>HABITS.some(h=>calcStreak(h).current>=60) },
  { id:'perfectist',  emoji:'💯', name:"Perfectionniste",    desc:"5 journées parfaites",                         check:()=>(DB.perfectDaysClaimed||[]).length>=5 },
  { id:'hydration',   emoji:'🌊', name:"Hydratation parfaite", desc:"30 jours d'affilée à l'objectif eau",               check:()=>{const h=HABITS.find(x=>x.id==='drink');return h&&calcStreak(h).current>=30;} },
  { id:'transcend',   emoji:'🌌', name:"Transcendance",     desc:"Atteins le niveau maximal",                check:()=>calcLevel(DB.xp)>=LEVEL_THRESHOLDS.length },
  { id:'walker',      emoji:'👣', name:"Sur la route",           desc:"10 000 pas par jour pendant 7 jours",         check:()=>{const h=HABITS.find(x=>x.id==='setp');return h&&calcStreak(h).current>=7;} },
  { id:'marathoner',  emoji:'🏅', name:"Marathon",       desc:"10 000 pas par jour pendant 30 jours",        check:()=>{const h=HABITS.find(x=>x.id==='setp');return h&&calcStreak(h).current>=30;} },
];

function checkPerfectWeek() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  for(let w=1;w<=12;w++){
    const ws=addDays(parseDate(getWeekMonday(todayDate)),-(w*7)); const wsk=fmtDate(ws);
    if(wsk<DB.createdAt) break;
    let perfect=true;
    for(let d=0;d<7;d++){
      const dt=addDays(ws,d); if(dt>todayDate) continue;
      const k=fmtDate(dt); if(k<DB.createdAt){perfect=false;break;}
      for(const h of HABITS){ if(h.optional) continue; if(!isDayActive(h,dt)) continue; if(getHabitDayValue(h,k,dt)!==1){perfect=false;break;} }
      if(!perfect) break;
    }
    if(perfect) return true;
  }
  return false;
}
function checkGymMonth() {
  const mk=today().slice(0,7);
  const cnt=Object.entries(DB.habits['gym'].logs).filter(([k,v])=>k.startsWith(mk)&&v==='done').length;
  return cnt>=20;
}
function checkAchievements() {
  let nu=0;
  ACHIEVEMENTS.forEach(a=>{ if(!DB.unlockedAchievements.includes(a.id)&&a.check()){ DB.unlockedAchievements.push(a.id); nu++; setTimeout(()=>{showToast(`Succès débloqué : ${a.name}`,3500,'trophy');playSound('done');},(nu*700)); } });
  if(nu>0) saveData();
}
function checkPerfectDayBonus() {
  const t=today(); if(DB.perfectDaysClaimed.includes(t)) return;
  if(countDoneToday()===requiredToday()){ DB.perfectDaysClaimed.push(t); giveXP(50); setTimeout(()=>showToast('Journée parfaite ! +50 XP',3500,'star'),600); saveData(); }
}
function checkDailyPenalties() {}

function toggleHabit(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today();
  if(habit.type==='drink')   { addDrink();     return; }
  if(habit.type==='counter') { addCounter(id); return; }
  if(habit.type==='weekly') {
    const completing=DB.habits[id].logs[t]!=='done';
    if(completing) DB.habits[id].logs[t]='done'; else delete DB.habits[id].logs[t];
    completing?giveXP(20):playSound('undo'); if(!completing) playSound('undo');
    saveData(); checkAchievements(); afterToggle(id); return;
  }
  if(habit.type==='bad') {
    if(DB.habits[id].logs[t]==='fail'){delete DB.habits[id].logs[t];playSound('undo');}
    else{DB.habits[id].logs[t]='fail';playSound('fail');}
  } else {
    const completing=DB.habits[id].logs[t]!=='done';
    if(completing){DB.habits[id].logs[t]='done';giveXP(10);playSound('done');}
    else{delete DB.habits[id].logs[t];playSound('undo');}
  }
  saveData(); checkAchievements(); afterToggle(id);
}
function afterToggle(id) {
  if(countDoneToday()===requiredToday()){ launchConfetti(); playSound('fanfare'); checkPerfectDayBonus(); }
  renderActivePage();
  const el=document.querySelector(`[data-habit-id="${id}"]`);
  if(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function addDrink() { addDrinkAmount(DRINK_STEP); }
function addDrinkAmount(ml) {
  const t=today(); const cur=getDrinkMl(t);
  if(cur>=DRINK_MAX) return;
  const next=Math.min(DRINK_MAX, cur+ml);
  DB.habits['drink'].logs[t]=next;
  if(next>=DRINK_GOAL&&cur<DRINK_GOAL){playSound('drink');showToast("Objectif d'hydratation atteint ! +10 XP",3200,'drink');giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
}
function removeDrink() {
  const t=today(); const cur=getDrinkMl(t); if(cur<=0) return;
  const next=Math.max(0,cur-DRINK_STEP);
  if(next===0){delete DB.habits['drink'].logs[t];playSound('undo');}
  else{DB.habits['drink'].logs[t]=next; playSound('undo');}
  saveData(); renderActivePage();
}
function addCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur>=habit.max) return;
  const next=cur+habit.step;
  DB.habits[id].logs[t]=next;
  if(next>=habit.goal&&cur<habit.goal){playSound('done');showToast(`${habit.name} : objectif atteint ! +10 XP`,3200,habit.id);giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
}
function removeCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur<=0) return;
  const next=Math.max(0,cur-habit.step);
  if(next===0){delete DB.habits[id].logs[t];}
  else{DB.habits[id].logs[t]=next;}
  playSound('undo'); saveData(); checkAchievements(); renderActivePage();
}
let _confParticles=[];
function launchConfetti() {
  const canvas=document.getElementById('confettiCanvas');
  if(!canvas) return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const colors=['#8EA2FF','#C79BFF','#FFD23F','#52E0A1','#FF8A4C','#FF7EB0','#52C7F2'];
  _confParticles=Array.from({length:90},()=>({x:Math.random()*canvas.width,y:-10,vy:2+Math.random()*3,vx:(Math.random()-0.5)*4,rot:Math.random()*360,size:6+Math.random()*8,color:colors[Math.floor(Math.random()*colors.length)],alpha:1}));
  animateConfetti();
}
function animateConfetti() {
  const canvas=document.getElementById('confettiCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  _confParticles=_confParticles.filter(p=>p.alpha>0.01);
  _confParticles.forEach(p=>{ p.y+=p.vy; p.x+=p.vx; p.rot+=3; p.alpha-=0.012; ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color; ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2); ctx.restore(); });
  if(_confParticles.length>0) requestAnimationFrame(animateConfetti);
}

let activePage = 'home';
let activeHomeTab = 'today';
let moodCalMonth = new Date();
moodCalMonth.setDate(1);

function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  document.getElementById(`page-${id}`).classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`nav-${id}`).classList.add('active');
  activePage=id;
  renderActivePage();
}

function renderActivePage() {
  if(activePage==='home')         renderHome();
  if(activePage==='achievements') renderAchievements();
  if(activePage==='report')       renderReport();
  if(activePage==='myhabits')     renderMyHabits();
  if(activePage==='account')      renderAccount();
}

function switchHomeTab(tab) {
  activeHomeTab=tab;
  ['today','weekly','overall'].forEach(t=>{
    document.getElementById(`tab-${t}`).classList.toggle('hidden',t!==tab);
    document.getElementById(`tab-btn-${t}`).classList.toggle('active',t===tab);
  });
  renderHome();
}

function renderHome() {
  if(activeHomeTab==='today')   renderTodayTab();
  if(activeHomeTab==='weekly')  renderWeeklyTab();
  if(activeHomeTab==='overall') renderOverallTab();
  renderHero();
  const w=document.getElementById('home-wellness'); if(w) w.classList.toggle('hidden',activeHomeTab!=='today');
  renderSleepSummary();
}

function renderHero() {
  const el=document.getElementById('todayHero'); if(!el) return;
  const todayDate=new Date(); todayDate.setHours(0,0,0,0); const t=today();
  const active=HABITS.filter(h=>!h.optional&&isDayActive(h,todayDate));
  const done=active.filter(h=>isHabitDoneOn(h,t,todayDate));
  const perfect=active.length>0&&done.length===active.length;
  const date=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  const level=calcLevel(DB.xp);
  const strip=active.map(h=>{ const f=dayProgress(h,t,todayDate); return `<span class="ink-seg${f>=1?' done':''}" style="--ink:${h.color};--fill:${Math.round(f*100)}%" title="${h.name}"></span>`; }).join('');
  el.innerHTML=`
    <div class="hero-date">${date}</div>
    <div class="hero-score">
      <div class="hero-count${perfect?' perfect':''}" role="img" aria-label="${done.length} habitudes sur ${active.length}">${done.length}<small>/${active.length}</small></div>
      <div class="hero-side">
        <div class="hero-caption">${perfect?'Journée parfaite':'habitudes faites'}</div>
        <div class="hero-level">Niv. ${level} · ${LEVEL_NAMES[level-1]||'Novice'}</div>
      </div>
    </div>
    <div class="ink-strip" aria-hidden="true">${strip}</div>`;
}

function renderTodayTab() {
  const container=document.getElementById('todayHabits'); if(!container) return;
  const t=today(); const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  container.innerHTML='';
  HABITS.forEach(habit=>{
    if(!isDayActive(habit,todayDate)) return;
    const card=document.createElement('div');
    const isSimple=['good','bad','weekly'].includes(habit.type);
    const cardDone = habit.type!=='bad' && isHabitDoneOn(habit,t,todayDate);
    card.className='habit-card today-card'+(cardDone?' done':''); card.dataset.habitId=habit.id; card.style.setProperty('--ink',habit.color);
    const control=buildTodayControl(habit,t,todayDate);
    const subMarkup = (cardDone && isSimple)
      ? `<div class="today-card-sub done-flourish">accompli !</div>`
      : `<div class="today-card-sub">${buildTodaySubLabel(habit,t,todayDate)}</div>`;
    card.innerHTML=`
      <div class="today-card-top">
        <div class="today-card-left">
          <div class="today-emoji-box">${habitIconMarkup(habit)}</div>
          <div class="today-card-info">
            <div class="today-card-name">${habit.name}</div>
            ${subMarkup}
          </div>
        </div>
        ${isSimple?control:""}
      </div>
      ${!isSimple?control:""}
    `;
    container.appendChild(card);
    if(DB.profile.zenMode) {
      const done=isHabitDoneOn(habit,t,todayDate)||(habit.type==='bad'&&!isBadFail(habit.id,t));
      if(done) setTimeout(()=>card.classList.add('zen-collapse'),10);
    }
  });
}

function buildTodaySubLabel(habit,t,todayDate) {
  const streak=calcStreak(habit).current;
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    return `${fail?'Craqué':'Tenu bon'} · ${icon('flame')} ${streak} j`;
  }
  return streak>0?`${icon('flame')} ${streak} jour${streak>1?'s':''} de suite`:(habit.freq||'Tous les jours');
}

function buildTodayControl(habit,t,todayDate) {
  if(habit.type==='drink'||habit.type==='counter') {
    const isDrink=habit.type==='drink';
    const p=habitProgress(habit,t);
    const pct=Math.min(100,Math.round((p.v/p.goal)*100));
    const atMax=p.v>=p.max;
    const hint=p.v>=p.goal?'Objectif atteint':`reste ${fmtNum(p.goal-p.v)} ${p.unit}`;
    const minus=`<button class="step-btn step-btn-minus" aria-label="Retirer ${fmtNum(p.step)} ${p.unit}" onclick="${isDrink?'removeDrink()':`removeCounter('${habit.id}')`}"${p.v<=0?' disabled':''}>−</button>`;
    const adds=atMax?'':(isDrink
      ? `<button class="step-btn" onclick="addDrinkAmount(250)">+250 ml</button><button class="step-btn" onclick="addDrinkAmount(500)">+500 ml</button>`
      : `<button class="step-btn" onclick="addCounter('${habit.id}')">+${fmtNum(p.step)} ${p.unit}</button>`);
    return `<div class="ctl">
      <div class="ctl-head">
        <span class="ctl-value">${fmtNum(p.v)}<small> / ${fmtNum(p.goal)} ${p.unit}</small></span>
        <span class="ctl-hint">${hint}</span>
      </div>
      ${progressBar(pct,habit.name)}
      <div class="step-btns">${minus}${adds}</div>
    </div>`;
  }
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    return `<button class="habit-toggle-btn${fail?' done fail':''}"
      onclick="toggleHabit('${habit.id}')">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="20" height="20" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${fail?'<line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>':'<polyline points="4 10 8 14 16 6"/>'}
      </svg>
    </button>`;
  }
  const done=habit.type==='weekly'?isWeeklyDoneForWeek(habit.id,getWeekMonday(todayDate)):DB.habits[habit.id].logs[t]==='done';
  return `<button class="habit-toggle-btn${done?' done':''}" onclick="toggleHabit('${habit.id}')">
    <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
  </button>`;
}

function renderWeeklyTab() {
  const container=document.getElementById('weeklyHabits'); if(!container) return;
  container.innerHTML='';
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  HABITS.forEach(habit=>{
    const card=document.createElement('div');
    card.className='habit-card'; card.dataset.habitId=habit.id; card.style.setProperty('--ink',habit.color);
    const bgAlpha='22';
    let daysHtml='';
    DAY_SHORT.forEach((dayLbl,i)=>{
      const dateObj=addDays(monday,i); const k=fmtDate(dateObj);
      const active=isDayActive(habit,dateObj);
      const done=active&&isHabitDoneOn(habit,k,dateObj);
      const isToday=i===todayDow;
      const isSun=i===6;
      const isFuture=dateObj>todayDate;
      daysHtml+=`<div class="week-day-cell">
        <div class="week-day-label${isToday?' today-label':isSun?' sunday-label':''}">${dayLbl}</div>
        <div class="week-day-dot${done?' done':''}${!active?' inactive':''}" 
          style="${done?`background:${habit.color};border-color:${habit.color}`:active?`border-color:${habit.color+'50'}`:'border-color:var(--border)'}"
          ${!isFuture&&active?`onclick="toggleHabitOnDate('${habit.id}','${k}',this)"`:''}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(habit)}</div>
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div class="habit-card-freq">${habit.freq||'Tous les jours'}</div>
          </div>
        </div>
        <div class="streak-pill">${icon('flame')}${calcStreak(habit).current} j</div>
      </div>
      <div class="week-day-row">${daysHtml}</div>
    `;
    container.appendChild(card);
  });
}

function toggleHabitOnDate(id, dateKey, dotEl) {
  const habit=HABITS.find(h=>h.id===id);
  if(habit.type==='bad') {
    if(DB.habits[id].logs[dateKey]==='fail') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='fail';
  } else if(habit.type==='counter'||habit.type==='drink') {
    const goal=habit.type==='drink'?DRINK_GOAL:habit.goal;
    const cur=habit.type==='drink'?getDrinkMl(dateKey):getCounterVal(id,dateKey);
    if(cur>=goal) delete DB.habits[id].logs[dateKey]; else DB.habits[id].logs[dateKey]=goal;
  } else if(habit.type==='weekly') {
    if(DB.habits[id].logs[dateKey]==='done') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='done';
  } else {
    if(DB.habits[id].logs[dateKey]==='done') delete DB.habits[id].logs[dateKey];
    else DB.habits[id].logs[dateKey]='done';
  }
  saveData();
  renderWeeklyTab();
}

function renderOverallTab() {
  const container=document.getElementById('overallHabits'); if(!container) return;
  container.innerHTML='';
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const numWeeks=16;
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const lastSunday=addDays(todayDate,-todayDow-1);
  const monday=addDays(todayDate,-todayDow);
  const startDate=addDays(monday,-((numWeeks-1)*7));

  HABITS.forEach(habit=>{
    const card=document.createElement('div');
    card.className='habit-card'; card.dataset.habitId=habit.id; card.style.setProperty('--ink',habit.color);
    let gridHtml='';
    DAY_SHORT.forEach((dayLbl,dow)=>{
      gridHtml+=`<div class="overall-row-label">${dayLbl[0]}</div>`;
      for(let w=0;w<numWeeks;w++){
        const dateObj=addDays(startDate,w*7+dow);
        const k=fmtDate(dateObj);
        const isFuture=dateObj>todayDate;
        const active=isDayActive(habit,dateObj);
        let cls='overall-dot';
        let style='';
        if(!active||isFuture) { cls+=' inactive'; }
        else if(isHabitDoneOn(habit,k,dateObj)) { cls+=' done'; style=`background:${habit.color}`; }
        else if(k>=DB.createdAt) { cls+=' missed'; style=`background:${habit.color}20;border:1.5px solid ${habit.color}40`; }
        gridHtml+=`<div class="${cls}" style="${style}" title="${k}"></div>`;
      }
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(habit)}</div>
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div class="habit-card-freq">${habit.freq||'Tous les jours'}</div>
          </div>
        </div>
        <div class="streak-pill">${icon('flame')}${calcStreak(habit).current} j</div>
      </div>
      <div class="overall-dot-grid">${gridHtml}</div>
    `;
    container.appendChild(card);
  });
}

function renderMoodStat() {
  const container=document.getElementById('moodStatContent'); if(!container) return;
  const year=moodCalMonth.getFullYear(); const month=moodCalMonth.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today();

  let headers=DAY_SHORT.map(d=>`<div class="mood-cal-header">${d[0]}${d[1]}</div>`).join('');
  let cells='';
  for(let i=0;i<startDow;i++) cells+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d);
    const k=fmtDate(dateObj); const mood=DB.moods[k];
    const isFuture=k>today_;
    if(mood!==undefined&&!isFuture){
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}</div>
        <div class="mood-cal-day-label">${MOOD_LABELS[mood]||'?'}</div>
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

  container.innerHTML=`
    <div class="mood-cal-card">
      <div class="mood-cal-nav">
        <button class="mood-cal-nav-btn" onclick="moodCalPrev()">
          <svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg>
        </button>
        <div class="mood-cal-month">${MONTH_NAMES[month]} ${year}</div>
        <button class="mood-cal-nav-btn" onclick="moodCalNext()">
          <svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg>
        </button>
      </div>
      <div class="mood-cal-grid">
        ${headers}
        ${cells}
      </div>
    </div>
  `;
}
function moodCalPrev() { moodCalMonth.setMonth(moodCalMonth.getMonth()-1); renderActivePage(); }
function moodCalNext() { const nm=new Date(moodCalMonth); nm.setMonth(nm.getMonth()+1); if(nm<=new Date()) moodCalMonth=nm; renderActivePage(); }

let currentMoodDate=null;
let selectedMoodValue=null;
let selectedFeelings=[];

function checkDailyMood() {
  if(sessionStorage.getItem('moodChecked')) return;
  sessionStorage.setItem('moodChecked','1');
  const t=today(); if(t<DB.createdAt) return;
  if(DB.moods[t]!==undefined) return;
  setTimeout(()=>openMoodModal(t),2000);
}

function openMoodManual() { openMoodModal(today()); }

function openMoodModal(dateKey) {
  currentMoodDate=dateKey; selectedMoodValue=null; selectedFeelings=[];
  document.getElementById('moodStep1').classList.remove('hidden');
  document.getElementById('moodStep2').classList.add('hidden');
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.remove('selected'));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=true; btn.textContent='Je me sens…';
  document.getElementById('moodModal').classList.add('open');
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
  selectedFeelings=[];
  const title=document.getElementById('moodStep2Title');
  title.textContent=`${MOOD_LABELS[selectedMoodValue]} ! Comment décris-tu ton ressenti ?`;
  const feelings=FEELINGS_BY_MOOD[selectedMoodValue]||[];
  const grid=document.getElementById('feelingsGrid');
  grid.innerHTML=feelings.map(f=>`<button class="feeling-tag" onclick="selectFeeling('${f}',this)">${f}</button>`).join('');
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
  DB.moods[currentMoodDate]=selectedMoodValue;
  if(selectedFeelings.length>0){
    if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};
    DB.profile.moodFeelings[currentMoodDate]=selectedFeelings.join(',');
  }
  saveData();
  closeMoodModal();
  if(activePage==='report') renderReport();
  showToast(`Humeur enregistrée ${MOOD_EMOJIS[selectedMoodValue]}`,2000);
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
      cells+=`<div class="mood-cal-cell">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}</div>
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

function renderReport() {
  const container=document.getElementById('reportContent'); if(!container) return;

  const maxStreak=HABITS.reduce((m,h)=>Math.max(m,calcStreak(h).current),0);
  const last30=getLast30Completion();
  const completionRate=Math.round(last30*100);
  const totalCompleted=Object.values(DB.habits).reduce((s,h)=>s+Object.values(h.logs).filter(v=>v==='done').length,0);
  const perfectDays=(DB.perfectDaysClaimed||[]).length;

  const barData=buildBarData();
  const calHtml=buildCalStats();

  container.innerHTML=`
    <div class="report-wrap">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">${maxStreak}</div>
          <div class="stat-label">Série en cours</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${completionRate}%</div>
          <div class="stat-label">Taux de réussite</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${totalCompleted.toLocaleString()}</div>
          <div class="stat-label">Habitudes validées</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${perfectDays}</div>
          <div class="stat-label">Journées parfaites</div>
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Habitudes validées</div>
          <div class="report-period-badge">Cette semaine
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <div class="bar-chart" id="barChart">
          ${barData.map((b,i)=>`
            <div class="bar-col">
              <div class="bar-fill${b.isToday?' active':''}" style="height:${b.pct}%;background:${b.isToday?'var(--accent)':'var(--accent-bg)'}">
                ${b.isToday?`<div class="bar-tooltip">${b.count} habitudes</div>`:''}
              </div>
              <div class="bar-label">${b.label}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Évolution du taux de réussite</div>
          <div class="report-period-badge">6 derniers mois
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <canvas id="lineChartReport" height="160"></canvas>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier du mois</div>
          <div class="report-period-badge">Ce mois-ci
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <div class="cal-stats-grid">
          ${DAY_SHORT.map(d=>`<div class="cal-stats-header">${d[0]}${d[1]}</div>`).join('')}
          ${calHtml}
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
          <div class="report-period-badge">Cette semaine
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 5 7 8 4"/></svg>
          </div>
        </div>
        <canvas id="moodChartReport" height="100"></canvas>
      </div>
    </div>
  `;

  requestAnimationFrame(()=>{
    drawLineChart('lineChartReport');
    drawMoodChart('moodChartReport');
  });
}

function getLast30Completion() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  let total=0, done=0;
  for(let i=0;i<30;i++){
    const d=addDays(todayDate,-i); const k=fmtDate(d);
    if(k<DB.createdAt) break;
    HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,d)) return; total++; if(isHabitDoneOn(h,k,d)) done++; });
  }
  return total>0?done/total:0;
}

function buildBarData() {
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  return DAY_SHORT.map((lbl,i)=>{
    const d=addDays(monday,i); const k=fmtDate(d);
    const isFuture=d>todayDate;
    if(isFuture) return {label:lbl,count:0,pct:0,isToday:false};
    let cnt=0,req=0;
    HABITS.forEach(h=>{ if(!isDayActive(h,d)) return; req++; if(isHabitDoneOn(h,k,d)) cnt++; });
    const pct=req>0?Math.max(5,Math.round((cnt/req)*100)):0;
    return {label:lbl,count:cnt,pct,isToday:i===todayDow};
  });
}

function buildCalStats() {
  const now=new Date(); const year=now.getFullYear(); const month=now.getMonth();
  const firstDay=new Date(year,month,1); const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;
  const today_=today(); let html='';
  for(let i=0;i<startDow;i++) html+=`<div></div>`;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateObj=new Date(year,month,d); const k=fmtDate(dateObj);
    const isFuture=k>today_;
    if(isFuture){ html+=`<div class="cal-stats-cell future">${d}</div>`; continue; }
    if(k<DB.createdAt){ html+=`<div class="cal-stats-cell">${d}</div>`; continue; }
    let done=0,req=0;
    HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,dateObj)) return; req++; if(isHabitDoneOn(h,k,dateObj)) done++; });
    const rate=req>0?done/req:0;
    let cls='cal-stats-cell'; if(rate>=1) cls+=' perfect'; else if(rate>=0.7) cls+=' good'; else if(req>0) cls+=' missed';
    html+=`<div class="${cls}" title="${done}/${req}">${d}</div>`;
  }
  return html;
}

function drawLineChart(canvasId) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth; const H=160; canvas.width=W; canvas.height=H;
  const isDark=DB.profile.darkMode===true;
  const accent=cssVar('--accent')||'#12131A';
  const gridC=isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)';
  const textC=isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';

  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const mn=d.getMonth(); const yr=d.getFullYear();
    let done=0,req=0;
    const daysInMonth=new Date(yr,mn+1,0).getDate();
    for(let day=1;day<=daysInMonth;day++){
      const dt=new Date(yr,mn,day); const k=fmtDate(dt);
      if(k>fmtDate(now)||k<DB.createdAt) continue;
      HABITS.forEach(h=>{ if(h.optional) return; if(!isDayActive(h,dt)) return; req++; if(isHabitDoneOn(h,k,dt)) done++; });
    }
    months.push({label:MONTH_SHORT[mn],rate:req>0?Math.round((done/req)*100):0});
  }

  const pad={l:36,r:16,t:20,b:28};
  const cW=W-pad.l-pad.r; const cH=H-pad.t-pad.b;

  ctx.strokeStyle=gridC; ctx.lineWidth=1;
  [0,20,40,60,80,100].forEach(v=>{
    const y=pad.t+cH-(v/100)*cH;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.fillStyle=textC; ctx.font='10px Instrument Sans,sans-serif'; ctx.textAlign='right';
    ctx.fillText(`${v}%`,pad.l-6,y+4);
  });

  const points=months.map((m,i)=>({x:pad.l+(i/(months.length-1||1))*cW,y:pad.t+cH-(m.rate/100)*cH,rate:m.rate,label:m.label}));

  const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
  grad.addColorStop(0,withAlpha(cssVar('--accent')||'#12131A',0.16)); grad.addColorStop(1,withAlpha(cssVar('--accent')||'#12131A',0));
  ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y);
  points.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
  ctx.lineTo(points[points.length-1].x,pad.t+cH); ctx.lineTo(points[0].x,pad.t+cH);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();

  ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y);
  points.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
  ctx.strokeStyle=accent; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();

  points.forEach(p=>{
    ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle=accent; ctx.fill();
    ctx.fillStyle=textC; ctx.font='10px Instrument Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.label,p.x,H-4);
  });
}

function drawMoodChart(canvasId) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth; const H=100; canvas.width=W; canvas.height=H;
  const isDark=DB.profile.darkMode===true;
  const textC=isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';

  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  const days=DAY_SHORT.map((lbl,i)=>({label:lbl,k:fmtDate(addDays(monday,i))}));
  const moods=days.map(d=>DB.moods[d.k]||null);

  const pad={l:16,r:16,t:16,b:24};
  const cW=W-pad.l-pad.r; const cH=H-pad.t-pad.b;
  const validPoints=[];
  days.forEach((d,i)=>{
    const m=moods[i]; if(m===null) return;
    const x=pad.l+(i/6)*cW; const y=pad.t+cH-((m-1)/4)*cH;
    validPoints.push({x,y,m,label:d.label});
  });

  if(validPoints.length>1){
    const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
    grad.addColorStop(0,withAlpha(cssVar('--accent')||'#12131A',0.16)); grad.addColorStop(1,withAlpha(cssVar('--accent')||'#12131A',0));
    ctx.beginPath(); ctx.moveTo(validPoints[0].x,validPoints[0].y);
    validPoints.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
    ctx.lineTo(validPoints[validPoints.length-1].x,pad.t+cH); ctx.lineTo(validPoints[0].x,pad.t+cH);
    ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(validPoints[0].x,validPoints[0].y);
    validPoints.forEach((p,i)=>i>0&&ctx.lineTo(p.x,p.y));
    ctx.strokeStyle=cssVar('--accent')||'#12131A'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke();
  }

  days.forEach((d,i)=>{
    const m=moods[i]; const x=pad.l+(i/6)*cW;
    ctx.fillStyle=textC; ctx.font='10px Instrument Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(d.label[0],x,H-4);
    if(m!==null){
      const y=pad.t+cH-((m-1)/4)*cH;
      ctx.font='14px serif'; ctx.fillText(MOOD_EMOJIS[m],x,y-6);
    }
  });
}

function renderMyHabits() {
  const container=document.getElementById('myHabitsContent'); if(!container) return;
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const t=today();
  container.innerHTML=`<div class="my-habits-list">
    ${HABITS.map(h=>{
      const streak=calcStreak(h).current;
      const done=isHabitDoneOn(h,t,todayDate);
      const live=h.type==='drink'||h.type==='counter';
      let meta=h.freq||'Tous les jours';
      if(live){ const p=habitProgress(h,t); meta=`${fmtNum(p.v)} / ${fmtNum(p.goal)} ${p.unit}`; }
      return `<div class="my-habit-row" data-habit-id="${h.id}" style="--ink:${h.color}">
        <div class="my-habit-emoji">${habitIconMarkup(h)}</div>
        <div class="my-habit-info">
          <div class="my-habit-name">${h.name}</div>
          <div class="my-habit-meta">${meta}</div>
          ${live?progressBar(Math.min(100,Math.round(dayProgress(h,t,todayDate)*100)),h.name).replace('class="pbar"','class="pbar pbar-thin"'):''}
        </div>
        <div class="my-habit-streak">${icon('flame')}${streak} j</div>
        <div class="habit-toggle-btn${done?' done':''}"${live?' aria-hidden="true"':` onclick="toggleHabit('${h.id}')"`}>
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function openAddHabit() { showToast('La gestion des habitudes arrive bientôt.',2500); }

function renderAchievements() {
  const container=document.getElementById('achievementsContent'); if(!container) return;
  const unlocked=DB.unlockedAchievements.length;
  const total=ACHIEVEMENTS.length;
  const pct=Math.round((unlocked/total)*100);

  const categories=[
    { label:'Séries et régularité', ids:['consistent','dedicated','camel','hydration','bookworm','digital','night_tmd','plant_pwr','phonefree','king','sugarfree','ice_king'] },
    { label:'Étapes et XP',       ids:['first_habit','centurion','xp_500','on_fire','transcend'] },
    { label:'Journées parfaites',          ids:['perfect_wk','perfectist','ironwill'] },
  ];

  const renderBadge=(a,i)=>{
    const isUnlocked=DB.unlockedAchievements.includes(a.id);
    return `<div class="achievement-badge ${isUnlocked?'unlocked':'locked'}" style="animation-delay:${i*.04}s">
      ${isUnlocked?'<div class="ach-unlocked-badge">✓</div>':''}
      <div class="ach-emoji">${a.emoji}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`;
  };

  const sectionsHtml=categories.map(cat=>{
    const badges=cat.ids.map((id,i)=>{
      const a=ACHIEVEMENTS.find(x=>x.id===id); if(!a) return '';
      return renderBadge(a,i);
    }).join('');
    return `<div class="ach-section">
      <div class="account-section-title">${cat.label}</div>
      <div class="achievements-grid">${badges}</div>
    </div>`;
  }).join('');

  const categorised=categories.flatMap(c=>c.ids);
  const otherBadges=ACHIEVEMENTS.filter(a=>!categorised.includes(a.id)).map(renderBadge).join('');
  const otherSection=otherBadges?`<div class="ach-section"><div class="account-section-title">Autres</div><div class="achievements-grid">${otherBadges}</div></div>`:'';

  container.innerHTML=`<div class="account-wrap">
    <div class="xp-card" style="margin-bottom:0">
      <div class="xp-card-row">
        <span class="xp-label">${icon('trophy')} Succès débloqués</span>
        <span class="xp-value">${unlocked} / ${total}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
    </div>
    ${sectionsHtml}
    ${otherSection}
  </div>`;
}

function renderAccount() {
  const container=document.getElementById('accountContent'); if(!container) return;
  const level=calcLevel(DB.xp); const prog=xpProgress(DB.xp);
  const name=DB.profile.name||'Mon profil';
  const soundOn=DB.profile.soundEnabled!==false;
  const zenOn=!!DB.profile.zenMode;
  const darkOn=DB.profile.darkMode===true;
  const notifsOn=!!DB.profile.notifsEnabled;

  const achCount=DB.unlockedAchievements.length;
  const achTotal=ACHIEVEMENTS.length;

  container.innerHTML=`<div class="account-wrap">
    <div class="account-profile-card">
      <div class="account-avatar">${icon('user')}</div>
      <div class="account-name">${name}</div>
      <div class="account-level-badge">Niv. ${level} — ${LEVEL_NAMES[level-1]||'Novice'}</div>
    </div>

    <div class="xp-card">
      <div class="xp-card-row">
        <span class="xp-label">Expérience</span>
        <span class="xp-value">${DB.xp} XP · ${prog.needed>0?`encore ${prog.needed}`:'niveau max'}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${prog.pct}%"></div></div>
    </div>

    <div>
      <div class="account-section-title">Préférences</div>
      <div class="pref-card">
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('edit')}</span><div><div class="pref-label-text">Nom d'affichage</div><div class="pref-hint">${name}</div></div></div>
          <button class="pref-edit" onclick="openProfile()">Modifier</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('moon')}</span><div><div class="pref-label-text">Mode sombre</div><div class="pref-hint">Changer de thème</div></div></div>
          <button class="pref-toggle ${darkOn?'on':'off'}" id="themeToggleAcc" onclick="toggleTheme()">${darkOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('volume')}</span><div><div class="pref-label-text">Effets sonores</div><div class="pref-hint">Retour sonore à chaque action</div></div></div>
          <button class="pref-toggle ${soundOn?'on':'off'}" onclick="togglePref('sound')">${soundOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('zen')}</span><div><div class="pref-label-text">Mode zen</div><div class="pref-hint">Les habitudes terminées se replient</div></div></div>
          <button class="pref-toggle ${zenOn?'on':'off'}" onclick="togglePref('zen')">${zenOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('bell')}</span><div><div class="pref-label-text">Notifications</div><div class="pref-hint">Rappels quotidiens</div></div></div>
          <button class="pref-toggle ${notifsOn?'on':'off'}" onclick="toggleNotifications()">${notifsOn?'Activé':'Désactivé'}</button>
        </div>
      </div>
    </div>

    <div class="danger-zone-card">
      <div class="account-section-title" style="color:var(--danger);margin-bottom:8px">${icon('alert')} Zone de danger</div>
      <div class="pref-hint" style="margin-bottom:12px">Efface définitivement toutes les données. Action irréversible.</div>
      <button class="modal-reset-btn" onclick="confirmReset()">${icon('trash')} Réinitialiser toutes les données</button>
    </div>
  </div>`;
}

function openProfile() {
  document.getElementById('pseudoInput').value=DB.profile.name||'';
  const dark=DB.profile.darkMode===true;
  const sound=DB.profile.soundEnabled!==false;
  const zen=!!DB.profile.zenMode;
  const notifs=!!DB.profile.notifsEnabled;
  updateToggleBtn('themeToggle',dark);
  updateToggleBtn('soundToggle',sound);
  updateToggleBtn('zenToggle',zen);
  updateToggleBtn('notifsToggle',notifs);
  document.getElementById('profileModal').classList.add('open');
  setTimeout(()=>document.getElementById('pseudoInput').focus(),80);
}
function closeProfile() { document.getElementById('profileModal').classList.remove('open'); }
function updateToggleBtn(id,on) {
  const btn=document.getElementById(id); if(!btn) return;
  btn.textContent=on?'Activé':'Désactivé'; btn.className=`pref-toggle ${on?'on':'off'}`;
}
function saveProfileName() {
  DB.profile.name=document.getElementById('pseudoInput').value.trim();
  saveData(); closeProfile();
  if(activePage==='account') renderAccount();
}
function togglePref(pref) {
  if(pref==='sound')    { DB.profile.soundEnabled=DB.profile.soundEnabled===false; }
  if(pref==='zen')      { DB.profile.zenMode=!DB.profile.zenMode; if(!DB.profile.zenMode) document.querySelectorAll('.habit-card.zen-collapse').forEach(el=>el.classList.remove('zen-collapse')); }
  saveData();
  openProfile();
  closeProfile();
  if(activePage==='account') renderAccount();
}

const NOTIF_SCHEDULE = [
  {id:'work',   title:'💼 Mode travail — 08:30',body:"Mode concentration activé.",hour:8,minute:30,days:[1,2,3,4,5]},
  {id:'running',title:'🏃 Heure de courir — 17:30',body:"Enfile tes baskets!",hour:17,minute:30,days:[1,2,3,4,5]},
  {id:'sleep',  title:'💤 Extinction des feux — 21:00',body:"Ton lit te réclame.",hour:21,minute:0,days:[1,2,3,4,5]},
  {id:'phone',  title:'📵 Téléphone posé — 21:00',body:"Branche ton téléphone loin.",hour:21,minute:0,days:[0,1,2,3,4,5,6]},
];
let _notifTimers=[];

function initNotifications() {
  const on=!!DB.profile.notifsEnabled;
  ['notifsToggle'].forEach(id=>{ const btn=document.getElementById(id); if(btn){btn.textContent=on?'Activé':'Désactivé';btn.className=`pref-toggle ${on?'on':'off'}`;} });
  if(on&&'Notification' in window&&Notification.permission==='granted') scheduleLocalNotifications();
}

async function toggleNotifications() {
  if(!('Notification' in window)){ alert('Les notifications ne sont pas prises en charge sur cet appareil.'); return; }
  if(DB.profile.notifsEnabled){
    DB.profile.notifsEnabled=false; _notifTimers.forEach(id=>clearTimeout(id)); _notifTimers=[]; saveData();
    showToast('Notifications désactivées',2500,'bellOff');
    if(activePage==='account') renderAccount(); return;
  }
  let perm=Notification.permission;
  if(perm==='default') perm=await Notification.requestPermission();
  if(perm==='granted'){
    DB.profile.notifsEnabled=true; saveData(); scheduleLocalNotifications();
    showToast(`${NOTIF_SCHEDULE.length} rappels programmés`,3000,'bell');
  } else { showToast('Notifications bloquées : vérifie les réglages du navigateur',3500,'alert'); }
  if(activePage==='account') renderAccount();
}

function scheduleLocalNotifications() {
  _notifTimers.forEach(id=>clearTimeout(id)); _notifTimers=[];
  if(!DB.profile.notifsEnabled||!('Notification' in window)||Notification.permission!=='granted') return;
  NOTIF_SCHEDULE.forEach(n=>{
    const now=new Date(); const target=new Date(); target.setHours(n.hour,n.minute,0,0);
    if(target<=now) target.setDate(target.getDate()+1);
    const ms=target-now;
    if(ms>0&&ms<25*3600*1000) _notifTimers.push(setTimeout(()=>{ try{new Notification(n.title,{body:n.body,icon:'./assets/icon-192.png'});}catch(e){} },ms));
  });
}

function confirmReset() {
  if(confirm('Cette action supprime définitivement TOUTES tes données et ne peut pas être annulée.\n\nVeux-tu vraiment tout effacer ?')){
    localStorage.removeItem('ht-v2.6'); location.reload();
  }
}

const BREATHING_PATTERNS = {
  box:  { name:'Respiration carrée', phases:['Inhale','Hold','Exhale','Hold out'], durations:[4,4,4,4], desc:"Quatre temps égaux pour apaiser le stress et retrouver de la concentration." },
  '478':{ name:'4-7-8',              phases:['Inhale','Hold','Exhale'],            durations:[4,7,8],   desc:"Une longue expiration pour ralentir le rythme et favoriser l'endormissement." },
  calm: { name:'Calme',              phases:['Inhale','Hold','Exhale'],            durations:[5,2,5],   desc:"Un rythme lent et régulier pour se détendre à tout moment." },
};

let breath = {
  active: false,
  pattern: 'box',
  phaseIdx: 0,
  secondsLeft: 0,
  rounds: 0,
  timer: null,
};

const BREATH_SHORT = { 'Inhale':'Inspire', 'Hold':'Retiens', 'Hold out':'Retiens', 'Exhale':'Expire' };
const BREATH_LABEL = { 'Inhale':'Inspirez', 'Hold':'Retenez', 'Hold out':'Retenez', 'Exhale':'Expirez' };
let breathTick = 0;

function openBreathing() {
  document.getElementById('breathingOverlay').classList.add('open');
  resetBreathDisplay();
}
function closeBreathing() {
  stopBreathing();
  document.getElementById('breathingOverlay').classList.remove('open');
}

function renderBreathSteps() {
  const pat = BREATHING_PATTERNS[breath.pattern];
  document.getElementById('breathSteps').innerHTML = pat.phases.map((ph, i) =>
    `<div class="breath-step" data-i="${i}"><span class="bs-name">${BREATH_SHORT[ph]}</span><span class="bs-sec">${pat.durations[i]} s</span></div>`
  ).join('');
}
function markBreathStep(i) {
  document.querySelectorAll('.breath-step').forEach(el => el.classList.toggle('active', Number(el.dataset.i) === i));
}
function updateBreathRounds() {
  document.getElementById('breathRoundsCount').textContent = breath.rounds;
  document.getElementById('breathRoundsLabel').textContent = breath.rounds > 1 ? ' cycles terminés' : ' cycle terminé';
}
function setBreathStage(cls, dur) {
  const st = document.getElementById('breathStage');
  st.className = 'breath-stage' + (cls ? ' ' + cls : '');
  st.dataset.tick = String(breathTick % 2);
  if (dur) st.style.setProperty('--dur', dur + 's');
}
function setStartBtn(running) {
  const btn = document.getElementById('breathStartBtn');
  btn.innerHTML = running ? `${icon('stop')} Arrêter` : `${icon('play')} Commencer`;
  btn.classList.toggle('active', running);
}

function selectBreathPattern(p) {
  breath.pattern = p;
  document.querySelectorAll('.breath-pattern-btn').forEach(b => {
    const on = b.dataset.pattern === p;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  if (breath.active) stopBreathing();
  resetBreathDisplay();
}

function resetBreathDisplay() {
  const pat = BREATHING_PATTERNS[breath.pattern];
  breath.rounds = 0; breath.phaseIdx = 0;
  updateBreathRounds();
  document.getElementById('breathPhaseLabel').textContent = 'Prêt';
  document.getElementById('breathCountdown').textContent = pat.durations[0];
  document.getElementById('breathPatternDesc').textContent = pat.desc;
  renderBreathSteps();
  setBreathStage('');
  setStartBtn(false);
}

function toggleBreathing() {
  if (breath.active) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  breath.active = true;
  breath.phaseIdx = 0;
  breath.rounds = 0;
  updateBreathRounds();
  setStartBtn(true);
  runBreathPhase();
}

function stopBreathing() {
  breath.active = false;
  clearTimeout(breath.timer);
  setStartBtn(false);
  document.getElementById('breathPhaseLabel').textContent = 'Terminé';
  markBreathStep(-1);
  setBreathStage('');
}

function runBreathPhase() {
  if (!breath.active) return;
  const pat = BREATHING_PATTERNS[breath.pattern];
  const phase = pat.phases[breath.phaseIdx];
  const dur = pat.durations[breath.phaseIdx];
  breath.secondsLeft = dur;
  breathTick++;

  document.getElementById('breathPhaseLabel').textContent = BREATH_LABEL[phase] || phase;
  const cssPhase = phase==='Inhale' ? 'phase-inhale' : phase==='Exhale' ? 'phase-exhale' : phase==='Hold' ? 'phase-hold' : 'phase-hold-out';
  setBreathStage('running ' + cssPhase, dur);
  markBreathStep(breath.phaseIdx);

  const cd = document.getElementById('breathCountdown');
  cd.textContent = dur;
  let elapsed = 0;
  const tick = () => {
    if (!breath.active) return;
    elapsed++;
    const remaining = dur - elapsed;
    cd.textContent = remaining > 0 ? remaining : 0;
    if (elapsed < dur) {
      breath.timer = setTimeout(tick, 1000);
    } else {
      breath.phaseIdx = (breath.phaseIdx + 1) % pat.phases.length;
      if (breath.phaseIdx === 0) { breath.rounds++; updateBreathRounds(); }
      breath.timer = setTimeout(runBreathPhase, 100);
    }
  };
  breath.timer = setTimeout(tick, 1000);
}

function openMeditation() {
  document.getElementById('meditationOverlay').classList.add('open');
}
function closeMeditation() {
  document.getElementById('meditationOverlay').classList.remove('open');
}

function openSleepEntry() {
  const t = today();
  const existing = (DB.sleepLog || {})[t] || {};
  const modal = document.getElementById('sleepEntryModal');

  document.getElementById('sleepHours').value = existing.hours !== undefined ? existing.hours : '';
  document.getElementById('sleepMinutes').value = existing.minutes !== undefined ? String(existing.minutes).padStart(2,'0') : '';
  document.getElementById('sleepBedtime').value = existing.bedtime || '';
  document.getElementById('sleepWakeTime').value = existing.wakeTime || '';
  document.getElementById('sleepDate').value = t;

  modal.classList.add('open');
}

function closeSleepEntry() {
  document.getElementById('sleepEntryModal').classList.remove('open');
}

function saveSleepEntry() {
  const hours = parseInt(document.getElementById('sleepHours').value);
  const minutes = parseInt(document.getElementById('sleepMinutes').value) || 0;
  const bedtime = document.getElementById('sleepBedtime').value;
  const wakeTime = document.getElementById('sleepWakeTime').value;
  const date = document.getElementById('sleepDate').value || today();

  if(isNaN(hours) || hours < 0 || hours > 23) {
    showToast('Saisis un nombre d\'heures valide (0 à 23)',3200,'alert');
    return;
  }

  if(!DB.sleepLog) DB.sleepLog = {};
  DB.sleepLog[date] = { hours, minutes, bedtime, wakeTime };

  if(DB.habits['sleep']) DB.habits['sleep'].logs[date] = 'done';

  saveData();
  closeSleepEntry();
  showToast(`Sommeil enregistré : ${hours} h ${minutes} min`,3200,'moon');
  renderSleepSummary();
  if(activePage === 'home') renderActivePage();
}

function renderSleepSummary() {
  const el = document.getElementById('sleepSummaryDisplay');
  if(!el) return;
  const t = today();
  const log = (DB.sleepLog || {})[t];

  if(!log) {
    el.innerHTML = `<p class="sleep-empty">Pas encore de nuit saisie aujourd'hui.</p>`;
    return;
  }

  const { hours, minutes, bedtime, wakeTime } = log;
  let html = `<div>
    <span class="sleep-big-value">${hours}</span><span class="sleep-big-unit">h</span>
    <span class="sleep-big-value" style="margin-left:4px">${String(minutes).padStart(2,'0')}</span><span class="sleep-big-unit">min</span>
  </div>`;

  if(bedtime || wakeTime) {
    html += `<div class="sleep-meta-row">`;
    if(bedtime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Coucher</span><span class="sleep-meta-value">${bedtime}</span></div>`;
    if(wakeTime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Réveil</span><span class="sleep-meta-value">${wakeTime}</span></div>`;
    html += `</div>`;
  }
  el.innerHTML = html;
}

function init() {
  checkDailyPenalties();
  if(!DB.sleepLog) { DB.sleepLog = {}; saveData(); }
  showPage('home');
  checkDailyMood();
  initNotifications();
  renderSleepSummary();
}


document.addEventListener('DOMContentLoaded', init);