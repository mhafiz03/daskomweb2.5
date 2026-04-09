export default function DepthToggleButton({ label, isOn, onToggle, className = "", disabled = false }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {label && (
                <span className={`text-xs font-semibold ${disabled ? "text-depth-secondary/60" : "text-depth-secondary"}`}>
                    {label}
                </span>
            )}
            <button
                type="button"
                onClick={onToggle}
                aria-pressed={isOn}
                disabled={disabled}
                className={`flex h-6 w-11 items-center rounded-depth-full border p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--depth-color-primary)] disabled:cursor-not-allowed disabled:opacity-60 ${
                    isOn
                        ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/20 text-white"
                        : "border-depth bg-depth-card text-depth-secondary"
                }`}
            >
                <span
                    className={`h-4 w-4 rounded-depth-full shadow-depth-sm transition-transform ${
                        isOn
                            ? "translate-x-5 bg-[var(--depth-color-primary)]"
                            : "translate-x-0 bg-depth-interactive"
                    } ${disabled ? "opacity-60" : ""}`}
                />
            </button>
        </div>
    );
}
