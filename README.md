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

Les récompenses sont calculées selon le nombre terminé, l'avance sur la date de rendu, le volume du bloc, le respect de l'objectif choisi et **la vitesse réelle d'exécution**. À volume et avance comparables, terminer plus vite rapporte progressivement plus d'XP et de pièces. Un bonus de volume encourage les blocs cohérents plutôt que le découpage artificiel en petites missions. Le barème est éditable dans **Paramètres parentaux > Récompenses des blocs de devoirs**. Les plafonds évitent des gains excessifs. Les dates urgentes sont signalées.

**PRONOTE n'est pas connecté automatiquement** : NEXT MOVE ne voit pas les consignes ni les devoirs exacts. Le compte déclaré par Mahé repose sur sa sincérité ; une vérification ponctuelle par le parent reste utile.


## NEXT MOVE 3 — Objectifs, limite parentale, niveaux et réinitialisation

### Chrono individuel et limite parentale

- Avant **chaque mission ordinaire**, Mahé choisit librement un **objectif de temps** (en minutes). Ce chiffre est mémorisé lors du démarrage et ne peut pas être modifié en cours de mission. Le chrono est sans pause.
- Dans **⚙️ Parent > Missions > Modifier**, le parent choisit une **durée suggérée** et une **limite MAXIMALE** pour chaque mission.
- Pour un bloc de devoirs, Mahé choisit son objectif dans l'écran de composition. Le maximum est égal au nombre de devoirs sélectionnés multiplié par le **maximum par devoir** choisi dans **⚙️ Parent > Réglages > Limites & récompenses**, avec un plafond absolu de 240 minutes.
- **Dans la limite**, les gains augmentent graduellement quand le temps réel diminue, en plus d'un bonus spécifique si Mahé respecte son propre objectif. Les gains des devoirs conservent les bonus volume et anticipation.
- **Au-delà de la limite parentale**, la mission reste terminable, mais ne rapporte aucun XP ni aucune pièce. Le parent peut choisir de faire apparaître une **proposition de pénalité** (au maximum 20 XP et 20 pièces), qui n'est appliquée qu'après sa validation manuelle dans le Bilan parental. Aucun solde ne devient négatif. Le niveau XP peut diminuer lorsqu'une pénalité XP est confirmée.
- Pour les tâches dont la qualité est essentielle, conserver une validation parentale ; le chrono ne certifie pas à lui seul le travail effectué.

### Plus de récompenses de niveau

Le profil comporte désormais **27 avatars**, **12 styles de cadres**, **22 titres**, **11 médailles liées au niveau** et un **bonus en pièces à chaque nouveau niveau** (attribué une seule fois par niveau atteint pour éviter les répétitions). Les catégories sont repliées par défaut pour conserver un écran simple.

### Réinitialiser les données

Dans **⚙️ Parent > Réglages > Réinitialiser NEXT MOVE**, le bouton **Effacer et recommencer** propose :

1. **Remettre à zéro les progrès** : effacer missions réalisées, chronos, devoirs, blocs, récompenses demandées/gagnées, XP, pièces et historique, **tout en conservant la liste des missions programmées et les réglages**.
2. **Tout réinitialiser** : effacer également les tâches programmées et les réglages personnalisés. Les modèles par défaut restent disponibles mais les missions sont vidées pour repartir de zéro.

La réinitialisation demande le **PIN parent à quatre chiffres** et la saisie exacte de **EFFACER**. Il est recommandé d'exporter la sauvegarde avant l'opération. La remise à zéro conserve le PIN parental du téléphone.
