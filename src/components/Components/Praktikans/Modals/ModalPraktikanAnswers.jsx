import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import { api } from "@/lib/api";

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const safeFetch = async (url) => {
    try {
        const { data } = await api.get(url);
        return data;
    } catch (error) {
        const status = error?.response?.status;
        if (status === 404 || status === 403) {
            return error?.response?.data ?? {
                status: "error",
                message: error?.response?.data?.message ?? error?.message ?? "Gagal memuat jawaban.",
            };
        }

        throw error;
    }
};

const normaliseEssayAnswers = (payload, key) => {
    if (!payload) {
        return { items: [], message: null };
    }

    if (Array.isArray(payload[key])) {
        return {
            items: payload[key],
            message: null,
        };
    }

    const fallbackMessage = payload?.message ?? payload?.messages ?? null;

    return {
        items: [],
        message: fallbackMessage,
    };
};

const normaliseChoiceAnswers = (payload, key) => {
    if (!payload) {
        return { items: [], message: null };
    }

    if (Array.isArray(payload[key])) {
        return {
            items: payload[key].map((item, index) => ({
                ...item,
                index,
                options: normalizeArray(item.options),
            })),
            message: null,
        };
    }

    const fallbackMessage = payload?.message ?? payload?.messages ?? null;

    return {
        items: [],
        message: fallbackMessage,
    };
};

const ANSWER_QUERY_KEY = "praktikan-answer-detail";

export default function ModalPraktikanAnswers({ isOpen, onClose, modulId, modulTitle }) {
    if (!isOpen) {
        return null;
    }

    const answersQuery = useQuery({
        queryKey: [ANSWER_QUERY_KEY, modulId],
        enabled: isOpen && Boolean(modulId),
        queryFn: async () => {
            if (!modulId) {
                return null;
            }

            const [tp, ta, jurnal, mandiri, tk, fitb] = await Promise.all([
                safeFetch(`/api-v1/jawaban-tp/${modulId}`),
                safeFetch(`/api-v1/jawaban-ta/${modulId}`),
                safeFetch(`/api-v1/jawaban-jurnal/${modulId}`),
                safeFetch(`/api-v1/jawaban-tm/${modulId}`),
                safeFetch(`/api-v1/jawaban-tk/${modulId}`),
                safeFetch(`/api-v1/jawaban-fitb/${modulId}`),
            ]);

            return {
                tp: normaliseEssayAnswers(tp, "jawaban_tp"),
                ta: normaliseChoiceAnswers(ta, "jawaban_ta"),
                jurnal: normaliseEssayAnswers(jurnal, "jawaban_jurnal"),
                mandiri: normaliseEssayAnswers(mandiri, "jawaban_mandiri"),
                tk: normaliseChoiceAnswers(tk, "jawaban_tk"),
                fitb: normaliseEssayAnswers(fitb, "jawaban_fitb"),
            };
        },
        onError: (error) => {
            const message = error?.response?.data?.message ?? error?.message ?? "Gagal memuat jawaban.";
            toast.error(message);
        },
    });

    const sections = useMemo(() => {
        if (!answersQuery.data) {
            return [];
        }

        return [
            {
                key: "tp",
                title: "Tugas Pendahuluan",
                type: "essay",
                payload: answersQuery.data.tp,
            },
            {
                key: "ta",
                title: "Tes Awal",
                type: "choice",
                payload: answersQuery.data.ta,
            },
            {
                key: "jurnal",
                title: "Jurnal",
                type: "essay",
                payload: answersQuery.data.jurnal,
            },
            {
                key: "fitb",
                title: "Fill in the Blank",
                type: "essay",
                payload: answersQuery.data.fitb,
            },
            {
                key: "mandiri",
                title: "Mandiri",
                type: "essay",
                payload: answersQuery.data.mandiri,
            },
            {
                key: "tk",
                title: "Tes Keterampilan",
                type: "choice",
                payload: answersQuery.data.tk,
            },
        ];
    }, [answersQuery.data]);

    const [activeTab, setActiveTab] = useState(sections[0]?.key ?? null);

    useEffect(() => {
        if (!sections.length) {
            setActiveTab(null);
            return;
        }

        if (!activeTab || !sections.some((section) => section.key === activeTab)) {
            setActiveTab(sections[0].key);
        }
    }, [sections, activeTab]);

    const activeSection = sections.find((section) => section.key === activeTab) ?? sections[0] ?? null;

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div className="depth-modal-container w-[100vw] h-[85vh] space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <header className="space-y-1 pr-2">
                        <h2 className="text-lg font-semibold text-depth-primary">Jawaban Praktikum</h2>
                        <p className="text-sm text-depth-secondary">
                            Modul: <span className="font-medium text-depth-primary">{modulTitle ?? `Modul ${modulId}`}</span>
                        </p>
                    </header>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup jawaban praktikan" />
                </div>

                {answersQuery.isLoading && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-depth-secondary">
                        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]" />
                        Memuat jawaban praktikan...
                    </div>
                )}

                {answersQuery.isError && !answersQuery.isLoading && (
                    <div className="rounded-depth-md border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-depth-sm">
                        {answersQuery.error?.response?.data?.message ?? answersQuery.error?.message ?? "Gagal memuat jawaban."}
                    </div>
                )}

                {!answersQuery.isLoading && !answersQuery.isError && sections.length > 0 && (
                    <>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {sections.map((section) => {
                                const isActive = section.key === activeTab;
                                return (
                                    <button
                                        type="button"
                                        key={section.key}
                                        onClick={() => setActiveTab(section.key)}
                                        className={`rounded-depth-full border px-4 py-2 text-sm font-semibold transition ${isActive
                                            ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/10 text-[var(--depth-color-primary)]"
                                            : "border-depth bg-depth-card text-depth-secondary hover:text-depth-primary"
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {activeSection ? (
                                <SectionAnswers section={activeSection} />
                            ) : (
                                <p className="text-sm text-depth-secondary">Tidak ada jawaban untuk tab ini.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ModalOverlay>
    );
}

const SectionAnswers = ({ section }) => {
    const { title, payload, type } = section;
    const items = payload?.items ?? [];
    const message = payload?.message ?? null;

    return (
        <section className="rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
            <header className="mb-3">
                <h3 className="text-base font-semibold text-depth-primary">{title}</h3>
            </header>

            {message && (
                <div className="mb-3 rounded-depth-md border border-amber-300 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                    {message}
                </div>
            )}

            {items.length === 0 && !message && (
                <p className="text-sm text-depth-secondary">Belum ada jawaban yang tersimpan.</p>
            )}

            {items.length > 0 && (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {items.map((item, index) => (
                        <AnswerCard key={item.id ?? item.soal_id ?? index} item={item} index={index} type={type} />
                    ))}
                </div>
            )}
        </section>
    );
};

const AnswerCard = ({ item, index, type }) => {
    if (type === "choice") {
        const selectedId = Number(item?.selected_opsi_id ?? 0);
        const correctId = Number(item?.opsi_benar_id ?? 0);

        return (
            <article className="p-4">
                <header className="mb-2 space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-mediumGray">
                        Soal {index + 1}
                    </div>
                    {item?.pertanyaan &&
                        <pre className="text-sm font-medium text-depth-primary whitespace-pre-line break-words">{item.pertanyaan}</pre>
                    }
                </header>
                <ul className="space-y-2">
                    {item.options.map((option) => {
                        const isSelected = Number(option.id) === selectedId;
                        const isCorrect = Number(option.id) === correctId;

                        const toneClass = isCorrect
                            ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-400"
                            : isSelected
                                ? "border-amber-400/60 bg-amber-500/10 text-amber-500"
                                : "border-depth bg-depth-card text-depth-primary";

                        return (
                            <li
                                key={option.id}
                                className={`rounded-lg border px-3 py-2 text-sm shadow-sm transition ${toneClass}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span>{option.text}</span>
                                    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase">
                                        {isCorrect && <span>Benar</span>}
                                        {isSelected && !isCorrect && <span className="text-amber-600">Jawabanmu</span>}
                                        {isSelected && isCorrect && <span>Jawabanmu</span>}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </article>
        );
    }

    const answerText = item?.jawaban ?? "-";
    const questionLabel = item?.soal_text ?? item?.pertanyaan ?? null;

    return (
        <article className="p-4">
            <header className="mb-2 space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-mediumGray">
                    Soal {index + 1}
                </div>
                {questionLabel && <p className="text-sm font-medium text-depth-primary">{questionLabel}</p>}
            </header>
            <div className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-inner">
                <pre className="whitespace-pre-line break-words">
                    {answerText}
                </pre>
            </div>
        </article>
    );
};
