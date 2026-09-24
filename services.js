/* =========================================================
   GAME MAP - SERVİS KATMANI
   Arama / reverse geocode / routing
   ========================================================= */

window.GameServices = (function () {

    const CONFIG = {

        searchProvider:
            "photon",

        routingProvider:
            "osrm",

        photonBaseUrl:
            "https://photon.komoot.io",

        osrmBaseUrl:
            "https://router.project-osrm.org",

        searchTimeout:
            12000,

        routeTimeout:
            15000

    };


    /* =====================================================
       ORTAK FETCH
       ===================================================== */

    async function fetchJson(
        url,
        options = {}
    ) {

        const timeout =
            options.timeout || 12000;

        const externalSignal =
            options.signal || null;


        const controller =
            new AbortController();


        let abortListener =
            null;


        if (externalSignal) {

            if (externalSignal.aborted) {

                controller.abort();

            }

            else {

                abortListener =
                    function () {

                        controller.abort();

                    };


                externalSignal.addEventListener(
                    "abort",
                    abortListener,
                    {
                        once: true
                    }
                );

            }

        }


        const timeoutId =
            setTimeout(
                function () {

                    controller.abort();

                },
                timeout
            );


        try {

            const response =
                await fetch(
                    url,
                    {

                        signal:
                            controller.signal,

                        headers: {

                            "Accept":
                                "application/json"

                        }

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "HTTP " +
                    response.status
                );

            }


            return await response.json();

        }

        finally {

            clearTimeout(
                timeoutId
            );


            if (
                externalSignal &&
                abortListener
            ) {

                externalSignal
                    .removeEventListener(
                        "abort",
                        abortListener
                    );

            }

        }

    }


    /* =====================================================
       YER ARAMA - PHOTON
       ===================================================== */

    async function searchPlaces(
    query,
    currentLocation,
    options = {}
) {

    const params =
        new URLSearchParams();


    params.set(
        "q",
        query
    );


    params.set(
        "limit",
        String(
            options.limit || 20
        )
    );


    if (
        currentLocation &&
        Number.isFinite(
            currentLocation.latitude
        ) &&
        Number.isFinite(
            currentLocation.longitude
        )
    ) {

        params.set(
            "lat",
            String(
                currentLocation.latitude
            )
        );


        params.set(
            "lon",
            String(
                currentLocation.longitude
            )
        );

    }


    const url =
        CONFIG.photonBaseUrl +
        "/api/?" +
        params.toString();


    console.log(
        "Photon URL:",
        url
    );


    const data =
        await fetchJson(
            url,
            {

                signal:
                    options.signal,

                timeout:
                    CONFIG.searchTimeout

            }
        );


    return Array.isArray(
        data.features
    )
        ? data.features
        : [];

}


    /* =====================================================
       REVERSE GEOCODE - PHOTON
       ===================================================== */

    async function reverseGeocode(
        longitude,
        latitude,
        options = {}
    ) {

        const params =
            new URLSearchParams();


        params.set(
            "lon",
            longitude
        );


        params.set(
            "lat",
            latitude
        );



        const url =
            CONFIG.photonBaseUrl +
            "/reverse?" +
            params.toString();


        const data =
            await fetchJson(
                url,
                {

                    signal:
                        options.signal,

                    timeout:
                        CONFIG.searchTimeout

                }
            );


        if (
            !Array.isArray(
                data.features
            ) ||
            data.features.length === 0
        ) {

            return null;

        }


        return data.features[0];

    }


    /* =====================================================
       ARAÇ ROTASI - OSRM
       ===================================================== */

    async function getRoutes(
    start,
    destination,
    mode = "car",
    options = {}
) {

    const routingServers = {

        car:
            "https://routing.openstreetmap.de/routed-car",

        walk:
            "https://routing.openstreetmap.de/routed-foot",

        bike:
            "https://routing.openstreetmap.de/routed-bike"

    };


    const baseUrl =
        routingServers[mode] ||
        routingServers.car;


    const alternativeCount =
        Number.isFinite(
            options.alternatives
        )
            ? options.alternatives
            : 3;


    const startCoordinates =
        start.longitude +
        "," +
        start.latitude;


    const endCoordinates =
        destination.longitude +
        "," +
        destination.latitude;


    const params =
        new URLSearchParams();


    params.set(
        "overview",
        "full"
    );


    params.set(
        "geometries",
        "geojson"
    );


    params.set(
        "steps",
        "true"
    );


    params.set(
        "alternatives",
        alternativeCount > 0
            ? String(
                alternativeCount
            )
            : "false"
    );


    const url =
        baseUrl +
        "/route/v1/driving/" +
        startCoordinates +
        ";" +
        endCoordinates +
        "?" +
        params.toString();


    const data =
        await fetchJson(
            url,
            {

                signal:
                    options.signal,

                timeout:
                    CONFIG.routeTimeout

            }
        );


    if (
        data.code !== "Ok" ||
        !Array.isArray(
            data.routes
        ) ||
        data.routes.length === 0
    ) {

        throw new Error(
            "Bu ulaşım türü için rota bulunamadı."
        );

    }


    return data.routes;

}


/* Eski kod başka yerde çağırırsa
   uygulama bozulmasın */

async function getDrivingRoutes(
    start,
    destination,
    options = {}
) {

    return getRoutes(
        start,
        destination,
        "car",
        options
    );

}


    /* =====================================================
       DIŞARI AÇILAN API
       ===================================================== */

    return Object.freeze({

    searchPlaces:
        searchPlaces,

    reverseGeocode:
        reverseGeocode,

    getRoutes:
        getRoutes,

    getDrivingRoutes:
        getDrivingRoutes,

    config:
        Object.freeze({
            ...CONFIG
        })

});

})();