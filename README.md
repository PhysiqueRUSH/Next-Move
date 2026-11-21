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

### Récompenses lisibles et réellement atteignables

Pour chaque mission, le maximum d'XP et de pièces est un montant **atteignable** :
- Le parent définit le **plafond XP** et le **plafond pièces**, et une **durée suggérée** (référence de rapidité).
- Pour obtenir toute la part de rapidité, terminer en **au plus la moitié de cette durée suggérée**. Faire encore plus vite ne dépasse jamais le plafond.
- Mahé fixe un objectif personnel avant le démarrage. Pour toucher le maximum, il faut **à la fois** finir dans cet objectif et atteindre le seuil de rapidité. Le délai nécessaire au maximum est donc le plus petit de ces deux temps.
- Les tâches libres n'ont aucun retard au démarrage. Les tâches fixes réservent 10 % du barème à un départ à l'heure (dans la minute planifiée, tolérance inférieure à 60 secondes). Si Mahé démarre en retard, l'écran affiche le maximum **réellement accessible aujourd'hui**, inférieur au plafond théorique, et explique pourquoi.
- Les gains suivent désormais une échelle bornée : **25 % pour la réalisation**, **55 % pour la rapidité**, **10 % pour l'objectif tenu**, **10 % pour la ponctualité** (automatiquement accordée aux tâches libres). Si une tâche avec limite dépasse la durée maximale, elle rapporte zéro, avec pénalité éventuelle seulement après décision parentale.

**Exemple « Habillage + dents » :** durée suggérée 18 min, objectif choisi 5 min, plafond parental 40 XP / 15 pièces. S'il commence à l'heure et termine en 5 min ou moins, il obtient exactement **40 XP et 15 pièces**. S'il commence en retard, le même chrono rapporte au maximum **36 XP et 14 pièces** : le bonus de ponctualité est perdu. Ce maximum du jour est affiché sur l'écran de lancement et l'accueil.

L'écran de lancement indique en priorité **« Comment gagner le maximum »**, les montants exacts et la durée requise. Il ne montre des scénarios alternatifs que s'ils apportent une information différente. Le barème et les plafonds sont enregistrés au départ de la mission : un changement ultérieur des paramètres ne modifie pas les gains en cours.

### Blocs de devoirs sans seuil maximal

**Les blocs de devoirs n'ont aucune limite parentale de durée.** Mahé sélectionne les quantités par date d'échéance, choisit un objectif puis visualise les gains projetés. Même s'il dépasse largement son estimation, un bloc réellement terminé garde des gains réduits.

Dans **⚙️ Paramètres parentaux > Réglages > Gains maximum par devoir** :
- Choisir **XP maximum par devoir terminé** et **Pièces maximum par devoir terminé**.
- Le plafond total du bloc est **nombre de devoirs réellement terminés × plafond par devoir**. Pour éviter d'annoncer un plafond inatteignable, l'écran indique également le **maximum réellement possible avec les dates choisies**, atteint à la moitié du temps estimé ou moins. La bonification liée à chaque échéance peut rendre le gain réel inférieur au plafond théorique, ce qui est indiqué séparément.
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

## NEXT MOVE 4.3 — Validation parentale et boutique simplifiée

### Arrêt immédiat du chrono et validation parentale

- Pour **toutes les missions dont une limite de temps est activée**, Mahé appuie sur **J’ai terminé**. Le chrono est arrêté **immédiatement**, l'heure de fin et la durée réelle sont enregistrées, et le résultat prend le statut **En attente du parent**. Aucun temps supplémentaire n'est ajouté pendant cette attente, même si l'application est fermée.
- La carte principale affiche alors le chrono **figé**, les gains **en attente** et le bouton **🔐 Faire valider par un parent**.
- Le parent vérifie physiquement que la mission est terminée, saisit **son PIN de quatre chiffres pour chaque validation** et choisit **Valider** ou **Refuser**. Même si l'espace parent est déjà ouvert, une nouvelle saisie est nécessaire. Un refus ne crédite aucun gain.
- Le bilan parental permet de retrouver les validations encore en attente. Les gains sont crédités **une seule fois**, après approbation, jamais à l'arrêt du chrono.
- Si la durée maximale est dépassée, les gains sont **nuls**. Le parent voit la proposition de malus prévue dans les réglages (par défaut 5 XP disponibles et 3 pièces) et choisit de l'appliquer ou non au moment de la validation. Il n'y a **jamais de pénalité automatique**.
- Pour les missions sans limite, l'ancienne option d'autovalidation ou de validation parentale reste configurable. Les blocs de devoirs restent sans plafond de temps, avec validation parentale facultative.
- Les exemples de gains « deux fois plus lentement » ont été retirés des écrans de préparation : Mahé voit uniquement son objectif et, si elle est différente, la récompense liée à une réalisation plus rapide.

### Deux récompenses distinctes, sans échange

Les **XP** servent à progresser dans les niveaux et à débloquer les titres et trophées. Les **pièces** sont gagnées directement par la réalisation des missions et permettent de demander des cadeaux. **Aucune conversion d'XP en pièces n'est possible**, ni depuis la boutique ni depuis les paramètres parentaux. Les gains acquis précédemment restent conservés.

### Sécurité et limites

Le PIN local verrouille les validations **dans l'interface**, mais une PWA hébergée sur GitHub Pages ne peut pas empêcher un utilisateur techniquement compétent de modifier le stockage de son propre appareil. Le contrôle parental reste une **vérification réelle de la tâche**, et le PIN n'est **pas une authentification serveur inviolable**. Pour de véritables protections anti-manipulation, une synchronisation et des règles de validation côté serveur seront nécessaires.

En mode local, la version installée sur Android conserve les données dans le stockage du navigateur et peut être utilisée sans Firebase.

## NEXT MOVE 4.3 — Suppression de la conversion XP → pièces

- L'onglet **Cadeaux** présente seulement les pièces déjà gagnées, les cadeaux disponibles et les demandes en cours.
- Le taux de conversion a été retiré des paramètres parentaux ; l'action d'échange est désactivée dans le moteur de l'application.
- Les XP et pièces déjà gagnés ne sont pas modifiés, les niveaux et trophées sont conservés. Les anciennes conversions déjà effectuées ne sont pas annulées, mais aucun nouvel échange n'est possible.

## NEXT MOVE 4.4 — Défi chrono sans encadré « Maximum aujourd'hui »

L'écran de lancement de mission a été simplifié : **l'encadré « Ton maximum aujourd'hui » a été entièrement supprimé**. Trois lignes compactes apparaissent pour les missions à durée limitée : **dans l'objectif choisi**, **deux fois plus vite**, et **au-delà de la limite parentale (0 XP / 0 pièce)**. Les tâches sans limite n'ont pas de scénario de dépassement.

Pour les missions à heure fixe, si le démarrage peut encore bénéficier de la ponctualité, chaque scénario affiche distinctement **les XP et les pièces de ponctualité compris dans le total** (calculés à partir de la différence avec le même scénario sans ponctualité). Si l'horaire prévu est dépassé, un message court indique **l'heure prévue et l'absence du bonus**, sans autre encadré ni plafond de gains théorique.

Les prévisions sont recalculées immédiatement lorsque Mahé modifie son objectif avec +, − ou au clavier, et rafraîchies lorsque l'heure courante change de minute pendant que la fenêtre est ouverte. Les calculs de gains réels et les plafonds parentaux restent inchangés ; il s'agit d'une simplification de la présentation uniquement.


## NEXT MOVE 4.5 — Tâches spontanées et défis de régularité

### Transformer une mission en tâche spontanée

Dans **Paramètres parentaux > Missions > Modifier**, sélectionner **Type de mission > Tâche spontanée**. Les champs de durée suggérée, chrono, temps limite, horaire fixe, échéance et notification disparaissent : une tâche spontanée se fait **n'importe quand**, plusieurs fois de suite ou à différents moments de la journée, **sans chrono ni bonus de rapidité**. Les jours de disponibilité et les modes (école, week-end, vacances) restent personnalisables.

Le parent règle **les XP et les pièces gagnés à chaque réalisation** (suggestion initiale lors du changement de type : **8 XP + 2 pièces**, entièrement modifiable) et choisit **Autovalidation** ou **Validation parentale avec PIN**. Pour décourager une accumulation injustifiée, la validation parentale est proposée par défaut lorsqu'une mission devient spontanée. La valeur choisie est identique pour chaque réalisation : aucun seuil quotidien, ni limite de nombre, ni délai obligatoire entre deux réalisations.

### Écran de Mahé

Sur **Mission** et **Journée**, la zone **✨ Missions spontanées** affiche chaque tâche disponible, le nombre de fois où elle a été accomplie aujourd'hui, ses XP/pièces par réalisation et un grand bouton **✓ FAIT !**. Chaque appui enregistre **une réalisation distincte**. Aucun écran de choix de minutes ne s'ouvre.

Les tâches spontanées sont séparées de la mission principale, ne bloquent pas le planning et ne sont pas signalées comme « en retard ». Si la validation parentale est activée, les points de cette réalisation restent en attente jusqu'à approbation avec le PIN. Un double clic pendant un enregistrement ne crée pas de réalisation supplémentaire.

### Défis automatiques dans « 🏆 Défis »

Quatre défis initiaux, **répétables à chaque nouvelle période ou série**, sont proposés :

| Défi | Objectif initial | Bonus initial |
| --- | --- | --- |
| ⚡ Triple action | 3 réalisations dans la journée | 15 XP + 5 pièces |
| 🎮 Dix actions | 10 réalisations dans la semaine (lundi à dimanche) | 45 XP + 15 pièces |
| 🔥 Trois jours d'affilée | Au moins 1 réalisation par jour pendant 3 jours consécutifs | 30 XP + 10 pièces |
| 🏆 Une semaine régulière | Au moins 1 réalisation par jour pendant 7 jours consécutifs | 100 XP + 30 pièces |

Les **objectifs, XP, pièces et activation** de chaque défi sont modifiables sous **Paramètres parentaux > Réglages > Défis de fréquence et de régularité**. Un défi est validé **une seule fois par journée, semaine ou série continue**, même lorsque Mahé réalise davantage de tâches. Les missions en attente/refusées ne comptent pas ; seuls les accomplissements effectivement validés déclenchent les bonus. Les gains peuvent également débloquer des niveaux.

Le bilan parental affiche les demandes de validation correspondantes, sans indiquer un chrono inexistant. L'historique de ces défis est inclus dans les sauvegardes JSON et effacé lors d'une remise à zéro des progrès, tout en conservant les réglages si le parent le souhaite.
