import { useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import { useKelasQuery } from "@/hooks/useKelasQuery";
import { usePraktikanLeaderboardQuery } from "@/hooks/usePraktikanLeaderboardQuery";
import { usePraktikanLeaderboardDetailQuery } from "@/hooks/usePraktikanLeaderboardDetailQuery";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const LIMIT_OPTIONS = [
    { value: 10, label: "Top 10" },
    { value: 25, label: "Top 25" },
    { value: 50, label: "Top 50" },
    { value: 100, label: "Top 100" },
];

const SCORE_KEYS = [
    { key: "tp", label: "TP" },
    { key: "ta", label: "TA" },
    { key: "d1", label: "D1" },
    { key: "d2", label: "D2" },
    { key: "d3", label: "D3" },
    { key: "d4", label: "D4" },
    { key: "l1", label: "L1" },
    { key: "l2", label: "L2" },
];

const formatAverage = (value) => {
    const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
    if (Number.isFinite(numeric)) {
        return numeric.toFixed(2);
    }

    return "-";
};

const formatDate = (value) => {
    if (!value) {
        return "Belum ada";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Belum ada";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsed);
};

const rankTone = (index) => {
    if (index === 0) {
        return "from-yellow-200/80 via-amber-100/60 to-white border-yellow-300";
    }

    if (index === 1) {
        return "from-slate-200/70 via-slate-100/50 to-white border-slate-200";
    }

    if (index === 2) {
        return "from-orange-200/80 via-amber-100/60 to-white border-amber-200";
    }

    return "from-white via-white to-white border-depth";
};

const EyeIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

export default function ContentRanking() {
    const [selectedClass, setSelectedClass] = useState("all");
    const [limit, setLimit] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortState, setSortState] = useState({ column: null, direction: "desc" });
    const [detailState, setDetailState] = useState({ isOpen: false, entry: null });

    const filters = useMemo(() => {
        const query = { limit };

        if (selectedClass !== "all") {
            const parsed = Number.parseInt(selectedClass, 10);
            if (!Number.isNaN(parsed)) {
                query.kelas_id = parsed;
            }
        }

        return query;
    }, [limit, selectedClass]);

    const {
        data: kelasList = [],
        isLoading: kelasLoading,
    } = useKelasQuery();

    const kelasOptions = useMemo(() => {
        const options = [
            { value: "all", label: "Semua kelas" },
        ];

        if (Array.isArray(kelasList)) {
            kelasList.forEach((kelas) => {
                if (!kelas?.id) {
                    return;
                }

                options.push({
                    value: String(kelas.id),
                    label: kelas.kelas ?? kelas.nama ?? `Kelas ${kelas.id}`,
                });
            });
        }

        return options;
    }, [kelasList]);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = usePraktikanLeaderboardQuery(filters);

    const toolbarConfig = useMemo(
        () => ({
            title: "Leaderboard Praktikan",
        }),
        [isFetching, refetch],
    );

    useAssistantToolbar(toolbarConfig);

    const leaderboardItems = data?.items ?? [];

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return leaderboardItems;
        }

        const query = searchTerm.trim().toLowerCase();
        return leaderboardItems.filter((item) => {
            const name = item.nama?.toLowerCase() ?? "";
            const nim = item.nim?.toLowerCase() ?? "";
            const kelas = item.kelas?.toLowerCase() ?? "";
            return name.includes(query) || nim.includes(query) || kelas.includes(query);
        });
    }, [leaderboardItems, searchTerm]);

    const sortedItems = useMemo(() => {
        if (!sortState.column) {
            return filteredItems;
        }

        const columnKey = sortState.column;
        const sorted = [...filteredItems].sort((first, second) => {
            const parseNumeric = (value) => {
                if (value === null || value === undefined) {
                    return null;
                }

                const numericValue = typeof value === "string" ? Number.parseFloat(value) : Number(value);
                return Number.isFinite(numericValue) ? numericValue : null;
            };

            const firstValue = parseNumeric(first[columnKey]);
            const secondValue = parseNumeric(second[columnKey]);

            if (firstValue === null && secondValue === null) {
                return first.nama.localeCompare(second.nama);
            }

            if (firstValue === null) {
                return sortState.direction === "asc" ? 1 : -1;
            }

            if (secondValue === null) {
                return sortState.direction === "asc" ? -1 : 1;
            }

            if (firstValue === secondValue) {
                return first.nama.localeCompare(second.nama);
            }

            return sortState.direction === "asc"
                ? firstValue - secondValue
                : secondValue - firstValue;
        });

        return sorted;
    }, [filteredItems, sortState]);

    const topThree = useMemo(() => sortedItems.slice(0, 3), [sortedItems]);

    const hasNoData = !isLoading && sortedItems.length === 0;

    const handleSort = (column) => {
        setSortState((previous) => {
            if (previous.column === column) {
                if (previous.direction === "desc") {
                    return { column, direction: "asc" };
                }

                return { column: null, direction: "desc" };
            }

            return { column, direction: "desc" };
        });
    };

    const renderSortIndicator = (column) => {
        if (sortState.column !== column) {
            return <span className="text-xs opacity-60">⇅</span>;
        }

        if (sortState.direction === "desc") {
            return <span className="text-xs">↓</span>;
        }

        return <span className="text-xs">↑</span>;
    };

    const handleOpenDetail = (entry) => {
        setDetailState({ isOpen: true, entry });
    };

    const handleCloseDetail = () => {
        setDetailState({ isOpen: false, entry: null });
    };

    const detailPraktikanId = detailState.isOpen && detailState.entry
        ? detailState.entry.praktikan_id
        : null;

    const {
        data: detailData,
        isLoading: isDetailLoading,
        isError: isDetailError,
        error: detailError,
    } = usePraktikanLeaderboardDetailQuery(detailPraktikanId, {
        enabled: detailState.isOpen,
        refetchOnWindowFocus: false,
    });

    const detailSummary = detailData?.summary ?? { nilai_count: 0, rating_count: 0 };
    const detailModules = detailData?.modules ?? [];
    const detailPraktikan = detailData?.praktikan ?? detailState.entry;

    return (
        <section className="space-y-6 pb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-depth-secondary" htmlFor="leaderboard-search">
                        Cari praktikan
                    </label>
                    <input
                        id="leaderboard-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Nama, NIM, atau kelas"
                        className="w-72 rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-sm text-depth-primary shadow-depth-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)]"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col text-sm text-depth-secondary">
                        <label className="mb-1 font-medium" htmlFor="kelas-options">
                            Kelas
                        </label>
                        <select
                            id="kelas-options"
                            value={selectedClass}
                            onChange={(event) => setSelectedClass(event.target.value)}
                            disabled={kelasLoading}
                            className="w-56 rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {kelasOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col text-sm text-depth-secondary">
                        <label className="mb-1 font-medium" htmlFor="limit-options">
                            Jumlah baris
                        </label>
                        <select
                            id="limit-options"
                            value={limit}
                            onChange={(event) => setLimit(Number(event.target.value))}
                            className="w-40 rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)]"
                        >
                            {LIMIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {topThree.length === 0 && !isLoading ? (
                    <div className="md:col-span-2 xl:col-span-3 rounded-depth-lg border border-depth bg-depth-card p-6 text-center text-depth-secondary shadow-depth-md">
                        Belum ada nilai yang memenuhi kriteria saat ini.
                    </div>
                ) : (
                    topThree.map((entry, index) => (
                        <article
                            key={`highlight-${entry.praktikan_id}`}
                            className={`rounded-depth-lg border bg-gradient-to-br p-6 text-depth-primary shadow-depth-lg transition ${rankTone(index)}`}
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-depth-secondary dark:text-gray-200">#{index + 1}</p>
                                    <h3 className="mt-1 text-xl font-semibold">{entry.nama}</h3>
                                    <p className="text-sm text-depth-secondary dark:text-gray-200">NIM: {entry.nim}</p>
                                    <p className="text-sm text-depth-secondary dark:text-gray-200">Kelas: {entry.kelas ?? "-"}</p>
                                </div>
                                <div className="rounded-depth-lg bg-white/50 px-4 py-2 text-right">
                                    <p className="text-sm font-semibold text-depth-secondary dark:text-gray-50">Nilai rata-rata</p>
                                    <p className="text-2xl font-bold text-depth-primary">{formatAverage(entry.average_nilai)}</p>
                                    <p className="mt-2 text-sm font-semibold text-depth-secondary dark:text-gray-50">Rating rata-rata</p>
                                    <p className="text-xl font-semibold text-depth-primary dark:text-white">{formatAverage(entry.average_rating)}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-depth-secondary dark:text-gray-50">
                                <span className="font-medium text-depth-primary">Terakhir dinilai:</span> {formatDate(entry.last_submitted_at)}
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                <div className="flex items-center justify-between border-b border-depth px-6 py-4">
                    <h4 className="text-base font-semibold text-depth-primary">Daftar praktikan</h4>
                    {isFetching ? (
                        <span className="text-xs font-medium text-depth-secondary">Memuat ulang data…</span>
                    ) : null}
                </div>

                {isLoading ? (
                    <div className="px-6 py-12 text-center text-depth-secondary">Memuat leaderboard…</div>
                ) : isError ? (
                    <div className="px-6 py-12 text-center text-red-500">
                        {error?.message ?? "Tidak dapat memuat data leaderboard."}
                    </div>
                ) : hasNoData ? (
                    <div className="px-6 py-12 text-center text-depth-secondary">
                        Tidak ada praktikan yang memenuhi pencarian saat ini.
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="min-w-full table-fixed">
                            <thead className="sticky top-0 bg-depth-card">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                    <th className="w-16 px-6 py-3">Rank</th>
                                    <th className="px-6 py-3">Nama</th>
                                    <th className="w-40 px-6 py-3">NIM</th>
                                    <th className="w-36 px-6 py-3">Kelas</th>
                                    <th className="w-32 px-6 py-3">
                                        <button
                                            type="button"
                                            onClick={() => handleSort("average_nilai")}
                                            className="flex items-center gap-2 text-left uppercase tracking-wide text-depth-secondary hover:text-depth-primary focus-visible:outline-none"
                                        >
                                            <span>Nilai rata-rata</span>
                                            {renderSortIndicator("average_nilai")}
                                        </button>
                                    </th>
                                    <th className="w-32 px-6 py-3">
                                        <button
                                            type="button"
                                            onClick={() => handleSort("average_rating")}
                                            className="flex items-center gap-2 text-left uppercase tracking-wide text-depth-secondary hover:text-depth-primary focus-visible:outline-none"
                                        >
                                            <span>Rating rata-rata</span>
                                            {renderSortIndicator("average_rating")}
                                        </button>
                                    </th>
                                    <th className="w-40 px-6 py-3">Terakhir dinilai</th>
                                    <th className="w-24 px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedItems.map((entry, index) => (
                                    <tr
                                        key={`row-${entry.praktikan_id}`}
                                        className="border-t border-depth/60 text-sm text-depth-primary hover:bg-depth-interactive/40"
                                    >
                                        <td className="px-6 py-3 font-semibold text-depth-secondary">#{index + 1}</td>
                                        <td className="px-6 py-3 font-medium">{entry.nama}</td>
                                        <td className="px-6 py-3 text-depth-secondary">{entry.nim}</td>
                                        <td className="px-6 py-3 text-depth-secondary">{entry.kelas ?? "-"}</td>
                                        <td className="px-6 py-3 font-semibold">{formatAverage(entry.average_nilai)}</td>
                                        <td className="px-6 py-3 font-semibold">{formatAverage(entry.average_rating)}</td>
                                        <td className="px-6 py-3 text-depth-secondary">{formatDate(entry.last_submitted_at)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDetail(entry)}
                                                className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-[var(--depth-color-primary)] text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)]"
                                                aria-label={`Lihat detail nilai ${entry.nama}`}
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {detailState.isOpen ? (
                <ModalOverlay onClose={handleCloseDetail} className="depth-modal-overlay z-50 bg-black/50 backdrop-blur-sm px-4 py-6">
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-5xl rounded-depth-lg border border-depth bg-depth-card p-6 text-depth-primary shadow-depth-lg"
                    >
                        <ModalCloseButton onClick={handleCloseDetail} ariaLabel="Tutup detail nilai" className="absolute right-4 top-4" />

                        <div className="space-y-5">
                            <header className="space-y-2">
                                <p className="text-sm font-semibold uppercase tracking-wide text-depth-secondary">
                                    Detail Nilai Praktikan
                                </p>
                                <h3 className="text-2xl font-semibold text-depth-primary">
                                    {detailPraktikan?.nama ?? "-"}
                                </h3>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-depth-secondary">
                                    <span>
                                        <span className="font-medium text-depth-primary">NIM:</span> {detailPraktikan?.nim ?? "-"}
                                    </span>
                                    <span>
                                        <span className="font-medium text-depth-primary">Kelas:</span> {detailPraktikan?.kelas ?? "-"}
                                    </span>
                                </div>
                            </header>

                            {isDetailLoading ? (
                                <div className="py-12 text-center text-depth-secondary">Memuat detail nilai…</div>
                            ) : isDetailError ? (
                                <div className="rounded-depth-md border border-red-300 bg-red-50 p-4 text-sm text-red-600 shadow-depth-sm">
                                    {detailError?.message ?? "Gagal memuat detail nilai praktikan."}
                                </div>
                            ) : detailModules.length === 0 ? (
                                <div className="py-12 text-center text-depth-secondary">
                                    Belum ada data nilai untuk praktikan ini.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-depth-md border border-depth bg-depth-card/70 p-4 shadow-depth-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                Modul dinilai
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-depth-primary">
                                                {detailSummary.nilai_count}
                                            </p>
                                        </div>
                                        <div className="rounded-depth-md border border-depth bg-depth-card/70 p-4 shadow-depth-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                Rating masuk
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-depth-primary">
                                                {detailSummary.rating_count}
                                            </p>
                                        </div>
                                        <div className="rounded-depth-md border border-depth bg-depth-card/70 p-4 shadow-depth-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                Terakhir diperbarui
                                            </p>
                                            <p className="mt-2 text-base font-semibold text-depth-primary">
                                                {formatDate(detailModules[0]?.updated_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="max-h-[60vh] overflow-x-auto rounded-depth-md border border-depth shadow-depth-sm">
                                        <table className="min-w-full table-auto text-sm">
                                            <thead className="sticky top-0 bg-depth-card">
                                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                                    <th className="w-16 px-4 py-3">No</th>
                                                    <th className="min-w-[160px] px-4 py-3">Modul</th>
                                                    <th className="w-32 px-4 py-3">Nilai rata-rata</th>
                                                    <th className="w-28 px-4 py-3">Rating</th>
                                                    {SCORE_KEYS.map((item) => (
                                                        <th key={item.key} className="w-20 px-3 py-3 text-center">
                                                            {item.label}
                                                        </th>
                                                    ))}
                                                    <th className="min-w-[160px] px-4 py-3">Asisten penilai</th>
                                                    <th className="w-44 px-4 py-3">Terakhir dinilai</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailModules.map((module, index) => (
                                                    <tr key={`${module.modul_id ?? "unknown"}-${index}`} className="border-t border-depth/60 text-depth-primary">
                                                        <td className="px-4 py-3 font-semibold text-depth-secondary">{index + 1}</td>
                                                        <td className="px-4 py-3 font-medium">{module.modul_name ?? "-"}</td>
                                                        <td className="px-4 py-3 font-semibold">{formatAverage(module.average)}</td>
                                                        <td className="px-4 py-3 font-semibold">{formatAverage(module.rating)}</td>
                                                        {SCORE_KEYS.map((item) => (
                                                            <td key={`${module.modul_id ?? "unknown"}-${item.key}`} className="px-3 py-3 text-center text-depth-secondary">
                                                                {formatAverage(module.scores?.[item.key])}
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3 text-depth-secondary">
                                                            {module.asisten?.nama
                                                                ? `${module.asisten.nama}${module.asisten.kode ? ` (${module.asisten.kode})` : ""}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-depth-secondary">{formatDate(module.updated_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            ) : null}
        </section>
    );
}
