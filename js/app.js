/* HabitsTracker · Initialisation de l'application
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

function init() {
  checkDailyPenalties();
  if(!DB.sleepLog) { DB.sleepLog = {}; saveData(); }
  showPage('home');
  setupDialogs();
  initDayWatcher();
  handleFlash();
  if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) requestPersistence();
  handleLaunchAction();
  checkDailyMood();
  maybeShowWeeklyReview();
  initNotifications();
  renderSleepSummary();
}


document.addEventListener('DOMContentLoaded', init);