import { MONTH_NAMES, type ChallengeError, type HabitFormError, type PauseError, type SleepError } from '@/domain';

/** Messages d'erreur du formulaire d'habitude (textes de la PWA). */
export const HABIT_FORM_ERRORS: Readonly<Record<HabitFormError, string>> = {
  name_required: 'Donne un nom à ton habitude',
  name_taken: 'Une habitude (peut-être archivée) porte déjà ce nom',
  no_day: 'Choisis au moins un jour',
  bad_numbers: 'Objectif, ajout et maximum doivent être positifs',
  max_below_goal: 'Le maximum doit être au moins égal à l’objectif',
  step_above_max: 'L’ajout par tap dépasse le maximum',
  no_level: 'Ajoute au moins un palier (ex. 15 min, 1 h)',
};

export const CHALLENGE_ERRORS: Readonly<Record<ChallengeError, string>> = {
  unknown_habit: 'Habitude introuvable',
  max_active: 'Maximum 5 défis en cours',
  already_active: 'Cette habitude a déjà un défi en cours',
  bad_duration: 'Durée : entre 3 et 365 jours',
  no_active_days: 'Cette habitude n’est active aucun de ces jours',
};

export const SLEEP_ERRORS: Readonly<Record<SleepError, string>> = {
  invalid_hours: "Saisis un nombre d'heures valide (0 à 23)",
  invalid_date: 'Date invalide',
};

export function pauseErrorMessage(error: PauseError): string {
  switch (error.code) {
    case 'empty_range':
      return 'Date invalide';
    case 'too_long':
      return `Une pause dure ${error.max} jours maximum`;
    case 'out_of_range':
      return 'Date hors de la période autorisée';
    case 'already_paused':
      return 'Ces jours sont déjà en pause';
    case 'quota_exceeded':
      return `Quota dépassé : ${error.left} jour(s) restant(s) en ${(MONTH_NAMES[Number(error.month.slice(5)) - 1] ?? '').toLowerCase()}`;
  }
}
