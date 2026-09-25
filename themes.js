"use strict";


const THEME_STORAGE_KEY =
    "gamemap.theme.v1";


const GAME_THEMES = [
    "classic",
    "gtav"
];


function getSavedTheme() {

    try {

        let saved =
    localStorage.getItem(
        THEME_STORAGE_KEY
    );


/* Eski MODERN seçimini yeni GTA V'e taşı */

if (
    saved === "modern"
) {

    saved =
        "gtav";

    localStorage.setItem(
        THEME_STORAGE_KEY,
        "gtav"
    );

}


        if (
            GAME_THEMES.includes(
                saved
            )
        ) {

            return saved;

        }

    }

    catch (error) {

        console.warn(
            "Tema tercihi okunamadı.",
            error
        );

    }


    return "classic";

}


function updateThemeButtons() {

    document
        .querySelectorAll(
            ".themeButton"
        )
        .forEach(
            function (button) {

                const selected =
                    button.dataset.theme ===
                    document.documentElement
                        .dataset.theme;


                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

            }
        );

}


function applyGameTheme(
    themeName,
    save = true
) {

    if (
        !GAME_THEMES.includes(
            themeName
        )
    ) {

        themeName =
            "classic";

    }


    document.documentElement
        .dataset.theme =
            themeName;


    if (save) {

        try {

            localStorage.setItem(
                THEME_STORAGE_KEY,
                themeName
            );

        }

        catch (error) {

            console.warn(
                "Tema kaydedilemedi.",
                error
            );

        }

    }


    updateThemeButtons();


    window.dispatchEvent(
        new CustomEvent(
            "gamemap:themechange",
            {
                detail: {
                    theme:
                        themeName
                }
            }
        )
    );

}


/*
Uygulama açılır açılmaz
kayıtlı temayı uygula.
*/

applyGameTheme(
    getSavedTheme(),
    false
);


document.addEventListener(
    "DOMContentLoaded",
    function () {

        document
            .querySelectorAll(
                ".themeButton"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            applyGameTheme(
                                button.dataset
                                    .theme
                            );

                        }
                    );

                }
            );


        updateThemeButtons();

    }
);


window.GameTheme = {

    apply:
        applyGameTheme,

    getCurrent:
        function () {

            return (
                document
                    .documentElement
                    .dataset.theme ||
                "classic"
            );

        }

};