const CACHE_NAME = 'echo-v2'  // ← bump this on every deploy
const STATIC_ASSETS = ['/', '/index.html']

self.addEventListener('install', event => {
  self.skipWaiting()  // ← activate new SW immediately, don't wait
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', event => {
  // ← delete old caches so stale index.html is never served
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // Network-first for HTML so you always get the fresh index.html
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
