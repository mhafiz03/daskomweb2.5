import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { send } from "@/lib/http";
import { useSoalQuery, soalQueryKey } from "@/hooks/useSoalQuery";
import { getSoalController } from "@/lib/soalControllers";
import ModalEditSoalPG from "../Modals/ModalEditSoalPG";
import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import toast from "react-hot-toast";
import ModalBatchEditSoal from "../Modals/ModalBatchEditSoal";
import ModalCompareSoal from "../Modals/ModalCompareSoal";
import ModalAnalyzeSoalPG from "../Modals/ModalAnalyzeSoalPG";
import SoalCommentsButton from "./SoalCommentsButton";
import { useSoalComparison } from "@/hooks/useSoalComparison";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import MarkdownRenderer from "../../MarkdownRenderer";

const OPTION_COUNT = 4;
const EMPTY_OPTIONS = Array.from({ length: OPTION_COUNT }, () => "");

const isOptionCorrect = (soalItem, option, optionIndex) => {
    if (typeof option?.is_correct === "boolean") {
        return option.is_correct;
    }

    if (option?.id && soalItem?.opsi_benar_id) {
        return option.id === soalItem.opsi_benar_id;
    }

    if (typeof soalItem?.correct_option === "number") {
        return soalItem.correct_option === optionIndex;
    }

    return false;
};

const normalizeOptionsForDisplay = (soalItem) => {
    const options = soalItem?.options ?? [];
    const normalized = options.map((option) => ({
        id: option?.id ?? null,
        text: option?.text ?? "",
        is_correct: option?.is_correct,
    }));

    while (normalized.length < OPTION_COUNT) {
        normalized.push({ id: null, text: "", is_correct: false });
    }

    return normalized;
};

export default function SoalInputPG({ kategoriSoal, modul, modules = [], onModalSuccess, onModalValidation, onChangeModul, isEditable = true }) {
    const [formState, setFormState] = useState({
        pertanyaan: "",
        options: [...EMPTY_OPTIONS],
        correctIndex: 0,
    });
    const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
    const [editingSoal, setEditingSoal] = useState(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [compareState, setCompareState] = useState({
        isOpen: false,
        regularModuleId: "",
        englishModuleId: "",
    });
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [analyzeModuleId, setAnalyzeModuleId] = useState(modul ? String(modul) : "");
    const isAnalysisSupported = kategoriSoal === "ta" || kategoriSoal === "tk";
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

    const controller = getSoalController(kategoriSoal);

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
                queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, previousKey) });
            }

            if (nextKey && nextKey !== previousKey) {
                queryClient.invalidateQueries({ queryKey: soalQueryKey(kategoriSoal, nextKey) });
            }
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
        onError: (error) => {
            toast.error(error?.response?.data?.message ?? "Gagal menghapus soal.");
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
                const desiredQuestion = desiredItem?.pertanyaan?.trim() ?? "";
                const desiredOptions = (desiredItem?.options ?? []).map((option) => ({
                    text: (option?.text ?? "").trim(),
                    isCorrect: Boolean(option?.isCorrect),
                }));

                if (existingItem && desiredQuestion) {
                    if (desiredOptions.length !== OPTION_COUNT) {
                        throw new Error(`Soal ${i + 1} harus memiliki ${OPTION_COUNT} pilihan.`);
                    }

                    if (desiredOptions.some((option) => option.text.length === 0)) {
                        throw new Error(`Semua pilihan pada Soal ${i + 1} harus diisi.`);
                    }

                    const existingOptions = normalizeOptionsForDisplay(existingItem);
                    const payloadOptions = desiredOptions.map((option, optionIndex) => ({
                        id: existingOptions[optionIndex]?.id ?? null,
                        text: option.text,
                    }));
                    const correctIndex = desiredOptions.findIndex((option) => option.isCorrect);
                    const finalCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
                    const existingCorrectIndexRaw = existingOptions.findIndex((option, optionIndex) =>
                        isOptionCorrect(existingItem, option, optionIndex),
                    );
                    const existingCorrectIndex = existingCorrectIndexRaw >= 0 ? existingCorrectIndexRaw : 0;

                    const hasQuestionChanged = existingItem.pertanyaan !== desiredQuestion;
                    const hasOptionChanged = payloadOptions.some(
                        (option, optionIndex) =>
                            option.text !== (existingOptions[optionIndex]?.text ?? ""),
                    );
                    const hasCorrectChanged =
                        finalCorrectIndex !== (existingCorrectIndex >= 0 ? existingCorrectIndex : 0);

                    if (
                        hasQuestionChanged ||
                        hasOptionChanged ||
                        hasCorrectChanged ||
                        existingItem.modul_id !== targetModulId
                    ) {
                        await send(controller.update(existingItem.id), {
                            modul_id: targetModulId,
                            pertanyaan: desiredQuestion,
                            options: payloadOptions,
                            correct_option: finalCorrectIndex,
                        });
                    }
                } else if (existingItem && !desiredQuestion) {
                    await send(controller.destroy(existingItem.id));
                } else if (!existingItem && desiredQuestion) {
                    if (desiredOptions.length !== OPTION_COUNT) {
                        throw new Error(`Soal ${i + 1} harus memiliki ${OPTION_COUNT} pilihan.`);
                    }

                    if (desiredOptions.some((option) => option.text.length === 0)) {
                        throw new Error(`Semua pilihan pada Soal ${i + 1} harus diisi.`);
                    }

                    const correctIndex = desiredOptions.findIndex((option) => option.isCorrect);
                    const finalCorrectIndex = correctIndex >= 0 ? correctIndex : 0;

                    await send(controller.store(targetModulId), {
                        pertanyaan: desiredQuestion,
                        options: desiredOptions.map((option) => ({ text: option.text })),
                        correct_option: finalCorrectIndex,
                    });
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
            console.error("Error batch updating soal PG:", error);
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                "Gagal memperbarui soal.",
            );
        },
    });

    const handleOptionChange = (index, value) => {
        setFormState((prev) => {
            const updated = [...prev.options];
            updated[index] = value;
            return { ...prev, options: updated };
        });
    };

    const handleSetCorrect = (index) => {
        setFormState((prev) => ({ ...prev, correctIndex: index }));
    };

    const handleTambahSoal = () => {
        if (!modul) {
            onModalValidation?.({ message: "Pilih modul terlebih dahulu.", includeModuleNotice: false });
            return;
        }

        const { pertanyaan, options, correctIndex } = formState;

        if (!pertanyaan.trim()) {
            onModalValidation?.({ message: "Pertanyaan tidak boleh kosong." });
            return;
        }

        if (options.some((option) => !option.trim())) {
            onModalValidation?.({ message: "Semua pilihan jawaban harus diisi." });
            return;
        }

        const uniqueOptions = new Set(options.map((option) => option.trim()));
        if (uniqueOptions.size !== options.length) {
            onModalValidation?.({ message: "Teks pilihan tidak boleh duplikat." });
            return;
        }

        postSoalMutation.mutate({
            pertanyaan: pertanyaan.trim(),
            options: options.map((option) => ({ text: option.trim() })),
            correct_option: correctIndex,
        });

        setFormState({
            pertanyaan: "",
            options: [...EMPTY_OPTIONS],
            correctIndex: 0,
        });

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

        putSoalMutation.mutate({
            soalId: updatedSoal.id,
            payload: {
                modul_id: nextModulId,
                pertanyaan: updatedSoal.pertanyaan,
                options: updatedSoal.options,
                correct_option: updatedSoal.correct_option,
            },
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
            .map((soalItem, index) => {
                const options = normalizeOptionsForDisplay(soalItem);
                const optionsMarkdown = options
                    .map((option, optionIndex) => {
                        const isCorrect = isOptionCorrect(soalItem, option, optionIndex);
                        const indicator = isCorrect ? "[x]" : "[ ]";
                        const text = option.text?.trim() || "_(kosong)_";
                        return `- ${indicator} ${text}`;
                    })
                    .join("\n");

                const pertanyaan = soalItem.pertanyaan?.trim() ?? "_(kosong)_";

                return `Soal ${index + 1}\n\nPertanyaan:\n${pertanyaan}\n\nPilihan:\n${optionsMarkdown}`;
            })
            .join("\n\n");
    }, [soalList]);

    const handleBatchSubmit = async ({ items, modulId }) => {
        const normalizedItems = Array.isArray(items)
            ? items.map((item) => ({
                pertanyaan: (item?.pertanyaan ?? "").trim(),
                options: (item?.options ?? []).map((option) => ({
                    text: (option?.text ?? "").trim(),
                    isCorrect: Boolean(option?.isCorrect),
                })),
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
            toast.error("Belum ada modul untuk dibandingkan.");
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

    const handleOpenAnalyzeModal = () => {
        if (!String(modul)) {
            toast.error("Pilih modul terlebih dahulu sebelum menganalisis.");
            return;
        }

        setAnalyzeModuleId(String(modul));
        setIsAnalyzeModalOpen(true);
    };

    const handleCloseAnalyzeModal = () => {
        setIsAnalyzeModalOpen(false);
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
                        className="w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-sm transition duration-200 placeholder:text-depth-secondary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--depth-color-card)]"
                        rows={4}
                        placeholder="Masukkan soal..."
                        value={formState.pertanyaan}
                        onChange={(e) =>
                            setFormState((prev) => ({ ...prev, pertanyaan: e.target.value }))
                        }
                    />
                </div>
            )}

            {isEditable && (
                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                        Pilihan Jawaban
                    </label>
                    <div className="space-y-3">
                        {formState.options.map((option, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 rounded-depth-lg border border-depth bg-depth-card p-3 shadow-depth-sm transition-colors duration-200"
                            >
                                <input
                                    type="radio"
                                    name="correctOption"
                                    checked={formState.correctIndex === index}
                                    onChange={() => handleSetCorrect(index)}
                                    className="h-4 w-4 accent-[var(--depth-color-primary)]"
                                />
                                <input
                                    type="text"
                                    className="flex-1 rounded-depth-md border border-transparent bg-depth-interactive p-3 text-sm text-depth-primary shadow-depth-inset transition duration-200 placeholder:text-depth-secondary focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isEditable && (
                <div className="flex flex-wrap justify-end gap-3">
                    {isAnalysisSupported && (
                        <button
                            className="rounded-depth-md border border-depth bg-depth-interactive px-6 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={handleOpenAnalyzeModal}
                            type="button"
                            disabled={!String(modul)}
                        >
                            Analyze
                        </button>
                    )}
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
                        disabled={soalQuery.isLoading || soalList.length === 0}
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
                <h3 className="text-base font-semibold text-depth-secondary">
                    Soal yang telah ditambahkan:
                </h3>
                {soalQuery.isLoading && (
                    <p className="text-sm text-depth-secondary">Memuat soal...</p>
                )}
                {soalQuery.isError && (
                    <p className="text-sm text-red-500">
                        {soalQuery.error?.message ?? "Gagal memuat soal"}
                    </p>
                )}
                {!soalQuery.isLoading && !soalQuery.isError && (
                    <ul className="space-y-4">
                        {soalList.map((soalItem, index) => (
                            <li
                                key={soalItem.id ?? index}
                                className="relative rounded-depth-lg border border-depth bg-depth-card p-5 shadow-depth-md transition duration-200 hover:shadow-depth-lg"
                            >
                                <div className="mb-4 space-y-2">
                                    <div className="text-sm font-semibold text-depth-secondary">
                                        Soal {index + 1}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words rounded-depth-md bg-depth-interactive p-3 text-sm text-depth-primary shadow-depth-inset max-h-[60vh] overflow-y-auto min-w-0">
                                        <MarkdownRenderer content={soalItem.pertanyaan} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                        Pilihan
                                    </div>
                                    <ul className="space-y-2">
                                        {normalizeOptionsForDisplay(soalItem).map((option, optionIndex) => {
                                            const isCorrect = isOptionCorrect(soalItem, option, optionIndex);

                                            return (
                                                <li
                                                    key={option.id ?? `${option.text}-${optionIndex}`}
                                                    className={`flex items-center gap-2 rounded-depth-md border border-transparent px-3 py-2 text-sm shadow-depth-sm transition duration-150 ${isCorrect
                                                        ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                                        : "bg-depth-interactive text-depth-primary"
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        {option.text ? (
                                                            <MarkdownRenderer content={option.text} />
                                                        ) : (
                                                            <span className="italic text-depth-secondary">
                                                                Belum diisi
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div className="absolute right-4 top-4 flex gap-2">
                                    {isEditable && (
                                        <button
                                            onClick={() => handleOpenModalDelete(soalItem)}
                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-red-500 shadow-depth-sm transition duration-150 hover:border-red-400 hover:shadow-depth-md hover:-translate-y-0.5"
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
                                            className="flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive shadow-depth-sm transition duration-150 hover:border-blue-400 hover:shadow-depth-md hover:-translate-y-0.5"
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
            {isAnalyzeModalOpen && (
                <ModalAnalyzeSoalPG
                    kategoriSoal={kategoriSoal}
                    modules={modules}
                    initialModuleId={analyzeModuleId}
                    onClose={handleCloseAnalyzeModal}
                />
            )}
            {isModalOpenEdit && (
                <ModalEditSoalPG
                    soalItem={editingSoal}
                    onClose={handleCloseModalEdit}
                    onConfirm={handleConfirmEdit}
                />
            )}
            {isBatchModalOpen && (
                <ModalBatchEditSoal
                    title="Batch Edit Soal Pilihan Ganda"
                    initialValue={batchContent}
                    variant="pg"
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
                                {deleteCandidate?.pertanyaan?.slice(0, 40) ?? "ini"}
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
