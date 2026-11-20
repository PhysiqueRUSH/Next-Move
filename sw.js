/* NEXT MOVE · PWA locale et cache hors ligne. */
const CACHE='next-move-local-v3.1.0';
const ASSETS=['./','./index.html','./styles.css','./ui.css','./homework.css','./progression.css','./app.js','./config.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
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
/* Mode local : aucune notification push programmée lorsque l'application est fermée. */
