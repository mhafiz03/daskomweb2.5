import { useEffect, useMemo, useState } from "react";
import { parseEssayMarkdown, parsePgMarkdown } from "./ModalBatchEditSoal";
import MarkdownRenderer from "../../MarkdownRenderer";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";


const proseClassName =
    "prose max-w-none whitespace-pre-wrap break-words text-sm text-depth-primary prose-headings:text-depth-primary prose-strong:text-depth-primary prose-li:marker:text-depth-secondary";

const normalizeModuleOption = (module) => {
    if (!module) {
        return null;
    }

    const value = module.idM ?? module.id ?? module.value ?? module.uuid ?? module.ID;
    if (value === undefined || value === null) {
        return null;
    }

    return {
        value: String(value),
        label: module.judul ?? module.name ?? module.label ?? module.title ?? `Modul ${value}`,
    };
};

const buildEssayMarkdown = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return "Daftar Soal\n\n_Belum ada soal untuk ditampilkan._";
    }

    return items
        .map((item, index) => {
            const soal = item?.soal ?? "";
            return `Soal ${index + 1}\n\n${soal?.trim() || "_(kosong)_"}`;
        })
        .join("\n\n");
};

const normalizePgOption = (option) => ({
    id: option?.id ?? null,
    text: option?.text ?? option?.opsi ?? "",
    is_correct:
        typeof option?.is_correct === "boolean"
            ? option.is_correct
            : Boolean(option?.isCorrect) || Boolean(option?.correct),
});

const isPgOptionCorrect = (option, soal) => {
    if (typeof option?.is_correct === "boolean") {
        return option.is_correct;
    }

    const correctOptionId = soal?.opsi_benar_id ?? soal?.opsiBenarId ?? soal?.opsi_benar;
    if (option?.id && correctOptionId) {
        return option.id === correctOptionId;
    }

    if (typeof soal?.correct_option === "number" && typeof option?.index === "number") {
        return option.index === soal.correct_option;
    }

    return Boolean(option?.isCorrect);
};

const buildPgMarkdown = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return "Daftar Soal\n\n_Belum ada soal untuk ditampilkan._";
    }

    return items
        .map((soalItem, index) => {
            const pertanyaan = soalItem?.pertanyaan ?? "";
            const options = Array.isArray(soalItem?.options) ? soalItem.options : [];

            const mappedOptions = options.map((option, optionIndex) => ({
                ...normalizePgOption(option),
                index: optionIndex,
            }));

            if (mappedOptions.length === 0) {
                return `Soal ${index + 1}\n\nPertanyaan:\n${pertanyaan?.trim() || "_(kosong)_"}\n\nPilihan:\n- [ ] _(kosong)_`;
            }

            const optionsMarkdown = mappedOptions
                .map((option, optionIndex) => {
                    const indicator = isPgOptionCorrect(option, soalItem) ? "x" : " ";
                    const text = option?.text?.trim() || "_(kosong)_";
                    return `- [${indicator}] ${text}`;
                })
                .join("\n");

            return `Soal ${index + 1}\n\nPertanyaan:\n${pertanyaan?.trim() || "_(kosong)_"}\n\nPilihan:\n${optionsMarkdown}`;
        })
        .join("\n\n");
};

const renderEssayPreview = (items = [], markdownComponents) => {
    if (!items.length) {
        return <p className="italic text-depth-secondary">Tidak ada soal untuk ditampilkan.</p>;
    }

    return (
        <ul className="space-y-3">
            {items.map((item, index) => (
                <li
                    key={`essay-preview-${index}`}
                    className="rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm"
                >
                    <strong>Soal {index + 1}</strong>
                    <div className={`mt-2 ${proseClassName}`}>
                        <MarkdownRenderer content={item?.soal || "_(kosong)_"} />
                    </div>
                </li>
            ))}
        </ul>
    );
};

const renderPgPreview = (items = [], markdownComponents) => {
    if (!items.length) {
        return <p className="italic text-depth-secondary">Tidak ada soal untuk ditampilkan.</p>;
    }

    return (
        <ul className="space-y-4">
            {items.map((item, index) => (
                <li
                    key={`pg-preview-${index}`}
                    className="bg-depth-card p-4"
                >
                    <div className="mb-3 space-y-1">
                        <strong>Soal {index + 1}</strong>
                        <div className={proseClassName}>
                            <MarkdownRenderer content={item?.pertanyaan || "_(kosong)_"} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <ul className="space-y-2">
                            {(item?.options ?? []).map((option, optionIndex) => {
                                const isCorrect = Boolean(option?.isCorrect ?? option?.is_correct);
                                return (
                                    <li
                                        key={`pg-option-${index}-${optionIndex}`}
                                        className={`rounded-depth-md border px-3 py-2 text-md shadow-depth-sm ${isCorrect
                                            ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white"
                                            : "border-depth bg-depth-interactive text-depth-primary"
                                            }`}
                                    >
                                        <div className={proseClassName}>
                                            <MarkdownRenderer content={option?.text || "_(kosong)_"} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default function ModalCompareSoal({
    kategoriSoal,
    onClose,
    regularModules = [],
    englishModules = [],
    selectedRegularModuleId,
    selectedEnglishModuleId,
    onSelectRegularModule,
    onSelectEnglishModule,
    regularDataset,
    englishDataset,
    isLoading = false,
    isFetching = false,
    onRefresh,
}) {
    const isMultipleChoice = kategoriSoal === "ta" || kategoriSoal === "tk";


    const regularOptions = useMemo(
        () => (regularModules ?? []).map(normalizeModuleOption).filter(Boolean),
        [regularModules],
    );
    const englishOptions = useMemo(
        () => (englishModules ?? []).map(normalizeModuleOption).filter(Boolean),
        [englishModules],
    );

    const initialRegularContent = useMemo(() => {
        const items = regularDataset?.items ?? [];
        return isMultipleChoice ? buildPgMarkdown(items) : buildEssayMarkdown(items);
    }, [isMultipleChoice, regularDataset]);

    const initialEnglishContent = useMemo(() => {
        const items = englishDataset?.items ?? [];
        return isMultipleChoice ? buildPgMarkdown(items) : buildEssayMarkdown(items);
    }, [isMultipleChoice, englishDataset]);

    const [activeTab, setActiveTab] = useState("edit");
    const [regularContent, setRegularContent] = useState(initialRegularContent);
    const [englishContent, setEnglishContent] = useState(initialEnglishContent);

    useEffect(() => {
        setRegularContent(initialRegularContent);
    }, [initialRegularContent]);

    useEffect(() => {
        setEnglishContent(initialEnglishContent);
    }, [initialEnglishContent]);

    const regularPreviewItems = useMemo(() => {
        if (!regularContent?.trim()) {
            return [];
        }
        return isMultipleChoice ? parsePgMarkdown(regularContent) : parseEssayMarkdown(regularContent);
    }, [isMultipleChoice, regularContent]);

    const englishPreviewItems = useMemo(() => {
        if (!englishContent?.trim()) {
            return [];
        }
        return isMultipleChoice ? parsePgMarkdown(englishContent) : parseEssayMarkdown(englishContent);
    }, [isMultipleChoice, englishContent]);

    const renderColumn = (title, options, selectedValue, onSelect, contentValue, onContentChange, previewItems) => (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                    {title}
                </label>
                {options.length > 0 ? (
                    <select
                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)]"
                        value={selectedValue ?? ""}
                        onChange={(event) => onSelect?.(event.target.value)}
                    >
                        <option value="">- Pilih Modul -</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p className="text-sm text-depth-secondary">Tidak ada modul yang tersedia.</p>
                )}
            </div>

            {activeTab === "edit" ? (
                <textarea
                    className="min-h-[55vh] w-full rounded-depth-lg border border-depth bg-depth-card p-4 font-mono text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    value={contentValue}
                    onChange={(event) => onContentChange?.(event.target.value)}
                    placeholder="Konten soal dalam format Markdown..."
                />
            ) : (
                <div className="min-h-[320px] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
                    {isMultipleChoice
                        ? renderPgPreview(previewItems)
                        : renderEssayPreview(previewItems)}
                </div>
            )}
        </div>
    );

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container flex h-[80vh] max-h-[90vh] flex-col overflow-hidden"
                style={{ "--depth-modal-max-width": "78rem" }}
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Perbandingan Soal</h2>
                    <div className="flex items-center gap-2 text-sm text-depth-secondary -translate-x-20">
                        {["edit", "preview"].map((tabKey) => {
                            const isActive = activeTab === tabKey;
                            const label = tabKey === "edit" ? "Edit" : "Preview";
                            return (
                                <button
                                    key={tabKey}
                                    type="button"
                                    onClick={() => setActiveTab(tabKey)}
                                    className={`rounded-depth-md px-4 py-2 text-sm font-semibold transition ${isActive
                                        ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                        : "border border-depth bg-depth-interactive text-depth-primary shadow-depth-sm hover:-translate-y-0.5 hover:shadow-depth-md"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup perbandingan soal" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-depth-secondary">
                            Memuat data perbandingan soal…
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {renderColumn(
                                "Modul Regular",
                                regularOptions,
                                selectedRegularModuleId,
                                onSelectRegularModule,
                                regularContent,
                                setRegularContent,
                                regularPreviewItems,
                            )}
                            {renderColumn(
                                "Modul English",
                                englishOptions,
                                selectedEnglishModuleId,
                                onSelectEnglishModule,
                                englishContent,
                                setEnglishContent,
                                englishPreviewItems,
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ModalOverlay>
    );
}
