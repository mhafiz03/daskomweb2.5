import toast from "react-hot-toast";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ButtonResetPelanggaran({ onClose }) {
    const handleSave = () => {
        toast.success("Data pelanggaran berhasil direset.");
        onClose();
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[70]">
            <div className="depth-modal-container max-w-md space-y-4 text-center">
                <div className="depth-modal-header justify-center">
                    <h2 className="depth-modal-title text-red-500">Konfirmasi Reset</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfirmasi reset pelanggaran" />
                </div>

                <p className="text-sm text-depth-secondary">
                    Semua data pelanggaran akan dihapus dan dikembalikan ke kondisi awal. Apakah Anda yakin ingin mereset data?
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        type="button"
                        className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Reset Data
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
