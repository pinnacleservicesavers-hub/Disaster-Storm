// Service Worker for offline-first functionality
const CACHE_NAME = 'disaster-lens-v1';
const STATIC_CACHE_NAME = 'disaster-lens-static-v1';
const API_CACHE_NAME = 'disaster-lens-api-v1';

// Critical routes to cache
const CRITICAL_ROUTES = [
  '/',
  '/disaster-lens',
  '/disaster-lens/capture',
  '/manifest.json'
];

// Static assets to cache
const STATIC_ASSETS = [
  '/src/main.tsx',
  '/src/index.css',
  // Add your built assets here
];

// API endpoints to cache
const CACHEABLE_API_ROUTES = [
  '/api/disaster-lense/projects',
  '/api/disaster-lense/media',
  '/api/disaster-lense/tasks'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    Promise.all([
      // Cache shell and critical routes
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(CRITICAL_ROUTES);
      }),
      
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
    ])
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== CACHE_NAME && 
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== API_CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || 
      request.destination === 'image' || request.destination === 'font') {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Default: try network, fall back to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync for queued actions
self.addEventListener('sync', (event: any) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // For GET requests, try cache first, then network
  if (request.method === 'GET' && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Serve from cache and update in background
      fetch(request).then(response => {
        if (response.ok) {
          const cache = caches.open(API_CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // For mutations when offline, queue for later sync
    if (request.method !== 'GET') {
      await queueOfflineAction(request);
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Action queued for when online' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function handleStaticAsset(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

async function handleNavigation(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('Network failed, serving from cache');
  }
  
  // Serve shell app for client-side routing
  const cache = await caches.open(CACHE_NAME);
  return cache.match('/') || fetch('/');
}

async function queueOfflineAction(request: Request) {
  const actionData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB for persistence
  const db = await openDB();
  const transaction = db.transaction(['offline_actions'], 'readwrite');
  const store = transaction.objectStore('offline_actions');
  await store.add(actionData);
}

async function syncPendingActions() {
  const db = await openDB();
  const transaction = db.transaction(['offline_actions'], 'readwrite');
  const store = transaction.objectStore('offline_actions');
  const actions = await store.getAll();
  
  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      if (response.ok) {
        await store.delete(action.id);
        console.log('Synced offline action:', action.url);
      }
    } catch (error) {
      console.log('Failed to sync action:', action.url, error);
    }
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('disaster-lens-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('offline_actions')) {
        const store = db.createObjectStore('offline_actions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}