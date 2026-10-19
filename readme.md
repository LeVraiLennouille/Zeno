# 🌙 HabitsTracker — Suivi d'habitudes gamifié (PWA)

**HabitsTracker** est une application web de suivi d'habitudes qui s'appuie sur la gamification (XP, niveaux, séries, succès) et sur un volet bien-être (humeur, respiration, sommeil). Écrite en HTML, CSS et JavaScript vanilla, elle fonctionne sans serveur ni compte : toutes les données restent dans le navigateur. Elle s'installe comme une application native (PWA) sur mobile et desktop et fonctionne hors-ligne.

---

## 📋 Habitudes suivies

Neuf habitudes sont définies par défaut. Chacune a sa couleur (« encre ») et son icône.

| Icône | Habitude | Type | Jours actifs | Objectif | Compte dans la journée parfaite |
|---|---|---|---|---|---|
| 💤 | Sommeil | Case à cocher | Lun–Ven | — | ✅ |
| 🚀 | Projets perso | Case à cocher | Tous les jours | — | ✅ |
| 💼 | Travail | Case à cocher | Lun–Ven | — | ✅ |
| 🏋️ | Gym | Case à cocher | Lun–Ven | — | ✅ |
| 🏃 | Running | Compteur | Tous les jours | 5 km (+1 km, max 15) | ✅ |
| 👣 | Pas | Compteur | Tous les jours | 10 000 pas (+1 000, max 20 000) | ✅ |
| 💧 | Boire de l'eau | Eau | Tous les jours | 2 000 ml (+250 / +500 ml, max 5 000) | ✅ |
| 📚 | 15 min Lecture | Compteur | Tous les jours | 15 min (+5, max 30) | ❌ optionnelle |
| 🧹 | Nettoyage | Hebdomadaire | Chaque semaine (dimanche conseillé) | 1 fois par semaine | ❌ optionnelle |

---

## 🚀 Fonctionnalités

### 1. 🧭 Navigation

Un dock flottant en bas de l'écran donne accès à cinq pages : **Accueil**, **Succès**, **Rapport**, **Habitudes** et **Compte**. Seul l'onglet actif affiche son libellé. Le bouton ⋮ de l'accueil ouvre la fenêtre de profil.

### 2. 🏠 Accueil

- **En-tête du jour** : date complète, score « X/Y habitudes faites », niveau actuel et **bande d'encre**, un segment par habitude du jour qui se remplit au fil des validations.
- **Trois onglets :**
  - **Aujourd'hui** : cartes des habitudes actives ce jour, avec série en cours et contrôles adaptés à chaque type.
  - **Semaine** : vue Lun–Dim par habitude ; on peut **cocher ou décocher les jours passés** directement depuis les pastilles.
  - **Global** : grille de **16 semaines** par habitude (jour validé = plein, manqué = contour pâle, inactif/futur = vide).
- **Section Bien-être** (onglet Aujourd'hui) : accès rapide à l'humeur, à la respiration, à la méditation et au résumé du sommeil.

### 3. ✅ Types d'habitudes

| Type | Fonctionnement |
|---|---|
| **Case à cocher** (`good`) | Validation en un tap, annulable. |
| **Eau** (`drink`) | Boutons −, +250 ml et +500 ml, barre de progression, plafond à 5 000 ml. |
| **Compteur** (`counter`) | Pas (`step`), objectif (`goal`), maximum (`max`) et unité configurables par habitude ; barre de progression et bouton − . |
| **Hebdomadaire** (`weekly`) | Une seule validation suffit pour la semaine (Lun–Dim) ; la série se compte en semaines. |

Le code gère aussi le type `bad` (habitude à éviter, un tap = échec) : il est prêt côté logique, mais aucune habitude de ce type n'est définie dans la version actuelle.

Les habitudes limitées aux jours ouvrés (`weekdayOnly`) ou à des jours précis (`activeDays`) disparaissent de l'onglet Aujourd'hui les jours inactifs et ne pénalisent ni les séries ni les statistiques.

### 4. 🎮 Gamification

**XP gagnée :**

| Action | XP |
|---|---|
| Habitude à cocher validée | +10 |
| Habitude hebdomadaire validée | +20 |
| Objectif eau atteint | +10 |
| Objectif d'un compteur atteint (km, pas, lecture) | +10 |
| Journée parfaite (bonus, une fois par jour) | +50 |

**10 niveaux :** Novice → Apprenti → Pratiquant → Fervent → Discipliné → Concentré → Maître → Grand maître → Légende → Transcendant.
**Seuils d'XP :** 0 · 100 · 250 · 500 · 800 · 1 200 · 1 700 · 2 400 · 3 200 · 4 200.

**Séries :** calculées par habitude (en jours, ou en semaines pour l'hebdomadaire) en ignorant les jours inactifs ; la série du jour n'est pas cassée tant que la journée n'est pas terminée. La série la plus longue est également conservée.

**Journée parfaite :** toutes les habitudes non optionnelles actives du jour sont validées → confettis, fanfare et bonus d'XP.

### 5. 🏆 Succès

18 succès, regroupés par catégorie sur la page **Succès** avec un compteur global de progression.

| Catégorie | Succès |
|---|---|
| **Séries et régularité** | 🌅 Régularité (série ≥ 30 j) · 🎯 Dévouement (série ≥ 60 j) · 🐫 Chameau (eau 7 j de suite) · 🌊 Hydratation parfaite (eau 30 j) · 📖 Rat de bibliothèque (lecture 14 j) · 🌙 Hibou apprivoisé (sommeil 14 j) · 👑 Maîtrise de soi (aucune mauvaise habitude 14 j) · 👣 Sur la route (10 000 pas 7 j) · 🏅 Marathon (10 000 pas 30 j) |
| **Étapes et XP** | 🌱 Premier pas · ⚔️ Centurion (100 XP) · 💎 Réserve d'XP (500 XP) · 🔥 En feu (niveau 5) · 🌌 Transcendance (niveau max) |
| **Journées parfaites** | ⭐ Semaine parfaite (100 % sur une semaine complète) · 💯 Perfectionniste (5 journées parfaites) · 💪 Volonté de fer (20 séances de gym dans le mois) |

Chaque déblocage déclenche une notification dans l'app et un son.

### 6. 🧠 Humeur

- **Saisie en deux étapes** : choix parmi 5 niveaux (😎 Super · 😊 Bien · 😐 Neutre · 😢 Bof · 😡 Mal), puis sélection d'un ou plusieurs **ressentis** adaptés au niveau choisi (Joie, Calme, Fatigue, Stress, Colère…).
- **Invite quotidienne** : si l'humeur du jour n'est pas renseignée, la fenêtre s'ouvre automatiquement quelques secondes après le lancement (une fois par session).
- **Saisie manuelle** depuis l'accueil ou le Rapport, et **rattrapage des jours passés** depuis le calendrier d'humeur.

### 7. 🌬️ Respiration

Écran plein format avec orbe animée, anneau de progression et compte à rebours. Trois exercices :

| Exercice | Rythme | Usage |
|---|---|---|
| **Carrée** | 4 – 4 – 4 – 4 s | Concentration |
| **4-7-8** | 4 – 7 – 8 s | Sommeil |
| **Calme** | 5 – 2 – 5 s | Détente |

Les phases (Inspirez / Retenez / Expirez) sont annoncées à l'écran et les cycles terminés sont comptés. Changer d'exercice arrête la session en cours.

### 8. 🧘 Méditation

Écran de présentation « bientôt disponible » : les sessions guidées ne sont pas encore implémentées.

### 9. 💤 Suivi du sommeil

Fenêtre de saisie avec **durée** (heures/minutes), **heure de coucher** et **heure de réveil** (facultatives) et **date** modifiable. L'enregistrement valide automatiquement l'habitude Sommeil pour la date choisie et affiche un résumé de la nuit sur l'accueil.

### 10. 📈 Rapport

- **Cartes de synthèse** : meilleure série en cours, taux de réussite sur 30 jours, total d'habitudes validées, nombre de journées parfaites.
- **Histogramme de la semaine** : habitudes validées par jour (Lun–Dim).
- **Courbe d'évolution** : taux de réussite mensuel sur 6 mois.
- **Calendrier du mois** : jours colorés selon la réussite (parfait · bon ≥ 70 % · manqué).
- **Calendrier d'humeur** : navigation mois par mois.
- **Courbe d'humeur** de la semaine.

Les graphiques sont dessinés en Canvas, sans bibliothèque.

### 11. 🗂️ Page Habitudes

Liste de toutes les habitudes avec progression du jour, série en cours et validation rapide. Le bouton « + » (ajout d'habitude personnalisée) est présent mais renvoie pour l'instant un message « bientôt disponible ».

### 12. 👤 Compte & préférences

Accessibles depuis la page **Compte** et la fenêtre de profil (⋮).

| Préférence | Description |
|---|---|
| **Nom d'affichage** | Prénom ou pseudo affiché dans le profil |
| **Mode sombre** | Bascule manuelle thème clair / sombre |
| **Effets sonores** | Active ou coupe tous les sons |
| **Mode zen** | Les habitudes terminées se replient dans l'onglet Aujourd'hui |
| **Notifications** | Rappels quotidiens (voir ci-dessous) |
| **Réinitialiser** | Efface définitivement toutes les données (confirmation demandée) |

La page Compte affiche aussi le niveau, le titre et la barre d'XP jusqu'au niveau suivant.

### 13. 🔔 Rappels

Quatre rappels locaux, programmés à l'heure de l'appareil lorsque l'autorisation de notification est accordée :

| Rappel | Heure | Jours |
|---|---|---|
| 💼 Mode travail | 08:30 | Lun–Ven |
| 🏃 Heure de courir | 17:30 | Lun–Ven |
| 💤 Extinction des feux | 21:00 | Lun–Ven |
| 📵 Téléphone posé | 21:00 | Tous les jours |

> Les rappels sont planifiés par l'application elle-même (minuteurs JavaScript) : ils ne se déclenchent que lorsque l'app est ouverte ou active en arrière-plan. Aucun serveur de push n'est utilisé. Le Service Worker gère le clic sur une notification (focus de l'app ou ouverture).

### 14. 🔊 Sons procéduraux

Aucun fichier audio : tous les sons sont synthétisés à la volée avec la **Web Audio API**.

| Son | Déclencheur |
|---|---|
| `done` | Habitude ou objectif validé, succès débloqué |
| `undo` | Annulation d'une validation |
| `fail` | Échec (habitude de type `bad`) |
| `drink` | Objectif d'hydratation atteint |
| `fanfare` | Journée parfaite |
| `levelup` | Passage de niveau |

### 15. 📱 PWA

- Installable sur iOS (Safari → « Sur l'écran d'accueil ») et Android/desktop (Chrome).
- Mode `standalone`, orientation portrait, langue `fr`, prise en charge des zones sécurisées (encoche, barre d'accueil).
- **Hors-ligne** via le Service Worker (`ht-v3.0.1`) :
  - HTML : réseau d'abord, repli sur le cache ;
  - fichiers locaux (CSS, JS, icônes, manifeste) : cache d'abord, précachés à l'installation ;
  - Google Fonts : *stale-while-revalidate*.
- Anciennes versions du cache supprimées automatiquement à l'activation.
- Icônes `any` et `maskable`, icône Apple Touch.

### 16. 💾 Stockage & confidentialité

Toutes les données (historique, profil, XP, humeurs, ressentis, journal de sommeil, succès) sont stockées dans le `localStorage` sous la clé **`ht-v2.6`**. Aucune donnée ne quitte votre appareil, aucun compte n'est requis. Les données existantes sont migrées automatiquement avec des valeurs par défaut quand de nouveaux champs apparaissent.

### 17. ♿ Accessibilité & confort

Barres de progression avec rôle ARIA, libellés accessibles sur les boutons d'icône, zone live pour les phases de respiration, et respect de `prefers-reduced-motion`.

---

## 🎨 Direction artistique « Encre »

- **Principe :** interface en noir et blanc, la couleur appartient aux habitudes. Chaque habitude a son encre ; une carte validée se remplit de cette couleur.
- **Typographies :** Bricolage Grotesque (titres et chiffres) et Instrument Sans (texte), chargées depuis Google Fonts.
- **Thèmes :** clair (papier gris froid) et sombre, mêmes encres dans les deux.
- **Retours visuels :** confettis (Canvas) pour la journée parfaite, animations de validation, repli en mode zen.

---

## 🛠️ Architecture technique

```
habitstracker/
├── index.html          # Structure des pages, modales (humeur, profil, sommeil), overlays (respiration, méditation)
├── style.css           # Design system « Encre » (variables CSS, thèmes clair / sombre)
├── script.js           # Logique complète : données, XP, séries, succès, rendu, audio, notifications
├── sw.js               # Service Worker (cache, hors-ligne, clic sur notification)
├── manifest.json       # Manifeste PWA
└── assets/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-512-maskable.png
    └── apple-touch-icon.png
```

**Stack :** HTML · CSS · JavaScript vanilla · Web Audio API · Canvas API · Service Worker API · Web Notifications API · localStorage.

**Aucun framework, aucun bundler, aucun serveur.** La seule ressource externe est la police Google Fonts (mise en cache par le Service Worker pour l'usage hors-ligne).

---

## 🧭 À venir

- Ajout, modification et suppression d'habitudes personnalisées
- Sessions de méditation guidée