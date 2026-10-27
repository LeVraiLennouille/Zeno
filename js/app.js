function init(){checkDailyPenalties(),DB.sleepLog||(DB.sleepLog={},saveData()),showPage("home"),setupDialogs(),initDayWatcher(),handleFlash(),window.matchMedia&&matchMedia("(display-mode: standalone)").matches&&requestPersistence(),handleLaunchAction(),checkDailyMood(),maybeShowWeeklyReview(),initNotifications(),renderSleepSummary()}
document.addEventListener("DOMContentLoaded",init);
