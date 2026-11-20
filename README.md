# NEXT MOVE ⚡ — Application d'autonomie, défis et récompenses

**Projet :** PWA installable sur Android, écran enfant + interface parent, identité futuriste néon.

## Ce que contient l'archive

```text
Next-Move/
├── index.html           Interface installable
├── app.js               Missions, chronos, planification, statistiques, récompenses
├── styles.css           Design futuriste néon / mobile
├── manifest.json        Paramètres PWA Android
├── sw.js                Cache hors ligne et réception push en arrière-plan
├── config.js            Configuration PUBLIQUE à compléter
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── cloudflare/
    ├── worker.js         API sécurisée, comptes, validations et notifications
    ├── schema.sql        Base de données D1
    └── wrangler.toml     Configuration optionnelle pour déploiement CLI
```

**État de livraison :** code source prêt à déployer, démonstration locale utilisable immédiatement. La connexion parent/enfant, la synchronisation multi-appareils et les push ne peuvent fonctionner tant que les comptes gratuits ne sont pas paramétrés. Ces fonctions doivent être vérifiées sur les deux téléphones après déploiement. Ne pas présenter la version hébergée comme sécurisée tant que les secrets, le Worker et les droits d'accès ne sont pas configurés.

## Étape 1 — Nouveau dépôt GitHub (gratuit)

1. Ouvrir https://github.com/new en étant connecté au compte **PhysiqueRUSH**.
2. Repository name : **Next-Move**.
3. Visibilité : **Public** (nécessaire pour GitHub Pages gratuit sur un compte personnel standard). N'y mettre **aucune donnée privée**.
4. Créer le dépôt, puis utiliser **Add file → Upload files** pour importer le contenu décompressé de cette archive, en conservant les dossiers `icons` et `cloudflare`.
5. Dans **Settings → Pages**, choisir **Deploy from a branch → main → /(root)**, puis enregistrer.
6. L'URL attendue sera `https://physiquerush.github.io/Next-Move/`.
7. À ce stade, la démonstration fonctionne, mais **les données sont uniquement locales**. Ne pas encore demander à Mahé de l'utiliser pour le vrai suivi.

### Attention

Ne pas mettre dans GitHub : mots de passe, adresse e-mail privée administrateur si possible, comptes de service Firebase, JSON contenant `private_key`, clés secrètes Cloudflare, photos ou données personnelles de Mahé.

## Étape 2 — Firebase Spark (sans facturation)

1. Aller sur https://console.firebase.google.com et créer un projet `next-move` (ou nom disponible). **Garder Spark : ne pas activer Blaze.**
2. Dans **Authentication → Sign-in method**, activer **Google** et **Anonymous**. Choisir l'e-mail de support Firebase demandé dans la console.
3. Dans **Authentication → Settings → Authorized domains**, ajouter `physiquerush.github.io`.
4. Dans la vue générale du projet, cliquer sur l'icône **Web** `</>` et ajouter une application Web. Copier les valeurs **publiques** : `apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId`. Elles seront utilisées dans `config.js`.
5. Dans **Project settings → Cloud Messaging → Web Push certificates**, générer une paire de clés Web Push et copier **la clé publique VAPID** dans `config.js` (champ `vapidKey`).
6. Dans **Project settings → Service accounts**, générer une **clé privée de compte de service**. **Ne jamais la copier sur GitHub**. Son contenu JSON sera ajouté uniquement comme **secret Cloudflare** à l'étape 3. Conserver ce fichier en lieu sûr, puis supprimer les copies inutiles.
7. Dans le projet Google/Firebase, vérifier que l'API **Firebase Cloud Messaging API (HTTP v1)** est activée, ainsi que les fonctions Firebase Auth nécessaires.

**À quoi sert Firebase ?** Identifiants Google du parent, identité anonyme persistante de l'enfant, tokens et acheminement FCM. Les données de tâches sont conservées dans Cloudflare D1, pas dans Firestore. Les plans de rattrapage peuvent être enregistrés quand le niveau d’autonomie le permet.

## Étape 3 — Cloudflare Workers + D1 Free

1. Ouvrir https://dash.cloudflare.com et créer un compte gratuit.
2. Dans **Storage & databases → D1**, créer une base nommée `next-move`.
3. Ouvrir cette base → **Console**, copier/coller le contenu de `cloudflare/schema.sql` pour créer les tables.
4. Dans **Workers & Pages**, créer un Worker nommé `next-move-api`, puis déployer.
5. Ouvrir **Edit code**, remplacer son code par tout le contenu de `cloudflare/worker.js` et déployer.
6. Dans **Settings → Bindings**, ajouter une liaison **D1 database** avec : **Variable name `DB`**, database `next-move`.
7. Dans **Settings → Variables and Secrets**, ajouter les **variables publiques du Worker** :
   - `FIREBASE_PROJECT_ID` : l'ID précis du projet Firebase.
   - `APP_ORIGIN` : `https://physiquerush.github.io` (sans slash final).
   - `APP_URL` : `https://physiquerush.github.io/Next-Move/`.
8. Dans la même section, ajouter **deux SECRETS (Encrypted)** :
   - `PARENT_EMAIL` : l'adresse Google du seul parent autorisé, en minuscules.
   - `FCM_SERVICE_ACCOUNT_JSON` : le **contenu intégral** du fichier JSON de compte de service Firebase. **Ne pas le placer en variable non chiffrée**.
9. Dans **Settings → Triggers → Cron Triggers**, ajouter `* * * * *` (chaque minute, horaire UTC interne). Le Worker recalcule l'heure locale de Paris et ne notifie qu'une fois par mission.
10. Copier l'URL du Worker, par exemple `https://next-move-api.xxxxx.workers.dev`. Tester `/health` : l'API doit répondre `{"ok":true,...}`.

Les intitulés des menus Cloudflare peuvent évoluer. `cloudflare/wrangler.toml` fournit une alternative via l'outil Wrangler, mais une installation via le tableau de bord est possible.

**Limites :** offres gratuites soumises à quotas ; fréquence minute de Cron ; notifications non garanties à la seconde près ; 10 ms de CPU par exécution Cron sur Workers Free selon la documentation actuelle. L'envoi des notifications doit être testé en pratique. Si la limite CPU gêne la génération du jeton OAuth/FCM, le système peut demander un ajustement de conception tout en restant gratuit. Aucune carte bancaire n'est censée être nécessaire pour ce montage.

## Étape 4 — Connecter l'application

Éditer le fichier **public** `config.js` dans GitHub :

```js
globalThis.NEXT_MOVE_CONFIG = {
  firebase: {
    apiKey: 'VALEUR_FIREBASE',
    authDomain: 'VALEUR_FIREBASE',
    projectId: 'VALEUR_FIREBASE',
    appId: 'VALEUR_FIREBASE',
    messagingSenderId: 'VALEUR_FIREBASE'
  },
  apiUrl: 'https://next-move-api.xxxxx.workers.dev',
  vapidKey: 'CLE_PUBLIQUE_VAPID',
  pronoteUrl: 'https://ADRESSE_PRONOTE_DU_COLLEGE'
};
```

Les valeurs Firebase **Web SDK** et la clé **VAPID publique** sont faites pour être présentes côté client. **Aucune clé privée ou de compte de service.**

Après enregistrement, actualiser NEXT MOVE sur le téléphone. Si la version hors ligne persiste, fermer puis rouvrir l'application ou vider le cache du site (sans effacer les données avant la connexion).

## Étape 5 — Première connexion du parent

1. Ouvrir NEXT MOVE dans Chrome Android.
2. Choisir **Je suis le parent → Me connecter avec Google**.
3. Utiliser **exactement** le compte Google défini dans le secret `PARENT_EMAIL`.
4. Définir un **PIN local à quatre chiffres**. Il s'agit d'un verrou d'interface supplémentaire. **La véritable autorisation parentale est le compte Google vérifié côté serveur.**
5. NEXT MOVE installe un catalogue initial de tâches **désactivées**, afin d'éviter des rappels à de mauvais horaires. Aller dans **Missions**, corriger les durées, les jours, les horaires, les validations, puis activer chaque mission pertinente.
6. Dans **Planning**, créer les vacances et périodes particulières ; vérifier les plages de silence.
7. Dans **Boutique**, adapter les récompenses et les coûts en pièces.
8. Dans **Réglages**, vérifier l'URL PRONOTE du collège et le prénom.

## Étape 6 — Jumeler le Samsung de Mahé

1. Sur ton téléphone, dans **Réglages → Jumeler**, appuyer sur **Générer un code**.
2. Sur le Samsung de Mahé, ouvrir `https://physiquerush.github.io/Next-Move/` dans Chrome, puis **Ajouter à l'écran d'accueil / Installer l'application**.
3. Dans NEXT MOVE, saisir le code temporaire. Ne pas donner les identifiants Google du parent à Mahé.
4. Dans **Profil**, appuyer sur **Activer les notifications-défis** et autoriser les notifications Android/Chrome. Vérifier Family Link (autorisation de Chrome, notifications, restrictions de temps d'écran).
5. Tester d'abord une mission programmée quelques minutes plus tard, puis verrouiller le Samsung. Confirmer la réception avant d'activer tous les rappels.

## Fonctionnement de la sécurité

- Le dépôt GitHub public ne contient que des fichiers statiques et des clés Firebase Web publiques.
- Chaque requête à l'API Cloudflare inclut un **ID token Firebase** vérifié cryptographiquement (signature, audience, émetteur, date d'expiration).
- Seul l'UID Google correspondant au secret `PARENT_EMAIL` est administrateur.
- Le Samsung de Mahé utilise un compte **Firebase Anonymous** lié au parent par code aléatoire temporaire.
- Les XP, pièces et pénalités sont accordés côté serveur, jamais à partir d'un simple total modifiable côté navigateur.
- Les missions de devoirs ajoutées par Mahé nécessitent une validation parentale avant attribution des points.
- Les pénalités sont déclenchées **uniquement** par une action du parent.
- Les tâches faites hors ligne sont soumises à approbation parentale pour éviter des récompenses automatiques basées sur l'horloge locale.
- Le PIN à 4 chiffres protège uniquement l'interface sur un appareil déjà connecté au compte parental. Il ne remplace ni Google ni les contrôles serveur.

## Fonctions incluses

| Fonction | Etat |
|---|---|
| PWA installable, 2 icônes, cache hors ligne | Incluse |
| Écran « mission principale » + chrono sans pause | Incluse |
| Mesure du retard au départ et du temps de réalisation | Incluse |
| Calendrier école, week-end, vacances, exceptions et report des missions | Inclus |
| Éditeur complet de tâches, catégories, barèmes et récurrences | Inclus |
| Validation mixte, bonus rapidité + autonomie | Inclus |
| XP/niveaux, pièces, records, trophées et sons | Inclus |
| Boutique et validations parentales | Inclus |
| Dashboard avec statistiques hebdomadaires | Inclus |
| PRONOTE : accès et saisie guidée par matière | Inclus (pas de récupération automatique) |
| Synchronisation familiale | Prévue par Worker, nécessite configuration |
| Push en arrière-plan, une fois par mission | Prévue par Worker/FCM, nécessite configuration et test Android |
| Défis parentaux et automatiques | Inclus ; attribution des défis parentaux après confirmation manuelle |
| Organisation intelligente | Suggestions de rattrapage ; application enregistrable à partir du palier semi-autonome, avec contraintes fixes protégées |
| Progression d'autonomie | Indicateurs + proposition de palier, validation parentale |

## Dépannage

- **Toujours en démonstration :** vérifier que `config.js` contient tous les champs Firebase et `apiUrl`.
- **Google non autorisé :** vérifier `PARENT_EMAIL`, le fournisseur Google dans Firebase Authentication et les domaines autorisés.
- **Erreur de données :** vérifier le binding Cloudflare `DB`, les tables SQL, `FIREBASE_PROJECT_ID` et `APP_ORIGIN`.
- **Mahé ne se jumelle pas :** utiliser un nouveau code et confirmer qu'il est saisi dans les 10 minutes.
- **Pas de push :** vérifier clé VAPID publique, autorisation Chrome, Google FCM API (v1), secrets Worker, Cron et notifications de Family Link.
- **PNGs :** garder les deux tailles `192` et `512`, y compris dans le manifeste.

## Sources officielles utiles

- Firebase Web Push : https://firebase.google.com/docs/cloud-messaging/web/get-started
- Firebase Web background : https://firebase.google.com/docs/cloud-messaging/web/receive-messages
- Tarifs Firebase : https://firebase.google.com/pricing
- Cloudflare Cron : https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare Workers limites : https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 : https://developers.cloudflare.com/d1/
- GitHub Pages : https://docs.github.com/en/pages

---

**Important :** Le code fournit une base ambitieuse, mais une application destinée à guider un enfant doit être **testée en conditions réelles**. En particulier : performances sur son ancien Samsung, messages pendant le verrouillage, Family Link, changements d'heure, synchronisation hors ligne et comportements de validation. Le caractère gratuit est soumis au respect des quotas des offres actuelles.