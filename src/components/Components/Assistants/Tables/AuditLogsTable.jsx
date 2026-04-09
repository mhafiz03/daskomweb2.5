import { Fragment, useMemo, useState } from "react";

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const normalizeLabel = (label) =>
    label
        ?.replace(/&laquo;/g, "«")
        .replace(/&raquo;/g, "»")
        .replace(/&amp;/g, "&") ?? "";

export default function AuditLogsTable({ logs, isLoading = false, isError = false, error = null }) {
    const [expandedLogId, setExpandedLogId] = useState(null);
    const entries = Array.isArray(logs?.data) ? logs.data : Array.isArray(logs) ? logs : [];

    const pagination = useMemo(() => ({
        from: logs?.from ?? 0,
        to: logs?.to ?? 0,
        total: logs?.total ?? entries.length,
        links: logs?.links ?? [],
    }), [logs, entries.length]);

    const toggleExpanded = (id) => {
        setExpandedLogId((current) => (current === id ? null : id));
    };

    if (isLoading) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-10 text-center shadow-depth-lg">
                <p className="text-sm font-medium text-depth-secondary">Memuat audit logs...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-10 text-center shadow-depth-lg">
                <p className="text-sm font-medium text-red-400">
                    {error?.message ?? "Gagal memuat audit logs."}
                </p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-10 text-center shadow-depth-lg">
                <p className="text-sm font-medium text-depth-secondary">
                    Belum ada aktivitas yang tercatat.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-depth/40 text-sm">
                        <thead className="bg-depth-interactive/70 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left">Waktu</th>
                                <th scope="col" className="px-4 py-3 text-left">Asisten</th>
                                <th scope="col" className="px-4 py-3 text-left">Aksi</th>
                                <th scope="col" className="px-4 py-3 text-left">Deskripsi</th>
                                <th scope="col" className="px-4 py-3 text-left">Metode</th>
                                <th scope="col" className="px-4 py-3 text-left">Route</th>
                                <th scope="col" className="px-4 py-3 text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-depth/30">
                            {entries.map((log, index) => {
                                const createdAt = formatDateTime(log?.created_at);
                                const assistantIdentifier = log?.asisten?.kode ?? log?.asisten?.nama ?? "Sistem";
                                const metadata = log?.metadata ?? {};
                                const isExpanded = expandedLogId === log?.id;
                                const rowKey = log?.id ?? ['log', log?.action, log?.created_at, index].filter(Boolean).join('-');

                                return (
                                    <Fragment key={rowKey}>
                                        <tr className="transition hover:bg-depth-interactive/50">
                                            <td className="px-4 py-3 align-top text-xs font-medium text-depth-secondary">
                                                {createdAt}
                                            </td>
                                            <td className="px-4 py-3 align-top text-sm font-semibold text-depth-primary" title={log?.asisten?.nama ?? undefined}>
                                                {assistantIdentifier}
                                            </td>
                                            <td className="px-4 py-3 align-top text-sm font-semibold text-depth-primary">
                                                {log?.action}
                                            </td>
                                            <td className="px-4 py-3 align-top text-sm text-depth-secondary">
                                                <span className="line-clamp-2">
                                                    {log?.description ?? "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs font-semibold uppercase tracking-wide text-depth-primary">
                                                {log?.method ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-depth-secondary">
                                                {log?.route ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 align-top text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(log?.id)}
                                                    className="rounded-depth-md border border-depth px-3 py-1 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                >
                                                    {isExpanded ? "Tutup" : "Detail"}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded ? (
                                            <tr className="bg-depth-interactive/40 text-xs">
                                                <td colSpan={7} className="px-4 py-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-3 text-depth-secondary">
                                                            <span className="rounded-depth-md bg-depth-card px-3 py-1 font-semibold">
                                                                IP: {log?.ip_address ?? "-"}
                                                            </span>
                                                            {log?.user_agent ? (
                                                                <span className="truncate" title={log.user_agent}>
                                                                    {log.user_agent}
                                                                </span>
                                                            ) : null}
                                                            <span className="ml-auto font-medium text-depth-secondary">
                                                                ID Log: {log?.id}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-depth-primary">
                                                                Metadata
                                                            </p>
                                                            <pre className="max-h-56 overflow-auto rounded-depth-md bg-depth-card/80 p-3 text-[11px] leading-relaxed text-depth-primary">
                                                                {JSON.stringify(metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : null}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-depth-lg border border-depth bg-depth-card px-4 py-3 text-sm text-depth-secondary shadow-depth-md">
                <span>
                    Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} log
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    {pagination.links.map((link, index) => {
                        const label = normalizeLabel(link.label);
                        const isActive = Boolean(link.active);
                        const isDisabled = !link.url;

                        if (isDisabled) {
                            return (
                                <span
                                    key={`${label}-${index}`}
                                    className="rounded-depth-md px-3 py-1.5 text-xs font-semibold text-depth-secondary"
                                >
                                    {label}
                                </span>
                            );
                        }

                        return (
                            <a
                                key={`${label}-${index}`}
                                href={link.url}
                                className={`rounded-depth-md px-3 py-1.5 text-xs font-semibold transition ${
                                    isActive
                                        ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                        : "border border-depth bg-depth-card text-depth-primary shadow-depth-sm hover:-translate-y-0.5 hover:shadow-depth-md"
                                }`}
                            >
                                {label}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
