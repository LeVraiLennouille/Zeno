/* HabitsTracker · Constantes, utilitaires, icônes et données (chargement / sauvegarde du localStorage)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

const DEFAULT_HABITS = [
  {id:'sleep',    name:'Sommeil',           emoji:'💤', type:'good',    color:'#8EA2FF', freq:'Lundi - Vendredi',    weekdayOnly:true},
  {id:'projets',  name:'Projets perso',     emoji:'🚀', type:'good',    color:'#C79BFF', freq:'Tous les jours',      weekdayOnly:false},
  {id:'work',     name:'Travail',           emoji:'💼', type:'good',    color:'#FFD23F', freq:'Lundi - Vendredi',    weekdayOnly:true},
  {id:'gym',      name:'Gym',               emoji:'🏋️', type:'good',    color:'#52E0A1', freq:'Lundi - Vendredi',    weekdayOnly:true},
  {id:'running',  name:'Running',           emoji:'🏃', type:'counter', color:'#FF8A4C', freq:'5 jours par semaine', weekdayOnly:false, step:1, goal:5, max:15, unit:'km'},
  {id:'setp',     name:'Pas',               emoji:'👣', type:'counter', color:'#2EC4B6', freq:'Tous les jours',      weekdayOnly:false, step:1000, goal:10000, max:20000, unit:'pas'},
  {id:'drink',    name:"Boire de l'eau",    emoji:'💧', type:'drink',   color:'#52C7F2', freq:'Tous les jours',      weekdayOnly:false, step:250, goal:2000, max:5000, unit:'ml'},
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
  if (!p) return esc(habit.emoji || '⭐');
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

const ICONS = {"play":"<polygon points=\"7 4 20 12 7 20 7 4\"/>","stop":"<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/>","flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>", "trophy": "<circle cx=\"12\" cy=\"8\" r=\"7\"/><polyline points=\"8.21 13.89 7 23 12 20 17 23 15.79 13.88\"/>", "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/>", "alert": "<path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>", "bell": "<path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/>", "bellOff": "<path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/><path d=\"M18.63 13A17.89 17.89 0 0 1 18 8\"/><path d=\"M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14\"/><path d=\"M18 8a6 6 0 0 0-9.33-5\"/><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"/>", "moon": "<path d=\"M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z\"/>", "sun": "<circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42\"/>", "volume": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"/><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07\"/>", "zen": "<circle cx=\"12\" cy=\"6\" r=\"2.5\"/><path d=\"M12 9.5v4\"/><path d=\"M4 19c2.2-.6 4.5-2 8-2s5.8 1.4 8 2\"/><path d=\"M8 13.5c1 .6 2.4 1 4 1s3-.4 4-1\"/>", "edit": "<path d=\"M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z\"/>", "trash": "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/><path d=\"M10 11v6M14 11v6\"/><path d=\"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\"/>", "user": "<path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>"};
function icon(name) {
  const p = ICONS[name] || HABIT_ICONS[name];
  return p ? `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : '';
}
const fmtNum = n => Number(n).toLocaleString('fr-FR');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function progressBar(pct, label) {
  return `<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(label)}"><div class="pbar-fill" style="width:${pct}%"></div></div>`;
}
function drinkCfg() {
  const h = HABITS.find(x => x.type === 'drink' && !x.archived) || HABITS.find(x => x.type === 'drink');
  return { goal: (h && h.goal) || DRINK_GOAL, step: (h && h.step) || DRINK_STEP, max: (h && h.max) || DRINK_MAX };
}
function habitProgress(h, k) {
  if (h.type === 'drink') { const c = drinkCfg(); return { v: getDrinkMl(k), goal: c.goal, max: c.max, step: c.step, unit: 'ml' }; }
  return { v: getCounterVal(h.id, k), goal: h.goal, max: h.max, step: h.step, unit: esc(h.unit || '') };
}
function dayProgress(h, k, d) {
  if (h.type === 'drink' || h.type === 'counter') { const p = habitProgress(h, k); return Math.min(1, p.v / p.goal); }
  return getHabitDayValue(h, k, d);
}

const LEVEL_THRESHOLDS = [0,100,250,500,800,1200,1700,2400,3200,4200];
const LEVEL_NAMES = ['Novice','Apprenti','Pratiquant','Fervent','Discipliné','Concentré','Maître','Grand maître','Légende','Transcendant'];

const MOOD_LABELS  = ['','Mal','Bof','Neutre','Bien','Super'];
const MOOD_EMOJIS  = ['','😡','😢','😐','😊','😎'];

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
// « Maintenant » vu par l'app : décalé de l'heure de début de journée (0–6 h, réglable).
// Variable dédiée (et non DB) : today() sert déjà dans loadData(), avant que DB n'existe.
let _dayStartHour = 0;
function setDayStartHour(h) { _dayStartHour = Math.max(0, Math.min(6, Math.floor(Number(h)) || 0)); }
const appNow    = () => new Date(Date.now() - _dayStartHour * 3600000);
const today     = () => fmtDate(appNow());
const isWeekend = d => { const dow=d.getDay(); return dow===0||dow===6; };
const isDayActive = (habit, dateObj) => {
  if (habit.since && fmtDate(dateObj) < habit.since) return false;
  if (isPaused(fmtDate(dateObj))) return false;
  if (habit.gaps && habitGapAt(habit, fmtDate(dateObj))) return false;
  if (habit.activeDays) return habit.activeDays.includes(dateObj.getDay());
  if (habit.weekdayOnly) return !isWeekend(dateObj);
  return true;
};

function getDrinkMl(k) { const e=DB.habits['drink']; if(!e) return 0; const v=e.logs[k]; return typeof v==='number'?v:v==='done'?drinkCfg().goal:0; }
function isDrinkDone(k) { return getDrinkMl(k)>=drinkCfg().goal; }
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

const STORE_KEY = 'ht-v2.6', BAK_KEY = 'ht-v2.6.bak';
function loadData() {
  try { const raw=localStorage.getItem(STORE_KEY); if(raw) return JSON.parse(raw); } catch(e){}
  const d={createdAt:today(),habits:{},profile:{name:''},xp:0,moods:{},unlockedAchievements:[],perfectDaysClaimed:[],penaltiesApplied:[]};
  DEFAULT_HABITS.forEach(h=>d.habits[h.id]={logs:{}});
  return d;
}
function saveData() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
  catch (e) {
    if (!saveData._warned) {
      saveData._warned = true;
      try { showToast('Stockage plein : impossible d’enregistrer. Exporte tes données.', 6000, 'alert'); } catch (_) {}
    }
  }
}

let DB = loadData();
const DEFAULT_REMINDERS = [
  {id:'r_work',    title:'💼 Mode travail',        body:'Mode concentration activé.',  hour:8,  minute:30, days:[1,2,3,4,5],     habitId:'work',    enabled:true},
  {id:'r_running', title:'🏃 Heure de courir',     body:'Enfile tes baskets !',        hour:17, minute:30, days:[1,2,3,4,5],     habitId:'running', enabled:true},
  {id:'r_sleep',   title:'💤 Extinction des feux', body:'Ton lit te réclame.',         hour:21, minute:0,  days:[1,2,3,4,5],     habitId:'',        enabled:true},
  {id:'r_phone',   title:'📵 Téléphone posé',      body:'Branche ton téléphone loin.', hour:21, minute:0,  days:[0,1,2,3,4,5,6], habitId:'',        enabled:true},
];
// Les habitudes vivent désormais dans DB (migration : on part des habitudes par défaut).
if(!Array.isArray(DB.habitDefs)) DB.habitDefs=JSON.parse(JSON.stringify(DEFAULT_HABITS));
let HABITS = DB.habitDefs;
HABITS.forEach(h=>{ if(!DB.habits[h.id]) DB.habits[h.id]={logs:{}}; });
if(!Array.isArray(DB.reminders)) DB.reminders=JSON.parse(JSON.stringify(DEFAULT_REMINDERS));
if(!DB.createdAt) DB.createdAt=today();
if(!DB.profile) DB.profile={name:''};
if(DB.profile.soundEnabled===undefined) DB.profile.soundEnabled=true;
if(!DB.xp) DB.xp=0;
if(!DB.unlockedAchievements) DB.unlockedAchievements=[];
if(!DB.moods) DB.moods={};
if(!DB.perfectDaysClaimed) DB.perfectDaysClaimed=[];
if(!DB.penaltiesApplied) DB.penaltiesApplied=[];
if(DB.profile.notifsEnabled===undefined) DB.profile.notifsEnabled=false;
if(DB.profile.dayStartHour===undefined) DB.profile.dayStartHour=0;
if(DB.profile.weeklyReview===undefined) DB.profile.weeklyReview=true;
if(!DB.xpWeek) DB.xpWeek={};
setDayStartHour(DB.profile.dayStartHour);
if(DB.profile.themeMode===undefined) DB.profile.themeMode = DB.profile.darkMode===undefined ? 'system' : (DB.profile.darkMode===true ? 'dark' : 'light');
if(DB.profile.darkMode===undefined) DB.profile.darkMode=false;
if(!DB.pauses) DB.pauses={};
if(!DB.meditation) DB.meditation={};
if(!DB.journal) DB.journal={};
if(!DB.challenges) DB.challenges=[];
if(!DB.seasonXp) DB.seasonXp={};
if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};