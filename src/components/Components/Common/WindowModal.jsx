import { useEffect, useState, useRef } from "react";
import ModalPortal from "./ModalPortal";
import ModalCloseButton from "./ModalCloseButton";

const BASE_POSITION = { x: 160, y: 120 };
const BASE_SIZE = { width: 520, height: 360 };
const BASE_MIN_SIZE = { width: 320, height: 220 };
const VIEWPORT_MARGIN = 16;

const clamp = (value, min, max = Infinity) => {
    if (!Number.isFinite(max)) {
        return Math.max(min, value);
    }

    return Math.min(Math.max(min, value), max);
};

const getViewport = () => {
    if (typeof window === "undefined") {
        return { width: null, height: null };
    }

    return {
        width: window.innerWidth,
        height: window.innerHeight,
    };
};

const HEADER_INTERACTIVE_SELECTORS = "input, select, textarea, button, a, [data-stop-drag='true']";

export default function WindowModal({
    open,
    onClose,
    title,
    children,
    initialPosition,
    initialSize,
    minSize,
    contentClassName = "overflow-auto p-4",
}) {
    const resolvedInitialPosition = {
        x: initialPosition?.x ?? BASE_POSITION.x,
        y: initialPosition?.y ?? BASE_POSITION.y,
    };
    const resolvedInitialSize = {
        width: initialSize?.width ?? BASE_SIZE.width,
        height: initialSize?.height ?? BASE_SIZE.height,
    };
    const resolvedMinSize = {
        width: Math.max(200, minSize?.width ?? BASE_MIN_SIZE.width),
        height: Math.max(160, minSize?.height ?? BASE_MIN_SIZE.height),
    };

    const [position, setPosition] = useState(resolvedInitialPosition);
    const [size, setSize] = useState(resolvedInitialSize);
    const interactionRef = useRef(null);

    const handlePointerMove = (event) => {
        const interaction = interactionRef.current;

        if (!interaction) {
            return;
        }

        event.preventDefault();

        if (interaction.type === "drag") {
            const { width: viewportWidth, height: viewportHeight } = getViewport();
            const maxX = viewportWidth
                ? Math.max(VIEWPORT_MARGIN, viewportWidth - interaction.windowWidth - VIEWPORT_MARGIN)
                : Infinity;
            const maxY = viewportHeight
                ? Math.max(VIEWPORT_MARGIN, viewportHeight - interaction.windowHeight - VIEWPORT_MARGIN)
                : Infinity;

            setPosition({
                x: clamp(event.clientX - interaction.offsetX, VIEWPORT_MARGIN, maxX),
                y: clamp(event.clientY - interaction.offsetY, VIEWPORT_MARGIN, maxY),
            });
        } else if (interaction.type === "resize") {
            const deltaX = event.clientX - interaction.startX;
            const deltaY = event.clientY - interaction.startY;
            const shouldResizeWidth = interaction.axis === "both" || interaction.axis === "width";
            const shouldResizeHeight = interaction.axis === "both" || interaction.axis === "height";
            const nextWidth = shouldResizeWidth
                ? Math.max(resolvedMinSize.width, interaction.startWidth + deltaX)
                : interaction.startWidth;
            const nextHeight = shouldResizeHeight
                ? Math.max(resolvedMinSize.height, interaction.startHeight + deltaY)
                : interaction.startHeight;

            setSize({
                width: nextWidth,
                height: nextHeight,
            });
        }
    };

    const cleanupPointerInteraction = () => {
        if (typeof window !== "undefined") {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
        }

        if (typeof document !== "undefined") {
            document.body.style.userSelect = "";
            document.body.style.webkitUserSelect = "";
        }

        interactionRef.current = null;
    };

    const handlePointerUp = () => {
        cleanupPointerInteraction();
    };

    const startInteraction = (getPayload) => (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!open || typeof window === "undefined") {
            return;
        }

        interactionRef.current = getPayload(event);

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);

        if (typeof document !== "undefined") {
            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
        }
    };

    useEffect(() => () => cleanupPointerInteraction(), []);

    useEffect(() => {
        if (!open) {
            return;
        }

        setPosition(resolvedInitialPosition);
        setSize(resolvedInitialSize);
    }, [
        open,
        resolvedInitialPosition.x,
        resolvedInitialPosition.y,
        resolvedInitialSize.width,
        resolvedInitialSize.height,
    ]);

    useEffect(() => {
        if (!open || typeof window === "undefined") {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const contentAreaClassName = ["flex-1", contentClassName].filter(Boolean).join(" ");

    return (
        <ModalPortal>
            <div className="pointer-events-none fixed inset-0 z-[250]">
                <div
                    role="dialog"
                    aria-modal="false"
                    aria-label={title}
                    className="pointer-events-auto absolute flex flex-col rounded-depth-lg border border-depth bg-depth-card text-depth-primary shadow-depth-lg"
                    style={{
                        width: `${size.width}px`,
                        height: `${size.height}px`,
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    <div
                        className="flex items-center justify-end border-b border-depth bg-depth-interactive px-4 py-2"
                        onPointerDown={(event) => {
                            if (event.target.closest(HEADER_INTERACTIVE_SELECTORS)) {
                                return;
                            }

                            startInteraction((evt) => ({
                                type: "drag",
                                offsetX: evt.clientX - position.x,
                                offsetY: evt.clientY - position.y,
                                windowWidth: size.width,
                                windowHeight: size.height,
                            }))(event);
                        }}
                        aria-label={title}
                    >
                        <div data-stop-drag="true">
                            <ModalCloseButton onClick={onClose} ariaLabel="Tutup jendela" />
                        </div>
                    </div>

                    <div className={contentAreaClassName}>{children}</div>

                    <div
                        className="absolute inset-y-0 right-0 w-2 cursor-e-resize bg-transparent"
                        aria-hidden="true"
                        onPointerDown={startInteraction((event) => ({
                            type: "resize",
                            axis: "width",
                            startX: event.clientX,
                            startY: event.clientY,
                            startWidth: size.width,
                            startHeight: size.height,
                        }))}
                    />
                    <div
                        className="absolute bottom-0 left-0 h-2 w-full cursor-s-resize bg-transparent"
                        aria-hidden="true"
                        onPointerDown={startInteraction((event) => ({
                            type: "resize",
                            axis: "height",
                            startX: event.clientX,
                            startY: event.clientY,
                            startWidth: size.width,
                            startHeight: size.height,
                        }))}
                    />
                    <div
                        className="absolute -bottom-1 -right-1 h-4 w-4 cursor-se-resize rounded-br-md bg-transparent"
                        aria-hidden="true"
                        onPointerDown={startInteraction((event) => ({
                            type: "resize",
                            axis: "both",
                            startX: event.clientX,
                            startY: event.clientY,
                            startWidth: size.width,
                            startHeight: size.height,
                        }))}
                    />
                </div>
            </div>
        </ModalPortal>
    );
}
