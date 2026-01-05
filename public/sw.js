// Service Worker for PWA - Caches customer dashboard and API responses
const CACHE_NAME = 'loyalty-wallet-v1'
const STATIC_CACHE = 'loyalty-static-v1'
const API_CACHE = 'loyalty-api-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/globals.css',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache install error:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && 
                   name !== STATIC_CACHE && 
                   name !== API_CACHE
          })
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone()
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline fallback
            return new Response(
              JSON.stringify({ error: 'Offline - cached data unavailable' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            )
          })
        })
    )
    return
  }

  // Static assets and pages - Cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but also fetch fresh in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response.clone())
            })
          }
        }).catch(() => {
          // Network failed, that's okay - we have cache
        })
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (response.status !== 200) {
            return response
          }

          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // Network failed and not in cache
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/').then((cachedPage) => {
              return cachedPage || new Response('Offline', {
                headers: { 'Content-Type': 'text/html' },
              })
            })
          }
        })
    })
  )
})

