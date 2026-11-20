# NEXT MOVE ⚡ — Application locale pour Mahé

**NEXT MOVE est une application installable (PWA) pour Android, hébergée sur GitHub Pages, sans Firebase ni Cloudflare.**

## Installation

1. Dans le dépôt GitHub `PhysiqueRUSH/Next-Move`, ouvrir `Settings > Pages`.
2. Activer `Deploy from a branch`, sélectionner `main`, puis `/(root)`, et enregistrer.
3. Sur le Samsung de Mahé, ouvrir `https://physiquerush.github.io/Next-Move/` dans Chrome.
4. Menu Chrome (⋮) > `Installer l'application` ou `Ajouter à l'écran d'accueil` (selon Android).
5. Ouvrir NEXT MOVE, choisir la **roue dentée ⚙️** en haut à droite, et **créer son propre code parent à quatre chiffres**.
6. Dans l'espace parent, personnaliser les huit catégories, missions, horaires, périodes, validations et récompenses.

## Fonctionnement

- **Mode enfant** : une mission principale à la fois, retard au démarrage mesuré séparément, chrono sans pause, XP, pièces, records, trophées, boutique et planning complet.
- **Mode parent** : tous les paramètres locaux modifiables, validations parentales et demandes de récompenses, statistiques, périodes et exceptions.
- **Sauvegarde** : dans `Réglages`, bouton **Exporter ma sauvegarde** pour télécharger un JSON. Le bouton **Restaurer une sauvegarde** remplace les données locales après confirmation.
- Le PIN est conservé dans le stockage local du navigateur : un adulte doit garder ce code privé. Il ne constitue **pas une sécurité forte contre quelqu'un ayant un accès technique au téléphone ou aux fichiers**.
- Les données sont conservées uniquement dans le navigateur de **ce téléphone** : effacer le stockage du site, réinitialiser le téléphone ou désinstaller selon les réglages peut les faire disparaître. Sauvegarder régulièrement, notamment avant une migration.
- Pas de synchronisation automatique avec un deuxième téléphone.
- Les rappels-défis peuvent être affichés **quand l'application est ouverte**, mais aucune notification n'est garantie quand l'application est fermée : GitHub Pages seul ne peut pas envoyer de push programmés.
- Les heures, missions et récompenses sont des modèles entièrement personnalisables. Vérifier les périodes et les contraintes avant de laisser Mahé utiliser l'application régulièrement.

## Fichiers

- `index.html` : point d'entrée
- `app.js` : application et stockage local
- `styles.css`, `ui.css`, `homework.css`, `progression.css` : interface néon
- `sw.js` : service worker pour cache hors ligne
- `manifest.json` : installation Android
- `icons/` : icônes Android
- `config.js` : URL PRONOTE indicative, optionnelle

Les fichiers historiques sous `cloudflare/` ne sont plus utilisés dans cette version locale.

## Confidentialité

Ne pas ajouter de données privées ni de mots de passe dans le dépôt GitHub public. Les informations personnelles renseignées depuis l'application restent sur le téléphone, sous réserve du fonctionnement habituel du navigateur et d'éventuelles sauvegardes de l'appareil.

## Blocs de devoirs (sans recopier PRONOTE)

1. Sur le Samsung, ouvrir NEXT MOVE puis **📚 Mes devoirs** (depuis Mission ou Journée).
2. Consulter PRONOTE, puis indiquer uniquement le **nombre de devoirs restants pour chaque date**. Les comptes peuvent être modifiés à tout moment.
3. Dans **Mon bloc**, choisir combien de devoirs réaliser pour chacune de ces dates.
4. Estimer le temps nécessaire (en minutes) et toucher **Je lance mon bloc**. Le compte à rebours n'est pas pausé.
5. À la fin, confirmer la quantité **réellement terminée** pour chaque date. Les travaux non terminés restent dans le stock. Si le parent a activé l'approbation pour la mission de devoirs, les gains et le décompte définitif n'interviennent qu'après son accord.

Les récompenses dépendent du nombre réellement terminé, de l’avance sur l’échéance de chaque devoir, du volume du bloc et de la vitesse d’exécution. Il n’existe aucun seuil de temps parental pour les blocs. Un bonus de volume encourage les blocs cohérents plutôt que le découpage artificiel en petites missions. Les plafonds XP et pièces par devoir sont éditables dans **Paramètres parentaux > Gains maximum par devoir**. Les dates urgentes sont signalées.

**PRONOTE n'est pas connecté automatiquement** : NEXT MOVE ne voit pas les consignes ni les devoirs exacts. Le compte déclaré par Mahé repose sur sa sincérité ; une vérification ponctuelle par le parent reste utile.


## NEXT MOVE 4 — Défis chronométrés, récompenses et horaires

### Deux choix indépendants pour chaque mission

Dans **⚙️ Paramètres parentaux > Missions > Modifier** :
- **Organisation** : choisir **À horaire fixe** (affichée avec son heure, rappel-défi, non déplaçable automatiquement, retard au démarrage mesuré), ou **N’importe quand dans la journée** (aucun horaire imposé, aucun retard au démarrage, aucun rappel à heure précise).
- **Limite de temps** : choisir **Avec limite** puis définir la limite maximale en minutes (dépassée = 0 gain, pénalité éventuelle après approbation parentale), ou **Sans limite** (gains progressifs même si la mission prend plus de temps que prévu).
- **Plafonds de gains** : définir **XP MAXIMUM** et **Pièces MAXIMUM** pour chaque mission. Le plafond est absolu, et non la récompense automatiquement gagnée.
- **Durée suggérée** : sert uniquement de valeur initiale pour le chrono que Mahé définit lui-même avant chaque lancement.

Un horaire fixe est un horaire planifié, pris en compte pour les rappels et la mesure de réactivité. Mahé peut commencer en avance ; la mission ne se déplace pas automatiquement. Les tâches libres apparaissent dans une zone dédiée de la journée.

### Récompenses visibles avant de commencer

Avant le démarrage de chaque mission, Mahé choisit son **objectif de temps en minutes**. L'écran calcule instantanément les XP et les pièces pour trois scénarios : fin **dans l'objectif**, **deux fois plus vite** et **deux fois plus lentement**. Le calcul réel est continu : plus c'est rapide, plus les gains sont élevés. Un bonus est accordé pour un objectif respecté et, sur les tâches fixes, un démarrage sans retard. Aucun résultat ne dépasse les plafonds configurés.

Le calcul est enregistré au lancement, avec les plafonds applicables à ce moment-là. L'objectif ne peut pas être changé une fois le chrono lancé.

### Blocs de devoirs sans seuil maximal

**Les blocs de devoirs n'ont aucune limite parentale de durée.** Mahé sélectionne les quantités par date d'échéance, choisit un objectif puis visualise les gains projetés. Même s'il dépasse largement son estimation, un bloc réellement terminé garde des gains réduits.

Dans **⚙️ Paramètres parentaux > Réglages > Gains maximum par devoir** :
- Choisir **XP maximum par devoir terminé** et **Pièces maximum par devoir terminé**.
- Le plafond total du bloc est **nombre de devoirs réellement terminés × plafond par devoir**.
- Pour chaque date de rendu, un bonus de progression dépend **du nombre de jours d'avance** (jusqu'à 14 jours), et se cumule avec l'effet de la vitesse à l'intérieur du plafond.
- Le bonus de volume favorise aussi un bloc regroupant plusieurs devoirs, sans jamais dépasser les plafonds.
- Le chrono continue sans pause ; aucun seuil parental ne peut supprimer les gains des devoirs pour cause de lenteur.

Le nombre de devoirs réellement terminés, déclaré à la fin, est utilisé pour calculer les gains et déduire les devoirs de la liste. Une validation parentale peut être activée pour la mission « Blocs de devoirs ». Les consignes restent dans PRONOTE.

### Pénalités et autonomie

Une pénalité n'est envisageable **que pour une tâche avec limite de temps**, si le parent a activé cette possibilité. Même dans ce cas, elle n'est jamais appliquée automatiquement : elle apparaît à approuver dans le bilan parental. Les tâches et devoirs sans limite ne sont pas pénalisés pour la durée.

### Progression, sauvegardes et réinitialisation

Le profil comporte 27 avatars, 12 cadres, 22 titres, 11 médailles de niveau et des bonus en pièces lors des passages de niveau, sans répétition des bonus déjà obtenus.

Le bouton **Effacer et recommencer**, dans les réglages parentaux, demande le PIN et la saisie « EFFACER ». Il permet d'effacer les progrès en conservant les missions configurées ou de remettre aussi les tâches et paramètres à zéro. Exporter une sauvegarde JSON au préalable est recommandé.

L'application reste **100 % locale**, installable depuis GitHub Pages, sans compte Google ni Firebase, et sans synchronisation entre appareils.
