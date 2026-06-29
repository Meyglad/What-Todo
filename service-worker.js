const CACHE_NAME = "1.0.17";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",

  "./js/app.js",
  "./js/database.js",
  "./js/modals.js",
  "./js/storage.js",
  "./js/theme.js",
  "./js/tooltip.js",
  "./js/changelog.js",
  "./js/ui.js",

  "./fonts/IRANSansXFaNum-Regular.woff2",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".woff2",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".ico"
];

const NAVIGATION_FALLBACK = "./index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),

      caches.keys().then(keys =>
        Promise.all(
          keys.map(key => {
            if(key !== CACHE_NAME){
              return caches.delete(key);
            }
          })
        )
      )
    ])
  );

});

self.addEventListener("fetch", (event) => {

  if(event.request.method !== "GET"){
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  // Never cache external/API requests (e.g., Supabase endpoints).
  if(!isSameOrigin || requestUrl.pathname.startsWith("/rest/v1/") || requestUrl.pathname.startsWith("/auth/v1/")){
    return;
  }

  const isNavigation = event.request.mode === "navigate";
  const isStaticAsset = STATIC_EXTENSIONS.some(ext => requestUrl.pathname.endsWith(ext));

  if(isNavigation){
    event.respondWith(networkFirst(event.request, NAVIGATION_FALLBACK));
    return;
  }

  if(isStaticAsset){
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));

});

async function cacheFirst(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if(cached){
    return cached;
  }

  const networkResponse = await fetch(request);

  if(networkResponse && networkResponse.ok){
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

async function networkFirst(request, fallbackPath = null){
  const cache = await caches.open(CACHE_NAME);

  try{
    const networkResponse = await fetch(request);

    if(networkResponse && networkResponse.ok){
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  }
  catch(error){
    const cached = await cache.match(request);
    if(cached){
      return cached;
    }

    if(fallbackPath){
      const fallback = await cache.match(fallbackPath);
      if(fallback){
        return fallback;
      }
    }

    throw error;
  }
}

async function staleWhileRevalidate(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if(response && response.ok){
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

self.addEventListener("message", event => {

  if(event.data === "SKIP_WAITING"){
    self.skipWaiting();
  }

});