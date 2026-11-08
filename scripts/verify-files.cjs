'use strict';
/**
 * Compare les fichiers du projet à ceux de l'archive livrée (MANIFEST.json) : repère les fichiers
 * absents, remplacés ou modifiés (copie qui a fusionné des dossiers, éditeur qui a réécrit un fichier…).
 *
 *   npm run verify              → liste les écarts et montre ce que contient chaque fichier abîmé
 *   npm run verify -- --fix     → restaure les fichiers texte abîmés ou absents (sauvegarde en .bak)
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const fix = process.argv.includes('--fix');
const manifestPath = path.join(root, 'MANIFEST.json');
if (!fs.existsSync(manifestPath)) {
  console.error('MANIFEST.json introuvable : ce contrôle ne marche qu’avec le projet tel que livré.');
  process.exit(2);
}
const { files, text = {} } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const abs = (rel) => path.join(root, ...rel.split('/'));

const missing = [];
const changed = [];
const cosmetic = [];
/** Texte comparé sans tenir compte des fins de ligne (CRLF / LF) ni des sauts de ligne en fin de fichier. */
const normalize = (t) => t.replace(/\r\n/g, "\n").replace(/\n+$/, "");
for (const [rel, h] of Object.entries(files)) {
  const p = abs(rel);
  if (!fs.existsSync(p)) {
    missing.push(rel);
    continue;
  }
  const buf = fs.readFileSync(p);
  if (hash(buf) === h) continue;
  if (text[rel] !== undefined && normalize(buf.toString("utf8")) === normalize(text[rel])) cosmetic.push(rel);
  else changed.push(rel);
}
console.log(`${Object.keys(files).length} fichiers attendus : ${missing.length} absent(s), ${changed.length} différent(s).`);

/** Résumé lisible de ce qu'il y a à la place du fichier attendu. */
function describe(rel) {
  const got = fs.readFileSync(abs(rel), 'utf8');
  const want = text[rel];
  const lines = got.split(/\r?\n/);
  const out = [`   ${lines.length} lignes (attendu : ${want ? want.split(/\n/).length : '?'})${got.includes('\r\n') ? ', fins de ligne CRLF' : ''}`];
  const exported = lines.filter((l) => /^export /.test(l)).slice(0, 4);
  if (exported.length) out.push('   exports : ' + exported.map((l) => l.slice(0, 70)).join('  |  '));
  if (want) {
    const w = want.split(/\r?\n/);
    for (let i = 0, shown = 0; i < Math.max(w.length, lines.length) && shown < 3; i++) {
      if (w[i] !== lines[i]) {
        out.push(`   ligne ${i + 1} — attendu : ${JSON.stringify((w[i] ?? '(rien)').slice(0, 80))}`);
        out.push(`   ligne ${i + 1} — trouvé  : ${JSON.stringify((lines[i] ?? '(rien)').slice(0, 80))}`);
        shown++;
      }
    }
  }
  return out.join('\n');
}

if (missing.length) console.log('\nABSENTS :\n' + missing.map((f) => ' - ' + f).join('\n'));
if (changed.length) {
  console.log('\nDIFFÉRENTS DE LA LIVRAISON :');
  for (const rel of changed) console.log(` - ${rel}` + (text[rel] !== undefined ? '\n' + describe(rel) : ' (fichier binaire)'));
}

if (!missing.length && !changed.length) {
  console.log('Tous les fichiers sont identiques à la livraison.');
  process.exit(0);
}

if (!fix) {
  console.log('\nPour réparer les fichiers texte : npm run verify -- --fix');
  process.exit(1);
}

let repaired = 0;
const cannot = [];
for (const rel of [...missing, ...changed]) {
  if (text[rel] === undefined) {
    cannot.push(rel);
    continue;
  }
  const p = abs(rel);
  if (fs.existsSync(p)) fs.copyFileSync(p, p + '.bak');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text[rel], 'utf8');
  repaired++;
}
console.log(`\n✔ ${repaired} fichier(s) restauré(s) (l'ancienne version est gardée en « .bak »).`);
if (cannot.length) {
  console.log('✖ Fichiers binaires à reprendre depuis l’archive :\n' + cannot.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
