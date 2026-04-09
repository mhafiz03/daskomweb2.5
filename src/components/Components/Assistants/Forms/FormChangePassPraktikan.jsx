import { useState } from "react";
import toast from "react-hot-toast";
import { submit } from "@/lib/http";
import { setPassword as setPraktikanPassword } from "@/lib/routes/praktikan";

export default function FormChangePassPraktikan() {
    const [values, setValues] = useState({
        nim: '',
        password: '', // Changed from newPassword to match backend
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSave = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const newErrors = {};
        if(!values.nim) newErrors.nim = 'NIM tidak boleh kosong';
        if(!values.password) newErrors.password = 'Password baru tidak boleh kosong';
        
        if(Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const validationMessage = 'Harap isi semua kolom, jangan tertinggal!';
            setModalMessage(validationMessage);
            setIsSuccess(false);
            setIsModalOpen(true);
            setIsLoading(false);
            toast.error(validationMessage);
            return;
        }

        // 405 mulu.. mamam nih manggil helper submit langsung
        submit(setPraktikanPassword(), {
            data: values,
            onSuccess: () => {
                const successMessage = 'Password Praktikan telah berhasil diganti.';
                setModalMessage(successMessage);
                setIsSuccess(true);
                setIsModalOpen(true);
                toast.success(successMessage);
                
                setValues({
                    nim: '',
                    password: '',
                });
                
                setTimeout(() => {
                    setIsModalOpen(false);  
                }, 3000);
            },
            onError: (errors) => {
                setErrors(errors);
                const parsedMessage = Object.values(errors).flat().join('\n');
                const errorMessage = parsedMessage || 'Gagal mengganti password praktikan.';
                setModalMessage(errorMessage);
                setIsSuccess(false);
                setIsModalOpen(true);
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setValues((prevValues) => ({
            ...prevValues,
            [id]: value,
        }));

        if (errors[id]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [id]: '',
            }));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="w-full rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
            <h2 className="mb-6 text-start text-xl font-bold text-depth-primary">Ganti Password Praktikan</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4 lg:flex-row lg:items-end">
                {/* Input NIM */}
                <div className="flex-1">
                    <label htmlFor="nim" className="mb-2 block text-sm font-medium text-depth-primary">
                        NIM
                    </label>
                    <input
                        type="number"
                        id="nim"
                        value={values.nim}
                        onChange={handleChange}
                        placeholder="1101223083"
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    />
                    {errors.nim && <p className="mt-1 text-xs text-red-500">{errors.nim}</p>}
                </div>
                {/* Input Password Baru */}
                <div className="flex-1">
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-depth-primary">
                        Password Baru
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={values.password}
                        onChange={handleChange}
                        placeholder="Jangan Lupa ya"
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>
                {/* Tombol Simpan */}
                <div className="lg:mt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="h-10 rounded-depth-md bg-[var(--depth-color-primary)] px-6 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>

            {/* Modal */}
            {isModalOpen && (
                <div className="depth-modal-overlay">
                    <div className="depth-modal-container max-w-md">
                        <h3 className="mb-4 text-center text-2xl font-bold text-depth-primary">
                            {isSuccess ? 'Berhasil Disimpan' : 'Gagal Disimpan'}
                        </h3>
                        <p className="mt-6 text-center text-sm text-depth-primary">{modalMessage}</p>
                        <div className="mt-6 text-center">
                            <button
                                onClick={closeModal}
                                className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
