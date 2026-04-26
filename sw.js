/* ═══════════════════════════════════════════════════════
   sw.js  —  TechCalc Pro Service Worker
   DEPLOYMENT: bash deploy.sh (stampt 20260426-1440 automatisch)
═══════════════════════════════════════════════════════ */
'use strict';

const BUILD_TS   = '20260426-1440';
const CACHE_NAME = `techcalc-20260426-1629`;

const PRECACHE = [
  './', './index.html',
  './tokens.css', './layout.css', './components.css', './styles.css',
  './app.js', './heating-cooling.js', './ventilation.js',
  './wrg-mischluft.js', './pdf-export.js', './hx-engine.js',
  './manifest.json', './favicon.ico',
  './icon-192.png', './icon-512.png', './icon-180.png',
  './icon-167.png', './icon-152.png',
];
const BYPASS = ['workers.dev','analytics','cloudflare'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE).catch(()=>{})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const {request:r} = e;
  if (r.method!=='GET') return;
  const u = new URL(r.url);
  if (BYPASS.some(b=>u.hostname.includes(b))) return;
  if (!u.protocol.startsWith('http')) return;
  if (u.origin!==self.location.origin) return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME), cached=await cache.match(r);
    const net=fetch(r).then(resp=>{if(resp&&resp.status===200&&resp.type!=='opaque')cache.put(r,resp.clone());return resp;}).catch(()=>null);
    if(cached) return cached;
    const n=await net; if(n) return n;
    if(r.mode==='navigate') return cache.match('./index.html');
    return new Response('',{status:408});
  })());
});
self.addEventListener('message', e => { if(e.data==='SKIP_WAITING') self.skipWaiting(); });
