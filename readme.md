# 🌙 HabitsTracker — Suivi d'habitudes gamifié (PWA)

**HabitsTracker** est une application web de suivi d'habitudes qui s'appuie sur la gamification (XP, niveaux, séries, succès) et sur un volet bien-être (humeur, respiration, sommeil). Écrite en HTML, CSS et JavaScript vanilla, elle fonctionne sans serveur ni compte : toutes les données restent dans le navigateur. Elle s'installe comme une application native (PWA) sur mobile et desktop et fonctionne hors-ligne.

---

## 📋 Habitudes suivies

Neuf habitudes sont proposées par défaut. Chacune a sa couleur (« encre ») et son icône. Elles sont toutes modifiables et supprimables, et tu peux en créer autant que tu veux (voir [Habitudes personnalisées](#11--habitudes-personnalisées)). Aucune habitude « à éviter » n'est livrée par défaut : elles se créent en un tap grâce aux suggestions (jeux vidéo, scroll, films, sucre, alcool, tabac).

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
- **Pastille Pause** sous l'en-tête : affiche le quota restant du mois et ouvre la fenêtre de pause ; un jour de pause remplace la pastille par une bannière « Reprendre » (voir [Jours de pause](#18--jours-de-pause)).
- **Section Bien-être** (onglet Aujourd'hui) : accès rapide à l'humeur, à la respiration, à la méditation et au résumé du sommeil.

### 3. ✅ Types d'habitudes

| Type | Fonctionnement |
|---|---|
| **Case à cocher** (`good`) | Validation en un tap, annulable. |
| **Eau** (`drink`) | Boutons −, +250 ml et +500 ml, barre de progression, plafond à 5 000 ml. |
| **Compteur** (`counter`) | Pas (`step`), objectif (`goal`), maximum (`max`) et unité configurables par habitude ; barre de progression et bouton − . |
| **Hebdomadaire** (`weekly`) | Une seule validation suffit pour la semaine (Lun–Dim) ; la série se compte en semaines. |
| **À éviter** (`bad`) | La journée est **validée par défaut** ; un échec casse la série. Deux modes : *simple* (un tap = échec, un second l'annule) ou *par durée* (voir ci-dessous). |

**Habitudes « à éviter » par durée :** une rangée de paliers s'affiche sur la carte, **Non** (aucun écart, journée validée) puis les paliers de ton choix (ex. *15 min · 30 min · 1 h · 2 h · +3 h*, jusqu'à 8 paliers de 10 caractères). Choisir **Non** valide la journée ; tout autre palier enregistre un **échec** avec sa valeur : la série est cassée et la case de la grille *Global* devient rouge, la valeur apparaissant au survol. Les bad habits comptent dans la journée parfaite (sauf si marquées *optionnelles*), n'ont pas de XP propre et alimentent le succès « Maîtrise de soi ».

Les habitudes limitées aux jours ouvrés (`weekdayOnly`) ou à des jours précis (`activeDays`) disparaissent de l'onglet Aujourd'hui les jours inactifs et ne pénalisent ni les séries ni les statistiques.

### 4. 🎮 Gamification

**XP gagnée :**

| Action | XP |
|---|---|
| Habitude à cocher validée | +10 |
| Habitude hebdomadaire validée | +20 |
| Objectif eau atteint | +10 |
| Objectif d'un compteur atteint (km, pas, lecture) | +10 |
| Séance de méditation terminée (une fois par jour) | +10 |
| Journée parfaite (bonus, une fois par jour) | +50 |

**10 niveaux :** Novice → Apprenti → Pratiquant → Fervent → Discipliné → Concentré → Maître → Grand maître → Légende → Transcendant.
**Seuils d'XP :** 0 · 100 · 250 · 500 · 800 · 1 200 · 1 700 · 2 400 · 3 200 · 4 200.

**Séries :** calculées par habitude (en jours, ou en semaines pour l'hebdomadaire) en ignorant les jours inactifs ; la série du jour n'est pas cassée tant que la journée n'est pas terminée. La série la plus longue est également conservée. Un **jour de pause** gèle les séries (il est ignoré comme un jour inactif).

**Journée parfaite :** toutes les habitudes non optionnelles actives du jour sont validées → confettis, fanfare et bonus d'XP.

### 5. 🏆 Succès

20 succès, regroupés par catégorie sur la page **Succès** avec un compteur global de progression.

| Catégorie | Succès |
|---|---|
| **Séries et régularité** | 🌅 Régularité (série ≥ 30 j) · 🎯 Dévouement (série ≥ 60 j) · 🐫 Chameau (eau 7 j de suite) · 🌊 Hydratation parfaite (eau 30 j) · 📖 Rat de bibliothèque (lecture 14 j) · 🌙 Hibou apprivoisé (sommeil 14 j) · 👑 Maîtrise de soi (aucune mauvaise habitude 14 j) · 👣 Sur la route (10 000 pas 7 j) · 🏅 Marathon (10 000 pas 30 j) |
| **Étapes et XP** | 🌱 Premier pas · ⚔️ Centurion (100 XP) · 💎 Réserve d'XP (500 XP) · 🔥 En feu (niveau 5) · 🌌 Transcendance (niveau max) |
| **Journées parfaites** | ⭐ Semaine parfaite (100 % sur une semaine complète) · 💯 Perfectionniste (5 journées parfaites) · 💪 Volonté de fer (20 séances de gym dans le mois) |
| **Bien-être** | 🧘 Esprit calme (5 min de méditation en une journée) · 🪷 Pleine conscience (7 jours différents de méditation) |

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

Minuteur plein écran dans le même esprit que la respiration :

- **Durée :** 5 min (*Pause*), 10 min (*Équilibre*) ou 20 min (*Profonde*).
- **Cloche** de bol tibétain au début et deux fois à la fin, synthétisée en additif (partiels inharmoniques à décroissance lente).
- **Ambiances** synthétisées en temps réel, sans aucun fichier audio : *Silence*, *Pluie* (bruit rose filtré), *Océan* (bruit brun modulé par une houle lente) et *Drone* (nappe d'oscillateurs avec léger vibrato). Elles montent en fondu et s'éteignent en douceur ; on peut en changer pendant la séance.
- **Anneau de progression**, orbe qui « respire » pendant la séance, **pause / reprise** et bouton *Terminer*.
- **Écran maintenu allumé** pendant la séance (Wake Lock, quand le navigateur le permet) ; le temps est calculé sur l'horloge et non sur des ticks, il reste juste même si l'app est brièvement suspendue.
- **Suivi :** les minutes sont cumulées par jour. Une séance menée à terme rapporte **+10 XP** (une fois par jour) ; une séance interrompue enregistre le temps réellement médité (à partir d'1 minute), sans XP.
- Si les **sons sont désactivés** dans le compte, la séance reste un minuteur silencieux.

### 9. 💤 Suivi du sommeil

Fenêtre de saisie avec **durée** (heures/minutes), **heure de coucher** et **heure de réveil** (facultatives) et **date** modifiable. L'enregistrement valide automatiquement l'habitude Sommeil pour la date choisie et affiche un résumé de la nuit sur l'accueil.

### 10. 📈 Rapport interactif

Tout le rapport suit trois commandes en haut de page :

- **Période** : *Semaine*, *Mois* ou *Année* (les badges des cartes sont cliquables et font défiler les périodes).
- **Navigation** ‹ › pour remonter dans le temps (le futur est bloqué).
- **Filtre par habitude** : *Toutes les habitudes* ou une habitude précise.

| Élément | Contenu |
|---|---|
| **Cartes de synthèse** | Série en cours, taux de réussite, habitudes validées et journées parfaites (*jours réussis* quand une habitude est filtrée) sur la période |
| **Histogramme** | Semaine : 7 jours · Mois : un jour par barre · Année : 12 mois ; survol pour le détail `validées/prévues` |
| **Courbe de réussite** | Taux de réussite par jour (semaine, mois) ou par mois (année) ; les jours sans données interrompent la courbe |
| **Calendrier du mois** | Parfait · bon (≥ 70 %) · manqué ; les **jours de pause** sont hachurés et exclus des calculs |
| **Calendrier d'humeur** | Navigation mois par mois et saisie rétroactive |
| **Courbe d'humeur** | Journalière (semaine, mois) ou moyenne mensuelle (année) |
| **Insights** | Voir [Insights croisés](#19--insights-croisés) |

Avec un filtre sur une habitude de type compteur, la réussite est proportionnelle à l'objectif (ex. 6 000 pas sur 10 000 = 60 %). Les graphiques sont dessinés en Canvas, sans bibliothèque, et suivent le thème clair/sombre.

### 11. 🗂️ Habitudes personnalisées

La page **Habitudes** liste toutes les habitudes (progression du jour, série, validation rapide). Le bouton **+** (page Habitudes ou bouton flottant de l'accueil) ouvre le formulaire de création ; le bouton ✏️ de chaque ligne ouvre l'édition.

| Champ | Détail |
|---|---|
| **Nom** | 30 caractères max, unique (insensible à la casse) |
| **Type** | *Case à cocher* · *Compteur* · *Eau* (compteur en ml, préréglé à 2 000 / +250 / 5 000) · *Hebdomadaire* |
| **Icône** | Un emoji, saisi librement ou choisi dans une grille |
| **Couleur** | 12 encres claires (le texte reste lisible sur la carte validée) |
| **Jours actifs** | Sélecteur L M M J V S D avec raccourcis « Tous les jours » et « Lun – Ven » (hors hebdomadaire) |
| **Objectif** (compteur / eau) | Objectif du jour, ajout par tap, maximum, unité libre (8 caractères) |
| **Optionnelle** | Ne compte pas dans la journée parfaite |

**Comportement :**

- Une habitude créée n'existe qu'**à partir de sa date de création** : aucun jour passé n'est compté comme manqué et les séries démarrent proprement.
- Le **type n'est pas modifiable** après création (le format de l'historique en dépend) ; tout le reste l'est. Changer l'objectif d'un compteur s'applique aussi à l'historique.
- Les habitudes par défaut sont modifiables (nom, couleur, jours, objectif…) et supprimables. L'objectif d'eau par défaut est lui aussi configurable.
- **Supprimer** une habitude efface son historique (confirmation demandée) et détache les rappels qui y étaient liés.
- Les habitudes sont stockées dans les données de l'app (`habitDefs`) : elles sont donc sauvegardées et réinitialisées avec le reste.
- Un compteur qui atteint son objectif peut désormais déclencher la **journée parfaite** (avant, seuls les clics sur les cases à cocher le faisaient).

### 12. 👤 Compte & préférences

Accessibles depuis la page **Compte** et la fenêtre de profil (⋮).

| Préférence | Description |
|---|---|
| **Nom d'affichage** | Prénom ou pseudo affiché dans le profil |
| **Thème** | **Clair**, **Sombre** ou **Auto** (suit le réglage de l'appareil en direct, via `prefers-color-scheme`) |
| **Jours de pause** | Quota mensuel de jours de repos (0 à 10, 3 par défaut) |
| **Effets sonores** | Active ou coupe tous les sons |
| **Mode zen** | Les habitudes terminées se replient dans l'onglet Aujourd'hui |
| **Notifications** | Rappels quotidiens (voir ci-dessous) |
| **Réinitialiser** | Efface définitivement toutes les données (confirmation demandée) |

La page Compte affiche aussi le niveau, le titre et la barre d'XP jusqu'au niveau suivant.

### 13. 🔔 Rappels configurables

Depuis la page **Compte → Rappels**, chaque rappel se règle individuellement. Quatre rappels sont proposés par défaut ; tu peux les modifier, les désactiver, les supprimer ou en créer d'autres.

| Champ | Détail |
|---|---|
| **Titre** / **Message** | Texte de la notification (emoji bienvenus) |
| **Heure** | Sélecteur d'heure natif |
| **Jours** | Sélecteur L M M J V S D, raccourcis « Tous les jours » et « Lun – Ven » |
| **Habitude liée** *(facultatif)* | Si l'habitude est déjà faite à l'heure du rappel, la notification est ignorée |
| **Actif** | Interrupteur pour mettre un rappel en pause sans le supprimer |

Rappels par défaut :

| Rappel | Heure | Jours | Habitude liée |
|---|---|---|---|
| 💼 Mode travail | 08:30 | Lun–Ven | Travail |
| 🏃 Heure de courir | 17:30 | Lun–Ven | Running |
| 💤 Extinction des feux | 21:00 | Lun–Ven | — |
| 📵 Téléphone posé | 21:00 | Tous les jours | — |

**Fonctionnement :**

- L'interrupteur **Notifications** des préférences accorde l'autorisation et active ou coupe l'ensemble des rappels ; un bouton **Envoyer une notification test** permet de vérifier que tout fonctionne.
- Chaque rappel est planifié à sa **prochaine occurrence en respectant ses jours**, puis replanifié après chaque déclenchement et au retour de l'app au premier plan.
- Un rappel qui arrive avec plus de 10 minutes de retard (appareil en veille) est ignoré plutôt qu'affiché hors de propos.
- Les notifications passent par le Service Worker quand il est disponible (requis sur Android), avec repli sur l'API Notification.

> **Limite connue :** l'app n'a pas de serveur, les rappels sont donc planifiés par l'application elle-même. Ils sonnent tant que l'app est ouverte ou active en arrière-plan, mais **pas si elle est complètement fermée**. Y parvenir nécessiterait des notifications Web Push, donc un petit serveur d'envoi.

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
| `bell` | Cloche de méditation (début et fin de séance) |
| ambiances | Pluie, océan, drone pendant la méditation |

### 15. 📱 PWA

- Installable sur iOS (Safari → « Sur l'écran d'accueil ») et Android/desktop (Chrome).
- Mode `standalone`, orientation portrait, langue `fr`, prise en charge des zones sécurisées (encoche, barre d'accueil).
- **Hors-ligne** via le Service Worker (`ht-v3.1.1`) :
  - HTML : réseau d'abord, repli sur le cache ;
  - fichiers locaux (CSS, JS, icônes, manifeste) : cache d'abord, précachés à l'installation ;
  - Google Fonts : *stale-while-revalidate*.
- Anciennes versions du cache supprimées automatiquement à l'activation.
- Icônes `any` et `maskable`, icône Apple Touch.

### 16. 💾 Stockage & confidentialité

Toutes les données (historique, définitions des habitudes, rappels, profil, XP, humeurs, ressentis, journal de sommeil, jours de pause, minutes de méditation, succès) sont stockées dans le `localStorage` sous la clé **`ht-v2.6`**. Aucune donnée ne quitte votre appareil, aucun compte n'est requis. Les données existantes sont migrées automatiquement : à la première ouverture, les habitudes et rappels par défaut sont copiés dans les données, sans toucher à l'historique.

### 17. ♿ Accessibilité & confort

Barres de progression avec rôle ARIA, libellés accessibles sur les boutons d'icône, zone live pour les phases de respiration, et respect de `prefers-reduced-motion`.

---

### 18. ⏸️ Jours de pause

Maladie, voyage, grosse fatigue : une pause **gèle les séries** sans les casser. Les jours en pause sont traités comme des jours inactifs : ils ne comptent ni comme réussis, ni comme manqués, ni dans la journée parfaite, et sont exclus des statistiques.

- **Poser une pause :** pastille *Pause* de l'accueil, ou **Compte → Jours de pause**. Choisis une date de début et de fin (une seule date = un jour) et une **raison** : 🤒 Malade · ✈️ Voyage · 😴 Épuisé · 💼 Trop de travail · 🎉 Soirée · ❓ Autre.
- **Quota mensuel** (3 par défaut, réglable de 0 à 10) décompté par mois calendaire ; le formulaire indique en direct ce qu'il restera. Une plage à cheval sur deux mois est contrôlée mois par mois.
- **Fenêtre autorisée :** jusqu'à **7 jours en arrière** (pour justifier un oubli récent) et **30 jours en avance** (pour planifier un voyage), **14 jours maximum** par pause.
- **Un jour de pause** remplace les cartes de l'onglet *Aujourd'hui* par une note de repos et une bannière **Reprendre** qui annule la pause.
- **Habitudes hebdomadaires :** une semaine comptant au moins 3 jours de pause n'est ni validée ni cassée.
- La liste des pauses récentes et à venir permet d'en retirer une à tout moment.

### 19. 💡 Insights croisés

Une carte en bas du Rapport met en relation **humeur**, **sommeil**, **habitudes** et **méditation** sur les **90 derniers jours** :

- *« Les jours où tu fais « Gym », ton humeur moyenne est de 4,2 (contre 3,5 sinon). »* pour chaque habitude, avec la formulation adaptée (« évites » pour une habitude à éviter, « atteins ton objectif » pour un compteur).
- Impact d'une **nuit d'au moins 7 h** sur l'humeur, et sur le pourcentage d'habitudes validées.
- Effet de la **méditation** et d'une journée à **80 % d'habitudes** ou plus sur l'humeur.
- **Meilleur et pire jour de la semaine** pour l'humeur.

Chaque ligne affiche l'écart (`+1,2` en vert, `−0,8` en rouge, ou `+15 pts`) et le nombre de jours sur lequel elle repose. Pour éviter les faux signaux : au moins **7 jours d'humeur** renseignés pour démarrer, au moins **5 jours dans chaque groupe** comparé, un écart minimal (0,3 point d'humeur, 8 points de pourcentage) et **6 insights maximum**, triés par importance. Pour chaque habitude, les jours où elle est inactive (jours de pause compris) sont écartés de la comparaison. Ce sont des corrélations, pas des causes : un rappel est affiché sous la carte.

## 🎨 Direction artistique « Encre »

- **Principe :** interface en noir et blanc, la couleur appartient aux habitudes. Chaque habitude a son encre ; une carte validée se remplit de cette couleur.
- **Typographies :** Bricolage Grotesque (titres et chiffres) et Instrument Sans (texte), chargées depuis Google Fonts.
- **Thèmes :** clair (papier gris froid) et sombre, mêmes encres dans les deux ; le mode **Auto** suit l'appareil, y compris la couleur de la barre du navigateur, sans flash au chargement.
- **Retours visuels :** confettis (Canvas) pour la journée parfaite, animations de validation, repli en mode zen.

---

## 🛠️ Architecture technique

```
habitstracker/
├── index.html          # Structure des pages, modales (humeur, profil, sommeil, habitude, rappel), overlays (respiration, méditation)
├── style.css           # Design system « Encre » (variables CSS, thèmes clair / sombre)
├── script.js           # Logique complète : données, habitudes personnalisées, XP, séries, succès, rendu, audio, rappels
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

- Rappels Web Push (notifications app fermée, nécessite un petit serveur)
- Réorganisation des habitudes par glisser-déposer