const APP_VERSION =
    "0.5.3";


const CACHE_NAME =
    "gamemap-shell-" +
    APP_VERSION;


const SHELL = [

    "./",

    "./index.html",

    "./style.css",

    "./services.js",

    "./app.js",

    "./features.js",

    "./manifest.json",

    "./icon-192.png",

    "./icon-512.png" ,

    "./pois-native.js" ,
    
    "./poi-icons/market.png",
    
    "./poi-icons/gym.png",  
    "./poi-icons/restoran.png",
"./poi-icons/benzinlik.png",
"./poi-icons/eczane.png",
"./poi-icons/giyim.png",
"./poi-icons/hastane.png",
"./poi-icons/kafe.png",
"./poi-icons/otel.png",

];


/* =========================================
   INSTALL
   ========================================= */

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    function (cache) {

                        return cache.addAll(
                            SHELL
                        );

                    }
                )

        );

    }
);


/* =========================================
   ACTIVATE
   Eski cache'leri temizle
   ========================================= */

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches
                .keys()
                .then(
                    function (keys) {

                        return Promise.all(

                            keys
                                .filter(
                                    function (key) {

                                        return (
                                            key.startsWith(
                                                "gamemap-shell-"
                                            ) &&
                                            key !==
                                                CACHE_NAME
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

                    }
                )
                .then(
                    function () {

                        return self.clients
                            .claim();

                    }
                )

        );

    }
);


/* =========================================
   YENİ SÜRÜMÜ AKTİF ET
   ========================================= */

self.addEventListener(
    "message",
    function (event) {

        if (
            event.data &&
            event.data.type ===
                "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }

    }
);


/* =========================================
   FETCH

   İnternet varsa:
   DAİMA en güncel dosyayı al.

   İnternet yoksa:
   cache'den aç.
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


        /* Sadece kendi uygulama
           dosyalarımızı yönet */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        const isShell =
            SHELL.some(
                function (path) {

                    const shellUrl =
                        new URL(
                            path,
                            self.registration.scope
                        );


                    return (
                        shellUrl.pathname ===
                        url.pathname
                    );

                }
            );


        if (!isShell) {

            return;

        }


        event.respondWith(

            (async function () {

                const cache =
                    await caches.open(
                        CACHE_NAME
                    );


                try {

                    /* Önce internet */

                    const response =
                        await fetch(
                            event.request,
                            {
                                cache:
                                    "no-store"
                            }
                        );


                    if (
                        response.ok
                    ) {

                        await cache.put(
                            event.request,
                            response.clone()
                        );

                    }


                    return response;

                }

                catch (error) {

                    /* İnternet yoksa cache */

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