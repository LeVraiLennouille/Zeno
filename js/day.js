/* HabitsTracker · Changement de jour (app restée ouverte)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Changement de jour (app restée ouverte) ═══════════ */
let _renderedDay = today();
let _midnightTimer = null;
function onNewDay(prompt) {
  _renderedDay = today();
  sessionStorage.removeItem('moodChecked');          // l'invite d'humeur peut se redéclencher pour le nouveau jour
  updateChallenges();
  scheduleLocalNotifications();
  renderActivePage();
  if (prompt) checkDailyMood();                      // invite seulement quand l'utilisateur revient dans l'app, jamais en pleine nuit
}
function checkDayChange(prompt) {
  if (today() !== _renderedDay) { onNewDay(prompt === true); return true; }
  return false;
}
function scheduleMidnightCheck() {
  clearTimeout(_midnightTimer);
  const n = new Date();
  const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 1);
  _midnightTimer = setTimeout(() => { checkDayChange(); scheduleMidnightCheck(); }, Math.max(1000, next - n));
}
function initDayWatcher() {
  scheduleMidnightCheck();
  // Filets de sécurité : minuteries suspendues en arrière-plan, changement d'heure, mise en veille…
  setInterval(() => { if (!document.hidden) checkDayChange(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (!checkDayChange(true)) checkDailyMood(); scheduleMidnightCheck(); } });
  window.addEventListener('focus', () => checkDayChange(true));
  window.addEventListener('pageshow', () => checkDayChange(true));
}
