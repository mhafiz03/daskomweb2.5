import { useState } from 'react';

export default function ScoreDisplayModal({
    isOpen,
    onClose,
    phaseType,
    correctAnswers = 0,
    totalQuestions = 0,
    percentage,
    isTotClass = false,
    hasError = false,
    onRetry = null,
    isRetrying = false,
}) {
    if (!isOpen) {
        return null;
    }

    const safeTotal = Math.max(0, Number(totalQuestions) || 0);
    const displayTotal = isTotClass ? safeTotal : 10;

    const safeCorrect = Math.max(0, Number(correctAnswers) || 0);
    const displayCorrect = Math.min(safeCorrect, displayTotal);

    const scorePercentage =
        displayTotal > 0
            ? Math.round((displayCorrect / displayTotal) * 100)
            : 0;


    const phaseLabel = phaseType === "tk" ? "Tes Keterampilan" : "Tes Awal";

    // Determine grade and color based on percentage
    let gradeColor = 'text-red-600 dark:text-red-400';
    let bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))';

    if (!hasError) {
        if (scorePercentage >= 90) {
            gradeColor = 'text-green-600 dark:text-green-400';
            bgGradient = 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))';
        } else if (scorePercentage >= 80) {
            gradeColor = 'text-blue-600 dark:text-blue-400';
            bgGradient = 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))';
        } else if (scorePercentage >= 70) {
            gradeColor = 'text-cyan-600 dark:text-cyan-400';
            bgGradient = 'linear-gradient(135deg, rgba(6, 182, 212, 0.9), rgba(8, 145, 178, 0.9))';
        } else if (scorePercentage >= 60) {
            gradeColor = 'text-amber-600 dark:text-amber-400';
            bgGradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9))';
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2.25rem] border border-depth/40 bg-white/90 shadow-[0_30px_70px_rgba(15,23,42,0.35)] backdrop-blur-xl backdrop-saturate-150 dark:border-emerald-200/40 dark:bg-depth-card">
                <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: bgGradient }}
                />

                <div className="px-8 pb-10 pt-12 text-center">
                    {hasError ? (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div className="grid h-20 w-20 place-items-center rounded-full bg-red-100 dark:bg-red-900/30 shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
                                    <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Terjadi Kesalahan</p>
                                <h2 className="mt-2 text-3xl font-bold text-depth-primary">{phaseLabel}</h2>
                                <p className="mt-3 text-sm text-depth-secondary">
                                    Gagal memuat nilai dari server. Silakan coba lagi.
                                </p>
                            </div>

                            <div className="mx-auto grid max-w-md gap-4">
                                <div className="rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4">
                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                        ⚠️ Tidak dapat mengambil data nilai. Periksa koneksi internet Anda dan coba lagi.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex min-w-[140px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-depth-primary border border-depth bg-white hover:bg-depth-interactive/20 transition-all hover:-translate-y-0.5"
                                >
                                    Tutup
                                </button>
                                {onRetry && (
                                    <button
                                        type="button"
                                        onClick={onRetry}
                                        disabled={isRetrying}
                                        className="inline-flex min-w-[140px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isRetrying ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sedang Dimuat...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Coba Lagi
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div
                                    className="grid h-20 w-20 place-items-center rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                                    style={{ background: bgGradient }}
                                >
                                    <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm uppercase tracking-[0.3em] text-depth-secondary">Ringkasan Nilai</p>
                                <h2 className="mt-2 text-3xl font-bold text-depth-primary">{phaseLabel}</h2>
                                <p className="mt-3 text-sm text-depth-secondary">
                                    Berikut performa kamu pada tahap ini.
                                </p>
                            </div>

                            <div className="mx-auto grid max-w-md gap-6">
                                <div className="grid grid-cols-2 gap-4 rounded-3xl border border-depth bg-depth-interactive/40 p-6">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-xs font-semibold tracking-wide text-depth-secondary">Nilai (%)</span>
                                        <span className="text-5xl font-black text-depth-primary">{scorePercentage}<span className="text-2xl align-top">%</span></span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-depth-card/80 p-4 shadow-inner">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">Jawaban Benar</div>
                                        <div className="text-4xl font-bold text-depth-primary">{displayCorrect}/{displayTotal}</div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/40">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(displayTotal > 0 ? (displayCorrect / displayTotal) * 100 : 0)}%`,
                                                    background: bgGradient,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-depth-interactive/30 p-5 text-sm font-medium text-depth-primary">
                                    {scorePercentage >= 90 && "🎉 Luar biasa! Pertahankan performa terbaikmu."}
                                    {scorePercentage >= 80 && scorePercentage < 90 && "👏 Bagus sekali! Kamu berada di jalur yang tepat."}
                                    {scorePercentage >= 70 && scorePercentage < 80 && "👍 Hasil cukup baik, tinggal sedikit lagi menuju puncak."}
                                    {scorePercentage >= 60 && scorePercentage < 70 && "💪 Jangan menyerah, terus asah pemahamanmu."}
                                    {scorePercentage < 60 && "📚 Tetap semangat! Pelajari kembali materi dan coba lagi."}
                                </div>
                            </div>

                            <div className="mt-10 flex justify-center">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex min-w-[160px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
                                    style={{ background: bgGradient }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
