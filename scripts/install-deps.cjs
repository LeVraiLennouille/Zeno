'use strict';
/**
 * Installe toutes les dépendances Expo / React Native du projet en une seule commande,
 * identique sous Windows (cmd, PowerShell), macOS et Linux.
 * Usage : npm run install:deps
 *
 * `npx expo install` peut se terminer sur une erreur ERR_MODULE_NOT_FOUND (…autoAddConfigPlugins.js)
 * APRÈS avoir installé les paquets : c'est l'étape annexe d'ajout automatique des plugins dans
 * app.json (déjà déclarés à la main ici). On ne s'arrête donc pas dessus : on vérifie les paquets.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RUNTIME = [
  'expo-router', 'react', 'react-dom', 'react-native', 'react-native-web',
  'react-native-svg', 'react-native-safe-area-context', 'react-native-screens',
  'expo-linking', 'expo-constants', 'expo-status-bar', 'expo-font', 'expo-splash-screen',
  'expo-asset', // requis par expo-audio
  'expo-haptics', 'expo-audio', 'expo-keep-awake', 'expo-clipboard', 'expo-notifications',
  'expo-document-picker', 'expo-sharing', 'expo-file-system',
  '@react-native-async-storage/async-storage',
];

const run = (args, { soft = false } = {}) => {
  console.log(`\n> ${args.join(' ')}\n`);
  const r = spawnSync(args[0], args.slice(1), { stdio: 'inherit', shell: true });
  if (r.status !== 0 && !soft) {
    console.error(`\nÉchec de : ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
  return r.status === 0;
};

const missing = () => RUNTIME.filter((p) => !fs.existsSync(path.join(process.cwd(), 'node_modules', ...p.split('/'), 'package.json')));

run(['npm', 'install', 'expo@latest']);
const ok = run(['npx', 'expo', 'install', ...RUNTIME], { soft: true });
let absent = missing();

if (!ok) {
  console.warn(
    '\n⚠ « expo install » a signalé une erreur. Si elle mentionne ERR_MODULE_NOT_FOUND / autoAddConfigPlugins.js,\n' +
      '  elle est sans gravité (étape finale d\'ajout de plugins, déjà déclarés dans app.json).',
  );
  if (absent.length > 0) {
    console.warn(`  Paquets absents, nouvelle tentative avec npm : ${absent.join(', ')}`);
    run(['npm', 'install', ...absent], { soft: true });
    absent = missing();
  }
}

run(['npm', 'install', '-D', '@types/react'], { soft: true });

if (absent.length > 0) {
  console.error(`\n✖ Paquets toujours absents : ${absent.join(', ')}\n  Installe-les un par un : npx expo install <paquet>`);
  process.exit(1);
}
console.log('\n✔ Tous les paquets sont présents. Vérification de la cohérence des versions :');
run(['npx', 'expo-doctor'], { soft: true });
console.log('\nEnsuite : npm run typecheck   puis   npx expo start');
console.log('N\'exécute PAS « npm audit fix --force » : il rétrograderait Expo vers une très ancienne version.');
