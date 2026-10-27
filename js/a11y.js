/* HabitsTracker · Accessibilité des fenêtres (focus, Échap, rôles ARIA)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Accessibilité des fenêtres (modales, feuilles, plein écran) ═══════════ */
const DIALOG_SELECTOR = '.modal-overlay, .breathing-overlay';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let _dialogStack = [];
const _dialogOpeners = new Map();

function allDialogs() { return [...document.querySelectorAll(DIALOG_SELECTOR)]; }
function isVisibleEl(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
function dialogFocusables(root) { return [...root.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden], .hidden') && isVisibleEl(el)); }
function setAppInert(on) {
  const app = document.querySelector('.app'); if (!app) return;
  app.inert = on;
  if (on) app.setAttribute('aria-hidden', 'true'); else app.removeAttribute('aria-hidden');
}
function onDialogOpened(d) {
  d.inert = false;
  _dialogStack = _dialogStack.filter(x => x !== d); _dialogStack.push(d);
  if (!_dialogOpeners.has(d)) _dialogOpeners.set(d, document.activeElement);
  setAppInert(true);
  setTimeout(() => {                                   // laisse l'animation d'ouverture démarrer
    if (!d.classList.contains('open')) return;
    const inner = d.querySelector('[autofocus]') || dialogFocusables(d).find(el => !el.matches('.modal-x, .breathing-close')) || dialogFocusables(d)[0];
    (inner || d).focus({ preventScroll: true });
  }, 60);
}
function onDialogClosed(d) {
  d.inert = true;
  _dialogStack = _dialogStack.filter(x => x !== d);
  if (_dialogStack.length === 0) setAppInert(false);
  const op = _dialogOpeners.get(d); _dialogOpeners.delete(d);
  if (_dialogStack.length === 0 && op && document.contains(op) && typeof op.focus === 'function' && !op.disabled) op.focus({ preventScroll: true });
}
function closeTopDialog() {
  const top = _dialogStack[_dialogStack.length - 1]; if (!top) return false;
  const btn = top.querySelector('.modal-x, .breathing-close');
  (btn || top).click();                                // même chemin que le bouton ✕ ou le clic sur le fond
  return true;
}
function setupDialogs() {
  let n = 0;
  allDialogs().forEach(d => {
    const innerDialog = d.querySelector('[role="dialog"]');
    if (!innerDialog && !d.getAttribute('role')) {
      d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
      const title = d.querySelector('.modal-title, .mood-sheet-title, .breathing-title');
      if (title) { if (!title.id) title.id = 'dlgTitle' + (++n); d.setAttribute('aria-labelledby', title.id); }
    }
    if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
    d.querySelectorAll('.modal-x:not([aria-label]), .breathing-close:not([aria-label])').forEach(b => b.setAttribute('aria-label', 'Fermer'));
    d.inert = !d.classList.contains('open');
  });
  const toast = document.getElementById('toast');
  if (toast && !toast.getAttribute('role')) { toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); }
  const mo = new MutationObserver(muts => muts.forEach(m => {
    const d = m.target, was = !!(m.oldValue && /(^|\s)open(\s|$)/.test(m.oldValue)), is = d.classList.contains('open');
    if (is && !was) onDialogOpened(d); else if (!is && was) onDialogClosed(d);
  }));
  allDialogs().forEach(d => mo.observe(d, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
  document.addEventListener('keydown', e => {
    const top = _dialogStack[_dialogStack.length - 1]; if (!top) return;
    if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); closeTopDialog(); return; }
    if (e.key !== 'Tab') return;
    const f = dialogFocusables(top);
    if (!f.length) { e.preventDefault(); top.focus(); return; }
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (!top.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (a === first || a === top)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
}