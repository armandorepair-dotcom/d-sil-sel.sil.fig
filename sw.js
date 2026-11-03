const CACHE = 'silabas-pwa-v1';
const LOCAL = ['./', 'index.html', 'actividad1.html', 'actividad2.html', 'actividad3.html',
  'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
// Recursos externos de la actividad 1 (se guardan para uso sin internet)
const CDN = ['https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(LOCAL);
    await Promise.all(CDN.map(u => c.add(new Request(u, { mode: 'no-cors' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // ignorar ?v=... de las actividades al buscar en caché
    const hit = await c.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()).catch(() => {});
      return r;
    });
    if (hit) { red.catch(() => {}); return hit; }
    try { return await red; } catch (_) {
      return (await c.match('index.html')) || new Response('Sin conexión', { status: 503 });
    }
  })());
});
