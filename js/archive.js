let _undoTimer=null,_undoFn=null;
function showUndoToast(o,e,n){const t=document.getElementById("undoToast");t&&(document.getElementById("undoToastMsg").textContent=o,_undoFn=e,t.classList.add("show"),clearTimeout(_undoTimer),_undoTimer=setTimeout(hideUndoToast,n||8e3))}
function hideUndoToast(){const o=document.getElementById("undoToast");o&&o.classList.remove("show"),clearTimeout(_undoTimer),_undoFn=null}
function runUndo(){const n=_undoFn;hideUndoToast(),n&&n()}
const liveHabits=()=>HABITS.filter(i=>!i.archived);
const archivedHabits=()=>HABITS.filter(i=>i.archived);
function habitGapAt(a,o){return(a.gaps||[]).some(t=>o>=t.from&&(!t.to||o<=t.to))}
function archiveHabit(n){const a=HABITS.find(e=>e.id===n);if(!a||a.archived)return;const s=today();a.archived=!0,a.archivedOn=s,(a.gaps=a.gaps||[]).push({from:s});const t=(DB.reminders||[]).filter(e=>e.habitId===n&&e.enabled);t.forEach(e=>{e.enabled=!1});const i=(DB.challenges||[]).filter(e=>e.habitId===n&&e.status==="active").map(e=>e.id);saveData(),scheduleLocalNotifications(),renderActivePage();const r=t.length?` · ${t.length} rappel${t.length>1?"s":""} désactivé${t.length>1?"s":""}`:"";showUndoToast(`« ${a.name} » archivée${r}`,()=>restoreHabit(n,{reEnable:t.map(e=>e.id),reactivate:i,silent:!0}))}
function restoreHabit(r,i){i=i||{};const a=HABITS.find(e=>e.id===r);if(!a||!a.archived)return;const d=today(),s=fmtDate(addDays(appNow(),-1));a.gaps=(a.gaps||[]).map(e=>e.to?e:e.from>=d?null:{from:e.from,to:s}).filter(e=>e&&(!e.to||e.to>=e.from)),delete a.archived,delete a.archivedOn,a.gaps.length||delete a.gaps,(i.reactivate||[]).forEach(e=>{const t=(DB.challenges||[]).find(n=>n.id===e);t&&t.status==="abandoned"&&(t.status="active",delete t.endedOn)}),(i.reEnable||[]).forEach(e=>{const t=(DB.reminders||[]).find(n=>n.id===e);t&&(t.enabled=!0)}),saveData(),scheduleLocalNotifications(),renderActivePage(),i.silent||showToast(`« ${a.name} » restaurée`,2600,"star")}
function archiveHabitFromForm(){if(!hf||hf.mode!=="edit")return;const i=hf.id;closeHabitForm(),archiveHabit(i)}
function purgeHabit(i,n){const r=HABITS.find(e=>e.id===i);if(!r||!confirm(`Supprimer définitivement « ${r.name} » ?

Son historique sera effacé (tu pourras annuler quelques secondes).`))return;const a={def:JSON.parse(JSON.stringify(r)),idx:HABITS.indexOf(r),data:JSON.parse(JSON.stringify(DB.habits[i]||{logs:{}})),rems:(DB.reminders||[]).filter(e=>e.habitId===i).map(e=>e.id),chals:JSON.parse(JSON.stringify((DB.challenges||[]).filter(e=>e.habitId===i)))};HABITS.splice(a.idx,1),delete DB.habits[i],(DB.reminders||[]).forEach(e=>{e.habitId===i&&(e.habitId="")}),saveData(),n&&closeHabitForm(),renderActivePage(),showUndoToast(`« ${r.name} » supprimée`,()=>undoPurge(a))}
function undoPurge(e){HABITS.some(i=>i.id===e.def.id)||(HABITS.splice(Math.min(e.idx,HABITS.length),0,e.def),DB.habits[e.def.id]=e.data,e.rems.forEach(i=>{const d=(DB.reminders||[]).find(a=>a.id===i);d&&(d.habitId=e.def.id)}),e.chals.forEach(i=>{const d=DB.challenges.findIndex(a=>a.id===i.id);d>=0?DB.challenges[d]=i:DB.challenges.push(i)}),saveData(),renderActivePage(),showToast("Habitude rétablie",2400,"star"))}
function deleteHabitFromForm(){hf&&hf.mode==="edit"&&purgeHabit(hf.id,!0)}
function archivedSectionHtml(){const e=archivedHabits();return e.length?`<div class="archived-section">
    <div class="account-section-title">Archivées</div>
    <div class="archived-list">${e.map(i=>`<div class="archived-row" data-habit-id="${i.id}">
      <div class="archived-emoji" style="--ink:${i.color}">${habitIconMarkup(i)}</div>
      <div class="archived-info"><div class="archived-name">${esc(i.name)}</div>
        <div class="archived-meta">${i.archivedOn?`Archivée le ${fmtDay(i.archivedOn)} · `:""}meilleure série ${streakLabel(i,calcStreak(i).longest)}</div></div>
      <button type="button" class="pref-edit" onclick="restoreHabit('${i.id}')">Restaurer</button>
      <button type="button" class="archived-del" onclick="purgeHabit('${i.id}')" aria-label="Supprimer définitivement ${esc(i.name)}">${icon("trash")}</button>
    </div>`).join("")}</div>
  </div>`:""}
function repHabitOptions(){const i=t=>`<option value="${t.id}"${rep.habit===t.id?" selected":""}>${esc(t.name)}</option>`,o=archivedHabits();return liveHabits().map(i).join("")+(o.length?`<optgroup label="Archivées">${o.map(i).join("")}</optgroup>`:"")}
