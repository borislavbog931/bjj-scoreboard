const CACHE = 'bjj-scoreboard-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './fonts/antonio-latin-wght-normal.woff2', './fonts/antonio-latin-ext-wght-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from cache, refresh it in the background (stale-while-revalidate).
// Only successful same-origin responses are stored, so errors and captive-portal pages never stick.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const net = fetch(req).then(res => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
    }
    return res;
  });
  e.respondWith(
    caches.match(req).then(hit => hit || net.catch(() =>
      req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
  e.waitUntil(net.catch(() => {}));
});
