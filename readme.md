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

Un dock flottant en bas de l'écran donne accès à cinq pages : **Accueil**, **Succès** (deux onglets : *Défis & saison* et *Succès*), **Rapport**, **Habitudes** et **Compte**. Seul l'onglet actif affiche son libellé. Le bouton ⋮ de l'accueil ouvre la fenêtre de profil.

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

**10 niveaux** (puis la [saison](#20--défis-et-saisons) prend le relais) : Novice → Apprenti → Pratiquant → Fervent → Discipliné → Concentré → Maître → Grand maître → Légende → Transcendant.
**Seuils d'XP :** 0 · 100 · 250 · 500 · 800 · 1 200 · 1 700 · 2 400 · 3 200 · 4 200.

**Séries :** calculées par habitude (en jours, ou en semaines pour l'hebdomadaire) en ignorant les jours inactifs ; la série du jour n'est pas cassée tant que la journée n'est pas terminée. La série la plus longue est également conservée. Un **jour de pause** gèle les séries (il est ignoré comme un jour inactif).

**Journée parfaite :** toutes les habitudes non optionnelles actives du jour sont validées → confettis, fanfare et bonus d'XP.

### 5. 🏆 Succès

24 succès, regroupés par catégorie dans l'onglet **Succès** avec un compteur global de progression.

| Catégorie | Succès |
|---|---|
| **Séries et régularité** | 🌅 Régularité (série ≥ 30 j) · 🎯 Dévouement (série ≥ 60 j) · 🐫 Chameau (eau 7 j de suite) · 🌊 Hydratation parfaite (eau 30 j) · 📖 Rat de bibliothèque (lecture 14 j) · 🌙 Hibou apprivoisé (sommeil 14 j) · 👑 Maîtrise de soi (aucune mauvaise habitude 14 j) · 👣 Sur la route (10 000 pas 7 j) · 🏅 Marathon (10 000 pas 30 j) |
| **Étapes et XP** | 🌱 Premier pas · ⚔️ Centurion (100 XP) · 💎 Réserve d'XP (500 XP) · 🔥 En feu (niveau 5) · 🌌 Transcendance (niveau max) |
| **Journées parfaites** | ⭐ Semaine parfaite (100 % sur une semaine complète) · 💯 Perfectionniste (5 journées parfaites) · 💪 Volonté de fer (20 séances de gym dans le mois) |
| **Bien-être** | 🧘 Esprit calme (5 min de méditation en une journée) · 🪷 Pleine conscience (7 jours différents de méditation) |
| **Défis et saisons** | 🎯 Défi relevé · 🏹 Chasseur de défis (5 défis) · 🏔️ Trente jours (défi ≥ 30 j) · 🌟 Rang V (saison) · 🏆 Sommet de saison (rang maximal) |

Chaque déblocage déclenche une notification dans l'app et un son.

### 6. 🧠 Humeur

- **Saisie en deux étapes** : choix parmi 5 niveaux (😎 Super · 😊 Bien · 😐 Neutre · 😢 Bof · 😡 Mal), puis sélection d'un ou plusieurs **ressentis** adaptés au niveau choisi (Joie, Calme, Fatigue, Stress, Colère…).
- **Invite quotidienne** : si l'humeur du jour n'est pas renseignée, la fenêtre s'ouvre automatiquement quelques secondes après le lancement (une fois par session).
- **Saisie manuelle** depuis l'accueil ou le Rapport, et **rattrapage des jours passés** depuis le calendrier d'humeur.
- **Journal du jour** : à la seconde étape, un champ libre (600 caractères, compteur en direct) permet d'attacher une **note** à l'humeur. Un jour avec note porte une petite pastille dans le calendrier d'humeur.
- **Modification** : toucher un jour du calendrier d'humeur rouvre la saisie pré-remplie (humeur, ressentis, note). Valider une note vide la supprime ; l'humeur est conservée.
- **Relecture** : la carte **Journal** du Rapport liste les notes (la plus récente d'abord : 5 notes, puis « Voir plus » par dizaines), avec ressentis, recherche plein texte (à partir de 3 notes), modification ✏️ et suppression 🗑. Les retours à la ligne sont conservés et le texte est toujours échappé.

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
| **Journal** | Notes attachées à l'humeur, avec recherche (voir [Humeur](#6--humeur)) |
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
- **Archiver** (recommandé) masque l'habitude **sans rien perdre** : l'historique, les séries passées et les statistiques restent. Elle disparaît des onglets Aujourd'hui / Semaine / Global et de la page Habitudes, où une section **Archivées** permet de la **restaurer** ; les jours archivés restent « hors plage » (ni réussis, ni manqués). Ses rappels sont désactivés, ses défis en cours abandonnés, sa série n'est plus comptée dans « Série en cours » ni dans les succès, et on peut toujours la consulter dans le Rapport (groupe *Archivées* du filtre).
- Un toast **Annuler** (8 secondes) suit l'archivage : il restaure l'habitude, réactive ses rappels et rétablit ses défis.
- **Supprimer définitivement** (formulaire d'édition ou liste des archivées) efface l'historique après confirmation, détache les rappels liés et abandonne les défis, mais reste **annulable pendant 8 secondes** (position, historique, rappels et défis rétablis).
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
- **Raccourcis d'icône** (appui long) : voir [Raccourcis PWA](#21--raccourcis-pwa).
- Mode `standalone`, orientation portrait, langue `fr`, prise en charge des zones sécurisées (encoche, barre d'accueil).
- **Hors-ligne** via le Service Worker (`ht-v3.4.1`) :
  - HTML : réseau d'abord, repli sur le cache ;
  - fichiers locaux (CSS, JS, icônes, manifeste) : cache d'abord, précachés à l'installation ;
  - Google Fonts : *stale-while-revalidate*.
- Anciennes versions du cache supprimées automatiquement à l'activation.
- Icônes `any` et `maskable`, icône Apple Touch.

### 16. 💾 Stockage & confidentialité

Toutes les données (historique, définitions des habitudes, rappels, profil, XP, humeurs, ressentis, journal de sommeil, jours de pause, minutes de méditation, notes du journal, défis, XP de saison, succès) sont stockées dans le `localStorage` sous la clé **`ht-v2.6`**. Aucune donnée ne quitte votre appareil, aucun compte n'est requis. Les données existantes sont migrées automatiquement : à la première ouverture, les habitudes et rappels par défaut sont copiés dans les données, sans toucher à l'historique. Une écriture qui échoue (stockage plein, navigation privée) est signalée au lieu de passer inaperçue.

### 17. ♿ Accessibilité & confort

- **Fenêtres (9 modales, feuilles et écrans plein format) :** rôle `dialog` + `aria-modal` et titre associé ; à l'ouverture le **focus entre dans la fenêtre** (premier champ utile) et le reste de l'app devient **inerte** (`inert` + `aria-hidden`), donc ni clavier ni lecteur d'écran ne s'en échappent ; **Tab / Maj+Tab restent piégés** dans la fenêtre ; **Échap** ferme la fenêtre du dessus (comme le bouton ✕) et le **focus revient** à l'élément qui l'avait ouverte. Les fenêtres fermées sont inertes : Tab n'y entre jamais.
- Boutons d'icône nommés, barres de progression avec rôle ARIA, toasts annoncés (`role="status"`), zone live pour les phases de respiration.
- Respect de `prefers-reduced-motion`.

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

### 20. 🏆 Défis et saisons

Pour relancer la motivation une fois les 10 niveaux atteints. Tout est dans l'onglet **Défis & saison** de la page Succès.

**Saisons.** Quatre saisons par an, qui suivent le calendrier météorologique : ❄️ Hiver (déc.–fév.), 🌸 Printemps (mars–mai), ☀️ Été (juin–août), 🍂 Automne (sept.–nov.).

- Chaque XP gagné (habitudes, défis, méditation, journées parfaites…) alimente aussi l'**XP de la saison en cours**, qui repart de zéro à chaque saison.
- **12 rangs**, de I *Éveil* à XII *Éternité* (seuils : 0 · 300 · 700 · 1 200 · 1 800 · 2 500 · 3 300 · 4 200 · 5 200 · 6 300 · 7 500 · 9 000 XP). Un changement de rang déclenche une annonce et un son.
- La carte de saison affiche le rang, la progression vers le suivant, les jours restants et les **saisons passées** avec leur rang final. Le rang courant est aussi rappelé sous la barre d'XP de la page Compte.

**Défis.** Des objectifs temporaires sur une habitude, jusqu'à **5 en parallèle** (un seul par habitude).

| Réglage | Détail |
|---|---|
| **Habitude** | N'importe quelle habitude sauf les hebdomadaires |
| **Durée** | 7, 14, 21, 30, 60 ou 90 jours, ou une valeur libre de 3 à 365, à partir d'aujourd'hui |
| **Objectif** | *Chaque jour* (tous les jours actifs) ou *Au moins K jours* sur la durée ; pour une habitude **à éviter**, « aucun écart » |
| **Titre** | Généré (« 30 jours sans Scroll », « Gym · 12 fois en 30 jours ») et modifiable |
| **Récompense** | `10 + 3 × jours requis` XP, versés aussi à la saison |

- **Victoire :** dès que le nombre de jours requis est atteint (« Au moins K jours » peut donc se gagner avant la fin). Pour une habitude à éviter, un jour « propre » ne compte qu'une fois la journée terminée : « 30 jours sans X » se gagne le lendemain du dernier jour.
- **Échec :** dès que l'objectif devient mathématiquement impossible (un écart sur un défi « sans », un jour raté sur un défi « chaque jour »…). Aucune pénalité d'XP.
- **Pauses et jours inactifs** sont exclus : ils réduisent le nombre de jours requis au lieu de pénaliser.
- Le défi est réévalué à chaque affichage et au retour de l'app au premier plan, puis annoncé (toast, fanfare, confettis). Si l'habitude liée est supprimée, le défi est abandonné.
- Un **historique** conserve les 8 derniers défis terminés (relevé ✓, manqué ✗, abandonné –), effaçable.

### 21. 🔗 Raccourcis PWA

Sur Android (appui long sur l'icône) et sur les navigateurs desktop qui l'acceptent (clic droit sur l'icône de l'app installée), l'app propose quatre raccourcis déclarés dans `manifest.json` :

| Raccourci | Action |
|---|---|
| **Noter mon humeur** | Ouvre la saisie d'humeur (et sa note) pour aujourd'hui |
| **Respiration** | Ouvre l'écran de respiration |
| **+250 ml d'eau** | Ajoute 250 ml à l'objectif du jour et affiche le total (objectif et plafond respectés) |
| **Méditation** | Ouvre le minuteur de méditation |

Chaque raccourci ouvre `index.html?action=…` ; l'action est exécutée une seule fois et l'URL est aussitôt nettoyée, donc un rechargement ne la rejoue pas. Une action inconnue est ignorée. iOS n'implémente pas les raccourcis d'icône.

### 22. 💾 Sauvegarde : export / import

Dans **Compte → Sauvegarde**. Vider le cache ou changer de téléphone ne doit plus effacer l'historique.

- **Exporter** : télécharge `habitstracker-AAAA-MM-JJ.json` (sur mobile, la feuille de partage permet d'enregistrer le fichier dans Fichiers, Drive, etc.). Le fichier contient une enveloppe (`app`, `schema`, `appVersion`, `exportedAt`) et **toutes** les données.
- **Importer** : lit un fichier d'export (ou une base brute plus ancienne), affiche un **résumé** (habitudes, XP et niveau, humeurs, notes, date de début) et demande confirmation avant de **remplacer** les données.
  - **Validation stricte** : liste blanche de champs, dates, types et bornes. Les champs inconnus sont ignorés, les valeurs hors limites écartées, les textes tronqués, les couleurs contrôlées, les doublons et les références orphelines nettoyés. Un fichier hostile ne peut ni injecter de code, ni polluer l'application.
  - **Annulable** : un **point de restauration** des données précédentes est conservé (`ht-v2.6.bak`) ; un toast « Annuler » apparaît juste après l'import et la ligne **Annuler le dernier import** reste disponible dans Compte. « Réinitialiser » l'efface aussi.
  - Refusés avec un message clair : fichier illisible, ne ressemblant pas à une sauvegarde, plus de 15 Mo.
- **Rappel « dernière sauvegarde »** : Compte affiche « Dernière sauvegarde : il y a N jours » (en rouge dès que la sauvegarde est jugée trop ancienne) et l'accueil propose une pastille **Sauvegarder** (avec ✕ pour la repousser de 7 jours) après 14 jours sans sauvegarde, ou 7 jours d'utilisation sans aucune.
- **Stockage persistant** : la ligne *Stockage protégé* indique si le navigateur s'engage à ne pas vider les données (`navigator.storage.persist()`), l'espace utilisé, et propose un bouton **Protéger**. Pour une app **installée**, la demande est faite automatiquement au lancement.

### 23. 🕛 Changement de jour

Si l'app reste ouverte ou en arrière-plan après minuit, l'écran se met à jour tout seul : cartes remises à zéro, défis évalués, rappels replanifiés, date du jour. Le changement est détecté par un minuteur calé sur minuit, une vérification toutes les 60 s (filet de sécurité en cas de veille ou de changement d'heure) et au retour dans l'app (visibilité, focus). L'invite d'humeur du nouveau jour n'apparaît qu'**au retour de l'utilisateur**, jamais en pleine nuit.

## 🎨 Direction artistique « Encre »

- **Principe :** interface en noir et blanc, la couleur appartient aux habitudes. Chaque habitude a son encre ; une carte validée se remplit de cette couleur.
- **Typographies :** Bricolage Grotesque (titres et chiffres) et Instrument Sans (texte), chargées depuis Google Fonts.
- **Thèmes :** clair (papier gris froid) et sombre, mêmes encres dans les deux ; le mode **Auto** suit l'appareil, y compris la couleur de la barre du navigateur, sans flash au chargement.
- **Retours visuels :** confettis (Canvas) pour la journée parfaite, animations de validation, repli en mode zen.

---

## 🛠️ Architecture technique

```
habitstracker/
├── index.html          # Structure des pages, 9 fenêtres (humeur, profil, sommeil, habitude, rappel, pause, défi, respiration, méditation)
├── style.css           # Design system « Encre » (variables CSS, thèmes clair / sombre)
├── sw.js               # Service Worker (cache, hors-ligne, clic sur notification)
├── manifest.json       # Manifeste PWA (icônes, raccourcis d'icône)
├── js/                 # Logique, découpée par domaine (ordre de chargement ci-dessous)
│   ├── core.js         # Constantes, utilitaires, icônes, données (localStorage)
│   ├── theme.js        # Thème clair / sombre / automatique
│   ├── progress.js     # Audio, toasts, XP et niveaux, séries, succès, actions sur les habitudes, confettis
│   ├── home.js         # Navigation et page Accueil
│   ├── mood.js         # Humeur, calendrier d'humeur, journal du jour
│   ├── report.js       # Rapport interactif, graphiques, insights
│   ├── habits.js       # Page Habitudes, formulaire d'habitude, habitudes « à éviter »
│   ├── account.js      # Page Succès, page Compte, profil, réinitialisation
│   ├── reminders.js    # Rappels configurables et notifications
│   ├── wellness.js     # Respiration, méditation, sommeil
│   ├── pause.js        # Jours de pause
│   ├── challenges.js   # Saisons et défis
│   ├── shortcuts.js    # Raccourcis PWA
│   ├── backup.js       # Export / import, stockage persistant, rappel de sauvegarde
│   ├── archive.js      # Toast « Annuler » et archivage
│   ├── day.js          # Changement de jour
│   ├── a11y.js         # Accessibilité des fenêtres
│   └── app.js          # Initialisation
└── assets/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-512-maskable.png
    └── apple-touch-icon.png
```

> **Pourquoi des scripts classiques et pas des modules ES ?** Les gestionnaires `onclick="…"` du HTML et des gabarits appellent des fonctions globales, et plusieurs états (`DB`, `HABITS`, les formulaires) sont partagés et réaffectés. Des `import`/`export` obligeraient à remplacer ces appels par une délégation d'événements et à passer par des accesseurs : un chantier plus risqué que le gain. Le découpage actuel apporte déjà l'essentiel (fichiers courts et thématiques) **sans changer le comportement**. Les fichiers partagent la portée globale et se chargent dans l'ordre listé dans `index.html` ; une instruction exécutée au chargement ne doit donc dépendre que de fichiers situés plus haut.

**Stack :** HTML · CSS · JavaScript vanilla · Web Audio API · Canvas API · Service Worker API · Web Notifications API · localStorage.

**Aucun framework, aucun bundler, aucun serveur.** La seule ressource externe est la police Google Fonts (mise en cache par le Service Worker pour l'usage hors-ligne).

---

## ▶️ Lancer le projet

Le Service Worker nécessite `https://` ou `http://localhost` :

```bash
# depuis le dossier du projet
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

---

## 🧭 À venir

- Rappels Web Push (notifications app fermée, nécessite un petit serveur)
- Conversion en modules ES (nécessite de remplacer les `onclick` inline par une délégation d'événements)
- Réorganisation des habitudes par glisser-déposer
