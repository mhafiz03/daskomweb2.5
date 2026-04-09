import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalConfirmDeleteRole({ onClose, onConfirm }) {
    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container max-w-md space-y-4 text-center">
                <div className="depth-modal-header justify-center">
                    <h3 className="depth-modal-title text-center">Yakin Ingin Menghapus Data Asisten?</h3>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfirmasi hapus asisten" />
                </div>

                <p className="text-sm text-depth-secondary">
                    Tindakan ini tidak dapat dibatalkan. Pastikan kamu sudah memilih asisten yang benar.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={onConfirm}
                        type="button"
                        className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Yakin
                    </button>
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
