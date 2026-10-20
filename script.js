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
  const h = HABITS.find(x => x.type === 'drink');
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
  if (habit.since && fmtDate(dateObj) < habit.since) return false;
  if (isPaused(fmtDate(dateObj))) return false;
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

function loadData() {
  try { const raw=localStorage.getItem('ht-v2.6'); if(raw) return JSON.parse(raw); } catch(e){}
  const d={createdAt:today(),habits:{},profile:{name:''},xp:0,moods:{},unlockedAchievements:[],perfectDaysClaimed:[],penaltiesApplied:[]};
  DEFAULT_HABITS.forEach(h=>d.habits[h.id]={logs:{}});
  return d;
}
function saveData() { localStorage.setItem('ht-v2.6',JSON.stringify(DB)); }

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
if(DB.profile.themeMode===undefined) DB.profile.themeMode = DB.profile.darkMode===undefined ? 'system' : (DB.profile.darkMode===true ? 'dark' : 'light');
if(DB.profile.darkMode===undefined) DB.profile.darkMode=false;
if(!DB.pauses) DB.pauses={};
if(!DB.meditation) DB.meditation={};
if(!DB.journal) DB.journal={};
if(!DB.challenges) DB.challenges=[];
if(!DB.seasonXp) DB.seasonXp={};
if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};

/* ═══════════ Thème : clair / sombre / automatique ═══════════ */
const _mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const THEME_MODES = [['light','Clair'],['system','Auto'],['dark','Sombre']];

function isDarkNow() {
  const m = DB.profile.themeMode;
  if (m === 'dark') return true;
  if (m === 'light') return false;
  return !!(_mqDark && _mqDark.matches);
}
function themeSegHtml() {
  const m = DB.profile.themeMode || 'light';
  return THEME_MODES.map(([k, l]) =>
    `<button type="button" class="theme-seg-btn${m === k ? ' active' : ''}" aria-pressed="${m === k}" onclick="setThemeMode('${k}')">${l}</button>`).join('');
}
function renderThemeSegs() {
  document.querySelectorAll('.theme-seg').forEach(el => { el.innerHTML = themeSegHtml(); });
}
function initTheme() {
  const dark = isDarkNow();
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0E0F13' : '#EDEEF0');
  renderThemeSegs();
}
function setThemeMode(m) {
  DB.profile.themeMode = m;
  DB.profile.darkMode = (m === 'dark');
  saveData(); initTheme();
  if (activePage === 'report') renderActivePage();
}
function toggleTheme() { setThemeMode(isDarkNow() ? 'light' : 'dark'); }
if (_mqDark) {
  const onSystemTheme = () => {
    if (DB.profile.themeMode !== 'system') return;
    initTheme();
    if (activePage === 'report') renderActivePage();
  };
  if (_mqDark.addEventListener) _mqDark.addEventListener('change', onSystemTheme);
  else if (_mqDark.addListener) _mqDark.addListener(onSystemTheme);
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
  const prev=calcLevel(DB.xp); DB.xp=(DB.xp||0)+amount; addSeasonXp(amount);
  const nw=calcLevel(DB.xp); saveData();
  if(nw>prev){ const name=LEVEL_NAMES[nw-1]||`Niveau ${nw}`; setTimeout(()=>{ playSound('levelup'); showToast(`Niveau ${nw} atteint : ${name}`,4000,'star'); },300); }
}
function loseXP(amount) { DB.xp=Math.max(0,(DB.xp||0)-amount); saveData(); }

function calcWeeklyStreak(habit) {
  const cwm=getWeekMonday(new Date()); const cur=isWeeklyDoneForWeek(habit.id,cwm);
  const start=cur?0:1; let streak=0;
  for(let o=start;o<104;o++){ const wm=fmtDate(addDays(parseDate(cwm),-o*7)); if(wm<DB.createdAt) break; if(!isWeeklyDoneForWeek(habit.id,wm)){ if(weekPausedCount(wm)>=3) continue; break; } streak++; }
  return streak;
}
function calcStreak(habit) {
  if(habit.type==='weekly') { const s=calcWeeklyStreak(habit); return {current:s,longest:s}; }
  const logs=DB.habits[habit.id].logs; const todayKey=today(); const createdAt=DB.createdAt;
  if(habit.type==='bad') {
    let streak=0; let d=new Date();
    for(let i=0;i<730;i++){ const k=fmtDate(d); if(k<createdAt) break; if(!isDayActive(habit,d)){d=addDays(d,-1);continue;} if(isBadFail(habit.id,k)) break; if(k<=todayKey) streak++; d=addDays(d,-1); }
    let best=0,run=0; let dd=new Date(parseDate(createdAt));
    while(fmtDate(dd)<=todayKey){ const k=fmtDate(dd); if(isDayActive(habit,dd)){ if(isBadFail(habit.id,k)) run=0; else { run++; best=Math.max(best,run); } } dd=addDays(dd,1); }
    return {current:streak,longest:Math.max(streak,best)};
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
  { id:'calm_mind',   emoji:'🧘', name:"Esprit calme",       desc:"Médite pendant au moins 5 minutes",            check:()=>Object.values(DB.meditation||{}).some(m=>m>=5) },
  { id:'mindful_wk',  emoji:'🪷', name:"Pleine conscience",  desc:"Médite pendant 7 jours différents",            check:()=>Object.values(DB.meditation||{}).filter(m=>m>=1).length>=7 },
  { id:'chal_first',  emoji:'🎯', name:"Défi relevé",         desc:"Remporte ton premier défi",                    check:()=>wonChallenges().length>=1 },
  { id:'chal_five',   emoji:'🏹', name:"Chasseur de défis",   desc:"Remporte 5 défis",                             check:()=>wonChallenges().length>=5 },
  { id:'chal_30',     emoji:'🏔️', name:"Trente jours",        desc:"Remporte un défi de 30 jours ou plus",         check:()=>wonChallenges().some(c=>c.days>=30) },
  { id:'season_5',    emoji:'🌟', name:"Rang V",              desc:"Atteins le rang V dans une saison",            check:()=>Object.values(DB.seasonXp||{}).some(x=>seasonRank(x).rank>=5) },
  { id:'season_max',  emoji:'🏆', name:"Sommet de saison",    desc:"Atteins le rang maximal d'une saison",         check:()=>Object.values(DB.seasonXp||{}).some(x=>seasonRank(x).rank>=SEASON_RANKS.length) },
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
  if(!DB.habits['gym']) return false;
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
  if(requiredToday()>0&&countDoneToday()===requiredToday()){ DB.perfectDaysClaimed.push(t); giveXP(50); setTimeout(()=>showToast('Journée parfaite ! +50 XP',3500,'star'),600); saveData(); }
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
    if(DB.habits[id].logs[t]==='fail'){delete DB.habits[id].logs[t];clearBadVal(id,t);playSound('undo');}
    else{DB.habits[id].logs[t]='fail';playSound('fail');}
  } else {
    const completing=DB.habits[id].logs[t]!=='done';
    if(completing){DB.habits[id].logs[t]='done';giveXP(10);playSound('done');}
    else{delete DB.habits[id].logs[t];playSound('undo');}
  }
  saveData(); checkAchievements(); afterToggle(id);
}
function checkPerfectNow() {
  const req=requiredToday();
  if(req>0&&countDoneToday()===req){ launchConfetti(); playSound('fanfare'); checkPerfectDayBonus(); }
}
function afterToggle(id) {
  checkPerfectNow();
  renderActivePage();
  const el=document.querySelector(`[data-habit-id="${id}"]`);
  if(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function addDrink() { addDrinkAmount(drinkCfg().step); }
function addDrinkAmount(ml) {
  const c=drinkCfg(); const t=today(); const cur=getDrinkMl(t);
  if(cur>=c.max) return;
  const next=Math.min(c.max, cur+ml);
  DB.habits['drink'].logs[t]=next;
  const crossed=next>=c.goal&&cur<c.goal;
  if(crossed){playSound('drink');showToast("Objectif d'hydratation atteint ! +10 XP",3200,'drink');giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
  if(crossed) checkPerfectNow();
}
function removeDrink() {
  const t=today(); const cur=getDrinkMl(t); if(cur<=0) return;
  const next=Math.max(0,cur-drinkCfg().step);
  if(next===0){delete DB.habits['drink'].logs[t];playSound('undo');}
  else{DB.habits['drink'].logs[t]=next; playSound('undo');}
  saveData(); renderActivePage();
}
function addCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur>=habit.max) return;
  const next=Math.min(habit.max,Math.round((cur+habit.step)*100)/100);
  DB.habits[id].logs[t]=next;
  const crossed=next>=habit.goal&&cur<habit.goal;
  if(crossed){playSound('done');showToast(`${habit.name} : objectif atteint ! +10 XP`,3200,habit.id);giveXP(10);}
  saveData(); checkAchievements(); renderActivePage();
  if(crossed) checkPerfectNow();
}
function removeCounter(id) {
  const habit=HABITS.find(h=>h.id===id); const t=today(); const cur=getCounterVal(id,t);
  if(cur<=0) return;
  const next=Math.max(0,Math.round((cur-habit.step)*100)/100);
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
  updateChallenges();
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
  renderPauseBanner();
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
  const strip=active.map(h=>{ const f=dayProgress(h,t,todayDate); return `<span class="ink-seg${f>=1?' done':''}" style="--ink:${h.color};--fill:${Math.round(f*100)}%" title="${esc(h.name)}"></span>`; }).join('');
  el.innerHTML=`
    <div class="hero-date">${date}</div>
    <div class="hero-score">
      <div class="hero-count${perfect?' perfect':''}" role="img" aria-label="${done.length} habitudes sur ${active.length}">${done.length}<small>/${active.length}</small></div>
      <div class="hero-side">
        <div class="hero-caption">${isPaused(t)?'Jour de pause · séries gelées':(perfect?'Journée parfaite':'habitudes faites')}</div>
        <div class="hero-level">Niv. ${level} · ${LEVEL_NAMES[level-1]||'Novice'}</div>
      </div>
    </div>
    <div class="ink-strip" aria-hidden="true">${strip}</div>`;
}

function renderTodayTab() {
  const container=document.getElementById('todayHabits'); if(!container) return;
  const t=today(); const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  container.innerHTML='';
  if(!HABITS.some(h=>isDayActive(h,todayDate))) container.innerHTML=isPaused(t)?pausedDayNote():todayEmptyNote();
  HABITS.forEach(habit=>{
    if(!isDayActive(habit,todayDate)) return;
    const card=document.createElement('div');
    const isSimple=['good','weekly'].includes(habit.type)||(habit.type==='bad'&&!habit.levels);
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
            <div class="today-card-name">${esc(habit.name)}</div>
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

function todayEmptyNote() {
  return `<div class="empty-note">Aucune habitude prévue aujourd'hui.<br>Appuie sur + pour en créer une.</div>`;
}
function buildTodaySubLabel(habit,t,todayDate) {
  const streak=calcStreak(habit).current;
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    const bv=fail?badVal(habit.id,t):'';
    return `${fail?('Craqué'+(bv?' · '+esc(bv):'')):'Tenu bon'} · ${icon('flame')} ${streak} j`;
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
      ? `<button class="step-btn" onclick="addDrinkAmount(${p.step})">+${fmtNum(p.step)} ml</button><button class="step-btn" onclick="addDrinkAmount(${p.step*2})">+${fmtNum(p.step*2)} ml</button>`
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
  if(habit.type==='bad'&&habit.levels) return buildBadLevels(habit,t);
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
        <div class="week-day-dot${done?' done':''}${!active?' inactive':''}${isPaused(k)?' paused':''}" 
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
            <div class="habit-card-name">${esc(habit.name)}</div>
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
    if(DB.habits[id].logs[dateKey]==='fail'){ delete DB.habits[id].logs[dateKey]; clearBadVal(id,dateKey); }
    else DB.habits[id].logs[dateKey]='fail';
  } else if(habit.type==='counter'||habit.type==='drink') {
    const goal=habit.type==='drink'?drinkCfg().goal:habit.goal;
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
        let tip=k;
        if(!active||isFuture) { cls+=' inactive'+(isPaused(k)?' paused':''); if(isPaused(k)) tip+=' · pause'; }
        else if(habit.type==='bad'&&isBadFail(habit.id,k)) { cls+=' failed'; const bv=badVal(habit.id,k); tip+=' · craqué'+(bv?` (${bv})`:''); }
        else if(isHabitDoneOn(habit,k,dateObj)) { cls+=' done'; style=`background:${habit.color}`; }
        else if(k>=DB.createdAt) { cls+=' missed'; style=`background:${habit.color}20;border:1.5px solid ${habit.color}40`; }
        gridHtml+=`<div class="${cls}" style="${style}" title="${esc(tip)}"></div>`;
      }
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(habit)}</div>
          <div>
            <div class="habit-card-name">${esc(habit.name)}</div>
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

function openMoodModal(dateKey, toNotes) {
  currentMoodDate=dateKey; selectedMoodValue=null; selectedFeelings=[];
  const existing=DB.moods[dateKey];
  document.getElementById('moodStep1').classList.remove('hidden');
  document.getElementById('moodStep2').classList.add('hidden');
  document.querySelectorAll('.mood-emoji-card').forEach(b=>b.classList.remove('selected'));
  const btn=document.getElementById('moodConfirmBtn'); btn.disabled=true; btn.textContent='Je me sens…';
  const ttl=document.querySelector('#moodStep1 .mood-sheet-title');
  if(ttl){ const d=parseDate(dateKey); ttl.textContent = dateKey===today() ? 'Comment te sens-tu ?' : `Comment te sentais-tu le ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()} ?`; }
  if(existing!==undefined) selectMoodCard(existing);
  document.getElementById('moodModal').classList.add('open');
  if(existing!==undefined && toNotes) goToMoodStep2();
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
  const k=currentMoodDate;
  const feelings=FEELINGS_BY_MOOD[selectedMoodValue]||[];
  const prev=(DB.moods[k]===selectedMoodValue && DB.profile.moodFeelings && DB.profile.moodFeelings[k]) ? DB.profile.moodFeelings[k].split(',') : [];
  selectedFeelings=prev.filter(f=>feelings.includes(f));
  const title=document.getElementById('moodStep2Title');
  title.textContent=`${MOOD_LABELS[selectedMoodValue]} ! Comment décris-tu ton ressenti ?`;
  const grid=document.getElementById('feelingsGrid');
  grid.innerHTML=feelings.map(f=>`<button class="feeling-tag${selectedFeelings.includes(f)?' selected':''}" onclick="selectFeeling('${f}',this)">${f}</button>`).join('');
  const ta=document.getElementById('journalInput'); ta.value=(DB.journal&&DB.journal[k])||''; updateJournalCount();
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
  const k=currentMoodDate;
  DB.moods[k]=selectedMoodValue;
  if(!DB.profile.moodFeelings) DB.profile.moodFeelings={};
  if(selectedFeelings.length>0) DB.profile.moodFeelings[k]=selectedFeelings.join(',');
  else delete DB.profile.moodFeelings[k];
  const ta=document.getElementById('journalInput');
  const note=ta?ta.value.trim().slice(0,JOURNAL_MAX):'';
  if(!DB.journal) DB.journal={};
  if(note) DB.journal[k]=note; else delete DB.journal[k];
  saveData();
  closeMoodModal();
  renderActivePage();
  showToast(`Humeur enregistrée ${MOOD_EMOJIS[selectedMoodValue]}${note?' · note ajoutée':''}`,2200);
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
      const hasNote=!!(DB.journal&&DB.journal[k]);
      cells+=`<div class="mood-cal-cell editable" role="button" tabindex="0" aria-label="Modifier l'humeur du ${d}" onclick="openMoodModal('${k}')" onkeydown="if(event.key==='Enter')openMoodModal('${k}')">
        <div class="mood-cal-emoji">${MOOD_EMOJIS[mood]||'😐'}${hasNote?'<span class="mood-note-dot" title="Note"></span>':''}</div>
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

/* ═══════════ Rapport interactif ═══════════ */
const rep = { period: 'week', offset: 0, habit: 'all' };
const REP_PERIODS = [['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']];
const midnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const fmtShort = d => `${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}`;

function setRepPeriod(p) { rep.period = p; rep.offset = 0; renderReport(); }
function cycleRepPeriod() { const i = REP_PERIODS.findIndex(x => x[0] === rep.period); setRepPeriod(REP_PERIODS[(i + 1) % REP_PERIODS.length][0]); }
function setRepHabit(id) { rep.habit = id; renderReport(); }
function repNav(delta) { const n = rep.offset + delta; if (n > 0) return; rep.offset = n; renderReport(); }

function repRange() {
  const t = midnight();
  if (rep.period === 'week') {
    const dow = t.getDay() === 0 ? 6 : t.getDay() - 1;
    const start = addDays(t, -dow + rep.offset * 7), end = addDays(start, 6);
    return { start, end, t, label: `${fmtShort(start)} – ${fmtShort(end)}` };
  }
  if (rep.period === 'month') {
    const start = new Date(t.getFullYear(), t.getMonth() + rep.offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end, t, label: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}` };
  }
  const y = t.getFullYear() + rep.offset;
  return { start: new Date(y, 0, 1), end: new Date(y, 11, 31), t, label: String(y) };
}
function repHabits() { return rep.habit === 'all' ? HABITS : HABITS.filter(h => h.id === rep.habit); }

// Statistiques d'une journée selon le filtre courant (null si rien à mesurer).
function dayStat(d, includeOptional) {
  const k = fmtDate(d);
  if (d > midnight() || k < DB.createdAt) return null;
  let req = 0, done = 0, cnt = 0;
  repHabits().forEach(h => {
    if (rep.habit === 'all' && h.optional && !includeOptional) return;
    if (!isDayActive(h, d)) return;
    const v = getHabitDayValue(h, k, d);
    req++; if (v >= 1) cnt++;
    done += rep.habit === 'all' ? (v >= 1 ? 1 : 0) : Math.min(1, v);
  });
  return req > 0 ? { k, req, done, cnt, rate: done / req } : null;
}

function repStats() {
  const { start, end, t } = repRange();
  let req = 0, done = 0, validated = 0, perfect = 0;
  for (let d = new Date(start); d <= end && d <= t; d = addDays(d, 1)) {
    const s = dayStat(d); const k = fmtDate(d);
    if (s) { req += s.req; done += s.done; if (s.rate >= 1) perfect++; }
    repHabits().forEach(h => {
      if (h.type === 'bad' || !isDayActive(h, d) || k < DB.createdAt) return;
      if (h.type === 'weekly') { if (DB.habits[h.id].logs[k] === 'done') validated++; }
      else if (isHabitDoneOn(h, k, d)) validated++;
    });
  }
  const streak = rep.habit === 'all'
    ? HABITS.reduce((m, h) => Math.max(m, calcStreak(h).current), 0)
    : calcStreak(HABITS.find(h => h.id === rep.habit)).current;
  const perfectDays = rep.habit === 'all'
    ? (DB.perfectDaysClaimed || []).filter(k => k >= fmtDate(start) && k <= fmtDate(end)).length
    : perfect;
  return { streak, rate: req > 0 ? Math.round(done / req * 100) : 0, validated, perfectDays };
}

// Points pour le graphique en barres et la courbe de réussite.
function repBuckets() {
  const { start, end, t } = repRange();
  if (rep.period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      let req = 0, done = 0, cnt = 0;
      const last = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let day = 1; day <= last; day++) {
        const s = dayStat(new Date(start.getFullYear(), m, day), true);
        if (s) { req += s.req; done += s.done; cnt += s.cnt; }
      }
      const cur = start.getFullYear() === t.getFullYear() && m === t.getMonth();
      return { label: MONTH_SHORT[m].slice(0, 3), barLabel: MONTH_SHORT[m][0], showLabel: true, rate: req > 0 ? done / req : null, cnt, req, isToday: cur };
    });
  }
  const out = []; let i = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1), i++) {
    const s = dayStat(d, true);
    const isToday = fmtDate(d) === fmtDate(t);
    const label = rep.period === 'week' ? DAY_SHORT[i] : String(d.getDate());
    out.push({ label, barLabel: label, showLabel: rep.period === 'week' || d.getDate() === 1 || d.getDate() % 5 === 0,
      rate: s ? s.rate : null, cnt: s ? s.cnt : 0, req: s ? s.req : 0, isToday, future: d > t });
  }
  return out;
}
function repMoodPoints() {
  const { start, end, t } = repRange();
  if (rep.period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      const vals = [];
      const last = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let day = 1; day <= last; day++) { const v = DB.moods[fmtDate(new Date(start.getFullYear(), m, day))]; if (v) vals.push(v); }
      return { label: MONTH_SHORT[m].slice(0, 3), showLabel: true, v: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, emoji: false };
    });
  }
  const out = []; let i = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1), i++) {
    const v = DB.moods[fmtDate(d)];
    out.push({ label: rep.period === 'week' ? DAY_SHORT[i][0] : String(d.getDate()),
      showLabel: rep.period === 'week' || d.getDate() === 1 || d.getDate() % 5 === 0,
      v: (v && d <= t) ? v : null, emoji: rep.period === 'week' });
  }
  return out;
}

function buildCalStats() {
  const { end, t } = repRange();
  const anchor = end > t ? t : end;
  const year = anchor.getFullYear(), month = anchor.getMonth();
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const todayKey = today(); let html = '';
  for (let i = 0; i < startDow; i++) html += `<div></div>`;
  for (let d = 1; d <= last.getDate(); d++) {
    const dateObj = new Date(year, month, d); const k = fmtDate(dateObj);
    if (k > todayKey) { html += `<div class="cal-stats-cell future">${d}</div>`; continue; }
    if (isPaused(k)) { html += `<div class="cal-stats-cell paused" title="Pause">${d}</div>`; continue; }
    if (k < DB.createdAt) { html += `<div class="cal-stats-cell">${d}</div>`; continue; }
    const s = dayStat(dateObj);
    let cls = 'cal-stats-cell'; let title = '';
    if (s) { title = ` title="${s.cnt}/${s.req}"`; cls += s.rate >= 1 ? ' perfect' : s.rate >= 0.7 ? ' good' : ' missed'; }
    html += `<div class="${cls}"${title}>${d}</div>`;
  }
  return { html, label: `${MONTH_NAMES[month]} ${year}` };
}

const CARET = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="2 4 5 7 8 4"/></svg>`;
const NAV_L = `<svg viewBox="0 0 18 18"><polyline points="12 4 6 9 12 14"/></svg>`;
const NAV_R = `<svg viewBox="0 0 18 18"><polyline points="6 4 12 9 6 14"/></svg>`;

function renderReport() {
  const container = document.getElementById('reportContent'); if (!container) return;
  if (rep.habit !== 'all' && !HABITS.some(h => h.id === rep.habit)) rep.habit = 'all';
  const R = repRange(), st = repStats(), buckets = repBuckets(), cal = buildCalStats();
  const periodName = REP_PERIODS.find(p => p[0] === rep.period)[1];
  const single = rep.habit !== 'all';
  const dense = buckets.length > 12;
  const badge = `<button type="button" class="report-period-badge" onclick="cycleRepPeriod()" aria-label="Changer de période (actuelle : ${periodName})">${periodName} ${CARET}</button>`;
  const habitOpts = `<option value="all">Toutes les habitudes</option>` +
    HABITS.map(h => `<option value="${h.id}"${rep.habit === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('');

  const linePts = buckets.map(b => ({ label: b.label, showLabel: b.showLabel, v: b.rate == null ? null : Math.round(b.rate * 100) }));
  const moodPts = repMoodPoints();

  container.innerHTML = `
    <div class="report-wrap">
      <div class="rep-controls">
        <div class="rep-seg" role="group" aria-label="Période">
          ${REP_PERIODS.map(([k, l]) => `<button type="button" class="rep-seg-btn${rep.period === k ? ' active' : ''}" aria-pressed="${rep.period === k}" onclick="setRepPeriod('${k}')">${l}</button>`).join('')}
        </div>
        <div class="rep-row">
          <div class="rep-nav">
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(-1)" aria-label="Période précédente">${NAV_L}</button>
            <div class="rep-range" aria-live="polite">${R.label}</div>
            <button type="button" class="mood-cal-nav-btn" onclick="repNav(1)" aria-label="Période suivante"${rep.offset >= 0 ? ' disabled' : ''}>${NAV_R}</button>
          </div>
          <select class="pseudo-input rep-select" aria-label="Filtrer par habitude" onchange="setRepHabit(this.value)">${habitOpts}</select>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-val">${st.streak}</div><div class="stat-label">Série en cours</div></div>
        <div class="stat-card"><div class="stat-val">${st.rate}%</div><div class="stat-label">Taux de réussite</div></div>
        <div class="stat-card"><div class="stat-val">${st.validated.toLocaleString('fr-FR')}</div><div class="stat-label">Habitudes validées</div></div>
        <div class="stat-card"><div class="stat-val">${st.perfectDays}</div><div class="stat-label">${single ? 'Jours réussis' : 'Journées parfaites'}</div></div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">${single ? 'Réussite par ' + (rep.period === 'year' ? 'mois' : 'jour') : 'Habitudes validées'}</div>
          ${badge}
        </div>
        <div class="bar-chart${dense ? ' dense' : ''}" id="barChart">
          ${buckets.map(b => {
            const pct = b.rate == null ? 0 : Math.max(b.rate > 0 ? 5 : 3, Math.round(b.rate * 100));
            const tip = b.req > 0 ? `${b.label} : ${b.cnt}/${b.req}` : `${b.label} : –`;
            return `<div class="bar-col" title="${esc(tip)}">
              <div class="bar-fill${b.isToday ? ' active' : ''}" style="height:${pct}%;background:${b.isToday ? 'var(--accent)' : 'var(--accent-bg)'}">
                ${b.isToday && !dense ? `<div class="bar-tooltip">${b.cnt} habitude${b.cnt > 1 ? 's' : ''}</div>` : ''}
              </div>
              <div class="bar-label">${b.showLabel ? esc(rep.period === 'year' ? b.barLabel : b.label) : '&nbsp;'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Évolution du taux de réussite</div>
          ${badge}
        </div>
        <canvas id="lineChartReport" height="160" role="img" aria-label="Courbe du taux de réussite"></canvas>
      </div>

      <div class="report-card">
        <div class="report-card-header">
          <div class="report-card-title">Calendrier du mois</div>
          <div class="report-period-badge">${cal.label}</div>
        </div>
        <div class="cal-stats-grid">
          ${DAY_SHORT.map(d => `<div class="cal-stats-header">${d[0]}${d[1]}</div>`).join('')}
          ${cal.html}
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
          ${badge}
        </div>
        <canvas id="moodChartReport" height="100" role="img" aria-label="Courbe d'humeur"></canvas>
      </div>

      ${buildJournalHtml()}

      ${buildInsightsHtml()}
    </div>`;

  requestAnimationFrame(() => {
    drawLineChart('lineChartReport', linePts);
    drawMoodChart('moodChartReport', moodPts);
  });
}

function chartColors() {
  const dark = isDarkNow();
  return {
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    accent: cssVar('--accent') || '#12131A',
  };
}
// Découpe en séries continues (les valeurs null interrompent la courbe).
function chartRuns(pts, xOf, yOf) {
  const runs = []; let cur = [];
  pts.forEach((p, i) => { if (p.v == null) { if (cur.length) runs.push(cur); cur = []; } else cur.push({ x: xOf(i), y: yOf(p.v), p, i }); });
  if (cur.length) runs.push(cur);
  return runs;
}
function strokeRuns(ctx, runs, c, padTop, base, radius) {
  runs.forEach(run => {
    if (run.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, base);
      grad.addColorStop(0, withAlpha(c.accent, 0.16)); grad.addColorStop(1, withAlpha(c.accent, 0));
      ctx.beginPath(); ctx.moveTo(run[0].x, run[0].y); run.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
      ctx.lineTo(run[run.length - 1].x, base); ctx.lineTo(run[0].x, base); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(run[0].x, run[0].y); run.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    }
    run.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = c.accent; ctx.fill(); });
  });
}
function chartEmpty(ctx, W, H, c) {
  ctx.fillStyle = c.text; ctx.font = '12px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Pas encore de données sur cette période', W / 2, H / 2);
}

function drawLineChart(canvasId, pts) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = 160; canvas.width = W; canvas.height = H;
  const c = chartColors();
  const pad = { l: 36, r: 16, t: 20, b: 28 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b, n = pts.length;
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  [0, 20, 40, 60, 80, 100].forEach(v => {
    const y = pad.t + cH - (v / 100) * cH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'right'; ctx.fillText(`${v}%`, pad.l - 6, y + 4);
  });
  const xOf = i => pad.l + (n > 1 ? i / (n - 1) : 0.5) * cW;
  const yOf = v => pad.t + cH - (v / 100) * cH;
  const runs = chartRuns(pts, xOf, yOf);
  if (!runs.length) { chartEmpty(ctx, W, H, c); } else strokeRuns(ctx, runs, c, pad.t, pad.t + cH, n > 12 ? 2.5 : 4);
  ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  pts.forEach((p, i) => { if (p.showLabel) ctx.fillText(p.label, xOf(i), H - 4); });
}

function drawMoodChart(canvasId, pts) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = 100; canvas.width = W; canvas.height = H;
  const c = chartColors();
  const pad = { l: 16, r: 16, t: 16, b: 24 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b, n = pts.length;
  const xOf = i => pad.l + (n > 1 ? i / (n - 1) : 0.5) * cW;
  const yOf = v => pad.t + cH - ((v - 1) / 4) * cH;
  const runs = chartRuns(pts, xOf, yOf);
  if (!runs.length) chartEmpty(ctx, W, H, c);
  else strokeRuns(ctx, runs, c, pad.t, pad.t + cH, n > 12 ? 2.5 : 3.5);
  ctx.fillStyle = c.text; ctx.font = '10px Instrument Sans,sans-serif'; ctx.textAlign = 'center';
  pts.forEach((p, i) => { if (p.showLabel) ctx.fillText(p.label, xOf(i), H - 4); });
  pts.forEach((p, i) => { if (p.v != null && p.emoji) { ctx.font = '14px serif'; ctx.fillText(MOOD_EMOJIS[Math.round(p.v)] || '', xOf(i), yOf(p.v) - 8); } });
}

/* ═══════════ Insights croisés ═══════════ */
const INSIGHT_DAYS = 90;
const INSIGHT_MIN_GROUP = 5;
const f1 = n => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const avgOf = a => a.reduce((s, x) => s + x, 0) / a.length;

function insightRows(days) {
  const now = midnight(); const rows = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(now, -i), k = fmtDate(d);
    if (k < DB.createdAt) break;
    const sl = (DB.sleepLog || {})[k];
    const done = {}; let req = 0, dn = 0;
    HABITS.forEach(h => {
      if (!isDayActive(h, d)) { done[h.id] = null; return; }
      const ok = isHabitDoneOn(h, k, d); done[h.id] = ok;
      if (!h.optional) { req++; if (ok) dn++; }
    });
    rows.push({ k, dow: d.getDay(), mood: DB.moods[k] == null ? null : DB.moods[k],
      sleepH: sl ? (sl.hours + (sl.minutes || 0) / 60) : null,
      med: (DB.meditation || {})[k] || 0, rate: req > 0 ? dn / req : null, done });
  }
  return rows;
}
function compareMood(rows, pred) {
  const yes = [], no = [];
  rows.forEach(r => { if (r.mood == null) return; const v = pred(r); if (v == null) return; (v ? yes : no).push(r.mood); });
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes), b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}
function compareRate(rows, pred) {
  const yes = [], no = [];
  rows.forEach(r => { if (r.rate == null) return; const v = pred(r); if (v == null) return; (v ? yes : no).push(r.rate); });
  if (yes.length < INSIGHT_MIN_GROUP || no.length < INSIGHT_MIN_GROUP) return null;
  const a = avgOf(yes), b = avgOf(no);
  return { a, b, diff: a - b, n: yes.length + no.length };
}

function computeInsights(rows) {
  const out = [];
  const addMood = (icon, text, c, minDiff) => {
    if (!c || Math.abs(c.diff) < (minDiff || 0.3)) return;
    out.push({ icon, text, delta: `${c.diff > 0 ? '+' : '−'}${f1(Math.abs(c.diff))}`, good: c.diff > 0, n: c.n, score: Math.abs(c.diff) });
  };
  HABITS.forEach(h => {
    if (h.type === 'weekly') return;
    const c = compareMood(rows, r => r.done[h.id]);
    const nm = `« ${esc(h.name)} »`;
    const verb = h.type === 'bad' ? `évites ${nm}` : (h.type === 'counter' || h.type === 'drink') ? `atteins ton objectif ${nm}` : `fais ${nm}`;
    addMood(esc(h.emoji || '⭐'), `Les jours où tu ${verb}, ton humeur moyenne est de <b>${c ? f1(c.a) : ''}</b> (contre ${c ? f1(c.b) : ''} sinon).`, c);
  });
  addMood('😴', (() => { const c = compareMood(rows, r => r.sleepH == null ? null : r.sleepH >= 7);
    return c ? `Après une nuit d’au moins 7 h, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.sleepH == null ? null : r.sleepH >= 7));
  addMood('🧘', (() => { const c = compareMood(rows, r => r.med > 0);
    return c ? `Les jours où tu médites, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.med > 0));
  addMood('📈', (() => { const c = compareMood(rows, r => r.rate == null ? null : r.rate >= 0.8);
    return c ? `Quand tu valides au moins 80 % de tes habitudes, ton humeur moyenne est de <b>${f1(c.a)}</b> (contre ${f1(c.b)}).` : ''; })(),
    compareMood(rows, r => r.rate == null ? null : r.rate >= 0.8));

  const cr = compareRate(rows, r => r.sleepH == null ? null : r.sleepH >= 7);
  if (cr && Math.abs(cr.diff) >= 0.08) {
    out.push({ icon: '🌙', text: `Après une nuit de 7 h ou plus, tu valides <b>${Math.round(cr.a * 100)} %</b> de tes habitudes (contre ${Math.round(cr.b * 100)} %).`,
      delta: `${cr.diff > 0 ? '+' : '−'}${Math.round(Math.abs(cr.diff) * 100)} pts`, good: cr.diff > 0, n: cr.n, score: Math.abs(cr.diff) * 4 });
  }
  // Meilleur / pire jour de la semaine
  const byDow = {};
  rows.forEach(r => { if (r.mood != null) (byDow[r.dow] = byDow[r.dow] || []).push(r.mood); });
  const dows = Object.entries(byDow).filter(([, v]) => v.length >= 3).map(([d, v]) => ({ d: Number(d), m: avgOf(v), n: v.length }));
  if (dows.length >= 4) {
    dows.sort((a, b) => b.m - a.m);
    const best = dows[0], worst = dows[dows.length - 1];
    if (best.m - worst.m >= 0.5) {
      out.push({ icon: '📅', text: `Ton jour le plus lumineux est le <b>${DAY_FULL[best.d].toLowerCase()}</b> (${f1(best.m)}), le plus difficile le <b>${DAY_FULL[worst.d].toLowerCase()}</b> (${f1(worst.m)}).`,
        delta: '', good: true, n: dows.reduce((s, x) => s + x.n, 0), score: (best.m - worst.m) * 0.7 });
    }
  }
  return out.filter(x => x.text).sort((a, b) => b.score - a.score).slice(0, 6);
}

function buildInsightsHtml() {
  const rows = insightRows(INSIGHT_DAYS);
  const moods = rows.filter(r => r.mood != null);
  let body;
  if (moods.length < 7) {
    body = `<div class="insight-empty">Il faut au moins 7 jours d’humeur renseignée pour dégager des tendances.
      <div class="insight-progress">${progressBar(Math.round(moods.length / 7 * 100), 'Jours d’humeur renseignés')}<span>${moods.length} / 7 jours</span></div></div>`;
  } else {
    const list = computeInsights(rows);
    const mean = avgOf(moods.map(r => r.mood));
    const head = `<div class="insight-summary">Humeur moyenne : <b>${f1(mean)}</b> / 5 sur ${moods.length} jours renseignés</div>`;
    body = head + (list.length
      ? list.map(x => `<div class="insight-row">
          <div class="insight-ico" aria-hidden="true">${x.icon}</div>
          <div class="insight-main"><div class="insight-text">${x.text}</div><div class="insight-n">sur ${x.n} jours</div></div>
          ${x.delta ? `<div class="insight-delta ${x.good ? 'up' : 'down'}">${x.delta}</div>` : ''}
        </div>`).join('')
      : `<div class="insight-empty">Rien de marquant pour l’instant. Continue à renseigner ton humeur : les tendances apparaissent avec le temps.</div>`);
  }
  return `<div class="report-card" id="insightsCard">
    <div class="report-card-header">
      <div class="report-card-title">Insights</div>
      <div class="report-period-badge">${INSIGHT_DAYS} derniers jours</div>
    </div>
    ${body}
    <div class="insight-note">Ce sont des corrélations, pas des causes.</div>
  </div>`;
}

function renderMyHabits() {
  const container=document.getElementById('myHabitsContent'); if(!container) return;
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const t=today();
  if(HABITS.length===0){ container.innerHTML=`<div class="empty-note">Aucune habitude pour l'instant.<br>Appuie sur + pour créer la première.</div>`; return; }
  container.innerHTML=`<div class="my-habits-list">
    ${HABITS.map(h=>{
      const streak=calcStreak(h).current;
      const done=isHabitDoneOn(h,t,todayDate);
      const live=h.type==='drink'||h.type==='counter';
      const inert=h.type==='bad'&&!!h.levels;
      let meta=h.freq||'Tous les jours';
      if(live){ const p=habitProgress(h,t); meta=`${fmtNum(p.v)} / ${fmtNum(p.goal)} ${p.unit}`; }
      if(h.type==='bad'){ const f=isBadFail(h.id,t); const bv=badVal(h.id,t); meta=f?('Craqué'+(bv?' · '+esc(bv):'')):'Tenu bon'; }
      return `<div class="my-habit-row" data-habit-id="${h.id}" style="--ink:${h.color}">
        <div class="my-habit-emoji">${habitIconMarkup(h)}</div>
        <div class="my-habit-info">
          <div class="my-habit-name">${esc(h.name)}</div>
          <div class="my-habit-meta"><span>${meta}</span><span class="streak-inline">${icon('flame')}${streak} j</span></div>
          ${live?progressBar(Math.min(100,Math.round(dayProgress(h,t,todayDate)*100)),h.name).replace('class="pbar"','class="pbar pbar-thin"'):''}
        </div>
        <button type="button" class="my-habit-edit" onclick="openHabitForm('${h.id}')" aria-label="Modifier ${esc(h.name)}">${icon('edit')}</button>
        <div class="habit-toggle-btn${done?' done':''}"${(live||inert)?' aria-hidden="true"':` onclick="toggleHabit('${h.id}')"`}>
          <svg class="check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ═══════════ Habitudes personnalisées ═══════════ */
const HABIT_COLORS = ['#8EA2FF','#C79BFF','#FFD23F','#52E0A1','#FF8A4C','#2EC4B6','#52C7F2','#FF7EB0','#C3E34A','#FF6B6B','#F7B267','#9BE0C4'];
const HABIT_EMOJIS = ['⭐','🎯','🧘','🍎','🥗','💊','🦷','🛏️','🚿','🎸','✍️','🎨','🧠','🌱','🐕','☕','🚭','💰','🏊','🚴','🧗','📝','🎮','🌞'];
const ALL_DAYS = [0,1,2,3,4,5,6];
const WEEKDAYS = [1,2,3,4,5];
const DOW_ORDER = [1,2,3,4,5,6,0];
const DOW_LETTER = {1:'L',2:'M',3:'M',4:'J',5:'V',6:'S',0:'D'};
const KIND_INFO = [
  { k:'good',    label:'Case à cocher', hint:'Un tap par jour' },
  { k:'counter', label:'Compteur',      hint:'Une quantité à atteindre' },
  { k:'water',   label:'Eau',           hint:'Une boisson, en ml' },
  { k:'weekly',  label:'Hebdomadaire',  hint:'Une fois par semaine suffit' },
  { k:'bad',     label:'À éviter',      hint:'Un comportement à limiter' },
];
const KIND_DEFAULTS = {
  counter: { goal:10,   step:1,   max:20,   unit:'' },
  water:   { goal:2000, step:250, max:5000, unit:'ml' },
};

const pad2 = n => String(n).padStart(2,'0');
const num  = v => { const n = parseFloat(String(v).replace(',','.')); return Number.isFinite(n) ? n : NaN; };
const nz   = (v,d) => v == null ? d : v;

function kindLabel(k) {
  if (k === 'drink') return 'Eau';
  const i = KIND_INFO.find(x => x.k === k);
  return i ? i.label : k;
}
function daysLabel(days) {
  const d = [...new Set(days)].sort((a,b) => ((a+6)%7) - ((b+6)%7));
  if (d.length === 7) return 'Tous les jours';
  if (d.length === 5 && WEEKDAYS.every(x => d.includes(x))) return 'Lundi - Vendredi';
  if (d.length === 2 && d.includes(6) && d.includes(0)) return 'Week-end';
  return d.map(x => DAY_SHORT[(x+6)%7]).join(', ');
}
function habitDays(h) {
  if (h.activeDays) return h.activeDays.slice();
  return h.weekdayOnly ? WEEKDAYS.slice() : ALL_DAYS.slice();
}

let hf = null; // état du formulaire habitude

function openAddHabit() { openHabitForm(); }

function openHabitForm(id) {
  const h = id ? HABITS.find(x => x.id === id) : null;
  if (id && !h) return;
  if (h) {
    hf = {
      mode:'edit', id:h.id, builtin:!h.custom, type:h.type,
      kind: h.type === 'drink' ? 'drink' : h.type,
      name:h.name, emoji:h.emoji || '⭐', color:h.color,
      days:habitDays(h), daysTouched:false, optional:!!h.optional,
      goal:nz(h.goal,''), step:nz(h.step,''), max:nz(h.max,''), unit:h.unit || '',
      levels:(h.levels || []).join(', '), badMode:h.levels ? 'levels' : 'simple',
    };
  } else {
    const used = HABITS.map(x => x.color);
    hf = {
      mode:'create', id:null, builtin:false, type:'good', kind:'good',
      name:'', emoji:'⭐', color:HABIT_COLORS.find(c => !used.includes(c)) || HABIT_COLORS[0],
      days:ALL_DAYS.slice(), daysTouched:true, optional:false,
      goal:'', step:'', max:'', unit:'',
      levels:'', badMode:'simple',
    };
  }
  document.getElementById('habitFormTitle').textContent = h ? 'Modifier l’habitude' : 'Nouvelle habitude';
  renderHabitForm();
  document.querySelector('#habitModal .modal-card').scrollTop = 0;
  document.getElementById('habitModal').classList.add('open');
  if (!h) setTimeout(() => { const el = document.getElementById('hfName'); if (el) el.focus(); }, 120);
}
function closeHabitForm() {
  hf = null;
  document.getElementById('habitModal').classList.remove('open');
}

function hfInput(key, val) { if (hf) hf[key] = val; }
function hfSet(key, val)   { if (!hf) return; hf[key] = val; renderHabitForm(); }
function hfToggleDay(d) {
  if (!hf) return;
  hf.days = hf.days.includes(d) ? hf.days.filter(x => x !== d) : [...hf.days, d];
  hf.daysTouched = true;
  renderHabitForm();
}
function hfDays(preset) {
  if (!hf) return;
  hf.days = preset === 'week' ? WEEKDAYS.slice() : ALL_DAYS.slice();
  hf.daysTouched = true;
  renderHabitForm();
}
function setHabitKind(k) {
  if (!hf || hf.mode !== 'create') return;
  hf.kind = k;
  const d = KIND_DEFAULTS[k];
  if (d) { hf.goal = d.goal; hf.step = d.step; hf.max = d.max; hf.unit = d.unit; }
  renderHabitForm();
}

function renderHabitForm() {
  const el = document.getElementById('habitFormBody');
  if (!el || !hf) return;
  const isEdit = hf.mode === 'edit';
  const k = hf.kind;
  const counterLike = k === 'counter' || k === 'water' || k === 'drink';
  const waterLike   = k === 'water' || k === 'drink';

  const kindBlock = isEdit
    ? `<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-fixed">${esc(kindLabel(k))}</div>
         <div class="hf-hint">Le type ne peut pas être modifié après la création.</div>
       </div>`
    : `<div class="modal-section">
         <label class="modal-label">Type</label>
         <div class="hf-seg" role="group" aria-label="Type d’habitude">
           ${KIND_INFO.map(i => `<button type="button" class="hf-chip hf-kind${k === i.k ? ' selected' : ''}" aria-pressed="${k === i.k}" onclick="setHabitKind('${i.k}')"><b>${i.label}</b><span>${i.hint}</span></button>`).join('')}
         </div>
       </div>`;

  const emojiBlock = hf.builtin ? '' : `
    <div class="modal-section">
      <label class="modal-label" for="hfEmoji">Icône</label>
      <div class="hf-emoji-row">
        <input id="hfEmoji" class="pseudo-input hf-emoji-input" maxlength="8" value="${esc(hf.emoji)}" aria-label="Emoji de l’habitude" oninput="hfInput('emoji',this.value)">
        <span class="hf-hint" style="margin:0">Tape un emoji ou choisis-en un.</span>
      </div>
      <div class="hf-grid">
        ${HABIT_EMOJIS.map(e => `<button type="button" class="hf-emoji-btn${hf.emoji === e ? ' selected' : ''}" onclick="hfSet('emoji','${e}')" aria-label="Emoji ${e}">${e}</button>`).join('')}
      </div>
    </div>`;

  const colorBlock = `
    <div class="modal-section">
      <label class="modal-label">Couleur</label>
      <div class="hf-swatches">
        ${HABIT_COLORS.map(c => `<button type="button" class="hf-swatch${hf.color === c ? ' selected' : ''}" style="--c:${c}" aria-label="Couleur ${c}" aria-pressed="${hf.color === c}" onclick="hfSet('color','${c}')"></button>`).join('')}
      </div>
    </div>`;

  const daysBlock = k === 'weekly' ? '' : `
    <div class="modal-section">
      <label class="modal-label">Jours actifs</label>
      <div class="hf-days" role="group" aria-label="Jours actifs">
        ${DOW_ORDER.map(d => `<button type="button" class="hf-day${hf.days.includes(d) ? ' selected' : ''}" aria-pressed="${hf.days.includes(d)}" aria-label="${DAY_FULL[d]}" onclick="hfToggleDay(${d})">${DOW_LETTER[d]}</button>`).join('')}
      </div>
      <div class="hf-presets">
        <button type="button" class="hf-link" onclick="hfDays('all')">Tous les jours</button>
        <button type="button" class="hf-link" onclick="hfDays('week')">Lun – Ven</button>
      </div>
    </div>`;

  const badBlock = k !== 'bad' ? '' : `
    <div class="modal-section">
      ${!isEdit ? `<label class="modal-label">Suggestions</label>
      <div class="hf-presets-wrap" style="margin-bottom:16px">${BAD_PRESETS.map((p, i) => `<button type="button" class="hf-suggest" onclick="applyBadPreset(${i})">${p.emoji} ${esc(p.name)}</button>`).join('')}</div>` : ''}
      <label class="modal-label">Suivi</label>
      <div class="hf-seg" role="group" aria-label="Mode de suivi">
        <button type="button" class="hf-chip hf-kind${hf.badMode !== 'levels' ? ' selected' : ''}" aria-pressed="${hf.badMode !== 'levels'}" onclick="hfSet('badMode','simple')"><b>Simple</b><span>Un tap = échec du jour</span></button>
        <button type="button" class="hf-chip hf-kind${hf.badMode === 'levels' ? ' selected' : ''}" aria-pressed="${hf.badMode === 'levels'}" onclick="hfSet('badMode','levels')"><b>Par durée</b><span>Choisir un palier</span></button>
      </div>
      ${hf.badMode === 'levels'
        ? `<label class="modal-label" for="hfLevels" style="margin-top:16px">Paliers <span class="hf-opt">(séparés par des virgules)</span></label>
           <input id="hfLevels" class="pseudo-input hf-input" type="text" maxlength="80" placeholder="15 min, 30 min, 1 h, 2 h" value="${esc(hf.levels)}" oninput="hfInput('levels',this.value)">
           <div class="hf-hint">« Non » (aucun écart) est toujours proposé en premier : il valide la journée. Tout autre palier compte comme un échec.</div>`
        : `<div class="hf-hint">La journée est validée par défaut ; un tap marque l’échec et casse la série.</div>`}
    </div>`;

  const goalBlock = !counterLike ? '' : `
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
          <input id="hfUnit" class="pseudo-input hf-input" type="text" maxlength="8" placeholder="km, pages…" value="${esc(waterLike ? 'ml' : hf.unit)}"${waterLike ? ' readonly' : ''} oninput="hfInput('unit',this.value)"></div>
      </div>
    </div>`;

  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="hfName">Nom</label>
      <input id="hfName" class="pseudo-input hf-input" type="text" maxlength="30" placeholder="Ex. Méditer, Vitamines…" value="${esc(hf.name)}" oninput="hfInput('name',this.value)" onkeydown="if(event.key==='Enter') saveHabitForm()">
    </div>
    ${kindBlock}
    ${emojiBlock}
    ${colorBlock}
    ${daysBlock}
    ${goalBlock}
    ${badBlock}
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Optionnelle</div>
        <div class="pref-hint">Ne compte pas dans la journée parfaite</div>
      </div>
      <button type="button" class="pref-toggle ${hf.optional ? 'on' : 'off'}" role="switch" aria-checked="${hf.optional}" aria-label="Habitude optionnelle" onclick="hfSet('optional',!hf.optional)">${hf.optional ? 'Activé' : 'Désactivé'}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveHabitForm()">${isEdit ? 'Enregistrer' : 'Créer l’habitude'}</button>
      ${isEdit ? `<button type="button" class="modal-reset-btn" onclick="deleteHabitFromForm()">${icon('trash')} Supprimer l’habitude</button>` : ''}
    </div>`;
}

function saveHabitForm() {
  if (!hf) return;
  const name = hf.name.trim();
  if (!name) { showToast('Donne un nom à ton habitude', 2500, 'alert'); return; }
  if (HABITS.some(x => x.id !== hf.id && x.name.trim().toLowerCase() === name.toLowerCase())) {
    showToast('Une habitude porte déjà ce nom', 2800, 'alert'); return;
  }
  const k = hf.kind;
  const counterLike = k === 'counter' || k === 'water' || k === 'drink';
  const waterLike   = k === 'water' || k === 'drink';
  if (k !== 'weekly' && hf.days.length === 0) { showToast('Choisis au moins un jour', 2800, 'alert'); return; }

  let goal, step, max;
  if (counterLike) {
    goal = num(hf.goal); step = num(hf.step); max = num(hf.max);
    if (!(goal > 0 && step > 0 && max > 0)) { showToast('Objectif, ajout et maximum doivent être positifs', 3200, 'alert'); return; }
    if (max < goal)  { showToast('Le maximum doit être au moins égal à l’objectif', 3200, 'alert'); return; }
    if (step > max)  { showToast('L’ajout par tap dépasse le maximum', 3000, 'alert'); return; }
  }
  const unit = waterLike ? 'ml' : String(hf.unit || '').trim().slice(0, 8);
  let levels = null;
  if (k === 'bad' && hf.badMode === 'levels') {
    levels = parseLevels(hf.levels).slice(0, 8);
    if (levels.length === 0) { showToast('Ajoute au moins un palier (ex. 15 min, 1 h)', 3200, 'alert'); return; }
  }

  if (hf.mode === 'create') {
    const h = {
      id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name, emoji: (hf.emoji || '').trim() || '⭐',
      type: k === 'water' ? 'counter' : k,
      color: hf.color, custom: true, since: today(),
      optional: hf.optional, weekdayOnly: false,
    };
    if (k === 'weekly') h.freq = 'Chaque semaine';
    else {
      if (hf.days.length < 7) h.activeDays = hf.days.slice();
      h.freq = daysLabel(hf.days);
    }
    if (counterLike) { h.goal = goal; h.step = step; h.max = max; h.unit = unit; }
    if (levels) h.levels = levels;
    HABITS.push(h);
    DB.habits[h.id] = { logs:{} };
    saveData();
    closeHabitForm();
    renderActivePage();
    showToast(`« ${name} » ajoutée`, 2600, 'star');
    return;
  }

  const h = HABITS.find(x => x.id === hf.id);
  if (!h) { closeHabitForm(); return; }
  h.name = name;
  h.color = hf.color;
  h.optional = hf.optional;
  if (!hf.builtin) h.emoji = (hf.emoji || '').trim() || '⭐';
  if (counterLike) { h.goal = goal; h.step = step; h.max = max; h.unit = unit; }
  if (k === 'bad') { if (levels) h.levels = levels; else delete h.levels; }
  if (k !== 'weekly' && hf.daysTouched) {
    h.weekdayOnly = false;
    if (hf.days.length === 7) delete h.activeDays; else h.activeDays = hf.days.slice();
    h.freq = daysLabel(hf.days);
  }
  saveData();
  closeHabitForm();
  renderActivePage();
  showToast('Habitude mise à jour', 2200);
}

function deleteHabitFromForm() {
  if (!hf || hf.mode !== 'edit') return;
  const h = HABITS.find(x => x.id === hf.id);
  if (!h) { closeHabitForm(); return; }
  if (!confirm(`Supprimer « ${h.name} » ?\n\nSon historique sera effacé définitivement.`)) return;
  HABITS.splice(HABITS.indexOf(h), 1);
  delete DB.habits[h.id];
  (DB.reminders || []).forEach(r => { if (r.habitId === h.id) r.habitId = ''; });
  saveData();
  closeHabitForm();
  renderActivePage();
  showToast('Habitude supprimée', 2200, 'trash');
}

function renderAchievements() {
  const c=document.getElementById('achievementsContent'); if(!c) return;
  c.innerHTML=`<div class="tabs-row ach-tabs">
      <button type="button" class="tab-btn${achTab==='challenges'?' active':''}" onclick="setAchTab('challenges')">Défis &amp; saison</button>
      <button type="button" class="tab-btn${achTab==='achievements'?' active':''}" onclick="setAchTab('achievements')">Succès</button>
    </div><div id="achBody"></div>`;
  if(achTab==='challenges') document.getElementById('achBody').innerHTML=`<div class="account-wrap">${challengesTabHtml()}</div>`;
  else renderAchievementsList();
}
function renderAchievementsList() {
  const container=document.getElementById('achBody'); if(!container) return;
  const unlocked=DB.unlockedAchievements.length;
  const total=ACHIEVEMENTS.length;
  const pct=Math.round((unlocked/total)*100);

  const categories=[
    { label:'Séries et régularité', ids:['consistent','dedicated','camel','hydration','bookworm','digital','night_tmd','plant_pwr','phonefree','king','sugarfree','ice_king'] },
    { label:'Étapes et XP',       ids:['first_habit','centurion','xp_500','on_fire','transcend'] },
    { label:'Journées parfaites',          ids:['perfect_wk','perfectist','ironwill'] },
    { label:'Bien-être',                   ids:['calm_mind','mindful_wk'] },
    { label:'Défis et saisons',            ids:['chal_first','chal_five','chal_30','season_5','season_max'] },
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
  const name=esc(DB.profile.name||'Mon profil');
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
      ${seasonMiniHtml()}
    </div>

    <div>
      <div class="account-section-title">Préférences</div>
      <div class="pref-card">
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('edit')}</span><div><div class="pref-label-text">Nom d'affichage</div><div class="pref-hint">${name}</div></div></div>
          <button class="pref-edit" onclick="openProfile()">Modifier</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('moon')}</span><div><div class="pref-label-text">Thème</div><div class="pref-hint">Clair, sombre ou selon l'appareil</div></div></div>
          <div class="theme-seg">${themeSegHtml()}</div>
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

    ${pauseSectionHtml()}

    ${remindersSectionHtml()}

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
  renderThemeSegs();
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

/* ═══════════ Rappels configurables ═══════════ */
let _notifTimers = [];

function notifsGranted() {
  return !!DB.profile.notifsEnabled && ('Notification' in window) && Notification.permission === 'granted';
}

function initNotifications() {
  const on = !!DB.profile.notifsEnabled;
  updateToggleBtn('notifsToggle', on);
  if (notifsGranted()) scheduleLocalNotifications();
}

async function toggleNotifications() {
  if (!('Notification' in window)) { alert('Les notifications ne sont pas prises en charge sur cet appareil.'); return; }
  if (DB.profile.notifsEnabled) {
    DB.profile.notifsEnabled = false;
    _notifTimers.forEach(id => clearTimeout(id)); _notifTimers = [];
    saveData();
    updateToggleBtn('notifsToggle', false);
    showToast('Notifications désactivées', 2500, 'bellOff');
    if (activePage === 'account') renderAccount();
    return;
  }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm === 'granted') {
    DB.profile.notifsEnabled = true; saveData();
    updateToggleBtn('notifsToggle', true);
    scheduleLocalNotifications();
    const n = (DB.reminders || []).filter(r => r.enabled).length;
    showToast(`${n} rappel${n > 1 ? 's' : ''} programmé${n > 1 ? 's' : ''}`, 3000, 'bell');
  } else {
    showToast('Notifications bloquées : vérifie les réglages du navigateur', 3500, 'alert');
  }
  if (activePage === 'account') renderAccount();
}

/* Prochaine occurrence (Date) d'un rappel, en respectant ses jours. */
function nextOccurrence(r, from) {
  from = from || new Date();
  if (!r.days || !r.days.length) return null;
  for (let i = 0; i < 8; i++) {
    const t = new Date(from);
    t.setDate(t.getDate() + i);
    t.setHours(r.hour, r.minute, 0, 0);
    if (t > from && r.days.includes(t.getDay())) return t;
  }
  return null;
}

function scheduleLocalNotifications() {
  _notifTimers.forEach(id => clearTimeout(id)); _notifTimers = [];
  if (!notifsGranted()) return;
  (DB.reminders || []).forEach(r => {
    if (!r.enabled) return;
    const t = nextOccurrence(r); if (!t) return;
    const ms = t.getTime() - Date.now();
    if (ms <= 0) return;
    _notifTimers.push(setTimeout(() => fireReminder(r.id, t.getTime()), ms));
  });
}

function reminderSatisfied(r) {
  if (!r.habitId) return false;
  const h = HABITS.find(x => x.id === r.habitId);
  if (!h || h.type === 'bad') return false;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return isHabitDoneOn(h, today(), d);
}

async function fireReminder(id, targetTs) {
  const r = (DB.reminders || []).find(x => x.id === id);
  const late = Date.now() - targetTs;
  // Ignore un rappel arrivé très en retard (appareil en veille) ou déjà accompli.
  if (r && r.enabled && late < 10 * 60 * 1000 && !reminderSatisfied(r)) await showReminderNotification(r);
  scheduleLocalNotifications();
}

async function showReminderNotification(r) {
  const opts = { body: r.body || '', icon: './assets/icon-192.png', badge: './assets/icon-192.png', tag: 'ht-' + r.id, data: { url: './' } };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(res => setTimeout(() => res(null), 1500))]);
      if (reg && reg.showNotification) { await reg.showNotification(r.title, opts); return true; }
    }
  } catch (e) {}
  try { new Notification(r.title, opts); return true; } catch (e) { return false; }
}

async function sendTestNotification() {
  if (!notifsGranted()) { showToast('Active d’abord les notifications', 3000, 'alert'); return; }
  const ok = await showReminderNotification({ id: 'test', title: '🔔 Notification test', body: 'Tout fonctionne : tes rappels te parviendront.' });
  showToast(ok ? 'Notification envoyée' : 'Impossible d’afficher la notification', 2600, ok ? 'bell' : 'alert');
}

// Les minuteries sont suspendues quand l'app passe en arrière-plan : on replanifie au retour.
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleLocalNotifications(); });

/* ── Liste des rappels (page Compte) ── */
function remindersSectionHtml() {
  const list = [...(DB.reminders || [])].sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  const on = notifsGranted();
  const rows = list.map(r => {
    const h = r.habitId ? HABITS.find(x => x.id === r.habitId) : null;
    const sub = daysLabel(r.days) + (h ? ` · ${esc(h.name)}` : '');
    return `<div class="pref-row reminder-row${r.enabled ? '' : ' off'}" role="button" tabindex="0" onclick="openReminder('${r.id}')" onkeydown="if(event.key==='Enter')openReminder('${r.id}')">
      <div class="reminder-time">${pad2(r.hour)}:${pad2(r.minute)}</div>
      <div class="pref-info reminder-info"><div><div class="pref-label-text">${esc(r.title)}</div><div class="pref-hint">${sub}</div></div></div>
      <button type="button" class="pref-toggle ${r.enabled ? 'on' : 'off'}" role="switch" aria-checked="${r.enabled}" aria-label="Activer le rappel ${esc(r.title)}" onclick="event.stopPropagation();toggleReminder('${r.id}')">${r.enabled ? 'Activé' : 'Désactivé'}</button>
    </div>`;
  }).join('');
  return `<div>
    <div class="account-section-title">Rappels</div>
    <div class="pref-card">
      ${rows || `<div class="pref-row"><div class="pref-hint">Aucun rappel pour l’instant.</div></div>`}
      <div class="pref-row"><button type="button" class="reminder-add" onclick="openReminder()">+ Ajouter un rappel</button></div>
    </div>
    <div class="hf-hint reminders-note">${on
      ? 'Les rappels sonnent tant que l’app est ouverte ou active en arrière-plan.'
      : 'Active les notifications dans les préférences pour recevoir tes rappels.'}</div>
    ${on ? `<button type="button" class="pref-edit reminder-test" onclick="sendTestNotification()">Envoyer une notification test</button>` : ''}
  </div>`;
}

function toggleReminder(id) {
  const r = (DB.reminders || []).find(x => x.id === id); if (!r) return;
  r.enabled = !r.enabled;
  saveData(); scheduleLocalNotifications();
  if (activePage === 'account') renderAccount();
}

/* ── Formulaire de rappel ── */
let rf = null;

function openReminder(id) {
  const r = id ? (DB.reminders || []).find(x => x.id === id) : null;
  if (id && !r) return;
  rf = r
    ? { mode:'edit', id:r.id, title:r.title, body:r.body || '', time:`${pad2(r.hour)}:${pad2(r.minute)}`, days:r.days.slice(), habitId:r.habitId || '', enabled:r.enabled !== false }
    : { mode:'create', id:null, title:'', body:'', time:'09:00', days:ALL_DAYS.slice(), habitId:'', enabled:true };
  document.getElementById('reminderFormTitle').textContent = r ? 'Modifier le rappel' : 'Nouveau rappel';
  renderReminderForm();
  document.querySelector('#reminderModal .modal-card').scrollTop = 0;
  document.getElementById('reminderModal').classList.add('open');
  if (!r) setTimeout(() => { const el = document.getElementById('rfTitle'); if (el) el.focus(); }, 120);
}
function closeReminder() {
  rf = null;
  document.getElementById('reminderModal').classList.remove('open');
}
function rfInput(key, val) { if (rf) rf[key] = val; }
function rfSet(key, val)   { if (!rf) return; rf[key] = val; renderReminderForm(); }
function rfToggleDay(d) {
  if (!rf) return;
  rf.days = rf.days.includes(d) ? rf.days.filter(x => x !== d) : [...rf.days, d];
  renderReminderForm();
}
function rfDays(preset) {
  if (!rf) return;
  rf.days = preset === 'week' ? WEEKDAYS.slice() : ALL_DAYS.slice();
  renderReminderForm();
}

function renderReminderForm() {
  const el = document.getElementById('reminderFormBody');
  if (!el || !rf) return;
  const isEdit = rf.mode === 'edit';
  const habitOpts = HABITS.filter(h => h.type !== 'bad')
    .map(h => `<option value="${h.id}"${rf.habitId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('');
  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="rfTitle">Titre</label>
      <input id="rfTitle" class="pseudo-input hf-input" type="text" maxlength="40" placeholder="Ex. 💊 Vitamines" value="${esc(rf.title)}" oninput="rfInput('title',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfBody">Message <span class="hf-opt">(facultatif)</span></label>
      <input id="rfBody" class="pseudo-input hf-input" type="text" maxlength="80" placeholder="Ex. N’oublie pas !" value="${esc(rf.body)}" oninput="rfInput('body',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfTime">Heure</label>
      <input id="rfTime" class="sleep-time-input" type="time" value="${esc(rf.time)}" oninput="rfInput('time',this.value)" onchange="rfInput('time',this.value)">
    </div>
    <div class="modal-section">
      <label class="modal-label">Jours</label>
      <div class="hf-days" role="group" aria-label="Jours du rappel">
        ${DOW_ORDER.map(d => `<button type="button" class="hf-day${rf.days.includes(d) ? ' selected' : ''}" aria-pressed="${rf.days.includes(d)}" aria-label="${DAY_FULL[d]}" onclick="rfToggleDay(${d})">${DOW_LETTER[d]}</button>`).join('')}
      </div>
      <div class="hf-presets">
        <button type="button" class="hf-link" onclick="rfDays('all')">Tous les jours</button>
        <button type="button" class="hf-link" onclick="rfDays('week')">Lun – Ven</button>
      </div>
    </div>
    <div class="modal-section">
      <label class="modal-label" for="rfHabit">Habitude liée <span class="hf-opt">(facultatif)</span></label>
      <select id="rfHabit" class="pseudo-input hf-input" onchange="rfInput('habitId',this.value)">
        <option value="">Aucune</option>
        ${habitOpts}
      </select>
      <div class="hf-hint">Si l’habitude est déjà faite à l’heure du rappel, la notification est ignorée.</div>
    </div>
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Rappel actif</div>
        <div class="pref-hint">Désactive-le sans le supprimer</div>
      </div>
      <button type="button" class="pref-toggle ${rf.enabled ? 'on' : 'off'}" role="switch" aria-checked="${rf.enabled}" aria-label="Rappel actif" onclick="rfSet('enabled',!rf.enabled)">${rf.enabled ? 'Activé' : 'Désactivé'}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveReminder()">${isEdit ? 'Enregistrer' : 'Créer le rappel'}</button>
      ${isEdit ? `<button type="button" class="modal-reset-btn" onclick="deleteReminder()">${icon('trash')} Supprimer le rappel</button>` : ''}
    </div>`;
}

function saveReminder() {
  if (!rf) return;
  const title = rf.title.trim();
  if (!title) { showToast('Donne un titre au rappel', 2500, 'alert'); return; }
  const m = /^(\d{1,2}):(\d{2})$/.exec(rf.time || '');
  if (!m || +m[1] > 23 || +m[2] > 59) { showToast('Choisis une heure valide', 2500, 'alert'); return; }
  if (rf.days.length === 0) { showToast('Choisis au moins un jour', 2800, 'alert'); return; }

  const data = { title, body: rf.body.trim(), hour: +m[1], minute: +m[2], days: rf.days.slice(), habitId: rf.habitId || '', enabled: rf.enabled };
  if (!Array.isArray(DB.reminders)) DB.reminders = [];
  if (rf.mode === 'create') {
    DB.reminders.push({ id: 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...data });
  } else {
    const r = DB.reminders.find(x => x.id === rf.id);
    if (r) Object.assign(r, data);
  }
  saveData();
  scheduleLocalNotifications();
  closeReminder();
  if (activePage === 'account') renderAccount();
  showToast(notifsGranted() ? 'Rappel enregistré' : 'Rappel enregistré : active les notifications pour le recevoir', notifsGranted() ? 2200 : 3600, 'bell');
}

function deleteReminder() {
  if (!rf || rf.mode !== 'edit') return;
  const r = (DB.reminders || []).find(x => x.id === rf.id);
  if (!r) { closeReminder(); return; }
  if (!confirm(`Supprimer le rappel « ${r.title} » ?`)) return;
  DB.reminders = DB.reminders.filter(x => x.id !== r.id);
  saveData(); scheduleLocalNotifications();
  closeReminder();
  if (activePage === 'account') renderAccount();
  showToast('Rappel supprimé', 2200, 'trash');
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

/* ═══════════ Méditation ═══════════ */
const MED_DESC = {
  silence: 'Un silence apaisé, ponctué par une cloche au début et à la fin.',
  rain:    'Une pluie douce et continue pour couvrir les bruits alentour.',
  ocean:   'Des vagues lentes qui montent et descendent, comme une respiration.',
  drone:   'Une nappe grave et chaude, sans rythme, pour se poser.',
};
let med = { dur: 600, amb: 'silence', state: 'idle', remaining: 600, endAt: 0, iv: null, nodes: null, wake: null };

function medElapsed() {
  const rem = med.state === 'running' ? Math.max(0, Math.ceil((med.endAt - Date.now()) / 1000)) : med.remaining;
  return Math.max(0, med.dur - rem);
}
function medTodayMinutes() { return Math.round((DB.meditation || {})[today()] || 0); }

function openMeditation() {
  document.getElementById('meditationOverlay').classList.add('open');
  if (med.state === 'running' || med.state === 'paused') { updateMedUi(); return; }
  med.state = 'idle'; med.remaining = med.dur;
  updateMedUi();
}
function closeMeditation() {
  if ((med.state === 'running' || med.state === 'paused') && medElapsed() >= 30) {
    if (!confirm('Arrêter la session en cours ?')) return;
  }
  if (med.state === 'running' || med.state === 'paused') stopMeditation(true);
  document.getElementById('meditationOverlay').classList.remove('open');
}
function selectMedDuration(min) {
  if (med.state === 'running' || med.state === 'paused') return;
  med.dur = min * 60; med.remaining = med.dur; med.state = 'idle';
  updateMedUi();
}
function selectMedAmbience(a) {
  med.amb = a;
  if (med.state === 'running') startAmbience(a);
  updateMedUi();
}
function toggleMeditation() {
  if (med.state === 'idle' || med.state === 'done') { med.remaining = med.dur; medRun(true); }
  else if (med.state === 'running') medPause();
  else if (med.state === 'paused') medRun(false);
}
function medRun(withBell) {
  clearInterval(med.iv);
  med.state = 'running';
  med.endAt = Date.now() + med.remaining * 1000;
  if (withBell) playBell();
  startAmbience(med.amb);
  med.iv = setInterval(medTick, 250);
  acquireWake();
  updateMedUi();
}
function medPause() {
  med.remaining = Math.max(1, Math.ceil((med.endAt - Date.now()) / 1000));
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'paused';
  updateMedUi();
}
function medTick() {
  const rem = (med.endAt - Date.now()) / 1000;
  if (rem <= 0) { completeMeditation(); return; }
  med.remaining = Math.ceil(rem);
  updateMedClock();
}
function completeMeditation() {
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'done'; med.remaining = 0;
  playBell(); setTimeout(() => playBell(), 2600);
  const minutes = med.dur / 60;
  logMeditation(minutes);
  if (DB.meditationXpDay !== today()) {
    DB.meditationXpDay = today(); giveXP(10);
    showToast(`Session terminée : ${minutes} min · +10 XP`, 3600, 'zen');
  } else {
    showToast(`Session terminée : ${minutes} min`, 3000, 'zen');
  }
  saveData(); checkAchievements();
  updateMedUi();
  if (activePage === 'report') renderReport();
}
// early = true : l'utilisateur interrompt ; on enregistre le temps réellement médité.
function stopMeditation(early) {
  if (med.state !== 'running' && med.state !== 'paused') return;
  if (early === true) {
    const mins = Math.floor(medElapsed() / 60);
    if (mins >= 1) { logMeditation(mins); saveData(); checkAchievements(); }
  }
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'idle'; med.remaining = med.dur;
  updateMedUi();
}
function logMeditation(minutes) {
  if (!DB.meditation) DB.meditation = {};
  DB.meditation[today()] = Math.round(((DB.meditation[today()] || 0) + minutes) * 10) / 10;
  saveData();
}

/* ── Interface ── */
function medFmt(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function updateMedClock() {
  const clock = document.getElementById('medClock'); if (clock) clock.textContent = medFmt(med.remaining);
  const ring = document.getElementById('medRing');
  if (ring) {
    const total = med.dur;
    const progress = med.state === 'running'
      ? 1 - Math.max(0, (med.endAt - Date.now()) / 1000) / total
      : (med.state === 'done' ? 1 : 1 - med.remaining / total);
    ring.style.strokeDashoffset = String(880 * (1 - Math.min(1, Math.max(0, med.state === 'idle' ? 0 : progress))));
  }
}
function updateMedUi() {
  const running = med.state === 'running', paused = med.state === 'paused', busy = running || paused;
  document.querySelectorAll('#medDurRow .breath-pattern-btn').forEach(b => {
    const on = Number(b.dataset.min) * 60 === med.dur;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); b.disabled = busy;
  });
  document.querySelectorAll('#medAmbRow .med-amb-btn').forEach(b => {
    const on = b.dataset.amb === med.amb;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
  });
  const stage = document.getElementById('medStage');
  if (stage) stage.classList.toggle('med-running', running);
  const status = document.getElementById('medStatus');
  if (status) status.textContent = running ? 'En cours' : paused ? 'En pause' : med.state === 'done' ? 'Session terminée ✓' : 'Prêt';
  const desc = document.getElementById('medDesc');
  if (desc) desc.textContent = (MED_DESC[med.amb] || '') + (DB.profile.soundEnabled === false ? ' (Les sons sont désactivés dans ton compte.)' : '');
  const btn = document.getElementById('medStartBtn');
  if (btn) {
    btn.innerHTML = running ? 'Pause' : paused ? `${icon('play')} Reprendre` : med.state === 'done' ? `${icon('play')} Recommencer` : `${icon('play')} Commencer`;
    btn.classList.toggle('active', running);
  }
  const stop = document.getElementById('medStopBtn'); if (stop) stop.classList.toggle('hidden', !busy);
  const today_ = document.getElementById('medTodayMin'); if (today_) today_.textContent = medTodayMinutes();
  updateMedClock();
}

/* ── Écran toujours allumé pendant la séance ── */
async function acquireWake() { try { if ('wakeLock' in navigator) med.wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { if (med.wake) { med.wake.release(); med.wake = null; } } catch (e) {} }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (med.state === 'running') { acquireWake(); medTick(); }
});

/* ── Sons : cloche et ambiances (Web Audio, aucun fichier) ── */
function playBell(scale) {
  if (!DB.profile.soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime; const base = 196 * (scale || 1);
    [[1, 0.55, 7], [2.76, 0.28, 4.5], [5.4, 0.14, 3], [8.93, 0.07, 2]].forEach(([ratio, amp, dec]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + dec + 0.1);
    });
  } catch (e) {}
}
function _noiseBuffer(kind) {
  const sr = audioCtx.sampleRate, len = sr * 4;
  const buf = audioCtx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
  if (kind === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;  b4 = 0.55 * b4 + w * 0.5329522;   b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
  }
  return buf;
}
function startAmbience(kind) {
  stopAmbience(true);
  if (!audioCtx || kind === 'silence' || !DB.profile.soundEnabled) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(1, t + 3);
    master.connect(audioCtx.destination);
    const stops = [];
    const noise = type => { const s = audioCtx.createBufferSource(); s.buffer = _noiseBuffer(type); s.loop = true; stops.push(s); return s; };
    const filt = (type, f) => { const b = audioCtx.createBiquadFilter(); b.type = type; b.frequency.value = f; return b; };
    const gain = v => { const g = audioCtx.createGain(); g.gain.value = v; return g; };
    if (kind === 'rain') {
      const s = noise('pink'), hp = filt('highpass', 900), lp = filt('lowpass', 7000), g = gain(0.5);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); s.start();
    } else if (kind === 'ocean') {
      const s = noise('brown'), lp = filt('lowpass', 650), swell = gain(0.45);
      const lfo = audioCtx.createOscillator(), lfoG = gain(0.35);
      lfo.type = 'sine'; lfo.frequency.value = 0.09; stops.push(lfo);
      lfo.connect(lfoG); lfoG.connect(swell.gain);
      s.connect(lp); lp.connect(swell); swell.connect(master); s.start(); lfo.start();
    } else if (kind === 'drone') {
      const amp = gain(0.9);
      const lfo = audioCtx.createOscillator(), lfoG = gain(0.12);
      lfo.type = 'sine'; lfo.frequency.value = 0.07; stops.push(lfo);
      lfo.connect(lfoG); lfoG.connect(amp.gain);
      [[110, 0.10, 0], [164.81, 0.07, 3], [220, 0.06, -3], [329.63, 0.025, 2]].forEach(([f, v, det]) => {
        const o = audioCtx.createOscillator(), g = gain(v);
        o.type = 'sine'; o.frequency.value = f; o.detune.value = det; stops.push(o);
        o.connect(g); g.connect(amp); o.start();
      });
      amp.connect(master); lfo.start();
    }
    med.nodes = { master, stops };
  } catch (e) {}
}
function stopAmbience(immediate) {
  const n = med.nodes; if (!n) return; med.nodes = null;
  try {
    const t = audioCtx.currentTime;
    n.master.gain.cancelScheduledValues(t);
    n.master.gain.setValueAtTime(n.master.gain.value, t);
    n.master.gain.linearRampToValueAtTime(0, t + (immediate ? 0.05 : 1.5));
    n.stops.forEach(s => { try { s.stop(t + (immediate ? 0.1 : 1.6)); } catch (e) {} });
    setTimeout(() => { try { n.master.disconnect(); } catch (e) {} }, immediate ? 200 : 1800);
  } catch (e) {}
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

/* ═══════════ Pauses (jours de repos) ═══════════ */
const PAUSE_REASONS = [
  ['sick','🤒','Malade'], ['trip','✈️','Voyage'], ['tired','😴','Épuisé'],
  ['work','💼','Trop de travail'], ['party','🎉','Soirée'], ['other','❓','Autre'],
];
const pauseReasonInfo = id => PAUSE_REASONS.find(r => r[0] === id) || PAUSE_REASONS[5];
const PAUSE_PAST_DAYS = 7;     // on peut justifier jusqu'à 7 jours en arrière
const PAUSE_FUTURE_DAYS = 30;  // et en planifier jusqu'à 30 jours à l'avance
const PAUSE_MAX_RANGE = 14;

function isPaused(k) { return !!(DB.pauses && DB.pauses[k]); }
function pauseQuota() { const q = DB.profile.pauseQuota; return Number.isFinite(q) ? q : 3; }
function pausesInMonth(ym) { return Object.keys(DB.pauses || {}).filter(k => k.startsWith(ym)).length; }
function pausesLeft(ym) { return Math.max(0, pauseQuota() - pausesInMonth(ym)); }
function weekPausedCount(wm) {
  const s = parseDate(wm); let n = 0;
  for (let i = 0; i < 7; i++) if (isPaused(fmtDate(addDays(s, i)))) n++;
  return n;
}
function pausedDayNote() {
  return `<div class="empty-note pause-note"><span class="pause-note-ico">⏸</span><br>Jour de pause<br>Tes séries sont gelées. Profite de ta journée.</div>`;
}

function renderPauseBanner() {
  const el = document.getElementById('pauseBanner'); if (!el) return;
  const t = today(); const p = (DB.pauses || {})[t];
  if (p) {
    const r = pauseReasonInfo(p.reason);
    el.innerHTML = `<div class="pause-banner"><span class="pause-ico" aria-hidden="true">⏸</span>
      <div class="pause-txt"><b>Jour de pause</b><span>${r[1]} ${r[2]} · séries gelées</span></div>
      <button type="button" class="pause-btn" onclick="removePause('${t}')">Reprendre</button></div>`;
    return;
  }
  const q = pauseQuota();
  if (q === 0 && Object.keys(DB.pauses || {}).length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `<button type="button" class="pause-pill" onclick="openPause()">⏸ Pause <span>${pausesLeft(t.slice(0, 7))}/${q} ce mois-ci</span></button>`;
}

let pf = null; // {from,to,reason}
function pauseBounds() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let min = addDays(t, -PAUSE_PAST_DAYS);
  const created = parseDate(DB.createdAt);
  if (created > min) min = created;
  return { min: fmtDate(min), max: fmtDate(addDays(t, PAUSE_FUTURE_DAYS)) };
}
function openPause(dateKey) {
  const t = dateKey || today();
  pf = { from: t, to: t, reason: 'sick' };
  renderPauseForm();
  document.querySelector('#pauseModal .modal-card').scrollTop = 0;
  document.getElementById('pauseModal').classList.add('open');
}
function closePause() { pf = null; document.getElementById('pauseModal').classList.remove('open'); }
function pfSet(key, val) {
  if (!pf) return;
  pf[key] = val;
  if (pf.to < pf.from) pf.to = pf.from;
  renderPauseForm();
}
function pfPreset(kind) {
  if (!pf) return;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const k = fmtDate(kind === 'yesterday' ? addDays(t, -1) : t);
  pf.from = k; pf.to = k; renderPauseForm();
}
function pauseRangeDays() {
  if (!pf || !pf.from || !pf.to) return [];
  const out = []; let d = parseDate(pf.from); const end = parseDate(pf.to);
  for (let i = 0; i < 40 && d <= end; i++) { out.push(fmtDate(d)); d = addDays(d, 1); }
  return out;
}
function pauseMonthSummary() {
  const days = pauseRangeDays().filter(k => !isPaused(k));
  const byMonth = {};
  days.forEach(k => { const ym = k.slice(0, 7); byMonth[ym] = (byMonth[ym] || 0) + 1; });
  return { days, byMonth };
}

function renderPauseForm() {
  const el = document.getElementById('pauseFormBody'); if (!el || !pf) return;
  const b = pauseBounds();
  const { days, byMonth } = pauseMonthSummary();
  const q = pauseQuota();
  const ymNow = pf.from.slice(0, 7);
  const left = pausesLeft(ymNow);
  const [yy, mm] = ymNow.split('-').map(Number);
  const monthLbl = MONTH_NAMES[mm - 1].toLowerCase();
  let status;
  const over = Object.entries(byMonth).find(([ym, n]) => n > pausesLeft(ym));
  if (days.length === 0) status = `<span class="pf-ok">Ces jours sont déjà en pause.</span>`;
  else if (over) status = `<span class="pf-bad">Quota dépassé : il reste ${pausesLeft(over[0])} jour(s) de pause en ${MONTH_NAMES[Number(over[0].slice(5)) - 1].toLowerCase()}.</span>`;
  else status = `<span class="pf-ok">${days.length} jour${days.length > 1 ? 's' : ''} de pause · il restera ${Math.max(0, left - (byMonth[ymNow] || 0))}/${q} en ${monthLbl}.</span>`;

  const list = Object.keys(DB.pauses || {}).filter(k => k >= fmtDate(addDays(parseDate(today()), -PAUSE_PAST_DAYS))).sort();
  const listHtml = list.length ? `<div class="modal-section"><label class="modal-label">Pauses récentes et à venir</label>
      <div class="pf-list">${list.map(k => {
        const r = pauseReasonInfo(DB.pauses[k].reason); const d = parseDate(k);
        return `<div class="pf-item"><span>${r[1]} ${DAY_FULL[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()} · ${r[2]}</span>
          <button type="button" class="pf-del" onclick="removePause('${k}', true)" aria-label="Retirer la pause du ${k}">${icon('trash')}</button></div>`;
      }).join('')}</div></div>` : '';

  el.innerHTML = `
    <div class="modal-section">
      <div class="hf-hint" style="margin:0 0 12px">Une pause <b>gèle tes séries</b> : ces jours ne comptent ni comme réussis, ni comme manqués.</div>
      <div class="hf-presets" style="margin:0 0 12px">
        <button type="button" class="hf-link" onclick="pfPreset('today')">Aujourd’hui</button>
        <button type="button" class="hf-link" onclick="pfPreset('yesterday')">Hier</button>
      </div>
      <div class="hf-num-grid">
        <div class="hf-num-field"><label for="pfFrom">Du</label>
          <input id="pfFrom" class="sleep-time-input" type="date" min="${b.min}" max="${b.max}" value="${pf.from}" onchange="pfSet('from',this.value||pf.from)"></div>
        <div class="hf-num-field"><label for="pfTo">Au</label>
          <input id="pfTo" class="sleep-time-input" type="date" min="${pf.from}" max="${b.max}" value="${pf.to}" onchange="pfSet('to',this.value||pf.to)"></div>
      </div>
      <div class="hf-hint pf-status" role="status">${status}</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Raison</label>
      <div class="pf-reasons" role="group" aria-label="Raison de la pause">
        ${PAUSE_REASONS.map(r => `<button type="button" class="hf-chip pf-reason${pf.reason === r[0] ? ' selected' : ''}" aria-pressed="${pf.reason === r[0]}" onclick="pfSet('reason','${r[0]}')"><span>${r[1]}</span><b>${r[2]}</b></button>`).join('')}
      </div>
    </div>
    ${listHtml}
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="savePause()">Prendre une pause</button>
    </div>`;
}

function savePause() {
  if (!pf) return;
  const b = pauseBounds();
  const all = pauseRangeDays();
  if (all.length === 0) return;
  if (all.length > PAUSE_MAX_RANGE) { showToast(`Une pause dure ${PAUSE_MAX_RANGE} jours maximum`, 3000, 'alert'); return; }
  if (all.some(k => k < b.min || k > b.max)) { showToast('Date hors de la période autorisée', 3000, 'alert'); return; }
  const { days, byMonth } = pauseMonthSummary();
  if (days.length === 0) { showToast('Ces jours sont déjà en pause', 2500, 'alert'); return; }
  for (const [ym, n] of Object.entries(byMonth)) {
    if (n > pausesLeft(ym)) {
      showToast(`Quota dépassé : ${pausesLeft(ym)} jour(s) restant(s) en ${MONTH_NAMES[Number(ym.slice(5)) - 1].toLowerCase()}`, 3500, 'alert');
      return;
    }
  }
  if (!DB.pauses) DB.pauses = {};
  days.forEach(k => { DB.pauses[k] = { reason: pf.reason }; });
  saveData();
  closePause();
  renderActivePage();
  showToast(`Pause enregistrée · ${days.length} jour${days.length > 1 ? 's' : ''}`, 2800, 'moon');
}
function removePause(k, keepOpen) {
  if (!DB.pauses || !DB.pauses[k]) return;
  delete DB.pauses[k];
  saveData();
  if (keepOpen && pf) renderPauseForm();
  renderActivePage();
  if (!keepOpen) showToast('Pause annulée', 2200);
}
function changePauseQuota(delta) {
  DB.profile.pauseQuota = Math.max(0, Math.min(10, pauseQuota() + delta));
  saveData(); renderAccount();
}
function pauseSectionHtml() {
  const q = pauseQuota(); const ym = today().slice(0, 7); const used = pausesInMonth(ym);
  return `<div>
    <div class="account-section-title">Jours de pause</div>
    <div class="pref-card">
      <div class="pref-row">
        <div class="pref-info"><span class="pref-icon">⏸</span><div><div class="pref-label-text">Quota mensuel</div><div class="pref-hint">Jours de repos qui gèlent tes séries</div></div></div>
        <div class="stepper" role="group" aria-label="Quota de pauses par mois">
          <button type="button" onclick="changePauseQuota(-1)" aria-label="Moins"${q <= 0 ? ' disabled' : ''}>−</button>
          <span aria-live="polite">${q}</span>
          <button type="button" onclick="changePauseQuota(1)" aria-label="Plus"${q >= 10 ? ' disabled' : ''}>+</button>
        </div>
      </div>
      <div class="pref-row">
        <div class="pref-hint">Ce mois-ci : ${used} / ${q} utilisé${used > 1 ? 's' : ''}</div>
        <button type="button" class="pref-edit" onclick="openPause()">Poser une pause</button>
      </div>
    </div>
  </div>`;
}

/* ═══════════ Habitudes « à éviter » ═══════════ */
const BAD_PRESETS = [
  { name:'Jeux vidéo',     emoji:'🎮', levels:'15 min, 30 min, 1 h, 2 h, +3 h' },
  { name:'Scroll',         emoji:'📱', levels:'15 min, 30 min, 1 h, +2 h' },
  { name:'Films / séries', emoji:'🎬', levels:'1, 2, +3' },
  { name:'Sucre ajouté',   emoji:'🍬', levels:'' },
  { name:'Alcool',         emoji:'🍷', levels:'' },
  { name:'Tabac',          emoji:'🚬', levels:'' },
];
function badVal(id, k) { const e = DB.habits[id]; return (e && e.vals && e.vals[k]) || ''; }
function clearBadVal(id, k) { const e = DB.habits[id]; if (e && e.vals) delete e.vals[k]; }
function parseLevels(str) {
  const seen = new Set(); const out = [];
  String(str || '').split(',').forEach(s => { const v = s.trim().slice(0, 10); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); } });
  return out;
}
function setBadLevel(id, i) {
  const h = HABITS.find(x => x.id === id); if (!h || !h.levels) return;
  const t = today(); const e = DB.habits[id]; if (!e.vals) e.vals = {};
  const wasFail = e.logs[t] === 'fail';
  if (i === 0) { delete e.logs[t]; delete e.vals[t]; if (wasFail) playSound('undo'); }
  else { e.logs[t] = 'fail'; e.vals[t] = h.levels[i - 1]; playSound('fail'); }
  saveData(); checkAchievements(); afterToggle(id);
}
function buildBadLevels(habit, t) {
  const fail = isBadFail(habit.id, t); const cur = fail ? badVal(habit.id, t) : '';
  const chips = ['Non', ...habit.levels].map((lbl, i) => {
    const sel = i === 0 ? !fail : (fail && cur === habit.levels[i - 1]);
    return `<button type="button" class="bad-chip${i === 0 ? ' bad-chip-ok' : ''}${sel ? ' sel' : ''}" aria-pressed="${sel}" onclick="setBadLevel('${habit.id}',${i})">${esc(lbl)}</button>`;
  }).join('');
  return `<div class="bad-levels" role="group" aria-label="${esc(habit.name)}">${chips}</div>`;
}
function applyBadPreset(i) {
  const p = BAD_PRESETS[i]; if (!hf || !p) return;
  hf.name = p.name; hf.emoji = p.emoji;
  hf.badMode = p.levels ? 'levels' : 'simple'; hf.levels = p.levels;
  renderHabitForm();
}

/* ═══════════ Journal du jour (note attachée à l'humeur) ═══════════ */
const JOURNAL_MAX = 600;
let journalLimit = 5;
let journalQuery = '';

function updateJournalCount() {
  const ta = document.getElementById('journalInput'), c = document.getElementById('journalCount');
  if (ta && c) c.textContent = ta.value.length;
}
function journalKeys() { return Object.keys(DB.journal || {}).filter(k => DB.journal[k]).sort().reverse(); }
function journalDateLabel(k) {
  const d = parseDate(k); const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${DAY_FULL[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}${y}`;
}
function journalEntryHtml(k) {
  const mood = DB.moods[k]; const f = (DB.profile.moodFeelings || {})[k];
  const tags = f ? f.split(',').slice(0, 4).map(t => `<span class="journal-tag">${esc(t)}</span>`).join('') : '';
  return `<div class="journal-entry">
    <div class="journal-head">
      <span class="journal-emoji" aria-hidden="true">${MOOD_EMOJIS[mood] || '📝'}</span>
      <div class="journal-date">${journalDateLabel(k)}${mood ? ` · <span class="journal-mood">${MOOD_LABELS[mood]}</span>` : ''}</div>
      <div class="journal-actions">
        <button type="button" onclick="openMoodModal('${k}',true)" aria-label="Modifier la note du ${k}">${icon('edit')}</button>
        <button type="button" onclick="deleteJournalNote('${k}')" aria-label="Supprimer la note du ${k}">${icon('trash')}</button>
      </div>
    </div>
    ${tags ? `<div class="journal-tags">${tags}</div>` : ''}
    <div class="journal-text">${esc(DB.journal[k])}</div>
  </div>`;
}
function journalListHtml() {
  let keys = journalKeys();
  const q = journalQuery.trim().toLowerCase();
  if (q) keys = keys.filter(k => DB.journal[k].toLowerCase().includes(q));
  if (!keys.length) return `<div class="journal-empty">${q ? 'Aucune note ne correspond à ta recherche.' : 'Aucune note pour l’instant. Écris-en une quand tu enregistres ton humeur.'}</div>`;
  const shown = q ? keys : keys.slice(0, journalLimit);
  const more = !q && keys.length > shown.length
    ? `<button type="button" class="journal-more" onclick="moreJournal()">Voir plus (${keys.length - shown.length})</button>` : '';
  return shown.map(journalEntryHtml).join('') + more;
}
function buildJournalHtml() {
  const n = journalKeys().length;
  const search = n >= 3 ? `<input id="journalSearch" class="pseudo-input journal-search" type="search" placeholder="Rechercher dans le journal" value="${esc(journalQuery)}" aria-label="Rechercher dans le journal" oninput="searchJournal(this.value)">` : '';
  return `<div class="report-card" id="journalCard">
    <div class="report-card-header">
      <div class="report-card-title">Journal</div>
      <div class="report-period-badge">${n} note${n > 1 ? 's' : ''}</div>
    </div>
    ${search}
    <div id="journalList">${journalListHtml()}</div>
  </div>`;
}
function searchJournal(v) {
  journalQuery = v || '';
  const el = document.getElementById('journalList'); if (el) el.innerHTML = journalListHtml();
}
function moreJournal() { journalLimit += 10; const el = document.getElementById('journalList'); if (el) el.innerHTML = journalListHtml(); }
function deleteJournalNote(k) {
  if (!DB.journal || !DB.journal[k]) return;
  if (!confirm(`Supprimer la note du ${journalDateLabel(k)} ?\n\nTon humeur de ce jour est conservée.`)) return;
  delete DB.journal[k]; saveData();
  renderActivePage();
  showToast('Note supprimée', 2000, 'trash');
}

/* ═══════════ Saisons ═══════════ */
const SEASON_DEFS = [
  { key:'winter', name:'Hiver',     emoji:'❄️', months:[11,0,1] },
  { key:'spring', name:'Printemps', emoji:'🌸', months:[2,3,4] },
  { key:'summer', name:'Été',       emoji:'☀️', months:[5,6,7] },
  { key:'autumn', name:'Automne',   emoji:'🍂', months:[8,9,10] },
];
const SEASON_RANKS = [
  { xp:0,    name:'Éveil' },     { xp:300,  name:'Élan' },     { xp:700,  name:'Rythme' },
  { xp:1200, name:'Flux' },      { xp:1800, name:'Cap' },      { xp:2500, name:'Ascension' },
  { xp:3300, name:'Sommet' },    { xp:4200, name:'Éclat' },    { xp:5200, name:'Maîtrise' },
  { xp:6300, name:'Légende' },   { xp:7500, name:'Mythe' },    { xp:9000, name:'Éternité' },
];
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function seasonLabel(def, startYear) {
  return def.key === 'winter' ? `${def.name} ${startYear}/${String(startYear + 1).slice(2)}` : `${def.name} ${startYear}`;
}
function seasonOf(date) {
  const m = date.getMonth(), y = date.getFullYear();
  const def = SEASON_DEFS.find(s => s.months.includes(m));
  const startYear = (def.key === 'winter' && m < 2) ? y - 1 : y;
  const start = new Date(startYear, def.months[0], 1);
  const end = new Date(startYear, def.months[0] + 3, 0);
  return { id: `${def.key}-${startYear}`, def, start, end, label: seasonLabel(def, startYear) };
}
function seasonFromId(id) {
  const [key, y] = String(id).split('-'); const def = SEASON_DEFS.find(s => s.key === key);
  return def ? { def, label: seasonLabel(def, Number(y)) } : { def: SEASON_DEFS[0], label: id };
}
function seasonRank(xp) {
  xp = xp || 0; let i = 0;
  SEASON_RANKS.forEach((r, idx) => { if (xp >= r.xp) i = idx; });
  const cur = SEASON_RANKS[i], nxt = SEASON_RANKS[i + 1] || null;
  return { index: i, rank: i + 1, roman: ROMAN[i], name: cur.name, next: nxt,
    pct: nxt ? Math.round((xp - cur.xp) / (nxt.xp - cur.xp) * 100) : 100, needed: nxt ? nxt.xp - xp : 0 };
}
function currentSeasonXp() { return (DB.seasonXp || {})[seasonOf(new Date()).id] || 0; }
// Appelé par giveXP : crédite la saison en cours et annonce un changement de rang.
function addSeasonXp(amount) {
  if (!(amount > 0)) return;
  if (!DB.seasonXp) DB.seasonXp = {};
  const id = seasonOf(new Date()).id;
  const before = seasonRank(DB.seasonXp[id] || 0).rank;
  DB.seasonXp[id] = (DB.seasonXp[id] || 0) + amount;
  const after = seasonRank(DB.seasonXp[id]);
  if (after.rank > before) {
    setTimeout(() => { playSound('levelup'); showToast(`Saison : rang ${after.roman} · ${after.name}`, 4000, 'star'); }, 1800);
  }
}
function seasonCardHtml() {
  const s = seasonOf(new Date()); const xp = currentSeasonXp(); const r = seasonRank(xp);
  const daysLeft = Math.max(0, Math.round((s.end - midnight()) / 86400000));
  const past = Object.keys(DB.seasonXp || {}).filter(id => id !== s.id).sort().reverse().slice(0, 6);
  const pastHtml = past.length ? `<div class="season-past"><div class="season-past-title">Saisons passées</div>${past.map(id => {
    const si = seasonFromId(id); const pr = seasonRank(DB.seasonXp[id]);
    return `<div class="season-past-row"><span>${si.def.emoji} ${esc(si.label)}</span><span>Rang ${pr.roman} · ${pr.name} · ${fmtNum(DB.seasonXp[id])} XP</span></div>`;
  }).join('')}</div>` : '';
  return `<div class="season-card">
    <div class="season-top">
      <div class="season-emoji" aria-hidden="true">${s.def.emoji}</div>
      <div class="season-main">
        <div class="season-label">Saison · ${esc(s.label)}</div>
        <div class="season-rank">Rang ${r.roman} <span>${r.name}</span></div>
      </div>
      <div class="season-left"><b>${daysLeft}</b><span>jour${daysLeft > 1 ? 's' : ''}<br>restant${daysLeft > 1 ? 's' : ''}</span></div>
    </div>
    <div class="season-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.pct}" aria-label="Progression vers le rang suivant"><div style="width:${r.pct}%"></div></div>
    <div class="season-foot"><span>${fmtNum(xp)} XP cette saison</span><span>${r.next ? `encore ${fmtNum(r.needed)} pour le rang ${ROMAN[r.index + 1]}` : 'Rang maximal !'}</span></div>
    ${pastHtml}
  </div>`;
}

/* ═══════════ Défis ═══════════ */
const CHAL_DURATIONS = [7, 14, 21, 30, 60, 90];
const CHAL_MAX_ACTIVE = 5;
let achTab = 'challenges';
let _chalBusy = false;

function setAchTab(t) { achTab = t; renderAchievements(); }
function wonChallenges() { return (DB.challenges || []).filter(c => c.status === 'won'); }

// Évalue un défi : jours réussis, jours restants possibles, état.
function evalChallenge(c, h) {
  const t = midnight(), start = parseDate(c.start), todayKey = today();
  let success = 0, activeTotal = 0, pending = 0;
  for (let i = 0; i < c.days; i++) {
    const d = addDays(start, i), k = fmtDate(d);
    if (!isDayActive(h, d)) continue;
    activeTotal++;
    if (d > t) { pending++; continue; }
    const isToday = k === todayKey;
    if (h.type === 'bad') {
      if (isBadFail(h.id, k)) continue;
      if (isToday) pending++; else success++;          // un jour « propre » ne compte qu'une fois terminé
    } else if (isHabitDoneOn(h, k, d)) success++;
    else if (isToday) pending++;
  }
  const required = c.required === 'all' ? activeTotal : Math.min(Number(c.required) || 1, activeTotal);
  const dayNo = Math.min(c.days, Math.max(1, Math.round((t - start) / 86400000) + 1));
  const over = t > addDays(start, c.days - 1);
  let state = 'active';
  if (activeTotal === 0) { if (over) state = 'void'; }
  else if (success >= required) state = 'won';
  else if (success + pending < required) state = 'failed';
  return { success, pending, required, activeTotal, dayNo, over, state, daysLeft: Math.max(0, c.days - dayNo) };
}

function updateChallenges() {
  if (_chalBusy || !Array.isArray(DB.challenges)) return false;
  _chalBusy = true;
  let changed = false;
  try {
    let delay = 0;
    DB.challenges.forEach(c => {
      if (c.status !== 'active') return;
      const h = HABITS.find(x => x.id === c.habitId);
      if (!h) { c.status = 'abandoned'; c.endedOn = today(); changed = true; return; }
      const ev = evalChallenge(c, h);
      if (ev.state === 'active') return;
      c.status = ev.state; c.endedOn = today(); changed = true;
      if (ev.state === 'won') {
        giveXP(c.reward);
        setTimeout(() => { playSound('fanfare'); launchConfetti(); showToast(`Défi relevé : ${c.title} · +${c.reward} XP`, 4200, 'trophy'); }, 500 + delay);
        delay += 2600;
      } else if (ev.state === 'failed') {
        setTimeout(() => showToast(`Défi manqué : ${c.title}`, 3600, 'alert'), 500 + delay);
        delay += 2600;
      }
    });
    if (changed) { saveData(); checkAchievements(); }
  } finally { _chalBusy = false; }
  return changed;
}

function chalTitle(h, days, mode, min) {
  if (h.type === 'bad') return `${days} jours sans ${h.name}`;
  if (mode === 'min') return `${h.name} · ${min} fois en ${days} jours`;
  return `${h.name} · ${days} jours d’affilée`;
}
function chalActiveDays(h, days) {
  const start = midnight(); let n = 0;
  for (let i = 0; i < days; i++) if (isDayActive(h, addDays(start, i))) n++;
  return n;
}
function chalRewardFor(required) { return Math.round(10 + required * 3); }
function fmtDay(k) { const d = parseDate(k); return `${d.getDate()} ${MONTH_SHORT[d.getMonth()].toLowerCase()}`; }

function chalCardHtml(c) {
  const h = HABITS.find(x => x.id === c.habitId);
  if (!h) return '';
  const ev = evalChallenge(c, h);
  const pct = ev.required > 0 ? Math.min(100, Math.round(ev.success / ev.required * 100)) : 0;
  const endK = fmtDate(addDays(parseDate(c.start), c.days - 1));
  const sub = ev.daysLeft === 0 ? `Dernier jour · fin le ${fmtDay(endK)}` : `Jour ${ev.dayNo} / ${c.days} · fin le ${fmtDay(endK)}`;
  return `<div class="chal-card" style="--c:${esc(c.color || h.color)}">
    <div class="chal-top">
      <div class="chal-emoji" aria-hidden="true">${esc(c.emoji || '🎯')}</div>
      <div class="chal-main"><div class="chal-title">${esc(c.title)}</div><div class="chal-sub">${sub}</div></div>
      <button type="button" class="chal-x" onclick="abandonChallenge('${c.id}')" aria-label="Abandonner le défi ${esc(c.title)}">✕</button>
    </div>
    <div class="chal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(c.title)}"><div style="width:${pct}%"></div></div>
    <div class="chal-foot"><span><b>${ev.success}</b> / ${ev.required} jours</span><span>+${c.reward} XP à la clé</span></div>
  </div>`;
}
function chalHistoryRow(c) {
  const st = { won: ['✓', 'Relevé', 'ok'], failed: ['✗', 'Manqué', 'ko'], abandoned: ['–', 'Abandonné', 'na'], void: ['–', 'Annulé', 'na'] }[c.status] || ['–', '', 'na'];
  return `<div class="chal-hist ${st[2]}"><span class="chal-hist-ico">${st[0]}</span>
    <div class="chal-hist-main"><div>${esc(c.emoji || '🎯')} ${esc(c.title)}</div><div class="chal-hist-sub">${st[1]} · ${fmtDay(c.start)} → ${fmtDay(c.endedOn || c.start)}${c.status === 'won' ? ` · +${c.reward} XP` : ''}</div></div></div>`;
}
function challengesTabHtml() {
  const list = DB.challenges || [];
  const active = list.filter(c => c.status === 'active');
  const done = list.filter(c => c.status !== 'active').sort((a, b) => (b.endedOn || '').localeCompare(a.endedOn || '')).slice(0, 8);
  const full = active.length >= CHAL_MAX_ACTIVE;
  const wonN = wonChallenges().length;
  return `${seasonCardHtml()}
    <div class="ach-section">
      <div class="chal-head">
        <div class="account-section-title" style="margin:0">Défis en cours</div>
        <button type="button" class="pref-edit" onclick="openChallengeForm()"${full ? ' disabled' : ''}>+ Nouveau défi</button>
      </div>
      ${active.length ? `<div class="chal-list">${active.map(chalCardHtml).join('')}</div>`
        : `<div class="empty-note chal-empty">Lance-toi un défi : « 30 jours sans scroller », « Gym 12 fois en 30 jours »…<br>Chaque défi relevé rapporte de l’XP de saison et des succès.</div>`}
      ${full ? `<div class="hf-hint">Maximum ${CHAL_MAX_ACTIVE} défis en cours.</div>` : ''}
    </div>
    ${done.length ? `<div class="ach-section"><div class="chal-head"><div class="account-section-title" style="margin:0">Historique · ${wonN} relevé${wonN > 1 ? 's' : ''}</div>
      <button type="button" class="hf-link" onclick="clearChallengeHistory()">Effacer</button></div>
      <div class="chal-hist-list">${done.map(chalHistoryRow).join('')}</div></div>` : ''}`;
}

/* ── Formulaire de création ── */
let cf = null;
function chalCandidates() { return HABITS.filter(h => h.type !== 'weekly' && !(DB.challenges || []).some(c => c.status === 'active' && c.habitId === h.id)); }
function openChallengeForm() {
  const cands = chalCandidates();
  if ((DB.challenges || []).filter(c => c.status === 'active').length >= CHAL_MAX_ACTIVE) { showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`, 2800, 'alert'); return; }
  if (!cands.length) { showToast('Toutes tes habitudes ont déjà un défi en cours', 3200, 'alert'); return; }
  const first = cands.find(h => h.type === 'bad') || cands[0];
  cf = { habitId: first.id, days: 30, mode: 'all', min: 20, title: '', titleTouched: false };
  renderChallengeForm();
  document.querySelector('#challengeModal .modal-card').scrollTop = 0;
  document.getElementById('challengeModal').classList.add('open');
}
function closeChallengeForm() { cf = null; document.getElementById('challengeModal').classList.remove('open'); }
function cfSet(key, val) {
  if (!cf) return;
  cf[key] = val;
  const h = HABITS.find(x => x.id === cf.habitId);
  if (h && h.type === 'bad') cf.mode = 'all';
  renderChallengeForm();
}
function cfInput(key, val) { if (cf) { cf[key] = val; if (key === 'title') cf.titleTouched = true; } }
function cfDuration(v) { const n = parseInt(v, 10); if (cf && Number.isFinite(n)) { cf.days = Math.max(3, Math.min(365, n)); } }
function cfAutoTitle() {
  const h = HABITS.find(x => x.id === cf.habitId); if (!h) return '';
  return chalTitle(h, cf.days, cf.mode, Math.min(cf.min, cf.days));
}
function renderChallengeForm() {
  const el = document.getElementById('challengeFormBody'); if (!el || !cf) return;
  const cands = chalCandidates();
  const h = HABITS.find(x => x.id === cf.habitId) || cands[0];
  const isBad = h.type === 'bad';
  const minV = Math.min(Math.max(1, Number(cf.min) || 1), cf.days);
  const activeDays = chalActiveDays(h, cf.days);
  const required = cf.mode === 'all' || isBad ? activeDays : Math.min(minV, activeDays);
  const title = cf.titleTouched ? cf.title : cfAutoTitle();
  el.innerHTML = `
    <div class="modal-section">
      <label class="modal-label" for="cfHabit">Habitude</label>
      <select id="cfHabit" class="pseudo-input hf-input" onchange="cfSet('habitId',this.value)">
        ${cands.map(x => `<option value="${x.id}"${x.id === h.id ? ' selected' : ''}>${esc(x.emoji || '')} ${esc(x.name)}${x.type === 'bad' ? ' (à éviter)' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="modal-section">
      <label class="modal-label">Durée</label>
      <div class="hf-days cf-durations" role="group" aria-label="Durée du défi">
        ${CHAL_DURATIONS.map(d => `<button type="button" class="hf-day${cf.days === d ? ' selected' : ''}" aria-pressed="${cf.days === d}" onclick="cfSet('days',${d})">${d}</button>`).join('')}
      </div>
      <div class="hf-hint">jours, à partir d’aujourd’hui ·
        <label for="cfDays" class="cf-custom">autre :</label>
        <input id="cfDays" class="pseudo-input cf-days-input" type="number" min="3" max="365" inputmode="numeric" value="${cf.days}" onchange="cfDuration(this.value);cfSet('days',cf.days)"> j</div>
    </div>
    <div class="modal-section">
      <label class="modal-label">Objectif</label>
      ${isBad
        ? `<div class="hf-fixed">Aucun écart pendant ${cf.days} jours</div><div class="hf-hint">Un seul écart et le défi est manqué.</div>`
        : `<div class="hf-seg" role="group" aria-label="Objectif">
            <button type="button" class="hf-chip hf-kind${cf.mode === 'all' ? ' selected' : ''}" aria-pressed="${cf.mode === 'all'}" onclick="cfSet('mode','all')"><b>Chaque jour</b><span>Tous les jours actifs</span></button>
            <button type="button" class="hf-chip hf-kind${cf.mode === 'min' ? ' selected' : ''}" aria-pressed="${cf.mode === 'min'}" onclick="cfSet('mode','min')"><b>Au moins…</b><span>Un nombre de jours</span></button>
          </div>
          ${cf.mode === 'min' ? `<div class="cf-min"><label for="cfMin">Réussir au moins</label>
            <input id="cfMin" class="pseudo-input cf-days-input" type="number" min="1" max="${cf.days}" inputmode="numeric" value="${minV}" onchange="cfSet('min',Math.max(1,parseInt(this.value,10)||1))"> jours sur ${cf.days}</div>` : ''}`}
    </div>
    <div class="modal-section">
      <label class="modal-label" for="cfTitle">Titre</label>
      <input id="cfTitle" class="pseudo-input hf-input" type="text" maxlength="50" value="${esc(title)}" oninput="cfInput('title',this.value)">
      <div class="hf-hint">Récompense : <b>+${chalRewardFor(required)} XP</b> (et autant d’XP de saison) si tu le relèves.</div>
    </div>
    <div class="hf-actions"><button type="button" class="modal-save-btn" onclick="saveChallenge()">Lancer le défi</button></div>`;
}
function saveChallenge() {
  if (!cf) return;
  const h = HABITS.find(x => x.id === cf.habitId); if (!h) return;
  if ((DB.challenges || []).filter(c => c.status === 'active').length >= CHAL_MAX_ACTIVE) { showToast(`Maximum ${CHAL_MAX_ACTIVE} défis en cours`, 2800, 'alert'); return; }
  if ((DB.challenges || []).some(c => c.status === 'active' && c.habitId === h.id)) { showToast('Cette habitude a déjà un défi en cours', 3000, 'alert'); return; }
  const days = cf.days;
  if (!(days >= 3 && days <= 365)) { showToast('Durée : entre 3 et 365 jours', 2800, 'alert'); return; }
  const mode = h.type === 'bad' ? 'all' : cf.mode;
  const min = Math.min(Math.max(1, Number(cf.min) || 1), days);
  const activeDays = chalActiveDays(h, days);
  if (activeDays === 0) { showToast('Cette habitude n’est active aucun de ces jours', 3200, 'alert'); return; }
  const required = mode === 'all' ? 'all' : Math.min(min, activeDays);
  const title = (cf.titleTouched ? cf.title : cfAutoTitle()).trim() || cfAutoTitle();
  const c = {
    id: 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    habitId: h.id, title: title.slice(0, 50), emoji: h.emoji || '🎯', color: h.color,
    days, required, start: today(), status: 'active',
    reward: chalRewardFor(required === 'all' ? activeDays : required),
  };
  DB.challenges.push(c);
  saveData();
  closeChallengeForm();
  updateChallenges();
  renderActivePage();
  showToast('Défi lancé : bon courage !', 2600, 'trophy');
}
function abandonChallenge(id) {
  const c = (DB.challenges || []).find(x => x.id === id); if (!c || c.status !== 'active') return;
  if (!confirm(`Abandonner le défi « ${c.title} » ?`)) return;
  c.status = 'abandoned'; c.endedOn = today();
  saveData(); renderActivePage();
  showToast('Défi abandonné', 2200);
}
function clearChallengeHistory() {
  if (!confirm('Effacer l’historique des défis terminés ?')) return;
  DB.challenges = (DB.challenges || []).filter(c => c.status === 'active');
  saveData(); renderActivePage();
}

// Petit bloc « saison » affiché sous la barre d'XP de la page Compte.
function seasonMiniHtml() {
  const s = seasonOf(new Date()); const r = seasonRank(currentSeasonXp());
  return `<div class="xp-card-row" style="margin-top:14px"><span class="xp-label">${s.def.emoji} ${esc(s.label)}</span><span class="xp-value">Rang ${r.roman} · ${r.name}</span></div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${r.pct}%"></div></div>`;
}
// Un défi peut se terminer pendant que l'app est en arrière-plan (changement de jour).
document.addEventListener('visibilitychange', () => { if (!document.hidden && updateChallenges()) renderActivePage(); });

/* ═══════════ Raccourcis PWA (appui long sur l'icône) ═══════════ */
function quickWater() {
  if (!HABITS.some(h => h.type === 'drink')) { showToast('Habitude « eau » introuvable', 3000, 'alert'); return; }
  const c = drinkCfg(); const before = getDrinkMl(today());
  if (before >= c.max) { showToast(`Maximum atteint : ${fmtNum(c.max)} ml`, 2800, 'drink'); return; }
  addDrinkAmount(250);
  const after = getDrinkMl(today());
  if (!(before < c.goal && after >= c.goal)) showToast(`+250 ml · ${fmtNum(after)} / ${fmtNum(c.goal)} ml`, 2800, 'drink');
}
const LAUNCH_ACTIONS = {
  mood:       () => openMoodModal(today()),
  breathing:  () => openBreathing(),
  meditation: () => openMeditation(),
  water:      () => quickWater(),
};
function handleLaunchAction() {
  let action = null;
  try { action = new URLSearchParams(location.search).get('action'); } catch (e) {}
  if (!action) return;
  // On nettoie l'URL pour qu'un rechargement ne rejoue pas l'action.
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  const run = LAUNCH_ACTIONS[action]; if (!run) return;
  if (action === 'mood') sessionStorage.setItem('moodChecked', '1');
  setTimeout(run, 350);
}

function init() {
  checkDailyPenalties();
  if(!DB.sleepLog) { DB.sleepLog = {}; saveData(); }
  showPage('home');
  handleLaunchAction();
  checkDailyMood();
  initNotifications();
  renderSleepSummary();
}


document.addEventListener('DOMContentLoaded', init);