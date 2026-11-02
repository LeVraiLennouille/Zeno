'use strict';
/**
 * Contrôle d'accessibilité statique : chaque <Pressable> déclare un `accessibilityRole`,
 * chaque <TextInput> un `accessibilityLabel`, et aucun texte d'icône seul n'est un bouton muet.
 * Usage : node scripts/check-a11y.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.tsx'));
const problems = [];

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), f);
  for (const tag of ['Pressable', 'TextInput']) {
    const re = new RegExp(`<${tag}\\b`, 'g');
    let m;
    while ((m = re.exec(text))) {
      // L'ouverture de la balise s'arrête au premier « > » hors accolades.
      let depth = 0;
      let i = m.index + m[0].length;
      for (; i < text.length; i++) {
        const c = text[i];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        else if (c === '>' && depth === 0 && text[i - 1] !== '=') break;
      }
      const open = text.slice(m.index, i);
      const line = text.slice(0, m.index).split('\n').length;
      if (tag === 'Pressable' && !/accessibilityRole=/.test(open)) problems.push(`${rel}:${line} <Pressable> sans accessibilityRole`);
      if (tag === 'TextInput' && !/accessibilityLabel=/.test(open)) problems.push(`${rel}:${line} <TextInput> sans accessibilityLabel`);
      if (tag === 'Pressable' && /accessibilityRole="button"/.test(open) && !/accessibilityLabel=/.test(open)) {
        const body = text.slice(i, text.indexOf('</Pressable>', i));
        if (!/<AppText|<Text|\{[a-z.]*label|\{.*\}\s*<\/|[A-Za-zÀ-ÿ]{3,}/.test(body.replace(/<Icon[^>]*\/>/g, ''))) problems.push(`${rel}:${line} bouton sans texte ni accessibilityLabel`);
      }
    }
  }
}
console.log(`${files.length} fichiers .tsx contrôlés.`);
if (problems.length) {
  console.error('\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log('Accessibilité : aucun élément interactif sans rôle ni étiquette.');
