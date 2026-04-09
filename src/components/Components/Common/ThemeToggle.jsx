import { useEffect, useState } from "react";

const DEFAULT_THEME_STORAGE_KEY = "depth-theme";

const getPreferredTheme = (storageKey) => {
    if (typeof window === "undefined") {
        return "light";
    }

    const storedTheme = window.localStorage.getItem(storageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function ThemeToggle({ className = "", storageKey = DEFAULT_THEME_STORAGE_KEY }) {
    const [theme, setTheme] = useState(() => getPreferredTheme(storageKey));

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const stored = window.localStorage.getItem(storageKey);
            if (stored === "light" || stored === "dark") {
                return;
            }

            setTheme(mediaQuery.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", handleChange);

        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [storageKey]);

    const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`glass-button flex h-10 w-10 items-center justify-center rounded-depth-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-[var(--depth-color-card)] ${className}`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
