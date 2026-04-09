import toast from "react-hot-toast";
import { submit } from "@/lib/http";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalLogout({ isOpen, onClose, onConfirm, logoutAction, onLogoutSuccess }) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (logoutAction) {
            try {
                const actionDescriptor = logoutAction();

                if (actionDescriptor && typeof actionDescriptor.then === "function") {
                    actionDescriptor
                        .then(() => {
                            onLogoutSuccess?.();
                            onClose?.();
                        })
                        .catch((error) => {
                            console.error("Logout failed:", error);
                            toast.error("Logout gagal. Silakan coba lagi.");
                        });
                    return;
                }

                if (actionDescriptor) {
                    submit(actionDescriptor, {
                        data: {},
                        onSuccess: () => {
                            onLogoutSuccess?.();
                            onClose?.();
                        },
                        onError: (error) => {
                            console.error("Logout failed:", error);
                            toast.error("Logout gagal. Silakan coba lagi.");
                        },
                    });
                    return;
                }

                // If no descriptor is returned assume the action handled everything.
                onLogoutSuccess?.();
                onClose?.();
            } catch (error) {
                console.error("Logout failed:", error);
                toast.error("Logout gagal. Silakan coba lagi.");
            }
            return;
        }

        if (onConfirm) {
            try {
                const result = onConfirm();
                if (result && typeof result.then === "function") {
                    result.finally(() => onClose?.());
                    return;
                }
            } catch (error) {
                console.error("Logout confirmation failed:", error);
                toast.error("Logout gagal. Silakan coba lagi.");
            }
        }

        onLogoutSuccess?.();
        onClose?.();
    };

    return (
        <ModalOverlay onClose={onClose}>
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
