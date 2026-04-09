import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import { api } from "@/lib/api";
import AuditLogsTable from "../Tables/AuditLogsTable";

const inputBaseClass =
    "rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm shadow-depth-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)]";

export default function ContentAuditLogs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") ?? "";
    const [search, setSearch] = useState(initialSearch);
    const { data: rawLogs = [], isLoading, isError, error } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            const { data } = await api.get("/api/admin/audit-logs");
            return Array.isArray(data) ? data : [];
        },
    });

    const logs = useMemo(() => {
        const keyword = initialSearch.trim().toLowerCase();
        if (!keyword) {
            return rawLogs;
        }

        return rawLogs.filter((log) =>
            [
                log?.action,
                log?.description,
                log?.method,
                log?.route,
                log?.asisten?.kode,
                log?.asisten?.nama,
            ]
                .filter(Boolean)
                .some((value) => value.toString().toLowerCase().includes(keyword)),
        );
    }, [initialSearch, rawLogs]);

    const handleSubmit = (event) => {
        event.preventDefault();
        setSearchParams(search ? { search } : {});
    };

    const handleReset = () => {
        setSearch("");
        setSearchParams({});
    };

    const toolbarConfig = useMemo(
        () => ({
            title: "Audit Logs",
        }),
        [],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section className="space-y-6 text-depth-primary">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari aksi, deskripsi, atau nama asisten"
                        className={`${inputBaseClass} w-64 max-w-full`}
                        aria-label="Cari audit log"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Reset
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Cari
                    </button>
                </form>

            <p className="text-sm text-depth-secondary">
                Pantau aktivitas penting yang dilakukan oleh tim asisten.
            </p>

            <AuditLogsTable logs={logs} isLoading={isLoading} isError={isError} error={error} />
        </section>
    );
}
