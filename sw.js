const CACHE_NAME = "gamemap-shell-v4";

const SHELL = [
    "./",
    "./index.html",
    "./style.css",

    "./themes.js",
    "./services.js",
    "./app.js",
    "./features.js",
    "./pois-native.js",

    "./manifest.json",

    "./icon-192.png",
    "./icon-512.png",

    "./Pricedown.otf",


];


/* =========================================
   INSTALL
   ========================================= */

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(
            (async function () {

                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                /*
                Dosyaları tek tek ekliyoruz.

                Bir dosya bulunamazsa
                bütün Service Worker çökmesin.
                */

                await Promise.all(

                    SHELL.map(
                        async function (path) {

                            try {

                                await cache.add(
                                    path
                                );

                            }

                            catch (error) {

                                console.warn(
                                    "Cache'e eklenemedi:",
                                    path
                                );

                            }

                        }
                    )

                );


                await self.skipWaiting();

            })()
        );

    }
);


/* =========================================
   ACTIVATE
   ========================================= */

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(
            (async function () {

                const keys =
                    await caches.keys();


                await Promise.all(

                    keys
                        .filter(
                            function (key) {

                                return (
                                    key.startsWith(
                                        "gamemap-shell-"
                                    ) &&
                                    key !== CACHE_NAME
                                );

                            }
                        )
                        .map(
                            function (key) {

                                return caches.delete(
                                    key
                                );

                            }
                        )

                );


                await self.clients.claim();

            })()
        );

    }
);


/* =========================================
   FETCH
   ========================================= */

self.addEventListener(
    "fetch",
    function (event) {

        if (
            event.request.method !==
            "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        const isShell =
            url.origin ===
                self.location.origin &&

            SHELL.some(
                function (path) {

                    return (
                        new URL(
                            path,
                            self.registration.scope
                        ).pathname ===
                        url.pathname
                    );

                }
            );


        /*
        Harita tile,
        arama,
        rota vb.
        cache'e girmez.
        */

        if (!isShell) {
            return;
        }


        event.respondWith(
            (async function () {

                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                /*
                Önce internetten güncel dosyayı al.

                Böylece geliştirme sırasında
                eski app.js / style.css
                sorunu yaşamayız.
                */

                try {

                    const response =
                        await fetch(
                            event.request
                        );


                    if (
                        response.ok ||
                        response.type ===
                            "opaque"
                    ) {

                        await cache.put(
                            event.request,
                            response.clone()
                        );

                    }


                    return response;

                }

                catch (error) {

                    /*
                    İnternet yoksa
                    cache'deki dosyaya dön.
                    */

                    const cached =
                        await cache.match(
                            event.request
                        );


                    if (cached) {
                        return cached;
                    }


                    throw error;

                }

            })()
        );

    }
);