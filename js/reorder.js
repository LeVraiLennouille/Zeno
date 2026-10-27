/* HabitsTracker · Réorganisation des habitudes (glisser-déposer, boutons, clavier)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* L'ordre des habitudes est l'ordre du tableau HABITS (= DB.habitDefs) : il s'applique donc partout
 * (Accueil, Semaine, Global, Rapport, rappels…) et il est exporté avec les données. */
let reorderMode = false;
let _drag = null;
const GRIP_SVG = `<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="5" r="1.7"/><circle cx="13" cy="5" r="1.7"/><circle cx="7" cy="10" r="1.7"/><circle cx="13" cy="10" r="1.7"/><circle cx="7" cy="15" r="1.7"/><circle cx="13" cy="15" r="1.7"/></svg>`;

function toggleReorderMode() {
  reorderMode = !reorderMode;
  const b = document.getElementById('reorderBtn');
  if (b) { b.setAttribute('aria-pressed', String(reorderMode)); b.classList.toggle('active', reorderMode); }
  renderMyHabits();
  if (reorderMode) { const first = document.querySelector('#reorderList .drag-handle'); if (first) first.focus({ preventScroll: true }); }
}

// Applique un nouvel ordre aux habitudes « vivantes » ; les archivées gardent leur emplacement.
function applyHabitOrder(liveIds) {
  const slots = []; HABITS.forEach((h, i) => { if (!h.archived) slots.push(i); });
  if (liveIds.length !== slots.length) return false;
  const byId = {}; HABITS.forEach(h => { byId[h.id] = h; });
  if (!liveIds.every(id => byId[id] && !byId[id].archived)) return false;
  const next = HABITS.slice();
  liveIds.forEach((id, n) => { next[slots[n]] = byId[id]; });
  HABITS.splice(0, HABITS.length, ...next);
  saveData();
  return true;
}
function announceReorder(h, pos, total) {
  const el = document.getElementById('reorderStatus');
  if (el) el.textContent = `${h.name} : position ${pos} sur ${total}`;
}
function moveHabit(id, delta) {
  const ids = liveHabits().map(h => h.id);
  const i = ids.indexOf(id), j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return false;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  if (!applyHabitOrder(ids)) return false;
  renderMyHabits();
  const h = HABITS.find(x => x.id === id);
  announceReorder(h, j + 1, ids.length);
  const sel = `#reorderList .reorder-row[data-habit-id="${id}"]`;
  const btn = document.querySelector(`${sel} .${delta < 0 ? 'rb-up' : 'rb-down'}:not([disabled])`) || document.querySelector(`${sel} .drag-handle`);
  if (btn) btn.focus({ preventScroll: true });
  return true;
}
function reorderKey(e, id) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const ok = moveHabit(id, e.key === 'ArrowUp' ? -1 : 1);
    if (ok) { const hnd = document.querySelector(`#reorderList .reorder-row[data-habit-id="${id}"] .drag-handle`); if (hnd) hnd.focus({ preventScroll: true }); }
  }
}

function renderReorderList(container) {
  const live = liveHabits();
  container.innerHTML = `
    <div class="reorder-hint" role="note">
      <span>Fais glisser <b>⠿</b> (ou ↑ ↓ au clavier). L’ordre s’applique partout.</span>
      <button type="button" class="pref-edit" onclick="toggleReorderMode()">Terminé</button>
    </div>
    <div class="my-habits-list reordering" id="reorderList">
      ${live.map((h, i) => `<div class="reorder-row" data-habit-id="${h.id}" style="--ink:${h.color}">
        <button type="button" class="drag-handle" aria-label="Déplacer ${esc(h.name)} (position ${i + 1} sur ${live.length}). Flèches haut et bas pour réordonner." onpointerdown="startHabitDrag(event,'${h.id}')" onkeydown="reorderKey(event,'${h.id}')">${GRIP_SVG}</button>
        <div class="my-habit-emoji">${habitIconMarkup(h)}</div>
        <div class="reorder-name">${esc(h.name)}</div>
        <div class="reorder-btns">
          <button type="button" class="rb-up" onclick="moveHabit('${h.id}',-1)" aria-label="Monter ${esc(h.name)}"${i === 0 ? ' disabled' : ''}>↑</button>
          <button type="button" class="rb-down" onclick="moveHabit('${h.id}',1)" aria-label="Descendre ${esc(h.name)}"${i === live.length - 1 ? ' disabled' : ''}>↓</button>
        </div>
      </div>`).join('')}
    </div>
    <div id="reorderStatus" class="sr-only" role="status" aria-live="polite"></div>`;
}

/* ── Glisser-déposer au pointeur (souris, doigt, stylet) ── */
function startHabitDrag(e, id) {
  if (e.button !== undefined && e.button !== 0) return;
  const list = document.getElementById('reorderList'); if (!list) return;
  e.preventDefault();
  const rows = [...list.querySelectorAll('.reorder-row')];
  const idx = rows.findIndex(r => r.dataset.habitId === id); if (idx < 0) return;
  const sy = window.scrollY;
  const rects = rows.map(r => { const b = r.getBoundingClientRect(); return { top: b.top + sy, h: b.height }; });
  const gap = rows.length > 1 ? Math.max(0, rects[1].top - (rects[0].top + rects[0].h)) : 0;
  const handle = e.currentTarget;
  _drag = { id, idx, rows, rects, slot: rects[idx].h + gap, startY: e.clientY, startScroll: sy, over: idx, y: e.clientY, handle, raf: 0, pid: e.pointerId };
  rows[idx].classList.add('dragging');
  list.classList.add('is-dragging');
  try { handle.setPointerCapture(e.pointerId); } catch (_) {}
  handle.addEventListener('pointermove', onDragMove);
  handle.addEventListener('pointerup', onDragEnd);
  handle.addEventListener('pointercancel', onDragCancel);
  _drag.raf = requestAnimationFrame(dragAutoScroll);
}
function updateDrag() {
  const d = _drag; if (!d) return;
  const dy = (d.y - d.startY) + (window.scrollY - d.startScroll);
  const me = d.rects[d.idx];
  const center = me.top + me.h / 2 + dy;
  d.rows[d.idx].style.transform = `translateY(${dy}px)`;
  let over = 0;
  d.rects.forEach((r, k) => { if (k !== d.idx && r.top + r.h / 2 < center) over++; });
  d.over = over;
  d.rows.forEach((row, k) => {
    if (k === d.idx) return;
    let shift = 0;
    if (d.idx < k && k <= over) shift = -d.slot;
    else if (over <= k && k < d.idx) shift = d.slot;
    row.style.transform = shift ? `translateY(${shift}px)` : '';
  });
}
function onDragMove(e) { if (!_drag) return; _drag.y = e.clientY; updateDrag(); }
function dragAutoScroll() {
  const d = _drag; if (!d) return;
  // Pas de défilement automatique tant que l'utilisateur n'a pas vraiment déplacé la ligne ;
  // les seuils tiennent compte de l'en-tête (haut) et du dock flottant (bas).
  if (Math.abs(d.y - d.startY) > 14) {
    const topEdge = 110, botEdge = window.innerHeight - 170;
    if (d.y < topEdge) window.scrollBy(0, -Math.ceil((topEdge - d.y) / 6));
    else if (d.y > botEdge) window.scrollBy(0, Math.ceil((d.y - botEdge) / 6));
  }
  updateDrag();
  d.raf = requestAnimationFrame(dragAutoScroll);
}
function cleanupDrag() {
  const d = _drag; if (!d) return;
  cancelAnimationFrame(d.raf);
  d.handle.removeEventListener('pointermove', onDragMove);
  d.handle.removeEventListener('pointerup', onDragEnd);
  d.handle.removeEventListener('pointercancel', onDragCancel);
  try { d.handle.releasePointerCapture(d.pid); } catch (_) {}
  d.rows.forEach(r => { r.style.transform = ''; r.classList.remove('dragging'); });
  const list = document.getElementById('reorderList'); if (list) list.classList.remove('is-dragging');
  _drag = null;
}
function onDragEnd() {
  const d = _drag; if (!d) return;
  const { id, idx, over } = d;
  cleanupDrag();
  if (over !== idx) {
    const ids = liveHabits().map(h => h.id);
    ids.splice(idx, 1); ids.splice(over, 0, id);
    if (applyHabitOrder(ids)) {
      renderMyHabits();
      announceReorder(HABITS.find(x => x.id === id), over + 1, ids.length);
    }
  }
  const hnd = document.querySelector(`#reorderList .reorder-row[data-habit-id="${id}"] .drag-handle`);
  if (hnd) hnd.focus({ preventScroll: true });
}
function onDragCancel() { cleanupDrag(); }