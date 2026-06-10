const CACHE_NAME = "1.0.11";

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
  "./js/ui.js",

  "./fonts/IRANSansXFaNum-Regular.woff2",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

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

  event.respondWith(

    caches.open(CACHE_NAME).then(async cache => {

      const cachedResponse = await cache.match(event.request);

      const networkFetch = fetch(event.request).then(response => {
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(() => cachedResponse);
      
      return cachedResponse || networkFetch;
    })

  );

});

self.addEventListener("message", event => {

  if(event.data === "SKIP_WAITING"){
    self.skipWaiting();
  }

});