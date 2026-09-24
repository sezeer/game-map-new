"use strict";


// =========================================
// GAME MAP POI SİSTEMİ
// MARKET + GYM
// =========================================


const poiSearchAreaButton =
    document.getElementById(
        "poiSearchAreaButton"
    );
    const poiMarkers =
    [];

    const poiStatus =
    document.getElementById(
        "poiStatus"
    );
let poiRequestController =
    null;
const POI_CACHE_TTL =
    2 * 60 * 1000;

let poiCache = [];
let poiRequestRunning =
    false;
let poiTimer =
    null;
let activePoiPopup =
    null;
const OVERPASS_SERVERS = [

    "https://" +
    "maps.mail.ru/osm/tools/overpass/api/interpreter",

    "https://" +
    "overpass.private.coffee/api/interpreter",

    "https://" +
    "overpass-api.de/api/interpreter"

];
function getPoiZoomGroup(
    zoom
) {

    if (
        zoom < 15.5
    ) {

        return "major";

    }


    if (
        zoom < 16.5
    ) {

        return "normal";

    }


    return "detail";

}


function findPoiCache(
    south,
    west,
    north,
    east,
    zoom
) {

    const now =
        Date.now();


    const zoomGroup =
        getPoiZoomGroup(
            zoom
        );


    poiCache =
        poiCache.filter(
            function (entry) {

                return (
                    now -
                    entry.time <
                    POI_CACHE_TTL
                );

            }
        );


    return poiCache.find(
        function (entry) {

            return (

                entry.zoomGroup ===
                    zoomGroup &&

                south >=
                    entry.south &&

                west >=
                    entry.west &&

                north <=
                    entry.north &&

                east <=
                    entry.east

            );

        }
    ) || null;

}


function savePoiCache(
    south,
    west,
    north,
    east,
    zoom,
    elements
) {

    poiCache.push({

        south:
            south,

        west:
            west,

        north:
            north,

        east:
            east,

        zoomGroup:
            getPoiZoomGroup(
                zoom
            ),

        elements:
            elements,

        time:
            Date.now()

    });


    /* Hafıza şişmesin */

    if (
        poiCache.length > 12
    ) {

        poiCache.shift();

    }

}
async function fetchOverpass(
    query,
    externalSignal
) {

    const servers = [

        "https://overpass.private.coffee/api/interpreter",

        "https://overpass.osm.jp/api/interpreter",

        "https://overpass-api.de/api/interpreter",

        "https://maps.mail.ru/osm/tools/overpass/api/interpreter"

    ];


    let lastError =
        null;


    for (
        const server of
        servers
    ) {

        /* Kullanıcı isteği gerçekten iptal ettiyse çık */

        if (
            externalSignal &&
            externalSignal.aborted
        ) {

            throw new DOMException(
                "POI isteği iptal edildi.",
                "AbortError"
            );

        }


        const controller =
            new AbortController();


        /*
        Overpass sorguları 6 saniyeden uzun
        sürebiliyor.

        Sunucu başına 18 saniye veriyoruz.
        */

        const timeoutId =
            setTimeout(
                function () {

                    controller.abort(
                        "timeout"
                    );

                },
                18000
            );


        const abortRelay =
            function () {

                controller.abort(
                    "external"
                );

            };


        if (
            externalSignal
        ) {

            externalSignal
                .addEventListener(
                    "abort",
                    abortRelay,
                    {
                        once:
                            true
                    }
                );

        }


        try {

            console.log(
                "Overpass deneniyor:",
                server
            );


            const response =
                await fetch(
                    server,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/x-www-form-urlencoded;charset=UTF-8"

                        },

                        body:
                            "data=" +
                            encodeURIComponent(
                                query
                            ),

                        signal:
                            controller.signal

                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            console.log(
                "Overpass başarılı:",
                server
            );


            return data;

        }

        catch (error) {

            /*
            Haritanın kendi isteği iptal edildiyse
            gerçekten çık.
            */

            if (
                externalSignal &&
                externalSignal.aborted
            ) {

                throw new DOMException(
                    "POI isteği iptal edildi.",
                    "AbortError"
                );

            }


            /*
            Bizim 18 saniyelik timeout'umuzsa
            bunu normal sunucu hatası kabul et
            ve diğer sunucuya geç.
            */

            if (
                controller.signal.aborted
            ) {

                lastError =
                    new Error(
                        "Overpass zaman aşımı: " +
                        server
                    );


                console.warn(
                    "Overpass zaman aşımı:",
                    server
                );

            }

            else {

                lastError =
                    error;


                console.warn(
                    "Overpass sunucusu başarısız:",
                    server,
                    error.message
                );

            }

        }

        finally {

            clearTimeout(
                timeoutId
            );


            if (
                externalSignal
            ) {

                externalSignal
                    .removeEventListener(
                        "abort",
                        abortRelay
                    );

            }

        }

    }


    throw (
        lastError ||
        new Error(
            "POI servislerine ulaşılamadı."
        )
    );

}

/* =========================================
   TÜM POI MARKERLARINI TEMİZLE
   ========================================= */

function clearPoiMarkers() {

    poiMarkers.forEach(
        function (marker) {

            marker.remove();

        }
    );


    poiMarkers.length =
        0;

}


/* =========================================
   POI TÜRÜNÜ BELİRLE
   ========================================= */

function getPoiType(tags) {

    if (!tags) {
        return null;
    }


    const name =
        String(
            tags.name || ""
        )
        .toLocaleLowerCase(
            "tr-TR"
        );


    /* =====================================
       MARKET
       ===================================== */

    const isMarket =

        [
            "supermarket",
            "convenience",
            "grocery",
            "greengrocer",
            "department_store"
        ].includes(
            tags.shop
        )

        ||

        tags.amenity ===
            "marketplace"

        ||

        name.includes(
            "migros"
        )

        ||

        name.includes(
            "a101"
        )

        ||

        name.includes(
            "bim"
        )

        ||

        name.includes(
            "bi̇m"
        )

        ||

        name.includes(
            "şok"
        )

        ||

        name.includes(
            "carrefour"
        )

        ||

        name.includes(
            "file market"
        )

        ||

        name.includes(
            "tarım kredi"
        );


    if (isMarket) {

        return {

            type:
                "market",

            icon:
                "poi-icons/market.png",

            label:
                "MARKET"

        };

    }


    /* =====================================
       GYM
       ===================================== */

    const isGym =

        tags.leisure ===
            "fitness_centre"

        ||

        tags.leisure ===
            "fitness_station"

        ||

        tags.leisure ===
            "sports_centre"

        ||

        tags.sport ===
            "fitness"

        ||

        tags.sport ===
            "bodybuilding"

        ||

        tags.sport ===
            "weightlifting"

        ||

        name.includes(
            "gym"
        )

        ||

        name.includes(
            "fitness"
        )

        ||

        name.includes(
            "spor salonu"
        )

        ||

        name.includes(
            "crossfit"
        );


    if (isGym) {

        return {

            type:
                "gym",

            icon:
                "poi-icons/gym.png",

            label:
                "GYM"

        };

    }

/* =====================================
   BENZİNLİK
   ===================================== */

if (
    tags.amenity ===
    "fuel"
) {

    return {

        type:
            "fuel",

        icon:
            "poi-icons/benzinlik.png",

        label:
            "BENZİNLİK"

    };

}


/* =====================================
   RESTORAN / FAST FOOD
   ===================================== */

if (
    tags.amenity ===
        "restaurant" ||

    tags.amenity ===
        "fast_food" ||

    tags.amenity ===
        "food_court"
) {

    return {

        type:
            "restaurant",

        icon:
            "poi-icons/restoran.png",

        label:
            "YEMEK"

    };

}


/* =====================================
   KAFE
   ===================================== */

if (
    tags.amenity ===
    "cafe"
) {

    return {

        type:
            "cafe",

        icon:
            "poi-icons/kafe.png",

        label:
            "KAFE"

    };

}


/* =====================================
   HASTANE / KLİNİK
   ===================================== */

if (
    tags.amenity ===
        "hospital" ||

    tags.amenity ===
        "clinic"
) {

    return {

        type:
            "hospital",

        icon:
            "poi-icons/hastane.png",

        label:
            "SAĞLIK"

    };

}


/* =====================================
   ECZANE
   ===================================== */

if (
    tags.amenity ===
    "pharmacy"
) {

    return {

        type:
            "pharmacy",

        icon:
            "poi-icons/eczane.png",

        label:
            "ECZANE"

    };

}


/* =====================================
   OTEL
   ===================================== */

if (
    tags.tourism ===
        "hotel" ||

    tags.tourism ===
        "hostel" ||

    tags.tourism ===
        "motel" ||

    tags.tourism ===
        "guest_house"
) {

    return {

        type:
            "hotel",

        icon:
            "poi-icons/otel.png",

        label:
            "OTEL"

    };

}


/* =====================================
   GİYİM
   ===================================== */

if (
    tags.shop ===
        "clothes" ||

    tags.shop ===
        "fashion"
) {

    return {

        type:
            "clothing",

        icon:
            "poi-icons/giyim.png",

        label:
            "GİYİM"

    };

}
    return null;

}


/* =========================================
   MARKER OLUŞTUR
   ========================================= */

function createPoiMarker(
    place,
    longitude,
    latitude
) {

    const poiType =
        getPoiType(
            place.tags
        );


    if (!poiType) {
        return;
    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "gamePoiMarker";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        poiType.icon;


    image.alt =
        poiType.label;


    image.draggable =
        false;


    element.appendChild(
        image
    );


    const marker =
        new maplibregl.Marker({

            element:
                element,

            anchor:
                "center"

        })

        .setLngLat([
            longitude,
            latitude
        ])

        .addTo(
            map
        );


    /* =====================================
       İKONA TIKLA
       ===================================== */

    element.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            /* Eski açık info varsa kapat */

            if (
                activePoiPopup
            ) {

                activePoiPopup.remove();

                activePoiPopup =
                    null;

            }


            const placeName =

    place.tags?.name ||

    place.tags?.brand ||

    place.tags?.operator ||

    poiType.label;


            /* =================================
               POPUP İÇERİĞİ
               ================================= */

            const popupContent =
                document.createElement(
                    "div"
                );


            popupContent.className =
                "gamePoiPopup";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                placeName;


            const category =
                document.createElement(
                    "span"
                );


            category.textContent =
                poiType.label;


            const routeButton =
                document.createElement(
                    "button"
                );


            routeButton.type =
                "button";


            routeButton.className =
                "gamePoiRouteButton";


            routeButton.textContent =
                "ROTA OLUŞTUR";


            popupContent.appendChild(
                title
            );


            popupContent.appendChild(
                category
            );


            popupContent.appendChild(
                routeButton
            );


            /* =================================
               POPUP
               ================================= */

            const popup =
                new maplibregl.Popup({

                    offset:
                        24,

                    closeButton:
                        true,

                    closeOnClick:
                        false

                })

                .setLngLat([
                    longitude,
                    latitude
                ])

                .setDOMContent(
                    popupContent
                )

                .addTo(
                    map
                );


            activePoiPopup =
                popup;


            popup.on(
                "close",
                function () {

                    if (
                        activePoiPopup ===
                        popup
                    ) {

                        activePoiPopup =
                            null;

                    }

                }
            );


            /* =================================
               ROTA OLUŞTUR
               ================================= */

            routeButton.addEventListener(
                "click",
                function (routeEvent) {

                    routeEvent.stopPropagation();


                    popup.remove();


                    activePoiPopup =
                        null;


                    /*
                    POI'yi normal arama sonucu
                    seçilmiş gibi uygulamaya ver.
                    */

                    selectPhotonResult({

                        geometry: {

                            coordinates: [
                                longitude,
                                latitude
                            ]

                        },

                        properties: {

                            name:
                                placeName

                        }

                    });

                }
            );

        }
    );


    poiMarkers.push(
        marker
    );

}


/* =========================================
   HTML GÜVENLİĞİ
   ========================================= */

function escapePoiText(text) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================
   ÇEVREDEKİ POI'LERİ GETİR
   ========================================= */

async function loadPois(
    force = false
) {
if (poiStatus) {

    poiStatus.hidden =
        false;

    poiStatus.textContent =
        "YERLER ARANIYOR...";

}
    const zoom =
        map.getZoom();


    /* =====================================
       ÇOK UZAKTA POI GÖSTERME
       ===================================== */

  if (
    zoom < 13.5 &&
    !force
) {

    return;

}


    const bounds =
        map.getBounds();


    const south =
        bounds.getSouth();

    const west =
        bounds.getWest();

    const north =
        bounds.getNorth();

    const east =
        bounds.getEast();
    const mapCenter =
    map.getCenter();


let querySouth;
let queryNorth;
let queryWest;
let queryEast;


/* =========================================
   UZAK ZOOM

   Tüm dev ekranı sorgulama.
   Harita merkezinin yaklaşık birkaç km
   çevresini ara.
   ========================================= */

if (
    zoom < 14.5
) {

    const latitudeRadius =
        0.03;


    const longitudeRadius =
        0.04;


    querySouth =
        mapCenter.lat -
        latitudeRadius;


    queryNorth =
        mapCenter.lat +
        latitudeRadius;


    queryWest =
        mapCenter.lng -
        longitudeRadius;


    queryEast =
        mapCenter.lng +
        longitudeRadius;

}


/* =========================================
   NORMAL / YAKIN ZOOM
   ========================================= */

else {

    const latitudePadding =
        (
            north -
            south
        ) * 0.35;


    const longitudePadding =
        (
            east -
            west
        ) * 0.35;


    querySouth =
        south -
        latitudePadding;


    queryNorth =
        north +
        latitudePadding;


    queryWest =
        west -
        longitudePadding;


    queryEast =
        east +
        longitudePadding;

}


const cached =
    findPoiCache(
        south,
        west,
        north,
        east,
        zoom
    );


    const bbox =
    `${querySouth},${queryWest},${queryNorth},${queryEast}`;


    /* =====================================
       ÖNCEKİ İSTEĞİ İPTAL ET
       ===================================== */

    if (
    poiRequestRunning
) {

    console.log(
        "POI araması zaten devam ediyor."
    );

    return;

}


poiRequestRunning =
    true;


poiRequestController =
    new AbortController();


    /* =====================================
   ZOOM'A GÖRE SORGU
   ===================================== */

let query;


/* -------------------------------------
   ZOOM 14.5 - 15.5
   Sadece önemli yerler
   ------------------------------------- */

if (
    zoom < 15.5
) {

    query = `

        [out:json][timeout:12];

        (

            /* TÜM SÜPERMARKETLER */

            nwr
            ["shop"="supermarket"]
            (${bbox});


            nwr
            ["shop"="convenience"]
            (${bbox});


            /* YEMEK */

            nwr
            ["amenity"~"^(restaurant|fast_food)$"]
            (${bbox});


            /* KAFE */

            nwr
            ["amenity"="cafe"]
            (${bbox});


            /* BENZİNLİK */

            nwr
            ["amenity"="fuel"]
            (${bbox});


            /* SAĞLIK */

            nwr
            ["amenity"~"^(hospital|clinic|pharmacy)$"]
            (${bbox});

        );

        out center tags qt;

    `;

}


/* -------------------------------------
   ZOOM 15.5 - 16.5
   Çoğu önemli POI
   ------------------------------------- */

else if (
    zoom < 16.5
) {

    query = `

        [out:json][timeout:12];

        (

            nwr
            ["shop"~"^(supermarket|convenience)$"]
            (${bbox});


            nwr
            ["leisure"~"^(fitness_centre|sports_centre)$"]
            (${bbox});


            nwr
            ["sport"~"^(fitness|bodybuilding|weightlifting)$"]
            (${bbox});


            nwr
            ["amenity"~"^(fuel|restaurant|fast_food|food_court|cafe|hospital|clinic|pharmacy)$"]
            (${bbox});


            nwr
            ["tourism"~"^(hotel|hostel|motel|guest_house)$"]
            (${bbox});


            nwr
            ["shop"~"^(clothes|fashion)$"]
            (${bbox});

        );

        out center tags qt;

    `;

}


/* -------------------------------------
   ZOOM 16.5+
   Detaylı POI
   ------------------------------------- */

else {

    query = `

        [out:json][timeout:12];

        (

            nwr
            ["shop"~"^(supermarket|convenience|grocery|greengrocer|department_store)$"]
            (${bbox});


            nwr
            ["amenity"="marketplace"]
            (${bbox});


            nwr
            ["leisure"~"^(fitness_centre|fitness_station|sports_centre)$"]
            (${bbox});


            nwr
            ["sport"~"^(fitness|bodybuilding|weightlifting)$"]
            (${bbox});


            nwr
            ["amenity"~"^(fuel|restaurant|fast_food|food_court|cafe|hospital|clinic|pharmacy)$"]
            (${bbox});


            nwr
            ["tourism"~"^(hotel|hostel|motel|guest_house)$"]
            (${bbox});


            nwr
            ["shop"~"^(clothes|fashion)$"]
            (${bbox});

        );

        out center tags qt;

    `;

}
    try {

        let data;


if (
    cached
) {

    console.log(
        "POI CACHE kullanıldı."
    );


    data = {

        elements:
            cached.elements

    };

}


else {



    data =
        await fetchOverpass(

            query,

            poiRequestController
                .signal

        );


    savePoiCache(

        querySouth,
        queryWest,
        queryNorth,
        queryEast,

        zoom,

        data.elements

    );

}



        /* Yeni veri geldiyse
           eskileri kaldır */

        clearPoiMarkers();


        const candidates =
            [];

console.group("OVERPASS HAM POI SONUÇLARI");

data.elements.forEach(
    function (place) {

        const tags =
            place.tags || {};


        const debugName =
            tags.name ||
            tags.brand ||
            tags.operator ||
            "(isimsiz)";


        console.log(
            debugName,
            {
                amenity:
                    tags.amenity,

                shop:
                    tags.shop,

                tourism:
                    tags.tourism,

                leisure:
                    tags.leisure,

                sport:
                    tags.sport,

                brand:
                    tags.brand
            }
        );

    }
);

console.groupEnd();
        data.elements.forEach(
            function (place) {

                let latitude =
                    place.lat;

                let longitude =
                    place.lon;


                if (
                    !Number.isFinite(
                        latitude
                    ) ||
                    !Number.isFinite(
                        longitude
                    )
                ) {

                    latitude =
                        place.center?.lat;

                    longitude =
                        place.center?.lon;

                }


                if (
                    !Number.isFinite(
                        latitude
                    ) ||
                    !Number.isFinite(
                        longitude
                    )
                ) {

                    return;

                }


                const poiType =
                    getPoiType(
                        place.tags
                    );


                if (!poiType) {

                    return;

                }


                candidates.push({

    place:
        place,

    longitude:
        longitude,

    latitude:
        latitude,

    poiType:
        poiType.type

});

            }
        );

/* =========================================
   POI'LERİ YAKINDAN UZAĞA SIRALA
   ========================================= */

const mapCenter =
    map.getCenter();


let priorityLatitude =
    mapCenter.lat;


let priorityLongitude =
    mapCenter.lng;


/*
Kullanıcının GPS konumu ekranda görünüyorsa
önceliği kullanıcıya yakın yerlere ver.

Harita başka bölgeye taşındıysa
o zaman ekranın merkezine yakın yerlere ver.
*/

if (
    currentLocation &&
    Number.isFinite(
        currentLocation.latitude
    ) &&
    Number.isFinite(
        currentLocation.longitude
    ) &&
    bounds.contains([
        currentLocation.longitude,
        currentLocation.latitude
    ])
) {

    priorityLatitude =
        currentLocation.latitude;


    priorityLongitude =
        currentLocation.longitude;

}


/* Her POI'nin referans noktaya mesafesini hesapla */

candidates.forEach(
    function (candidate) {

        const latitudeDifference =
            (
                candidate.latitude -
                priorityLatitude
            ) *
            111320;


        const longitudeScale =
            Math.cos(
                priorityLatitude *
                Math.PI /
                180
            );


        const longitudeDifference =
            (
                candidate.longitude -
                priorityLongitude
            ) *
            111320 *
            longitudeScale;


        candidate.priorityDistance =
            Math.hypot(

                latitudeDifference,
                longitudeDifference

            );

    }
);


/* En yakın POI önce gelsin */

candidates.sort(
    function (a, b) {

        return (
            a.priorityDistance -
            b.priorityDistance
        );

    }
);
        /* =================================
           İKONLAR ÜST ÜSTE BİNMESİN
           ================================= */

        const acceptedPoints =
            [];
            const POI_LIMITS = {

    market: 20,
    restaurant: 20,
    cafe: 15,
    fuel: 12,
    pharmacy: 12,
    hospital: 8,
    hotel: 10,
    gym: 10,
    clothing: 10

};


const poiTypeCounts = {

    market:
        0,

    restaurant:
        0,

    cafe:
        0,

    fuel:
        0,

    pharmacy:
        0,

    hospital:
        0,

    hotel:
        0,

    gym:
        0,

    clothing:
        0

};


        let minimumSpacing =
            24;


        if (
            zoom < 15.5
        ) {

            minimumSpacing =
                55;

        }

        else if (
            zoom < 16.5
        ) {

            minimumSpacing =
                38;

        }


        for (
            const candidate of
            candidates
        ) {

            const candidateType =
    candidate.poiType;


const typeLimit =
    POI_LIMITS[
        candidateType
    ] ?? 6;


const currentTypeCount =
    poiTypeCounts[
        candidateType
    ] ?? 0;


/* Bu kategoride yeterince ikon varsa geç */

if (
    currentTypeCount >=
    typeLimit
) {

    continue;

}
            const screenPoint =
                map.project([

                    candidate.longitude,
                    candidate.latitude

                ]);


            const tooClose =
                acceptedPoints.some(
                    function (point) {

                        const dx =
                            point.x -
                            screenPoint.x;

                        const dy =
                            point.y -
                            screenPoint.y;


                        return (
                            Math.sqrt(
                                dx * dx +
                                dy * dy
                            ) <
                            minimumSpacing
                        );

                    }
                );


            if (tooClose) {

                continue;

            }


            acceptedPoints.push(
                screenPoint
            );
            poiTypeCounts[
    candidateType
] =
    currentTypeCount + 1;


            createPoiMarker(

                candidate.place,

                candidate.longitude,

                candidate.latitude

            );

        }


        console.log(
            "POI bulundu:",
            candidates.length,
            "Gösterilen:",
            poiMarkers.length,
            "Zoom:",
            zoom.toFixed(1)
        );
        if (poiStatus) {

    poiStatus.textContent =
        candidates.length +
        " YER BULUNDU · " +
        poiMarkers.length +
        " GÖSTERİLİYOR";


    setTimeout(
        function () {

            poiStatus.hidden =
                true;

        },
        2500
    );

}
        console.log(
    "POI dağılımı:",
    poiTypeCounts
);

    }

    catch (error) {

    if (
        error.name ===
        "AbortError"
    ) {

        return;

    }


    console.error(
        "POI hatası:",
        error
    );


    if (
        poiStatus
    ) {

        poiStatus.hidden =
            false;

        poiStatus.textContent =
            "YERLER YÜKLENEMEDİ · TEKRAR DENE";

    }


    if (
        poiSearchAreaButton
    ) {

        poiSearchAreaButton.hidden =
            false;

    }

}

finally {

    poiRequestRunning =
        false;


    poiRequestController =
        null;

}

    poiStatus.hidden =
        false;

    poiStatus.textContent =
        "YERLER YÜKLENEMEDİ · TEKRAR DENE";

}


if (
    poiSearchAreaButton
) {

    poiSearchAreaButton.hidden =
        false;

}

    
    




/* =========================================
   HARİTA HAREKET EDİNCE YENİLE
   ========================================= */

function schedulePoiLoad() {

    clearTimeout(
        poiTimer
    );


    poiTimer =
        setTimeout(
            function () {

                loadPois();

            },
            700
        );

}


map.on(
    "load",
    function () {

        schedulePoiLoad();

    }
);


map.on(
    "moveend",
    function () {

        const zoom =
            map.getZoom();


        if (
            zoom >= 13.5
        ) {

            schedulePoiLoad();

        }


        if (
            poiSearchAreaButton
        ) {

            poiSearchAreaButton.hidden =
                false;

        }

    }
);
/* =========================================
   HARİTADA BAŞKA YERE TIKLAYINCA
   POI INFO KUTUSUNU KAPAT
   ========================================= */

map.on(
    "click",
    function () {

        if (
            activePoiPopup
        ) {

            activePoiPopup.remove();

            activePoiPopup =
                null;

        }

    }
);
/* =========================================
   BU ALANDA ARA
   ========================================= */

if (
    poiSearchAreaButton
) {

    poiSearchAreaButton
        .addEventListener(
            "click",
            async function () {

                poiSearchAreaButton.hidden =
                    true;


                await loadPois(
                    true
                );

            }
        );

}


/* =========================================
   HARİTA DEĞİŞİNCE BUTONU GÖSTER
   ========================================= */

map.on(
    "movestart",
    function () {

        if (
            poiSearchAreaButton
        ) {

            poiSearchAreaButton.hidden =
                true;

        }

    }
);


map.on(
    "moveend",
    function () {

        if (
            poiSearchAreaButton
        ) {

            poiSearchAreaButton.hidden =
                false;

        }

    }
);
/* =========================================
   HARİTANIN KENDİ POI KATMANINI TEST ET
   ========================================= */

function testNativePoiLayer() {

    const layers =
        map.getStyle()?.layers || [];


    const poiLayer =
        layers.find(
            function (layer) {

                return (
                    layer["source-layer"] ===
                    "poi"
                );

            }
        );


    if (!poiLayer) {

        console.warn(
            "HARİTANIN POI KATMANI BULUNAMADI"
        );

        return;

    }


    console.log(
        "HARİTANIN POI KATMANI BULUNDU:",
        {
            id:
                poiLayer.id,

            source:
                poiLayer.source,

            sourceLayer:
                poiLayer["source-layer"]
        }
    );

}


if (
    map.loaded()
) {

    testNativePoiLayer();

}

else {

    map.once(
        "load",
        testNativePoiLayer
    );

}