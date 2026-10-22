/* HabitsTracker · Audio, toasts, XP et niveaux, séries, succès, actions sur les habitudes, confettis
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

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
  { id:'king',        emoji:'👑', name:"Maîtrise de soi",             desc:"Aucune mauvaise habitude pendant 14 jours",     check:()=>{const b=liveHabits().filter(h=>h.type==='bad');return b.length>0&&b.every(h=>calcStreak(h).current>=14);} },
  { id:'centurion',   emoji:'⚔️', name:"Centurion",        desc:"Cumule 100 XP",                      check:()=>(DB.xp||0)>=100 },
  { id:'on_fire',     emoji:'🔥', name:"En feu",          desc:"Atteins le niveau 5",                          check:()=>calcLevel(DB.xp)>=5 },
  { id:'bookworm',    emoji:'📖', name:"Rat de bibliothèque",         desc:"Série de lecture de 14 jours",                  check:()=>{const h=HABITS.find(x=>x.id==='read');return h&&calcStreak(h).current>=14;} },
  { id:'ironwill',    emoji:'💪', name:"Volonté de fer",        desc:"20 séances de gym dans le mois",             check:()=>checkGymMonth() },
  { id:'consistent',  emoji:'🌅', name:"Régularité",       desc:"Série de 30 jours ou plus sur une habitude",            check:()=>liveHabits().some(h=>calcStreak(h).current>=30) },
  { id:'night_tmd',   emoji:'🌙', name:"Hibou apprivoisé",  desc:"Série de sommeil de 14 jours",                    check:()=>{const h=HABITS.find(x=>x.id==='sleep');return h&&calcStreak(h).current>=14;} },
  { id:'xp_500',      emoji:'💎', name:"Réserve d'XP",       desc:"Cumule 500 XP",                      check:()=>(DB.xp||0)>=500 },
  { id:'dedicated',   emoji:'🎯', name:"Dévouement",        desc:"Série de 60 jours ou plus sur une habitude",            check:()=>liveHabits().some(h=>calcStreak(h).current>=60) },
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
