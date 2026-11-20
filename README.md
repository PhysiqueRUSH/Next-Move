# NEXT MOVE ⚡ — Application locale pour Mahé

**NEXT MOVE est une application installable (PWA) pour Android, hébergée sur GitHub Pages, sans Firebase ni Cloudflare.**

## Installation

1. Dans le dépôt GitHub `PhysiqueRUSH/Next-Move`, ouvrir `Settings > Pages`.
2. Activer `Deploy from a branch`, sélectionner `main`, puis `/(root)`, et enregistrer.
3. Sur le Samsung de Mahé, ouvrir `https://physiquerush.github.io/Next-Move/` dans Chrome.
4. Menu Chrome (⋮) > `Installer l'application` ou `Ajouter à l'écran d'accueil` (selon Android).
5. Ouvrir NEXT MOVE, choisir l'onglet **Réglages** ou la roue dentée ⚙️, et **créer son propre code parent à quatre chiffres**.
6. Dans l'espace parent, personnaliser les huit catégories, missions, horaires, périodes, validations et récompenses.

## Fonctionnement

- **Mode enfant** : une mission principale à la fois, double chrono sans pause, XP, pièces, records, trophées, boutique et planning complet.
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
- `styles.css` : interface néon
- `sw.js` : service worker pour cache hors ligne
- `manifest.json` : installation Android
- `icons/` : icônes Android
- `config.js` : URL PRONOTE indicative, optionnelle

Les fichiers historiques sous `cloudflare/` ne sont plus utilisés dans cette version locale.

## Confidentialité

Ne pas ajouter de données privées ni de mots de passe dans le dépôt GitHub public. Les informations personnelles renseignées depuis l'application restent sur le téléphone, sous réserve du fonctionnement habituel du navigateur et d'éventuelles sauvegardes de l'appareil.