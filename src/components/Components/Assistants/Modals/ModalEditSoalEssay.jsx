import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalEditSoalEssay({ onClose, soalItem, onSave, supportsFileUpload = false }) {
    const [soal, setSoal] = useState(soalItem.soal || "");
    const [selectedModul, setSelectedModul] = useState(
        soalItem.modul_id ? String(soalItem.modul_id) : ""
    );
    const [enableFileUpload, setEnableFileUpload] = useState(Boolean(soalItem.enable_file_upload));
    const {
        data: moduls = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery();

    useEffect(() => {
        setSoal(soalItem.soal || "");
        setSelectedModul(soalItem.modul_id ? String(soalItem.modul_id) : "");
        setEnableFileUpload(Boolean(soalItem.enable_file_upload));
    }, [soalItem]);

    const handleSave = () => {
        if (!soal.trim()) {
            toast.error("Soal tidak boleh kosong.");
            return;
        }

        if (!selectedModul) {
            toast.error("Pilih modul untuk soal ini.");
            return;
        }

        onSave({
            ...soalItem,
            soal,
            modul_id: Number(selectedModul),
            enable_file_upload: supportsFileUpload ? enableFileUpload : false,
            oldSoal: soalItem.soal,
        });

        toast.success("Soal berhasil diedit!");
        onClose();
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div className="depth-modal-container max-w-3xl">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Edit Soal</h2>
                    <div className="flex items-center gap-3">
                        <p>Move into:</p>
                        <select
                            id="modul_id"
                            className="w-full rounded-depth-md border border-depth bg-depth-card p-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 md:w-60"
                            value={selectedModul}
                            onChange={(e) => setSelectedModul(e.target.value)}
                        >
                            <option value="">- Pilih Modul -</option>
                            {modulesLoading && <option disabled>Memuat modul...</option>}
                            {modulesError && (
                                <option disabled>
                                    {modulesQueryError?.message ?? "Gagal memuat modul"}
                                </option>
                            )}
                            {!modulesLoading && !modulesError &&
                                moduls.map((modul) => (
                                    <option key={modul.idM} value={String(modul.idM)}>
                                        {modul.judul}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup edit soal" />
                </div>

                <textarea
                    className="h-64 w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    rows="10"
                    placeholder="Edit soal..."
                    value={soal}
                    onChange={(e) => setSoal(e.target.value)}
                />

                <div className="mt-6 flex flex-row gap-3 md:items-center justify-end">
                    {supportsFileUpload && (
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-depth-primary">Enable File Upload</p>
                            </div>
                            <DepthToggleButton isOn={enableFileUpload} onToggle={() => setEnableFileUpload(!enableFileUpload)} />
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        type="button"
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md md:self-end"
                        disabled={modulesLoading}
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );

}
