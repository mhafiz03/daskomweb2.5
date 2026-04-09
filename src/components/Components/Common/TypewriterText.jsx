import { useEffect, useMemo, useState } from "react";

const DEFAULT_SPEED = 85;
const DEFAULT_DELAY = 180;

function TerminalIcon({ className = "" }) {
    const classes = ["typewriter-terminal-icon", className].filter(Boolean).join(" ");

    return (
        <svg
            viewBox="0 0 24 24"
            role="img"
            aria-hidden="true"
            className={classes}
            width="1.5em"
            height="1.5em"
        >
            <rect
                x="2.5"
                y="4"
                width="19"
                height="14"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                opacity="0.65"
            />
            <path
                d="M7 8.75L10.25 12L7 15.25"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.25 15.25H17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function TypewriterText({
    text,
    speed = DEFAULT_SPEED,
    startDelay = DEFAULT_DELAY,
    className = "",
    textClassName = "",
    iconClassName = "",
    respectMotionPreference = true,
}) {
    const [displayed, setDisplayed] = useState("");
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            setPrefersReducedMotion(false);
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = (event) => setPrefersReducedMotion(event.matches);

        setPrefersReducedMotion(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handleChange);

            return () => {
                mediaQuery.removeEventListener("change", handleChange);
            };
        }

        if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(handleChange);

            return () => {
                mediaQuery.removeListener(handleChange);
            };
        }

        return undefined;
    }, []);

    const shouldReduceMotion = respectMotionPreference && prefersReducedMotion;

    useEffect(() => {
        if (typeof window === "undefined") {
            setDisplayed(text);
            return;
        }

        if (shouldReduceMotion) {
            setDisplayed(text);
            return;
        }

        setDisplayed("");
        let index = 0;
        let intervalId;
        const timeoutId = window.setTimeout(() => {
            intervalId = window.setInterval(() => {
                index += 1;
                const nextLength = Math.min(index, text.length);
                setDisplayed(text.slice(0, nextLength));

                if (index >= text.length) {
                    window.clearInterval(intervalId);
                }
            }, speed);
        }, startDelay);

        return () => {
            window.clearTimeout(timeoutId);
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [text, speed, startDelay, shouldReduceMotion]);

    const icon = useMemo(
        () => <TerminalIcon className={iconClassName} />,
        [iconClassName],
    );

    return (
        <span className={["typewriter-wrapper", className].filter(Boolean).join(" ")} role="text" aria-label={text}>
            {/* {icon} */}
            <span className={["typewriter-text", textClassName].filter(Boolean).join(" ")} aria-live="polite">
                {displayed}
            </span>
            <span className="typewriter-cursor" aria-hidden="true" />
        </span>
    );
}
