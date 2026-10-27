let reorderMode=!1;
let _drag=null;
const GRIP_SVG='<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="5" r="1.7"/><circle cx="13" cy="5" r="1.7"/><circle cx="7" cy="10" r="1.7"/><circle cx="13" cy="10" r="1.7"/><circle cx="7" cy="15" r="1.7"/><circle cx="13" cy="15" r="1.7"/></svg>';
function toggleReorderMode(){reorderMode=!reorderMode;const e=document.getElementById("reorderBtn");if(e&&(e.setAttribute("aria-pressed",String(reorderMode)),e.classList.toggle("active",reorderMode)),renderMyHabits(),reorderMode){const r=document.querySelector("#reorderList .drag-handle");r&&r.focus({preventScroll:!0})}}
function applyHabitOrder(t){const a=[];if(HABITS.forEach((e,n)=>{e.archived||a.push(n)}),t.length!==a.length)return!1;const r={};if(HABITS.forEach(e=>{r[e.id]=e}),!t.every(e=>r[e]&&!r[e].archived))return!1;const c=HABITS.slice();return t.forEach((e,n)=>{c[a[n]]=r[e]}),HABITS.splice(0,HABITS.length,...c),saveData(),!0}
function announceReorder(n,t,o){const e=document.getElementById("reorderStatus");e&&(e.textContent=`${n.name} : position ${t} sur ${o}`)}
function moveHabit(n,i){const e=liveHabits().map(o=>o.id),t=e.indexOf(n),r=t+i;if(t<0||r<0||r>=e.length||([e[t],e[r]]=[e[r],e[t]],!applyHabitOrder(e)))return!1;renderMyHabits();const s=HABITS.find(o=>o.id===n);announceReorder(s,r+1,e.length);const d=`#reorderList .reorder-row[data-habit-id="${n}"]`,a=document.querySelector(`${d} .${i<0?"rb-up":"rb-down"}:not([disabled])`)||document.querySelector(`${d} .drag-handle`);return a&&a.focus({preventScroll:!0}),!0}
function reorderKey(r,e){if((r.key==="ArrowUp"||r.key==="ArrowDown")&&(r.preventDefault(),moveHabit(e,r.key==="ArrowUp"?-1:1))){const o=document.querySelector(`#reorderList .reorder-row[data-habit-id="${e}"] .drag-handle`);o&&o.focus({preventScroll:!0})}}
function renderReorderList(i){const t=liveHabits();i.innerHTML=`
    <div class="reorder-hint" role="note">
      <span>Fais glisser <b>⠿</b> (ou ↑ ↓ au clavier). L’ordre s’applique partout.</span>
      <button type="button" class="pref-edit" onclick="toggleReorderMode()">Terminé</button>
    </div>
    <div class="my-habits-list reordering" id="reorderList">
      ${t.map((e,r)=>`<div class="reorder-row" data-habit-id="${e.id}" style="--ink:${e.color}">
        <button type="button" class="drag-handle" aria-label="Déplacer ${esc(e.name)} (position ${r+1} sur ${t.length}). Flèches haut et bas pour réordonner." onpointerdown="startHabitDrag(event,'${e.id}')" onkeydown="reorderKey(event,'${e.id}')">${GRIP_SVG}</button>
        <div class="my-habit-emoji">${habitIconMarkup(e)}</div>
        <div class="reorder-name">${esc(e.name)}</div>
        <div class="reorder-btns">
          <button type="button" class="rb-up" onclick="moveHabit('${e.id}',-1)" aria-label="Monter ${esc(e.name)}"${r===0?" disabled":""}>↑</button>
          <button type="button" class="rb-down" onclick="moveHabit('${e.id}',1)" aria-label="Descendre ${esc(e.name)}"${r===t.length-1?" disabled":""}>↓</button>
        </div>
      </div>`).join("")}
    </div>
    <div id="reorderStatus" class="sr-only" role="status" aria-live="polite"></div>`}
function startHabitDrag(t,d){if(t.button!==void 0&&t.button!==0)return;const i=document.getElementById("reorderList");if(!i)return;t.preventDefault();const n=[...i.querySelectorAll(".reorder-row")],r=n.findIndex(a=>a.dataset.habitId===d);if(r<0)return;const s=window.scrollY,e=n.map(a=>{const c=a.getBoundingClientRect();return{top:c.top+s,h:c.height}}),l=n.length>1?Math.max(0,e[1].top-(e[0].top+e[0].h)):0,o=t.currentTarget;_drag={id:d,idx:r,rows:n,rects:e,slot:e[r].h+l,startY:t.clientY,startScroll:s,over:r,y:t.clientY,handle:o,raf:0,pid:t.pointerId},n[r].classList.add("dragging"),i.classList.add("is-dragging");try{o.setPointerCapture(t.pointerId)}catch{}o.addEventListener("pointermove",onDragMove),o.addEventListener("pointerup",onDragEnd),o.addEventListener("pointercancel",onDragCancel),_drag.raf=requestAnimationFrame(dragAutoScroll)}
function updateDrag(){const t=_drag;if(!t)return;const i=t.y-t.startY+(window.scrollY-t.startScroll),n=t.rects[t.idx],a=n.top+n.h/2+i;t.rows[t.idx].style.transform=`translateY(${i}px)`;let s=0;t.rects.forEach((o,r)=>{r!==t.idx&&o.top+o.h/2<a&&s++}),t.over=s,t.rows.forEach((o,r)=>{if(r===t.idx)return;let e=0;t.idx<r&&r<=s?e=-t.slot:s<=r&&r<t.idx&&(e=t.slot),o.style.transform=e?`translateY(${e}px)`:""})}
function onDragMove(r){_drag&&(_drag.y=r.clientY,updateDrag())}
function dragAutoScroll(){const t=_drag;if(t){if(Math.abs(t.y-t.startY)>14){const e=window.innerHeight-170;t.y<110?window.scrollBy(0,-Math.ceil((110-t.y)/6)):t.y>e&&window.scrollBy(0,Math.ceil((t.y-e)/6))}updateDrag(),t.raf=requestAnimationFrame(dragAutoScroll)}}
function cleanupDrag(){const e=_drag;if(!e)return;cancelAnimationFrame(e.raf),e.handle.removeEventListener("pointermove",onDragMove),e.handle.removeEventListener("pointerup",onDragEnd),e.handle.removeEventListener("pointercancel",onDragCancel);try{e.handle.releasePointerCapture(e.pid)}catch{}e.rows.forEach(n=>{n.style.transform="",n.classList.remove("dragging")});const r=document.getElementById("reorderList");r&&r.classList.remove("is-dragging"),_drag=null}
function onDragEnd(){const n=_drag;if(!n)return;const{id:r,idx:t,over:d}=n;if(cleanupDrag(),d!==t){const e=liveHabits().map(i=>i.id);e.splice(t,1),e.splice(d,0,r),applyHabitOrder(e)&&(renderMyHabits(),announceReorder(HABITS.find(i=>i.id===r),d+1,e.length))}const o=document.querySelector(`#reorderList .reorder-row[data-habit-id="${r}"] .drag-handle`);o&&o.focus({preventScroll:!0})}
function onDragCancel(){cleanupDrag()}
