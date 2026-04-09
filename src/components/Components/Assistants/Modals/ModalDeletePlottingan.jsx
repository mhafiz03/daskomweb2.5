import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalDeletePlottingan({ onClose, message, isError, onConfirm }) {
    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container max-w-sm space-y-4 text-center">
                <div className="depth-modal-header justify-center">
                    <h3 className={`depth-modal-title text-center ${isError ? "text-red-500" : ""}`}>
                        {message || "Apakah Anda yakin ingin menghapus data ini?"}
                    </h3>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfirmasi hapus plottingan" />
                </div>
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
