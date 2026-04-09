import toast from "react-hot-toast";
import { submit } from "@/lib/http";
import { destroy as logoutAsisten } from "@/lib/routes/auth/loginAsisten";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalLogout({ onClose, onConfirm }) {
    const handleConfirm = () => {
        if (onConfirm) {
            submit(logoutAsisten(), {
                data: {},
                onSuccess: () => {
                    // Redirect the user to the login page after a successful logout
                    window.location.href = '/';
                },
                onError: (error) => {
                    // Handle any errors during logout
                    console.error('Logout failed:', error);
                    toast.error('Logout gagal. Silakan coba lagi.');
                },
            });
        }
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container max-w-md">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Apakah Kamu Yakin?</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfirmasi logout" />
                </div>

                <p className="mb-6 text-center text-depth-secondary">
                    Anda akan keluar dari sistem. Pastikan semua perubahan telah disimpan.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Tidak
                    </button>
                    <button
                        onClick={handleConfirm}
                        type="button"
                        className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-6 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Ya, Keluar
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
