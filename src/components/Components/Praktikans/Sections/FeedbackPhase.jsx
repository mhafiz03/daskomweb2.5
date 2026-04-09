import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAsistensQuery } from "@/hooks/useAsistensQuery";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { api } from "@/lib/api";

const STAR_VALUES = [1, 2, 3, 4, 5];

const formatAssistantOption = (assistant) => {
    if (!assistant) {
        return "";
    }

    const code = assistant.kode ?? assistant.code ?? "";
    const name = assistant.nama ?? assistant.name ?? "";

    if (!code && !name) {
        return "";
    }

    if (!name) {
        return code;
    }

    if (!code) {
        return name;
    }

    return `${code} — ${name}`;
};

const getAssistantLabel = (assistant, fallback = "") => {
    if (!assistant) {
        return fallback ?? "";
    }

    const formatted = formatAssistantOption(assistant);
    if (formatted.trim() !== "") {
        return formatted;
    }

    const backup =
        assistant.nama ??
        assistant.name ??
        assistant.kode ??
        assistant.code ??
        fallback ??
        "";

    return backup;
};

const matchesAssistantQuery = (assistant, query) => {
    if (!assistant) {
        return false;
    }

    const normalized = query.trim().toLowerCase();
    if (normalized === "") {
        return true;
    }

    const candidates = [
        assistant.nama,
        assistant.name,
        assistant.kode,
        assistant.code,
        formatAssistantOption(assistant),
    ];

    return candidates
        .filter(Boolean)
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalized));
};

export default function FeedbackPhase({
    praktikan,
    modulId = null,
    assistantId = null,
    moduleLabel: moduleLabelOverride = null,
    onClose,
    onSubmitted,
}) {
    const praktikanData = praktikan ?? null;
    const praktikanId = praktikanData?.id ?? null;
    const normalizedModulId = modulId ? String(modulId) : null;
    const normalizedAssistantId = assistantId ? String(assistantId) : null;

    const [feedback, setFeedback] = useState("");
    const [ratingPraktikum, setRatingPraktikum] = useState(0);
    const [ratingAsisten, setRatingAsisten] = useState(0);
    const [selectedAssistantId, setSelectedAssistantId] = useState(
        normalizedAssistantId ? String(normalizedAssistantId) : null
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dropdownRef = useRef(null);
    const initialAssistantAppliedRef = useRef(false);

    const { data: assistantOptions = [] } = useAsistensQuery();
    const { data: modules = [] } = useModulesQuery();

    const modulData = useMemo(() => {
        if (!normalizedModulId) {
            return null;
        }

        return (
            modules.find((module) => String(module?.idM ?? module?.id) === normalizedModulId) ?? null
        );
    }, [modules, normalizedModulId]);

    const modulLabel =
        moduleLabelOverride ??
        modulData?.judul ??
        modulData?.name ??
        (normalizedModulId ? `Modul #${normalizedModulId}` : null);

    useEffect(() => {
        if (initialAssistantAppliedRef.current) {
            return;
        }

        if (!assistantOptions) {
            return;
        }

        initialAssistantAppliedRef.current = true;
        setSelectedAssistantId(null);
        setSearchTerm("");
    }, [assistantOptions]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
                return;
            }
            setIsDropdownOpen(false);
            setHighlightedIndex(-1);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);


    const filteredAssistants = useMemo(() => {
        if (!searchTerm) {
            return assistantOptions;
        }

        return assistantOptions.filter((assistant) => matchesAssistantQuery(assistant, searchTerm));
    }, [assistantOptions, searchTerm]);

    useEffect(() => {
        if (!isDropdownOpen || filteredAssistants.length === 0) {
            setHighlightedIndex(-1);
            return;
        }

        setHighlightedIndex((previous) => {
            if (previous === -1) {
                return 0;
            }

            if (previous >= filteredAssistants.length) {
                return filteredAssistants.length - 1;
            }

            return previous;
        });
    }, [filteredAssistants.length, isDropdownOpen]);

    const handleAssistantSelect = (nextAssistantId) => {
        const resolvedId = nextAssistantId !== null && nextAssistantId !== undefined ? String(nextAssistantId) : null;
        setSelectedAssistantId(resolvedId);
        initialAssistantAppliedRef.current = true;
        const assistant = assistantOptions.find((option) => String(option?.id) === resolvedId);
        setSearchTerm(getAssistantLabel(assistant, searchTerm));
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
    };

    const handleClose = () => {
        if (typeof onClose === "function") {
            onClose();
            return;
        }

        window.location.assign("/praktikum");
    };

    const handleSubmit = async () => {
        const trimmedFeedback = feedback.trim();

        if (!normalizedModulId) {
            toast.error("Modul feedback tidak ditemukan.");
            return;
        }

        if (!praktikanId) {
            toast.error("Data praktikan tidak valid.");
            return;
        }

        const hasRatings = ratingPraktikum > 0 && ratingAsisten > 0;

        if (trimmedFeedback.length < 10 || trimmedFeedback.length > 1000 || !selectedAssistantId || !hasRatings) {
            if (trimmedFeedback.length < 10) {
                toast.error("Feedback minimal 10 karakter.");
            } else if (trimmedFeedback.length > 1000) {
                toast.error("Feedback maksimal 1000 karakter.");
            } else {
                toast.error("Lengkapi feedback, pilih asisten penanggung jawab, dan berikan rating praktik & asisten.");
            }
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post("/api-v1/laporan-praktikan", {
                praktikan_id: praktikanId,
                modul_id: Number(normalizedModulId),
                laporan: trimmedFeedback,
                pesan: trimmedFeedback,
                rating: ratingPraktikum || null,
                rating_praktikum: ratingPraktikum || null,
                rating_asisten: ratingAsisten || null,
                asisten_id: selectedAssistantId ? Number(selectedAssistantId) : null,
            });

            toast.success("Feedback berhasil dikirim. Terima kasih!");
            if (typeof onSubmitted === "function") {
                onSubmitted();
            } else {
                handleClose();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message ?? error?.message ?? "Gagal mengirim feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingsComplete = ratingPraktikum > 0 && ratingAsisten > 0;
    const feedbackLength = feedback.trim().length;
    const feedbackValid = feedbackLength >= 10 && feedbackLength <= 1000;

    const isSubmitDisabled =
        !normalizedModulId ||
        !selectedAssistantId ||
        !feedbackValid ||
        !ratingsComplete ||
        isSubmitting;

    return (
        <div
            className="mt-6 flex flex-1 flex-col gap-6 overflow-hidden"
            style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
                <div className="">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-depth-primary">Feedback</h1>
                            {modulLabel && (
                                <p className="mt-2 text-xs font-medium text-depth-tertiary">
                                    Modul Praktikum: <span className="text-depth-primary">{modulLabel}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {!normalizedModulId && (
                        <div className="mb-6 rounded-depth-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Modul untuk feedback belum ditentukan.
                        </div>
                    )}

                    <div className="mb-6 max-w-3xl" ref={dropdownRef}>
                        <label className="mb-3 block text-sm font-semibold text-depth-primary">
                            Pilih Asisten Penanggung Jawab
                        </label>
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setIsDropdownOpen(true);
                                    setHighlightedIndex(-1);
                                }}
                                onFocus={() => {
                                    setIsDropdownOpen(true);
                                    if (filteredAssistants.length > 0 && highlightedIndex === -1) {
                                        setHighlightedIndex(0);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        if (
                                            highlightedIndex >= 0 &&
                                            highlightedIndex < filteredAssistants.length
                                        ) {
                                            handleAssistantSelect(filteredAssistants[highlightedIndex].id);
                                        } else if (filteredAssistants.length > 0) {
                                            handleAssistantSelect(filteredAssistants[0].id);
                                        }
                                    } else if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        if (!isDropdownOpen) {
                                            setIsDropdownOpen(true);
                                            setHighlightedIndex(0);
                                            return;
                                        }
                                        if (filteredAssistants.length === 0) {
                                            setHighlightedIndex(-1);
                                            return;
                                        }
                                        setHighlightedIndex((previous) => {
                                            const nextIndex = previous + 1;
                                            if (nextIndex >= filteredAssistants.length || nextIndex < 0) {
                                                return 0;
                                            }
                                            return nextIndex;
                                        });
                                    } else if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        if (!isDropdownOpen) {
                                            setIsDropdownOpen(true);
                                            setHighlightedIndex(Math.max(filteredAssistants.length - 1, 0));
                                            return;
                                        }
                                        if (filteredAssistants.length === 0) {
                                            setHighlightedIndex(-1);
                                            return;
                                        }
                                        setHighlightedIndex((previous) => {
                                            const nextIndex = previous - 1;
                                            if (nextIndex < 0) {
                                                return filteredAssistants.length - 1;
                                            }
                                            return nextIndex;
                                        });
                                    } else if (event.key === "Escape") {
                                        setIsDropdownOpen(false);
                                        setHighlightedIndex(-1);
                                    }
                                }}
                                placeholder="Cari asisten berdasarkan kode atau nama"
                                className="w-full rounded-depth-lg border border-depth bg-depth-card px-4 py-3 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                            {isDropdownOpen && (
                                <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                                    {filteredAssistants.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-depth-secondary">Asisten tidak ditemukan.</div>
                                    ) : (
                                        <ul className="divide-y divide-[color:var(--depth-border)]">
                                            {filteredAssistants.map((assistant, index) => {
                                                const isActive = index === highlightedIndex;
                                                return (
                                                    <li key={`assistant-option-${assistant.id}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssistantSelect(assistant.id)}
                                                            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-depth-interactive ${String(assistant.id) === selectedAssistantId
                                                                    ? "bg-depth-interactive/80 font-semibold text-depth-primary"
                                                                    : isActive
                                                                        ? "bg-depth-interactive/60 text-depth-primary"
                                                                        : "text-depth-primary"
                                                                }`}
                                                        >
                                                            <span>{formatAssistantOption(assistant)}</span>
                                                            {String(assistant.id) === selectedAssistantId && (
                                                                <svg
                                                                    className="h-4 w-4 text-[var(--depth-color-primary)]"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth={2}
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="">
                            <h3 className="text-sm font-semibold text-depth-primary">Praktikum</h3>
                            <div className="mt-4 w-full rounded-depth-lg border border-depth bg-depth-card px-4 py-3 shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0">
                                {STAR_VALUES.map((value) => (
                                    <button
                                        key={`praktikum-star-${value}`}
                                        type="button"
                                        onClick={() => setRatingPraktikum(value)}
                                        className="p-1 mx-2"
                                    >
                                        <svg
                                            className={`h-8 w-8 drop-shadow-sm transition ${value <= ratingPraktikum ? "text-yellow-400" : "text-depth-disabled"
                                                }`}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="">
                            <h3 className="text-sm font-semibold text-depth-primary">Asisten</h3>
                            <div className="mt-4 w-full rounded-depth-lg border border-depth bg-depth-card px-4 py-3 shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0">
                                {STAR_VALUES.map((value) => (
                                    <button
                                        key={`assistant-star-${value}`}
                                        type="button"
                                        onClick={() => setRatingAsisten(value)}
                                        className="p-1 mx-2"
                                    >
                                        <svg
                                            className={`h-8 w-8 drop-shadow-sm transition ${value <= ratingAsisten ? "text-yellow-400" : "text-depth-disabled"
                                                }`}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="feedback" className="mb-2 block text-sm font-semibold text-depth-primary">
                            Feedback Praktikan
                        </label>
                        <textarea
                            id="feedback"
                            value={feedback}
                            onChange={(event) => setFeedback(event.target.value.slice(0, 1000))}
                            rows={8}
                            maxLength={1000}
                            className="w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="Bagikan pengalaman Anda selama praktikum, kendala yang dihadapi, saran perbaikan, atau hal lain yang ingin disampaikan..."
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className={feedbackLength < 10 || feedbackLength > 1000 ? "text-red-500" : "text-green-600 dark:text-green-400"}>
                                {feedbackLength < 10
                                    ? `Minimal 10 karakter (${Math.max(0, 10 - feedbackLength)} lagi)`
                                    : feedbackLength > 1000
                                        ? `Terlalu panjang (${feedbackLength - 1000} karakter lebih)`
                                        : "Feedback sudah cukup"}
                            </span>
                            <span className="text-depth-secondary">{feedbackLength} / 1000 karakter</span>
                        </div>
                    </div>

                    <div className="mt-6 mb-10 flex flex-col justify-end gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className={`glass-button inline-flex min-w-[160px] items-center justify-center gap-2 rounded-depth-lg px-6 py-3 font-semibold shadow-depth-md transition-all ${isSubmitDisabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                }`}
                            style={{
                                background: isSubmitDisabled
                                    ? undefined
                                    : "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
                            }}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isSubmitting ? "Mengirim..." : "Kirim Feedback"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
