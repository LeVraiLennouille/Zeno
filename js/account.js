/* HabitsTracker · Page Succès, page Compte, profil et réinitialisation
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

function renderAchievements() {
  const c=document.getElementById('achievementsContent'); if(!c) return;
  c.innerHTML=`<div class="tabs-row ach-tabs">
      <button type="button" class="tab-btn${achTab==='challenges'?' active':''}" onclick="setAchTab('challenges')">Défis &amp; saison</button>
      <button type="button" class="tab-btn${achTab==='achievements'?' active':''}" onclick="setAchTab('achievements')">Succès</button>
    </div><div id="achBody"></div>`;
  if(achTab==='challenges') document.getElementById('achBody').innerHTML=`<div class="account-wrap">${challengesTabHtml()}</div>`;
  else renderAchievementsList();
}
function renderAchievementsList() {
  const container=document.getElementById('achBody'); if(!container) return;
  const unlocked=DB.unlockedAchievements.length;
  const total=ACHIEVEMENTS.length;
  const pct=Math.round((unlocked/total)*100);

  const categories=[
    { label:'Séries et régularité', ids:['consistent','dedicated','camel','hydration','bookworm','digital','night_tmd','plant_pwr','phonefree','king','sugarfree','ice_king'] },
    { label:'Étapes et XP',       ids:['first_habit','centurion','xp_500','on_fire','transcend'] },
    { label:'Journées parfaites',          ids:['perfect_wk','perfectist','ironwill'] },
    { label:'Bien-être',                   ids:['calm_mind','mindful_wk'] },
    { label:'Défis et saisons',            ids:['chal_first','chal_five','chal_30','season_5','season_max'] },
  ];

  const renderBadge=(a,i)=>{
    const isUnlocked=DB.unlockedAchievements.includes(a.id);
    return `<div class="achievement-badge ${isUnlocked?'unlocked':'locked'}" style="animation-delay:${i*.04}s">
      ${isUnlocked?'<div class="ach-unlocked-badge">✓</div>':''}
      <div class="ach-emoji">${a.emoji}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`;
  };

  const sectionsHtml=categories.map(cat=>{
    const badges=cat.ids.map((id,i)=>{
      const a=ACHIEVEMENTS.find(x=>x.id===id); if(!a) return '';
      return renderBadge(a,i);
    }).join('');
    return `<div class="ach-section">
      <div class="account-section-title">${cat.label}</div>
      <div class="achievements-grid">${badges}</div>
    </div>`;
  }).join('');

  const categorised=categories.flatMap(c=>c.ids);
  const otherBadges=ACHIEVEMENTS.filter(a=>!categorised.includes(a.id)).map(renderBadge).join('');
  const otherSection=otherBadges?`<div class="ach-section"><div class="account-section-title">Autres</div><div class="achievements-grid">${otherBadges}</div></div>`:'';

  container.innerHTML=`<div class="account-wrap">
    <div class="xp-card" style="margin-bottom:0">
      <div class="xp-card-row">
        <span class="xp-label">${icon('trophy')} Succès débloqués</span>
        <span class="xp-value">${unlocked} / ${total}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
    </div>
    ${sectionsHtml}
    ${otherSection}
  </div>`;
}

function renderAccount() {
  const container=document.getElementById('accountContent'); if(!container) return;
  const level=calcLevel(DB.xp); const prog=xpProgress(DB.xp);
  const name=esc(DB.profile.name||'Mon profil');
  const soundOn=DB.profile.soundEnabled!==false;
  const zenOn=!!DB.profile.zenMode;
  const reviewOn=DB.profile.weeklyReview!==false;
  const notifsOn=!!DB.profile.notifsEnabled;

  container.innerHTML=`<div class="account-wrap">
    <div class="account-profile-card">
      <div class="account-avatar">${icon('user')}</div>
      <div class="account-name">${name}</div>
      <div class="account-level-badge">Niv. ${level} — ${LEVEL_NAMES[level-1]||'Novice'}</div>
    </div>

    <div class="xp-card">
      <div class="xp-card-row">
        <span class="xp-label">Expérience</span>
        <span class="xp-value">${DB.xp} XP · ${prog.needed>0?`encore ${prog.needed}`:'niveau max'}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${prog.pct}%"></div></div>
      ${seasonMiniHtml()}
    </div>

    <div>
      <div class="account-section-title">Préférences</div>
      <div class="pref-card">
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('edit')}</span><div><div class="pref-label-text">Nom d'affichage</div><div class="pref-hint">${name}</div></div></div>
          <button class="pref-edit" onclick="openProfile()">Modifier</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('moon')}</span><div><div class="pref-label-text">Thème</div><div class="pref-hint">Clair, sombre ou selon l'appareil</div></div></div>
          <div class="theme-seg">${themeSegHtml()}</div>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('volume')}</span><div><div class="pref-label-text">Effets sonores</div><div class="pref-hint">Retour sonore à chaque action</div></div></div>
          <button class="pref-toggle ${soundOn?'on':'off'}" onclick="togglePref('sound')">${soundOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('zen')}</span><div><div class="pref-label-text">Mode zen</div><div class="pref-hint">Les habitudes terminées se replient</div></div></div>
          <button class="pref-toggle ${zenOn?'on':'off'}" onclick="togglePref('zen')">${zenOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🌅</span><div><div class="pref-label-text">Début de journée</div><div class="pref-hint">${dayStartHint()}</div></div></div>
          <select class="day-start-select" id="dayStartSelect" aria-label="Heure de début de journée" onchange="changeDayStart(this.value)">${dayStartOptions()}</select>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">📋</span><div><div class="pref-label-text">Bilan du lundi</div><div class="pref-hint">Résumé de la semaine écoulée</div></div></div>
          <button class="pref-toggle ${reviewOn?'on':'off'}" onclick="togglePref('review')" aria-label="Bilan du lundi">${reviewOn?'Activé':'Désactivé'}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon('bell')}</span><div><div class="pref-label-text">Notifications</div><div class="pref-hint">Rappels quotidiens</div></div></div>
          <button class="pref-toggle ${notifsOn?'on':'off'}" onclick="toggleNotifications()">${notifsOn?'Activé':'Désactivé'}</button>
        </div>
      </div>
    </div>

    ${pauseSectionHtml()}

    ${remindersSectionHtml()}

    ${backupSectionHtml()}

    <div class="danger-zone-card">
      <div class="account-section-title" style="color:var(--danger);margin-bottom:8px">${icon('alert')} Zone de danger</div>
      <div class="pref-hint" style="margin-bottom:12px">Efface définitivement toutes les données. Action irréversible.</div>
      <button class="modal-reset-btn" onclick="confirmReset()">${icon('trash')} Réinitialiser toutes les données</button>
    </div>
  </div>`;
}

function openProfile() {
  document.getElementById('pseudoInput').value=DB.profile.name||'';
  const dark=DB.profile.darkMode===true;
  const sound=DB.profile.soundEnabled!==false;
  const zen=!!DB.profile.zenMode;
  const notifs=!!DB.profile.notifsEnabled;
  renderThemeSegs();
  updateToggleBtn('soundToggle',sound);
  updateToggleBtn('zenToggle',zen);
  updateToggleBtn('notifsToggle',notifs);
  document.getElementById('profileModal').classList.add('open');
  setTimeout(()=>document.getElementById('pseudoInput').focus(),80);
}
function closeProfile() { document.getElementById('profileModal').classList.remove('open'); }
function updateToggleBtn(id,on) {
  const btn=document.getElementById(id); if(!btn) return;
  btn.textContent=on?'Activé':'Désactivé'; btn.className=`pref-toggle ${on?'on':'off'}`;
}
function saveProfileName() {
  DB.profile.name=document.getElementById('pseudoInput').value.trim();
  saveData(); closeProfile();
  if(activePage==='account') renderAccount();
}
function togglePref(pref) {
  if(pref==='review')   { DB.profile.weeklyReview=DB.profile.weeklyReview===false; }
  if(pref==='sound')    { DB.profile.soundEnabled=DB.profile.soundEnabled===false; }
  if(pref==='zen')      { DB.profile.zenMode=!DB.profile.zenMode; if(!DB.profile.zenMode) document.querySelectorAll('.habit-card.zen-collapse').forEach(el=>el.classList.remove('zen-collapse')); }
  saveData();
  openProfile();
  closeProfile();
  if(activePage==='account') renderAccount();
}

function confirmReset() {
  if(confirm('Cette action supprime définitivement TOUTES tes données et ne peut pas être annulée.\n\nVeux-tu vraiment tout effacer ?')){
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(BAK_KEY); localStorage.removeItem(BAK_KEY + '.at'); } catch(e) {}
    location.reload();
  }
}

/* ── Début de journée ── */
function dayStartOptions() {
  const cur = DB.profile.dayStartHour || 0;
  return [0, 1, 2, 3, 4, 5, 6].map(h => `<option value="${h}"${h === cur ? ' selected' : ''}>${h === 0 ? 'Minuit' : String(h).padStart(2, '0') + ':00'}</option>`).join('');
}
function dayStartHint() {
  const h = DB.profile.dayStartHour || 0;
  return h === 0 ? 'Les jours changent à minuit' : `Avant ${String(h).padStart(2, '0')}:00, tu es encore dans la journée de la veille`;
}
function changeDayStart(v) {
  const h = Math.max(0, Math.min(6, parseInt(v, 10) || 0));
  const before = today();
  DB.profile.dayStartHour = h; setDayStartHour(h); saveData();
  scheduleMidnightCheck();
  if (today() !== before) checkDayChange(); else renderActivePage();
  showToast(h === 0 ? 'Les jours changent à minuit' : `Ta journée commence à ${String(h).padStart(2, '0')}:00`, 3200, 'moon');
  if (activePage === 'account') renderAccount();
}