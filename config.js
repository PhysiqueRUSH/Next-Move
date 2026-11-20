/* NEXT MOVE · configuration publique uniquement.
   Ne JAMAIS placer de mot de passe, clé privée, ou compte de service ici.
   Les clés Firebase côté client sont publiques ; les autorisations viennent de Firebase Auth et Cloudflare Worker.
*/
globalThis.NEXT_MOVE_CONFIG = {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
    messagingSenderId: ''
  },
  apiUrl: '',
  vapidKey: '',
  pronoteUrl: 'https://www.index-education.com/fr/pronote-info.php'
};