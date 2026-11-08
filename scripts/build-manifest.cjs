'use strict';
/**
 * Écrit MANIFEST.json : l'empreinte SHA-256 de chaque fichier du projet livré, et le TEXTE des fichiers
 * source (de quoi les réparer avec `npm run verify -- --fix`, même si une copie les a abîmés).
 * Usage : node scripts/build-manifest.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.build', '.expo', 'dist', 'web-build', '.git', 'package-lock.json', 'MANIFEST.json']);
const TEXT = /\.(ts|tsx|json|cjs|js|md|html|css|svg)$/;
const files = {};
const text = {};
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const rel = path.relative(root, p).split(path.sep).join('/');
      const buf = fs.readFileSync(p);
      files[rel] = crypto.createHash('sha256').update(buf).digest('hex');
      if (TEXT.test(e.name) || e.name === '.gitignore') text[rel] = buf.toString('utf8');
    }
  }
};
walk(root);
fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify({ files, text }));
console.log(`MANIFEST.json : ${Object.keys(files).length} fichiers, ${Object.keys(text).length} réparables (texte)`);
