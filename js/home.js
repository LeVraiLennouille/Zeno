/* HabitsTracker · Navigation et page Accueil (héros, onglets Aujourd'hui / Semaine / Global)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

let activePage = 'home';
let activeHomeTab = 'today';
let moodCalMonth = appNow();
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
  renderBackupNudge();
  const w=document.getElementById('home-wellness'); if(w) w.classList.toggle('hidden',activeHomeTab!=='today');
  renderSleepSummary();
}

function renderHero() {
  const el=document.getElementById('todayHero'); if(!el) return;
  const todayDate=appNow(); todayDate.setHours(0,0,0,0); const t=today();
  const active=HABITS.filter(h=>isRequiredHabit(h)&&isDayActive(h,todayDate));
  const done=active.filter(h=>isHabitDoneOn(h,t,todayDate));
  const perfect=active.length>0&&done.length===active.length;
  const date=appNow().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
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
  const t=today(); const todayDate=appNow(); todayDate.setHours(0,0,0,0);
  container.innerHTML='';
  if(!HABITS.some(h=>isDayActive(h,todayDate))) container.innerHTML=isPaused(t)?pausedDayNote():todayEmptyNote();
  liveHabits().forEach(habit=>{
    if(!isDayActive(habit,todayDate)) return;
    const card=document.createElement('div');
    const isSimple=['good','weekly','times'].includes(habit.type)||(habit.type==='bad'&&!habit.levels);
    const cardDone = habit.type!=='bad' && isHabitDoneOn(habit,t,todayDate);
    card.className='habit-card today-card'+(cardDone?' done':''); card.dataset.habitId=habit.id; card.style.setProperty('--ink',habit.color);
    const control=buildTodayControl(habit,t,todayDate);
    const subMarkup = (cardDone && isSimple && habit.type!=='times')
      ? `<div class="today-card-sub done-flourish">accompli !</div>`
      : `<div class="today-card-sub${cardDone&&habit.type==='times'?' done-flourish':''}">${buildTodaySubLabel(habit,t,todayDate)}</div>`;
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
  if(habit.type==='times') return timesSubLabel(habit);
  const streak=calcStreak(habit).current;
  if(habit.type==='bad') {
    const fail=isBadFail(habit.id,t);
    const bv=fail?badVal(habit.id,t):'';
    return `${fail?('Craqué'+(bv?' · '+esc(bv):'')):'Tenu bon'} · ${icon('flame')} ${streak} j`;
  }
  return streak>0?`${icon('flame')} ${streakWords(habit,streak)} de suite`:(habit.freq||'Tous les jours');
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
  const todayDate=appNow(); todayDate.setHours(0,0,0,0);
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  liveHabits().forEach(habit=>{
    const card=document.createElement('div');
    card.className='habit-card'; card.dataset.habitId=habit.id; card.style.setProperty('--ink',habit.color);
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
            <div class="habit-card-freq">${habit.type==='times'?`${habit.freq} · ${timesWeekText(habit)}`:(habit.freq||'Tous les jours')}</div>
          </div>
        </div>
        <div class="streak-pill">${icon('flame')}${streakLabel(habit,calcStreak(habit).current)}</div>
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
  const todayDate=appNow(); todayDate.setHours(0,0,0,0);
  const numWeeks=16;
  const todayDow=todayDate.getDay()===0?6:todayDate.getDay()-1;
  const monday=addDays(todayDate,-todayDow);
  const startDate=addDays(monday,-((numWeeks-1)*7));

  liveHabits().forEach(habit=>{
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
        else if(k>=DB.createdAt && habit.type!=='times') { cls+=' missed'; style=`background:${habit.color}20;border:1.5px solid ${habit.color}40`; }
        gridHtml+=`<div class="${cls}" style="${style}" title="${esc(tip)}"></div>`;
      }
    });
    card.innerHTML=`
      <div class="habit-card-header">
        <div class="habit-card-left">
          <div class="habit-card-emoji">${habitIconMarkup(habit)}</div>
          <div>
            <div class="habit-card-name">${esc(habit.name)}</div>
            <div class="habit-card-freq">${habit.type==='times'?`${habit.freq} · ${timesWeekText(habit)}`:(habit.freq||'Tous les jours')}</div>
          </div>
        </div>
        <div class="streak-pill">${icon('flame')}${streakLabel(habit,calcStreak(habit).current)}</div>
      </div>
      <div class="overall-dot-grid">${gridHtml}</div>
    `;
    container.appendChild(card);
  });
}