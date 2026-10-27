function renderAchievements(){const e=document.getElementById("achievementsContent");e&&(e.innerHTML=`<div class="tabs-row ach-tabs">
      <button type="button" class="tab-btn${achTab==="challenges"?" active":""}" onclick="setAchTab('challenges')">Défis &amp; saison</button>
      <button type="button" class="tab-btn${achTab==="achievements"?" active":""}" onclick="setAchTab('achievements')">Succès</button>
    </div><div id="achBody"></div>`,achTab==="challenges"?document.getElementById("achBody").innerHTML=`<div class="account-wrap">${challengesTabHtml()}</div>`:renderAchievementsList())}
function renderAchievementsList(){const c=document.getElementById("achBody");if(!c)return;const n=DB.unlockedAchievements.length,t=ACHIEVEMENTS.length,r=Math.round(n/t*100),a=[{label:"Séries et régularité",ids:["consistent","dedicated","camel","hydration","bookworm","digital","night_tmd","plant_pwr","phonefree","king","sugarfree","ice_king"]},{label:"Étapes et XP",ids:["first_habit","centurion","xp_500","on_fire","transcend"]},{label:"Journées parfaites",ids:["perfect_wk","perfectist","ironwill"]},{label:"Bien-être",ids:["calm_mind","mindful_wk"]},{label:"Défis et saisons",ids:["chal_first","chal_five","chal_30","season_5","season_max"]}],d=(e,s)=>{const i=DB.unlockedAchievements.includes(e.id);return`<div class="achievement-badge ${i?"unlocked":"locked"}" style="animation-delay:${s*.04}s">
      ${i?'<div class="ach-unlocked-badge">✓</div>':""}
      <div class="ach-emoji">${e.emoji}</div>
      <div class="ach-name">${e.name}</div>
      <div class="ach-desc">${e.desc}</div>
    </div>`},v=a.map(e=>{const s=e.ids.map((i,m)=>{const o=ACHIEVEMENTS.find(p=>p.id===i);return o?d(o,m):""}).join("");return`<div class="ach-section">
      <div class="account-section-title">${e.label}</div>
      <div class="achievements-grid">${s}</div>
    </div>`}).join(""),h=a.flatMap(e=>e.ids),l=ACHIEVEMENTS.filter(e=>!h.includes(e.id)).map(d).join(""),u=l?`<div class="ach-section"><div class="account-section-title">Autres</div><div class="achievements-grid">${l}</div></div>`:"";c.innerHTML=`<div class="account-wrap">
    <div class="xp-card" style="margin-bottom:0">
      <div class="xp-card-row">
        <span class="xp-label">${icon("trophy")} Succès débloqués</span>
        <span class="xp-value">${n} / ${t}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${r}%"></div></div>
    </div>
    ${v}
    ${u}
  </div>`}
function renderAccount(){const i=document.getElementById("accountContent");if(!i)return;const s=calcLevel(DB.xp),e=xpProgress(DB.xp),n=esc(DB.profile.name||"Mon profil"),a=DB.profile.soundEnabled!==!1,t=!!DB.profile.zenMode,c=DB.profile.weeklyReview!==!1,l=!!DB.profile.notifsEnabled;i.innerHTML=`<div class="account-wrap">
    <div class="account-profile-card">
      <div class="account-avatar">${icon("user")}</div>
      <div class="account-name">${n}</div>
      <div class="account-level-badge">Niv. ${s} — ${LEVEL_NAMES[s-1]||"Novice"}</div>
    </div>

    <div class="xp-card">
      <div class="xp-card-row">
        <span class="xp-label">Expérience</span>
        <span class="xp-value">${DB.xp} XP · ${e.needed>0?`encore ${e.needed}`:"niveau max"}</span>
      </div>
      <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${e.pct}%"></div></div>
      ${seasonMiniHtml()}
    </div>

    <div>
      <div class="account-section-title">Préférences</div>
      <div class="pref-card">
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon("edit")}</span><div><div class="pref-label-text">Nom d'affichage</div><div class="pref-hint">${n}</div></div></div>
          <button class="pref-edit" onclick="openProfile()">Modifier</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon("moon")}</span><div><div class="pref-label-text">Thème</div><div class="pref-hint">Clair, sombre ou selon l'appareil</div></div></div>
          <div class="theme-seg">${themeSegHtml()}</div>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon("volume")}</span><div><div class="pref-label-text">Effets sonores</div><div class="pref-hint">Retour sonore à chaque action</div></div></div>
          <button class="pref-toggle ${a?"on":"off"}" onclick="togglePref('sound')">${a?"Activé":"Désactivé"}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon("zen")}</span><div><div class="pref-label-text">Mode zen</div><div class="pref-hint">Les habitudes terminées se replient</div></div></div>
          <button class="pref-toggle ${t?"on":"off"}" onclick="togglePref('zen')">${t?"Activé":"Désactivé"}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">🌅</span><div><div class="pref-label-text">Début de journée</div><div class="pref-hint">${dayStartHint()}</div></div></div>
          <select class="day-start-select" id="dayStartSelect" aria-label="Heure de début de journée" onchange="changeDayStart(this.value)">${dayStartOptions()}</select>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">📋</span><div><div class="pref-label-text">Bilan du lundi</div><div class="pref-hint">Résumé de la semaine écoulée</div></div></div>
          <button class="pref-toggle ${c?"on":"off"}" onclick="togglePref('review')" aria-label="Bilan du lundi">${c?"Activé":"Désactivé"}</button>
        </div>
        <div class="pref-row">
          <div class="pref-info"><span class="pref-icon">${icon("bell")}</span><div><div class="pref-label-text">Notifications</div><div class="pref-hint">Rappels quotidiens</div></div></div>
          <button class="pref-toggle ${l?"on":"off"}" onclick="toggleNotifications()">${l?"Activé":"Désactivé"}</button>
        </div>
      </div>
    </div>

    ${pauseSectionHtml()}

    ${remindersSectionHtml()}

    ${backupSectionHtml()}

    <div class="danger-zone-card">
      <div class="account-section-title" style="color:var(--danger);margin-bottom:8px">${icon("alert")} Zone de danger</div>
      <div class="pref-hint" style="margin-bottom:12px">Efface définitivement toutes les données. Action irréversible.</div>
      <button class="modal-reset-btn" onclick="confirmReset()">${icon("trash")} Réinitialiser toutes les données</button>
    </div>
  </div>`}
function openProfile(){document.getElementById("pseudoInput").value=DB.profile.name||"";const t=DB.profile.darkMode===!0,e=DB.profile.soundEnabled!==!1,o=!!DB.profile.zenMode,n=!!DB.profile.notifsEnabled;renderThemeSegs(),updateToggleBtn("soundToggle",e),updateToggleBtn("zenToggle",o),updateToggleBtn("notifsToggle",n),document.getElementById("profileModal").classList.add("open"),setTimeout(()=>document.getElementById("pseudoInput").focus(),80)}
function closeProfile(){document.getElementById("profileModal").classList.remove("open")}
function updateToggleBtn(n,e){const t=document.getElementById(n);t&&(t.textContent=e?"Activé":"Désactivé",t.className=`pref-toggle ${e?"on":"off"}`)}
function saveProfileName(){DB.profile.name=document.getElementById("pseudoInput").value.trim(),saveData(),closeProfile(),activePage==="account"&&renderAccount()}
function togglePref(e){e==="review"&&(DB.profile.weeklyReview=DB.profile.weeklyReview===!1),e==="sound"&&(DB.profile.soundEnabled=DB.profile.soundEnabled===!1),e==="zen"&&(DB.profile.zenMode=!DB.profile.zenMode,DB.profile.zenMode||document.querySelectorAll(".habit-card.zen-collapse").forEach(o=>o.classList.remove("zen-collapse"))),saveData(),openProfile(),closeProfile(),activePage==="account"&&renderAccount()}
function confirmReset(){if(confirm(`Cette action supprime définitivement TOUTES tes données et ne peut pas être annulée.

Veux-tu vraiment tout effacer ?`)){try{localStorage.removeItem(STORE_KEY),localStorage.removeItem(BAK_KEY),localStorage.removeItem(BAK_KEY+".at")}catch{}location.reload()}}
function dayStartOptions(){const n=DB.profile.dayStartHour||0;return[0,1,2,3,4,5,6].map(t=>`<option value="${t}"${t===n?" selected":""}>${t===0?"Minuit":String(t).padStart(2,"0")+":00"}</option>`).join("")}
function dayStartHint(){const t=DB.profile.dayStartHour||0;return t===0?"Les jours changent à minuit":`Avant ${String(t).padStart(2,"0")}:00, tu es encore dans la journée de la veille`}
function changeDayStart(e){const a=Math.max(0,Math.min(6,parseInt(e,10)||0)),t=today();DB.profile.dayStartHour=a,setDayStartHour(a),saveData(),scheduleMidnightCheck(),today()!==t?checkDayChange():renderActivePage(),showToast(a===0?"Les jours changent à minuit":`Ta journée commence à ${String(a).padStart(2,"0")}:00`,3200,"moon"),activePage==="account"&&renderAccount()}
