const CACHE_NAME = "elaine-shadowing-studio-v15";

const APP_SHELL = [
  "./",
  "index.html",
  "styles.css?v=15",
  "app.js?v=15",
  "manifest.webmanifest",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/icon-192.svg",
  "assets/icons/icon-512.svg",
  "courses/catalog.json",
  "courses/twilight-chapter-01/course.json",
  "courses/twilight-chapter-02/course.json",
  "courses/voa/course.json",
  "courses/friends/course.json",
  "courses/ted/course.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("index.html"));
    })
  );
});
