'use strict';
/** Écrit MANIFEST.json : l'empreinte SHA-256 de chaque fichier du projet livré. Usage : node scripts/build-manifest.cjs */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.build', '.expo', 'dist', 'web-build', '.git', 'package-lock.json']);
const files = {};
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name !== 'MANIFEST.json') files[path.relative(root, p).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  }
};
walk(root);
fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify({ files }, null, 1));
console.log(`MANIFEST.json : ${Object.keys(files).length} fichiers`);
