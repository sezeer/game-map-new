"use strict";


/* =========================================
   GAME MAP
   NATIVE OPENMAPTILES POI SİSTEMİ
   ========================================= */


let activeNativePoiPopup =
    null;
const POI_VISIBILITY_STORAGE_KEY =
    "gamemap.poiVisibility.v1";


const POI_MENU_GROUPS = {

    market: [
        "market"
    ],

    restaurant: [
        "restaurant"
    ],

    cafe: [
        "cafe"
    ],

    health: [
        "hospital",
        "pharmacy"
    ],

    fuel: [
        "fuel"
    ],

    hotel: [
        "hotel"
    ],

    gym: [
        "gym"
    ],

    clothing: [
        "clothing"
    ]

};


let poiVisibility = {

    market:
        true,

    restaurant:
        true,

    cafe:
        true,

    health:
        true,

    fuel:
        true,

    hotel:
        true,

    gym:
        true,

    clothing:
        true

};


/* =========================================
   KAYITLI TERCİHLERİ OKU
   ========================================= */

try {

    const saved =
        JSON.parse(
            localStorage.getItem(
                POI_VISIBILITY_STORAGE_KEY
            ) ||
            "null"
        );


    if (
        saved &&
        typeof saved ===
            "object"
    ) {

        poiVisibility = {

            ...poiVisibility,

            ...saved

        };

    }

}

catch (error) {

    console.warn(
        "POI tercihleri okunamadı.",
        error
    );

}

const NATIVE_POI_CATEGORIES = [

    {
        id:
            "market",

        label:
            "MARKET",

        icon:
            "poi-icons/market.png",

        values: [
            "grocery",
            "supermarket",
            "convenience",
            "greengrocer",
            "department_store",
            "marketplace"
        ]
    },


    {
        id:
            "gym",

        label:
            "GYM",

        icon:
            "poi-icons/gym.png",

        values: [
            "fitness_centre",
            "fitness_station",
            "sports_centre",
            "fitness",
            "bodybuilding",
            "weightlifting"
        ]
    },


    {
        id:
            "restaurant",

        label:
            "YEMEK",

        icon:
            "poi-icons/restoran.png",

        values: [
            "restaurant",
            "fast_food",
            "food_court"
        ]
    },


    {
        id:
            "cafe",

        label:
            "KAFE",

        icon:
            "poi-icons/kafe.png",

        values: [
            "cafe"
        ]
    },


    {
        id:
            "fuel",

        label:
            "BENZİNLİK",

        icon:
            "poi-icons/benzinlik.png",

        values: [
            "fuel"
        ]
    },


    {
        id:
            "hospital",

        label:
            "SAĞLIK",

        icon:
            "poi-icons/hastane.png",

        values: [
            "hospital",
            "clinic"
        ]
    },


    {
        id:
            "pharmacy",

        label:
            "ECZANE",

        icon:
            "poi-icons/eczane.png",

        values: [
            "pharmacy"
        ]
    },


    {
        id:
            "hotel",

        label:
            "OTEL",

        icon:
            "poi-icons/otel.png",

        values: [
            "lodging",
            "hotel",
            "hostel",
            "motel",
            "guest_house",
            "bed_and_breakfast"
        ]
    },


    {
        id:
            "clothing",

        label:
            "GİYİM",

        icon:
            "poi-icons/giyim.png",

        values: [
            "clothing_store",
            "clothes",
            "fashion"
        ]
    }

];



/* =========================================
   ESKİ OVERPASS UI'SINI KALDIR
   ========================================= */

document
    .getElementById(
        "poiSearchAreaButton"
    )
    ?.remove();


document
    .getElementById(
        "poiStatus"
    )
    ?.remove();


document
    .getElementById(
        "poiLoading"
    )
    ?.remove();



/* =========================================
   CLASS / SUBCLASS FİLTRESİ
   ========================================= */

function createNativePoiFilter(
    values
) {

    const conditions =
        [];


    values.forEach(
        function (value) {

            conditions.push([

                "==",

                [
                    "get",
                    "class"
                ],

                value

            ]);


            conditions.push([

                "==",

                [
                    "get",
                    "subclass"
                ],

                value

            ]);

        }
    );


    return [

        "any",

        ...conditions

    ];

}



/* =========================================
   POI İSMİ
   ========================================= */

function getNativePoiName(
    properties,
    fallback
) {

    if (!properties) {

        return fallback;

    }


    return (

        properties.name ||

        properties["name:tr"] ||

        properties["name:latin"] ||

        properties.name_en ||

        fallback

    );

}



/* =========================================
   POPUP
   ========================================= */

function showNativePoiPopup(
    feature,
    category
) {

    if (
        activeNativePoiPopup
    ) {

        activeNativePoiPopup.remove();

        activeNativePoiPopup =
            null;

    }


    if (
        !feature ||
        !feature.geometry ||
        feature.geometry.type !==
            "Point"
    ) {

        return;

    }


    const coordinates =
        feature.geometry
            .coordinates
            .slice();


    const longitude =
        coordinates[0];


    const latitude =
        coordinates[1];


    const placeName =
        getNativePoiName(

            feature.properties,

            category.label

        );


    /* =====================================
       MESAFE
       ===================================== */

    let distanceText =
        "KONUM ALINMADI";


    if (
        currentLocation &&
        Number.isFinite(
            currentLocation.latitude
        ) &&
        Number.isFinite(
            currentLocation.longitude
        )
    ) {

        const distance =
            calculateDistance(

                currentLocation,

                {
                    latitude:
                        latitude,

                    longitude:
                        longitude
                }

            );


        if (
            distance < 1000
        ) {

            distanceText =
                Math.max(
                    10,
                    Math.round(
                        distance / 10
                    ) * 10
                ) +
                " M UZAKTA";

        }

        else {

            distanceText =
                (
                    distance /
                    1000
                ).toFixed(1) +
                " KM UZAKTA";

        }

    }


    /* =====================================
       POPUP
       ===================================== */

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


    const categoryText =
        document.createElement(
            "span"
        );


    categoryText.className =
        "gamePoiCategory";


    categoryText.textContent =
        category.label;


    const distanceElement =
        document.createElement(
            "span"
        );


    distanceElement.className =
        "gamePoiDistance";


    distanceElement.textContent =
        distanceText;


    /* =====================================
       ROTA BUTONU
       ===================================== */

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


    /* =====================================
       FAVORİ BUTONU
       ===================================== */

    const favoriteButton =
        document.createElement(
            "button"
        );


    favoriteButton.type =
        "button";


    favoriteButton.className =
        "gamePoiFavoriteButton";


    const favoritePlace = {

        name:
            placeName,

        latitude:
            latitude,

        longitude:
            longitude

    };


    const alreadyFavorite =
        preferences.favorites.some(
            function (
                place
            ) {

                return samePlace(

                    place,

                    favoritePlace

                );

            }
        );


    if (
        alreadyFavorite
    ) {

        favoriteButton.textContent =
            "★ FAVORİLERDE";


        favoriteButton.disabled =
            true;

    }

    else {

        favoriteButton.textContent =
            "☆ FAVORİYE EKLE";

    }


    popupContent.appendChild(
        title
    );


    popupContent.appendChild(
        categoryText
    );


    popupContent.appendChild(
        distanceElement
    );


    popupContent.appendChild(
        routeButton
    );


    popupContent.appendChild(
        favoriteButton
    );


    const popup =
        new maplibregl.Popup({

            offset:
                26,

            closeButton:
                true,

            closeOnClick:
                true

        })

        .setLngLat(
            coordinates
        )

        .setDOMContent(
            popupContent
        )

        .addTo(
            map
        );


    activeNativePoiPopup =
        popup;


    popup.on(
        "close",
        function () {

            if (
                activeNativePoiPopup ===
                popup
            ) {

                activeNativePoiPopup =
                    null;

            }

        }
    );


    /* =====================================
       ROTA
       ===================================== */

    routeButton.addEventListener(
        "click",
        function (
            event
        ) {

            event.stopPropagation();


            popup.remove();


            activeNativePoiPopup =
                null;


            selectPhotonResult({

                geometry: {

                    type:
                        "Point",

                    coordinates:
                        coordinates

                },

                properties: {

                    name:
                        placeName

                }

            });

        }
    );


    /* =====================================
       FAVORİYE EKLE
       ===================================== */

    favoriteButton.addEventListener(
        "click",
        function (
            event
        ) {

            event.stopPropagation();


            if (
                favoriteButton.disabled
            ) {

                return;

            }


            if (
                preferences.favorites
                    .length >= 30
            ) {

                showNotice(
                    "Favorilerin dolu. Önce bir favori sil."
                );

                return;

            }


            const exists =
                preferences.favorites.some(
                    function (
                        place
                    ) {

                        return samePlace(

                            place,

                            favoritePlace

                        );

                    }
                );


            if (
                exists
            ) {

                favoriteButton.textContent =
                    "★ FAVORİLERDE";


                favoriteButton.disabled =
                    true;


                return;

            }


            preferences.favorites.push(
                favoritePlace
            );


            persistPreferences();


            renderPlaces();


            favoriteButton.textContent =
                "★ FAVORİLERDE";


            favoriteButton.disabled =
                true;


            showNotice(
                placeName +
                " favorilere eklendi."
            );

        }
    );

}



/* =========================================
   İKONU MAPLIBRE'A YÜKLE
   ========================================= */

async function loadNativePoiImage(
    category
) {

    const imageId =
        "game-poi-" +
        category.id;


    if (
        map.hasImage(
            imageId
        )
    ) {

        return imageId;

    }


    const response =
        await map.loadImage(
            category.icon
        );


    /*
    PNG'lerimiz büyük çözünürlükte.

    MapLibre'ın onları doğal olarak
    yaklaşık 64px kabul etmesini sağlıyoruz.
    */

    const imageWidth =
        response.data.width ||
        64;


    const pixelRatio =
        Math.max(
            1,
            imageWidth / 64
        );


    map.addImage(

        imageId,

        response.data,

        {
            pixelRatio:
                pixelRatio
        }

    );


    return imageId;

}

/* =========================================
   POI KATEGORİ GÖRÜNÜRLÜĞÜ
   ========================================= */

function savePoiVisibility() {

    try {

        localStorage.setItem(

            POI_VISIBILITY_STORAGE_KEY,

            JSON.stringify(
                poiVisibility
            )

        );

    }

    catch (error) {

        console.warn(
            "POI tercihleri kaydedilemedi.",
            error
        );

    }

}



function applyPoiVisibility(
    menuCategory
) {

    const nativeCategories =
        POI_MENU_GROUPS[
            menuCategory
        ];


    if (
        !nativeCategories
    ) {

        return;

    }


    const visible =
        poiVisibility[
            menuCategory
        ] !== false;


    nativeCategories.forEach(
        function (
            nativeCategory
        ) {

            const layerId =
                "game-poi-" +
                nativeCategory;


            if (
                !map.getLayer(
                    layerId
                )
            ) {

                return;

            }


            map.setLayoutProperty(

                layerId,

                "visibility",

                visible
                    ? "visible"
                    : "none"

            );

        }
    );

}



function applyAllPoiVisibility() {

    Object.keys(
        POI_MENU_GROUPS
    )
    .forEach(
        function (
            menuCategory
        ) {

            applyPoiVisibility(
                menuCategory
            );

        }
    );

}



/* =========================================
   MENÜ BUTONLARI
   ========================================= */

function renderPoiCategoryButtons() {

    const buttons =
        document.querySelectorAll(
            ".poiCategoryButton"
        );


    buttons.forEach(
        function (
            button
        ) {

            const category =
                button.dataset
                    .poiCategory;


            const enabled =
                poiVisibility[
                    category
                ] !== false;


            button.setAttribute(
                "aria-pressed",
                String(
                    enabled
                )
            );


            const label =
    button.textContent
        .trim()
        .replace(
            /^[✓×\s]+/,
            ""
        );


            button.textContent =
                (
                    enabled
                        ? "✓ "
                        : "× "
                ) +
                label;

        }
    );

}



function setupPoiCategoryControls() {

    const buttons =
        document.querySelectorAll(
            ".poiCategoryButton"
        );


    buttons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                function () {

                    const category =
                        button.dataset
                            .poiCategory;


                    if (
                        !category ||
                        !POI_MENU_GROUPS[
                            category
                        ]
                    ) {

                        return;

                    }


                    poiVisibility[
                        category
                    ] =
                        !poiVisibility[
                            category
                        ];


                    savePoiVisibility();


                    applyPoiVisibility(
                        category
                    );


                    renderPoiCategoryButtons();

                }
            );

        }
    );


    renderPoiCategoryButtons();

}

/* =========================================
   KATMANLARI KUR
   ========================================= */

async function setupNativePoiSystem() {

    const style =
        map.getStyle();


    const layers =
        style?.layers || [];


    /*
    Haritadaki gerçek OpenMapTiles
    POI source'unu otomatik bul.
    */

    const originalPoiLayer =
        layers.find(
            function (layer) {

                return (
                    layer[
                        "source-layer"
                    ] ===
                    "poi"
                );

            }
        );


    if (
        !originalPoiLayer
    ) {

        console.error(
            "GAME POI: OpenMapTiles POI katmanı bulunamadı."
        );

        return;

    }


    const sourceId =
        originalPoiLayer.source;


    console.log(
        "GAME POI NATIVE AKTİF:",
        sourceId
    );


    for (
        const category of
        NATIVE_POI_CATEGORIES
    ) {

        const layerId =
            "game-poi-" +
            category.id;


        if (
            map.getLayer(
                layerId
            )
        ) {

            continue;

        }


        let imageId;


        try {

            imageId =
                await loadNativePoiImage(
                    category
                );

        }

        catch (error) {

            console.error(
                "POI ikonu yüklenemedi:",
                category.icon,
                error
            );

            continue;

        }


        map.addLayer({

            id:
                layerId,

            type:
                "symbol",

            source:
                sourceId,

            "source-layer":
                "poi",

            minzoom:
                12.5,

            filter:
                createNativePoiFilter(
                    category.values
                ),

            layout: {

                "icon-image":
                    imageId,

                "icon-size": [

                    "interpolate",

                    [
                        "linear"
                    ],

                    [
                        "zoom"
                    ],

                    12.5,
                    0.38,

                    14,
                    0.46,

                    15,
                    0.52,

                    16,
                    0.58,

                    17,
                    0.64

                ],

                "icon-anchor":
                    "center",

                "icon-allow-overlap":
                    false,

                "icon-ignore-placement":
                    false,

                "icon-padding":
                    3,

                "icon-rotation-alignment":
                    "viewport",

                "icon-pitch-alignment":
                    "viewport",

                "symbol-sort-key": [

                    "coalesce",

                    [
                        "get",
                        "rank"
                    ],

                    50

                ]

            }

        });


        /* =================================
           TIKLA
           ================================= */

        map.on(
            "click",
            layerId,
            function (event) {

                const feature =
                    event.features?.[0];


                if (!feature) {

                    return;

                }


                showNativePoiPopup(

                    feature,

                    category

                );

            }
        );


        /* =================================
           MOUSE
           ================================= */

        map.on(
            "mouseenter",
            layerId,
            function () {

                map.getCanvas()
                    .style.cursor =
                    "pointer";

            }
        );


        map.on(
            "mouseleave",
            layerId,
            function () {

                map.getCanvas()
                    .style.cursor =
                    "";

            }
        );

    }

applyAllPoiVisibility();
    console.log(
        "GAME POI: bütün native katmanlar hazır."
    );

}



/* =========================================
   BAŞLAT
   ========================================= */

if (
    map.isStyleLoaded()
) {

    setupNativePoiSystem();

}

else {

    map.once(
        "load",
        function () {

            setupNativePoiSystem();

        }
    );

}
setupPoiCategoryControls();