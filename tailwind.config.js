import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./worker/**/*.{ts,tsx,js,jsx}",
    ],

    darkMode: ["class", '[data-theme="dark"]'],

    theme: {
        extend: {
            fontFamily: {
                ...defaultTheme.fontFamily,
                poppins: ['"poppins"'],
            },
            colors: {
                darkGreen: "#163020",
                darkOliveGreen: "#243622",
                forestGreen: "#304d30",
                deepForestGreen: "#304D30",
                sageGreen: "#b6c4b6",
                ivory: "#eef0e5",
                softIvory: "#F4F6EE",
                gainsboro: "#d9d9d9",
                lightGainsboro: "#EBEBEB",
                rustyRed: "#A44C4C",
                dustyBlue: "#868A95",
                darkBrown: "#393D46",
                softGray: "#F7F7F7",
                softRed: "#7F3E3B",
                darkRed: "#542725",
                lightGray: "#CDCDCD",
                redredDark: "#A02724",
                fireRed: "#C81A01",
                deepForestGreenDark: "#1C2E1C",
                softPearl: "#F2F3ED",
                sageIvory: "#DADCD0",
                goldenAmber: "#D4AF37",
                darkGray: "#3F4145",
            },
        },
    },

    plugins: [forms],
};
