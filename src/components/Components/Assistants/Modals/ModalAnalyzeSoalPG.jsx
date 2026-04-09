import { useEffect, useMemo, useState } from "react";
import { useSoalAnalytics } from "@/hooks/useSoalAnalytics";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const normalizeModuleOption = (module) => {
    if (!module) {
        return null;
    }

    const value = module.idM ?? module.id ?? module.value ?? module.uuid ?? module.ID;
    if (value === undefined || value === null) {
        return null;
    }

    return {
        value: String(value),
        label: module.judul ?? module.name ?? module.label ?? module.title ?? `Modul ${value}`,
    };
};

const SummaryCard = ({ title, value, tone = "primary" }) => {
    const toneClass = {
        primary: "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/10 text-[var(--depth-color-primary)]",
        secondary: "border-depth bg-depth-card text-depth-primary",
    }[tone];

    return (
        <div className={`rounded-depth-md border px-4 py-3 text-center shadow-depth-sm ${toneClass}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
};

export default function ModalAnalyzeSoalPG({
    kategoriSoal,
    modules = [],
    initialModuleId = "",
    onClose,
}) {
    const moduleOptions = useMemo(
        () => (modules ?? []).map(normalizeModuleOption).filter(Boolean),
        [modules],
    );

    const [selectedModuleId, setSelectedModuleId] = useState(() => {
        if (initialModuleId) {
            return String(initialModuleId);
        }
        return moduleOptions[0]?.value ?? "";
    });

    useEffect(() => {
        if (initialModuleId) {
            setSelectedModuleId(String(initialModuleId));
        }
    }, [initialModuleId]);

    const {
        data: analytics,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useSoalAnalytics(kategoriSoal, selectedModuleId, {
        enabled: Boolean(kategoriSoal && selectedModuleId),
        refetchOnWindowFocus: false,
    });

    const summary = analytics?.summary ?? {
        total_questions: 0,
        total_responses: 0,
        respondent_count: 0,
    };

    const questions = Array.isArray(analytics?.questions) ? analytics.questions : [];
    const maxOptionCount = useMemo(
        () => questions.reduce((acc, question) => {
            const totalOptions = Array.isArray(question?.options) ? question.options.length : 0;
            return Math.max(acc, totalOptions);
        }, 0),
        [questions],
    );

    const formatPercentage = (rawValue) => {
        const value = Number.isFinite(rawValue) ? rawValue : 0;
        return `${Math.min(Math.max(value, 0), 100).toFixed(1)}%`;
    };

    const renderOptionCell = (option, maxPercentage, isHighest = false) => {
        const percentage = Number.isFinite(option?.percentage) ? option.percentage : 0;
        const safePercentage = Math.min(Math.max(percentage, 0), 100);
        const optionLabel = option?.text?.trim() || "Pilihan belum diisi";
        const barWidth = maxPercentage > 0 ? `${(safePercentage / maxPercentage) * 100}%` : `${safePercentage}%`;
        const isCorrect = Boolean(option?.is_correct);

        return (
            <div className={`space-y-1.5 rounded-depth-md p-2 transition-all ${isHighest ? 'bg-[var(--depth-color-primary)]/10 ring-2 ring-[var(--depth-color-primary)]/30' : ''}`} title={optionLabel}>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                    <span className={`text-sm font-semibold ${isHighest ? 'text-[var(--depth-color-primary)]' : 'text-depth-primary'}`}>
                        {safePercentage.toFixed(1)}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`max-w-[14rem] truncate text-sm font-medium ${isCorrect ? "text-[var(--depth-color-primary)]" : isHighest ? "text-[var(--depth-color-primary)]" : "text-depth-primary"}`}>
                        {optionLabel}
                    </span>
                </div>
                <div className="h-1.5 rounded-depth-full bg-depth-card">
                    <div
                        className={`h-full rounded-depth-full ${isCorrect ? "bg-[var(--depth-color-primary)]" : isHighest ? "bg-[var(--depth-color-primary)]/80" : "bg-depth-secondary/70"
                            }`}
                        style={{ width: barWidth }}
                    />
                </div>
                <div className="flex items-center justify-between text-[11px] text-depth-secondary">
                    <span>{option?.count ?? 0} jawaban</span>
                </div>
            </div>
        );
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container flex max-h-[90vh] flex-col overflow-hidden"
                style={{ "--depth-modal-max-width": "64rem" }}
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Analisis Jawaban Praktikan</h2>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            Pilih Modul
                        </label>
                        <select
                            className="w-72 rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)]"
                            value={selectedModuleId}
                            onChange={(event) => setSelectedModuleId(event.target.value)}
                        >
                            <option value="">- Pilih Modul -</option>
                            {moduleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup analisis soal" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-depth-secondary">
                            Memuat analisis jawaban…
                        </div>
                    ) : isError ? (
                        <div className="rounded-depth-md border border-red-400 bg-red-50/80 p-4 text-sm text-red-600 shadow-depth-sm">
                            {error?.message ?? "Gagal memuat analisis jawaban."}
                        </div>
                    ) : !selectedModuleId ? (
                        <div className="flex h-full items-center justify-center text-sm text-depth-secondary">
                            Pilih modul untuk melihat analisis jawaban.
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="rounded-depth-md border border-depth bg-depth-card p-6 text-sm text-depth-secondary shadow-depth-sm">
                            Belum ada data jawaban untuk modul ini.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-3">
                                <SummaryCard title="Total Pertanyaan" value={summary.total_questions ?? 0} />
                                <SummaryCard
                                    title="Total Jawaban Masuk"
                                    value={summary.total_responses ?? 0}
                                    tone="secondary"
                                />
                                <SummaryCard
                                    title="Praktikan Berpartisipasi"
                                    value={summary.respondent_count ?? 0}
                                    tone="secondary"
                                />
                            </div>

                            <div className="space-y-3">
                                {isFetching ? (
                                    <div className="rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-xs text-depth-secondary shadow-depth-sm">
                                        Memperbarui data…
                                    </div>
                                ) : null}
                                <div className="overflow-x-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                                    <table className="min-w-[60rem] table-fixed divide-y divide-[color:var(--depth-border)] text-sm">
                                        <thead className="bg-[var(--depth-color-primary)]/10 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-depth-primary">Pertanyaan</th>
                                                <th className="px-4 py-3 text-left text-depth-primary">Jawaban Benar</th>
                                                <th className="px-4 py-3 text-left text-depth-primary">Opsi 1</th>
                                                <th className="px-4 py-3 text-left text-depth-primary">Opsi 2</th>
                                                <th className="px-4 py-3 text-left text-depth-primary">Opsi 3</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[color:var(--depth-border)]">
                                            {questions.map((question) => {
                                                const options = Array.isArray(question?.options) ? question.options : [];
                                                const maxPercentage = options.reduce(
                                                    (acc, option) => Math.max(acc, Number(option?.percentage ?? 0)),
                                                    0,
                                                );
                                                const correctOption = options.find((item) => Boolean(item?.is_correct));
                                                
                                                // Find the highest percentage among all options
                                                const highestPercentage = options.reduce(
                                                    (max, opt) => Math.max(max, Number(opt?.percentage ?? 0)),
                                                    0
                                                );

                                                return (
                                                    <tr key={question?.soal_id ?? question?.id} className="align-top">
                                                        <td className="px-4 py-4 max-w-[2rem]">
                                                            <div className="space-y-1" title={question?.pertanyaan ?? "Pertanyaan belum tersedia."}>
                                                                <p className="max-w-[5rem] truncate text-sm font-semibold text-depth-primary">
                                                                    {question?.pertanyaan ?? "Pertanyaan belum tersedia."}
                                                                </p>
                                                                <div className="text-[11px] text-depth-secondary">
                                                                    {question?.total_responses ?? 0} jawaban | {options.length} pilihan
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 max-w-[5rem]">
                                                            {correctOption ? (
                                                                <div className={`space-y-1.5 rounded-depth-md p-2 transition-all ${Number(correctOption?.percentage ?? 0) === highestPercentage && highestPercentage > 0 ? 'bg-[var(--depth-color-primary)]/10 ring-2 ring-[var(--depth-color-primary)]/20' : ''}`} title={correctOption?.text ?? "Jawaban benar"}>

                                                                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                                        <span className={`text-sm font-semibold ${Number(correctOption?.percentage ?? 0) === highestPercentage && highestPercentage > 0 ? 'text-[var(--depth-color-primary)]' : 'text-depth-primary'}`}>
                                                                            {formatPercentage(correctOption?.percentage)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="max-w-[12rem] h-1.5 rounded-depth-full bg-depth-card">
                                                                        <div
                                                                            className="h-full rounded-depth-full bg-[var(--depth-color-primary)]"
                                                                            style={{ width: `${Math.min(Math.max(correctOption?.percentage ?? 0, 0), 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="max-w-[12rem] truncate text-sm font-semibold text-[var(--depth-color-primary)]">
                                                                        {correctOption?.text ?? "-"}
                                                                    </p>
                                                                    <div className="text-[11px] text-depth-secondary">
                                                                        {correctOption?.count ?? 0} jawaban
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-depth-secondary">-</span>
                                                            )}
                                                        </td>
                                                        {Array.from({ length: maxOptionCount }).map((_, optionIndex) => {
                                                            const option = options[optionIndex];
                                                            const isCorrectOption = option && Boolean(option?.is_correct);
                                                            const isHighest = option && !isCorrectOption && Number(option?.percentage ?? 0) === highestPercentage && highestPercentage > 0;

                                                            return (
                                                                <td key={`question-${question?.soal_id ?? question?.id}-option-${optionIndex}`} className="max-w-[5rem] px-4 py-4">
                                                                    {option && !isCorrectOption ? renderOptionCell(option, maxPercentage, isHighest) : null}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalOverlay>
    );
}
