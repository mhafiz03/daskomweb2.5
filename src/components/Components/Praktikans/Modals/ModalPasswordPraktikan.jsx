import { useState } from "react";
import failedIcon from "../../../../assets/modal/failedSymbol.png";
import { api } from "@/lib/api";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalPasswordPraktikan({ onClose }) {
    const [values, setValues] = useState({
        current_password: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const handleSave = async (e) => {
        e.preventDefault();
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
        
        try {
            await api.post("/api/auth/change-password", {
                currentPassword: values.current_password,
                newPassword: values.password,
            });
            setValues({
                current_password: "",
                password: "",
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
            {/* Main password change form */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
                <div className="bg-softGray p-8 rounded shadow-lg w-[30%] relative">
                    {/* Close button */}
                    <ModalCloseButton
                        onClick={onClose}
                        ariaLabel="Tutup ganti password"
                        className="absolute right-2 top-2"
                    />

                    <h2 className="text-3xl font-bold text-center mt-4 mb-9 text-black">Ganti Password</h2>

                    {/* Form for changing password */}
                    <form onSubmit={handleSave}>
                        <div className="mb-4">
                            <input
                                id="current_password"
                                type="password"
                                placeholder="Password Saat Ini"
                                value={values.current_password}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded text-black"
                                />
                        </div>

                        <div className="mb-4">
                            <input
                                id="password"
                                type="password"
                                placeholder="Password Baru"
                                value={values.password}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded text-black"
                                />
                            <p className="text-xs text-gray-500 mt-1">Password minimal 8 karakter</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full p-2 bg-deepForestGreen text-white font-semibold rounded hover:bg-darkGreen disabled:bg-gray-400"
                        >
                            {isLoading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </form>
                </div>
            </div>

            {errorMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
                    <div className="bg-softGray p-8 rounded shadow-lg w-[30%] relative flex flex-col items-center">
                        {/* Close button */}
                        <ModalCloseButton
                            onClick={closeErrorModal}
                            ariaLabel="Tutup pesan error"
                            className="absolute right-2 top-2"
                        />

                        {/* Error icon */}
                        <img className="w-28 mb-4" src={failedIcon} alt="failedIcon" />

                        {/* Error message */}
                        <p className="text-center mb-6 text-xl font-semibold text-darkGreen">{errorMessage}</p>

                        {/* OK button */}
                        <button
                            type="button"
                            onClick={closeErrorModal}
                            className="w-full p-2 bg-deepForestGreen text-white font-semibold rounded hover:bg-darkGreen"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {isSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
                    <div className="bg-softGray p-8 rounded shadow-lg w-[30%] relative flex flex-col items-center">
                        {/* Close button */}
                        <ModalCloseButton
                            onClick={closeSuccessModal}
                            ariaLabel="Tutup pesan sukses"
                            className="absolute right-2 top-2"
                        />

                        {/* Success message */}
                        <p className="text-center mt-4 text-xl font-semibold text-darkGreen">Password Anda telah berhasil diganti.</p>
                    </div>
                </div>
            )}
        </>
    );
}
