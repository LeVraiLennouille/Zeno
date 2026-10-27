const _mqDark=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
const THEME_MODES=[["light","Clair"],["system","Auto"],["dark","Sombre"]];
function isDarkNow(){const r=DB.profile.themeMode;return r==="dark"?!0:r==="light"?!1:!!(_mqDark&&_mqDark.matches)}
function themeSegHtml(){const t=DB.profile.themeMode||"light";return THEME_MODES.map(([e,n])=>`<button type="button" class="theme-seg-btn${t===e?" active":""}" aria-pressed="${t===e}" onclick="setThemeMode('${e}')">${n}</button>`).join("")}
function renderThemeSegs(){document.querySelectorAll(".theme-seg").forEach(e=>{e.innerHTML=themeSegHtml()})}
function initTheme(){const e=isDarkNow();document.documentElement.setAttribute("data-theme",e?"dark":"light");const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",e?"#0E0F13":"#EDEEF0"),renderThemeSegs()}
function setThemeMode(e){DB.profile.themeMode=e,DB.profile.darkMode=e==="dark",saveData(),initTheme(),activePage==="report"&&renderActivePage()}
if(_mqDark){const e=()=>{DB.profile.themeMode==="system"&&(initTheme(),activePage==="report"&&renderActivePage())};_mqDark.addEventListener?_mqDark.addEventListener("change",e):_mqDark.addListener&&_mqDark.addListener(e)}
initTheme();
