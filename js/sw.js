const CACHE_NAME = 'pookie-app-v' + new Date().getTime(); // Dynamic versioning
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/gallery.html',
  '/history.html',
  '/boing.mp3',
  '/manifest.json',
  // Add your CSS files if separate
  // Add icon files
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache install failed:', err);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  console.log('Push received:', event);
  
  const defaultOptions = {
    title: 'Pookie\'s App',
    body: 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false, // Don't force user interaction
    tag: 'pookie-notification'
  };
  
  let notificationData = defaultOptions;
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...defaultOptions, ...pushData };
    } catch (e) {
      console.error('Failed to parse push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});


// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Default action or 'explore' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-boing-sync') {
    event.waitUntil(syncBoings());
  }
});

async function syncBoings() {
  // This would sync any offline boings when connection is restored
  try {
    // Get offline boings from IndexedDB and sync to server
    console.log('Syncing offline boings...');
    // Implementation depends on your offline storage strategy
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
