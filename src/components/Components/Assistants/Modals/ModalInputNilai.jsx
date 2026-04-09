import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { send } from "@/lib/http";
import { api } from "@/lib/api";
import {
    store as storeNilai,
    update as updateNilai,
} from "@/lib/routes/nilai";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const scoresSchema = [
    { key: "tp", label: "TP" },
    { key: "ta", label: "TA" },
    { key: "d1", label: "D1" },
    { key: "d2", label: "D2" },
    { key: "d3", label: "D3" },
    { key: "d4", label: "D4" },
    { key: "l1", label: "L1" },
    { key: "l2", label: "L2" },
];

const clampScore = (value) => {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        return 0;
    }

    return Math.min(Math.max(parsed, 0), 100);
};

const clampRating = (value) => {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        return null;
    }

    const clamped = Math.min(Math.max(parsed, 0.1), 5);

    return Number(clamped.toFixed(1));
};

const isLikelyImageUrl = (url) => {
    if (typeof url !== "string" || url.trim() === "") {
        return false;
    }

    try {
        const normalized = url.split("?")[0] ?? url;

        return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(normalized);
    } catch (error) {
        return false;
    }
};

const normalizeAnswerWithAttachment = (entry) => {
    const rawAnswer = typeof entry?.jawaban === "string" ? entry.jawaban : "";
    const normalizedAnswer = rawAnswer === "-" ? "" : rawAnswer;
    const directAttachmentUrl =
        typeof entry?.attachment_url === "string" && entry.attachment_url.trim() !== ""
            ? entry.attachment_url.trim()
            : null;
    const directAttachmentFileId =
        typeof entry?.attachment_file_id === "string" && entry.attachment_file_id.trim() !== ""
            ? entry.attachment_file_id.trim()
            : null;

    if (directAttachmentUrl) {
        return {
            answerText: normalizedAnswer,
            attachmentUrl: directAttachmentUrl,
            attachmentFileId: directAttachmentFileId,
        };
    }

    if (normalizedAnswer.trim().startsWith("{") || normalizedAnswer.trim().startsWith("[")) {
        try {
            const parsed = JSON.parse(normalizedAnswer);

            if (parsed && typeof parsed === "object") {
                const candidateUrl =
                    typeof parsed.url === "string"
                        ? parsed.url
                        : typeof parsed.attachment_url === "string"
                            ? parsed.attachment_url
                            : typeof parsed.fileUrl === "string"
                                ? parsed.fileUrl
                                : typeof parsed.file_url === "string"
                                    ? parsed.file_url
                                    : null;

                if (candidateUrl) {
                    return {
                        answerText:
                            typeof parsed.answer === "string"
                                ? parsed.answer
                                : typeof parsed.caption === "string"
                                    ? parsed.caption
                                    : "",
                        attachmentUrl: candidateUrl,
                        attachmentFileId:
                            parsed.fileId ??
                            parsed.file_id ??
                            parsed.attachment_file_id ??
                            null,
                    };
                }
            }
        } catch (error) {
            // Treat as plain text if parsing fails.
        }
    }

    return {
        answerText: normalizedAnswer,
        attachmentUrl: null,
        attachmentFileId: null,
    };
};

const QUESTION_TABS = [
    { key: "tp", label: "Tugas Pendahuluan", needsNim: true },
    { key: "ta", label: "Tes Awal" },
    { key: "jurnal", label: "Jurnal" },
    { key: "fitb", label: "FITB" },
    { key: "mandiri", label: "Mandiri" },
    { key: "tk", label: "Tes Keterampilan" },
];

export default function ModalInputNilai({
    onClose,
    assignment,
    asistenId,
    onSaved,
}) {
    const [scores, setScores] = useState({
        tp: 0,
        ta: 0,
        d1: 0,
        d2: 0,
        d3: 0,
        d4: 0,
        l1: 0,
        l2: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeQuestionTab, setActiveQuestionTab] = useState(null);
    const [rating, setRating] = useState(null);

    const nilaiSebelumnya = assignment?.nilai ?? null;
    const praktikan = assignment?.praktikan ?? null;
    const modul = assignment?.modul ?? null;
    const kelas = praktikan?.kelas ?? null;

    const availableQuestionTabs = useMemo(() => {
        if (!modul?.id) {
            return [];
        }

        return QUESTION_TABS.filter((tab) =>
            tab.needsNim ? Boolean(praktikan?.nim) : Boolean(praktikan?.id)
        );
    }, [modul?.id, praktikan?.id, praktikan?.nim]);

    useEffect(() => {
        if (availableQuestionTabs.length === 0) {
            setActiveQuestionTab(null);

            return;
        }

        if (
            !availableQuestionTabs.some((tab) => tab.key === activeQuestionTab)
        ) {
            setActiveQuestionTab(availableQuestionTabs[0].key);
        }
    }, [availableQuestionTabs, activeQuestionTab]);

    const selectedQuestionTab = useMemo(
        () =>
            availableQuestionTabs.find(
                (tab) => tab.key === activeQuestionTab
            ) ?? null,
        [availableQuestionTabs, activeQuestionTab]
    );

    const canFetchQuestions = Boolean(
        selectedQuestionTab &&
        modul?.id &&
        (selectedQuestionTab.needsNim ? praktikan?.nim : praktikan?.id)
    );

    const {
        data: questionResult,
        isLoading: isQuestionsLoading,
        isError: isQuestionsError,
        error: questionsError,
        refetch: refetchQuestions,
    } = useQuery({
        queryKey: [
            "assistant-answers",
            selectedQuestionTab?.key,
            praktikan?.id,
            praktikan?.nim,
            modul?.id,
        ],
        enabled: canFetchQuestions,
        retry: (failureCount, error) => {
            const status = error?.response?.status;

            if (status === 404) {
                return false;
            }

            return failureCount < 2;
        },
        queryFn: async () => {
            if (!selectedQuestionTab || !modul?.id) {
                return { questions: [] };
            }

            try {
                switch (selectedQuestionTab.key) {
                    case "tp": {
                        const nim = praktikan?.nim;

                        if (!nim) {
                            throw new Error("NIM praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-tp/${nim}/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ?? "Gagal memuat jawaban TP."
                            );
                        }

                        const entries = Array.isArray(data?.data?.jawabanData)
                            ? data.data.jawabanData
                            : [];

                        return {
                            questions: entries.map((item, index) => ({
                                soalId: item.soal_id ?? index,
                                question:
                                    item.soal_text ?? "Soal tidak tersedia",
                                answer:
                                    typeof item.jawaban === "string"
                                        ? item.jawaban
                                        : "-",
                                options: [],
                                selectedOptionId: null,
                                correctOptionId: null,
                            })),
                            notice: data?.message,
                        };
                    }
                    case "ta": {
                        const praktikanId = praktikan?.id;

                        if (!praktikanId) {
                            throw new Error("Praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-ta/praktikan/${praktikanId}/modul/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ??
                                "Gagal memuat jawaban Tes Awal."
                            );
                        }

                        const entries = Array.isArray(data?.jawaban_ta)
                            ? data.jawaban_ta
                            : [];

                        return {
                            questions: entries.map((item, index) => ({
                                soalId: item.soal_id ?? index,
                                question:
                                    item.pertanyaan ?? "Soal tidak tersedia",
                                answer: null,
                                options: Array.isArray(item.options)
                                    ? item.options
                                    : [],
                                selectedOptionId: item.selected_opsi_id ?? null,
                                correctOptionId: item.opsi_benar_id ?? null,
                            })),
                            notice: data?.message,
                        };
                    }
                    case "jurnal": {
                        const praktikanId = praktikan?.id;

                        if (!praktikanId) {
                            throw new Error("Praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-jurnal/praktikan/${praktikanId}/modul/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ?? "Gagal memuat jawaban jurnal."
                            );
                        }

                        const entries = Array.isArray(data?.jawaban_jurnal)
                            ? data.jawaban_jurnal
                            : [];

                        return {
                            questions: entries.map((item, index) => ({
                                soalId: item.soal_id ?? index,
                                question:
                                    item.soal_text ?? "Soal tidak tersedia",
                                answer:
                                    typeof item.jawaban === "string"
                                        ? item.jawaban
                                        : "-",
                                options: [],
                                selectedOptionId: null,
                                correctOptionId: null,
                            })),
                            notice: data?.message,
                        };
                    }
                    case "fitb": {
                        const praktikanId = praktikan?.id;

                        if (!praktikanId) {
                            throw new Error("Praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-fitb/praktikan/${praktikanId}/modul/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ?? "Gagal memuat jawaban FITB."
                            );
                        }

                        const entries = Array.isArray(data?.jawaban_fitb)
                            ? data.jawaban_fitb
                            : [];

                        return {
                            questions: entries.map((item, index) => {
                                const parsed =
                                    normalizeAnswerWithAttachment(item);

                                return {
                                    soalId: item.soal_id ?? index,
                                    question:
                                        item.soal_text ??
                                        "Soal tidak tersedia",
                                    answer: parsed.answerText,
                                    attachmentUrl: parsed.attachmentUrl,
                                    attachmentFileId:
                                        parsed.attachmentFileId,
                                    options: [],
                                    selectedOptionId: null,
                                    correctOptionId: null,
                                };
                            }),
                            notice: data?.message,
                        };
                    }
                    case "mandiri": {
                        const praktikanId = praktikan?.id;

                        if (!praktikanId) {
                            throw new Error("Praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-mandiri/praktikan/${praktikanId}/modul/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ?? "Gagal memuat jawaban mandiri."
                            );
                        }

                        const entries = Array.isArray(data?.jawaban_mandiri)
                            ? data.jawaban_mandiri
                            : [];

                        return {
                            questions: entries.map((item, index) => ({
                                soalId: item.soal_id ?? index,
                                question:
                                    item.soal_text ?? "Soal tidak tersedia",
                                answer:
                                    typeof item.jawaban === "string"
                                        ? item.jawaban
                                        : "-",
                                options: [],
                                selectedOptionId: null,
                                correctOptionId: null,
                            })),
                            notice: data?.message,
                        };
                    }
                    case "tk": {
                        const praktikanId = praktikan?.id;

                        if (!praktikanId) {
                            throw new Error("Praktikan tidak ditemukan.");
                        }

                        const { data } = await api.get(
                            `/api-v1/jawaban-tk/praktikan/${praktikanId}/modul/${modul.id}`
                        );

                        if (data?.success === false) {
                            throw new Error(
                                data?.message ??
                                "Gagal memuat jawaban Tes Keterampilan."
                            );
                        }

                        const entries = Array.isArray(data?.jawaban_tk)
                            ? data.jawaban_tk
                            : [];

                        return {
                            questions: entries.map((item, index) => ({
                                soalId: item.soal_id ?? index,
                                question:
                                    item.pertanyaan ?? "Soal tidak tersedia",
                                answer: null,
                                options: Array.isArray(item.options)
                                    ? item.options
                                    : [],
                                selectedOptionId: item.selected_opsi_id ?? null,
                                correctOptionId: item.opsi_benar_id ?? null,
                            })),
                            notice: data?.message,
                        };
                    }
                    default:
                        return { questions: [] };
                }
            } catch (error) {
                const status = error?.response?.status;

                if (status === 404) {
                    return {
                        questions: [],
                        notice:
                            error?.response?.data?.message ??
                            "Jawaban tidak ditemukan.",
                    };
                }

                throw error;
            }
        },
    });

    const questions = questionResult?.questions ?? [];
    const questionNotice = questionResult?.notice;

    const canFetchTestScores = Boolean(praktikan?.id && modul?.id);

    const { data: taScoreData } = useQuery({
        queryKey: ["ta-auto-score", praktikan?.id, modul?.id],
        enabled: canFetchTestScores,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const { data } = await api.get(
                `/api-v1/jawaban-ta/praktikan/${praktikan.id}/modul/${modul.id}`
            );
            const entries = Array.isArray(data?.jawaban_ta) ? data.jawaban_ta : [];

            if (entries.length === 0) {
                return { score: 0, hasAnswers: false };
            }

            const correct = entries.filter(
                (e) => e.selected_opsi_id && e.selected_opsi_id === e.opsi_benar_id
            ).length;

            return {
                score: Math.round((correct / entries.length) * 100 * 100) / 100,
                hasAnswers: true,
            };
        },
    });

    const { data: tkScoreData } = useQuery({
        queryKey: ["tk-auto-score", praktikan?.id, modul?.id],
        enabled: canFetchTestScores,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const { data } = await api.get(
                `/api-v1/jawaban-tk/praktikan/${praktikan.id}/modul/${modul.id}`
            );
            const entries = Array.isArray(data?.jawaban_tk) ? data.jawaban_tk : [];

            if (entries.length === 0) {
                return { score: 0, hasAnswers: false };
            }

            const correct = entries.filter(
                (e) => e.selected_opsi_id && e.selected_opsi_id === e.opsi_benar_id
            ).length;

            return {
                score: Math.round((correct / entries.length) * 100 * 100) / 100,
                hasAnswers: true,
            };
        },
    });

    useEffect(() => {
        if (nilaiSebelumnya) {
            setScores({
                tp: clampScore(nilaiSebelumnya.tp),
                ta: clampScore(nilaiSebelumnya.ta),
                d1: clampScore(nilaiSebelumnya.d1),
                d2: clampScore(nilaiSebelumnya.d2),
                d3: clampScore(nilaiSebelumnya.d3),
                d4: clampScore(nilaiSebelumnya.d4),
                l1: clampScore(nilaiSebelumnya.l1 ?? nilaiSebelumnya.i1),
                l2: clampScore(nilaiSebelumnya.l2 ?? nilaiSebelumnya.i2),
            });
            setRating(clampRating(nilaiSebelumnya.rating));
        } else {
            setScores({
                tp: 0,
                ta: 0,
                d1: 0,
                d2: 0,
                d3: 0,
                d4: 0,
                l1: 0,
                l2: 0,
            });
            setRating(null);
        }
    }, [nilaiSebelumnya]);

    useEffect(() => {
        if (taScoreData?.hasAnswers) {
            setScores((prev) => ({ ...prev, ta: clampScore(taScoreData.score) }));
        }
    }, [taScoreData]);

    useEffect(() => {
        if (tkScoreData?.hasAnswers) {
            setScores((prev) => ({ ...prev, l1: clampScore(tkScoreData.score) }));
        }
    }, [tkScoreData]);

    const average = useMemo(() => {
        const total = scoresSchema.reduce(
            (sum, current) => sum + clampScore(scores[current.key] ?? 0),
            0
        );
        return Number((total / scoresSchema.length).toFixed(2));
    }, [scores]);

    const handleScoreChange = (key) => (event) => {
        const value = clampScore(event.target.value);
        setScores((prev) => ({ ...prev, [key]: value }));
    };

    const handleRatingNumberChange = (event) => {
        const { value } = event.target;

        if (value === "") {
            setRating(null);

            return;
        }

        setRating(clampRating(value));
    };

    const handleRatingSliderChange = (event) => {
        setRating(clampRating(event.target.value));
    };

    const handleSubmit = () => {
        if (!asistenId) {
            toast.error(
                "Data asisten tidak ditemukan. Silakan muat ulang halaman."
            );
            return;
        }

        if (!praktikan?.id || !modul?.id || !kelas?.id) {
            toast.error("Data praktikan tidak lengkap untuk menyimpan nilai.");
            return;
        }

        if (rating !== null && (rating < 0.1 || rating > 5)) {
            toast.error("Rating harus berada di antara 0.1 hingga 5.0.");
            return;
        }

        setIsSaving(true);

        const payload = {
            ...scores,
            modul_id: modul.id,
            asisten_id: asistenId,
            kelas_id: kelas.id,
            praktikan_id: praktikan.id,
            rating: rating,
        };

        const action = nilaiSebelumnya?.id
            ? updateNilai(nilaiSebelumnya.id)
            : storeNilai();

        send(action, payload)
            .then(() => {
                toast.success("Nilai berhasil disimpan 🎉");
                onSaved?.();
            })
            .catch((error) => {
                const responseMessage = error?.response?.data?.message;
                toast.error(
                    responseMessage ?? "Terjadi kesalahan saat menyimpan nilai."
                );
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50" style={{ padding: 0 }}>
            <div className="flex h-full w-full items-center justify-center px-4 py-6 sm:py-10 pointer-events-none">
                <div
                    className="depth-modal-container flex w-full max-w-5xl max-h-[85vh] flex-col overflow-hidden pointer-events-auto"
                    style={{ "--depth-modal-max-width": "72rem" }}
                >
                    <div className="relative mb-6">
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup input nilai" className="absolute right-0 -top-2" />
                        <header className="text-center">
                        <h2 className="text-2xl font-semibold text-depth-primary">
                            {nilaiSebelumnya ? "Perbarui Nilai" : "Input Nilai"}
                        </h2>
                        <p className="mt-2 text-sm text-depth-secondary">
                            {praktikan?.nama ?? "Praktikan"} (
                            {praktikan?.nim ?? "-"}) ·{" "}
                            {modul?.judul ?? "Modul tidak dikenal"}
                        </p>
                        </header>
                    </div>

                    <div className="min-h-0 flex-1 pr-1 sm:pr-2">
                        <div className="space-y-6 pb-1">
                            <div className="grid grid-cols-10 gap-4">
                                {scoresSchema.map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className="flex flex-col gap-1 text-xs font-semibold text-depth-primary"
                                    >
                                        <span>{label}</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            max={100}
                                            value={scores[key]}
                                            onChange={handleScoreChange(key)}
                                            className="h-10 rounded-depth-md border border-depth bg-depth-card p-2 text-center text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                            style={{
                                                MozAppearance: "textfield",
                                                appearance: "textfield",
                                            }}
                                            onWheel={(e) => e.target.blur()}
                                        />
                                    </label>
                                ))}
                                <label className="flex flex-col gap-1 text-xs font-semibold text-depth-primary">
                                    <span>Rata-rata</span>
                                    <input
                                        type="number"
                                        readOnly
                                        value={average}
                                        className="cursor-not-allowed h-10 rounded-depth-md border border-depth bg-depth-card p-2 text-center text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        style={{
                                            MozAppearance: "textfield",
                                            appearance: "textfield",
                                        }}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-xs font-semibold text-depth-primary">
                                    <span>Rating</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                        value={rating ?? ""}
                                        onChange={handleRatingNumberChange}
                                        className="h-10 rounded-depth-md border border-depth bg-depth-card p-2 text-center text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        style={{
                                            MozAppearance: "textfield",
                                            appearance: "textfield",
                                        }}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                        value={rating ?? 0.1}
                                        onChange={handleRatingSliderChange}
                                        className="mt-2"
                                    />
                                </label>
                            </div>
                            
                                <div className="flex flex-wrap gap-2">
                                    {availableQuestionTabs.length === 0 ? (
                                        <span className="text-xs text-depth-secondary">
                                            Tidak ada tipe soal yang dapat
                                            ditinjau.
                                        </span>
                                    ) : (
                                        availableQuestionTabs.map((tab) => {
                                            const isActive =
                                                tab.key === activeQuestionTab;
                                            const baseClasses =
                                                "rounded-depth-full border px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--depth-color-primary)]";
                                            const variantClasses = isActive
                                                ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/15 text-[var(--depth-color-primary)] shadow-depth-sm"
                                                : "border-depth bg-depth-interactive text-depth-primary shadow-depth-inset hover:-translate-y-0.5 hover:shadow-depth-sm";

                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveQuestionTab(
                                                            tab.key
                                                        )
                                                    }
                                                    className={`${baseClasses} ${variantClasses}`}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {availableQuestionTabs.length === 0 ? (
                                    <div className="mt-4 rounded-depth-md border border-depth bg-depth-interactive/40 p-6 text-sm text-depth-secondary">
                                        Soal dan jawaban tidak tersedia.
                                        Pastikan praktikan telah mengerjakan
                                        modul ini.
                                    </div>
                                ) : (
                                    <div className="mt-4 max-h-[32rem] overflow-y-auto pr-1">
                                        {isQuestionsLoading ? (
                                            <div className="flex items-center justify-center gap-2 py-10 text-depth-primary">
                                                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--depth-color-primary)] border-t-transparent" />
                                                Memuat jawaban...
                                            </div>
                                        ) : isQuestionsError ? (
                                            <div className="rounded-depth-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                                                <p>
                                                    {questionsError?.response
                                                        ?.data?.message ??
                                                        questionsError?.message ??
                                                        "Terjadi kesalahan saat memuat jawaban."}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        refetchQuestions()
                                                    }
                                                    className="mt-3 inline-flex items-center justify-center rounded-depth-full border border-rose-400/60 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                                                >
                                                    Coba Lagi
                                                </button>
                                            </div>
                                        ) : questions.length === 0 ? (
                                            <div className="rounded-depth-md border border-depth bg-depth-interactive/40 p-6 text-sm text-depth-secondary">
                                                {questionNotice ??
                                                    "Belum ada jawaban yang disubmit untuk tipe soal ini."}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 py-1">
                                                {questions.map(
                                                    (item, index) => {
                                                        const hasOptions =
                                                            Array.isArray(
                                                                item.options
                                                            ) &&
                                                            item.options
                                                                .length > 0;
                                                        const answerValue =
                                                            typeof item.answer ===
                                                                "string"
                                                                ? item.answer
                                                                : "";
                                                        const trimmedAnswer =
                                                            answerValue.trim();
                                                        const hasEssayAnswer =
                                                            trimmedAnswer !==
                                                            "" &&
                                                            trimmedAnswer !==
                                                            "-";
                                                        const attachmentUrl =
                                                            typeof item.attachmentUrl ===
                                                                "string" &&
                                                                item.attachmentUrl.trim() !== ""
                                                                ? item.attachmentUrl
                                                                : null;
                                                        const hasAttachment = Boolean(
                                                            attachmentUrl
                                                        );
                                                        const showEmptyState =
                                                            !hasEssayAnswer &&
                                                            !hasAttachment;

                                                        return (
                                                            <article
                                                                key={`${activeQuestionTab ??
                                                                    "tab"
                                                                    }-${item.soalId ??
                                                                    index
                                                                    }`}
                                                                className="hover:rounded-depth-lg hover:border-depth hover:bg-depth-card/80 hover:shadow-depth-md hover:shadow-depth-lg transition-shadow p-4"
                                                            >
                                                                <pre className="text-sm font-semibold text-depth-primary whitespace-pre-line break-words">
                                                                    {index + 1}.{" "}
                                                                    {item.question ??
                                                                        "Soal tidak tersedia"}
                                                                </pre>

                                                                {hasOptions ? (
                                                                    <ul className="mt-4 space-y-3">
                                                                        {item.options.map(
                                                                            (
                                                                                option,
                                                                                optionIndex
                                                                            ) => {
                                                                                const optionKey =
                                                                                    option?.id ??
                                                                                    `${item.soalId ??
                                                                                    index
                                                                                    }-${optionIndex}`;
                                                                                const isCorrect =
                                                                                    Boolean(
                                                                                        option?.is_correct
                                                                                    );
                                                                                const isSelected =
                                                                                    item.selectedOptionId ===
                                                                                    option?.id;
                                                                                const baseOptionClasses =
                                                                                    "rounded-depth-md border p-3 text-sm shadow-depth-sm transition";
                                                                                let toneClasses =
                                                                                    "border-depth bg-depth-interactive/40 text-depth-primary";

                                                                                if (
                                                                                    isCorrect
                                                                                ) {
                                                                                    toneClasses =
                                                                                        "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/10 text-depth-primary";
                                                                                } else if (
                                                                                    isSelected
                                                                                ) {
                                                                                    toneClasses =
                                                                                        "border-amber-400/70 bg-amber-400/15 text-amber-900 dark:text-amber-100";
                                                                                }

                                                                                const badges =
                                                                                    [];

                                                                                if (
                                                                                    isCorrect
                                                                                ) {
                                                                                    badges.push(
                                                                                        {
                                                                                            key: "correct",
                                                                                            label: "Benar",
                                                                                            className:
                                                                                                "bg-[var(--depth-color-primary)]/20 text-[var(--depth-color-primary)]",
                                                                                        }
                                                                                    );
                                                                                }

                                                                                if (
                                                                                    isSelected
                                                                                ) {
                                                                                    badges.push(
                                                                                        {
                                                                                            key: "selected",
                                                                                            label: "Dipilih",
                                                                                            className:
                                                                                                isCorrect
                                                                                                    ? "bg-[var(--depth-color-primary)]/20 text-[var(--depth-color-primary)]"
                                                                                                    : "bg-amber-400/25 text-amber-900 dark:text-amber-100",
                                                                                        }
                                                                                    );
                                                                                }

                                                                                return (
                                                                                    <li
                                                                                        key={
                                                                                            optionKey
                                                                                        }
                                                                                        className={`${baseOptionClasses} ${toneClasses}`}
                                                                                    >
                                                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                                            <span className="font-medium">
                                                                                                {option?.text ??
                                                                                                    "Opsi tidak tersedia"}
                                                                                            </span>

                                                                                            {badges.length >
                                                                                                0 && (
                                                                                                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                                                                                                        {badges.map(
                                                                                                            (
                                                                                                                badge
                                                                                                            ) => (
                                                                                                                <span
                                                                                                                    key={
                                                                                                                        badge.key
                                                                                                                    }
                                                                                                                    className={`rounded-depth-full px-3 py-1 ${badge.className}`}
                                                                                                                >
                                                                                                                    {
                                                                                                                        badge.label
                                                                                                                    }
                                                                                                                </span>
                                                                                                            )
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                        </div>
                                                                                    </li>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </ul>
                                                                ) : (
                                                                    <div className="mt-4 max-h-72 overflow-auto rounded-depth-md border border-depth bg-depth-interactive/40 p-4 text-sm text-depth-primary shadow-depth-sm">
                                                                        {(hasAttachment || hasEssayAnswer) && (
                                                                            <div className="space-y-4">
                                                                                {hasAttachment && (
                                                                                    <div>
                                                                                        <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                                                            Lampiran Jawaban
                                                                                        </p>
                                                                                        <div className="mt-2 rounded-depth-md border border-dashed border-depth bg-depth-card/60 p-3">
                                                                                            {isLikelyImageUrl(
                                                                                                attachmentUrl
                                                                                            ) ? (
                                                                                                <img
                                                                                                    src={
                                                                                                        attachmentUrl
                                                                                                    }
                                                                                                    alt="Lampiran jawaban praktikan"
                                                                                                    className="h-auto w-full rounded-depth-md object-contain"
                                                                                                    loading="lazy"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                                                                    <span className="text-depth-primary">
                                                                                                        File lampiran tersedia.
                                                                                                    </span>
                                                                                                    <a
                                                                                                        href={
                                                                                                            attachmentUrl
                                                                                                        }
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="inline-flex items-center gap-2 rounded-depth-full bg-[var(--depth-color-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                                                                    >
                                                                                                        Buka File
                                                                                                    </a>
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="mt-2 text-right">
                                                                                                <a
                                                                                                    href={
                                                                                                        attachmentUrl
                                                                                                    }
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-xs font-semibold text-[var(--depth-color-primary)] underline-offset-2 hover:underline"
                                                                                                >
                                                                                                    Lihat di tab baru
                                                                                                </a>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {hasEssayAnswer && (
                                                                                    <pre className="min-w-full whitespace-pre-wrap break-words font-sans leading-relaxed">
                                                                                        {
                                                                                            answerValue
                                                                                        }
                                                                                    </pre>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {showEmptyState && (
                                                                            <span className="text-depth-secondary italic">
                                                                                Belum ada jawaban
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </article>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>

                    <footer className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? "Menyimpan..." : "Simpan Nilai"}
                        </button>
                    </footer>
                </div>
            </div>
        </ModalOverlay>
    );
}
