const CACHE = 'equidose-v4.0'
const APP_SHELL = ['./', './index.html', './manifest.json']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('equidose-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put('./index.html', copy))
          return response
        })
        .catch(() =>
          caches.open(CACHE).then(cache =>
            cache.match('./index.html').then(response => response || cache.match('./'))
          )
        )
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
            cache.put(event.request, response.clone())
          }
          return response
        })
      })
    )
  )
})
