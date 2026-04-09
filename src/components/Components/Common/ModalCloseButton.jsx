export default function ModalCloseButton({ onClick, ariaLabel = "Tutup", className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-depth-full border border-depth bg-depth-interactive p-2 text-depth-primary shadow-depth-sm transition hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] ${className}`}
            aria-label={ariaLabel}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
            >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        </button>
    );
}
