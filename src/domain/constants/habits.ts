import type { Habit } from '../types/habit';
import type { Reminder } from '../types/db';

/** Habitudes livrées par défaut (identiques à `DEFAULT_HABITS` de core.js). */
export const DEFAULT_HABITS: readonly Habit[] = [
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

export const DEFAULT_REMINDERS: readonly Reminder[] = [
  { id: 'r_work', title: '💼 Mode travail', body: 'Mode concentration activé.', hour: 8, minute: 30, days: [1, 2, 3, 4, 5], habitId: 'work', enabled: true },
  { id: 'r_running', title: '🏃 Heure de courir', body: 'Enfile tes baskets !', hour: 17, minute: 30, days: [1, 2, 3, 4, 5], habitId: 'running', enabled: true },
  { id: 'r_sleep', title: '💤 Extinction des feux', body: 'Ton lit te réclame.', hour: 21, minute: 0, days: [1, 2, 3, 4, 5], habitId: '', enabled: true },
  { id: 'r_phone', title: '📵 Téléphone posé', body: 'Branche ton téléphone loin.', hour: 21, minute: 0, days: [0, 1, 2, 3, 4, 5, 6], habitId: '', enabled: true },
];

/** L'eau est toujours stockée sous cet identifiant. */
export const DRINK_ID = 'drink';
export const DRINK_GOAL = 2000;
export const DRINK_STEP = 250;
export const DRINK_MAX = 5000;

/** Maximum de séances pour une habitude « X fois par semaine ». */
export const TIMES_MAX = 6;
