const CACHE_NAME = 'decisionos-v2'
const urlsToCache = [
  '/',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // CRITICAL: Never intercept navigation requests (page loads, redirects)
  // This prevents "Response served by service worker has redirections" errors
  if (request.mode === 'navigate') {
    // Let navigation requests pass through without service worker interception
    return
  }
  
  // Don't cache auth routes or API routes
  const url = new URL(request.url)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/signin') ||
    url.pathname.startsWith('/signup') ||
    url.pathname.startsWith('/forgot-password') ||
    url.pathname.startsWith('/app/')
  ) {
    // Let these requests pass through without caching
    return
  }
  
  // Only cache static assets (images, fonts, etc.)
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          // Cache successful responses
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return fetchResponse
        })
      })
    )
  } else {
    // For all other requests, just fetch without caching
    return
  }
})


