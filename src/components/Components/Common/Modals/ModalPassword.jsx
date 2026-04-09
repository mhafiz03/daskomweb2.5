import { useEffect, useState } from "react";
import failedIcon from "../../../../assets/modal/failedSymbol.png";
import { send } from "@/lib/http";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "../ModalCloseButton";

export default function ModalPassword({ isOpen, onClose, updatePasswordAction, userType = "praktikan" }) {
    const [values, setValues] = useState({
        current_password: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    useEffect(() => {
        if (isOpen) {
            setValues({
                current_password: "",
                password: "",
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isSuccess) {
            return;
        }

        const timeout = setTimeout(() => {
            setIsSuccess(false);
            onClose?.();
        }, 1500);

        return () => clearTimeout(timeout);
    }, [isSuccess, onClose]);

    const resolveActionDescriptor = () => {
        if (typeof updatePasswordAction === "function") {
            return updatePasswordAction(values);
        }

        return updatePasswordAction ?? null;
    };

    const extractErrorMessage = (error) => {
        const responseData = error?.response?.data;

        if (responseData?.errors && typeof responseData.errors === "object") {
            return Object.values(responseData.errors).flat().join("\n");
        }

        if (typeof responseData?.message === "string" && responseData.message.trim() !== "") {
            return responseData.message;
        }

        if (error?.message) {
            return error.message;
        }

        return "Terjadi kesalahan saat mengganti password. Silakan coba lagi.";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isLoading) {
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
    
        if (!values.current_password || !values.password) {
            setErrorMessage("Semua kolom harus diisi.");
            setIsLoading(false);
            return;
        }
        
        if (values.password.length < 8) {
            setErrorMessage("Password baru harus minimal 8 karakter.");
            setIsLoading(false);
            return;
        }
        
        const actionDescriptor = resolveActionDescriptor();

        if (!actionDescriptor) {
            setErrorMessage("Tidak dapat mengganti password saat ini. Silakan coba lagi nanti.");
            setIsLoading(false);
            return;
        }

        try {
            if (typeof actionDescriptor.then === "function") {
                await actionDescriptor;
            } else {
                await send(actionDescriptor, values);
            }

            setValues({
                current_password: "",
                password: "",
            });
            setIsSuccess(true);
        } catch (error) {
            console.error("Password update failed:", error);
            setErrorMessage(extractErrorMessage(error));
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

    if (!isOpen) return null;

    return (
        <>
            <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
                <form onSubmit={handleSave} className="depth-modal-container max-w-xl space-y-4">
                    <div className="depth-modal-header">
                        <h2 className="depth-modal-title">Ganti Password</h2>
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup ganti password" />
                    </div>

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
                        <p className="mt-4 mb-6 text-xs text-depth-secondary">Password minimal 8 karakter</p>
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
                    <div className="depth-modal-container max-w-xl space-y-4">
                        <div className="depth-modal-header">
                            <h2 className="depth-modal-title text-red-500">Error</h2>
                            <ModalCloseButton onClick={closeErrorModal} ariaLabel="Tutup pesan error" />
                        </div>

                        <div className="flex flex-col items-center">
                            <img className="mb-4 h-16 w-16" src={failedIcon} alt="failedIcon" />
                            <p className="whitespace-pre-wrap text-center text-sm text-depth-secondary">
                                {errorMessage}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeErrorModal}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Tutup
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {isSuccess && (
                <ModalOverlay onClose={closeSuccessModal} className="depth-modal-overlay z-[60]">
                    <div className="depth-modal-container max-w-md space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h2 className="depth-modal-title">Berhasil!</h2>
                            <ModalCloseButton onClick={closeSuccessModal} ariaLabel="Tutup pesan sukses" />
                        </div>
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-depth-secondary">Password berhasil diubah</p>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
