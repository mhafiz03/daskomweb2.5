import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

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

export default function ModalLaporan({ report, onClose }) {
    if (!report) {
        return null;
    }

    const modulName = report?.modul?.judul ?? "Modul tidak diketahui";
    const kelasName = report?.kelas?.kelas ?? "Kelas tidak diketahui";
    const submittedAt = formatDateTime(report?.report_submitted_at);
    const startedAt = formatDateTime(report?.started_at);
    const endedAt = formatDateTime(report?.ended_at);
    const notes = report?.report_notes?.trim() || "Tidak ada catatan laporan.";
    const pjName = report?.pj
        ? [report.pj.nama, report.pj.kode].filter(Boolean).join(" • ") || `Asisten #${report.pj.id}`
        : report?.pj_id
        ? `Asisten #${report.pj_id}`
        : "-";

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container max-h-[85vh] w-full max-w-3xl space-y-6 overflow-y-auto"
            >
                <div className="depth-modal-header">
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-depth-secondary">
                            {kelasName}
                        </h4>
                        <p className="text-xs text-depth-secondary">
                            Mulai: {startedAt} • Selesai: {endedAt} • Laporan dikirim: {submittedAt}
                        </p>
                        <p className="text-xs text-depth-secondary">PJ Laporan: {pjName}</p>
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup laporan" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-center text-lg font-semibold text-depth-primary">{modulName}</h2>
                    <div className="rounded-depth-lg border border-depth bg-depth-card p-4 text-sm leading-relaxed text-depth-primary shadow-depth-sm">
                        <pre className="whitespace-pre-wrap break-words">{notes}</pre>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}
