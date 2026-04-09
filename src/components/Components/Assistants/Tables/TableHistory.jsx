import { Fragment, useMemo, useState } from "react";
import { usePraktikumHistoryQuery } from "@/hooks/usePraktikumHistoryQuery";
import ModalLaporan from "../Modals/ModalLaporan";

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
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

export default function TableHistory() {
    const [selectedReport, setSelectedReport] = useState(null);

    const {
        data: history = [],
        isLoading,
        isError,
        error,
    } = usePraktikumHistoryQuery();

    const hasData = Array.isArray(history) && history.length > 0;

    const errorMessage = useMemo(() => {
        if (!isError) {
            return null;
        }

        return (
            error?.response?.data?.message ??
            error?.message ??
            "Terjadi kesalahan saat memuat history praktikum."
        );
    }, [isError, error]);

    const handleOpenModal = (report) => {
        if (!report?.report_notes) {
            return;
        }

        setSelectedReport(report);
    };

    const handleCloseModal = () => {
        setSelectedReport(null);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-depth-lg border border-depth bg-depth-card p-3 shadow-depth-md">
                <div className="grid grid-cols-5 gap-2 text-xs font-semibold uppercase tracking-wide text-white">
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Tanggal</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Modul</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Kelas</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">Laporan</span>
                    <span className="rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-center shadow-depth-sm">PJ</span>
                </div>
            </div>

            <div className="overflow-x-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg h-[74.5vh]">
                <div className="grid grid-cols-5 gap-1">
                    {isLoading ? (
                        <div className="col-span-5 flex items-center justify-center px-4 py-6 text-depth-secondary">
                            Memuat history praktikum...
                        </div>
                    ) : isError ? (
                        <div className="col-span-5 flex items-center justify-center px-4 py-6 text-red-500">
                            {errorMessage}
                        </div>
                    ) : !hasData ? (
                        <div className="col-span-5 flex items-center justify-center px-4 py-6 text-depth-secondary">
                            Belum ada laporan praktikum yang dikumpulkan.
                        </div>
                    ) : (
                        history.map((item) => {
                            const submittedAt = formatDateTime(item?.report_submitted_at);
                            const modulName = item?.modul?.judul ?? "-";
                            const kelasName = item?.kelas?.kelas ?? "-";
                            const hasReport = Boolean(item?.report_notes);
                            const pjName = item?.pj ? item.pj.kode : item?.pj_id ? `Asisten #${item.pj_id}` : "-";

                            return (
                                <Fragment key={item?.id ?? `${item?.kelas_id ?? "kelas"}-${item?.modul_id ?? "modul"}`}>
                                    <div className="flex h-full items-center justify-center rounded-depth-sm bg-depth-card px-4 py-2 text-center text-sm text-depth-primary shadow-depth-sm">
                                        {submittedAt}
                                    </div>
                                    <div className="flex h-full items-center justify-center rounded-depth-sm bg-depth-card px-4 py-2 text-center text-sm text-depth-primary shadow-depth-sm">
                                        {modulName}
                                    </div>
                                    <div className="flex h-full items-center justify-center rounded-depth-sm bg-depth-card px-4 py-2 text-center text-sm text-depth-primary shadow-depth-sm">
                                        {kelasName}
                                    </div>
                                    <div className="flex h-full items-center justify-center rounded-depth-sm bg-depth-card px-2 py-2 shadow-depth-sm">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenModal(item)}
                                            disabled={!hasReport}
                                            className={`flex h-9 w-9 items-center justify-center rounded-depth-sm border border-depth shadow-depth-sm transition ${
                                                hasReport
                                                    ? "bg-[var(--depth-color-primary)] text-white hover:-translate-y-0.5 hover:shadow-depth-md"
                                                    : "cursor-not-allowed bg-depth-interactive text-depth-secondary"
                                            }`}
                                            aria-label="Lihat laporan praktikum"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                                stroke="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex h-full items-center justify-center rounded-depth-md bg-depth-card px-4 py-2 text-center text-sm text-depth-primary shadow-depth-sm">
                                        {pjName}
                                    </div>
                                </Fragment>
                            );
                        })
                    )}
                </div>
            </div>

            {selectedReport && <ModalLaporan report={selectedReport} onClose={handleCloseModal} />}
        </div>
    );
}
