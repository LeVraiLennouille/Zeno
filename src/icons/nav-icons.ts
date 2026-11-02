import type { IconNode } from './icon-data';

/** Icônes du dock de navigation (écrites en dur dans le `index.html` d'origine). */
export const NAV_ICONS = {
  navHome: [
    { tag: 'path', attrs: { d: 'M3 9.5L12 3l9 6.5V21H3V9.5z' } },
    { tag: 'path', attrs: { d: 'M9 21V12h6v9' } },
  ],
  navAchievements: [
    { tag: 'path', attrs: { d: 'M8 21h8M12 17v4' } },
    { tag: 'path', attrs: { d: 'M5 4h14l-2 9H7L5 4z' } },
    { tag: 'path', attrs: { d: 'M5 4H3M19 4h2' } },
    { tag: 'path', attrs: { d: 'M7 13c0 2.76 2.24 4 5 4s5-1.24 5-4' } },
  ],
  navReport: [{ tag: 'polyline', attrs: { points: '22 12 18 12 15 21 9 3 6 12 2 12' } }],
  navHabits: [
    { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '14', y: '14', width: '7', height: '7', rx: '1' } },
  ],
  navAccount: [
    { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
    { tag: 'path', attrs: { d: 'M4 20c0-4 3.6-7 8-7s8 3 8 7' } },
  ],
  // Pictogrammes d'action (grille 24, trait 2) absents des tables de la PWA.
  plus: [
    { tag: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
    { tag: 'line', attrs: { x1: '5', y1: '12', x2: '19', y2: '12' } },
  ],
  close: [
    { tag: 'line', attrs: { x1: '18', y1: '6', x2: '6', y2: '18' } },
    { tag: 'line', attrs: { x1: '6', y1: '6', x2: '18', y2: '18' } },
  ],
  arrowUp: [
    { tag: 'line', attrs: { x1: '12', y1: '19', x2: '12', y2: '5' } },
    { tag: 'polyline', attrs: { points: '5 12 12 5 19 12' } },
  ],
  arrowDown: [
    { tag: 'line', attrs: { x1: '12', y1: '5', x2: '12', y2: '19' } },
    { tag: 'polyline', attrs: { points: '19 12 12 19 5 12' } },
  ],
  // Tuiles « Bien-être » de l'accueil.
  mood: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    { tag: 'path', attrs: { d: 'M8 14.5s1.4 2 4 2 4-2 4-2' } },
    { tag: 'circle', attrs: { cx: '9', cy: '9.8', r: '0.7', fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: '15', cy: '9.8', r: '0.7', fill: 'currentColor' } },
  ],
  breath: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '5.2' } },
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '1.6', fill: 'currentColor' } },
  ],
  meditate: [
    { tag: 'circle', attrs: { cx: '12', cy: '6', r: '2.5' } },
    { tag: 'path', attrs: { d: 'M8 13.5c1 .6 2.4 1 4 1s3-.4 4-1' } },
    { tag: 'path', attrs: { d: 'M4 19c2.2-.6 4.5-2 8-2s5.8 1.4 8 2' } },
  ],
  chevronLeft: [{ tag: 'polyline', attrs: { points: '15 18 9 12 15 6' } }],
  chevronRight: [{ tag: 'polyline', attrs: { points: '9 18 15 12 9 6' } }],
} as const satisfies Record<string, readonly IconNode[]>;

export type NavIconName = keyof typeof NAV_ICONS;
