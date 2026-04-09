import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const ATTENDANCE_QUERY_KEY = ["anomaly-attendance"];
const NILAI_QUERY_KEY = ["anomaly-nilai"];

const GRADE_FIELDS = [
    { key: "tp", label: "TP" },
    { key: "ta", label: "TA" },
    { key: "d1", label: "D1" },
    { key: "d2", label: "D2" },
    { key: "d3", label: "D3" },
    { key: "d4", label: "D4" },
    { key: "l1", label: "L1" },
    { key: "l2", label: "L2" },
    { key: "avg", label: "AVG" },
];

const AttendanceTable = ({ data, isLoading, error, filters, setFilters }) => {
    const filteredEntries = useMemo(() => {
        if (!Array.isArray(data)) {
            return [];
        }

        const kelasSearch = filters.kelas.trim().toLowerCase();
        const modulSearch = filters.modul.trim().toLowerCase();

        return data
            .filter((row) => {
                const kelasLabel = (row.kelas_name ?? row.kelas?.nama ?? "").toString().toLowerCase();
                return !kelasLabel.includes("tot");
            })
            .filter((row) => {
                const kelasMatch =
                    !kelasSearch ||
                    (row.kelas_name ?? "").toLowerCase().includes(kelasSearch) ||
                    (row.praktikan_name ?? "").toLowerCase().includes(kelasSearch) ||
                    (row.nim ?? "").toLowerCase().includes(kelasSearch);

                const modulMatch = !modulSearch || (row.modul_name ?? "").toLowerCase().includes(modulSearch);

                return kelasMatch && modulMatch;
            });
    }, [data, filters.kelas, filters.modul]);

    const groupedKelas = useMemo(() => {
        const kelasMap = new Map();

        filteredEntries.forEach((row) => {
            const kelasName = (row.kelas_name ?? row.kelas?.nama ?? "-") || "-";
            if (!kelasMap.has(kelasName)) {
                kelasMap.set(kelasName, {
                    key: kelasName,
                    kelasName,
                    praktikanMap: new Map(),
                });
            }

            const kelasGroup = kelasMap.get(kelasName);
            const praktikanKey = String(
                row.praktikan_id ?? row.praktikan?.id ?? row.nim ?? `${row.praktikan_name}-${row.praktikum_id}`,
            );

            if (!kelasGroup.praktikanMap.has(praktikanKey)) {
                kelasGroup.praktikanMap.set(praktikanKey, {
                    key: `${kelasName}-${praktikanKey}`,
                    praktikan: {
                        id: row.praktikan_id,
                        nama: row.praktikan_name,
                        nim: row.nim,
                    },
                    entries: [],
                });
            }

            kelasGroup.praktikanMap.get(praktikanKey).entries.push(row);
        });

        return Array.from(kelasMap.values()).map((kelasGroup) => {
            const praktikanGroups = Array.from(kelasGroup.praktikanMap.values());
            const modulSet = new Set();
            let latestEnded = 0;

            praktikanGroups.forEach((praktikanGroup) => {
                praktikanGroup.entries.forEach((entry) => {
                    modulSet.add(entry.modul_name ?? entry.modul_id ?? entry.praktikum_id);
                    if (entry.ended_at) {
                        const ts = new Date(entry.ended_at).getTime();
                        if (ts > latestEnded) {
                            latestEnded = ts;
                        }
                    }
                });
            });

            return {
                key: kelasGroup.key,
                kelasName: kelasGroup.kelasName,
                praktikanGroups,
                praktikanCount: praktikanGroups.length,
                modulCount: modulSet.size,
                latestEnded,
            };
        });
    }, [filteredEntries]);

    const [expandedKelas, setExpandedKelas] = useState(() => new Set());
    const [expandedPraktikan, setExpandedPraktikan] = useState(() => new Set());

    useEffect(() => {
        setExpandedKelas(new Set());
        setExpandedPraktikan(new Set());
    }, [groupedKelas]);

    const toggleKelas = (key) => {
        setExpandedKelas((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const togglePraktikan = (key) => {
        setExpandedPraktikan((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">Cari Praktikan</label>
                    <input
                        type="search"
                        value={filters.kelas}
                        onChange={(event) => setFilters((prev) => ({ ...prev, kelas: event.target.value }))}
                        placeholder="Cari praktikan atau NIM..."
                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">Cari modul</label>
                    <input
                        type="search"
                        value={filters.modul}
                        onChange={(event) => setFilters((prev) => ({ ...prev, modul: event.target.value }))}
                        placeholder="Cari modul..."
                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    />
                </div>
            </div>

            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-sm">
                {isLoading ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">Memuat data anomali kehadiran…</div>
                ) : error ? (
                    <div className="px-6 py-10 text-center text-red-500">
                        {error?.response?.data?.message ?? error?.message ?? "Gagal memuat data anomali."}
                    </div>
                ) : groupedKelas.length === 0 ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">
                        Tidak ada praktikan yang terdeteksi absen pada praktikum selesai.
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto">
                        <ul className="divide-y divide-[color:var(--depth-border)]">
                            {groupedKelas.map((kelasGroup) => {
                                const kelasExpanded = expandedKelas.has(kelasGroup.key);
                                return (
                                    <li key={`kelas-${kelasGroup.key}`} className="transition hover:bg-depth-interactive/40">
                                        <button
                                            type="button"
                                            onClick={() => toggleKelas(kelasGroup.key)}
                                            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-depth-primary">{kelasGroup.kelasName}</p>
                                                <p className="text-xs text-depth-secondary">
                                                    {kelasGroup.praktikanCount} praktikan • {kelasGroup.modulCount} modul
                                                </p>
                                            </div>
                                            <span className="text-depth-secondary">{kelasExpanded ? "▲" : "▼"}</span>
                                        </button>

                                        {kelasExpanded ? (
                                            <div className="border-t border-[color:var(--depth-border)] bg-depth-card/80 px-6 pb-6">
                                                {kelasGroup.praktikanGroups.map((praktikanGroup) => {
                                                    const moduleSummaries = praktikanGroup.entries.map((entry) => ({
                                                        key: `${entry.praktikum_id ?? entry.modul_id ?? entry.modul_name}`,
                                                        label: entry.modul_name ?? "-",
                                                    }));
                                                    const praktikanExpanded = expandedPraktikan.has(praktikanGroup.key);
                                                    const maxVisibleModules = 2;
                                                    const visibleModules = praktikanExpanded
                                                        ? moduleSummaries
                                                        : moduleSummaries.slice(0, maxVisibleModules);
                                                    const hiddenCount = Math.max(moduleSummaries.length - visibleModules.length, 0);
                                                    const latestEnded = praktikanGroup.entries.reduce((latest, entry) => {
                                                        const value = entry.ended_at ? new Date(entry.ended_at).getTime() : 0;
                                                        return value > latest ? value : latest;
                                                    }, 0);
                                                    const latestEndedDisplay = latestEnded
                                                        ? new Date(latestEnded).toLocaleString("id-ID")
                                                        : "-";

                                                    return (
                                                        <div
                                                            key={praktikanGroup.key}
                                                            className="rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm mt-3"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePraktikan(praktikanGroup.key)}
                                                                className="flex w-full items-center justify-between gap-4 text-left"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-semibold text-depth-primary">
                                                                        {praktikanGroup.praktikan?.nama ?? "-"}
                                                                    </p>
                                                                    <p className="text-xs text-depth-secondary">
                                                                        {praktikanGroup.praktikan?.nim ?? "-"} • {praktikanGroup.entries.length} modul
                                                                    </p>
                                                                </div>
                                                                <div className="text-right text-xs text-depth-secondary">
                                                                    <div>Terakhir: {latestEndedDisplay}</div>
                                                                    <div className=" mt-3 border-depth bg-depth-interactive/60 rounded rounded-depth-md ml-auto inline-flex items-center gap-1 rounded-depth-md border border-depth bg-depth-interactive px-3 py-1 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"> 
                                                                        {praktikanExpanded ? "Hide" : "Details"}
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                {visibleModules.map((module) => (
                                                                    <span
                                                                        key={`${praktikanGroup.key}-${module.key}`}
                                                                        className="rounded-depth-full border border-depth bg-depth-interactive/60 px-3 py-1 text-xs font-semibold text-depth-primary"
                                                                    >
                                                                        {module.label}
                                                                    </span>
                                                                ))}
                                                                {!praktikanExpanded && hiddenCount > 0 ? (
                                                                    <span className="text-xs text-depth-secondary">
                                                                        +{hiddenCount} modul lainnya
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            {praktikanExpanded ? (
                                                                <div className="mt-4">
                                                                    {praktikanGroup.entries.map((entry) => (
                                                                        <div
                                                                            key={`${praktikanGroup.key}-detail-${entry.praktikum_id ?? entry.modul_id}`}
                                                                            className="p-4"
                                                                        >
                                                                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                                                <div>
                                                                                    <div className="text-depth-primary text-md truncate">
                                                                                        {entry.modul_name ?? "-"}
                                                                                    </div>
                                                                                    <div className="text-xs text-depth-secondary">
                                                                                        Praktikum ID: {entry.praktikum_id ?? "-"}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-xs text-depth-secondary">
                                                                                    Selesai:{" "}
                                                                                    {entry.ended_at
                                                                                        ? new Date(entry.ended_at).toLocaleString("id-ID")
                                                                                        : "-"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const NilaiTable = ({ data, isLoading, error, filters, setFilters }) => {
    const rows = Array.isArray(data) ? data : [];
    const groupedRows = useMemo(() => {
        const map = new Map();

        rows.forEach((row) => {
            const praktikan = row.praktikan ?? {};
            const key = praktikan.id ?? praktikan.nim ?? `${praktikan.nama ?? "praktikan"}-${row.id}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    praktikan,
                    kelas: row.kelas,
                    modules: [],
                });
            }

            map.get(key).modules.push(row);
        });

        return Array.from(map.values());
    }, [rows]);

    const [expandedRows, setExpandedRows] = useState(() => new Set());

    const toggleRow = (key) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-depth-primary">
                    <input
                        type="checkbox"
                        checked={filters.nonMultiple}
                        onChange={(event) => setFilters((prev) => ({ ...prev, nonMultiple: event.target.checked }))}
                        className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                    />
                    Nilai bukan kelipatan 5
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-depth-primary">
                    <input
                        type="checkbox"
                        checked={filters.overLimit}
                        onChange={(event) => setFilters((prev) => ({ ...prev, overLimit: event.target.checked }))}
                        className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                    />
                    Nilai &gt; 100
                </label>
            </div>

            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-sm">
                {isLoading ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">Memuat data nilai…</div>
                ) : error ? (
                    <div className="px-6 py-10 text-center text-red-500">
                        {error?.response?.data?.message ?? error?.message ?? "Gagal memuat data nilai."}
                    </div>
                ) : groupedRows.length === 0 ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">Tidak ada data nilai yang sesuai filter.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[color:var(--depth-border)] text-sm">
                            <thead className="bg-depth-card">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                    <th className="px-4 py-3">Praktikan</th>
                                    <th className="px-4 py-3">Kelas</th>
                                    <th className="px-4 py-3">Modul</th>
                                    <th className="px-4 py-3">Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--depth-border)]">
                                {groupedRows.map((group) => {
                                    const moduleNames = group.modules.map((moduleRow) => moduleRow.modul?.judul ?? "Tanpa modul");
                                    const isExpanded = expandedRows.has(group.key);
                                    const maxSummaryModules = 2;
                                    const visibleModules = isExpanded ? moduleNames : moduleNames.slice(0, maxSummaryModules);
                                    const hiddenCount = Math.max(moduleNames.length - visibleModules.length, 0);
                                    const aggregatedFlags = group.modules.reduce(
                                        (acc, moduleRow) => {
                                            acc.nonMultiple += moduleRow.flags?.non_multiple?.length ?? 0;
                                            acc.overLimit += moduleRow.flags?.over_limit?.length ?? 0;
                                            return acc;
                                        },
                                        { nonMultiple: 0, overLimit: 0 },
                                    );

                                    return (
                                        <Fragment key={group.key}>
                                            <tr className="hover:bg-depth-interactive/40">
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-depth-primary">{group.praktikan?.nama ?? "-"}</div>
                                                    <div className="text-xs text-depth-secondary">{group.praktikan?.nim ?? "-"}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-depth-primary">{group.kelas?.nama ?? "-"}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {visibleModules.map((name, idx) => (
                                                            <span
                                                                key={`${group.key}-module-${idx}`}
                                                                className="rounded-depth-full border border-depth bg-depth-interactive/60 px-3 py-1 text-xs font-semibold text-depth-primary"
                                                            >
                                                                {name}
                                                            </span>
                                                        ))}
                                                        {!isExpanded && hiddenCount > 0 ? (
                                                            <span className="text-xs text-depth-secondary">+{hiddenCount} modul lainnya</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                                        <span
                                                            className={`rounded-depth-full border px-3 py-1 ${aggregatedFlags.nonMultiple > 0
                                                                ? "border-yellow-400/60 bg-yellow-400/20 text-yellow-700"
                                                                : "border-depth bg-depth-card text-depth-secondary"
                                                                }`}
                                                        >
                                                            ≠5: {aggregatedFlags.nonMultiple}
                                                        </span>
                                                        <span
                                                            className={`rounded-depth-full border px-3 py-1 ${aggregatedFlags.overLimit > 0
                                                                ? "border-red-400/60 bg-red-500/20 text-red-600"
                                                                : "border-depth bg-depth-card text-depth-secondary"
                                                                }`}
                                                        >
                                                            &gt;100: {aggregatedFlags.overLimit}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRow(group.key)}
                                                            className="ml-auto inline-flex items-center gap-1 rounded-depth-md border border-depth bg-depth-interactive px-3 py-1 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                        >
                                                            {isExpanded ? "Hide" : "Details"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded ? (
                                                <tr className="bg-depth-card/40">
                                                    <td colSpan={4} className="px-4 pb-6 pt-0">
                                                        <div className="space-y-4">
                                                            {group.modules.map((moduleRow, idx) => {
                                                                const asisten = moduleRow.asisten ?? {};
                                                                const contactItems = [
                                                                    { label: "Line", value: asisten.id_line },
                                                                    { label: "WhatsApp", value: asisten.nomor_telepon },
                                                                    { label: "Instagram", value: asisten.instagram },
                                                                ];

                                                                return (
                                                                    <div
                                                                        key={`${group.key}-detail-${moduleRow.id ?? idx}`}
                                                                        className="p-4 mt-4"
                                                                    >
                                                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                                            <div>
                                                                                <div className="font-semibold text-depth-primary">
                                                                                    {moduleRow.modul?.judul ?? "-"}
                                                                                </div>
                                                                                <div className="text-xs text-depth-secondary">
                                                                                    {moduleRow.kelas?.nama ?? group.kelas?.nama ?? "-"}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs text-depth-secondary">
                                                                                <div>
                                                                                    Diperbarui{" "}
                                                                                    {moduleRow.updated_at
                                                                                        ? new Date(moduleRow.updated_at).toLocaleString("id-ID")
                                                                                        : "-"}
                                                                                </div>
                                                                                <div className="text-depth-primary">
                                                                                    {asisten.nama
                                                                                        ? `Disubmit oleh ${asisten.nama}${asisten.kode ? ` (${asisten.kode})` : ""}`
                                                                                        : "Asisten tidak diketahui"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 rounded-depth-md border border-depth bg-depth-card/70 p-3 text-xs">
                                                                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-depth-secondary">
                                                                                Kontak Asisten
                                                                            </div>
                                                                            <div className="text-sm font-semibold text-depth-primary">
                                                                                {asisten.nama ?? "Tidak diketahui"}
                                                                            </div>
                                                                            <div className="text-xs text-depth-secondary">
                                                                                {asisten.kode ? `Kode ${asisten.kode}` : "Kode tidak tersedia"}
                                                                            </div>
                                                                            <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                                                                {contactItems.map((item) => (
                                                                                    <div key={`${moduleRow.id ?? idx}-${item.label}`}>
                                                                                        <div className="text-[0.65rem] uppercase tracking-wide text-depth-secondary">
                                                                                            {item.label}
                                                                                        </div>
                                                                                        <div className="text-sm font-semibold text-depth-primary">
                                                                                            {item.value || "Tidak tersedia"}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 text-xs">
                                                                            {GRADE_FIELDS.map((field) => {
                                                                                const value = moduleRow.scores?.[field.key] ?? null;
                                                                                const isNonMultiple = moduleRow.flags?.non_multiple?.includes(field.key);
                                                                                const isOverLimit = moduleRow.flags?.over_limit?.includes(field.key);
                                                                            const isAnomaly = isNonMultiple || isOverLimit;

                                                                            return (
                                                                                <div
                                                                                    key={`${moduleRow.id ?? idx}-${field.key}`}
                                                                                    className={`rounded-depth-md border px-2 py-1 text-center font-semibold ${isAnomaly
                                                                                        ? "border-red-400/60 bg-red-500/10 text-red-500"
                                                                                        : "border-depth bg-depth-card text-depth-primary"
                                                                                        }`}
                                                                                >
                                                                                    <div>{field.label}</div>
                                                                                    <div className="text-sm">{value ?? "-"}</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                            })}
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
                )}
            </div>
        </div>
    );
};

export default function ModalAnomalyPraktikum({ onClose }) {
    const [activeTab, setActiveTab] = useState("attendance");
    const [attendanceFilters, setAttendanceFilters] = useState({
        kelas: "",
        modul: "",
    });
    const [nilaiFilters, setNilaiFilters] = useState({
        nonMultiple: true,
        overLimit: true,
    });

    const attendanceQuery = useQuery({
        queryKey: [ATTENDANCE_QUERY_KEY],
        queryFn: async () => {
            const params = { limit: 500 };

            const { data } = await api.get("/api-v1/anomalies/attendance", { params });
            return Array.isArray(data?.data) ? data.data : [];
        },
    });

    const nilaiQuery = useQuery({
        queryKey: [NILAI_QUERY_KEY, nilaiFilters],
        queryFn: async () => {
            const params = {
                non_multiple: nilaiFilters.nonMultiple ? 1 : 0,
                over_limit: nilaiFilters.overLimit ? 1 : 0,
            };
            const { data } = await api.get("/api-v1/anomalies/grades", { params });
            return Array.isArray(data?.data) ? data.data : [];
        },
    });

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div className="depth-modal-container w-full max-w-7xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="depth-modal-header">
                        <h2 className="depth-modal-title">Data Anomali Praktikan</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup anomali praktikan" />
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { key: "attendance", label: "Ketidakhadiran Praktikan" },
                        { key: "grades", label: "Anomali Nilai" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-depth-full border px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key
                                ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                : "border-depth bg-depth-card text-depth-primary shadow-depth-sm hover:-translate-y-0.5 hover:shadow-depth-md"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "attendance" ? (
                    <AttendanceTable
                        data={attendanceQuery.data}
                        isLoading={attendanceQuery.isLoading}
                        error={attendanceQuery.error}
                        filters={attendanceFilters}
                        setFilters={setAttendanceFilters}
                    />
                ) : (
                    <NilaiTable
                        data={nilaiQuery.data}
                        isLoading={nilaiQuery.isLoading}
                        error={nilaiQuery.error}
                        filters={nilaiFilters}
                        setFilters={setNilaiFilters}
                    />
                )}
            </div>
        </ModalOverlay>
    );
}
