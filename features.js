"use strict";

let routeController = null;
let routeRequestId = 0;
let searchRequestId = 0;
let routeAlternatives = [];
let selectedRouteIndex = 0;


function clearAlternativeRouteLayers() {

    for (let i = 0; i < 3; i++) {

        const sourceId =
            `route-alt-${i}`;

        const outlineId =
            `route-alt-${i}-outline`;

        const lineId =
            `route-alt-${i}-line`;


        if (map.getLayer(lineId)) {

            map.removeLayer(lineId);

        }


        if (map.getLayer(outlineId)) {

            map.removeLayer(outlineId);

        }


        if (map.getSource(sourceId)) {

            map.removeSource(sourceId);

        }

    }

}


function drawAlternativeRouteLayers(
    selectedIndex = 0
) {

    clearAlternativeRouteLayers();


    if (!mapReady) {
        return;
    }


    routeAlternatives
        .slice(0, 3)
        .forEach(
            function (route, index) {

                // Seçili rota zaten pembe
                // çiziliyor.
                if (
                    index === selectedIndex
                ) {
                    return;
                }


                if (
                    !route.geometry ||
                    !route.geometry.coordinates ||
                    route.geometry.coordinates.length < 2
                ) {
                    return;
                }


                const sourceId =
                    `route-alt-${index}`;

                const outlineId =
                    `route-alt-${index}-outline`;

                const lineId =
                    `route-alt-${index}-line`;


                map.addSource(
                    sourceId,
                    {

                        type: "geojson",

                        data: {

                            type: "Feature",

                            properties: {},

                            geometry:
                                route.geometry

                        }

                    }
                );


                const outlineLayer = {

                    id:
                        outlineId,

                    type:
                        "line",

                    source:
                        sourceId,

                    layout: {

                        "line-join":
                            "round",

                        "line-cap":
                            "round"

                    },

                    paint: {

                        "line-color":
                            "#111111",

                        "line-width":
                            7,

                        "line-opacity":
                            0.65

                    }

                };


                const lineLayer = {

                    id:
                        lineId,

                    type:
                        "line",

                    source:
                        sourceId,

                    layout: {

                        "line-join":
                            "round",

                        "line-cap":
                            "round"

                    },

                    paint: {

                        "line-color":
                            "#777777",

                        "line-width":
                            4,

                        "line-opacity":
                            0.8

                    }

                };


                /*
                   Seçili pembe rotanın
                   altında göster.
                */

                if (
                    map.getLayer(
                        "route-outline"
                    )
                ) {

                    map.addLayer(
                        outlineLayer,
                        "route-outline"
                    );

                    map.addLayer(
                        lineLayer,
                        "route-outline"
                    );

                }

                else {

                    map.addLayer(
                        outlineLayer
                    );

                    map.addLayer(
                        lineLayer
                    );

                }

            }
        );

}
let arrivalMessageTimer = null;
let arrivalFixCount = 0;
let lastGpsFixAt = 0;
let lastGpsAccuracy = Infinity;
let gpsErrorText = "";
let noticeTimer;
let mapReady = map.isStyleLoaded();
map.on("load", () => { mapReady = true; });
let pickingDestination = false;
let wakeLock = null;
let wakeRequestPending = false;
const spokenManeuvers = new Set();
const storageKey = "gamemap.preferences.v1";
let preferences = {favorites: [], recent: [], voice: false, keepAwake: false};
try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved) preferences = {
        favorites: (Array.isArray(saved.favorites) ? saved.favorites : []).filter(validPlace).slice(0, 30),
        recent: (Array.isArray(saved.recent) ? saved.recent : []).filter(validPlace).slice(0, 8),
        voice: saved.voice === true,
        keepAwake: saved.keepAwake === true
    };
} catch (_) { /* Storage may be disabled or contain an older format. */ }

function validPlace(place) {
    return place && typeof place.name === "string" && Number.isFinite(place.longitude) &&
        Number.isFinite(place.latitude) && Math.abs(place.longitude) <= 180 && Math.abs(place.latitude) <= 90;
}
function persistPreferences() {
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
    catch (_) { showNotice("Bu tarayıcı kayıtları saklayamıyor; seçimler bu oturumda kullanılabilir."); }
}
function showNotice(
    message,
    options = {}
) {

    const notice =
        document.getElementById(
            "appNotice"
        );


    const type =
        options.type ||
        "info";


    const duration =
        Number.isFinite(
            options.duration
        )
            ? options.duration
            : 5500;


    notice.replaceChildren();


    notice.dataset.type =
        type;


    /* MESAJ */

    const text =
        document.createElement(
            "span"
        );

    text.className =
        "appNoticeText";

    text.textContent =
        message;

    notice.appendChild(
        text
    );


    /* TEKRAR DENE BUTONU */

    if (
        typeof options.retry ===
            "function"
    ) {

        const retryButton =
            document.createElement(
                "button"
            );


        retryButton.type =
            "button";

        retryButton.className =
            "appNoticeRetry";

        retryButton.textContent =
            options.retryText ||
            "TEKRAR DENE";


        retryButton.addEventListener(
            "click",
            function () {

                notice.hidden =
                    true;

                options.retry();

            }
        );


        notice.appendChild(
            retryButton
        );

    }


    /* KAPAT */

    if (
        options.dismissible === true
    ) {

        const closeButton =
            document.createElement(
                "button"
            );

        closeButton.type =
            "button";

        closeButton.className =
            "appNoticeClose";

        closeButton.textContent =
            "×";


        closeButton.addEventListener(
            "click",
            function () {

                notice.hidden =
                    true;

            }
        );


        notice.appendChild(
            closeButton
        );

    }


    notice.hidden =
        false;


    clearTimeout(
        noticeTimer
    );


    if (duration > 0) {

        noticeTimer =
            setTimeout(
                function () {

                    notice.hidden =
                        true;

                },
                duration
            );

    }

}
function invalidateRouteRequest() {
    routeRequestId++;
    routeController?.abort();
    routeController = null;
    routeUpdateInProgress = false;
    routeAlternatives = [];
    selectedRouteIndex = 0;

clearAlternativeRouteLayers();
    arrivalFixCount = 0;
}
function cancelSearchRequest() {
    clearTimeout(searchTimer);
    searchRequestId++;
    searchController?.abort();
    searchController = null;
    searchButton.textContent = "ARA";
}
function gpsErrorMessage(error) {
    if (error.code === 1) return "Konum izni kapalı. Tarayıcı ayarlarından konum iznini aç.";
    if (error.code === 3) return "GPS zaman aşımı. Açık bir alanda tekrar dene.";
    return "GPS sinyali alınamadı. Konumunu yeniden almayı dene.";
}
function gpsIsFresh() { return lastGpsFixAt > 0 && Date.now() - lastGpsFixAt < 20000; }
function updateGpsStatus(position) {
    lastGpsFixAt = position.timestamp || Date.now();
    lastGpsAccuracy = position.coords.accuracy;
    gpsErrorText = "";
    locationButton.textContent = "KONUMUM";
    renderConnectionStatus();
}
function renderConnectionStatus() {
    const parts = [navigator.onLine ? "ÇEVRİMİÇİ" : "İNTERNET YOK"];
    if (gpsErrorText) parts.push("GPS HATASI");
    else if (gpsIsFresh()) parts.push(`GPS ±${Math.round(lastGpsAccuracy)} M`);
    else parts.push(lastGpsFixAt ? "GPS GÜNCEL DEĞİL" : watchId !== null ? "GPS ARANIYOR" : "GPS KAPALI");
    const status = document.getElementById("connectionStatus");
    status.textContent = parts.join(" · ");
    status.dataset.warning = String(!navigator.onLine || (lastGpsFixAt > 0 && !gpsIsFresh()) || !!gpsErrorText || lastGpsAccuracy > 65 && gpsIsFresh());
    status.title = gpsErrorText || "GPS doğruluğu metre cinsindendir.";
}
function hasArrived(
    position,
    destinationDistance
) {

    const coords =
        currentRouteCoordinates;


    const end =
        coords[
            coords.length - 1
        ];


    const raw = {

        latitude:
            position.coords.latitude,

        longitude:
            position.coords.longitude

    };


    const endDistance =
        end
            ? calculateDistance(
                raw,
                {
                    longitude:
                        end[0],

                    latitude:
                        end[1]
                }
            )
            : Infinity;


    let destinationThreshold =
        40;

    let endThreshold =
        25;

    let remainingThreshold =
        55;

    let requiredFixes =
        3;


    /* YÜRÜME */

    if (
        selectedRouteMode ===
        "walk"
    ) {

        destinationThreshold =
            20;

        endThreshold =
            15;

        remainingThreshold =
            30;

        requiredFixes =
            2;

    }


    /* BİSİKLET */

    else if (
        selectedRouteMode ===
        "bike"
    ) {

        destinationThreshold =
            30;

        endThreshold =
            20;

        remainingThreshold =
            40;

        requiredFixes =
            3;

    }


    const nearEnd =

        navigationMode &&

        gpsIsFresh() &&

        position.coords
            .accuracy <= 25 &&

        destinationDistance <=
            destinationThreshold &&

        endDistance <=
            endThreshold &&

        calculateRemainingRouteDistance(
            coords
        ) <=
            remainingThreshold &&

        currentStepIndex >=
            navigationSteps.length - 2;


    arrivalFixCount =
        nearEnd
            ? arrivalFixCount + 1
            : 0;


    return (
        arrivalFixCount >=
        requiredFixes
    );

}
function renderRouteChoices() {

    const panel =
        document.getElementById(
            "routeChoices"
        );


    panel.replaceChildren();


    routeAlternatives
        .slice(0, 3)
        .forEach(
            function (route, index) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.textContent =
                    `${index + 1}. ROTA · ` +
                    `${Math.max(
                        1,
                        Math.ceil(
                            route.duration / 60
                        )
                    )} DK · ` +
                    `${(
                        route.distance / 1000
                    ).toFixed(1)} KM`;


                button.setAttribute(
                    "aria-pressed",
                    String(
                        index ===
                        selectedRouteIndex
                    )
                );


                button.addEventListener(
                    "click",
                    function () {

                        if (
                            navigationMode
                        ) {
                            return;
                        }


                        selectedRouteIndex =
                            index;


                        applyRoute(
                            route,
                            false,
                            index
                        );


                        [
                            ...panel.children
                        ].forEach(
                            function (
                                child,
                                childIndex
                            ) {

                                child.setAttribute(
                                    "aria-pressed",
                                    String(
                                        childIndex ===
                                        index
                                    )
                                );

                            }
                        );

                    }
                );


                panel.appendChild(
                    button
                );

            }
        );

}
function samePlace(a, b) {
    return Math.abs(a.latitude - b.latitude) < .00001 && Math.abs(a.longitude - b.longitude) < .00001;
}
function rememberPlace(result) {
    const place = {name: result.properties?.name || result.properties?.street || result.properties?.city || "Harita hedefi",
        longitude: result.geometry.coordinates[0], latitude: result.geometry.coordinates[1]};
    if (!validPlace(place)) return;
    preferences.recent = [place, ...preferences.recent.filter(other => !samePlace(place, other))].slice(0, 8);
    persistPreferences();
    renderPlaces();
    document.getElementById("toolsPanel").hidden = true;
    document.getElementById("toolsToggle").setAttribute("aria-expanded", "false");
}
function chooseSavedPlace(place) {
    selectPhotonResult({geometry: {coordinates: [place.longitude, place.latitude]}, properties: {name: place.name}});
}
function renderPlaces() {
    for (const [id, key] of [["favoritePlaces", "favorites"], ["recentPlaces", "recent"]]) {
        const list = document.getElementById(id);
        list.replaceChildren();
        if (!preferences[key].length) {
            const empty = document.createElement("p");
            empty.textContent = key === "favorites" ? "Henüz favori yok." : "Seçtiğin hedefler burada görünür.";
            list.appendChild(empty);
        }
        preferences[key].forEach(place => {
            const row = document.createElement("div");
            row.className = "saved-place";
            const choose = document.createElement("button");
            choose.textContent = place.name;
            choose.addEventListener("click", () => chooseSavedPlace(place));
            const remove = document.createElement("button");
            remove.textContent = "×";
            remove.setAttribute("aria-label", `${place.name} kaydını sil`);
            remove.addEventListener("click", () => {
                preferences[key] = preferences[key].filter(other => other !== place);
                persistPreferences(); renderPlaces();
            });
            row.append(choose, remove);
            list.appendChild(row);
        });
    }
}
function speakText(text) {
    if (!preferences.voice || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 1;
    const voice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith("tr"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
}
function speakManeuver(step, distance) {
    if (!navigationMode || !preferences.voice || !gpsIsFresh() || lastGpsAccuracy > 50) return;
    const bucket = distance <= 35 ? "now" : distance <= 200 ? "near" : "far";
    if (bucket === "far") return;
    const key = `${currentStepIndex}:${bucket}`;
    if (spokenManeuvers.has(key)) return;
    spokenManeuvers.add(key);
    const instruction = getDirectionText(step.maneuver);
    speakText(bucket === "now" ? instruction : `${Math.round(distance / 10) * 10} metre sonra ${instruction}`);
}
async function syncWakeLock() {
    if (!navigationMode || !preferences.keepAwake || document.visibilityState !== "visible") {
        if (wakeLock) { const old = wakeLock; wakeLock = null; await old.release().catch(() => {}); }
        return;
    }
    if (!navigator.wakeLock || wakeLock || wakeRequestPending) return;
    wakeRequestPending = true;
    try {
        const lock = await navigator.wakeLock.request("screen");
        if (!navigationMode || !preferences.keepAwake || document.visibilityState !== "visible") { await lock.release(); return; }
        wakeLock = lock;
        lock.addEventListener("release", () => { if (wakeLock === lock) wakeLock = null; });
    } catch (_) { showNotice("Ekranı açık tutma etkinleşmedi; cihazının ekran süresini kontrol et."); }
    finally { wakeRequestPending = false; }
}
function startNavigationExtras() {
    clearTimeout(arrivalMessageTimer);
    spokenManeuvers.clear();
    speakText("Navigasyon başladı.");
    syncWakeLock();
}
function stopNavigationExtras() {
    window.speechSynthesis?.cancel();
    spokenManeuvers.clear();
    // Caller resets navigationMode immediately; release without reacquiring.
    if (wakeLock) { const old = wakeLock; wakeLock = null; old.release().catch(() => {}); }
}
function updateOptionButtons() {
    const voice = document.getElementById("voiceToggle");
    voice.disabled = !("speechSynthesis" in window);
    voice.textContent = voice.disabled ? "SES DESTEKLENMİYOR" : `SES: ${preferences.voice ? "AÇIK" : "KAPALI"}`;
    voice.setAttribute("aria-pressed", String(preferences.voice));
    const wake = document.getElementById("wakeToggle");
    wake.disabled = !navigator.wakeLock;
    wake.textContent = wake.disabled ? "EKRAN KİLİDİ DESTEKLENMİYOR" : `EKRANI AÇIK TUT: ${preferences.keepAwake ? "AÇIK" : "KAPALI"}`;
    wake.setAttribute("aria-pressed", String(preferences.keepAwake));
}
document.getElementById("toolsToggle").addEventListener("click", () => {
    const panel = document.getElementById("toolsPanel");
    panel.hidden = !panel.hidden;
    document.getElementById("toolsToggle").setAttribute("aria-expanded", String(!panel.hidden));
});
document.getElementById("pickDestination").addEventListener("click", () => {
    pickingDestination = !pickingDestination;
    document.getElementById("toolsPanel").hidden = true;
    document.getElementById("toolsToggle").setAttribute("aria-expanded", "false");
    map.getCanvas().style.cursor = pickingDestination ? "crosshair" : "";
    if (pickingDestination) showNotice("Hedef için haritaya dokun. Vazgeçmek için Escape tuşuna bas veya menüden seçimi kapat.");
});
map.on("click", event => {
    if (!pickingDestination) return;
    pickingDestination = false;
    map.getCanvas().style.cursor = "";
    const name = `Harita hedefi (${event.lngLat.lat.toFixed(4)}, ${event.lngLat.lng.toFixed(4)})`;
    chooseSavedPlace({name, latitude: event.lngLat.lat, longitude: event.lngLat.lng});
    showNotice("Hedef seçildi. ROTA ile güzergâhı oluşturabilirsin.");
});
document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    pickingDestination = false;
    map.getCanvas().style.cursor = "";
    cancelSearchRequest();
    document.getElementById("searchResults").style.display = "none";
    document.getElementById("toolsPanel").hidden = true;
    document.getElementById("toolsToggle").setAttribute("aria-expanded", "false");
});
document.getElementById("saveFavorite").addEventListener("click", () => {
    if (!destinationLocation) { showNotice("Önce bir hedef seç."); return; }
    if (preferences.favorites.some(place => samePlace(place, destinationLocation))) { showNotice("Bu hedef zaten favorilerinde."); return; }
    if (preferences.favorites.length >= 30) { showNotice("Favorilerin dolu. Bir kaydı silerek yer açabilirsin."); return; }
    const name = window.prompt("Favori adı (ör. Ev veya İş)", searchInput.value || "Favorim");
    if (!name?.trim()) return;
    preferences.favorites.push({name: name.trim().slice(0, 100), ...destinationLocation});
    persistPreferences(); renderPlaces(); showNotice("Favorilere eklendi.");
});
document.getElementById("voiceToggle").addEventListener("click", () => {
    preferences.voice = !preferences.voice;
    spokenManeuvers.clear();
    persistPreferences(); updateOptionButtons();
    if (preferences.voice) speakText("Sesli yönlendirme açık.");
    else window.speechSynthesis?.cancel();
});
document.getElementById("wakeToggle").addEventListener("click", () => {
    preferences.keepAwake = !preferences.keepAwake;
    persistPreferences(); updateOptionButtons(); syncWakeLock();
    if (preferences.keepAwake && !navigationMode) showNotice("Navigasyon başladığında ekran açık tutulacak.");
});
document.getElementById("cancelRoute").addEventListener("click", () => {
    cancelNavigation();
    destinationMarker?.remove(); destinationMarker = null; destinationLocation = null;
    searchInput.value = "";
    cancelSearchRequest();
    document.getElementById("searchResults").style.display = "none";
    showNotice("Rota ve hedef temizlendi.");
});
window.addEventListener("online", renderConnectionStatus);
window.addEventListener("offline", () => { renderConnectionStatus(); showNotice("İnternet kesildi. Yeni aramalar, rotalar ve harita alanları yüklenemeyebilir."); });
document.addEventListener("visibilitychange", syncWakeLock);
window.addEventListener("pagehide", () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    lastGpsFixAt = 0;
    invalidateRouteRequest(); cancelSearchRequest(); stopNavigationExtras();
});
window.addEventListener("pageshow", () => { renderConnectionStatus(); syncWakeLock(); });
setInterval(renderConnectionStatus, 5000);
renderPlaces(); updateOptionButtons(); renderConnectionStatus();
const isDevelopment =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";


if (
    "serviceWorker" in navigator &&
    window.isSecureContext
) {

    let pageRefreshing =
        false;


    navigator.serviceWorker
        .addEventListener(
            "controllerchange",
            function () {

                if (
                    pageRefreshing
                ) {

                    return;

                }


                pageRefreshing =
                    true;


                window.location
                    .reload();

            }
        );


    window.addEventListener(
        "load",
        async function () {

            try {

                const registration =
                    await navigator
                        .serviceWorker
                        .register(
                            "./sw.js",
                            {
                                updateViaCache:
                                    "none"
                            }
                        );


                console.log(
                    "PWA hazır."
                );


                const updateNotice =
                    document.getElementById(
                        "updateNotice"
                    );


                const updateButton =
                    document.getElementById(
                        "updateButton"
                    );


                let waitingWorker =
                    null;


                function showUpdateNotice(
                    worker
                ) {

                    if (!worker) {

                        return;

                    }


                    waitingWorker =
                        worker;


                    updateNotice.hidden =
                        false;


                    updateButton.disabled =
                        false;


                    updateButton.textContent =
                        "YENİLE";

                }


                /* Sayfa açıldığında zaten
                   bekleyen sürüm varsa */

                if (
                    registration.waiting
                ) {

                    showUpdateNotice(
                        registration.waiting
                    );

                }


                /* Yeni SW bulundu */

                registration
                    .addEventListener(
                        "updatefound",
                        function () {

                            const newWorker =
                                registration
                                    .installing;


                            if (!newWorker) {

                                return;

                            }


                            newWorker
                                .addEventListener(
                                    "statechange",
                                    function () {

                                        if (
                                            newWorker.state ===
                                                "installed" &&

                                            navigator
                                                .serviceWorker
                                                .controller
                                        ) {

                                            showUpdateNotice(
                                                newWorker
                                            );

                                        }

                                    }
                                );

                        }
                    );


                /* YENİLE butonu */

                updateButton
                    .addEventListener(
                        "click",
                        function () {

                            if (
                                !waitingWorker
                            ) {

                                return;

                            }


                            updateButton.disabled =
                                true;


                            updateButton.textContent =
                                "YÜKLENİYOR...";


                            waitingWorker.postMessage({
                                type:
                                    "SKIP_WAITING"
                            });

                        }
                    );


                /* Uygulama açılır açılmaz
                   güncelleme kontrolü */

                registration
                    .update()
                    .catch(
                        function () {}
                    );


                /* Uygulama uzun süre
                   açık kalırsa 30 dakikada
                   bir kontrol et */

                setInterval(
                    function () {

                        registration
                            .update()
                            .catch(
                                function () {}
                            );

                    },
                    30 * 60 * 1000
                );


                /* Kullanıcı uygulamaya geri
                   döndüğünde tekrar kontrol */

                document.addEventListener(
                    "visibilitychange",
                    function () {

                        if (
                            document
                                .visibilityState ===
                            "visible"
                        ) {

                            registration
                                .update()
                                .catch(
                                    function () {}
                                );

                        }

                    }
                );

            }

            catch (error) {

                console.error(
                    "Service Worker hatası:",
                    error
                );


                showNotice(
                    "Çevrimdışı açılış hazırlanamadı; uygulama internetle çalışmaya devam eder."
                );

            }

        }
    );

}