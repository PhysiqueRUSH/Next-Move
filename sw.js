/* NEXT MOVE · Hors ligne + Firebase Cloud Messaging, même SW pour toute la PWA. */
const CACHE='next-move-v1.0.0';
const ASSETS=['./','./index.html','./styles.css','./app.js','./config.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin!==self.location.origin){
  if(url.hostname==='www.gstatic.com'){e.respondWith(caches.open(CACHE).then(async c=>{try{const res=await fetch(e.request);c.put(e.request,res.clone());return res;}catch{return await c.match(e.request)||Response.error();}}));}
  return;
 }
 if(url.pathname.endsWith('/config.js')){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return;}
 e.respondWith(caches.match(e.request).then(cached=>{
  const online=fetch(e.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;}).catch(()=>cached);
  return cached||online;
 }));
});
try{
 importScripts('./config.js');
 const c=self.NEXT_MOVE_CONFIG?.firebase;
 if(c?.apiKey && c?.projectId){
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp(c);
  firebase.messaging().onBackgroundMessage(payload=>{
   const data=payload.data||{};
   self.registration.showNotification(data.title||'NEXT MOVE ⚡',{body:data.body||'Un défi t’attend !',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:'next-move-challenge',data:{url:data.url||'./index.html'},vibrate:[100,60,100]});
  });
 }
}catch(e){console.warn('FCM SW non activé',e);}
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL(event.notification.data?.url||'./index.html',self.location.href).href;
 event.waitUntil((async()=>{const tabs=await clients.matchAll({type:'window',includeUncontrolled:true});const existing=tabs.find(t=>t.url.startsWith(self.registration.scope));if(existing){await existing.focus();if(existing.navigate)await existing.navigate(url);}else await clients.openWindow(url);})());
});