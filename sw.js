// Service worker Get a Job: cuma buat nerima notif push. Ga nyimpen cache, ga ngirim data apa pun.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (x) { d = { judul: 'get a job.', isi: e.data ? e.data.text() : '' } }
  e.waitUntil(self.registration.showNotification(d.judul || 'Loker baru di get a job.', {
    body: d.isi || '',
    icon: 'ikon-192.png',
    badge: 'ikon-192.png',
    tag: d.tag || 'loker',
    data: { url: new URL(d.url || '#loker', self.registration.scope).href },
  }).then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true })).then(cs => cs.forEach(c => c.postMessage({ notifMasuk: d.tag || 'loker' }))))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data && e.notification.data.url || self.registration.scope
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.startsWith(self.registration.scope))
    if (w) return w.navigate(url).then(c => (c || w).focus())
    return self.clients.openWindow(url)
  }))
})
