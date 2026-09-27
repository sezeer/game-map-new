const CACHE_NAME =
    "gamemap-shell-v5";


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

    /* GTA V FONTLARI */

    "./assets/themes/gtav/fonts/Chalet-LondonNineteenSixty.ttf",
    "./assets/themes/gtav/fonts/Chalet-ComprimeCologneSixty.ttf",


    /* SAN ANDREAS MARKERLARI */

    "./assets/themes/sanandreas/markers/player.png",
    "./assets/themes/sanandreas/markers/target.png",


    /* SAN ANDREAS POI */

    "./assets/themes/sanandreas/icons/market.png",
    "./assets/themes/sanandreas/icons/gym.png",
    "./assets/themes/sanandreas/icons/restoran.png",
    "./assets/themes/sanandreas/icons/kafe.png",
    "./assets/themes/sanandreas/icons/benzinlik.png",
    "./assets/themes/sanandreas/icons/hastane.png",
    "./assets/themes/sanandreas/icons/eczane.png",
    "./assets/themes/sanandreas/icons/otel.png",
    "./assets/themes/sanandreas/icons/giyim.png",


    /* GTA V POI */

    "./assets/themes/gtav/icons/market.png",
    "./assets/themes/gtav/icons/gym.png",
    "./assets/themes/gtav/icons/restoran.png",
    "./assets/themes/gtav/icons/kafe.png",
    "./assets/themes/gtav/icons/benzinlik.png",
    "./assets/themes/gtav/icons/hastane.png",
    "./assets/themes/gtav/icons/eczane.png",
    "./assets/themes/gtav/icons/otel.png",
    "./assets/themes/gtav/icons/giyim.png" ,

    /* CYBERPUNK POI */

"./assets/themes/cyberpunk/icons/market.png",
"./assets/themes/cyberpunk/icons/gym.png",
"./assets/themes/cyberpunk/icons/restoran.png",
"./assets/themes/cyberpunk/icons/kafe.png",
"./assets/themes/cyberpunk/icons/benzinlik.png",
"./assets/themes/cyberpunk/icons/hastane.png",
"./assets/themes/cyberpunk/icons/eczane.png",
"./assets/themes/cyberpunk/icons/otel.png",
"./assets/themes/cyberpunk/icons/giyim.png"

    
    
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
                Bir dosya eksik olsa bile
                bütün kurulum çökmesin.
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
                                    path,
                                    error
                                );

                            }

                        }
                    )

                );

            })()
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


        /*
        Sadece bizim uygulama dosyaları.

        Harita tile,
        Photon,
        OSRM vb. buraya girmez.
        */

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
                ÖNCE İNTERNET.

                Böylece GitHub'a yeni sürüm
                yüklediğimizde eski JS/CSS'e
                takılmayız.
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
                    İnternet yoksa cache.
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