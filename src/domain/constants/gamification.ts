export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2400, 3200, 4200] as const;

export const LEVEL_NAMES = [
  'Novice', 'Apprenti', 'Pratiquant', 'Fervent', 'Discipliné',
  'Concentré', 'Maître', 'Grand maître', 'Légende', 'Transcendant',
] as const;

/** XP versée pour chaque action (cf. readme, § Gamification). */
export const XP = {
  good: 10,
  weekly: 20,
  goal: 10,
  perfectDay: 50,
  meditation: 10,
} as const;

export const MOOD_LABELS = ['', 'Mal', 'Bof', 'Neutre', 'Bien', 'Super'] as const;
export const MOOD_EMOJIS = ['', '😡', '😢', '😐', '😊', '😎'] as const;

export const FEELINGS_BY_MOOD: Readonly<Record<1 | 2 | 3 | 4 | 5, readonly string[]>> = {
  5: ['Joie', 'Courage', 'Motivation', 'Créativité', 'Confiance', 'Calme', 'Gratitude', 'Sérénité', 'Enthousiasme', 'Amour', 'Espoir', 'Inspiration', 'Fierté', 'Euphorie', 'Nostalgie'],
  4: ['Détente', 'Contentement', 'Optimisme', 'Énergie', 'Concentration', 'Gaieté', 'Satisfaction', 'Légèreté', 'Gratitude', 'Fraîcheur'],
  3: ['Neutre', 'Calme', 'Indifférence', 'Stabilité', 'Équilibre', 'Normalité', 'Routine', 'Rien de spécial'],
  2: ['Fatigue', 'Anxiété', 'Stress', 'Inquiétude', 'Surcharge', 'Tristesse', 'Solitude', 'Frustration'],
  1: ['Colère', 'Épuisement', 'Désespoir', 'Détresse', 'Déprime', 'Irritation', 'Burn-out'],
};
