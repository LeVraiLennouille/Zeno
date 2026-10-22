/* HabitsTracker · Thème clair / sombre / automatique
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

/* ═══════════ Thème : clair / sombre / automatique ═══════════ */
const _mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const THEME_MODES = [['light','Clair'],['system','Auto'],['dark','Sombre']];

function isDarkNow() {
  const m = DB.profile.themeMode;
  if (m === 'dark') return true;
  if (m === 'light') return false;
  return !!(_mqDark && _mqDark.matches);
}
function themeSegHtml() {
  const m = DB.profile.themeMode || 'light';
  return THEME_MODES.map(([k, l]) =>
    `<button type="button" class="theme-seg-btn${m === k ? ' active' : ''}" aria-pressed="${m === k}" onclick="setThemeMode('${k}')">${l}</button>`).join('');
}
function renderThemeSegs() {
  document.querySelectorAll('.theme-seg').forEach(el => { el.innerHTML = themeSegHtml(); });
}
function initTheme() {
  const dark = isDarkNow();
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0E0F13' : '#EDEEF0');
  renderThemeSegs();
}
function setThemeMode(m) {
  DB.profile.themeMode = m;
  DB.profile.darkMode = (m === 'dark');
  saveData(); initTheme();
  if (activePage === 'report') renderActivePage();
}
if (_mqDark) {
  const onSystemTheme = () => {
    if (DB.profile.themeMode !== 'system') return;
    initTheme();
    if (activePage === 'report') renderActivePage();
  };
  if (_mqDark.addEventListener) _mqDark.addEventListener('change', onSystemTheme);
  else if (_mqDark.addListener) _mqDark.addListener(onSystemTheme);
}
initTheme();
