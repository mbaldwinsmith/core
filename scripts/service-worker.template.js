// Generated at build time. Paths and cache names stay within this installation's scope.
const VERSION = __VERSION__;
const SCOPE_KEY = __SCOPE_KEY__;
const PRECACHE = __PRECACHE__;
const PREFIX = `core-${SCOPE_KEY}-`;
const CACHE = `${PREFIX}${VERSION}`;
const ROOT = new URL(self.registration.scope);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // A failed resource fails installation: never announce an incomplete offline course.
    try { await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))); }
    catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request, requestURL = new URL(request.url);
  if (request.method !== 'GET' || requestURL.origin !== ROOT.origin || !requestURL.pathname.startsWith(ROOT.pathname) || requestURL.pathname === `${ROOT.pathname}sw.js`) return;
  const key = new URL(requestURL); key.search = ''; key.hash = '';
  if (key.pathname.endsWith('/')) key.pathname += 'index.html';
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Serve a coherent installed edition. New code and pages arrive together through a new cache.
    const cached = await cache.match(key.href);
    if (cached) return cached;
    try { return await fetch(request); }
    catch {
      if (request.mode === 'navigate') return (await cache.match(new URL('offline.html', ROOT).href)) || Response.error();
      return Response.error();
    }
  })());
});
