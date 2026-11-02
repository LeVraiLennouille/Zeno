let _renderedDay=today();
let _midnightTimer=null;
function onNewDay(e){_renderedDay=today(),sessionStorage.removeItem("moodChecked"),updateChallenges(),scheduleLocalNotifications(),renderActivePage(),e&&(checkDailyMood(),maybeShowWeeklyReview())}
function checkDayChange(e){return today()!==_renderedDay?(onNewDay(e===!0),!0):!1}
function scheduleMidnightCheck(){clearTimeout(_midnightTimer);const e=new Date,t=new Date(e.getFullYear(),e.getMonth(),e.getDate(),_dayStartHour,0,1);t<=e&&t.setDate(t.getDate()+1),_midnightTimer=setTimeout(()=>{checkDayChange(),scheduleMidnightCheck()},Math.max(1e3,t-e))}
function initDayWatcher(){scheduleMidnightCheck(),setInterval(()=>{document.hidden||checkDayChange()},6e4),document.addEventListener("visibilitychange",()=>{document.hidden||(checkDayChange(!0)||(checkDailyMood(),maybeShowWeeklyReview()),scheduleMidnightCheck())}),window.addEventListener("focus",()=>checkDayChange(!0)),window.addEventListener("pageshow",()=>checkDayChange(!0))}
