const map = new maplibregl.Map({
    container: "map",

    style: "https://tiles.openfreemap.org/styles/liberty",

    center: [32.85, 39.93],

    zoom: 11
    
});
map.on(
    "rotate",
    function () {

        updatePlayerDirection();

    }
);
function setupGame3DBuildings() {
    console.log("3D SETUP ÇALIŞTI");

    const style =
        map.getStyle();

    const layers =
        style && style.layers
            ? style.layers
            : [];


    // =========================
    // 1) HAZIR 3D BİNA VAR MI?
    // =========================

    const existing3DLayer =
        layers.find(
            function (layer) {

                const id =
                    (
                        layer.id || ""
                    ).toLowerCase();

                const sourceLayer =
                    (
                        layer["source-layer"] ||
                        ""
                    ).toLowerCase();


                return (
                    layer.type ===
                        "fill-extrusion" &&

                    (
                        id.includes(
                            "building"
                        ) ||

                        sourceLayer.includes(
                            "building"
                        )
                    )
                );

            }
        );


    if (existing3DLayer) {

        try {

            map.setLayoutProperty(
                existing3DLayer.id,
                "visibility",
                "visible"
            );


            map.setPaintProperty(
                existing3DLayer.id,
                "fill-extrusion-color",
                "#c7c3b8"
            );


            map.setPaintProperty(
                existing3DLayer.id,
                "fill-extrusion-opacity",
                0.88
            );


            map.setLayerZoomRange(
                existing3DLayer.id,
                15,
                24
            );


            console.log(
                "Hazır 3D bina katmanı kullanılıyor:",
                existing3DLayer.id
            );


            return;

        }

        catch (error) {

            console.warn(
                "Hazır 3D bina katmanı düzenlenemedi:",
                error
            );

        }

    }


    // =========================
    // 2) NORMAL BİNA KATMANINI BUL
    // =========================

    const buildingLayer =
        layers.find(
            function (layer) {

                const id =
                    (
                        layer.id || ""
                    ).toLowerCase();

                const sourceLayer =
                    (
                        layer["source-layer"] ||
                        ""
                    ).toLowerCase();


                return (

                    layer.type === "fill" &&

                    layer.source &&

                    (
                        id.includes(
                            "building"
                        ) ||

                        sourceLayer.includes(
                            "building"
                        )
                    )

                );

            }
        );


    if (!buildingLayer) {

        console.warn(
            "3D bina için bina katmanı bulunamadı."
        );

        return;

    }


    if (
        map.getLayer(
            "game-buildings-3d"
        )
    ) {

        return;

    }


    // =========================
    // BİNA YÜKSEKLİĞİ
    // =========================

    const buildingHeight = [

        "case",

        [
            "has",
            "render_height"
        ],

        [
            "to-number",
            [
                "get",
                "render_height"
            ],
            8
        ],


        [
            "has",
            "height"
        ],

        [
            "to-number",
            [
                "get",
                "height"
            ],
            8
        ],


        [
            "has",
            "levels"
        ],

        [
            "*",

            [
                "to-number",
                [
                    "get",
                    "levels"
                ],
                3
            ],

            3
        ],


        8

    ];


    const buildingBase = [

        "case",

        [
            "has",
            "render_min_height"
        ],

        [
            "to-number",
            [
                "get",
                "render_min_height"
            ],
            0
        ],


        [
            "has",
            "min_height"
        ],

        [
            "to-number",
            [
                "get",
                "min_height"
            ],
            0
        ],


        0

    ];


    // =========================
    // YENİ 3D KATMAN
    // =========================

    const new3DLayer = {

        id:
            "game-buildings-3d",

        type:
            "fill-extrusion",

        source:
            buildingLayer.source,

        minzoom:
            15,

        paint: {

            "fill-extrusion-color":
                "#c7c3b8",

            "fill-extrusion-height": [

                "interpolate",

                [
                    "linear"
                ],

                [
                    "zoom"
                ],

                15,
                0,

                15.6,
                buildingHeight

            ],

            "fill-extrusion-base":
                buildingBase,

            "fill-extrusion-opacity":
                0.88,

            "fill-extrusion-vertical-gradient":
                true

        }

    };


    // Vector source ise gerçek
    // source-layer değerini kullan
    if (
        buildingLayer[
            "source-layer"
        ]
    ) {

        new3DLayer[
            "source-layer"
        ] =
            buildingLayer[
                "source-layer"
            ];

    }


    // Aynı bina filtresini koru
    if (buildingLayer.filter) {

        new3DLayer.filter =
            buildingLayer.filter;

    }


    try {

        map.addLayer(
            new3DLayer
        );


        console.log(
            "Game Map 3D binaları aktif.",
            buildingLayer.source,
            buildingLayer[
                "source-layer"
            ]
        );

    }

    catch (error) {

        console.error(
            "3D bina eklenemedi:",
            error
        );

    }

}
function setupGameLabelHierarchy() {

    const layers =
        map.getStyle()?.layers || [];


    layers.forEach(
        function (layer) {

            if (
                layer.type !==
                "symbol"
            ) {

                return;

            }


            const textField =
                map.getLayoutProperty(
                    layer.id,
                    "text-field"
                );


            if (
                textField === undefined ||
                textField === null
            ) {

                return;

            }


            const visibility =
                map.getLayoutProperty(
                    layer.id,
                    "visibility"
                );


            /*
            Bizim önceki sistemimizin
            kapattığı POI yazılarına
            dokunma.
            */

            if (
                visibility ===
                "none"
            ) {

                return;

            }


            const id =
                (
                    layer.id || ""
                ).toLowerCase();


            const sourceLayer =
                (
                    layer[
                        "source-layer"
                    ] || ""
                ).toLowerCase();


            const filterText =
                JSON.stringify(
                    layer.filter || ""
                ).toLowerCase();


            const info =
                id +
                " " +
                sourceLayer +
                " " +
                filterText;


            /* =====================================
               BÜYÜK ŞEHİR
               ===================================== */

            if (
                info.includes("city") ||
                info.includes("capital")
            ) {

                map.setLayerZoomRange(
                    layer.id,
                    6,
                    24
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-size",
                    [
                        "interpolate",
                        ["linear"],
                        ["zoom"],

                        6, 13,
                        9, 17,
                        12, 22,
                        15, 28
                    ]
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-padding",
                    8
                );


                map.setPaintProperty(
                    layer.id,
                    "text-color",
                    "#1c1a16"
                );


                map.setPaintProperty(
                    layer.id,
                    "text-halo-color",
                    "#c7c0ae"
                );


                map.setPaintProperty(
                    layer.id,
                    "text-halo-width",
                    2.2
                );


                return;

            }


            /* =====================================
               İLÇE / KASABA
               ===================================== */

            if (
                info.includes("town")
            ) {

                map.setLayerZoomRange(
                    layer.id,
                    8.5,
                    24
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-size",
                    [
                        "interpolate",
                        ["linear"],
                        ["zoom"],

                        8.5, 11,
                        11, 14,
                        14, 18
                    ]
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-padding",
                    7
                );


                return;

            }


            /* =====================================
               KÖY
               ===================================== */

            if (
                info.includes("village") ||
                info.includes("hamlet")
            ) {

                map.setLayerZoomRange(
                    layer.id,
                    10.5,
                    24
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-size",
                    [
                        "interpolate",
                        ["linear"],
                        ["zoom"],

                        10.5, 9,
                        13, 11,
                        16, 14
                    ]
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-padding",
                    8
                );


                return;

            }


            /* =====================================
               MAHALLE
               ===================================== */

            if (
                info.includes("suburb") ||
                info.includes(
                    "neighbourhood"
                ) ||
                info.includes(
                    "neighborhood"
                )
            ) {

                map.setLayerZoomRange(
                    layer.id,
                    12.5,
                    24
                );


                map.setLayoutProperty(
                    layer.id,
                   "text-size",
[
    "interpolate",
    ["linear"],
    ["zoom"],

    12.5, 8,
    15, 10,
    17, 12
]
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-padding",
                    10
                );
map.setPaintProperty(
    layer.id,
    "text-color",
    "#3a372f"
);

map.setPaintProperty(
    layer.id,
    "text-halo-width",
    1.2
);

                return;

            }


            /* =====================================
               CADDE / SOKAK
               ===================================== */

            const isRoadName =

                sourceLayer.includes(
                    "transportation_name"
                ) ||

                info.includes(
                    "road-label"
                ) ||

                info.includes(
                    "road_label"
                ) ||

                info.includes(
                    "road-name"
                ) ||

                info.includes(
                    "road_name"
                ) ||

                info.includes(
                    "street"
                );


            if (
                isRoadName
            ) {

                map.setLayerZoomRange(
                    layer.id,
                    13.5,
                    24
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-size",
                    [
                        "interpolate",
                        ["linear"],
                        ["zoom"],

                        13.5, 8,
                        15, 9,
                        17, 11,
                        19, 13
                    ]
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-padding",
                    5
                );


                map.setLayoutProperty(
                    layer.id,
                    "text-letter-spacing",
                    0.05
                );


                map.setPaintProperty(
                    layer.id,
                    "text-color",
                    "#28251e"
                );


                map.setPaintProperty(
                    layer.id,
                    "text-halo-color",
                    "#c7c0ae"
                );


                map.setPaintProperty(
                    layer.id,
                    "text-halo-width",
                    1.3
                );


                return;

            }

        }
    );

}
map.on("load", function () {

    const layers = map.getStyle().layers;

    layers.forEach(function (layer) {

        const id = layer.id.toLowerCase();

        const sourceLayer =
            (layer["source-layer"] || "").toLowerCase();

        const filterText =
    JSON.stringify(layer.filter || "").toLowerCase();

const name =
    id + " " + sourceLayer + " " + filterText;

    // =========================
// GTA TARZI HARİTA YAZILARI
// =========================

if (layer.type === "symbol") {

    const textField =
        map.getLayoutProperty(
            layer.id,
            "text-field"
        );


    const hasText =
        textField !== undefined &&
        textField !== null;


    /*
    ŞEHİR / İLÇE / MAHALLE
    */

    const isPlaceLabel =
        hasText &&
        (
            sourceLayer.includes("place") ||

            name.includes("place-label") ||
            name.includes("place_label") ||

            name.includes("city") ||
            name.includes("town") ||
            name.includes("village") ||

            name.includes("suburb") ||

            name.includes("neighbourhood") ||
            name.includes("neighborhood")
        );


    /*
    CADDE / SOKAK / YOL
    */

    const isRoadLabel =
        hasText &&
        (
            sourceLayer.includes(
                "transportation_name"
            ) ||

            name.includes("road-label") ||
            name.includes("road_label") ||

            name.includes("road-name") ||
            name.includes("road_name") ||

            name.includes("street") ||
            name.includes("highway-name")
        );


    /*
    Bunlardan biri değilse
    yine gizle.
    */

    if (
        !isPlaceLabel &&
        !isRoadLabel
    ) {

        map.setLayoutProperty(
            layer.id,
            "visibility",
            "none"
        );

        return;

    }


    /*
    İSTEDİĞİMİZ YAZIYSA AÇ
    */

    map.setLayoutProperty(
        layer.id,
        "visibility",
        "visible"
    );


    /*
    GTA HARİTA RENGİ
    */

    map.setPaintProperty(
        layer.id,
        "text-color",
        "#211f1a"
    );


    map.setPaintProperty(
        layer.id,
        "text-halo-color",
        "#c7c0ae"
    );


    map.setPaintProperty(
        layer.id,
        "text-halo-width",
        1.5
    );


    map.setPaintProperty(
        layer.id,
        "text-halo-blur",
        0.4
    );


    /*
    SOKAKLAR
    */

    if (isRoadLabel) {

        map.setLayoutProperty(
            layer.id,
            "text-letter-spacing",
            0.06
        );

    }


    /*
    ŞEHİR / MAHALLE
    */

    if (isPlaceLabel) {

        map.setPaintProperty(
            layer.id,
            "text-halo-width",
            2
        );

    }


    return;
}    
    // =========================
        // ARKA PLAN
        // =========================

        if (layer.type === "background") {

            map.setPaintProperty(
                layer.id,
                "background-color",
                "#9e9482"
            );

        }

        // =========================
        // ALANLAR
        // =========================

        if (layer.type === "fill") {

    // SU
    if (name.includes("water")) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#7f94b3"
        );

    }

    // PARK / ORMAN
    else if (
        name.includes("park") ||
        name.includes("forest") ||
        name.includes("wood") ||
        name.includes("grass")
    ) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#456b2f"
        );

    }

    // HASTANE / OKUL / KAMUSAL ALANLAR
else if (
    name.includes("hospital") ||
    name.includes("clinic") ||
    name.includes("school") ||
    name.includes("university") ||
    name.includes("college") ||
    name.includes("kindergarten")
) {

    map.setPaintProperty(
        layer.id,
        "fill-color",
        "#b6b1a5"
    );

    map.setPaintProperty(
        layer.id,
        "fill-opacity",
        1
    );

}
    // ŞEHİR / YERLEŞİM
    else if (
        name.includes("residential") ||
        name.includes("commercial") ||
        name.includes("industrial") ||
        name.includes("urban")
    ) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#b0aea6"
        );

        map.setPaintProperty(
            layer.id,
            "fill-opacity",
            0.9
        );

    }

    // TARLA / AÇIK YEŞİL
    else if (
        name.includes("farmland") ||
        name.includes("meadow") ||
        name.includes("orchard")
    ) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#788953"
        );

    }

    // PLAJ / KUM
    else if (
        name.includes("sand") ||
        name.includes("beach")
    ) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#e3cf75"
        );

    }

    // HAVAALANI
else if (
    name.includes("aeroway") ||
    name.includes("airport")
) {

    map.setPaintProperty(
        layer.id,
        "fill-color",
        "#9b9b96"
    );

    map.setPaintProperty(
        layer.id,
        "fill-opacity",
        0.85
    );

}
    // BİNALAR
    else if (name.includes("building")) {

        map.setPaintProperty(
            layer.id,
            "fill-color",
            "#d9d7cf"
        );

        map.setPaintProperty(
            layer.id,
             "fill-opacity",
    [
        "interpolate",
        ["linear"],
        ["zoom"],

        10, 0,
        12, 0.10,
        13, 0.25,
        14, 0.45,
        15, 0.70,
        17, 1
            ]
        );

    }

}
        
// NEHİR / DERE
if (
    name.includes("waterway") ||
    name.includes("river") ||
    name.includes("stream")
) {

    map.setPaintProperty(
        layer.id,
        "line-color",
        "#7f94b3"
    );

    map.setPaintProperty(
        layer.id,
        "line-width",
        1.5
    );

    return;
}

        // =========================
        // ÇİZGİLER / YOLLAR
        // =========================

        if (layer.type === "line") {
            const dashArray =
    map.getPaintProperty(
        layer.id,
        "line-dasharray"
    );

if (dashArray) {

    map.setLayoutProperty(
        layer.id,
        "visibility",
        "none"
    );

    return;
}
            const unwantedLine =
    name.includes("path") ||
    name.includes("footway") ||
    name.includes("cycleway") ||
    name.includes("track") ||
    name.includes("pedestrian") ||
    name.includes("bridleway");

if (unwantedLine) {

    map.setLayoutProperty(
        layer.id,
        "visibility",
        "none"
    );

    return;
}
// =========================
// DEMİRYOLLARI
// =========================

if (
    name.includes("rail") ||
    name.includes("railway")
) {

    map.setPaintProperty(
        layer.id,
        "line-color",
        "#6b241c"
    );

    map.setPaintProperty(
        layer.id,
        "line-width",
        2.5
    );

    return;
}

            if (
                name.includes("road") ||
                name.includes("highway") ||
                name.includes("transportation")
            ) {

                // Yol rengi

                map.setPaintProperty(
                    layer.id,
                    "line-color",
                    "#111111"
                );

                // OTOYOL
if (
    name.includes("motorway") ||
    name.includes("trunk")
) {

    map.setPaintProperty(
        layer.id,
        "line-width",
        [
            "interpolate",
            ["linear"],
            ["zoom"],

            9, 2.5,
            12, 4,
            15, 7,
            17, 10
        ]
    );

}

// ANA CADDE
else if (
    name.includes("primary") ||
    name.includes("major")
) {

    map.setPaintProperty(
        layer.id,
        "line-width",
        [
            "interpolate",
            ["linear"],
            ["zoom"],

            9, 1.5,
            12, 2.5,
            15, 5,
            17, 7
        ]
    );

}

// ORTA YOL
else if (
    name.includes("secondary") ||
    name.includes("tertiary")
) {

    map.setPaintProperty(
        layer.id,
        "line-width",
        [
            "interpolate",
            ["linear"],
            ["zoom"],

            10, 0.8,
            13, 1.7,
            15, 3,
            17, 5
        ]
    );

}

// KÜÇÜK SOKAK
else {

    map.setPaintProperty(
        layer.id,
        "line-width",
        [
            "interpolate",
            ["linear"],
            ["zoom"],

            9, 0.2,
            12, 0.6,
            15, 1.4,
            17, 2.5
        ]
    );

        }

    }

}

        // =========================
        // YAZILAR / İKONLAR
        // =========================

        if (layer.type === "symbol") {

    map.setLayoutProperty(
        layer.id,
        "visibility",
        "none"
    );

}

}); // layers.forEach kapanıyor
setupGame3DBuildings();

setupSearchResultLayers();

setupGameLabelHierarchy();

}); // map.on("load") kapanıyor

// =========================
// OYUNCU KONUMU
// =========================

let playerMarker = null;
let currentLocation = null;
let watchId = null;
let navigationSteps = [];
let currentStepIndex = 1;
let hasCenteredOnPlayer = false;
let lastRouteUpdateLocation = null;
let routeUpdateInProgress = false;
let navigationMode = false;
let lastHeadingLocation = null;
let currentRouteCoordinates = [];
let offRouteCount = 0;
let lastRerouteAt = 0;
let lastNavigationBearing = 0;
let routePreviewReady = false;
let deviceHeading = null;
let lastGpsHeading = null;

let smoothCameraLocation = null;
let smoothCameraBearing = null;

let centerOnNextGps = false;

let headingListenerStarted = false;
let currentRouteTotalDistance = 0;
let currentRouteTotalDuration = 0;

let lastSpeedLocation = null;
let lastSpeedTime = null;
let lastRoadLookupStep = -1;
let currentRoadName = "";
let roadLookupRequestId = 0;
let displayedLocation = null;
let stableGpsLocation = null;
let routeSnapActive = false;
let routeSnapMissCount = 0;
let lastStableGpsTime = null;

let lastReliableSpeed = 0;
let lastRawGpsLocation = null;
let lastRawGpsTime = null;


const locationButton =
    document.getElementById("locationButton");

function recenterToGps() {

    if (!navigator.geolocation) {

        alert(
            "Bu cihaz konum özelliğini desteklemiyor."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
    position.coords.latitude;

const longitude =
    position.coords.longitude;


/* Bu GPS ölçümünü gerçekten güncel kabul et */

updateGpsStatus(
    position
);


currentLocation = {

    latitude:
        latitude,

    longitude:
        longitude

};

            showPlayer(
                longitude,
                latitude
            );

            updatePlayerDirection();

            // Navigasyon açıksa
            if (navigationMode) {

                map.easeTo({

                    center: [
                        longitude,
                        latitude
                    ],

                    zoom: 17.3,

                    pitch: 60,

                    bearing:
                        smoothCameraBearing !== null
                            ? smoothCameraBearing
                            : map.getBearing(),

                    offset: [
                        0,
                        window.innerHeight * 0.18
                    ],

                    duration: 700,

                    essential: true

                });

            }

            // Normal haritadaysak
            else {

                map.easeTo({

                    center: [
                        longitude,
                        latitude
                    ],

                    zoom: 16,

                    pitch: 0,

                    bearing: 0,

                    offset: [
                        0,
                        0
                    ],

                    duration: 700,

                    essential: true

                });

            }

        },

        function (error) {

            console.error(
                "Konuma gitme hatası:",
                error
            );

        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }

    );

}
locationButton.addEventListener(
    "click",
    function (event) {

        // Her tıklamada o anki
        // gerçek GPS konumuna git
        // Mevcut GPS takibi konumu günceller.

        // Telefonun baktığı yönü al
        if (
    event?.isTrusted &&
    typeof requestHeadingPermission ===
        "function"
) {

    requestHeadingPermission();

}

        // =========================
        // GPS ZATEN AÇIKSA
        // SADECE KONUMUMA DÖN
        // =========================

        if (
    watchId !== null
) {

    /*
    GPS takibi açık olsa bile
    KONUMUM'a basıldığında
    yeni bir ölçüm iste.
    */

    recenterToGps();

    return;

}

        // =========================
        // GPS DESTEĞİ
        // =========================

        if (!navigator.geolocation) {

            alert(
                "Bu cihaz konum özelliğini desteklemiyor."
            );

            return;

        }

        centerOnNextGps = true;

        locationButton.textContent =
            "GPS ARANIYOR";

        locationButton.classList.add(
            "gps-active"
        );

        // =========================
        // GPS BAŞLAT
        // =========================

        watchId =
    navigator.geolocation.watchPosition(

        function (position) {

            updateGpsStatus(position);
            const stableLocation =
                getStableGpsLocation(
                    position
                );

const latitude =
    stableLocation.latitude;

const longitude =
    stableLocation.longitude;

currentLocation = {

    latitude:
        latitude,

    longitude:
        longitude

};
                    displayedLocation = {

    latitude:
        latitude,

    longitude:
        longitude

};

// Navigasyondaysak ve rota varsa
// görsel konumu yola oturt

if (
    navigationMode &&
    currentRouteCoordinates.length > 1
) {

    const snappedPoint =
        getNearestPointOnRoute(
            currentLocation,
            currentRouteCoordinates
        );


    let snapEnterDistance =
        35;

    let snapExitDistance =
        55;


    if (
        selectedRouteMode ===
        "walk"
    ) {

        snapEnterDistance =
            18;

        snapExitDistance =
            30;

    }


    else if (
        selectedRouteMode ===
        "bike"
    ) {

        snapEnterDistance =
            28;

        snapExitDistance =
            45;

    }


    /* =========================
       ŞU AN YOLA YAPIŞIK DEĞİLSE
       ========================= */

    if (
        !routeSnapActive
    ) {

        if (
            snappedPoint !== null &&
            snappedPoint.distance <=
                snapEnterDistance
        ) {

            routeSnapActive =
                true;

            routeSnapMissCount =
                0;

        }

    }


    /* =========================
       YOLA YAPIŞIKSA
       ========================= */

    if (
        routeSnapActive
    ) {

        if (
            snappedPoint !== null &&
            snappedPoint.distance <=
                snapExitDistance
        ) {

            routeSnapMissCount =
                0;


            displayedLocation = {

                latitude:
                    snappedPoint.latitude,

                longitude:
                    snappedPoint.longitude

            };

        }

        else {

            routeSnapMissCount++;


            /*
            Tek kötü GPS ölçümünde
            yoldan çıkma.
            */

            if (
                routeSnapMissCount >= 3
            ) {

                routeSnapActive =
                    false;

                routeSnapMissCount =
                    0;

            }

            else if (
                snappedPoint !== null
            ) {

                displayedLocation = {

                    latitude:
                        snappedPoint.latitude,

                    longitude:
                        snappedPoint.longitude

                };

            }

        }

    }

}

                    // =========================
                    // GPS HAREKET YÖNÜ
                    // =========================

                    if (
                        position.coords.heading !==
                            null &&
                        Number.isFinite(
                            position.coords.heading
                        )
                    ) {

                        lastGpsHeading =
                            position.coords.heading;

                    }

                    // =========================
                    // OYUNCUYU GÖSTER
                    // =========================

                    showPlayer(
    displayedLocation.longitude,
    displayedLocation.latitude
);

                    updatePlayerDirection();

                    // =========================
                    // İLK KONUM GELDİĞİNDE
                    // HARİTAYI ORAYA GETİR
                    // =========================

                    if (centerOnNextGps) {

    map.easeTo({

        center: [
            longitude,
            latitude
        ],

        zoom: 16,

        pitch: 0,

        bearing: 0,

        offset: [0, 0],

        duration: 800,

        essential: true

    });

    centerOnNextGps = false;

}

                    // =========================
                    // CANLI YÖN TALİMATI
                    // =========================

                    updateLiveInstruction(
                        latitude,
                        longitude
                    );

                    // =========================
                    // GEÇİLEN MOR ROTAYI SİL
                    // =========================

                    updateRouteProgress();
                    updateNavigationStats(
    position
);

                    // =========================
                    // HEDEFE ULAŞMA
                    // =========================

                    if (
                        navigationMode &&
                        destinationLocation !==
                            null
                    ) {

                        const distanceToDestination =
                            calculateDistance(
                                currentLocation,
                                destinationLocation
                            );

                        if (
                            hasArrived(position, distanceToDestination)
                        ) {

                            finishNavigation();

                            return;

                        }

                    }

                    // =========================
                    // ROTADAN SAPMA
                    // =========================

                    if (
                        navigationMode &&
                        destinationLocation !==
                            null &&
                        currentRouteCoordinates
                            .length > 1
                    ) {

                        const gpsAccuracy =
                            position.coords
                                .accuracy;

                        if (
                            gpsAccuracy <= 50
                        ) {

                            const offRouteDistance =
    distanceToRoute(
        currentLocation,
        currentRouteCoordinates
    );


let offRouteThreshold =
    40;

let requiredOffRouteFixes =
    2;

let rerouteCooldown =
    10000;


if (
    selectedRouteMode ===
    "walk"
) {

    offRouteThreshold =
        18;

    requiredOffRouteFixes =
        3;

    rerouteCooldown =
        6000;

}


else if (
    selectedRouteMode ===
    "bike"
) {

    offRouteThreshold =
        28;

    requiredOffRouteFixes =
        2;

    rerouteCooldown =
        8000;

}


if (
    offRouteDistance >
    offRouteThreshold
) {

    offRouteCount++;

}

else {

    offRouteCount =
        0;

}


if (
    offRouteCount >=
    requiredOffRouteFixes
) {

    const now =
        Date.now();


    if (
        now -
            lastRerouteAt >
        rerouteCooldown
    ) {

        lastRerouteAt =
            now;

        offRouteCount =
            0;

        createRoute(
            true
        );

    }

}

                        }

                    }

                    

// =========================
// NAVİGASYON KAMERASI
// =========================

if (navigationMode) {

    const cameraSpeed =

        position.coords.speed !== null &&
        Number.isFinite(
            position.coords.speed
        )

            ? position.coords.speed

            : lastReliableSpeed;


    /* =========================
       HIZA GÖRE İLERİ BAK
       ========================= */

    let lookAheadDistance;


    if (cameraSpeed > 20) {

        // yaklaşık 72+ km/h
        lookAheadDistance = 140;

    }

    else if (cameraSpeed > 12) {

        lookAheadDistance = 100;

    }

    else if (cameraSpeed > 6) {

        lookAheadDistance = 70;

    }

    else if (cameraSpeed > 2) {

        lookAheadDistance = 45;

    }

    else {

        lookAheadDistance = 30;

    }
if (
    selectedRouteMode ===
    "walk"
) {

    lookAheadDistance =
        18;

}


else if (
    selectedRouteMode ===
    "bike"
) {

    lookAheadDistance =
        Math.min(
            lookAheadDistance,
            45
        );

}

    const lookAheadPoint =
        getCameraLookAheadPoint(
            lookAheadDistance
        );


    /* =========================
       KONUMU YUMUŞAT
       ========================= */

    if (
        smoothCameraLocation === null
    ) {

        smoothCameraLocation = {

            latitude:
                displayedLocation.latitude,

            longitude:
                displayedLocation.longitude

        };

    }

    else {

        let locationSmoothing;


        if (cameraSpeed > 10) {

            locationSmoothing = 0.70;

        }

        else if (cameraSpeed > 4) {

            locationSmoothing = 0.55;

        }

        else if (cameraSpeed > 1) {

            locationSmoothing = 0.40;

        }

        else {

            locationSmoothing = 0.25;

        }


        smoothCameraLocation.latitude +=

            (
                displayedLocation.latitude -
                smoothCameraLocation.latitude
            ) *
            locationSmoothing;


        smoothCameraLocation.longitude +=

            (
                displayedLocation.longitude -
                smoothCameraLocation.longitude
            ) *
            locationSmoothing;

    }


    /* =========================
       KAMERA YÖNÜ
       ========================= */

    let targetBearing =
        smoothCameraBearing !== null
            ? smoothCameraBearing
            : map.getBearing();


    // Öncelik rota yönünde.
    // Böylece telefon pusulası kamerayı
    // sağa sola sallamaz.
    if (lookAheadPoint !== null) {

        targetBearing =
            calculateBearing(
                displayedLocation,
                lookAheadPoint
            );

    }

    // Rota yönü bulunamazsa GPS yönü
    else if (
        cameraSpeed > 1.5 &&
        position.coords.heading !== null &&
        Number.isFinite(
            position.coords.heading
        )
    ) {

        targetBearing =
            position.coords.heading;

    }


    /* =========================
       YÖNÜ YUMUŞAT
       ========================= */

    if (
        smoothCameraBearing === null
    ) {

        smoothCameraBearing =
            targetBearing;

    }

    else {

        const bearingSmoothing =

            cameraSpeed > 8
                ? 0.35
                : 0.22;


        smoothCameraBearing =
            smoothAngle(
                smoothCameraBearing,
                targetBearing,
                bearingSmoothing
            );

    }


    /* =========================
       HIZA GÖRE ZOOM
       ========================= */

    let cameraZoom;


    if (cameraSpeed > 22) {

        cameraZoom = 15.7;

    }

    else if (cameraSpeed > 13) {

        cameraZoom = 16.0;

    }

    else if (cameraSpeed > 7) {

        cameraZoom = 16.35;

    }

    else if (cameraSpeed > 3) {

        cameraZoom = 16.65;

    }

    else {

        cameraZoom = 17.0;

    }


    let cameraPitch =
    cameraSpeed > 7
        ? 62
        : 58;


let cameraOffset =
    cameraSpeed > 7
        ? window.innerHeight * 0.22
        : window.innerHeight * 0.18;


if (
    selectedRouteMode ===
    "walk"
) {

    cameraZoom =
        17.8;

    cameraPitch =
        32;

    cameraOffset =
        window.innerHeight * 0.08;

}


else if (
    selectedRouteMode ===
    "bike"
) {

    cameraZoom =
        Math.max(
            cameraZoom,
            16.8
        );

    cameraPitch =
        50;

    cameraOffset =
        window.innerHeight * 0.14;

}


    /* =========================
       KAMERAYI HAREKET ETTİR
       ========================= */

    map.easeTo({

        center: [

            smoothCameraLocation.longitude,
            smoothCameraLocation.latitude

        ],

        zoom:
            cameraZoom,

        pitch:
            cameraPitch,

        bearing:
            smoothCameraBearing,

        offset: [
            0,
            cameraOffset
        ],

        duration:
            cameraSpeed > 8
                ? 650
                : 800,

        easing:
            function (t) {

                return (
                    1 -
                    Math.pow(
                        1 - t,
                        3
                    )
                );

            },

        essential:
            true

    });


    updatePlayerDirection();

}


                },

                // =========================
                // GPS HATASI
                // =========================

                function (error) {

                    console.error(
                        "GPS hatası:",
                        error
                    );

                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                    stableGpsLocation = null;
                    lastStableGpsTime = null;
                    lastRawGpsLocation = null;
lastRawGpsTime = null;
lastReliableSpeed = 0;
                    lastGpsFixAt = 0;
                    gpsErrorText = gpsErrorMessage(error);
                    renderConnectionStatus();

                    centerOnNextGps =
                        false;

                    locationButton.textContent =
                        "KONUMUM";

                    locationButton.classList.remove(
                        "gps-active"
                    );

                    alert(
                        gpsErrorMessage(error)
                    );

                },

                // =========================
                // GPS AYARLARI
                // =========================

                {
                    enableHighAccuracy:
                        true,

                    maximumAge:
                        1000,

                    timeout:
                        15000
                }

            );

    }
);
// =========================
// OYUNCU MARKERI
// =========================

function showPlayer(
    longitude,
    latitude
) {

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return;
    }

    if (playerMarker === null) {

        const markerElement =
            document.createElement("div");

        markerElement.id =
            "playerMarker";

        markerElement.innerHTML = `

    <img
        class="playerMarkerImage"
        src="poi-icons/player-marker.png"
        alt=""
    >

`;

        playerMarker =
            new maplibregl.Marker({

                element:
                    markerElement,

                anchor:
                    "center"

            });

        playerMarker
            .setLngLat([
                longitude,
                latitude
            ])
            .addTo(map);

    }

    else {

        playerMarker.setLngLat([
            longitude,
            latitude
        ]);

    }

}
// =========================
// İKİ KONUM ARASINDA MESAFE
// =========================

function calculateDistance(point1, point2) {

    const earthRadius = 6371000;

    const lat1 =
        point1.latitude * Math.PI / 180;

    const lat2 =
        point2.latitude * Math.PI / 180;

    const deltaLat =
        (point2.latitude - point1.latitude) *
        Math.PI / 180;

    const deltaLon =
        (point2.longitude - point1.longitude) *
        Math.PI / 180;

    const a =
        Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +

        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
    }
function calculateRemainingRouteDistance(
    coordinates
) {

    if (
        !coordinates ||
        coordinates.length < 2 ||
        currentLocation === null
    ) {

        return 0;

    }

    let totalDistance = 0;

    // Önce bulunduğumuz yerden
    // kalan rotanın ilk noktasına
    totalDistance +=
        calculateDistance(

            currentLocation,

            {
                longitude:
                    coordinates[0][0],

                latitude:
                    coordinates[0][1]
            }

        );

    // Sonra kalan rota parçaları
    for (
        let i = 0;
        i < coordinates.length - 1;
        i++
    ) {

        const point1 = {

            longitude:
                coordinates[i][0],

            latitude:
                coordinates[i][1]

        };

        const point2 = {

            longitude:
                coordinates[i + 1][0],

            latitude:
                coordinates[i + 1][1]

        };

        totalDistance +=
            calculateDistance(
                point1,
                point2
            );

    }

    return totalDistance;
}
function isBadRoadName(name) {

    if (!name) {
        return true;
    }

    const value =
        name
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (value.length < 4) {
        return true;
    }

    const badNames = [

        "sk",
        "sk.",
        "sok",
        "sok.",

        "cd",
        "cd.",

        "blv",
        "blv.",

        "yol"

    ];

    return badNames.includes(
        value
    );

}

function formatRoadName(name) {

    if (!name) {
        return "";
    }

    let formatted =
        name.trim();

    formatted =
        formatted.replace(
            /\s+SK\.?$/i,
            " SOKAK"
        );

    formatted =
        formatted.replace(
            /\s+SOK\.?$/i,
            " SOKAK"
        );

    formatted =
        formatted.replace(
            /\s+CD\.?$/i,
            " CADDESİ"
        );

    formatted =
        formatted.replace(
            /\s+CAD\.?$/i,
            " CADDESİ"
        );

    formatted =
        formatted.replace(
            /\s+BLV\.?$/i,
            " BULVARI"
        );

    return formatted;
}
function getNearestPointOnRoute(
    point,
    coordinates
) {

    if (
        !coordinates ||
        coordinates.length < 2
    ) {

        return null;

    }

    const referenceLatitude =
        point.latitude *
        Math.PI / 180;

    const metersPerLongitude =
        111320 *
        Math.cos(
            referenceLatitude
        );

    const metersPerLatitude =
        110540;

    let bestPoint = null;

    let bestDistance =
        Infinity;

    const searchLimit =
    Math.min(
        coordinates.length - 1,
        40
    );

for (
    let i = 0;
    i < searchLimit;
    i++
) {

        const first =
            coordinates[i];

        const second =
            coordinates[i + 1];

        const ax =
            (
                first[0] -
                point.longitude
            ) *
            metersPerLongitude;

        const ay =
            (
                first[1] -
                point.latitude
            ) *
            metersPerLatitude;

        const bx =
            (
                second[0] -
                point.longitude
            ) *
            metersPerLongitude;

        const by =
            (
                second[1] -
                point.latitude
            ) *
            metersPerLatitude;

        const dx =
            bx - ax;

        const dy =
            by - ay;

        const lengthSquared =
            dx * dx +
            dy * dy;

        let t = 0;

        if (
            lengthSquared > 0
        ) {

            t =
                -(
                    ax * dx +
                    ay * dy
                ) /
                lengthSquared;

            t =
                Math.max(
                    0,
                    Math.min(
                        1,
                        t
                    )
                );

        }

        const nearestX =
            ax +
            t * dx;

        const nearestY =
            ay +
            t * dy;

        const distance =
            Math.sqrt(
                nearestX *
                nearestX +
                nearestY *
                nearestY
            );

        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            bestPoint = {

                longitude:
                    point.longitude +
                    nearestX /
                    metersPerLongitude,

                latitude:
                    point.latitude +
                    nearestY /
                    metersPerLatitude,

                distance:
                    distance

            };

        }

    }

    return bestPoint;
}
function updateNavigationRoad(
    step,
    stepIndex,
    roadElement
) {

    if (
        !roadElement ||
        !step
    ) {

        return;

    }

    // Aynı manevradaysak
    // mevcut adı değiştirme.
    if (
        lastRoadLookupStep ===
        stepIndex
    ) {

        if (
            !isBadRoadName(
                currentRoadName
            )
        ) {

            roadElement.textContent =
    formatRoadName(
        currentRoadName
    ).toLocaleUpperCase(
        "tr-TR"
    );

            roadElement.style.display =
                "block";

        }

        return;

    }

    // =========================
    // YENİ MANEVRA
    // =========================

    roadLookupRequestId++;
    lastRoadLookupStep =
        stepIndex;

    const osrmRoadName =

        step.name ||

        step.ref ||

        step.destinations ||

        "";

    // OSRM düzgün isim verdiyse
    // direkt kullan.
    if (
        !isBadRoadName(
            osrmRoadName
        )
    ) {

        currentRoadName =
            osrmRoadName;

        roadElement.textContent =
    formatRoadName(
        currentRoadName
    ).toLocaleUpperCase(
        "tr-TR"
    );

        roadElement.style.display =
            "block";

        return;

    }

    // =========================
    // OSRM İSİM VERMEDİ
    // PHOTON'A SOR
    // =========================

    if (
        !step.maneuver ||
        !step.maneuver.location
    ) {

        return;

    }

    const longitude =
        step.maneuver.location[0];

    const latitude =
        step.maneuver.location[1];

    roadLookupRequestId++;

    const thisRequest =
        roadLookupRequestId;

    findRoadNameFromLocation(
        longitude,
        latitude
    ).then(

        function (foundRoad) {

            // Bu sırada başka
            // manevraya geçtiysek
            // eski sonucu kullanma.
            if (
                thisRequest !==
                roadLookupRequestId
            ) {

                return;

            }

            if (
                stepIndex !==
                currentStepIndex
            ) {

                return;

            }

            if (
                isBadRoadName(
                    foundRoad
                )
            ) {

                return;

            }

            currentRoadName =
                foundRoad;

            roadElement.textContent =
    formatRoadName(
        currentRoadName
    ).toLocaleUpperCase(
        "tr-TR"
    );

            roadElement.style.display =
                "block";

        }

    );

}
function updateNavigationStats(position) {

    const speedValue =
        document.getElementById(
            "speedValue"
        );

    const routeTime =
        document.getElementById(
            "routeTime"
        );

    const routeDistance =
        document.getElementById(
            "routeDistance"
        );

    const roadElement =
        document.getElementById(
            "navigationRoad"
        );

    // =========================
    // HIZ
    // =========================

    let speedKmh = 0;

    if (
        position.coords.speed !== null &&
        Number.isFinite(
            position.coords.speed
        ) &&
        position.coords.speed >= 0
    ) {

        speedKmh =
            position.coords.speed *
            3.6;

    }

    else {

        const now =
            Date.now();

        if (
            lastSpeedLocation !== null &&
            lastSpeedTime !== null
        ) {

            const seconds =
                (
                    now -
                    lastSpeedTime
                ) / 1000;

            if (
                seconds >= 0.5 &&
                seconds <= 10
            ) {

                const moved =
                    calculateDistance(
                        lastSpeedLocation,
                        currentLocation
                    );

                speedKmh =
                    (
                        moved /
                        seconds
                    ) *
                    3.6;

            }

        }

        lastSpeedTime =
            now;

        lastSpeedLocation = {

            latitude:
                currentLocation.latitude,

            longitude:
                currentLocation.longitude

        };

    }

    // Küçük GPS titreşimlerini
    // hız olarak gösterme
    if (speedKmh < 2) {

        speedKmh = 0;

    }

    // GPS sapması saçma değer üretmesin
    speedKmh =
        Math.min(
            speedKmh,
            250
        );

    if (speedValue) {

        speedValue.textContent =
            Math.round(
                speedKmh
            );

    }

    // =========================
    // KALAN MESAFE / SÜRE
    // =========================

    if (
        navigationMode &&
        currentRouteCoordinates.length > 1
    ) {

        const remainingDistance =
            calculateRemainingRouteDistance(
                currentRouteCoordinates
            );

        if (routeDistance) {

            if (
                remainingDistance >=
                1000
            ) {

                routeDistance.textContent =
                    (
                        remainingDistance /
                        1000
                    ).toFixed(1) +
                    " KM";

            }

            else {

                routeDistance.textContent =
                    Math.max(
                        0,
                        Math.round(
                            remainingDistance /
                            10
                        ) * 10
                    ) +
                    " M";

            }

        }

        if (
            routeTime &&
            currentRouteTotalDistance > 0 &&
            currentRouteTotalDuration > 0
        ) {

            const ratio =
                Math.min(
                    1,
                    remainingDistance /
                    currentRouteTotalDistance
                );

            const remainingSeconds =
                currentRouteTotalDuration *
                ratio;

            const remainingMinutes =
                Math.max(
                    1,
                    Math.ceil(
                        remainingSeconds /
                        60
                    )
                );

            routeTime.textContent =
                remainingMinutes +
                " DK";

        }

    }

    // =========================
    // BULUNDUĞUN YOL
    // =========================

    if (roadElement) {

        const currentRoadStep =
            navigationSteps[
                Math.max(
                    0,
                    currentStepIndex - 1
                )
            ];

        const nextRoadStep =
            navigationSteps[
                currentStepIndex
            ];

        const roadName =

            (
                currentRoadStep &&
                currentRoadStep.name
            )

                ? currentRoadStep.name

                : (
                    nextRoadStep &&
                    nextRoadStep.name
                )

                    ? nextRoadStep.name

                    : "";

        if (roadName.trim() !== "") {

            roadElement.textContent =
    formatRoadName(
        currentRoadName
    ).toLocaleUpperCase(
        "tr-TR"
    );

            roadElement.style.display =
                "block";

        }

        else {

            roadElement.textContent =
                "";

            roadElement.style.display =
                "none";

        }

    }

}
    function calculateBearing(point1, point2) {

    const lat1 =
        point1.latitude * Math.PI / 180;

    const lat2 =
        point2.latitude * Math.PI / 180;

    const deltaLon =
        (point2.longitude - point1.longitude) *
        Math.PI / 180;

    const y =
        Math.sin(deltaLon) *
        Math.cos(lat2);

    const x =
        Math.cos(lat1) *
        Math.sin(lat2) -

        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(deltaLon);

    let bearing =
        Math.atan2(y, x) *
        180 / Math.PI;

    bearing =
        (bearing + 360) % 360;

    return bearing;
}
function smoothAngle(
    currentAngle,
    targetAngle,
    amount
) {

    const difference =
        (
            (
                targetAngle -
                currentAngle +
                540
            ) % 360
        ) - 180;

    return (
        currentAngle +
        difference * amount +
        360
    ) % 360;
}
function getCameraLookAheadPoint(
    distanceMeters
) {

    if (
        !currentRouteCoordinates ||
        currentRouteCoordinates.length < 2
    ) {
        return null;
    }


    let travelledDistance = 0;


    for (
        let i = 0;
        i <
        currentRouteCoordinates.length - 1;
        i++
    ) {

        const pointA = {

            longitude:
                currentRouteCoordinates[i][0],

            latitude:
                currentRouteCoordinates[i][1]

        };


        const pointB = {

            longitude:
                currentRouteCoordinates[i + 1][0],

            latitude:
                currentRouteCoordinates[i + 1][1]

        };


        travelledDistance +=
            calculateDistance(
                pointA,
                pointB
            );


        if (
            travelledDistance >=
            distanceMeters
        ) {

            return pointB;

        }

    }


    const lastPoint =
        currentRouteCoordinates[
            currentRouteCoordinates.length - 1
        ];


    return {

        longitude:
            lastPoint[0],

        latitude:
            lastPoint[1]

    };

}
function updatePlayerDirection() {

    if (!playerMarker) {
        return;
    }


    const markerElement =
        playerMarker.getElement();


    const markerImage =
        markerElement.querySelector(
            ".playerMarkerImage"
        );


    if (!markerImage) {
        return;
    }


    let heading =
        null;


    /* Önce telefon pusulası */

    if (
        deviceHeading !== null &&
        Number.isFinite(
            deviceHeading
        )
    ) {

        heading =
            deviceHeading;

    }


    /* Pusula yoksa GPS yönü */

    else if (
        lastGpsHeading !== null &&
        Number.isFinite(
            lastGpsHeading
        )
    ) {

        heading =
            lastGpsHeading;

    }


    if (
        heading === null ||
        !Number.isFinite(
            heading
        )
    ) {

        markerImage.style.transform =
            "rotate(0deg)";

        return;

    }


    const mapBearing =
        map.getBearing();


    let relativeHeading =
        heading -
        mapBearing;


    relativeHeading =
        (
            relativeHeading +
            360
        ) % 360;


    markerImage.style.transform =
        `rotate(${relativeHeading}deg)`;

}
function handleDeviceOrientation(event) {

    let heading = null;

    // iPhone / Safari
    if (
        typeof event.webkitCompassHeading ===
        "number"
    ) {

        heading =
            event.webkitCompassHeading;

    }

    // Diğer telefonlar
    else if (
        event.absolute &&
        typeof event.alpha ===
        "number"
    ) {

        heading =
            (
                360 -
                event.alpha
            ) % 360;

    }

    if (
    heading !== null &&
    Number.isFinite(heading)
) {

    deviceHeading =
        heading;

    updatePlayerDirection();

}

}
function startHeadingListener() {

    if (headingListenerStarted) {
        return;
    }

    window.addEventListener(
        "deviceorientation",
        handleDeviceOrientation,
        true
    );

    window.addEventListener(
        "deviceorientationabsolute",
        handleDeviceOrientation,
        true
    );

    headingListenerStarted = true;
}
function getStableGpsLocation(position) {

    const rawLocation = {

        latitude:
            position.coords.latitude,

        longitude:
            position.coords.longitude

    };


    const accuracy =
        Number.isFinite(
            position.coords.accuracy
        )
            ? position.coords.accuracy
            : 999;


    const now =
        position.timestamp || Date.now();


    /* =====================================
       HAM GPS HIZINI BUL
       ===================================== */

    let measuredSpeed = null;


    if (
        position.coords.speed !== null &&
        Number.isFinite(
            position.coords.speed
        ) &&
        position.coords.speed >= 0
    ) {

        measuredSpeed =
            position.coords.speed;

    }


    else if (
        lastRawGpsLocation !== null &&
        lastRawGpsTime !== null
    ) {

        const rawElapsed =
            Math.max(
                (
                    now -
                    lastRawGpsTime
                ) / 1000,
                0.5
            );


        const rawDistance =
            calculateDistance(
                lastRawGpsLocation,
                rawLocation
            );


        measuredSpeed =
            rawDistance /
            rawElapsed;

    }


    else {

        measuredSpeed = 0;

    }


    // Aşırı saçma GPS hızlarını sınırla
    measuredSpeed =
        Math.max(
            0,
            Math.min(
                measuredSpeed,
                55
            )
        );


    /* =====================================
       HIZI YUMUŞAT
       ===================================== */

    lastReliableSpeed =

        lastReliableSpeed * 0.65 +

        measuredSpeed * 0.35;


    /* =====================================
       HAM NOKTAYI KAYDET
       ===================================== */

    lastRawGpsLocation = {
        ...rawLocation
    };

    lastRawGpsTime =
        now;


    /* =====================================
       İLK GPS NOKTASI
       ===================================== */

    if (
        stableGpsLocation === null
    ) {

        stableGpsLocation = {
            ...rawLocation
        };

        lastStableGpsTime =
            now;

        return {
            ...stableGpsLocation
        };

    }


    const elapsed =

        Math.max(
            (
                now -
                lastStableGpsTime
            ) / 1000,
            0.5
        );


    const distance =

        calculateDistance(
            stableGpsLocation,
            rawLocation
        );


    /* =====================================
       ÇOK KÖTÜ GPS NOKTASINI REDDET
       ===================================== */

    if (
        accuracy > 80
    ) {

        return {
            ...stableGpsLocation
        };

    }


    /* =====================================
       DURUYORKEN GPS TİTREŞİMİNİ ENGELLE
       ===================================== */

    const stationaryRadius =

        Math.max(
            8,
            Math.min(
                accuracy * 0.65,
                20
            )
        );


    if (
        lastReliableSpeed < 1.1 &&
        distance < stationaryRadius
    ) {

        return {
            ...stableGpsLocation
        };

    }


    /* =====================================
       DURUYORKEN BÜYÜK GPS SIÇRAMASI
       ===================================== */

    if (
        lastReliableSpeed < 1.1 &&
        distance > 45 &&
        elapsed < 6
    ) {

        return {
            ...stableGpsLocation
        };

    }


    /* =====================================
       HAREKET HALİNDE İMKANSIZ SIÇRAMA
       ===================================== */

    const maximumExpectedDistance =

        Math.max(
            35,
            lastReliableSpeed *
                elapsed *
                3 +
                accuracy
        );


    if (
        distance >
            maximumExpectedDistance &&
        accuracy > 20
    ) {

        return {
            ...stableGpsLocation
        };

    }


    /* =====================================
       ADAPTİF SMOOTHING
       ===================================== */

    let smoothing;


    // Araç hızı
    if (
        lastReliableSpeed > 8
    ) {

        smoothing = 0.72;

    }

    // Bisiklet / hızlı hareket
    else if (
        lastReliableSpeed > 3
    ) {

        smoothing = 0.55;

    }

    // Yürüme
    else if (
        lastReliableSpeed > 1.1
    ) {

        smoothing = 0.40;

    }

    // Çok yavaş / durma
    else {

        smoothing = 0.20;

    }


    /* GPS doğruluğu kötüyse
       yeni noktaya daha az güven */

    if (
        accuracy > 35
    ) {

        smoothing *= 0.50;

    }

    else if (
        accuracy > 20
    ) {

        smoothing *= 0.72;

    }


    /* =====================================
       STABİL KONUMU GÜNCELLE
       ===================================== */

    stableGpsLocation.latitude +=

        (
            rawLocation.latitude -
            stableGpsLocation.latitude
        ) *
        smoothing;


    stableGpsLocation.longitude +=

        (
            rawLocation.longitude -
            stableGpsLocation.longitude
        ) *
        smoothing;


    lastStableGpsTime =
        now;


    return {
        ...stableGpsLocation
    };

}
async function requestHeadingPermission() {

    try {

        if (
            typeof DeviceOrientationEvent !==
            "undefined" &&

            typeof DeviceOrientationEvent
                .requestPermission ===
            "function"
        ) {

            const permission =
                await DeviceOrientationEvent
                    .requestPermission();

            if (
                permission ===
                "granted"
            ) {

                startHeadingListener();

            }

        }

        else {

            startHeadingListener();

        }

    }

    catch (error) {

        console.log(
            "Pusula kullanılamadı:",
            error
        );

    }

}
async function findRoadNameFromLocation(
    longitude,
    latitude
) {

    try {

        const result =
            await GameServices
                .reverseGeocode(
                    longitude,
                    latitude
                );


        if (!result) {

            return "";

        }


        const properties =
            result.properties || {};


        return (

            properties.street ||

            properties.name ||

            properties.locality ||

            ""

        );

    }

    catch (error) {

        console.log(
            "Yol adı bulunamadı:",
            error
        );


        return "";

    }

}
function goToMyLocation() {

    if (currentLocation === null) {
        return;
    }

    // Navigasyon açıksa
    if (navigationMode) {

        let bearing =
            smoothCameraBearing !== null
                ? smoothCameraBearing
                : map.getBearing();

        if (deviceHeading !== null) {

            bearing =
                deviceHeading;

        }

        else if (lastGpsHeading !== null) {

            bearing =
                lastGpsHeading;

        }

        map.easeTo({

            center: [
                currentLocation.longitude,
                currentLocation.latitude
            ],

            zoom: 17.3,

            pitch: 60,

            bearing: bearing,

            offset: [
                0,
                window.innerHeight * 0.18
            ],

            duration: 700,

            essential: true

        });

    }

    // Normal haritadaysak
    else {

        map.easeTo({

            center: [
                currentLocation.longitude,
                currentLocation.latitude
            ],

            zoom: 16,

            pitch: 0,

            bearing: 0,

            offset: [0, 0],

            duration: 700,

            essential: true

        });

    }

}
function distanceToRoute(point, coordinates) {

    if (!coordinates || coordinates.length < 2) {
        return Infinity;
    }

    const referenceLatitude =
        point.latitude * Math.PI / 180;

    const metersPerLongitude =
        111320 * Math.cos(referenceLatitude);

    const metersPerLatitude =
        110540;

    let minimumDistance =
        Infinity;

    for (
        let i = 0;
        i < coordinates.length - 1;
        i++
    ) {

        const first =
            coordinates[i];

        const second =
            coordinates[i + 1];

        // GPS konumunu 0,0 kabul ediyoruz.
        // Yol parçasının iki ucunu metreye çeviriyoruz.

        const ax =
            (first[0] - point.longitude) *
            metersPerLongitude;

        const ay =
            (first[1] - point.latitude) *
            metersPerLatitude;

        const bx =
            (second[0] - point.longitude) *
            metersPerLongitude;

        const by =
            (second[1] - point.latitude) *
            metersPerLatitude;

        const dx =
            bx - ax;

        const dy =
            by - ay;

        const lengthSquared =
            dx * dx + dy * dy;

        let t = 0;

        if (lengthSquared > 0) {

            t =
                -(ax * dx + ay * dy) /
                lengthSquared;

            t =
                Math.max(
                    0,
                    Math.min(1, t)
                );

        }

        const nearestX =
            ax + t * dx;

        const nearestY =
            ay + t * dy;

        const distance =
            Math.sqrt(
                nearestX * nearestX +
                nearestY * nearestY
            );

        if (distance < minimumDistance) {

            minimumDistance =
                distance;

        }

    }

    return minimumDistance;
}
function findNearestRouteIndex(
    point,
    coordinates
) {

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    const searchLimit =
    Math.min(
        coordinates.length,
        40
    );

for (
    let i = 0;
    i < searchLimit;
    i++
) {

        const routePoint = {

            longitude:
                coordinates[i][0],

            latitude:
                coordinates[i][1]

        };

        const distance =
            calculateDistance(
                point,
                routePoint
            );

        if (
            distance <
            nearestDistance
        ) {

            nearestDistance =
                distance;

            nearestIndex =
                i;

        }

    }

    return nearestIndex;
}

function updateRouteProgress() {
    const progressTolerance =
    selectedRouteMode === "walk"
        ? 20
        : selectedRouteMode === "bike"
            ? 25
            : 30;


if (
    !gpsIsFresh() ||
    lastGpsAccuracy > 35 ||
    !currentLocation ||
    distanceToRoute(
        currentLocation,
        currentRouteCoordinates
    ) > progressTolerance
) {

    return;

}

    if (
        !navigationMode ||
        currentRouteCoordinates.length < 2
    ) {
        return;
    }

    const nearestIndex =
        findNearestRouteIndex(
            currentLocation,
            currentRouteCoordinates
        );

    // Geçtiğimiz rota bölümünü at
    if (nearestIndex > 0) {

        currentRouteCoordinates =
            currentRouteCoordinates.slice(
                nearestIndex
            );

    }

    // Haritadaki mor çizgiyi güncelle
    const routeSource =
        map.getSource("route");

    if (
        routeSource &&
        currentRouteCoordinates.length > 1
    ) {

        routeSource.setData({

            type: "Feature",

            properties: {},

            geometry: {

                type: "LineString",

                coordinates:
                    currentRouteCoordinates

            }

        });

    }

}
function finishNavigation() {
    invalidateRouteRequest();
    stopNavigationExtras();
    speakText("Hedefe ulaştın");
    routePreviewReady = false;
    routeButton.textContent = "ROTA";
    document.getElementById("routeChoices").replaceChildren();

    navigationMode = false;
    document.body.classList.remove(
    "navigation-active"
);
const speedHud =
    document.getElementById(
        "speedHud"
    );

if (speedHud) {

    speedHud.style.display =
        "none";

}

currentRoadName = "";

lastRoadLookupStep = -1;

roadLookupRequestId++;
const roadElement =
    document.getElementById(
        "navigationRoad"
    );

if (roadElement) {

    roadElement.textContent =
        "";

    roadElement.style.display =
        "none";

}

lastSpeedLocation = null;
lastSpeedTime = null;
    currentRouteCoordinates = [];
    navigationSteps = [];

    currentStepIndex = 0;
    offRouteCount = 0;

    lastHeadingLocation = null;
    lastRouteUpdateLocation = null;
    smoothCameraLocation = null;
smoothCameraBearing = null;

    // Rota çizgilerini kaldır
    if (map.getLayer("route-line")) {
        map.removeLayer("route-line");
    }

    if (map.getLayer("route-outline")) {
        map.removeLayer("route-outline");
    }

    if (map.getSource("route")) {
        map.removeSource("route");
    }

    // Hedef waypointini kaldır
    if (destinationMarker) {

        destinationMarker.remove();

        destinationMarker = null;

    }

    destinationLocation = null;

    // Süre / mesafe kutusunu gizle
    const routeInfo =
        document.getElementById("routeInfo");

    if (routeInfo) {
        routeInfo.style.display = "none";
    }

    // Hedefe ulaştın mesajı
    const instructionBox =
        document.getElementById(
            "navigationInstruction"
        );

    if (instructionBox) {

    const arrowElement =
        document.getElementById(
            "navigationArrow"
        );

    const distanceElement =
        document.getElementById(
            "navigationDistance"
        );

    const actionElement =
        document.getElementById(
            "navigationAction"
        );

    if (arrowElement) {
        arrowElement.innerHTML =
    getDirectionIcon({
        type: "arrive"
    });
    }

    if (distanceElement) {
        distanceElement.textContent =
            "";
    }

    if (actionElement) {
        actionElement.textContent =
            "HEDEFE ULAŞTIN";
    }

    instructionBox.style.display =
        "flex";

    arrivalMessageTimer = setTimeout(function () {

        instructionBox.style.display =
            "none";

    }, 3000);

}

    // Haritayı normal görünüme döndür
    if (currentLocation !== null) {

        map.easeTo({

            center: [
                currentLocation.longitude,
                currentLocation.latitude
            ],

            zoom: 15,

            pitch: 0,

            bearing: 0,

            offset: [0, 0],

            duration: 1000

        });

    }

}
function cancelNavigation() {
    invalidateRouteRequest();
    stopNavigationExtras();
    clearTimeout(arrivalMessageTimer);
    document.getElementById("routeChoices").replaceChildren();

    navigationMode = false;

    routePreviewReady = false;
    const speedHud =
    document.getElementById(
        "speedHud"
    );

if (speedHud) {

    speedHud.style.display =
        "none";

}

currentRoadName = "";

lastRoadLookupStep = -1;

roadLookupRequestId++;
const roadElement =
    document.getElementById(
        "navigationRoad"
    );

if (roadElement) {

    roadElement.textContent =
        "";

    roadElement.style.display =
        "none";

}

lastSpeedLocation = null;
lastSpeedTime = null;

    document.body.classList.remove(
        "navigation-active"
    );

    currentRouteCoordinates = [];
    navigationSteps = [];

    currentStepIndex = 0;
    offRouteCount = 0;

    lastHeadingLocation = null;
    lastRouteUpdateLocation = null;
    smoothCameraLocation = null;
smoothCameraBearing = null;

    // Rota çizgisini kaldır
    if (map.getLayer("route-line")) {
        map.removeLayer("route-line");
    }

    if (map.getLayer("route-outline")) {
        map.removeLayer("route-outline");
    }

    if (map.getSource("route")) {
        map.removeSource("route");
    }

    // Süre / mesafe kutusunu gizle
    const routeInfo =
        document.getElementById(
            "routeInfo"
        );

    if (routeInfo) {
        routeInfo.style.display =
            "none";
    }

    // Yön kutusunu gizle
    const instructionBox =
        document.getElementById(
            "navigationInstruction"
        );

    if (instructionBox) {
        instructionBox.style.display =
            "none";
    }

    // Butonu tekrar ROTA yap
    routeButton.textContent =
        "ROTA";

    // Haritayı normal hale getir
    if (currentLocation !== null) {

        map.easeTo({

            center: [
                currentLocation.longitude,
                currentLocation.latitude
            ],

            zoom: 14.5,

            pitch: 0,
            bearing: 0,

            offset: [0, 0],

            duration: 800

        });

    }

}

// =========================
// DÖNÜŞ YAZISI
// =========================

function getDirectionText(maneuver) {

    const modifier = maneuver.modifier;
    const type = maneuver.type;

    if (type === "arrive") {
        return "Hedefe devam et";
    }

    if (
    [
        "roundabout",
        "rotary",
        "roundabout turn",
        "exit roundabout",
        "exit rotary"
    ].includes(type)
) {

    if (
        Number.isFinite(
            maneuver.exit
        )
    ) {

        return (
            "Döner kavşakta " +
            maneuver.exit +
            ". çıkışı kullan"
        );

    }

    return "Döner kavşağa gir";

}

    if (modifier === "right") {
        return "Sağa dön";
    }

    if (modifier === "left") {
        return "Sola dön";
    }

    if (modifier === "slight right") {
        return "Hafif sağa dön";
    }

    if (modifier === "slight left") {
        return "Hafif sola dön";
    }

    if (modifier === "sharp right") {
        return "Keskin sağa dön";
    }

    if (modifier === "sharp left") {
        return "Keskin sola dön";
    }

    if (modifier === "straight") {
        return "Düz devam et";
    }

    return "Devam et";
}
function getDirectionIcon(maneuver) {

    const modifier =
        maneuver?.modifier || "";

    const type =
        maneuver?.type || "";

const roundaboutTypes = [
    "roundabout",
    "rotary",
    "roundabout turn",
    "exit roundabout",
    "exit rotary"
];


if (
    modifier === "straight" ||
    type === "continue" ||
    type === "new name"
) {

    return `
        <svg
            class="maneuverIcon"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
        >

            <path
                d="
                    M32 55
                    V13
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
            />

            <path
                d="
                    M19 27
                    L32 13
                    L45 27
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

        </svg>
    `;

}
    const svgStart = `
        <svg
            class="maneuverIcon"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
    `;

    const svgEnd =
        `</svg>`;


    // =========================
    // HEDEFE VARIŞ
    // =========================

    if (type === "arrive") {

        return `
            ${svgStart}

            <path
                d="
                    M32 8
                    L56 32
                    L32 56
                    L8 32
                    Z
                "
                fill="currentColor"
            />

            <circle
                cx="32"
                cy="32"
                r="7"
                fill="#111111"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // DÖNER KAVŞAK
    // =========================

    if (
    roundaboutTypes.includes(
        type
    )
) {

    return `
        <svg
            class="maneuverIcon"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
        >

            <circle
                cx="32"
                cy="32"
                r="15"
                fill="none"
                stroke="currentColor"
                stroke-width="7"
            />

            <path
                d="
                    M32 7
                    L42 17
                    L32 27
                "
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M32 8
                    V17
                "
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                stroke-linecap="round"
            />

        </svg>
    `;

}


    // =========================
    // U DÖNÜŞÜ
    // =========================

    if (
        modifier === "uturn" ||
        modifier === "u-turn"
    ) {

        return `
            ${svgStart}

            <path
                d="
                    M45 53
                    V29
                    C45 18
                    39 12
                    30 12
                    C20 12
                    14 19
                    14 30
                "
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M5 22
                    L14 31
                    L23 22
                "
                fill="none"
                stroke="currentColor"
                stroke-width="7"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // SAĞA DÖN
    // =========================

    if (modifier === "right") {

        return `
            ${svgStart}

            <path
                d="
                    M18 53
                    V35
                    C18 25
                    24 21
                    34 21
                    H49
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M39 11
                    L50 21
                    L39 31
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // SOLA DÖN
    // =========================

    if (modifier === "left") {

        return `
            ${svgStart}

            <path
                d="
                    M46 53
                    V35
                    C46 25
                    40 21
                    30 21
                    H15
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M25 11
                    L14 21
                    L25 31
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // HAFİF SAĞ
    // =========================

    if (modifier === "slight right") {

        return `
            ${svgStart}

            <path
                d="
                    M19 53
                    C20 37
                    27 27
                    45 17
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
            />

            <path
                d="
                    M33 14
                    L47 16
                    L43 30
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // HAFİF SOL
    // =========================

    if (modifier === "slight left") {

        return `
            ${svgStart}

            <path
                d="
                    M45 53
                    C44 37
                    37 27
                    19 17
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
            />

            <path
                d="
                    M31 14
                    L17 16
                    L21 30
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // KESKİN SAĞ
    // =========================

    if (modifier === "sharp right") {

        return `
            ${svgStart}

            <path
                d="
                    M18 53
                    V22
                    H49
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M39 12
                    L50 22
                    L39 32
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // KESKİN SOL
    // =========================

    if (modifier === "sharp left") {

        return `
            ${svgStart}

            <path
                d="
                    M46 53
                    V22
                    H15
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="
                    M25 12
                    L14 22
                    L25 32
                "
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${svgEnd}
        `;

    }


    // =========================
    // DÜZ DEVAM
    // =========================

    return `
        ${svgStart}

        <path
            d="
                M32 54
                V14
            "
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            stroke-linecap="round"
        />

        <path
            d="
                M19 27
                L32 13
                L45 27
            "
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            stroke-linecap="round"
            stroke-linejoin="round"
        />

        ${svgEnd}
    `;

}

// =========================
// CANLI YÖNLENDİRME
// =========================

function updateLiveInstruction(latitude, longitude) {
    if (!navigationMode) return;

    const instructionBox =
        document.getElementById(
            "navigationInstruction"
        );

    const arrowElement =
        document.getElementById(
            "navigationArrow"
        );

    const distanceElement =
        document.getElementById(
            "navigationDistance"
        );

    const actionElement =
        document.getElementById(
            "navigationAction"
        );
    
    const roadElement =
    document.getElementById(
        "navigationRoad"
    );

    if (
        !instructionBox ||
        !arrowElement ||
        !distanceElement ||
        !actionElement ||
        navigationSteps.length === 0
    ) {
        return;
    }

    if (
        currentStepIndex >=
        navigationSteps.length
    ) {

        arrowElement.innerHTML =
    getDirectionIcon({
        type: "arrive"
    });

        distanceElement.textContent =
            "";

        actionElement.textContent =
            "HEDEFE ULAŞTIN";

        return;
    }

    const step =
        navigationSteps[
            currentStepIndex
        ];
    updateNavigationRoad(
    step,
    currentStepIndex,
    roadElement
);    

    if (
        !step.maneuver ||
        !step.maneuver.location
    ) {
        return;
    }

    const maneuverLocation = {

        longitude:
            step.maneuver.location[0],

        latitude:
            step.maneuver.location[1]

    };

    const playerLocation = {

        latitude: latitude,
        longitude: longitude

    };

    const distanceToManeuver =
        calculateDistance(
            playerLocation,
            maneuverLocation
        );

    const directionText =
        getDirectionText(
            step.maneuver
        );

    const directionIcon =
    getDirectionIcon(
        step.maneuver
    );

    instructionBox.classList.remove("turn-now");

    // Manevrayı geçtik
    if (
        distanceToManeuver <= 15 &&
        currentStepIndex <
            navigationSteps.length - 1
    ) {

        currentStepIndex++;

        updateLiveInstruction(
            latitude,
            longitude
        );

        return;
    }

    arrowElement.innerHTML =
    directionIcon;

    speakManeuver(step, distanceToManeuver);

    // Dönüş yakında
    if (distanceToManeuver <= 35) {

    instructionBox.classList.add(
        "turn-now"
    );

    distanceElement.textContent =
        "ŞİMDİ";

    actionElement.textContent =
        directionText.toUpperCase();

}

    else {

        instructionBox.classList.remove(
    "turn-now"
);

        let displayedDistance;

        if (distanceToManeuver >= 1000) {

            displayedDistance =
                (
                    distanceToManeuver /
                    1000
                ).toFixed(1) +
                " KM";

        }

        else {

            const roundedDistance =
                Math.max(
                    10,
                    Math.round(
                        distanceToManeuver /
                        10
                    ) * 10
                );

            displayedDistance =
                roundedDistance +
                " M";

        }

        distanceElement.textContent =
            displayedDistance;

        actionElement.textContent =
            directionText.toUpperCase();

    }

    instructionBox.style.display =
        "flex";
}
// =========================
// YER ARAMA
// =========================

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

let destinationMarker = null;
let destinationLocation = null;
let searchMapResults = [];


function clearSearchMapMarkers() {

    searchMapResults = [];


    const source =
        map.getSource(
            "search-results"
        );


    if (source) {

        source.setData({

            type:
                "FeatureCollection",

            features:
                []

        });

    }

}


function setupSearchResultLayers() {

    if (
        !map ||
        !map.isStyleLoaded()
    ) {
        return;
    }


    if (
        !map.getSource(
            "search-results"
        )
    ) {

        map.addSource(
            "search-results",
            {

                type:
                    "geojson",

                data: {

                    type:
                        "FeatureCollection",

                    features:
                        []

                }

            }
        );

    }


    if (
        !map.getLayer(
            "search-results-points"
        )
    ) {

        map.addLayer({

            id:
                "search-results-points",

            type:
                "circle",

            source:
                "search-results",

            paint: {

                "circle-radius":
                    9,

                "circle-color":
                    "#b02a78",

                "circle-stroke-width":
                    3,

                "circle-stroke-color":
                    "#111111"

            }

        });

    }


    if (
        !map.getLayer(
            "search-results-hitbox"
        )
    ) {

        map.addLayer({

            id:
                "search-results-hitbox",

            type:
                "circle",

            source:
                "search-results",

            paint: {

                "circle-radius":
                    18,

                "circle-opacity":
                    0

            }

        });

    }


    map.on(
        "click",
        "search-results-hitbox",
        function (event) {

            const feature =
                event.features?.[0];


            if (!feature) {
                return;
            }


            const resultIndex =
                Number(
                    feature.properties
                        ?.resultIndex
                );


            const result =
                searchMapResults[
                    resultIndex
                ];


            if (!result) {
                return;
            }


            selectPhotonResult(
                result
            );

        }
    );


    map.on(
        "mouseenter",
        "search-results-hitbox",
        function () {

            map.getCanvas()
                .style.cursor =
                "pointer";

        }
    );


    map.on(
        "mouseleave",
        "search-results-hitbox",
        function () {

            map.getCanvas()
                .style.cursor =
                "";

        }
    );

}


function showSearchResultsOnMap(
    results
) {

    if (
        !results ||
        results.length === 0
    ) {

        clearSearchMapMarkers();

        return;

    }


    setupSearchResultLayers();


    const source =
        map.getSource(
            "search-results"
        );


    if (!source) {

        console.error(
            "Arama sonucu source oluşturulamadı."
        );

        return;

    }


    searchMapResults =
        results.slice(
            0,
            6
        );


    const features =
        searchMapResults.map(
            function (
                result,
                index
            ) {

                return {

                    type:
                        "Feature",

                    properties: {

                        resultIndex:
                            index

                    },

                    geometry: {

                        type:
                            "Point",

                        coordinates: [

                            result.geometry
                                .coordinates[0],

                            result.geometry
                                .coordinates[1]

                        ]

                    }

                };

            }
        );


    source.setData({

        type:
            "FeatureCollection",

        features:
            features

    });


    const bounds =
        new maplibregl
            .LngLatBounds();


    features.forEach(
        function (feature) {

            bounds.extend(
                feature.geometry
                    .coordinates
            );

        }
    );


    if (
        features.length === 1
    ) {

        map.easeTo({

            center:
                features[0]
                    .geometry
                    .coordinates,

            zoom:
                16,

            duration:
                700

        });

    }

    else {

        map.fitBounds(
            bounds,
            {

                padding: {

                    top:
                        140,

                    bottom:
                        100,

                    left:
                        70,

                    right:
                        70

                },

                maxZoom:
                    15,

                duration:
                    800

            }
        );

    }

}

// =========================================
// CANLI YER ARAMA
// =========================================

let searchTimer = null;
let searchController = null;


// =========================================
// YAZDIKÇA ARA
// =========================================

searchInput.addEventListener(
    "input",
    function () {

        clearTimeout(
            searchTimer
        );

        cancelSearchRequest();


        const query =
            searchInput.value.trim();


        const searchResults =
            document.getElementById(
                "searchResults"
            );


        if (
            query.length < 2
        ) {

            searchResults.innerHTML =
                "";

            searchResults.style.display =
                "none";

            clearSearchMapMarkers();

            return;

        }


        searchTimer =
            setTimeout(
                function () {

                    searchPlacesLive(
                        query,
                        false
                    );

                },
                400
            );

    }
);


// =========================================
// ARA BUTONU / ENTER
// =========================================

function searchAndShowOnMap(
    event = null
) {

    if (
        event &&
        typeof event.preventDefault ===
            "function"
    ) {

        event.preventDefault();

    }


    const query =
        searchInput.value.trim();


    console.log(
        "ARA TIKLANDI:",
        query
    );


    if (
        query.length < 2
    ) {

        showNotice(
            "En az 2 harf yaz."
        );

        return;

    }


    clearTimeout(
        searchTimer
    );


    searchPlacesLive(
        query,
        true
    );

}


searchButton.addEventListener(
    "click",
    searchAndShowOnMap
);


searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchAndShowOnMap(
                event
            );

        }

    }
);
async function searchPlacesLive(
    query,
    showOnMap = false
) {

    const searchResults =
        document.getElementById(
            "searchResults"
        );

    // Eski istek hâlâ devam ediyorsa iptal et
    if (searchController) {

        searchController.abort();

    }

    searchController = new AbortController();
    const controller = searchController;
    const requestId = ++searchRequestId;
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    searchButton.textContent = "…";

    try {

        let results =
    await GameServices.searchPlaces(
        query,
        currentLocation,
        {

            signal:
                controller.signal,

            limit:
                20

        }
    );

// SONUÇLARI KONUMA GÖRE SIRALA
// =========================

if (
    currentLocation !== null &&
    results.length > 1
) {

    results.sort(
        function (a, b) {

            const locationA = {

                longitude:
                    a.geometry.coordinates[0],

                latitude:
                    a.geometry.coordinates[1]

            };

            const locationB = {

                longitude:
                    b.geometry.coordinates[0],

                latitude:
                    b.geometry.coordinates[1]

            };

            const distanceA =
                calculateDistance(
                    currentLocation,
                    locationA
                );

            const distanceB =
                calculateDistance(
                    currentLocation,
                    locationB
                );

            return (
                distanceA -
                distanceB
            );

        }
    );
}
// En yakın 6 sonucu göster
// =========================
// AYNI MEKANLARI TEMİZLE
// =========================

const uniqueResults = [];

results.forEach(
    function (result) {

        const properties =
            result.properties || {};

        const resultName =
            (
                properties.name ||
                properties.street ||
                properties.city ||
                ""
            )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

        const resultLocation = {

            longitude:
                result.geometry.coordinates[0],

            latitude:
                result.geometry.coordinates[1]

        };

        const isDuplicate =
            uniqueResults.some(
                function (existing) {

                    const existingProperties =
                        existing.properties || {};

                    const existingName =
                        (
                            existingProperties.name ||
                            existingProperties.street ||
                            existingProperties.city ||
                            ""
                        )
                        .trim()
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                    // İsim farklıysa
                    // aynı mekan değildir
                    if (
                        resultName !==
                        existingName
                    ) {

                        return false;

                    }

                    const existingLocation = {

                        longitude:
                            existing.geometry.coordinates[0],

                        latitude:
                            existing.geometry.coordinates[1]

                    };

                    const distance =
                        calculateDistance(
                            resultLocation,
                            existingLocation
                        );

                    // Aynı isim +
                    // 80 metreden yakınsa
                    // duplicate kabul et
                    return distance <= 80;

                }
            );

        if (!isDuplicate) {

            uniqueResults.push(
                result
            );

        }

    }
);

// Temizlenmiş sonuçlardan
// en yakın 6 tanesini göster
results =
    uniqueResults.slice(
        0,
        6
    );
    console.log(
    "Arama sonucu:",
    results.length,
    "Haritada göster:",
    showOnMap
);


if (
    showOnMap &&
    results.length > 0
) {

    showSearchResultsOnMap(
        results
    );

}
    if (showOnMap) {

    showSearchResultsOnMap(
        results
    );

}

        if (requestId !== searchRequestId || controller.signal.aborted) return;
        searchResults.innerHTML = "";

        if (results.length === 0) {

            const emptyItem =
                document.createElement(
                    "div"
                );

            emptyItem.className =
                "searchResultItem";

            emptyItem.textContent =
                "Sonuç bulunamadı";

            searchResults.appendChild(
                emptyItem
            );

            searchResults.style.display =
                "block";

            return;

        }

        results.forEach(
            function (result) {

                const properties =
                    result.properties || {};

                const name =
                    properties.name ||
                    properties.street ||
                    properties.city ||
                    "İsimsiz yer";

                const addressParts = [];

                if (
                    properties.street &&
                    properties.street !== name
                ) {

                    addressParts.push(
                        properties.street
                    );

                }

                if (properties.district) {

                    addressParts.push(
                        properties.district
                    );

                }

                if (
                    properties.city &&
                    properties.city !== name
                ) {

                    addressParts.push(
                        properties.city
                    );

                }

                if (properties.state) {

                    addressParts.push(
                        properties.state
                    );

                }

                if (properties.country) {

                    addressParts.push(
                        properties.country
                    );

                }

                const item =
                    document.createElement(
                        "div"
                    );

                item.className = "searchResultItem";
                item.tabIndex = 0;
                item.setAttribute("role", "button");
                item.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectPhotonResult(result);
                    }
                });
let resultDistanceText = "";

if (
    currentLocation !== null
) {

    const resultLocation = {

        longitude:
            result.geometry.coordinates[0],

        latitude:
            result.geometry.coordinates[1]

    };

    const resultDistance =
        calculateDistance(
            currentLocation,
            resultLocation
        );

    if (
        resultDistance < 1000
    ) {

        resultDistanceText =
            Math.round(
                resultDistance
            ) +
            " m";

    }

    else {

        resultDistanceText =
            (
                resultDistance /
                1000
            ).toFixed(1) +
            " km";

    }

}

                const nameElement =
                    document.createElement(
                        "span"
                    );

                nameElement.className =
                    "searchResultName";

                nameElement.textContent =
                    name;

                const addressElement =
                    document.createElement(
                        "span"
                    );

                addressElement.className =
                    "searchResultAddress";

                addressElement.textContent =
                    addressParts.join(", ");

const distanceElement =
    document.createElement(
        "span"
    );

distanceElement.className =
    "searchResultDistance";

distanceElement.textContent =
    resultDistanceText;
                item.appendChild(
    nameElement
);

item.appendChild(
    addressElement
);

if (
    resultDistanceText !== ""
) {

    item.appendChild(
        distanceElement
    );

}

                item.addEventListener(
                    "click",
                    function () {

                        selectPhotonResult(
                            result
                        );

                    }
                );

                searchResults.appendChild(
                    item
                );

            }
        );

        searchResults.style.display =
            "block";

    }

    catch (error) {

    if (
        requestId !==
        searchRequestId
    ) {
        return;
    }


    if (
        error.name ===
        "AbortError"
    ) {

        showNotice(
            "Arama zaman aşımına uğradı.",
            {

                type:
                    "warning",

                retry:
                    function () {

                        searchPlacesLive(
                            query,
                            true
                        );

                    }

            }
        );

        return;

    }


    console.error(
        "Arama hatası:",
        error
    );


    searchResults.innerHTML =
        "";

    searchResults.style.display =
        "none";


    if (!navigator.onLine) {

        showNotice(
            "İnternet bağlantısı yok. Yer aramak için internete bağlan.",
            {

                type:
                    "error",

                duration:
                    0,

                dismissible:
                    true

            }
        );

        return;

    }


    showNotice(
        "Yer arama servisine ulaşılamadı.",
        {

            type:
                "error",

            retry:
                function () {

                    searchPlacesLive(
                        query,
                        true
                    );

                },

            retryText:
                "YENİDEN ARA"

        }
    );

}

    finally {
        clearTimeout(timeoutId);
        if (requestId === searchRequestId) searchButton.textContent = "ARA";
    }
}
function selectPhotonResult(result) {
    clearSearchMapMarkers();
    cancelSearchRequest();
    cancelNavigation();
    rememberPlace(result);

    const longitude =
        result.geometry.coordinates[0];

    const latitude =
        result.geometry.coordinates[1];

    const properties =
        result.properties || {};

    destinationLocation = {

        latitude:
            latitude,

        longitude:
            longitude

    };

    const searchResults =
        document.getElementById(
            "searchResults"
        );

    searchResults.style.display =
        "none";

    searchInput.value =
        properties.name ||
        properties.city ||
        properties.street ||
        searchInput.value;

    // Eski waypoint varsa kaldır
    if (destinationMarker) {

        destinationMarker.remove();

    }

    const destinationElement =
    document.createElement(
        "div"
    );

destinationElement.id =
    "destinationMarker";

destinationElement.innerHTML = `

    <img
        class="destinationMarkerImage"
        src="poi-icons/destination-marker.png"
        alt=""
    >

`;

    destinationMarker =
        new maplibregl.Marker({

            element:
                destinationElement,

            anchor:
                "center"

        })

        .setLngLat([
            longitude,
            latitude
        ])

        .addTo(map);
if (routeModeBar) {

    routeModeBar.hidden =
        false;

}
    map.easeTo({

        center: [
            longitude,
            latitude
        ],

        zoom: 15,

        duration: 800

    });
if (
    currentLocation &&
    gpsIsFresh()
) {

    setTimeout(
        function () {

            createRoute(
                false
            );

        },
        250
    );

}
}

// =========================
// ROTA
// =========================


const routeButton =
    document.getElementById("routeButton");
    let selectedRouteMode =
    "car";
    const routeModeBar =
    document.getElementById(
        "routeModeBar"
    );


const routeModeButtons =
    document.querySelectorAll(
        "[data-route-mode]"
    );


function updateRouteModeButtons() {

    routeModeButtons.forEach(
        function (button) {

            const isActive =
                button.dataset
                    .routeMode ===
                selectedRouteMode;


            button.classList.toggle(
                "active",
                isActive
            );


            button.setAttribute(
                "aria-pressed",
                String(
                    isActive
                )
            );

        }
    );

}


function selectRouteMode(
    newMode
) {

    if (
        ![
            "car",
            "walk",
            "bike"
        ].includes(newMode)
    ) {

        return;

    }


    if (navigationMode) {

        showNotice(
            "Rota türünü değiştirmek için önce navigasyonu iptal et.",
            {
                type:
                    "warning"
            }
        );

        return;

    }


    /* =========================
       SEÇİMİ HEMEN GÖSTER
       ========================= */

    selectedRouteMode =
        newMode;


    updateRouteModeButtons();


    console.log(
        "Rota türü:",
        selectedRouteMode
    );


    /* Hedef yoksa sadece
       seçim değişsin */

    if (!destinationLocation) {

        return;

    }


    /* GPS yoksa rota çıkaramayız */

    if (
        !currentLocation ||
        !gpsIsFresh()
    ) {

        showNotice(
            "Rota oluşturmak için önce güncel konumunu al.",
            {
                type:
                    "warning"
            }
        );

        return;

    }


    /* =========================
       ESKİ ROTA İSTEĞİNİ DURDUR
       ========================= */

    invalidateRouteRequest();


    routePreviewReady =
        false;


    routeAlternatives =
        [];


    selectedRouteIndex =
        0;


    document
        .getElementById(
            "routeChoices"
        )
        .replaceChildren();


    /* Alternatif rota çizgileri */

    if (
        typeof clearAlternativeRouteLayers ===
        "function"
    ) {

        clearAlternativeRouteLayers();

    }


    /* Ana rota */

    if (
        map.getLayer(
            "route-line"
        )
    ) {

        map.removeLayer(
            "route-line"
        );

    }


    if (
        map.getLayer(
            "route-outline"
        )
    ) {

        map.removeLayer(
            "route-outline"
        );

    }


    if (
        map.getSource(
            "route"
        )
    ) {

        map.removeSource(
            "route"
        );

    }


    const routeInfo =
        document.getElementById(
            "routeInfo"
        );


    if (routeInfo) {

        routeInfo.style.display =
            "none";

    }


    /* =========================
       YENİ ROTAYI HEMEN HESAPLA
       ========================= */

    routeButton.textContent =
        "…";


    createRoute(
        false
    );

}



routeModeButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                selectRouteMode(
                    button.dataset
                        .routeMode
                );

            }
        );

    }
);


updateRouteModeButtons();

async function createRoute(isAutomatic = false) {
    if (routeUpdateInProgress) return;
    if (!currentLocation || !gpsIsFresh()) {
        if (
    lastGpsAccuracy > 80
) {

    showNotice(
        "GPS doğruluğu düşük (±" +
        Math.round(
            lastGpsAccuracy
        ) +
        " m). Açık bir alanda birkaç saniye bekle.",
        {

            type:
                "warning"

        }
    );

}
        if (!isAutomatic) showNotice("Önce KONUMUM ile güncel konumunu al.");
        return;
    }
    if (!destinationLocation) { showNotice("Önce bir hedef seç."); return; }
    if (!navigator.onLine) { showNotice("Rota için internet bağlantısı gerekiyor."); return; }
    if (!mapReady) { showNotice("Harita yükleniyor, birazdan tekrar dene."); return; }
    const requestId = ++routeRequestId;
    const controller = new AbortController();
    routeController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    routeUpdateInProgress = true;
    routeButton.textContent = isAutomatic ? "İPTAL" : "…";
    try {

    const alternativeCount =
        isAutomatic
            ? 0
            : 3;


    const routes =
    await GameServices
        .getRoutes(

            currentLocation,

            destinationLocation,

            selectedRouteMode,

            {

                signal:
                    controller.signal,

                alternatives:
                    alternativeCount

            }

        );


    if (
        requestId !== routeRequestId ||
        controller.signal.aborted
    ) {

        return;

    }


    console.log(
        "Rota sayısı:",
        routes.length
    );


    routeAlternatives =
        routes.filter(
            function (route) {

                return (

                    route.geometry &&
                    route.geometry.coordinates &&
                    route.geometry.coordinates.length >= 2 &&

                    route.legs &&
                    route.legs[0] &&
                    route.legs[0].steps &&
                    route.legs[0].steps.length > 0

                );

            }
        );


    if (
        routeAlternatives.length === 0
    ) {

        throw new Error(
            "Rota verisi eksik geldi."
        );

    }


    selectedRouteIndex = 0;


    applyRoute(
        routeAlternatives[0],
        isAutomatic,
        0
    );


    if (!isAutomatic) {

        renderRouteChoices();

    }

    else {

        showNotice(
            "Rota güncellendi."
        );

    }
    }

   catch (error) {

    if (
        requestId !==
        routeRequestId
    ) {
        return;
    }


    console.error(
        "Rota hatası:",
        error
    );


    if (!navigator.onLine) {

        showNotice(
            "İnternet bağlantısı yok. Yeni rota oluşturulamıyor.",
            {

                type:
                    "error",

                duration:
                    0,

                dismissible:
                    true

            }
        );

        return;

    }


    if (
        error.name ===
        "AbortError"
    ) {

        showNotice(
            "Rota servisi zamanında cevap vermedi.",
            {

                type:
                    "warning",

                retry:
                    function () {

                        createRoute(
                            isAutomatic
                        );

                    }

            }
        );

        return;

    }


    showNotice(
    error.message ||
    "Rota oluşturulamadı.",
    {
        type:
            "error",

        retry:
            function () {

                createRoute(
                    isAutomatic
                );

            },

        retryText:
            "ROTAYI TEKRAR DENE"

    }
);

}

finally {

    clearTimeout(
        timeoutId
    );


    if (
        requestId ===
        routeRequestId
    ) {

        routeUpdateInProgress =
            false;

        routeController =
            null;


        routeButton.textContent =

            navigationMode
                ? "İPTAL"

                : routePreviewReady
                    ? "BAŞLAT"

                    : "ROTA";

    }

}
}

function applyRoute(
    routeData,
    isAutomatic = false,
    selectedIndex = 0
) {
    const route = routeData.geometry;
    currentRouteCoordinates = route.coordinates.map(point => [...point]);
    currentRouteTotalDistance = routeData.distance;
    currentRouteTotalDuration = routeData.duration;
    navigationSteps = routeData.legs[0].steps;
    currentStepIndex = navigationSteps.length >= 2 ? 1 : 0;
    lastRoadLookupStep = -1;
    currentRoadName = "";
    roadLookupRequestId++;
    arrivalFixCount = 0;
    offRouteCount = 0;
    routeSnapActive =
    false;

routeSnapMissCount =
    0;
    spokenManeuvers.clear();
    document.getElementById("routeDistance").textContent = (routeData.distance / 1000).toFixed(1) + " km";
    document.getElementById("routeTime").textContent = Math.max(1, Math.ceil(routeData.duration / 60)) + " dk";
    document.getElementById("routeInfo").style.display = "block";
    const feature = {type: "Feature", properties: {}, geometry: route};
    if (map.getSource("route")) map.getSource("route").setData(feature);
    else {
        map.addSource("route", {type: "geojson", data: feature});
        map.addLayer({id: "route-outline", type: "line", source: "route", layout: {"line-join": "round", "line-cap": "round"}, paint: {"line-color": "#111111", "line-width": 8, "line-opacity": .9}});
        map.addLayer({id: "route-line", type: "line", source: "route", layout: {"line-join": "round", "line-cap": "round"}, paint: {"line-color": "#b02a78", "line-width": 5, "line-opacity": .95}});
    }
    if (!isAutomatic) {

    selectedRouteIndex =
        selectedIndex;

    drawAlternativeRouteLayers(
        selectedIndex
    );

}

else {

    clearAlternativeRouteLayers();

}
    if (!isAutomatic) {
        routePreviewReady = true;
        navigationMode = false;
        document.body.classList.remove("navigation-active");
        const bounds = new maplibregl.LngLatBounds();
        route.coordinates.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, {padding: {top: 150, bottom: 140, left: 45, right: 45}, pitch: 0, bearing: 0, duration: 900});
        routeButton.textContent = "BAŞLAT";
    }
}

function startNavigation() {
    if (!gpsIsFresh()) { showNotice("Güncel konum için KONUMUM düğmesine bas."); return; }

    if (
        currentLocation === null ||
        routePreviewReady === false
    ) {
        return;
    }

    navigationMode = true;
    startNavigationExtras();
    document.getElementById("routeChoices").replaceChildren();
    clearAlternativeRouteLayers();
    smoothCameraLocation = {

    latitude:
        currentLocation.latitude,

    longitude:
        currentLocation.longitude

};

smoothCameraBearing =
    lastGpsHeading !== null
        ? lastGpsHeading
        : map.getBearing();

    routePreviewReady = false;

    document.body.classList.add(
        "navigation-active"
    );

    routeButton.textContent =
        "İPTAL";
const speedHud =
    document.getElementById(
        "speedHud"
    );

if (speedHud) {

    speedHud.style.display =
        selectedRouteMode === "walk"
            ? "none"
            : "flex";

}

    // Navigasyon kamerasını
    // bizim konumumuza getir
    let startZoom =
    17.3;

let startPitch =
    60;

let startOffset =
    window.innerHeight * 0.18;


if (
    selectedRouteMode ===
    "walk"
) {

    startZoom =
        17.8;

    startPitch =
        32;

    startOffset =
        window.innerHeight * 0.08;

}


else if (
    selectedRouteMode ===
    "bike"
) {

    startZoom =
        17.0;

    startPitch =
        50;

    startOffset =
        window.innerHeight * 0.14;

}
    map.easeTo({

        center: [
            currentLocation.longitude,
            currentLocation.latitude
        ],

        zoom:
    startZoom,

pitch:
    startPitch,

        bearing:
            lastNavigationBearing,

        offset: [
    0,
    startOffset
],

        duration: 1200,

        essential: true

    });

    // İlk dönüş bilgisini göster
    if (navigationSteps.length > 0) {

        updateLiveInstruction(
            currentLocation.latitude,
            currentLocation.longitude
        );

    }

}
routeButton.onclick =
    function () {

        console.log(
            "ROTA TIKLANDI",
            {
                navigationMode:
                    navigationMode,

                routePreviewReady:
                    routePreviewReady,

                routeUpdateInProgress:
                    routeUpdateInProgress,

                currentLocation:
                    currentLocation,

                destinationLocation:
                    destinationLocation
            }
        );


        // Navigasyon zaten açıksa:
        // İPTAL
        if (navigationMode) {

            cancelNavigation();

            return;

        }


        // Rota önizlemesi hazırsa:
        // BAŞLAT
        if (routePreviewReady) {

            startNavigation();

            return;

        }


        // Henüz rota yoksa:
        // ROTA OLUŞTUR
        createRoute(false);

    };
