# Zeno — application universelle (Expo · React Native Web · TypeScript)

Conversion de la PWA Zeno (HTML / CSS / JS) en application **iOS, Android et navigateur** avec Expo Router.
Les **8 étapes** du plan sont écrites. Le domaine métier est vérifié contre ton code d'origine ;
la couche d'interface n'a **pas pu être lancée** dans l'environnement de développement (voir « Non vérifié »).

## Démarrer

```bash
npm install                  # TypeScript (tests)
npm run install:deps         # installe Expo + toutes les dépendances (Windows, macOS, Linux)

npm run check                # 239 tests + contrôles statiques de l'interface
npm run typecheck            # vrai contrôle de types (après installation des paquets)
npx expo start               # puis « w » (navigateur), « i » / « a » (simulateur)
```

> Windows : n'utilise pas de commande sur plusieurs lignes avec `\` (syntaxe Unix) ; `npm run install:deps` évite le problème.
> Si un paquet manque, `npm run typecheck` signale « Cannot find module … » : relance `npm run install:deps`.

Le script utilise `npx expo install`, qui choisit les versions compatibles avec le SDK (au dernier essai, `expo@latest` a installé le **SDK 58**). Pour tester les
notifications et l'audio sur mobile, prévoir un **development build** (`npx expo run:ios|android`).

## Dépannage

- **`ERR_MODULE_NOT_FOUND … autoAddConfigPlugins.js`** à la fin de `expo install` : sans gravité, les paquets sont déjà
  installés (étape annexe d'ajout de plugins ; `app.json` les déclare déjà). Vérifie avec `npx expo-doctor`.
- **`Missing peer dependency: expo-asset`** : `npx expo install expo-asset` (ou `npm install expo-asset`, puis `npx expo-doctor`).
- **Avertissements `ERESOLVE overriding peer dependency` (react 19.3.0 / 19.3.1)** : sans effet tant que `expo-doctor` valide les versions.
- **`npm audit` signale des vulnérabilités « moderate »** (glob, minimatch) : elles concernent l'outillage de build d'Expo,
  pas l'application. **N'exécute pas `npm audit fix --force`** : il propose de rétrograder Expo vers la version 51.

- **Des erreurs « Cannot find module './home' » ou « has no exported member … » en cascade** (des centaines d'erreurs
  venant de `src/domain/index.ts` ou `src/state/index.ts`) : un fichier a été remplacé lors de la copie ou de l'extraction.
  `npm run verify` compare chaque fichier à l'archive livrée (`MANIFEST.json`) et liste ceux qui diffèrent.
  Le plus sûr est d'extraire l'archive dans un **dossier vide**, pas par-dessus un ancien projet.

## Ce qui est livré

| Étape | Contenu |
|---|---|
| 1 | Projet, TypeScript strict, thème « Encre », 9 polices statiques, 39 icônes SVG, dock 5 onglets |
| 2 | Domaine pur : séries, XP, 24 succès, défis & saisons, pauses, import validé |
| 3 | Store (observable + `useSyncExternalStore`), persistance, reprise de l'ancien `localStorage`, retours (toasts, sons, vibrations, confettis) |
| 4 | Accueil (Aujourd'hui / Semaine / Global), Habitudes (formulaire, archivage, ordre, suppression annulable), Compte |
| 5 | Succès, défis & saison, humeur (2 étapes), sommeil, pauses |
| 6 | Rapport (histogramme, courbes SVG, calendriers, journal, insights), bilan du lundi, fiche détaillée |
| 7 | Respiration, méditation, 7 sons + 3 ambiances générés en WAV |
| 8 | Rappels (notifications planifiées), export / import avec point de restauration, raccourcis, PWA web, accessibilité |

## Architecture

```
src/
├── app/            Expo Router : routes minces, aucune logique
│   ├── (tabs)/       Accueil · Succès · Rapport · Habitudes · Compte
│   └── habit/ detail/ reminder/ challenge/  mood · sleep · pause · review · profile · avatar · breathing · meditation
├── domain/         TypeScript pur, zéro import react / expo, zéro dépendance
│   ├── types/ date/ constants/ habits/ gamification/ challenges/ pause/
│   ├── actions/      réducteurs purs : (ctx, …) → { db, events }
│   ├── selectors/    modèles d'écran (accueil, défis, pauses, compte)
│   ├── report/       statistiques, insights, bilan, fiche détaillée
│   ├── wellness/     humeur, journal, sommeil, respiration, méditation
│   ├── reminders/ backup/ migrations/ profile/
├── state/          store, persistance, mapping événements → retours, exécuteur (sans RN)
│   └── react/        StoreProvider et hooks
├── services/       AsyncStorage, audio, haptique, notifications, fichiers, presse-papiers, PWA
├── components/     ui/ habit/ challenge/ report/ wellness/ account/ charts/ feedback/
├── hooks/  theme/  icons/  i18n/
public/             manifest.json, sw.js, icônes (version web)
assets/             fonts/ (9 statiques), sounds/ (10 WAV générés), images/
legacy/             PWA d'origine : référence et banc de tests
tests/ scripts/     tests de parité, générateurs (icônes, sons), contrôles statiques
```

**Séparation des couches.** Le domaine décrit ce qui s'est passé sous forme d'**événements**
(`level_up`, `perfect_day`, `meditation_done`…) ; `state/feedback.ts` les traduit en toasts, sons,
vibrations et confettis avec les textes et délais de la PWA ; les composants ne font qu'afficher.

## Comment la conversion est vérifiée

`npm test` charge **ton code JavaScript d'origine** dans un bac à sable Node (horloge figée, DOM
factice, minuteries pilotées pas à pas) et compare ses sorties à celles du TypeScript :

- séries, valeurs jour × habitude, 24 succès, défis, saisons, XP (plus de 10 000 comparaisons de valeurs) ;
- séquences d'actions complètes (états, XP, sons) et formulaire d'habitude (29 cas, messages inclus) ;
- rapport (3 périodes × 9 filtres), insights, bilan, fiche détaillée (chaque case de la grille) ;
- respiration seconde par seconde, méditation, calendrier d'humeur, journal, pauses, rappels ;
- validateur d'import sur des entrées hostiles ;
- sons : analyse spectrale (fréquences de chaque note, partiels de la cloche, filtres, boucles).

Les contrôles statiques (`check:ui`, `check:a11y`, `typecheck:shim`) et plusieurs tests ont été validés par mutation : une erreur volontaire est bien détectée.

## Écarts volontaires avec la PWA

- Zustand → **store maison** (observable + `useSyncExternalStore`) : aucune dépendance, testable sous Node.
- Zod → validateurs écrits à la main (domaine sans dépendance).
- Reanimated → `Animated` de React Native (suffisant pour toasts, confettis, orbe).
- Sons : fichiers WAV **générés** depuis tes formules (plus de synthèse en direct). Pas de normalisation.
- Rappels : sur mobile, des notifications **datées** sont planifiées sur 14 jours (60 au plus, limite iOS)
  et recalculées à chaque changement ; elles sonnent app fermée. Le rappel du jour est omis si
  l'habitude est déjà faite. Sur le web elles ne sonnent que tant que l'onglet est ouvert.
- Décocher une habitude hebdomadaire ne joue plus « undo » deux fois ; minutes de sommeil bornées à 0-59 ;
  actions sur une habitude absente sans effet (au lieu d'une exception).
- Réorganisation par boutons ↑ ↓ (accessibles), pas encore par glisser-déposer.
- Haptique ajoutée (vibrations légères), indépendante du réglage « Effets sonores ».
- Format d'export **inchangé** : `{ app, schema: "ht-v2.6", appVersion, exportedAt, data }`.

## Non vérifié

L'environnement de développement n'a pas d'accès réseau : React Native n'a pas pu être installé. Donc :

- `src/app`, `src/components`, `src/theme`, `src/hooks`, `src/services` n'ont jamais été **exécutés**. Ils ont passé
  la syntaxe, les imports, les symboles du domaine, les noms d'icônes, l'accessibilité et un typage
  contre des déclarations minimales (`npm run typecheck:shim`) qui vérifient tous les appels au domaine et au store.
- À contrôler en priorité au premier lancement (API appelées de mémoire) : `expo-audio` (`seekTo`, `release`),
  `expo-file-system` (`File`, `Paths`), `expo-notifications` (déclencheur `DATE`, options du gestionnaire),
  `boxShadow` des ombres dures, `+html.tsx` avec `web.output: "single"`.
- Les sons n'ont pas été **écoutés** (seulement analysés). Les instances de police fixent `opsz` à 24 / 48 / 96.
- Aucun test sur appareil réel (vibrations, notifications, installation PWA).

## Pistes

Glisser-déposer pour l'ordre des habitudes, widgets, synchronisation, tests d'interface (jest-expo).
