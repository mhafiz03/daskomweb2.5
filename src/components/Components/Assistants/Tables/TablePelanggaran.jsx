import { useUnmarkedLaporanQuery } from "@/hooks/useUnmarkedLaporanQuery";

const formatAssistantName = (asisten) => {
    if (!asisten) {
        return "-";
    }

    return asisten.nama ?? "-";
};

export default function TablePelanggaran() {
    const {
        data = [],
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useUnmarkedLaporanQuery();

    if (isLoading) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-12 text-center text-depth-secondary shadow-depth-lg">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]" />
                Memuat rekap laporan belum dinilai...
            </div>
        );
    }

    if (isError) {
        const message = error?.response?.data?.message ?? error?.message ?? "Gagal memuat rekap laporan.";

        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-10 text-center text-red-400 shadow-depth-lg">
                <p>{message}</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-12 text-center text-depth-secondary shadow-depth-lg">
                Seluruh laporan praktikan telah dinilai 🎉
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
            <div className="flex items-center justify-between border-b border-[color:var(--depth-border)] px-6 py-4">
                <div>
                    <h3 className="text-base font-semibold text-depth-primary">Rekap Praktikan Belum Dinilai</h3>
                    <p className="text-xs text-depth-secondary">
                        Menampilkan daftar asisten dengan jumlah praktikan yang belum diberikan nilai.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isFetching ? "Memuat..." : "Muat Ulang"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[color:var(--depth-border)] text-sm">
                    <thead className="bg-depth-interactive/80 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                        <tr>
                            <th className="px-6 py-3 text-left">No</th>
                            <th className="px-6 py-3 text-left">Asisten</th>
                            <th className="px-6 py-3 text-left">Kode</th>
                            <th className="px-6 py-3 text-center">Praktikan Belum Dinilai</th>
                            <th className="px-6 py-3 text-center">Total Laporan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--depth-border)] bg-depth-card text-depth-primary">
                        {data.map((entry, index) => (
                            <tr key={entry?.asisten?.id ?? index} className="transition hover:bg-depth-interactive/40">
                                <td className="px-6 py-3 text-sm font-semibold text-depth-secondary">{index + 1}</td>
                                <td className="px-6 py-3 text-sm font-semibold text-depth-primary">
                                    {formatAssistantName(entry?.asisten)}
                                </td>
                                <td className="px-6 py-3 text-depth-secondary">{entry?.asisten?.kode ?? "-"}</td>
                                <td className="px-6 py-3 text-center text-sm font-semibold text-amber-400">
                                    {entry?.totals?.praktikan ?? 0}
                                </td>
                                <td className="px-6 py-3 text-center text-sm text-depth-secondary">
                                    {entry?.totals?.laporan ?? 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFetching && (
                <div className="px-6 pb-4 text-xs text-depth-secondary">
                    Memuat data terbaru...
                </div>
            )}
        </div>
    );
}
