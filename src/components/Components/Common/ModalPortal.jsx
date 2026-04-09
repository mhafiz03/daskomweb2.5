import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
    const containerRef = useRef(
        typeof document !== "undefined" ? document.createElement("div") : null,
    );

    useEffect(() => {
        const element = containerRef.current;
        if (!element || typeof document === "undefined") {
            return;
        }

        element.classList.add("depth-modal-root");
        document.body.appendChild(element);

        return () => {
            document.body.removeChild(element);
        };
    }, []);

    if (!containerRef.current) {
        return null;
    }

    return createPortal(children, containerRef.current);
}

export function ModalOverlay({
    children,
    onClose,
    className = "depth-modal-overlay",
    style,
    ...rest
}) {
    const handleBackdropClick = useCallback(
        (event) => {
            if (event.target === event.currentTarget) {
                onClose?.(event);
            }
        },
        [onClose],
    );

    return (
        <ModalPortal>
            <div
                className={className}
                style={style}
                onClick={onClose ? handleBackdropClick : undefined}
                {...rest}
            >
                {children}
            </div>
        </ModalPortal>
    );
}
