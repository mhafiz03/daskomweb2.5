import { useMemo, useState } from "react";
import ModalEditSoalEssay from "../Modals/ModalEditSoalEssay";
import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import { useSoalQuery, soalQueryKey } from "@/hooks/useSoalQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { send } from "@/lib/http";
import { getSoalController } from "@/lib/soalControllers";
import toast from "react-hot-toast";
import ModalBatchEditSoal from "../Modals/ModalBatchEditSoal";
import ModalCompareSoal from "../Modals/ModalCompareSoal";
import SoalCommentsButton from "./SoalCommentsButton";
import { useSoalComparison } from "@/hooks/useSoalComparison";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";
import MarkdownRenderer from "../../MarkdownRenderer";

export default function SoalInputEssay({ kategoriSoal, modul, modules = [], onModalSuccess, onModalValidation, onChangeModul, isEditable = true }) {
    const [addSoal, setAddSoal] = useState({ soal: "" });
    const [enableFileUploadNew, setEnableFileUploadNew] = useState(false);
    const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
    const [editingSoal, setEditingSoal] = useState(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [compareState, setCompareState] = useState({
        isOpen: false,
        regularModuleId: "",
        englishModuleId: "",
    });
    const [deleteCandidate, setDeleteCandidate] = useState(null);

    const getModuleId = (moduleItem) => {
        const possibleId = moduleItem?.idM ?? moduleItem?.id ?? moduleItem?.value ?? moduleItem?.uuid ?? moduleItem?.ID;
        return possibleId === undefined || possibleId === null ? "" : String(possibleId);
    };

    const regularModules = useMemo(
        () => (modules ?? []).filter((moduleItem) => Number(moduleItem?.isEnglish ?? 0) !== 1),
        [modules],
    );

    const englishModules = useMemo(
        () => (modules ?? []).filter((moduleItem) => Number(moduleItem?.isEnglish ?? 0) === 1),
        [modules],
    );

    const queryClient = useQueryClient();
    const soalQuery = useSoalQuery(kategoriSoal, modul);
    const soalList = soalQuery.data ?? [];
    const soalLoading = soalQuery.isLoading;
    const soalError = soalQuery.isError;
    const soalQueryError = soalQuery.error;

    const controller = getSoalController(kategoriSoal);
    const supportsFileUpload = useMemo(
        () => ["jurnal", "fitb"].includes(kategoriSoal),
        [kategoriSoal]
    );

    const postSoalMutation = useMutation({
        mutationFn: async (payload) => {
            if (!controller) {
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            }
            const { data } = await send(controller.store(modul), payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, modul) });
            if (typeof onModalSuccess === "function") {
                onModalSuccess();
            }
        },
        onError: (err) => {
            console.error("Error posting soal:", err);
        },
    });

    const putSoalMutation = useMutation({
        mutationFn: async ({ soalId, payload }) => {
            if (!controller) {
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            }
            const { data } = await send(controller.update(soalId), payload);
            return data;
        },
        onSuccess: (_, variables) => {
            const previousKey = variables?.previousModulKey ?? modul;
            const nextKey = variables?.nextModulKey ?? previousKey;

            if (previousKey) {
                queryClient.invalidateQueries({
                    queryKey: soalQueryKey(kategoriSoal, previousKey),
                });
            }

            if (nextKey && nextKey !== previousKey) {
                queryClient.invalidateQueries({
                    queryKey: soalQueryKey(kategoriSoal, nextKey),
                });
            }
        },
        onError: (err) => {
            console.error("Error updating soal:", err);
        },
    });

    const deleteSoalMutation = useMutation({
        mutationFn: async (soalId) => {
            if (!controller) {
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            }
            await send(controller.destroy(soalId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, modul) });
            setDeleteCandidate(null);
            toast.success("Soal berhasil dihapus!");
        },
        onError: (err) => {
            console.error("Error deleting soal:", err);
            toast.error(err?.response?.data?.message ?? "Gagal menghapus soal.");
        },
    });

    const batchUpdateMutation = useMutation({
        mutationFn: async ({ items, modulId }) => {
            if (!controller) {
                throw new Error(`Kategori soal tidak didukung: ${kategoriSoal}`);
            }

            const targetModulId = Number(modulId ?? modul);
            if (!targetModulId || Number.isNaN(targetModulId)) {
                throw new Error("Modul belum dipilih.");
            }

            const existingItems = soalList ?? [];
            const maxLength = Math.max(existingItems.length, items?.length ?? 0);

            for (let i = 0; i < maxLength; i += 1) {
                const existingItem = existingItems[i] ?? null;
                const desiredItem = items?.[i] ?? null;
                const desiredText = desiredItem?.soal?.trim() ?? "";

                if (existingItem && desiredText) {
                    if (existingItem.soal !== desiredText || existingItem.modul_id !== targetModulId) {
                        await send(controller.update(existingItem.id), {
                            modul_id: targetModulId,
                            soal: desiredText,
                            oldSoal: existingItem.soal,
                        });
                    }
                } else if (existingItem && !desiredText) {
                    await send(controller.destroy(existingItem.id));
                } else if (!existingItem && desiredText) {
                    await send(controller.store(targetModulId), { soal: desiredText });
                }
            }
        },
        onSuccess: (_, variables) => {
            const targetModulId = String(variables?.modulId ?? modul ?? "");
            const currentModulId = String(modul ?? "");

            if (currentModulId) {
                queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, currentModulId) });
            }

            if (targetModulId && targetModulId !== currentModulId) {
                queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, targetModulId) });
            }

            toast.success("Soal berhasil diperbarui.");
        },
        onError: (error) => {
            console.error("Error batch updating soal:", error);
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                "Gagal memperbarui soal.",
            );
        },
    });

    const handleTambahSoal = () => {
        if (!modul) {
            onModalValidation?.({ message: "Pilih modul terlebih dahulu.", includeModuleNotice: false });
            return;
        }

        if (!addSoal.soal.trim()) {
            onModalValidation?.({
                message: "Isi soal terlebih dahulu sebelum menyimpan.",
                includeModuleNotice: false,
            });
            return;
        }

        postSoalMutation.mutate({
            soal: addSoal.soal.trim(),
            enable_file_upload: supportsFileUpload ? enableFileUploadNew : false,
        });
        setAddSoal({ soal: "" });
        setEnableFileUploadNew(false);
    };

    const handleOpenModalDelete = (soalItem) => {
        setDeleteCandidate(soalItem);
    };

    const handleCancelDelete = () => {
        if (!deleteSoalMutation.isPending) {
            setDeleteCandidate(null);
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteCandidate?.id || deleteSoalMutation.isPending) {
            return;
        }

        deleteSoalMutation.mutate(deleteCandidate.id);
    };

    const handleOpenModalEdit = (soalItem) => {
        setEditingSoal(soalItem);
        setIsModalOpenEdit(true);
    };

    const handleCloseModalEdit = () => {
        setEditingSoal(null);
        setIsModalOpenEdit(false);
    };

    const handleConfirmEdit = (updatedSoal) => {
        const previousModulKey =
            editingSoal?.modul_id !== undefined && editingSoal?.modul_id !== null
                ? String(editingSoal.modul_id)
                : modul;
        const parsedNextModulId =
            updatedSoal.modul_id !== undefined && updatedSoal.modul_id !== null
                ? Number(updatedSoal.modul_id)
                : Number.NaN;
        const nextModulId = Number.isNaN(parsedNextModulId)
            ? editingSoal?.modul_id ?? (modul ? Number(modul) : undefined)
            : parsedNextModulId;
        const nextModulKey =
            nextModulId !== undefined && nextModulId !== null
                ? String(nextModulId)
                : previousModulKey;

        if (nextModulId === undefined || nextModulId === null) {
            toast.error("Pilih modul untuk soal ini.");
            return;
        }

        const payload = {
            modul_id: nextModulId,
            soal: updatedSoal.soal,
            oldSoal: editingSoal?.soal ?? updatedSoal.soal,
        };

        if (supportsFileUpload) {
            payload.enable_file_upload = Boolean(updatedSoal.enable_file_upload);
        }

        putSoalMutation.mutate({
            soalId: updatedSoal.id,
            payload,
            previousModulKey,
            nextModulKey,
        });
        handleCloseModalEdit();
    };

    const batchContent = useMemo(() => {
        if (!Array.isArray(soalList) || soalList.length === 0) {
            return "Daftar Soal\n\n_Belum ada soal untuk ditampilkan._";
        }

        return soalList
            .map(
                (item, index) =>
                    `Soal ${index + 1}\n\n${item.soal?.trim() ?? "_(kosong)_"}\n`,
            )
            .join("\n\n");
    }, [soalList]);

    const handleBatchSubmit = async ({ items, modulId }) => {
        const normalizedItems = Array.isArray(items)
            ? items.map((item) => ({
                soal: (item?.soal ?? "").trim(),
            }))
            : [];

        const targetModulId = modulId ?? modul;
        await batchUpdateMutation.mutateAsync({ items: normalizedItems, modulId: targetModulId });

        if (targetModulId && onChangeModul && String(targetModulId) !== String(modul ?? "")) {
            onChangeModul(String(targetModulId));
        }
    };

    const handleOpenCompareModal = () => {
        const hasModules = regularModules.length > 0 || englishModules.length > 0;
        if (!hasModules) {
            toast.error("Belum ada modul lain untuk dibandingkan.");
            return;
        }

        const currentModuleId = modul ? String(modul) : "";
        const currentModule = modules.find((moduleItem) => getModuleId(moduleItem) === currentModuleId);
        const isCurrentEnglish = Number(currentModule?.isEnglish ?? 0) === 1;
        const firstRegularId = getModuleId(regularModules[0]);
        const firstEnglishId = getModuleId(englishModules[0]);

        setCompareState((previous) => ({
            isOpen: true,
            regularModuleId:
                previous.regularModuleId
                || (!isCurrentEnglish && currentModuleId ? currentModuleId : firstRegularId || ""),
            englishModuleId:
                previous.englishModuleId
                || (isCurrentEnglish && currentModuleId ? currentModuleId : firstEnglishId || ""),
        }));
    };

    const handleCloseCompareModal = () => {
        setCompareState((previous) => ({
            ...previous,
            isOpen: false,
        }));
    };

    const handleSelectCompareRegular = (value) => {
        setCompareState((previous) => ({
            ...previous,
            regularModuleId: value,
        }));
    };

    const handleSelectCompareEnglish = (value) => {
        setCompareState((previous) => ({
            ...previous,
            englishModuleId: value,
        }));
    };

    const handleExportJson = () => {
        if (!Array.isArray(soalList) || soalList.length === 0) {
            toast.error("Belum ada soal untuk diekspor.");
            return;
        }

        try {
            const moduleLabel = modules.find((moduleItem) => getModuleId(moduleItem) === String(modul))?.judul;
            const payload = {
                kategori: kategoriSoal,
                modul_id: modul ?? null,
                modul_label: moduleLabel ?? null,
                exported_at: new Date().toISOString(),
                soal: soalList,
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            const safeCategory = kategoriSoal ?? "soal";
            const moduleSuffix = modul ? `-modul-${modul}` : "";
            anchor.download = `soal-${safeCategory}${moduleSuffix}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            toast.success("Soal berhasil diekspor.");
        } catch (error) {
            console.error("Error exporting soal:", error);
            toast.error("Gagal mengekspor data soal.");
        }
    };

    const {
        data: comparisonData,
        isLoading: isComparisonLoading,
        isFetching: isComparisonFetching,
        refetch: refetchComparison,
    } = useSoalComparison(
        kategoriSoal,
        compareState.isOpen ? compareState.regularModuleId : null,
        compareState.isOpen ? compareState.englishModuleId : null,
        {
            enabled:
                compareState.isOpen
                && Boolean(
                    kategoriSoal
                    && (compareState.regularModuleId || compareState.englishModuleId),
                ),
            keepPreviousData: true,
        },
    );

    return (
        <div className="space-y-6 text-depth-primary">
            {isEditable && (
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                        Soal
                    </label>
                    <textarea
                        className="h-48 w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-sm transition duration-200 placeholder:text-depth-secondary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--depth-color-card)]"
                        rows="8"
                        placeholder="Masukkan soal..."
                        value={addSoal.soal}
                        onChange={(e) => setAddSoal({ soal: e.target.value })}
                    />
                    {supportsFileUpload && (
                        <div className="flex items-center justify-between rounded-depth-md border border-depth bg-depth-interactive/40 px-4 py-3 text-sm font-semibold text-depth-primary">
                            <span>Izinkan unggah file untuk soal ini</span>
                            <DepthToggleButton
                                isOn={enableFileUploadNew}
                                onToggle={() => setEnableFileUploadNew((prev) => !prev)}
                            />
                        </div>
                    )}
                </div>
            )}

            {isEditable && (
                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        className="rounded-depth-md border border-depth bg-depth-card px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleOpenCompareModal}
                        type="button"
                        disabled={regularModules.length === 0 && englishModules.length === 0}
                    >
                        Compare
                    </button>
                    {/* <button
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleExportJson}
                        type="button"
                        disabled={!Array.isArray(soalList) || soalList.length === 0}
                    >
                        Export JSON
                    </button> */}
                    <button
                        className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-60"
                        onClick={() => setIsBatchModalOpen(true)}
                        disabled={soalLoading || soalList.length === 0}
                    >
                        Batch Edit
                    </button>
                    <button
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--depth-color-card)] disabled:opacity-70"
                        onClick={handleTambahSoal}
                        disabled={postSoalMutation.isPending}
                    >
                        {postSoalMutation.isPending ? "Menyimpan..." : "+ Tambah Soal"}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-base font-semibold text-depth-secondary">Daftar Soal</h3>
                {soalLoading && <p className="text-sm text-depth-secondary">Memuat soal...</p>}
                {soalError && (
                    <p className="text-sm text-red-500">
                        {soalQueryError?.message ?? "Gagal memuat soal"}
                    </p>
                )}
                {!soalLoading && !soalError && (
                    <ul className="space-y-4">
                        {soalList.map((soalItem, index) => (
                            <li
                                key={soalItem.id ?? index}
                                className="relative flex items-start justify-between gap-4 rounded-depth-lg border border-depth bg-depth-card p-5 shadow-depth-md transition duration-200 hover:shadow-depth-lg"
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="text-sm font-semibold text-depth-secondary">
                                        <span>Soal {index + 1}</span>
                                        {soalItem.enable_file_upload && (
                                            <span className="ml-2 rounded-depth-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                File Upload
                                            </span>
                                        )}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words rounded-depth-md bg-depth-interactive p-3 text-sm text-depth-primary shadow-depth-inset max-h-[60vh] overflow-y-auto min-w-0">
                                        <MarkdownRenderer content={soalItem.soal} />
                                    </div>
                                </div>
                                <div className="absolute right-4 top-4 flex gap-2">
                                    {isEditable && (
                                        <button
                                            onClick={() => handleOpenModalDelete(soalItem)}
                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-red-500 shadow-depth-sm transition duration-150 hover:border-red-400 hover:shadow-depth-md"
                                            type="button"
                                        >
                                            <img className="h-4 w-4" src={trashIcon} alt="Delete" />
                                        </button>
                                    )}
                                    <SoalCommentsButton
                                        kategoriSoal={kategoriSoal}
                                        modulId={soalItem?.modul_id ?? (modul ? Number(modul) : null)}
                                        soalId={soalItem?.id}
                                        variant="icon"
                                    />
                                    {isEditable && (
                                        <button
                                            onClick={() => handleOpenModalEdit(soalItem)}
                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition duration-150 hover:border-blue-400 hover:shadow-depth-md"
                                            type="button"
                                        >
                                            <img className="edit-icon-filter h-4 w-4" src={editIcon} alt="Edit" />
                                        </button>
                                    )}

                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {compareState.isOpen && (
                <ModalCompareSoal
                    kategoriSoal={kategoriSoal}
                    regularModules={regularModules}
                    englishModules={englishModules}
                    selectedRegularModuleId={compareState.regularModuleId}
                    selectedEnglishModuleId={compareState.englishModuleId}
                    onSelectRegularModule={handleSelectCompareRegular}
                    onSelectEnglishModule={handleSelectCompareEnglish}
                    regularDataset={comparisonData?.regular ?? null}
                    englishDataset={comparisonData?.english ?? null}
                    isLoading={isComparisonLoading}
                    isFetching={isComparisonFetching}
                    onRefresh={refetchComparison}
                    onClose={handleCloseCompareModal}
                />
            )}
            {isModalOpenEdit && (
                <ModalEditSoalEssay
                    soalItem={editingSoal}
                    onClose={handleCloseModalEdit}
                    onSave={handleConfirmEdit}
                    supportsFileUpload={supportsFileUpload}
                />
            )}
            {isBatchModalOpen && (
                <ModalBatchEditSoal
                    title="Batch Edit Soal Essay"
                    initialValue={batchContent}
                    variant="essay"
                    moduleOptions={modules}
                    initialModuleId={modul}
                    onClose={() => setIsBatchModalOpen(false)}
                    onSubmit={handleBatchSubmit}
                />
            )}
            {deleteCandidate && (
                <ModalOverlay onClose={handleCancelDelete} className="depth-modal-overlay z-[70]">
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className="depth-modal-title text-center">Hapus Soal</h3>
                            <ModalCloseButton onClick={handleCancelDelete} ariaLabel="Tutup konfirmasi hapus soal" />
                        </div>
                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus soal{" "}
                            <span className="font-semibold text-depth-primary">
                                {deleteCandidate?.soal?.slice(0, 40) ?? "ini"}
                            </span>
                            ?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteSoalMutation.isPending}
                                className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleteSoalMutation.isPending ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}
