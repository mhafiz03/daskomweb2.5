import { useState, useEffect } from "react";
import { Image } from "@imagekit/react";
import daskomIcon from "../../../../assets/daskom.svg";
import CardPolling from "./CardPolling";

export default function PollingContent({
    activeCategory,
    asistens,
    loading,
    error,
    selectedCards,
    setSelectedCards,
    isSubmitted,
    fullscreenMode = false
}) {
    const [activeModalCards, setActiveModalCards] = useState({});
    const [previewCard, setPreviewCard] = useState(null); // For preview before confirm

    useEffect(() => {
        const storedModalCards = localStorage.getItem("activeModalCards");
        if (storedModalCards) {
            try {
                setActiveModalCards(JSON.parse(storedModalCards));
            } catch (err) {
                console.error("Error parsing stored modal cards:", err);
                localStorage.removeItem("activeModalCards");
            }
        }
    }, []);

    // Reset preview when category changes
    useEffect(() => {
        setPreviewCard(null);
    }, [activeCategory]);

    const handleCardClick = (asisten) => {
        if (isSubmitted || !activeCategory) return;

        // If this card is already confirmed, allow cancellation
        if (selectedCards[activeCategory]?.kode === asisten.kode) {
            return; // Already selected, don't show preview again
        }

        // Show preview modal
        setPreviewCard(asisten);
    };

    const handleConfirm = () => {
        if (!previewCard || !activeCategory) return;

        setActiveModalCards(prev => {
            const newState = { ...prev, [activeCategory]: previewCard };
            localStorage.setItem("activeModalCards", JSON.stringify(newState));
            return newState;
        });

        setSelectedCards(prev => {
            const newState = { ...prev, [activeCategory]: previewCard };
            localStorage.setItem("selectedCards", JSON.stringify(newState));
            return newState;
        });

        setPreviewCard(null);
    };

    const handleCancel = () => {
        setPreviewCard(null);
    };

    const handleCancelSelection = () => {
        if (!activeCategory) return;

        setActiveModalCards(prev => {
            const newState = { ...prev };
            delete newState[activeCategory];
            localStorage.setItem("activeModalCards", JSON.stringify(newState));
            return newState;
        });

        setSelectedCards(prev => {
            const newState = { ...prev };
            delete newState[activeCategory];
            localStorage.setItem("selectedCards", JSON.stringify(newState));
            return newState;
        });
    };

    // Dynamic styles based on fullscreenMode
    const containerStyles = fullscreenMode
        ? "h-full overflow-y-auto p-6 scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30"
        : "relative mt-4 h-[59vh] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-lg scrollbar-thin scrollbar-track-depth scrollbar-thumb-depth-secondary";

    const gridStyles = fullscreenMode
        ? "grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
        : "grid grid-cols-3 gap-4";

    const loadingContainerStyles = fullscreenMode
        ? "flex h-full items-center justify-center"
        : "mt-4 flex h-[59vh] items-center justify-center rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg";

    const loadingTextColor = fullscreenMode ? "text-white/60" : "text-depth-secondary";

    if (loading) {
        return (
            <div className={loadingContainerStyles}>
                <div className="text-center">
                    <div className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${fullscreenMode ? 'border-white/20 border-t-white' : 'border-depth border-t-[var(--depth-color-primary)]'}`}></div>
                    <p className={loadingTextColor}>Mengambil Data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={loadingContainerStyles}>
                <div className="text-center">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative h-full ${isSubmitted ? "pointer-events-none" : ""}`}>
            <div className={containerStyles}>
                <div className={gridStyles}>
                    {Array.isArray(asistens) && asistens.length > 0 ? (
                        asistens.map((asisten) => (
                            <CardPolling
                                key={asisten.kode}
                                image={asisten?.foto}
                                name={`${asisten.kode} | ${asisten.nama}`}
                                description={asisten.deskripsi || "Asisten Laboratorium Daskom"}
                                onClick={() => handleCardClick(asisten)}
                                isDimmed={
                                    !!activeModalCards[activeCategory] &&
                                    activeModalCards[activeCategory]?.kode !== asisten.kode
                                }
                                isSelected={selectedCards[activeCategory]?.kode === asisten.kode}
                                darkMode={fullscreenMode}
                            />
                        ))
                    ) : (
                        <div className={`col-span-full py-8 text-center ${fullscreenMode ? 'text-white/60' : 'text-depth-secondary'}`}>
                            No asisten data available
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal - Before confirmation */}
            {previewCard && !isSubmitted && (
                <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                    <div className="pointer-events-auto flex h-[55vh] w-[23vw] flex-col rounded-depth-lg border-2 border-amber-400 bg-depth-card p-6 shadow-depth-lg backdrop-blur-sm">
                        <div className="flex-1">
                            {previewCard?.foto ? (
                                <Image
                                    src={previewCard.foto}
                                    transformation={[{ height: "165", width: "165", crop: "maintain_ratio" }]}
                                    alt={previewCard?.nama || "Asisten"}
                                    className="mx-auto mb-4 h-[165px] w-[165px] rounded-full object-cover shadow-depth-md ring-2 ring-amber-400 ring-offset-2"
                                    loading="lazy"
                                />
                            ) : (
                                <img
                                    src={daskomIcon}
                                    alt={previewCard?.nama || "Asisten"}
                                    className="mx-auto mb-4 h-[165px] w-[165px] rounded-full object-cover shadow-depth-md ring-2 ring-amber-400 ring-offset-2"
                                />
                            )}
                            <h2 className="mb-3 text-center text-xl font-bold text-depth-primary">
                                {previewCard?.kode || ""} | {previewCard?.nama || ""}
                            </h2>
                            <p className="text-center text-sm font-semibold text-depth-secondary">
                                {previewCard?.deskripsi || "Asisten Laboratorium Daskom"}
                            </p>
                            <p className="mt-3 text-center text-xs text-amber-600">
                                Konfirmasi pilihan Anda
                            </p>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-md transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-depth-lg"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 rounded-depth-md border border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
                            >
                                Konfirmasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmed Selection Modal */}
            {activeModalCards[activeCategory] && !previewCard && (
                <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                    <div className="pointer-events-auto flex h-[55vh] w-[23vw] flex-col rounded-depth-lg border-2 border-[var(--depth-color-primary)] bg-depth-card p-6 shadow-depth-lg backdrop-blur-sm">
                        <div className="flex-1">
                            {activeModalCards[activeCategory]?.foto ? (
                                <Image
                                    src={activeModalCards[activeCategory].foto}
                                    transformation={[{ height: "165", width: "165", crop: "maintain_ratio" }]}
                                    alt={activeModalCards[activeCategory]?.nama || "Asisten"}
                                    className="mx-auto mb-4 h-[165px] w-[165px] rounded-full object-cover shadow-depth-md ring-2 ring-[var(--depth-color-primary)] ring-offset-2"
                                    loading="lazy"
                                />
                            ) : (
                                <img
                                    src={daskomIcon}
                                    alt={activeModalCards[activeCategory]?.nama || "Asisten"}
                                    className="mx-auto mb-4 h-[165px] w-[165px] rounded-full object-cover shadow-depth-md ring-2 ring-[var(--depth-color-primary)] ring-offset-2"
                                />
                            )}
                            <h2 className="mb-3 text-center text-xl font-bold text-depth-primary">
                                {activeModalCards[activeCategory]?.kode || ""} | {activeModalCards[activeCategory]?.nama || ""}
                            </h2>
                            <p className="text-center text-sm font-semibold text-depth-secondary">
                                {activeModalCards[activeCategory]?.deskripsi || "Asisten Laboratorium Daskom"}
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-medium text-green-600">Terpilih</span>
                            </div>
                        </div>
                        {!isSubmitted && (
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleCancelSelection}
                                    className="w-full rounded-depth-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-depth-md transition-all hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-depth-lg"
                                >
                                    Batalkan Pilihan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
