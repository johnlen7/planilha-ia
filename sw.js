const CACHE = 'morfin-cache-v1';
const ASSETS = [
  '/', '/index.html', '/manifest.json'
  // adicione aqui os bundles/arquivos gerados pelo seu build (ex.: /assets/*.js, /assets/*.css)
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=> caches.delete(k)))));
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=> c.put(req, copy));
      return res;
    }).catch(()=> cached))
  );
});
