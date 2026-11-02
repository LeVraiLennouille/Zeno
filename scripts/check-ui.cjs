'use strict';
/**
 * Contrôles statiques de la couche UI (src/app, components, theme, services, hooks…)
 * quand React Native n'est pas installé : syntaxe, imports, symboles du domaine et
 * noms d'icônes. Ne remplace PAS `npm run typecheck`, qui reste la vraie vérification.
 *
 * Usage : node scripts/check-ui.cjs   (après `npm test`, qui compile le domaine dans .build)
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const isSource = (f) => /\.(ts|tsx)$/.test(f);
const all = walk(path.join(root, 'src')).filter(isSource);
const pureDirs = ['src/domain', 'src/state/'];
const ui = all.filter((f) => {
  const rel = path.relative(root, f).split(path.sep).join('/');
  return !(rel.startsWith('src/domain') || /^src\/state\/[^/]+\.ts$/.test(rel));
});
const problems = [];

// 1. Syntaxe (tsc doit être dans le PATH : c'est le cas via `npm run check:ui`)
try {
  execFileSync(
    'tsc',
    ['--ignoreConfig', '--noEmit', '--jsx', 'preserve', '--noResolve', '--skipLibCheck', '--target', 'es2022', '--module', 'esnext', ...ui],
    { stdio: 'pipe' },
  );
} catch (e) {
  if (e.code === 'ENOENT') {
    problems.push('syntaxe : « tsc » introuvable (installe typescript et lance `npm run check:ui`)');
  } else {
    for (const line of String(e.stdout || '').split('\n')) if (/error TS(1|5)\d{3}/.test(line)) problems.push(`syntaxe : ${line}`);
  }
}

// 2. Symboles exportés par le domaine et l'état
const exportsOf = (dir) => {
  const names = new Set();
  for (const f of walk(path.join(root, dir)).filter(isSource)) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/export\s+(?:declare\s+)?(?:const|let|function|class|type|interface|enum)\s+(\w+)/g)) names.add(m[1]);
    for (const m of t.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) m[1].split(',').forEach((n) => n.trim() && names.add(n.trim().split(/\s+as\s+/).pop()));
  }
  return names;
};
const known = { '@/domain': exportsOf('src/domain'), '@/state': exportsOf('src/state') };
const stateOnly = new Set([...known['@/state']].filter(Boolean));
for (const f of walk(path.join(root, 'src/state')).filter((x) => /\/state\/[^/]+\.ts$/.test(x.split(path.sep).join('/')))) void f;

const iconSrc = fs.readFileSync(path.join(root, 'src/icons/icon-data.ts'), 'utf8') + fs.readFileSync(path.join(root, 'src/icons/nav-icons.ts'), 'utf8');
const iconNames = new Set([...iconSrc.matchAll(/^\s{2}([A-Za-z_]\w*):\s*\[/gm)].map((m) => m[1]));

const resolves = (spec, fromFile) => {
  const base = spec.startsWith('@/') ? path.join(root, 'src', spec.slice(2)) : path.resolve(path.dirname(fromFile), spec);
  return ['.ts', '.tsx', '/index.ts', '/index.tsx', ''].some((ext) => fs.existsSync(base + ext) && fs.statSync(base + ext).isFile());
};

for (const f of ui) {
  const rel = path.relative(root, f);
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/import\s+(?:type\s+)?(?:[\w*\s,{}]+?)\s+from\s+'([^']+)'/g)) {
    const spec = m[1];
    if ((spec.startsWith('@/') || spec.startsWith('.')) && !resolves(spec, f)) problems.push(`${rel} : import introuvable « ${spec} »`);
  }
  for (const m of t.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'(@\/(?:domain|state))'/g)) {
    const names = m[1].split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean);
    for (const n of names) if (!known[m[2]].has(n)) problems.push(`${rel} : « ${n} » n'est pas exporté par ${m[2]}`);
  }
  for (const m of t.matchAll(/<Icon\s+[^>]*?name=(?:"([^"]+)"|\{'([^']+)'\})/g)) {
    const n = m[1] || m[2];
    if (!iconNames.has(n)) problems.push(`${rel} : icône inconnue « ${n} »`);
  }
  for (const m of t.matchAll(/icon:\s*'(\w+)'/g)) if (!iconNames.has(m[1])) problems.push(`${rel} : icône inconnue « ${m[1]} »`);
}

console.log(`${ui.length} fichiers UI contrôlés, ${iconNames.size} icônes connues.`);
if (problems.length) {
  console.error('\nPROBLÈMES :\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log('Aucun problème détecté (syntaxe, imports, symboles, icônes).');
