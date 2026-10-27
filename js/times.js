/* HabitsTracker · Habitudes « X fois par semaine »
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* Une habitude `times` se coche jour par jour (comme une case à cocher) mais son objectif est hebdomadaire :
 * `target` séances sur la semaine lundi → dimanche, quels que soient les jours.
 * La série se compte en SEMAINES réussies. */
const TIMES_MAX = 6;

const isRequiredHabit = h => !h.optional && h.type !== 'times';        // compte pour la journée parfaite
const weeklyUnit = h => h.type === 'weekly' || h.type === 'times';     // série comptée en semaines
const streakLabel = (h, n) => `${n} ${weeklyUnit(h) ? 'sem' : 'j'}`;
const streakWords = (h, n) => weeklyUnit(h) ? `${n} semaine${n > 1 ? 's' : ''}` : `${n} jour${n > 1 ? 's' : ''}`;

// État d'une semaine pour une habitude `times` : réussie, encore possible, manquée ou sans objet.
function timesWeekInfo(h, wk) {
  const logs = ((DB.habits[h.id] || {}).logs) || {};
  const todayKey = today(), start = parseDate(wk);
  let active = 0, done = 0, remaining = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i), k = fmtDate(d);
    if (k < DB.createdAt || !isDayActive(h, d)) continue;   // avant l'utilisation de l'app, pause, archivage…
    active++;
    if (logs[k] === 'done') done++;
    else if (k >= todayKey) remaining++;               // jours encore disponibles (aujourd'hui compris)
  }
  const target = Math.max(1, Math.min(TIMES_MAX, Math.floor(h.target) || 1));
  const required = Math.min(target, active);           // une semaine presque entièrement en pause réduit l'objectif
  let state;
  if (active === 0) state = 'neutral';
  else if (done >= required) state = 'success';
  else if (done + remaining >= required) state = 'open';
  else state = 'failed';
  return { active, done, remaining, target, required, state };
}
const timesThisWeek = h => timesWeekInfo(h, getWeekMonday(appNow()));

function calcTimesStreak(h) {
  const cwm = getWeekMonday(appNow());
  const floorKey = [DB.createdAt, h.since || ''].sort().pop();
  const weekEnd = wm => fmtDate(addDays(parseDate(wm), 6));
  const wmAt = o => fmtDate(addDays(parseDate(cwm), -o * 7));

  let current = 0;
  const cur = timesWeekInfo(h, cwm);
  if (cur.state !== 'failed') {                        // une semaine devenue impossible casse la série tout de suite
    if (cur.state === 'success') current++;
    for (let o = 1; o < 156; o++) {
      if (weekEnd(wmAt(o)) < floorKey) break;
      const s = timesWeekInfo(h, wmAt(o)).state;
      if (s === 'success') current++; else if (s === 'failed') break;   // « neutral » (pause) : on passe
    }
  }
  let best = 0, run = 0;
  for (let o = 155; o >= 0; o--) {
    if (weekEnd(wmAt(o)) < floorKey) continue;
    const s = timesWeekInfo(h, wmAt(o)).state;
    if (s === 'success') { run++; best = Math.max(best, run); } else if (s === 'failed') run = 0;
  }
  return { current, longest: Math.max(best, current) };
}

function timesDots(info) {
  const n = Math.max(1, info.required);
  const filled = Math.min(info.done, n);
  return `<span class="tdots" aria-hidden="true">${'●'.repeat(filled)}${'○'.repeat(n - filled)}</span>`;
}
function timesWeekText(h, info) {
  info = info || timesThisWeek(h);
  return `${info.done}/${info.required} cette semaine`;
}
function timesSubLabel(h) {
  const info = timesThisWeek(h), st = calcStreak(h).current;
  return `${timesDots(info)} ${timesWeekText(h, info)}${st > 0 ? ` · ${icon('flame')} ${st} sem` : ''}`;
}
// Annonce quand l'objectif de la semaine vient d'être atteint.
function announceTimesGoal(h) {
  const i = timesThisWeek(h);
  if (i.state === 'success' && i.done === i.required) {
    playSound('drink');
    showToast(`Objectif de la semaine atteint : ${i.done}/${i.required} « ${h.name} »`, 3400, 'star');
    return true;
  }
  return false;
}