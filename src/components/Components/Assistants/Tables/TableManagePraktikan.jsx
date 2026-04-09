import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import deleteIcon from "../../../../assets/nav/Icon-Delete.svg";

const formatKelas = (kelas) => {
    if (!kelas) {
        return "-";
    }

    const parts = [kelas?.nama ?? kelas?.kelas ?? "-"];

    if (kelas?.hari) {
        parts.push(kelas.hari);
    }

    if (kelas?.shift) {
        parts.push(`Shift ${kelas.shift}`);
    }

    return parts.filter(Boolean).join(" • ");
};

export default function TableManagePraktikan({
    items = [],
    meta = null,
    isLoading = false,
    isFetching = false,
    isError = false,
    error = null,
    onRetry,
    onEdit,
    onDelete,
    onPageChange,
}) {
    const currentPage = meta?.current_page ?? 1;
    const lastPage = meta?.last_page ?? 1;
    const perPage = meta?.per_page ?? items.length ?? 10;
    const total = meta?.total ?? items.length;
    const from = meta?.from ?? (items.length ? (currentPage - 1) * perPage + 1 : 0);
    const to = meta?.to ?? (items.length ? from + items.length - 1 : 0);

    if (isLoading) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-12 text-center text-depth-secondary shadow-depth-lg">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]" />
                Memuat data praktikan...
            </div>
        );
    }

    if (isError) {
        const message = error?.response?.data?.message ?? error?.message ?? "Gagal memuat data praktikan.";
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-8 text-center text-red-400 shadow-depth-lg">
                <p>{message}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Coba Lagi
                    </button>
                )}
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card p-12 text-center text-depth-secondary shadow-depth-lg">
                Belum ada data praktikan yang tersedia.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                <div className="max-h-[56vh] overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[1040px] table-auto divide-y divide-[color:var(--depth-border)] text-sm text-depth-primary">
                        <thead className="bg-depth-interactive/70 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left">NIM</th>
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-left">Kelas</th>
                                <th className="px-4 py-3 text-left">DK</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-left">No. Telepon</th>
                                <th className="px-4 py-3 text-left">Alamat</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--depth-border)] bg-depth-card">
                            {items.map((praktikan) => (
                                <tr key={praktikan.id} className="transition hover:bg-depth-interactive/40">
                                    <td className="px-4 py-3 font-medium text-depth-primary">{praktikan.nim}</td>
                                    <td className="px-4 py-3 text-depth-secondary font-semibold">{praktikan.dk ?? "-"}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-depth-primary">{praktikan.nama}</div>
                                    </td>
                                    <td className="px-4 py-3 text-depth-secondary">{formatKelas(praktikan.kelas)}</td>
                                    <td className="px-4 py-3">
                                        <a href={`mailto:${praktikan.email}`} className="text-[var(--depth-color-primary)] underline-offset-2 hover:underline">
                                            {praktikan.email}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-depth-secondary">{praktikan.nomor_telepon ?? "-"}</td>
                                    <td className="px-4 py-3">
                                        <span className="block max-h-12 overflow-hidden text-xs leading-relaxed text-depth-secondary">
                                            {praktikan.alamat ?? "-"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => onEdit?.(praktikan)}
                                                className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-depth-md"
                                            >
                                                <img src={editIcon} alt="" className="edit-icon-filter h-4 w-4"/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete?.(praktikan)}
                                                className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-red-500/60 bg-red-500/15 text-red-400 shadow-depth-sm transition duration-150 hover:-translate-y-0.5 hover:border-red-400 hover:shadow-depth-md"
                                            >
                                                <img src={deleteIcon} alt="" className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-depth-md border border-depth bg-depth-card p-4 text-sm text-depth-secondary shadow-depth-md md:flex-row md:items-center md:justify-between">
                <div>
                    Menampilkan <span className="font-semibold text-depth-primary">{from}</span> -
                    <span className="font-semibold text-depth-primary"> {to}</span> dari{" "}
                    <span className="font-semibold text-depth-primary">{total}</span> praktikan
                </div>
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange?.(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-1 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {/* Left arrow emoji */}
                        <span role="img" aria-label="Sebelumnya">←</span>
                    </button>
                    <span className="text-xs text-depth-secondary">
                        Halaman <span className="font-semibold text-depth-primary">{currentPage}</span> /{" "}
                        <span className="font-semibold text-depth-primary">{lastPage}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange?.(currentPage + 1)}
                        disabled={currentPage >= lastPage}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-1 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {/* Right arrow emoji */}
                        <span role="img" aria-label="Berikutnya">→</span>
                    </button>
                </div>
            </div>

            {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-depth-secondary">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[var(--depth-color-primary)] border-t-transparent" />
                    Memuat data terbaru...
                </div>
            )}
        </div>
    );
}
