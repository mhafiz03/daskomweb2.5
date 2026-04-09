export default function TablePolling({ data = [] }) {
    return (
        <div className="space-y-4">
            <div className="rounded-depth-lg border border-depth bg-depth-card p-3 shadow-depth-md">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold uppercase tracking-wide text-white">
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Rank</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Nama</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Kode</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Total</span>
                </div>
            </div>

            <div className="overflow-x-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                {data && data.length > 0 ? (
                    <div className="divide-y divide-[color:var(--depth-border)]">
                        {data.map((item, index) => (
                            <div
                                key={item.id ?? index}
                                className="grid grid-cols-4 items-center gap-2 px-4 py-3 text-sm text-depth-primary"
                            >
                                <span className="text-center font-semibold">{index + 1}</span>
                                <span className="text-center text-depth-secondary">{item.nama ?? "-"}</span>
                                <span className="text-center text-depth-secondary">{item.kode ?? "-"}</span>
                                <span className="text-center text-depth-secondary">{item.total ?? 0}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center text-depth-secondary">Tidak ada data polling</div>
                )}
            </div>
        </div>
    );
}
