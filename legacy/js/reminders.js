let _notifTimers=[];
function notifsGranted(){return!!DB.profile.notifsEnabled&&"Notification"in window&&Notification.permission==="granted"}
function initNotifications(){const i=!!DB.profile.notifsEnabled;updateToggleBtn("notifsToggle",i),notifsGranted()&&scheduleLocalNotifications()}
async function toggleNotifications(){if(!("Notification"in window)){alert("Les notifications ne sont pas prises en charge sur cet appareil.");return}if(DB.profile.notifsEnabled){DB.profile.notifsEnabled=!1,_notifTimers.forEach(e=>clearTimeout(e)),_notifTimers=[],saveData(),updateToggleBtn("notifsToggle",!1),showToast("Notifications désactivées",2500,"bellOff"),activePage==="account"&&renderAccount();return}let i=Notification.permission;if(i==="default"&&(i=await Notification.requestPermission()),i==="granted"){DB.profile.notifsEnabled=!0,saveData(),updateToggleBtn("notifsToggle",!0),scheduleLocalNotifications();const e=(DB.reminders||[]).filter(t=>t.enabled).length;showToast(`${e} rappel${e>1?"s":""} programmé${e>1?"s":""}`,3e3,"bell")}else showToast("Notifications bloquées : vérifie les réglages du navigateur",3500,"alert");activePage==="account"&&renderAccount()}
function nextOccurrence(t,n){if(n=n||new Date,!t.days||!t.days.length)return null;for(let u=0;u<8;u++){const e=new Date(n);if(e.setDate(e.getDate()+u),e.setHours(t.hour,t.minute,0,0),e>n&&t.days.includes(e.getDay()))return e}return null}
function scheduleLocalNotifications(){_notifTimers.forEach(e=>clearTimeout(e)),_notifTimers=[],notifsGranted()&&(DB.reminders||[]).forEach(e=>{if(!e.enabled)return;const i=nextOccurrence(e);if(!i)return;const t=i.getTime()-Date.now();t<=0||_notifTimers.push(setTimeout(()=>fireReminder(e.id,i.getTime()),t))})}
function reminderSatisfied(t){if(!t.habitId)return!1;const e=HABITS.find(s=>s.id===t.habitId);if(!e||e.type==="bad")return!1;const i=appNow();return i.setHours(0,0,0,0),e.type==="times"&&timesThisWeek(e).state==="success"?!0:isHabitDoneOn(e,today(),i)}
async function fireReminder(e,n){const i=(DB.reminders||[]).find(a=>a.id===e),t=Date.now()-n;i&&i.enabled&&t<600*1e3&&!reminderSatisfied(i)&&await showReminderNotification(i),scheduleLocalNotifications()}
async function showReminderNotification(i){const e={body:i.body||"",icon:"./assets/icon-192.png",badge:"./assets/icon-192.png",tag:"ht-"+i.id,data:{url:"./"}};try{if("serviceWorker"in navigator){const t=await Promise.race([navigator.serviceWorker.ready,new Promise(o=>setTimeout(()=>o(null),1500))]);if(t&&t.showNotification)return await t.showNotification(i.title,e),!0}}catch{}try{return new Notification(i.title,e),!0}catch{return!1}}
async function sendTestNotification(){if(!notifsGranted()){showToast("Active d’abord les notifications",3e3,"alert");return}const t=await showReminderNotification({id:"test",title:"🔔 Notification test",body:"Tout fonctionne : tes rappels te parviendront."});showToast(t?"Notification envoyée":"Impossible d’afficher la notification",2600,t?"bell":"alert")}
document.addEventListener("visibilitychange",()=>{document.hidden||scheduleLocalNotifications()});
function remindersSectionHtml(){const n=[...DB.reminders||[]].sort((e,t)=>e.hour*60+e.minute-(t.hour*60+t.minute)),i=notifsGranted();return`<div>
    <div class="account-section-title">Rappels</div>
    <div class="pref-card">
      ${n.map(e=>{const t=e.habitId?HABITS.find(s=>s.id===e.habitId):null,o=daysLabel(e.days)+(t?` · ${esc(t.name)}`:"");return`<div class="pref-row reminder-row${e.enabled?"":" off"}" role="button" tabindex="0" onclick="openReminder('${e.id}')" onkeydown="if(event.key==='Enter')openReminder('${e.id}')">
      <div class="reminder-time">${pad2(e.hour)}:${pad2(e.minute)}</div>
      <div class="pref-info reminder-info"><div><div class="pref-label-text">${esc(e.title)}</div><div class="pref-hint">${o}</div></div></div>
      <button type="button" class="pref-toggle ${e.enabled?"on":"off"}" role="switch" aria-checked="${e.enabled}" aria-label="Activer le rappel ${esc(e.title)}" onclick="event.stopPropagation();toggleReminder('${e.id}')">${e.enabled?"Activé":"Désactivé"}</button>
    </div>`}).join("")||'<div class="pref-row"><div class="pref-hint">Aucun rappel pour l’instant.</div></div>'}
      <div class="pref-row"><button type="button" class="reminder-add" onclick="openReminder()">+ Ajouter un rappel</button></div>
    </div>
    <div class="hf-hint reminders-note">${i?"Les rappels sonnent tant que l’app est ouverte ou active en arrière-plan.":"Active les notifications dans les préférences pour recevoir tes rappels."}</div>
    ${i?'<button type="button" class="pref-edit reminder-test" onclick="sendTestNotification()">Envoyer une notification test</button>':""}
  </div>`}
function toggleReminder(n){const e=(DB.reminders||[]).find(i=>i.id===n);e&&(e.enabled=!e.enabled,saveData(),scheduleLocalNotifications(),activePage==="account"&&renderAccount())}
let rf=null;
function openReminder(t){const e=t?(DB.reminders||[]).find(d=>d.id===t):null;t&&!e||(rf=e?{mode:"edit",id:e.id,title:e.title,body:e.body||"",time:`${pad2(e.hour)}:${pad2(e.minute)}`,days:e.days.slice(),habitId:e.habitId||"",enabled:e.enabled!==!1}:{mode:"create",id:null,title:"",body:"",time:"09:00",days:ALL_DAYS.slice(),habitId:"",enabled:!0},document.getElementById("reminderFormTitle").textContent=e?"Modifier le rappel":"Nouveau rappel",renderReminderForm(),document.querySelector("#reminderModal .modal-card").scrollTop=0,document.getElementById("reminderModal").classList.add("open"),e||setTimeout(()=>{const d=document.getElementById("rfTitle");d&&d.focus()},120))}
function closeReminder(){rf=null,document.getElementById("reminderModal").classList.remove("open")}
function rfInput(f,n){rf&&(rf[f]=n)}
function rfSet(r,e){rf&&(rf[r]=e,renderReminderForm())}
function rfToggleDay(r){rf&&(rf.days=rf.days.includes(r)?rf.days.filter(f=>f!==r):[...rf.days,r],renderReminderForm())}
function rfDays(e){rf&&(rf.days=e==="week"?WEEKDAYS.slice():ALL_DAYS.slice(),renderReminderForm())}
function renderReminderForm(){const t=document.getElementById("reminderFormBody");if(!t||!rf)return;const l=rf.mode==="edit",a=liveHabits().filter(e=>e.type!=="bad").map(e=>`<option value="${e.id}"${rf.habitId===e.id?" selected":""}>${esc(e.name)}</option>`).join("");t.innerHTML=`
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
        ${DOW_ORDER.map(e=>`<button type="button" class="hf-day${rf.days.includes(e)?" selected":""}" aria-pressed="${rf.days.includes(e)}" aria-label="${DAY_FULL[e]}" onclick="rfToggleDay(${e})">${DOW_LETTER[e]}</button>`).join("")}
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
        ${a}
      </select>
      <div class="hf-hint">Si l’habitude est déjà faite à l’heure du rappel, la notification est ignorée.</div>
    </div>
    <div class="hf-switch">
      <div>
        <div class="pref-label-text">Rappel actif</div>
        <div class="pref-hint">Désactive-le sans le supprimer</div>
      </div>
      <button type="button" class="pref-toggle ${rf.enabled?"on":"off"}" role="switch" aria-checked="${rf.enabled}" aria-label="Rappel actif" onclick="rfSet('enabled',!rf.enabled)">${rf.enabled?"Activé":"Désactivé"}</button>
    </div>
    <div class="hf-actions">
      <button type="button" class="modal-save-btn" onclick="saveReminder()">${l?"Enregistrer":"Créer le rappel"}</button>
      ${l?`<button type="button" class="modal-reset-btn" onclick="deleteReminder()">${icon("trash")} Supprimer le rappel</button>`:""}
    </div>`}
function saveReminder(){if(!rf)return;const r=rf.title.trim();if(!r){showToast("Donne un titre au rappel",2500,"alert");return}const e=/^(\d{1,2}):(\d{2})$/.exec(rf.time||"");if(!e||+e[1]>23||+e[2]>59){showToast("Choisis une heure valide",2500,"alert");return}if(rf.days.length===0){showToast("Choisis au moins un jour",2800,"alert");return}const i={title:r,body:rf.body.trim(),hour:+e[1],minute:+e[2],days:rf.days.slice(),habitId:rf.habitId||"",enabled:rf.enabled};if(Array.isArray(DB.reminders)||(DB.reminders=[]),rf.mode==="create")DB.reminders.push({id:"r_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),...i});else{const t=DB.reminders.find(n=>n.id===rf.id);t&&Object.assign(t,i)}saveData(),scheduleLocalNotifications(),closeReminder(),activePage==="account"&&renderAccount(),showToast(notifsGranted()?"Rappel enregistré":"Rappel enregistré : active les notifications pour le recevoir",notifsGranted()?2200:3600,"bell")}
function deleteReminder(){if(!rf||rf.mode!=="edit")return;const e=(DB.reminders||[]).find(r=>r.id===rf.id);if(!e){closeReminder();return}confirm(`Supprimer le rappel « ${e.title} » ?`)&&(DB.reminders=DB.reminders.filter(r=>r.id!==e.id),saveData(),scheduleLocalNotifications(),closeReminder(),activePage==="account"&&renderAccount(),showToast("Rappel supprimé",2200,"trash"))}
