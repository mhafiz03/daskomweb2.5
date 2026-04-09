import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import ContentLihatTP from "../Content/ContentLihatTP";

export default function FormLihatTp() {
    const [nim, setNim] = useState("");
    const [selectedModulId, setSelectedModulId] = useState("");
    const [error, setError] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [resultData, setResultData] = useState({
        jawabanData: [],
        praktikan: null,
        modul: null,
    });

    const {
        data: modules = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery({
        onError: (err) => {
            console.error("Error fetching modules:", err);
        },
    });

    const getModuleId = (module) => String(module?.idM ?? module?.id ?? module?.modul_id ?? "");

    const moduleOptions = useMemo(
        () =>
            modules.map((module) => ({
                id: getModuleId(module),
                label: module?.judul ?? `Modul ${module?.idM ?? module?.id ?? ""}`,
            })),
        [modules],
    );

    const jawabanTpMutation = useMutation({
        mutationFn: async ({ nim: praktikanNim, modulId }) => {
            try {
                const { data } = await api.get(`/api-v1/jawaban-tp/${praktikanNim}/${modulId}`);
                if (!data?.success) {
                    throw new Error(data?.message ?? "Gagal menampilkan jawaban TP");
                }
                return data.data;
            } catch (err) {
                const message = err.response?.data?.message ?? err.message ?? "Gagal menampilkan jawaban TP";
                throw new Error(message);
            }
        },
        retry: false,
        onSuccess: (data) => {
            setResultData({
                jawabanData: data?.jawabanData ?? [],
                praktikan: data?.praktikan ?? null,
                modul: data?.modul ?? null,
            });
            setShowResults(true);
        },
        onError: (err) => {
            setError(err.message ?? "Gagal menampilkan jawaban TP");
        },
    });

    const handleNimChange = (e) => {
        setNim(e.target.value);
        setError("");
    };

    const handleModulChange = (event) => {
        const value = event.target.value;
        setSelectedModulId(value);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nim || !selectedModulId) {
            setError("NIM dan Modul harus diisi");
            return;
        }

        setError("");
        jawabanTpMutation.mutate({ nim, modulId: selectedModulId });
    };

    const handleBackToForm = () => {
        setShowResults(false);
        setNim("");
        setSelectedModulId("");
        setError("");
    };


    if (showResults) {
        return (
            <div>
                <ContentLihatTP
                    jawabanData={resultData.jawabanData}
                    praktikan={resultData.praktikan}
                    modul={resultData.modul}
                />
                <div className="container mx-auto p-4 text-center">
                    <button
                        onClick={handleBackToForm}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Kembali ke Pencarian
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
                <h1 className="mb-6 text-center text-2xl font-bold text-depth-primary">Lihat Jawaban TP</h1>

                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="nim" className="mb-1 block text-sm font-medium text-depth-primary">
                                NIM Praktikan
                            </label>
                            <input
                                type="text"
                                id="nim"
                                value={nim}
                                onChange={handleNimChange}
                                className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="Masukkan NIM"
                            />
                        </div>

                        <div>
                            <label htmlFor="modul" className="mb-1 block text-sm font-medium text-depth-primary">
                                Modul
                            </label>
                            <select
                                id="modul"
                                value={selectedModulId}
                                onChange={handleModulChange}
                                className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                disabled={modulesLoading || moduleOptions.length === 0}
                            >
                                <option value="">
                                    {modulesLoading
                                        ? "Memuat modul..."
                                        : moduleOptions.length === 0
                                            ? "Tidak ada modul tersedia"
                                            : "Pilih modul"}
                                </option>
                                {!modulesError &&
                                    moduleOptions.map((module) => (
                                        <option key={module.id} value={module.id}>
                                            {module.label}
                                        </option>
                                    ))}
                                {modulesError && (
                                    <option disabled>{modulesQueryError?.message ?? "Gagal memuat modul"}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={jawabanTpMutation.isPending || modulesLoading}
                        className="mt-4 w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {jawabanTpMutation.isPending ? "Memuat..." : "Lihat Jawaban"}
                    </button>
                </form>

                {error && (
                    <div className="mb-4 rounded-depth-md border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {modulesError && (
                    <div className="mt-4 rounded-depth-md border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm text-red-400">
                        {modulesQueryError?.message ?? "Gagal memuat daftar modul."}
                    </div>
                )}
            </div>
        </div>
    );
}
