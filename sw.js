/* Cache da versão 2.0 — nenhum armazenamento de notas é apagado pela atualização. */
const CACHE = 'meu-cantinho-v2-20261117';
const FILES = ['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/perfil.webp','./icons/favicon.svg','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async()=> {const c=await caches.open(CACHE);await c.addAll(FILES.map(p=>new URL(p,self.registration.scope).toString()));await self.skipWaiting();})());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('meu-cantinho-v')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const req=event.request; if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  if(req.mode==='navigate') {event.respondWith((async()=>{try{const r=await fetch(req);if(r.ok){const c=await caches.open(CACHE);await c.put('./index.html',r.clone());}return r;}catch{return await caches.match('./index.html')||Response.error();}})());return;}
  event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const r=await fetch(req);if(r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone());}return r;}catch{return Response.error();}})());
});
