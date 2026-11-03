'use strict';
/**
 * Compare les fichiers du projet à ceux de l'archive livrée (MANIFEST.json) : repère les fichiers
 * absents, remplacés ou modifiés, par exemple après une extraction ou une copie qui a fusionné
 * des dossiers. Usage : npm run verify
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'MANIFEST.json');
if (!fs.existsSync(manifestPath)) {
  console.error('MANIFEST.json introuvable : ce contrôle ne marche qu’avec le projet tel que livré.');
  process.exit(2);
}
const { files } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const missing = [];
const changed = [];
for (const [rel, hash] of Object.entries(files)) {
  const p = path.join(root, ...rel.split('/'));
  if (!fs.existsSync(p)) missing.push(rel);
  else if (crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== hash) changed.push(rel);
}
console.log(`${Object.keys(files).length} fichiers attendus : ${missing.length} absent(s), ${changed.length} différent(s).`);
if (missing.length) console.log('\nABSENTS :\n' + missing.map((f) => ' - ' + f).join('\n'));
if (changed.length) console.log('\nDIFFÉRENTS DE LA LIVRAISON :\n' + changed.map((f) => ' - ' + f).join('\n'));
if (missing.length || changed.length) {
  console.log('\nRemplace ces fichiers par ceux de l’archive (ou extrais l’archive dans un dossier vide).');
  process.exit(1);
}
console.log('Tous les fichiers sont identiques à la livraison.');
