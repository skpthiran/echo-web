const CACHE_NAME = 'echo-v1'
const STATIC_ASSETS = ['/', '/index.html']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', event => {
  // Only handle same-origin requests. Let all cross-origin requests
  // (fonts, APIs, Supabase, Groq) pass through untouched.
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
