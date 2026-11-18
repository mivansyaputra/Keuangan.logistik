const CACHE_NAME = 'fenace-v1';
const assets = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => Promise.all(assets.map(a => c.add(a).catch(() => {})))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // Biarkan video intro dan permintaan ke luar domain (pembaca nota) lewat tanpa dicegat
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('.mp4')) return;
  // Online: ambil versi terbaru. Offline: pakai simpanan.
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
