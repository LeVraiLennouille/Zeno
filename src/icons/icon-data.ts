// FICHIER GÉNÉRÉ par scripts/generate-icons.cjs : ne pas modifier à la main.
// Source : tables ICONS et HABIT_ICONS de la PWA d'origine (legacy/js/core.js).

export type SvgTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse';

export interface IconNode {
  readonly tag: SvgTag;
  /** Attributs SVG en camelCase ; `currentColor` est remplacé par la couleur du composant. */
  readonly attrs: Readonly<Record<string, string>>;
}

export const UI_ICONS = {
  alert: [{tag:'path',attrs:{d:'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'}},{tag:'line',attrs:{'x1':'12','y1':'9','x2':'12','y2':'13'}},{tag:'line',attrs:{'x1':'12','y1':'17','x2':'12.01','y2':'17'}}],
  bell: [{tag:'path',attrs:{d:'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'}},{tag:'path',attrs:{d:'M13.73 21a2 2 0 0 1-3.46 0'}}],
  bellOff: [{tag:'path',attrs:{d:'M13.73 21a2 2 0 0 1-3.46 0'}},{tag:'path',attrs:{d:'M18.63 13A17.89 17.89 0 0 1 18 8'}},{tag:'path',attrs:{d:'M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14'}},{tag:'path',attrs:{d:'M18 8a6 6 0 0 0-9.33-5'}},{tag:'line',attrs:{'x1':'1','y1':'1','x2':'23','y2':'23'}}],
  edit: [{tag:'path',attrs:{d:'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'}}],
  flame: [{tag:'path',attrs:{d:'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'}}],
  moon: [{tag:'path',attrs:{d:'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'}}],
  play: [{tag:'polygon',attrs:{points:'7 4 20 12 7 20 7 4'}}],
  star: [{tag:'polygon',attrs:{points:'12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'}}],
  stop: [{tag:'rect',attrs:{x:'6',y:'6',width:'12',height:'12',rx:'2'}}],
  sun: [{tag:'circle',attrs:{cx:'12',cy:'12',r:'5'}},{tag:'path',attrs:{d:'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'}}],
  trash: [{tag:'polyline',attrs:{points:'3 6 5 6 21 6'}},{tag:'path',attrs:{d:'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'}},{tag:'path',attrs:{d:'M10 11v6M14 11v6'}},{tag:'path',attrs:{d:'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'}}],
  trophy: [{tag:'circle',attrs:{cx:'12',cy:'8',r:'7'}},{tag:'polyline',attrs:{points:'8.21 13.89 7 23 12 20 17 23 15.79 13.88'}}],
  user: [{tag:'path',attrs:{d:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'}},{tag:'circle',attrs:{cx:'12',cy:'7',r:'4'}}],
  volume: [{tag:'polygon',attrs:{points:'11 5 6 9 2 9 2 15 6 15 11 19 11 5'}},{tag:'path',attrs:{d:'M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07'}}],
  zen: [{tag:'circle',attrs:{cx:'12',cy:'6',r:'2.5'}},{tag:'path',attrs:{d:'M12 9.5v4'}},{tag:'path',attrs:{d:'M4 19c2.2-.6 4.5-2 8-2s5.8 1.4 8 2'}},{tag:'path',attrs:{d:'M8 13.5c1 .6 2.4 1 4 1s3-.4 4-1'}}],
} as const satisfies Record<string, readonly IconNode[]>;

export const HABIT_ICON_NODES = {
  bad: [{tag:'circle',attrs:{cx:'12',cy:'12',r:'8.5'}}],
  cleaning: [{tag:'line',attrs:{'x1':'18.5','y1':'4','x2':'10','y2':'12.5'}},{tag:'path',attrs:{d:'M10 12.5l-4.3 7 2.6 1 3-6.3 1.7-1.7'}},{tag:'path',attrs:{d:'M4.5 21l1.8-2.8'}}],
  drink: [{tag:'path',attrs:{d:'M12 3.3c3.6 4.6 6.3 7.9 6.3 11.2a6.3 6.3 0 1 1-12.6 0c0-3.3 3-6.6 6.3-11.2z'}}],
  gym: [{tag:'rect',attrs:{x:'1.5',y:'9',width:'3',height:'6',rx:'1'}},{tag:'rect',attrs:{x:'19.5',y:'9',width:'3',height:'6',rx:'1'}},{tag:'rect',attrs:{x:'4.5',y:'10.3',width:'3',height:'3.4',rx:'0.6'}},{tag:'rect',attrs:{x:'16.5',y:'10.3',width:'3',height:'3.4',rx:'0.6'}},{tag:'line',attrs:{'x1':'7.5','y1':'12','x2':'16.5','y2':'12'}}],
  projets: [{tag:'path',attrs:{d:'M12 2.5c2.3 2.1 3.7 5.3 3.7 8.5 0 1.9-.4 3.4-1 4.8l-2.7 2.7-2.7-2.7c-.6-1.4-1-2.9-1-4.8 0-3.2 1.4-6.4 3.7-8.5z'}},{tag:'circle',attrs:{cx:'12',cy:'10.5',r:'1.4'}},{tag:'path',attrs:{d:'M9.3 15.5L7 17M14.7 15.5L17 17M10.3 18.7L12 21.5l1.7-2.8'}}],
  read: [{tag:'path',attrs:{d:'M4 5.8c0-1 .8-1.8 1.8-1.8H11v15.5H5.8A1.8 1.8 0 0 1 4 17.7V5.8z'}},{tag:'path',attrs:{d:'M20 5.8c0-1-.8-1.8-1.8-1.8H13v15.5h5.2c1 0 1.8-.8 1.8-1.8V5.8z'}}],
  running: [{tag:'circle',attrs:{cx:'14.2',cy:'4.2',r:'1.6'}},{tag:'path',attrs:{d:'M9.5 20l2-5.5 3 1.8 2 3.7'}},{tag:'path',attrs:{d:'M7.3 13.2l2.9-2.7 2.1 1 2.8-1.2'}},{tag:'path',attrs:{d:'M5.5 17l3-2.2'}}],
  setp: [{tag:'path',attrs:{d:'M6.477 7.929A2.6 3.7 -14 1 0 11.523 6.671A2.6 3.7 -14 1 0 6.477 7.929Z',fill:'currentColor',stroke:'none'}},{tag:'path',attrs:{d:'M12.977 14.971A2.6 3.7 14 1 0 18.023 16.229A2.6 3.7 14 1 0 12.977 14.971Z',fill:'currentColor',stroke:'none'}}],
  sleep: [{tag:'path',attrs:{d:'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'}}],
  work: [{tag:'rect',attrs:{x:'3',y:'7',width:'18',height:'12',rx:'2'}},{tag:'path',attrs:{d:'M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7'}},{tag:'path',attrs:{d:'M3 12.5h18'}}],
} as const satisfies Record<string, readonly IconNode[]>;

export type UiIconName = keyof typeof UI_ICONS;
export type HabitIconName = keyof typeof HABIT_ICON_NODES;
export type IconName = UiIconName | HabitIconName;

export const ICON_NODES: Readonly<Record<IconName, readonly IconNode[]>> = { ...UI_ICONS, ...HABIT_ICON_NODES };
