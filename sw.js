/**
 * Service Worker: permite abrir o sistema sem internet.
 * Ao alterar qualquer arquivo do app, aumente VERSAO para forçar a atualização.
 *
 * Importante: só arquivos do próprio site (GET) passam por aqui.
 * O envio para a planilha (POST ao Google) NUNCA é interceptado nem guardado em cache.
 */
const VERSAO = 'npc-limpeza-v2.1.0';
const ARQUIVOS = [
    './',
    './index.html',
    './style.css',
    './assets/tailwind.css',
    './config.js',
    './js/nucleo.js',
    './js/envio.js',
    './script.js',
    './manifest.webmanifest',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches
            .open(VERSAO)
            .then((cache) => cache.addAll(ARQUIVOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches
            .keys()
            .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
            .then(() => self.clients.claim())
    );
});

// Rede primeiro (sempre pega a versão mais nova); sem internet, usa o cache.
self.addEventListener('fetch', (evento) => {
    const req = evento.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    evento.respondWith(
        fetch(req)
            .then((resposta) => {
                if (resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(VERSAO).then((cache) => cache.put(req, copia));
                }
                return resposta;
            })
            .catch(() =>
                caches
                    .match(req, { ignoreSearch: true })
                    .then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
            )
    );
});
