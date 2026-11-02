'use strict';
/** Données de test déterministes (PRNG à graine) au format de la PWA (clé ht-v2.6). */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const DEFAULTS = [
  { id: 'sleep', name: 'Sommeil', emoji: '💤', type: 'good', color: '#8EA2FF', freq: 'Lundi - Vendredi', weekdayOnly: true },
  { id: 'projets', name: 'Projets perso', emoji: '🚀', type: 'good', color: '#C79BFF', freq: 'Tous les jours', weekdayOnly: false },
  { id: 'work', name: 'Travail', emoji: '💼', type: 'good', color: '#FFD23F', freq: 'Lundi - Vendredi', weekdayOnly: true },
  { id: 'gym', name: 'Gym', emoji: '🏋️', type: 'good', color: '#52E0A1', freq: 'Lundi - Vendredi', weekdayOnly: true },
  { id: 'running', name: 'Running', emoji: '🏃', type: 'counter', color: '#FF8A4C', freq: '5 jours par semaine', weekdayOnly: false, step: 1, goal: 5, max: 15, unit: 'km' },
  { id: 'setp', name: 'Pas', emoji: '👣', type: 'counter', color: '#2EC4B6', freq: 'Tous les jours', weekdayOnly: false, step: 1000, goal: 10000, max: 20000, unit: 'pas' },
  { id: 'drink', name: "Boire de l'eau", emoji: '💧', type: 'drink', color: '#52C7F2', freq: 'Tous les jours', weekdayOnly: false, step: 250, goal: 2000, max: 5000, unit: 'ml' },
  { id: 'read', name: '15min Lecture', emoji: '📚', type: 'counter', color: '#FF7EB0', freq: 'Tous les jours', weekdayOnly: false, optional: true, step: 5, goal: 15, max: 30, unit: 'min' },
  { id: 'cleaning', name: 'Nettoyage', emoji: '🧹', type: 'weekly', color: '#C3E34A', freq: 'Tous les dimanches', weekdayOnly: false, optional: true },
];

const EXTRA = [
  { id: 'smoke', name: 'Cigarette', emoji: '🚬', type: 'bad', color: '#FF5D5D', freq: 'Tous les jours', weekdayOnly: false, optional: false, levels: ['5 min', '15 min', '1 h'], custom: true },
  { id: 'sugar', name: 'Sucre', emoji: '🍬', type: 'bad', color: '#FF8AD8', freq: 'Tous les jours', weekdayOnly: false, optional: true, custom: true },
  { id: 'tt', name: 'Méditation', emoji: '🧘', type: 'times', color: '#6FD6C9', freq: '3 fois par semaine', weekdayOnly: false, optional: false, target: 3, custom: true },
  { id: 'yoga', name: 'Yoga', emoji: '🤸', type: 'good', color: '#B7E3A1', freq: 'Lun, Mer, Ven', weekdayOnly: false, optional: false, activeDays: [1, 3, 5], custom: true },
  { id: 'newone', name: 'Marche', emoji: '🚶', type: 'counter', color: '#9AD0FF', freq: 'Tous les jours', weekdayOnly: false, optional: false, step: 500, goal: 3000, max: 9000, unit: 'm', since: '2026-09-10', custom: true },
  { id: 'old', name: 'Ancienne', emoji: '📦', type: 'good', color: '#CCCCCC', freq: 'Tous les jours', weekdayOnly: false, optional: false, archived: true, archivedOn: '2026-08-15', gaps: [{ from: '2026-08-15' }], custom: true },
  { id: 'gap', name: 'Pause longue', emoji: '🪴', type: 'good', color: '#99CC66', freq: 'Tous les jours', weekdayOnly: false, optional: false, gaps: [{ from: '2026-07-01', to: '2026-07-20' }], custom: true },
];

/**
 * @param {{seed?: number, start?: string, end?: string}} [opts]
 */
function buildDb({ seed = 42, start = '2026-05-01', end = '2026-10-28' } = {}) {
  const rnd = mulberry32(seed);
  const defs = [...DEFAULTS, ...EXTRA].map((h) => JSON.parse(JSON.stringify(h)));
  const habits = {};
  defs.forEach((h) => (habits[h.id] = { logs: {} }));

  for (let d = at(start); key(d) <= end; d.setDate(d.getDate() + 1)) {
    const k = key(d);
    for (const h of defs) {
      const logs = habits[h.id].logs;
      const r = rnd();
      switch (h.type) {
        case 'good':
          if (r < 0.72) logs[k] = 'done';
          break;
        case 'weekly':
          if (d.getDay() === 0 && r < 0.6) logs[k] = 'done';
          break;
        case 'times':
          if (r < 0.45) logs[k] = 'done';
          break;
        case 'counter':
          if (r < 0.8) logs[k] = Math.min(h.max, Math.round(rnd() * (h.goal * 1.4) / h.step) * h.step) || undefined;
          if (logs[k] === undefined) delete logs[k];
          break;
        case 'drink':
          if (r < 0.15) logs[k] = 'done'; // ancien format (eau cochée)
          else if (r < 0.85) logs[k] = Math.round(rnd() * 12) * 250;
          if (logs[k] === 0) delete logs[k];
          break;
        case 'bad':
          if (r < 0.12) {
            logs[k] = 'fail';
            if (h.levels) {
              habits[h.id].vals = habits[h.id].vals || {};
              habits[h.id].vals[k] = h.levels[Math.floor(rnd() * h.levels.length)];
            }
          }
          break;
      }
    }
  }

  // Jour courant : quasi complet pour exercer la « journée parfaite ».
  const todayKey = end;
  for (const h of defs) {
    if (['good', 'times'].includes(h.type) && !h.archived) habits[h.id].logs[todayKey] = 'done';
  }
  habits.drink.logs[todayKey] = 1750;
  habits.running.logs[todayKey] = 4;
  habits.setp.logs[todayKey] = 9000;
  habits.cleaning.logs[todayKey] = 'done';

  const pauses = {};
  ['2026-07-10', '2026-07-11', '2026-07-12', '2026-10-20', '2026-10-21'].forEach((k) => (pauses[k] = { reason: 'sick' }));
  pauses['2026-08-03'] = { reason: 'trip' };

  const mk = (id, habitId, start, days, required, status, reward, endedOn) => ({
    id, habitId, title: `Défi ${id}`, emoji: '🎯', color: '#8EA2FF', days, required, start, status, reward,
    ...(endedOn ? { endedOn } : {}),
  });

  return {
    createdAt: start,
    xp: 640,
    profile: {
      name: 'Test', avatar: '🦊', soundEnabled: true, notifsEnabled: false, zenMode: false, darkMode: false,
      themeMode: 'light', pauseQuota: 3, dayStartHour: 0, weeklyReview: true,
      moodFeelings: { '2026-10-27': 'Détente,Énergie', '2026-10-24': 'Joie,Courage,Motivation,Calme,Gratitude,Amour', '2026-10-15': 'Colère', '2026-09-30': 'Joie' },
    },
    habitDefs: defs,
    habits,
    moods: {
      '2026-10-27': 4, '2026-10-26': 2, '2026-10-24': 5, '2026-10-20': 3, '2026-10-15': 1, '2026-10-02': 4,
      '2026-09-30': 5, '2026-09-12': 2, '2025-12-24': 5, '2026-06-01': 3,
    },
    journal: {
      '2026-10-27': 'Bonne journée', '2026-10-24': 'Sortie vélo, super météo !', '2026-10-15': 'Journée difficile au travail',
      '2026-10-02': 'Début de mois calme', '2026-09-30': 'Fin de mois, bilan positif', '2026-09-12': 'Fatigué',
      '2025-12-24': 'Réveillon en famille', '2026-06-01': 'Rien de spécial, vélo quand même',
    },
    pauses,
    xpWeek: { '2026-10-19': 120, '2026-10-26': 60 },
    meditation: { '2026-10-01': 6, '2026-10-02': 3, '2026-10-03': 10, '2026-10-04': 5, '2026-10-05': 5, '2026-10-06': 2, '2026-10-07': 8, '2026-10-08': 9 },
    sleepLog: { '2026-10-27': { hours: 7, minutes: 30, bedtime: '23:00', wakeTime: '06:30' } },
    reminders: [
      { id: 'r_gym', title: 'Gym', body: 'Go', hour: 18, minute: 0, days: [1, 3, 5], habitId: 'gym', enabled: true },
      { id: 'r_free', title: 'Libre', body: '', hour: 9, minute: 30, days: [0, 6], habitId: '', enabled: true },
    ],
    challenges: [
      mk('c_gym', 'gym', '2026-10-10', 30, 'all', 'active', 40),
      mk('c_smoke', 'smoke', '2026-10-01', 21, 'all', 'active', 50),
      mk('c_run', 'running', '2026-10-20', 14, 8, 'active', 34),
      mk('c_proj', 'projets', '2026-10-22', 7, 5, 'active', 25),
      mk('c_old', 'read', '2026-08-01', 14, 'all', 'won', 52, '2026-08-14'),
    ],
    seasonXp: { 'autumn-2026': 820, 'summer-2026': 2600 },
    unlockedAchievements: ['first_habit', 'centurion'],
    perfectDaysClaimed: ['2026-10-10', '2026-10-11', '2026-10-12'],
    penaltiesApplied: [],
  };
}

module.exports = { buildDb, mulberry32, key, at };
