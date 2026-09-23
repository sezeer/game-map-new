const CACHE_NAME = "gamemap-shell-v5";
const SHELL = ["./", "./index.html", "./app.js", "./features.js", "./style.css", "./manifest.json", "./icon-192.png", "./icon-512.png", "./waypoint.gif",] ;
self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
        await cache.addAll(SHELL);
    }));
});
self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith("gamemap-shell-") && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    const isShell = url.origin === self.location.origin && SHELL.some(path => new URL(path, self.registration.scope).pathname === url.pathname);
    // Search, routes and map tiles stay online. Only the application shell is cached.
    if (!isShell) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok || response.type === "opaque") await cache.put(event.request, response.clone());
        return response;
    })());
});
