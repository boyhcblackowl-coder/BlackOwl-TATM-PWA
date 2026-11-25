const CACHE_NAME='blackowl-pdc-shell-v2';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./offline.html','../icon-192.png','../icon-512.png','../icon-maskable-512.png','../icon-180.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('blackowl-pdc-shell-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(!url.pathname.includes('/people-data-center/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./offline.html'))));return}
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request)))
});