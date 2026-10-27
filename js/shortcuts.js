/* HabitsTracker · Raccourcis PWA (actions de lancement)
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Raccourcis PWA (appui long sur l'icône) ═══════════ */
function quickWater() {
  if (!liveHabits().some(h => h.type === 'drink')) { showToast('Habitude « eau » introuvable', 3000, 'alert'); return; }
  const c = drinkCfg(); const before = getDrinkMl(today());
  if (before >= c.max) { showToast(`Maximum atteint : ${fmtNum(c.max)} ml`, 2800, 'drink'); return; }
  addDrinkAmount(250);
  const after = getDrinkMl(today());
  if (!(before < c.goal && after >= c.goal)) showToast(`+250 ml · ${fmtNum(after)} / ${fmtNum(c.goal)} ml`, 2800, 'drink');
}
const LAUNCH_ACTIONS = {
  mood:       () => openMoodModal(today()),
  breathing:  () => openBreathing(),
  meditation: () => openMeditation(),
  water:      () => quickWater(),
};
function handleLaunchAction() {
  let action = null;
  try { action = new URLSearchParams(location.search).get('action'); } catch (e) {}
  if (!action) return;
  // On nettoie l'URL pour qu'un rechargement ne rejoue pas l'action.
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  const run = LAUNCH_ACTIONS[action]; if (!run) return;
  if (action === 'mood') sessionStorage.setItem('moodChecked', '1');
  setTimeout(run, 350);
}