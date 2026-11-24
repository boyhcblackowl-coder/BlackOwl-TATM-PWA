(function serviceWorker() {
 const KEY="bo-tatm-pwa-v7-banner-cleanup";
 const ASSETS=["./","./index.html","./styles.css","./app.js","./config.js","./dashboard-live.js","./weekly-mom.js","./manifest.webmanifest","./icon-64.png","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./offline.html","./install-check.html"];
 self.addEventListener("install",e=>{e.waitUntil(caches.open(KEY).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
 self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("bo-tatm-")&&k!==KEY).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
 self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(r.mode==="navigate"){e.respondWith(fetch(r,{cache:"no-store"}).then(v=>{if(v.ok){const copy=v.clone();caches.open(KEY).then(c=>c.put(r,copy));}return v;}).catch(()=>caches.match(r).then(v=>v||caches.match("./index.html"))));return;}
  if(/(?:app\.js|dashboard-live\.js|weekly-mom\.js|config\.js|styles\.css|service-worker\.js)$/.test(u.pathname)){e.respondWith(fetch(r,{cache:"no-store"}).then(v=>{if(v.ok){const copy=v.clone();caches.open(KEY).then(c=>c.put(r,copy));}return v;}).catch(()=>caches.match(r)));return;}
  e.respondWith(caches.match(r).then(v=>v||fetch(r)));
 });
})();
