import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { send } from "@/lib/http";
import toast from "react-hot-toast";
import { setPraktikan } from "@/lib/routes/praktikan";

export default function FormTarikPraktikan() {
    const [nim, setNim] = useState("");
    const [module, setModule] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        data: modules = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery({
        onError: (err) => {
            console.error("Error fetching modules:", err);
            setModalMessage("Gagal memuat daftar modul");
            setIsSuccess(false);
            setIsModalOpen(true);
            toast.error("Gagal memuat daftar modul");
        },
    });

    const tarikPraktikanMutation = useMutation({
        mutationFn: async ({ nim: praktikanNim, modulId }) => {
            const payload = { nim: praktikanNim, modul_id: modulId };

            try {
                const { data } = await send(setPraktikan(), payload);
                if (!data?.success) {
                    throw new Error(data?.message ?? "Gagal menarik data praktikan");
                }
                return data;
            } catch (err) {
                if (err.response?.data) {
                    const responseMessage = err.response.data.message;
                    if (err.response.status === 404 && responseMessage?.includes("No record found")) {
                        throw new Error(
                            "Tidak ada data untuk praktikan dan modul ini. Praktikan mungkin belum terdaftar untuk modul ini."
                        );
                    }

                    if (err.response.data.errors) {
                        const errorMessages = Object.values(err.response.data.errors).flat();
                        throw new Error(errorMessages.join(", "));
                    }

                    throw new Error(responseMessage ?? "Terjadi kesalahan");
                }

                throw new Error("Gagal terhubung ke server");
            }
        },
        onSuccess: () => {
            const successMessage = "Data praktikan berhasil ditarik";
            setModalMessage(successMessage);
            setIsSuccess(true);
            setNim("");
            setModule("");
            setIsModalOpen(true);
            toast.success(successMessage);
        },
        onError: (err) => {
            const errorMessage = err.message ?? "Gagal menarik data praktikan";
            setModalMessage(errorMessage);
            setIsSuccess(false);
            setIsModalOpen(true);
            toast.error(errorMessage);
        },
    });

    const handleSubmit = () => {
        if (!nim || !module) {
            const warningMessage = "Harap isi semua kolom, jangan tertinggal!";
            setModalMessage(warningMessage);
            setIsSuccess(false);
            setIsModalOpen(true);
            toast.error(warningMessage);
            return;
        }

        tarikPraktikanMutation.mutate({ nim, modulId: module });
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="w-full rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
            <h2 className="mb-6 text-start text-xl font-bold text-depth-primary">Tarik Praktikan</h2>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                    <label htmlFor="nim" className="mb-2 block text-sm font-medium text-depth-primary">
                        NIM
                    </label>
                    <input
                        type="number"
                        id="nim"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        placeholder="1101223083"
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="module" className="mb-2 block text-sm font-medium text-depth-primary">
                        Modul
                    </label>
                    <select
                        id="module"
                        value={module}
                        onChange={(e) => setModule(e.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        disabled={modulesLoading}
                    >
                        <option value="" disabled>
                            Pilih Modul
                        </option>
                        {modulesLoading && <option value="" disabled>Memuat modul...</option>}
                        {modulesError && (
                            <option value="" disabled>
                                {modulesQueryError?.message ?? "Gagal memuat modul"}
                            </option>
                        )}
                        {!modulesLoading && !modulesError &&
                            modules.map((modul) => (
                                <option key={modul.idM} value={modul.idM}>
                                    {modul.judul}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="lg:mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={tarikPraktikanMutation.isPending || modulesLoading}
                        className="h-10 rounded-depth-md bg-[var(--depth-color-primary)] px-6 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {tarikPraktikanMutation.isPending ? "Menarik..." : "Tarik"}
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="depth-modal-overlay">
                    <div className="depth-modal-container max-w-md">
                        <h3 className="mb-4 text-center text-2xl font-bold text-depth-primary">
                            {isSuccess ? "Berhasil Ditambahkan" : "Gagal Ditambahkan"}
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
