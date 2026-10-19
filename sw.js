// Service Worker – Minha Lista de Compras (Lumanoids)
// Ao alterar qualquer arquivo do app, aumente a versão abaixo.
const VERSAO = 'compras-v5-secoes';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './js/app.js', './js/catalogo.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copia = resp.clone();
      caches.open(VERSAO).then(c => c.put(e.request, copia));
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
