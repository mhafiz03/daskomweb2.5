import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import {
    useAssignedPraktikanQuery,
    ASSIGNED_PRAKTIKAN_QUERY_KEY,
} from "@/hooks/useAssignedPraktikanQuery";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import ShortcutWindow from "@/Components/Assistants/Modals/ShortcutWindow";
import { useNilaiComplaintsQuery } from "@/hooks/useNilaiComplaintsQuery";

const ModalInputNilai = lazy(() => import("../Modals/ModalInputNilai"));
const ModalNilaiComplaintAsisten = lazy(() => import("../Modals/ModalNilaiComplaintAsisten"));

const SCORE_FIELDS = [
    { key: "tp", label: "TP" },
    { key: "ta", label: "TA" },
    { key: "d1", label: "D1" },
    { key: "d2", label: "D2" },
    { key: "d3", label: "D3" },
    { key: "d4", label: "D4" },
    { key: "i1", label: "I1" },
    { key: "i2", label: "I2" },
];

const toDisplayDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("id-ID");
};

const toDisplayTime = (value) => {
    if (!value) {
        return "-";
    }

    if (/^\d{2}:\d{2}/.test(value)) {
        return value.slice(0, 5);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const normalizeRating = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return null;
    }

    return Number(numeric.toFixed(1));
};

const getScoreValue = (nilai, key) => {
    if (!nilai) {
        return "-";
    }

    let raw = nilai[key];

    if (raw === undefined) {
        if (key === "i1") {
            raw = nilai.l1;
        } else if (key === "i2") {
            raw = nilai.l2;
        }
    }

    if (raw === null || raw === undefined) {
        return "-";
    }

    const numeric = Number(raw);

    if (Number.isNaN(numeric)) {
        return raw;
    }

    return Number.isInteger(numeric) ? numeric : numeric.toFixed(1);
};

export default function ContentNilai({ asisten }) {
    const [search, setSearch] = useState("");
    const [modalAssignment, setModalAssignment] = useState(null);
    const [complaintModal, setComplaintModal] = useState(null);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data: complaints = [] } = useNilaiComplaintsQuery();

    const {
        data: assignments = [],
        isLoading,
        isError,
        error,
    } = useAssignedPraktikanQuery({
        onError: (err) => {
            toast.error(err?.message ?? "Whoops terjadi kesalahan 😢");
        },
    });

    const filteredAssignments = useMemo(() => {
        if (!search.trim()) {
            return assignments;
        }

        const keyword = search.toLowerCase();

        return assignments.filter((item) => {
            const bucket = [
                item?.praktikan?.nim,
                item?.praktikan?.nama,
                item?.modul?.judul,
                item?.praktikan?.kelas?.nama,
                item?.datetime?.date,
                item?.datetime?.time,
            ]
                .filter(Boolean)
                .map((value) => value.toString().toLowerCase());

            return bucket.some((value) => value.includes(keyword));
        });
    }, [assignments, search]);

    const selectedSummaryAssignments = useMemo(() => {
        if (selectedAssignmentIds.length === 0) {
            return [];
        }

        const lookup = new Set(selectedAssignmentIds);

        return assignments.filter((assignment) => lookup.has(assignment.id));
    }, [assignments, selectedAssignmentIds]);

    const handleOpenModalInput = (assignment) => {
        setModalAssignment(assignment);
    };

    const handleCloseModalInput = () => {
        setModalAssignment(null);
    };

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['nilai-complaints-asisten'] });
        handleCloseModalInput();
    };

    const getPendingComplaintsForNilai = (nilaiId) => {
        return complaints.filter((c) => c.nilai_id === nilaiId && c.status === 'pending').length;
    };

    const getFirstComplaintForNilai = (nilaiId) => {
        return complaints.find((c) => c.nilai_id === nilaiId);
    };

    const handleToggleAssignmentSelection = useCallback((assignmentId) => {
        setSelectedAssignmentIds((previous) => {
            if (previous.includes(assignmentId)) {
                return previous.filter((id) => id !== assignmentId);
            }

            return [...previous, assignmentId];
        });
    }, []);

    const handleClearSelection = useCallback((assignmentId) => {
        setSelectedAssignmentIds((previous) => previous.filter((id) => id !== assignmentId));
    }, []);

    const handleClearAllSelections = useCallback(() => {
        setSelectedAssignmentIds([]);
    }, []);

    const handleWorkspaceToggle = useCallback(() => {
        setIsWorkspaceOpen((previous) => !previous);
    }, []);

    const handleWorkspaceClose = useCallback(() => {
        setIsWorkspaceOpen(false);
    }, []);

    const handleSearchChange = useCallback((event) => setSearch(event.target.value), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Input Nilai",
            right: (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={handleWorkspaceToggle}
                        aria-pressed={isWorkspaceOpen}
                        className="flex items-center justify-center gap-2 rounded-depth-full border border-depth bg-depth-card px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)]"
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="4" y="6" width="16" height="12" rx="2" />
                            <path d="M4 9h16" />
                        </svg>
                        Shortcut
                    </button>
                    <div className="relative min-w-[18rem] max-w-full sm:min-w-[16rem]">
                        <input
                            type="search"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Cari nama, NIM, modul..."
                            className="w-full rounded-depth-full border border-depth bg-depth-interactive py-2.5 pl-4 pr-11 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 placeholder:text-depth-secondary"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-depth-secondary">
                            🔍
                        </span>
                    </div>
                </div>
            ),
        }),
        [handleSearchChange, handleWorkspaceToggle, isWorkspaceOpen, search],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <div className="space-y-6 text-depth-primary">
            <div className="rounded-depth-lg border border-depth bg-depth-card p-3 shadow-depth-md">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide text-white md:grid-cols-4">
                    <div className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">
                        Jadwal
                    </div>
                    <div className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">
                        Praktikan
                    </div>
                    <div className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">
                        Feedback
                    </div>
                    <div className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">
                        Review
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg lg:max-h-[48rem]">
                {isLoading && (
                    <div className="flex items-center justify-center gap-3 py-10 text-depth-secondary">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--depth-color-primary)] border-t-transparent" />
                        Memuat data praktikan...
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-red-400">
                        <p>{error?.message ?? "Gagal memuat data praktikan."}</p>
                        <button
                            type="button"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY })}
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {!isLoading && !isError && filteredAssignments.length === 0 && (
                    <div className="py-12 text-center text-depth-secondary">
                        Belum ada praktikan yang siap dinilai.
                    </div>
                )}

                {!isLoading && !isError && filteredAssignments.length > 0 && (
                    <div className="divide-y divide-[color:var(--depth-border)] border-t border-[color:var(--depth-border)]">
                        {filteredAssignments.map((assignment) => {
                            const tanggal = toDisplayDate(
                                assignment?.datetime?.date ?? assignment?.timestamps?.updated_at,
                            );
                            const waktu = toDisplayTime(
                                assignment?.datetime?.time ?? assignment?.timestamps?.updated_at,
                            );
                            const feedbackText =
                                (assignment?.pesan && assignment.pesan.trim()) || "Belum ada feedback";
                            const nilai = assignment?.nilai ?? null;
                            const formattedPraktikumRating = normalizeRating(assignment?.rating_praktikum);
                            const formattedAsistenRating = normalizeRating(assignment?.rating_asisten);
                            const isMarked = Boolean(assignment?.nilai);
                            const statusTone = isMarked
                                ? "border border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                                : "border border-amber-400/50 bg-amber-400/15 text-amber-300";
                            const statusAria = isMarked ? "marked" : "unmarked";
                            const praktikanName = assignment?.praktikan?.nama ?? "Tidak diketahui";
                            const praktikanClass = assignment?.praktikan?.kelas?.nama ?? "-";
                            const praktikanNim = assignment?.praktikan?.nim ?? "-";

                            return (
                                <article
                                    key={assignment.id}
                                    className="bg-depth-card px-4 py-3 text-sm text-depth-primary transition hover:bg-depth-interactive even:bg-depth-background hover:even:bg-depth-interactive"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-start md:gap-6">
                                                <div className="flex items-start gap-3">
                                                    <div className="pt-1">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-depth bg-depth-card text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                                            checked={selectedAssignmentIds.includes(assignment.id)}
                                                            onChange={() => handleToggleAssignmentSelection(assignment.id)}
                                                            aria-label={`Pilih ${assignment?.praktikan?.nama ?? "praktikan"}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-depth-primary">{tanggal}</p>
                                                        <p className="text-xs text-depth-secondary">{waktu}</p>
                                                    </div>
                                                </div>
                                                <div className="min-w-[12rem]">
                                                    <p className="text-base font-semibold text-depth-primary">{praktikanNim}</p>
                                                    <p className="text-xs text-depth-secondary">
                                                        {praktikanName} / {praktikanClass}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ratings and Feedback column */}
                                            <div className="flex flex-1 flex-col gap-2">
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-depth-secondary">
                                                    {formattedPraktikumRating === null && formattedAsistenRating === null ? (
                                                        <span className="italic text-depth-secondary/80">Belum ada rating</span>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-depth-primary">
                                                                Praktikum:
                                                                <span className="ml-1 font-normal">{formattedPraktikumRating ?? "-"}</span>
                                                            </span>
                                                            <span className="font-semibold text-depth-primary">
                                                                Asisten:
                                                                <span className="ml-1 font-normal">{formattedAsistenRating ?? "-"}</span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <p
                                                    className="overflow-hidden whitespace-pre-line break-words text-xs text-depth-secondary"
                                                    title={feedbackText}
                                                    aria-label={feedbackText}
                                                >
                                                    {feedbackText}
                                                </p>
                                            </div>

                                            {/* Action buttons column */}
                                            <div className="flex items-start gap-2">
                                                <span
                                                    aria-label={statusAria}
                                                    className={`inline-flex items-center gap-1 rounded-depth-full px-2 py-1 text-[11px] font-semibold ${statusTone}`}
                                                >
                                                    {isMarked ? (
                                                        <svg
                                                            aria-hidden="true"
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            aria-hidden="true"
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" />
                                                        </svg>
                                                    )}
                                                </span>
                                                {getFirstComplaintForNilai(assignment?.nilai?.id) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setComplaintModal(getFirstComplaintForNilai(assignment?.nilai?.id))}
                                                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                        aria-label="Lihat komplain nilai"
                                                    >
                                                        <svg
                                                            className="h-4 w-4 text-depth-primary"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-3h-8V9h8v2zm0-3H6V6h12v2z" />
                                                        </svg>
                                                        {getPendingComplaintsForNilai(assignment?.nilai?.id) > 0 && (
                                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold -translate-y-2 translate-x-2">
                                                                {getPendingComplaintsForNilai(assignment?.nilai?.id)}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenModalInput(assignment)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                    aria-label="Tinjau nilai praktikan"
                                                >
                                                    <img src={editIcon} alt="Edit" className="edit-icon-filter h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="rounded-depth-lg p-3">
                                            <div className="grid grid-cols-2 gap-1 text-[11px] text-depth-secondary sm:grid-cols-4 md:grid-cols-8">
                                                {SCORE_FIELDS.map((field) => (
                                                    <div
                                                        key={`${assignment.id}-${field.key}`}
                                                        className="flex flex-col items-center justify-around rounded-depth-sm border border-depth bg-depth-interactive/60 px-2 py-0.5 text-center"
                                                    >
                                                        <span className="text-[8px] font-semibold uppercase tracking-wide text-depth-secondary">
                                                            {field.label}
                                                        </span>
                                                        <span className="text-sm font-semibold text-depth-primary">
                                                            {getScoreValue(nilai, field.key)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <ShortcutWindow
                open={isWorkspaceOpen}
                onClose={handleWorkspaceClose}
                selectedAssignments={selectedSummaryAssignments}
                onRemoveAssignment={handleClearSelection}
                onClearAssignments={handleClearAllSelections}
                scoreFields={SCORE_FIELDS}
                formatScoreValue={getScoreValue}
            />

            {modalAssignment && (
                <Suspense fallback={null}>
                    <ModalInputNilai
                        onClose={handleCloseModalInput}
                        assignment={modalAssignment}
                        asistenId={asisten?.id}
                        onSaved={handleSaved}
                    />
                </Suspense>
            )}

            {complaintModal && (
                <Suspense fallback={null}>
                    <ModalNilaiComplaintAsisten
                        isOpen={Boolean(complaintModal)}
                        onClose={() => setComplaintModal(null)}
                        complaint={complaintModal}
                        onUpdated={() => {
                            queryClient.invalidateQueries({ queryKey: ['nilai-complaints-asisten'] });
                            setComplaintModal(null);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
}
