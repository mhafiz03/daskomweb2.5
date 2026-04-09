import { Image } from "@imagekit/react";
import daskomIcon from "../../../../assets/daskom.svg";

export default function CardPolling({
    image,
    name,
    description,
    onClick,
    isDimmed,
    isSelected,
    isDisabled,
    darkMode = false,
}) {
    const baseStyles = darkMode
        ? "rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-xl backdrop-blur-sm"
        : "rounded-depth-md border border-depth bg-depth-card p-4 text-center shadow-depth-lg";

    const dimmedStyles = isDimmed ? "opacity-40" : "opacity-100";

    const interactiveStyles = isDisabled
        ? "cursor-not-allowed"
        : "cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300";

    const selectedStyles = isSelected
        ? darkMode
            ? "ring-2 ring-green-400 ring-offset-2 ring-offset-transparent"
            : "ring-2 ring-[var(--depth-color-primary)] ring-offset-2"
        : "";

    const titleColor = darkMode ? "text-white" : "text-depth-primary";
    const descColor = darkMode ? "text-white/70" : "text-depth-secondary";

    return (
        <div
            className={`${baseStyles} ${dimmedStyles} ${interactiveStyles} ${selectedStyles}`}
            onClick={!isDisabled ? onClick : undefined}
        >
            {image ? (
                <Image
                    src={image}
                    transformation={[{ height: "165", width: "165", crop: "maintain_ratio" }]}
                    alt={name}
                    className={`mx-auto h-[165px] w-[165px] rounded-full object-cover shadow-lg ${isSelected ? 'ring-2 ring-green-400' : ''}`}
                    loading="lazy"
                />
            ) : (
                <img
                    src={daskomIcon}
                    alt={name}
                    className={`mx-auto h-[165px] w-[165px] rounded-full object-cover shadow-lg ${isSelected ? 'ring-2 ring-green-400' : ''}`}
                />
            )}
            <h1 className={`mb-4 mt-3 text-lg font-bold ${titleColor}`}>{name}</h1>
            <p className={`text-sm font-semibold ${descColor}`}>{description}</p>
            {isSelected && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Terpilih
                </div>
            )}
        </div>
    );
}