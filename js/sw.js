/* Pookie Service Worker */
/* Bump these on each deploy (or replace with your CI build hash) */
const CACHE_VER = 'v3';
const STATIC_CACHE = `pookie-static-${CACHE_VER}`;
const RUNTIME_CACHE = `pookie-runtime-${CACHE_VER}`;

/* Keep this list tiny — just the shell and icons */
const PRECACHE_URLS = [
  '/',                // navigation fallback
  '/index.html',
  '/manifest.json',
  '/main.js',         // include if your app shell needs it
  '/boing.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);
  })());
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
      .map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: 'no-store', credentials: 'include' });
      } catch {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
      }
    })());
    return;
  }

  // Navigations / HTML: network-first (avoid stale app shell)
  const isHTMLNav =
    req.mode === 'navigate' ||
    req.headers.get('Accept')?.includes('text/html') ||
    url.pathname === '/' || url.pathname.endsWith('/index.html');

  if (isHTMLNav) {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const fresh = preload || await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match('/index.html');
        return cached || new Response('<!doctype html><h1>Offline</h1>', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    })());
    return;
  }

  // Static assets: cache-first + background refresh
  if (/\.(?:js|css|png|jpe?g|gif|webp|svg|mp3|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => undefined);
      return cached || fetchPromise;
    })());
    return;
  }

  // Default passthrough
  // (Let the network handle anything else like range requests, etc.)
});

/* ---------- MESSAGES (update flow) ---------- */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------- PUSH NOTIFICATIONS ---------- */
self.addEventListener('push', event => {
  const defaults = {
    title: "Pookie's App",
    body: 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: 'pookie-notification',
    data: { url: '/' }
  };

  let data = defaults;
  if (event.data) {
    try { data = { ...defaults, ...event.data.json() }; }
    catch (e) { /* ignore parse error */ }
  }

  event.waitUntil(self.registration.showNotification(data.title, data));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;

  const target = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clientsList) {
      if ('focus' in c && c.url.includes(self.location.origin)) return c.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
  })());
});

/* ---------- BACKGROUND SYNC (stub) ---------- */
self.addEventListener('sync', event => {
  if (event.tag === 'background-boing-sync') event.waitUntil(syncBoings());
});
async function syncBoings() {
  try {
    // TODO: read offline items from IndexedDB and POST to your API
    // (left as an exercise; your app code should queue actions while offline)
    console.log('Syncing offline boings…');
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}
