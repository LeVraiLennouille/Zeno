/* HabitsTracker · Respiration, méditation et suivi du sommeil
 * Script classique : il partage la portée globale avec les autres fichiers de js/ (ordre de chargement : voir index.html). */

const BREATHING_PATTERNS = {
  box:  { name:'Respiration carrée', phases:['Inhale','Hold','Exhale','Hold out'], durations:[4,4,4,4], desc:"Quatre temps égaux pour apaiser le stress et retrouver de la concentration." },
  '478':{ name:'4-7-8',              phases:['Inhale','Hold','Exhale'],            durations:[4,7,8],   desc:"Une longue expiration pour ralentir le rythme et favoriser l'endormissement." },
  calm: { name:'Calme',              phases:['Inhale','Hold','Exhale'],            durations:[5,2,5],   desc:"Un rythme lent et régulier pour se détendre à tout moment." },
};

let breath = {
  active: false,
  pattern: 'box',
  phaseIdx: 0,
  secondsLeft: 0,
  rounds: 0,
  timer: null,
};

const BREATH_SHORT = { 'Inhale':'Inspire', 'Hold':'Retiens', 'Hold out':'Retiens', 'Exhale':'Expire' };
const BREATH_LABEL = { 'Inhale':'Inspirez', 'Hold':'Retenez', 'Hold out':'Retenez', 'Exhale':'Expirez' };
let breathTick = 0;

function openBreathing() {
  document.getElementById('breathingOverlay').classList.add('open');
  resetBreathDisplay();
}
function closeBreathing() {
  stopBreathing();
  document.getElementById('breathingOverlay').classList.remove('open');
}

function renderBreathSteps() {
  const pat = BREATHING_PATTERNS[breath.pattern];
  document.getElementById('breathSteps').innerHTML = pat.phases.map((ph, i) =>
    `<div class="breath-step" data-i="${i}"><span class="bs-name">${BREATH_SHORT[ph]}</span><span class="bs-sec">${pat.durations[i]} s</span></div>`
  ).join('');
}
function markBreathStep(i) {
  document.querySelectorAll('.breath-step').forEach(el => el.classList.toggle('active', Number(el.dataset.i) === i));
}
function updateBreathRounds() {
  document.getElementById('breathRoundsCount').textContent = breath.rounds;
  document.getElementById('breathRoundsLabel').textContent = breath.rounds > 1 ? ' cycles terminés' : ' cycle terminé';
}
function setBreathStage(cls, dur) {
  const st = document.getElementById('breathStage');
  st.className = 'breath-stage' + (cls ? ' ' + cls : '');
  st.dataset.tick = String(breathTick % 2);
  if (dur) st.style.setProperty('--dur', dur + 's');
}
function setStartBtn(running) {
  const btn = document.getElementById('breathStartBtn');
  btn.innerHTML = running ? `${icon('stop')} Arrêter` : `${icon('play')} Commencer`;
  btn.classList.toggle('active', running);
}

function selectBreathPattern(p) {
  breath.pattern = p;
  document.querySelectorAll('.breath-pattern-btn').forEach(b => {
    const on = b.dataset.pattern === p;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  if (breath.active) stopBreathing();
  resetBreathDisplay();
}

function resetBreathDisplay() {
  const pat = BREATHING_PATTERNS[breath.pattern];
  breath.rounds = 0; breath.phaseIdx = 0;
  updateBreathRounds();
  document.getElementById('breathPhaseLabel').textContent = 'Prêt';
  document.getElementById('breathCountdown').textContent = pat.durations[0];
  document.getElementById('breathPatternDesc').textContent = pat.desc;
  renderBreathSteps();
  setBreathStage('');
  setStartBtn(false);
}

function toggleBreathing() {
  if (breath.active) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  breath.active = true;
  breath.phaseIdx = 0;
  breath.rounds = 0;
  updateBreathRounds();
  setStartBtn(true);
  runBreathPhase();
}

function stopBreathing() {
  breath.active = false;
  clearTimeout(breath.timer);
  setStartBtn(false);
  document.getElementById('breathPhaseLabel').textContent = 'Terminé';
  markBreathStep(-1);
  setBreathStage('');
}

function runBreathPhase() {
  if (!breath.active) return;
  const pat = BREATHING_PATTERNS[breath.pattern];
  const phase = pat.phases[breath.phaseIdx];
  const dur = pat.durations[breath.phaseIdx];
  breath.secondsLeft = dur;
  breathTick++;

  document.getElementById('breathPhaseLabel').textContent = BREATH_LABEL[phase] || phase;
  const cssPhase = phase==='Inhale' ? 'phase-inhale' : phase==='Exhale' ? 'phase-exhale' : phase==='Hold' ? 'phase-hold' : 'phase-hold-out';
  setBreathStage('running ' + cssPhase, dur);
  markBreathStep(breath.phaseIdx);

  const cd = document.getElementById('breathCountdown');
  cd.textContent = dur;
  let elapsed = 0;
  const tick = () => {
    if (!breath.active) return;
    elapsed++;
    const remaining = dur - elapsed;
    cd.textContent = remaining > 0 ? remaining : 0;
    if (elapsed < dur) {
      breath.timer = setTimeout(tick, 1000);
    } else {
      breath.phaseIdx = (breath.phaseIdx + 1) % pat.phases.length;
      if (breath.phaseIdx === 0) { breath.rounds++; updateBreathRounds(); }
      breath.timer = setTimeout(runBreathPhase, 100);
    }
  };
  breath.timer = setTimeout(tick, 1000);
}

/* ═══════════ Méditation ═══════════ */
const MED_DESC = {
  silence: 'Un silence apaisé, ponctué par une cloche au début et à la fin.',
  rain:    'Une pluie douce et continue pour couvrir les bruits alentour.',
  ocean:   'Des vagues lentes qui montent et descendent, comme une respiration.',
  drone:   'Une nappe grave et chaude, sans rythme, pour se poser.',
};
let med = { dur: 600, amb: 'silence', state: 'idle', remaining: 600, endAt: 0, iv: null, nodes: null, wake: null };

function medElapsed() {
  const rem = med.state === 'running' ? Math.max(0, Math.ceil((med.endAt - Date.now()) / 1000)) : med.remaining;
  return Math.max(0, med.dur - rem);
}
function medTodayMinutes() { return Math.round((DB.meditation || {})[today()] || 0); }

function openMeditation() {
  document.getElementById('meditationOverlay').classList.add('open');
  if (med.state === 'running' || med.state === 'paused') { updateMedUi(); return; }
  med.state = 'idle'; med.remaining = med.dur;
  updateMedUi();
}
function closeMeditation() {
  if ((med.state === 'running' || med.state === 'paused') && medElapsed() >= 30) {
    if (!confirm('Arrêter la session en cours ?')) return;
  }
  if (med.state === 'running' || med.state === 'paused') stopMeditation(true);
  document.getElementById('meditationOverlay').classList.remove('open');
}
function selectMedDuration(min) {
  if (med.state === 'running' || med.state === 'paused') return;
  med.dur = min * 60; med.remaining = med.dur; med.state = 'idle';
  updateMedUi();
}
function selectMedAmbience(a) {
  med.amb = a;
  if (med.state === 'running') startAmbience(a);
  updateMedUi();
}
function toggleMeditation() {
  if (med.state === 'idle' || med.state === 'done') { med.remaining = med.dur; medRun(true); }
  else if (med.state === 'running') medPause();
  else if (med.state === 'paused') medRun(false);
}
function medRun(withBell) {
  clearInterval(med.iv);
  med.state = 'running';
  med.endAt = Date.now() + med.remaining * 1000;
  if (withBell) playBell();
  startAmbience(med.amb);
  med.iv = setInterval(medTick, 250);
  acquireWake();
  updateMedUi();
}
function medPause() {
  med.remaining = Math.max(1, Math.ceil((med.endAt - Date.now()) / 1000));
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'paused';
  updateMedUi();
}
function medTick() {
  const rem = (med.endAt - Date.now()) / 1000;
  if (rem <= 0) { completeMeditation(); return; }
  med.remaining = Math.ceil(rem);
  updateMedClock();
}
function completeMeditation() {
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'done'; med.remaining = 0;
  playBell(); setTimeout(() => playBell(), 2600);
  const minutes = med.dur / 60;
  logMeditation(minutes);
  if (DB.meditationXpDay !== today()) {
    DB.meditationXpDay = today(); giveXP(10);
    showToast(`Session terminée : ${minutes} min · +10 XP`, 3600, 'zen');
  } else {
    showToast(`Session terminée : ${minutes} min`, 3000, 'zen');
  }
  saveData(); checkAchievements();
  updateMedUi();
  if (activePage === 'report') renderReport();
}
// early = true : l'utilisateur interrompt ; on enregistre le temps réellement médité.
function stopMeditation(early) {
  if (med.state !== 'running' && med.state !== 'paused') return;
  if (early === true) {
    const mins = Math.floor(medElapsed() / 60);
    if (mins >= 1) { logMeditation(mins); saveData(); checkAchievements(); }
  }
  clearInterval(med.iv); med.iv = null;
  stopAmbience(false); releaseWake();
  med.state = 'idle'; med.remaining = med.dur;
  updateMedUi();
}
function logMeditation(minutes) {
  if (!DB.meditation) DB.meditation = {};
  DB.meditation[today()] = Math.round(((DB.meditation[today()] || 0) + minutes) * 10) / 10;
  saveData();
}

/* ── Interface ── */
function medFmt(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function updateMedClock() {
  const clock = document.getElementById('medClock'); if (clock) clock.textContent = medFmt(med.remaining);
  const ring = document.getElementById('medRing');
  if (ring) {
    const total = med.dur;
    const progress = med.state === 'running'
      ? 1 - Math.max(0, (med.endAt - Date.now()) / 1000) / total
      : (med.state === 'done' ? 1 : 1 - med.remaining / total);
    ring.style.strokeDashoffset = String(880 * (1 - Math.min(1, Math.max(0, med.state === 'idle' ? 0 : progress))));
  }
}
function updateMedUi() {
  const running = med.state === 'running', paused = med.state === 'paused', busy = running || paused;
  document.querySelectorAll('#medDurRow .breath-pattern-btn').forEach(b => {
    const on = Number(b.dataset.min) * 60 === med.dur;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); b.disabled = busy;
  });
  document.querySelectorAll('#medAmbRow .med-amb-btn').forEach(b => {
    const on = b.dataset.amb === med.amb;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
  });
  const stage = document.getElementById('medStage');
  if (stage) stage.classList.toggle('med-running', running);
  const status = document.getElementById('medStatus');
  if (status) status.textContent = running ? 'En cours' : paused ? 'En pause' : med.state === 'done' ? 'Session terminée ✓' : 'Prêt';
  const desc = document.getElementById('medDesc');
  if (desc) desc.textContent = (MED_DESC[med.amb] || '') + (DB.profile.soundEnabled === false ? ' (Les sons sont désactivés dans ton compte.)' : '');
  const btn = document.getElementById('medStartBtn');
  if (btn) {
    btn.innerHTML = running ? 'Pause' : paused ? `${icon('play')} Reprendre` : med.state === 'done' ? `${icon('play')} Recommencer` : `${icon('play')} Commencer`;
    btn.classList.toggle('active', running);
  }
  const stop = document.getElementById('medStopBtn'); if (stop) stop.classList.toggle('hidden', !busy);
  const today_ = document.getElementById('medTodayMin'); if (today_) today_.textContent = medTodayMinutes();
  updateMedClock();
}

/* ── Écran toujours allumé pendant la séance ── */
async function acquireWake() { try { if ('wakeLock' in navigator) med.wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { if (med.wake) { med.wake.release(); med.wake = null; } } catch (e) {} }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (med.state === 'running') { acquireWake(); medTick(); }
});

/* ── Sons : cloche et ambiances (Web Audio, aucun fichier) ── */
function playBell(scale) {
  if (!DB.profile.soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime; const base = 196 * (scale || 1);
    [[1, 0.55, 7], [2.76, 0.28, 4.5], [5.4, 0.14, 3], [8.93, 0.07, 2]].forEach(([ratio, amp, dec]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + dec + 0.1);
    });
  } catch (e) {}
}
function _noiseBuffer(kind) {
  const sr = audioCtx.sampleRate, len = sr * 4;
  const buf = audioCtx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
  if (kind === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;  b4 = 0.55 * b4 + w * 0.5329522;   b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
  }
  return buf;
}
function startAmbience(kind) {
  stopAmbience(true);
  if (!audioCtx || kind === 'silence' || !DB.profile.soundEnabled) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(1, t + 3);
    master.connect(audioCtx.destination);
    const stops = [];
    const noise = type => { const s = audioCtx.createBufferSource(); s.buffer = _noiseBuffer(type); s.loop = true; stops.push(s); return s; };
    const filt = (type, f) => { const b = audioCtx.createBiquadFilter(); b.type = type; b.frequency.value = f; return b; };
    const gain = v => { const g = audioCtx.createGain(); g.gain.value = v; return g; };
    if (kind === 'rain') {
      const s = noise('pink'), hp = filt('highpass', 900), lp = filt('lowpass', 7000), g = gain(0.5);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); s.start();
    } else if (kind === 'ocean') {
      const s = noise('brown'), lp = filt('lowpass', 650), swell = gain(0.45);
      const lfo = audioCtx.createOscillator(), lfoG = gain(0.35);
      lfo.type = 'sine'; lfo.frequency.value = 0.09; stops.push(lfo);
      lfo.connect(lfoG); lfoG.connect(swell.gain);
      s.connect(lp); lp.connect(swell); swell.connect(master); s.start(); lfo.start();
    } else if (kind === 'drone') {
      const amp = gain(0.9);
      const lfo = audioCtx.createOscillator(), lfoG = gain(0.12);
      lfo.type = 'sine'; lfo.frequency.value = 0.07; stops.push(lfo);
      lfo.connect(lfoG); lfoG.connect(amp.gain);
      [[110, 0.10, 0], [164.81, 0.07, 3], [220, 0.06, -3], [329.63, 0.025, 2]].forEach(([f, v, det]) => {
        const o = audioCtx.createOscillator(), g = gain(v);
        o.type = 'sine'; o.frequency.value = f; o.detune.value = det; stops.push(o);
        o.connect(g); g.connect(amp); o.start();
      });
      amp.connect(master); lfo.start();
    }
    med.nodes = { master, stops };
  } catch (e) {}
}
function stopAmbience(immediate) {
  const n = med.nodes; if (!n) return; med.nodes = null;
  try {
    const t = audioCtx.currentTime;
    n.master.gain.cancelScheduledValues(t);
    n.master.gain.setValueAtTime(n.master.gain.value, t);
    n.master.gain.linearRampToValueAtTime(0, t + (immediate ? 0.05 : 1.5));
    n.stops.forEach(s => { try { s.stop(t + (immediate ? 0.1 : 1.6)); } catch (e) {} });
    setTimeout(() => { try { n.master.disconnect(); } catch (e) {} }, immediate ? 200 : 1800);
  } catch (e) {}
}

function openSleepEntry() {
  const t = today();
  const existing = (DB.sleepLog || {})[t] || {};
  const modal = document.getElementById('sleepEntryModal');

  document.getElementById('sleepHours').value = existing.hours !== undefined ? existing.hours : '';
  document.getElementById('sleepMinutes').value = existing.minutes !== undefined ? String(existing.minutes).padStart(2,'0') : '';
  document.getElementById('sleepBedtime').value = existing.bedtime || '';
  document.getElementById('sleepWakeTime').value = existing.wakeTime || '';
  document.getElementById('sleepDate').value = t;

  modal.classList.add('open');
}

function closeSleepEntry() {
  document.getElementById('sleepEntryModal').classList.remove('open');
}

function saveSleepEntry() {
  const hours = parseInt(document.getElementById('sleepHours').value);
  const minutes = parseInt(document.getElementById('sleepMinutes').value) || 0;
  const bedtime = document.getElementById('sleepBedtime').value;
  const wakeTime = document.getElementById('sleepWakeTime').value;
  const date = document.getElementById('sleepDate').value || today();

  if(isNaN(hours) || hours < 0 || hours > 23) {
    showToast('Saisis un nombre d\'heures valide (0 à 23)',3200,'alert');
    return;
  }

  if(!DB.sleepLog) DB.sleepLog = {};
  DB.sleepLog[date] = { hours, minutes, bedtime, wakeTime };

  if(DB.habits['sleep']) DB.habits['sleep'].logs[date] = 'done';

  saveData();
  closeSleepEntry();
  showToast(`Sommeil enregistré : ${hours} h ${minutes} min`,3200,'moon');
  renderSleepSummary();
  if(activePage === 'home') renderActivePage();
}

function renderSleepSummary() {
  const el = document.getElementById('sleepSummaryDisplay');
  if(!el) return;
  const t = today();
  const log = (DB.sleepLog || {})[t];

  if(!log) {
    el.innerHTML = `<p class="sleep-empty">Pas encore de nuit saisie aujourd'hui.</p>`;
    return;
  }

  const { hours, minutes, bedtime, wakeTime } = log;
  let html = `<div>
    <span class="sleep-big-value">${hours}</span><span class="sleep-big-unit">h</span>
    <span class="sleep-big-value" style="margin-left:4px">${String(minutes).padStart(2,'0')}</span><span class="sleep-big-unit">min</span>
  </div>`;

  if(bedtime || wakeTime) {
    html += `<div class="sleep-meta-row">`;
    if(bedtime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Coucher</span><span class="sleep-meta-value">${bedtime}</span></div>`;
    if(wakeTime) html += `<div class="sleep-meta-item"><span class="sleep-meta-label">Réveil</span><span class="sleep-meta-value">${wakeTime}</span></div>`;
    html += `</div>`;
  }
  el.innerHTML = html;
}