// Aumentá este número (v3, v4, etc.) cada vez que subas cambios importantes
const CACHE_NAME = 'compralista-v2'; 

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icono-192.png',
    './icono-512.png'
];

// Instalación: Guardamos la estructura básica
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

// Activación: Limpiamos cachés viejas para liberar espacio
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Escuchar mensaje del botón "Actualizar" del index.html
self.addEventListener('message', (e) => {
    if (e.data && e.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Interceptar peticiones (Estrategia Mixta)
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 1. NETWORK FIRST para datos dinámicos (Ej: Google Apps Script, APIs, JSONs)
    if (url.hostname.includes('script.google.com') || url.pathname.endsWith('.json')) {
        e.respondWith(
            fetch(e.request)
                .catch(() => caches.match(e.request)) // Si no hay internet, intenta mostrar lo último guardado
        );
    } 
    // 2. CACHE FIRST para estructura estática (HTML, CSS, JS, Imágenes)
    else {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                return cachedResponse || fetch(e.request).then((fetchResponse) => {
                    // Validar que la respuesta sea válida y exitosa antes de guardar
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse; 
                    }

                    // Guarda una copia de los archivos nuevos en la caché automáticamente
                    let responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                    
                    return fetchResponse;
                });
            })
        );
    }
});
