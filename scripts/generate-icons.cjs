'use strict';
/**
 * Génère src/icons/icon-data.ts à partir des tables ICONS et HABIT_ICONS de la PWA
 * (legacy/js/core.js). Les fragments SVG sont analysés en nœuds typés ; la seule
 * transformation rencontrée (ellipse pivotée) est convertie en tracé pur.
 *
 * Usage : node scripts/generate-icons.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { createLegacy } = require('../tests/legacy-harness.cjs');
const { buildDb } = require('../tests/fixtures.cjs');

const legacy = createLegacy({ now: new Date(2026, 9, 28, 14), db: buildDb() });
const tables = { ui: legacy.call('ICONS'), habit: legacy.call('HABIT_ICONS') };

const TAGS = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const num = (n) => String(Math.round(n * 1000) / 1000);

function ellipseToPath(a) {
  const cx = parseFloat(a.cx), cy = parseFloat(a.cy), rx = parseFloat(a.rx), ry = parseFloat(a.ry);
  const m = /rotate\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(a.transform || '');
  const deg = m ? parseFloat(m[1]) : 0;
  const ox = m ? parseFloat(m[2]) : cx, oy = m ? parseFloat(m[3]) : cy;
  const t = (deg * Math.PI) / 180, cos = Math.cos(t), sin = Math.sin(t);
  const rot = (x, y) => [ox + (x - ox) * cos - (y - oy) * sin, oy + (x - ox) * sin + (y - oy) * cos];
  const [x1, y1] = rot(cx - rx, cy);
  const [x2, y2] = rot(cx + rx, cy);
  return `M${num(x1)} ${num(y1)}A${num(rx)} ${num(ry)} ${num(deg)} 1 0 ${num(x2)} ${num(y2)}A${num(rx)} ${num(ry)} ${num(deg)} 1 0 ${num(x1)} ${num(y1)}Z`;
}

function parse(markup) {
  const nodes = [];
  const re = /<(\w+)((?:\s+[\w-]+="[^"]*")*)\s*\/?>/g;
  let m;
  while ((m = re.exec(markup))) {
    const tag = m[1];
    if (!TAGS.has(tag)) throw new Error(`balise SVG inattendue : ${tag}`);
    const attrs = {};
    for (const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    if (tag === 'ellipse' && attrs.transform) {
      nodes.push({ tag: 'path', attrs: { d: ellipseToPath(attrs), ...(attrs.fill ? { fill: attrs.fill } : {}), ...(attrs.stroke ? { stroke: attrs.stroke } : {}) } });
    } else {
      const out = {};
      for (const [k, v] of Object.entries(attrs)) out[camel(k)] = v;
      nodes.push({ tag, attrs: out });
    }
  }
  const stripped = markup.replace(re, '').trim();
  if (stripped) throw new Error(`fragment SVG non analysé : ${stripped.slice(0, 60)}`);
  return nodes;
}

const lit = (v) => JSON.stringify(v).replace(/"([a-zA-Z]+)":/g, '$1:').replace(/"/g, "'");
let out = `// FICHIER GÉNÉRÉ par scripts/generate-icons.cjs : ne pas modifier à la main.
// Source : tables ICONS et HABIT_ICONS de la PWA d'origine (legacy/js/core.js).

export type SvgTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse';

export interface IconNode {
  readonly tag: SvgTag;
  /** Attributs SVG en camelCase ; \`currentColor\` est remplacé par la couleur du composant. */
  readonly attrs: Readonly<Record<string, string>>;
}

`;
for (const [group, table] of Object.entries(tables)) {
  const name = group === 'ui' ? 'UI_ICONS' : 'HABIT_ICON_NODES';
  out += `export const ${name} = {\n`;
  for (const id of Object.keys(table).sort()) out += `  ${/^[a-z_]\w*$/i.test(id) ? id : `'${id}'`}: ${lit(parse(table[id]))},\n`;
  out += `} as const satisfies Record<string, readonly IconNode[]>;\n\n`;
}
out += `export type UiIconName = keyof typeof UI_ICONS;
export type HabitIconName = keyof typeof HABIT_ICON_NODES;
export type IconName = UiIconName | HabitIconName;

export const ICON_NODES: Readonly<Record<IconName, readonly IconNode[]>> = { ...UI_ICONS, ...HABIT_ICON_NODES };
`;
fs.writeFileSync(path.join(__dirname, '..', 'src/icons/icon-data.ts'), out);
const n = (o) => Object.keys(o).length;
console.log(`icon-data.ts : ${n(tables.ui)} icônes d'interface + ${n(tables.habit)} icônes d'habitudes`);
