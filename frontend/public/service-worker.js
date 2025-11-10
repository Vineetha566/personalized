self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url
  if (url.endsWith('.mp3')) {
    event.respondWith((async () => {
      const cache = await caches.open('podcast-audio-cache-v1')
      const cached = await cache.match(event.request)
      if (cached) return cached
      const res = await fetch(event.request)
      cache.put(event.request, res.clone())
      return res
    })())
  }
})


