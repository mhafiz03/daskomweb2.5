import { useEffect, useState } from "react";
import failedIcon from "../../../../assets/modal/failedSymbol.png";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalPasswordAssistant({ onClose }) {
    const [values, setValues] = useState({
        current_password: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setValues({
            current_password: "",
            password: "",
        });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");
    
        // Client-side validation
        if (!values.current_password || !values.password) {
            setErrorMessage("Semua kolom harus diisi.");
            setIsLoading(false);
            return;
        }
        
        // Check if new password meets minimum length
        if (values.password.length < 8) {
            setErrorMessage("Password baru harus minimal 8 karakter.");
            setIsLoading(false);
            return;
        }
        
        try {
            await api.post("/api/auth/change-password", {
                currentPassword: values.current_password,
                newPassword: values.password,
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            setErrorMessage(
                error?.response?.data?.error ??
                error?.response?.data?.message ??
                error?.message ??
                "Gagal mengganti password.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setValues((prevValues) => ({
            ...prevValues,
            [id]: value,
        }));
    };

    const closeErrorModal = () => {
        setErrorMessage("");
    };

    const closeSuccessModal = () => {
        setIsSuccess(false);
        onClose();
    };

    return (
        <>
            <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
                <form onSubmit={handleSave} className="depth-modal-container max-w-xl space-y-4">
                    <div className="depth-modal-header">
                        <h2 className="depth-modal-title">Ganti Password</h2>
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup ganti password" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <input
                                id="current_password"
                                type="password"
                                placeholder="Password Saat Ini"
                                value={values.current_password}
                                onChange={handleChange}
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                        </div>

                        <div>
                            <input
                                id="password"
                                type="password"
                                placeholder="Password Baru"
                                value={values.password}
                                onChange={handleChange}
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                            <p className="mt-1 text-xs text-depth-secondary">Password minimal 8 karakter</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? "Menyimpan..." : "Simpan"}
                    </button>
                </form>
            </ModalOverlay>

            {errorMessage && (
                <ModalOverlay onClose={closeErrorModal} className="depth-modal-overlay z-[60]">
                    <div className="depth-modal-container max-w-xl">
                        <div className="depth-modal-header">
                            <h2 className="depth-modal-title">Error</h2>
                            <ModalCloseButton onClick={closeErrorModal} ariaLabel="Tutup pesan error" />
                        </div>

                        <div className="flex flex-col items-center">
                            <img className="mb-4 w-28" src={failedIcon} alt="failedIcon" />
                            <p className="mb-6 text-center text-lg font-semibold text-depth-primary">{errorMessage}</p>
                            <button
                                type="button"
                                onClick={closeErrorModal}
                                className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {isSuccess && (
                <ModalOverlay onClose={closeSuccessModal} className="depth-modal-overlay z-[60]">
                    <div className="depth-modal-container max-w-xl space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h2 className="depth-modal-title">Sukses</h2>
                            <ModalCloseButton onClick={closeSuccessModal} ariaLabel="Tutup pesan sukses" />
                        </div>
                        <p className="text-lg font-semibold text-depth-primary">
                            Password Anda telah berhasil diganti.
                        </p>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
