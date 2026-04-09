import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
const SoalInputPG = lazy(() => import('../Soal/SoalInputPG'));
const SoalInputEssay = lazy(() => import('../Soal/SoalInputEssay'));
const ModalSaveSoal = lazy(() => import('../Modals/ModalSaveSoal'));
import { useModulesQuery } from "@/hooks/useModulesQuery";
import toast from "react-hot-toast";

export default function FormSoalInput({ isEditable = true }) {
    const [isModalSaveOpen, setIsModalSaveOpen] = useState(false);
    const [kategoriSoal, setKategoriSoal] = useState("");
    const [selectedModul, setSelectedModul] = useState("");
    const {
        data: moduls = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery();

    const handleModulChange = (e) => {
        const value = e.target.value;
        setSelectedModul(value);
    };

    const handleCloseModalSave = () => {
        setIsModalSaveOpen(false);
        setKategoriSoal("");
        setSelectedModul("");
    };

    const handleValidationError = ({ message, includeModuleNotice = false } = {}) => {
        const baseMessage = message ?? "Soal belum ditambahkan!!";
        const notice = includeModuleNotice ? " Pastikan memilih modul terlebih dahulu." : "";
        toast.error(`${baseMessage}${notice}`.trim());
    };

    const handleSuccessNotification = () => {
        toast.success("Soal berhasil ditambahkan!!");
    };

    const selectedModuleData = useMemo(() => {
        if (!selectedModul) {
            return null;
        }

        return (
            moduls.find((module) => String(module.idM) === String(selectedModul)) ?? null
        );
    }, [moduls, selectedModul]);

    const soalCountMeta = useMemo(() => {
        if (!selectedModuleData) {
            return null;
        }

        return {
            tp: selectedModuleData.soal_tp_count ?? 0,
            ta: selectedModuleData.soal_ta_count ?? 0,
            fitb: selectedModuleData.soal_fitb_count ?? 0,
            jurnal: selectedModuleData.soal_jurnal_count ?? 0,
            tm: selectedModuleData.soal_tm_count ?? 0,
            tk: selectedModuleData.soal_tk_count ?? 0,
        };
    }, [selectedModuleData]);

    return (
        <div className="space-y-6 text-depth-primary">
            {/* Pilih kategori soal dan modul */}
            <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex-1 space-y-2">
                    <label
                        htmlFor="kategori-soal"
                        className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                    >
                        Kategori Soal
                    </label>
                    <select
                        id="kategori-soal"
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        value={kategoriSoal}
                        onChange={(e) => setKategoriSoal(e.target.value)}
                    >
                        <option value="">- Pilih Kategori Soal -</option>
                        <option value="tp">Tes Pendahuluan</option>
                        <option value="ta">Tes Awal</option>
                        <option value="fitb">Fill in the blank</option>
                        <option value="jurnal">Jurnal</option>
                        <option value="tm">Mandiri</option>
                        <option value="tk">Tes Keterampilan</option>
                    </select>
                </div>
                <div className="flex-1 space-y-2">
                    <label
                        htmlFor="modul_id"
                        className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                    >
                        Modul
                    </label>
                    <select
                        className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        id="modul_id"
                        value={selectedModul}
                        onChange={handleModulChange}
                    >
                        <option value="">- Pilih Modul -</option>
                        {modulesLoading && <option disabled>Memuat modul...</option>}
                        {modulesError && (
                            <option disabled>
                                {modulesQueryError?.message ?? "Gagal memuat modul"}
                            </option>
                        )}
                        {!modulesLoading && !modulesError && moduls.length > 0
                            ? moduls.map((k) => (
                                <option key={k.idM} value={k.idM}>
                                    {k.judul}
                                </option>
                            ))
                            : null}
                    </select>
                </div>
            </div>

            {selectedModuleData && soalCountMeta && (
                <div className="mt-2 grid gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {[
                        { key: 'tp', label: 'TP' },
                        { key: 'ta', label: 'TA' },
                        { key: 'fitb', label: 'FITB' },
                        { key: 'jurnal', label: 'Jurnal' },
                        { key: 'tm', label: 'Mandiri' },
                        { key: 'tk', label: 'TK' },
                    ].map((item) => (
                        <div
                            key={item.key}
                            className="rounded-depth-md border border-depth bg-depth-interactive/40 px-3 py-2 text-center"
                        >
                            <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-depth-secondary">
                                {item.label}
                            </div>
                            <div className="text-lg font-bold text-depth-primary">
                                {soalCountMeta[item.key] ?? 0}
                            </div>
                        </div>
                    ))}
                </div>

            )}

            {/* Input soal berdasarkan kategori soal */}
            <Suspense fallback={<div className="text-sm text-depth-secondary">Memuat soal...</div>}>
                {(() => {
                    if (!kategoriSoal) return null;
                    const essayTypes = ["tp", "fitb", "jurnal", "tm"];
                    const pgTypes = ["ta", "tk"];
                    if (essayTypes.includes(kategoriSoal) && selectedModul) {
                        return (
                            <SoalInputEssay
                                kategoriSoal={kategoriSoal}
                                modul={selectedModul}
                                modules={moduls}
                                onModalSuccess={handleSuccessNotification}
                                onModalValidation={handleValidationError}
                                onChangeModul={setSelectedModul}
                                isEditable={isEditable}
                            />
                        );
                    }
                    if (pgTypes.includes(kategoriSoal) && selectedModul) {
                        return (
                            <SoalInputPG
                                kategoriSoal={kategoriSoal}
                                modul={selectedModul}
                                onModalSuccess={handleSuccessNotification}
                                onModalValidation={handleValidationError}
                                modules={moduls}
                                onChangeModul={setSelectedModul}
                                isEditable={isEditable}
                            />
                        );
                    }
                    return null;
                })()}
            </Suspense>

            {isModalSaveOpen && (
                <Suspense fallback={null}>
                    <ModalSaveSoal onClose={handleCloseModalSave} />
                </Suspense>
            )}
        </div>
    );
}
