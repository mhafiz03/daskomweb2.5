import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

SyntaxHighlighter.registerLanguage('c', c);

const tabs = [
    { key: "text", label: "Text" },
    { key: "preview", label: "Preview" },
    { key: "split", label: "Side by Side" },
];

const proseClassName =
    "prose max-w-none whitespace-pre-wrap break-words text-depth-primary prose-headings:text-depth-primary prose-strong:text-depth-primary prose-li:marker:text-depth-secondary";

export default function ModalBatchEditSoal({
    title,
    initialValue,
    variant = "essay",
    onClose,
    onSubmit,
    moduleOptions = [],
    initialModuleId = "",
}) {
    const [activeTab, setActiveTab] = useState("text");
    const [content, setContent] = useState(initialValue ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const normalizedModuleOptions = useMemo(
        () =>
            (moduleOptions ?? [])
                .map((option) => {
                    const value = option?.idM ?? option?.id ?? option?.value ?? option?.uuid ?? option?.ID;
                    if (value === undefined || value === null) {
                        return null;
                    }

                    return {
                        value: String(value),
                        label: option?.judul ?? option?.name ?? option?.label ?? option?.title ?? String(value),
                    };
                })
                .filter(Boolean),
        [moduleOptions],
    );

    const [selectedModuleId, setSelectedModuleId] = useState(() => {
        if (initialModuleId) {
            return String(initialModuleId);
        }

        return normalizedModuleOptions[0]?.value ?? "";
    });

    useEffect(() => {
        setContent(initialValue ?? "");
    }, [initialValue]);

    useEffect(() => {
        if (initialModuleId) {
            setSelectedModuleId(String(initialModuleId));
        } else if (normalizedModuleOptions.length > 0) {
            setSelectedModuleId((prev) => prev || normalizedModuleOptions[0]?.value || "");
        }
    }, [initialModuleId, normalizedModuleOptions]);

    const markdownComponents = useMemo(
        () => ({
            code({ inline, className, children, ...props }) {

                return (
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language='c'
                        showLineNumbers
                        PreTag="div"
                        customStyle={{
                            borderRadius: "0.75rem",
                            background: "#111827",
                            padding: "1.25rem",
                        }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                );
            },
        }),
        [],
    );

    const previewItems = useMemo(() => {
        if (variant === "pg") {
            return parsePgMarkdown(content);
        }
        return parseEssayMarkdown(content);
    }, [content, variant]);

    const renderPreviewContent = () => {
        if (!previewItems.length) {
            return <p className="italic text-depth-secondary">Tidak ada konten untuk ditampilkan.</p>;
        }

        if (variant === "pg") {
            return (
                <ul className="space-y-3">
                    {previewItems.map((item, index) => (
                        <li
                            key={`pg-preview-${index}`}
                            className="relative p-5"
                        >
                            <div className="mb-3">
                                <strong>Soal: {index + 1}</strong>
                                <div className={`ml-4 mt-1 text-sm text-justify ${proseClassName}`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                        components={markdownComponents}
                                    >
                                        {item.pertanyaan || "_(kosong)_"}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            <div className="mb-2">
                                <strong>Pilihan:</strong>
                                <ul className="ml-4 mt-1 space-y-2">
                                    {item.options.map((option, optionIndex) => (
                                        <li
                                            key={`pg-option-${index}-${optionIndex}`}
                                            className={`rounded-depth-md border px-3 py-2 text-sm shadow-depth-sm ${option.isCorrect
                                                ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                                : "border-depth bg-depth-interactive text-depth-primary"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className={`flex-1 ${proseClassName}`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                                        components={markdownComponents}
                                                    >
                                                        {option.text || "_(kosong)_"}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    ))}
                </ul>
            );
        }

        return (
            <ul className="space-y-3">
                {previewItems.map((item, index) => (
                    <li
                        key={`essay-preview-${index}`}
                        className="flex items-baseline justify-between rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-md"
                    >
                        <div className="flex-1 p-4">
                            <strong>Soal: {index + 1}</strong>
                            <br />
                            <div className={`ml-2 text-sm text-justify ${proseClassName}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={markdownComponents}
                                >
                                    {item.soal || "_(kosong)_"}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const previewPanel = (
        <div className="min-h-[400px] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
            {renderPreviewContent()}
        </div>
    );

    const renderTextEditor = (className = "") => (
        <textarea
            className={`h-full min-h-[400px] w-full rounded-depth-lg border border-depth bg-depth-card p-4 font-mono text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 ${className}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Masukkan deskripsi soal dalam format Markdown..."
        />
    );

    const handleSubmit = async () => {
        if (!onSubmit) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                rawContent: content,
                items: previewItems,
                modulId: selectedModuleId,
            });
            onClose();
        } catch (error) {
            console.error("Batch edit submission failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container flex max-h-[90vh] flex-col overflow-hidden"
                style={{ "--depth-modal-max-width": "72rem" }}
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">{title}</h2>
                    <div className="flex items-center gap-3">
                        <p>Move into: </p>
                        {normalizedModuleOptions.length > 0 && (
                            <select
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 md:w-auto"
                                value={selectedModuleId}
                                onChange={(event) => setSelectedModuleId(event.target.value)}
                            >
                                {normalizedModuleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup editor batch" />
                </div>

                <div className="flex gap-2 border-[color:var(--depth-border)] px-6 py-3 -mt-3">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                type="button"
                                className={`rounded-depth-md px-4 py-2 text-sm font-semibold transition ${isActive
                                    ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                    : "border border-depth bg-depth-interactive text-depth-primary shadow-depth-sm hover:-translate-y-0.5 hover:shadow-depth-md"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {activeTab === "text" && renderTextEditor()}
                    {activeTab === "preview" && previewPanel}
                    {activeTab === "split" && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {renderTextEditor("md:min-h-[500px]")}
                            <div className="min-h-[500px] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-sm">
                                {renderPreviewContent()}
                            </div>
                        </div>
                    )}
                </div>

                {typeof onSubmit === "function" && (
                    <div className="flex justify-end border-t border-[color:var(--depth-border)] bg-depth-card/80 px-6 py-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                )}
            </div>
        </ModalOverlay>
    );
}

export const parseEssayMarkdown = (markdown) => {
    if (!markdown) {
        return [];
    }

    // Split by "Soal X" pattern and filter empty entries
    const soalPattern = /^Soal\s+\d+\s*\n/gm;
    const parts = markdown.split(soalPattern).filter(part => part.trim().length > 0);

    return parts.map((part) => {
        return {
            soal: part.trim(),
        };
    });
};

export const parsePgMarkdown = (markdown) => {
    if (!markdown) {
        return [];
    }

    // Split by "Soal X" pattern and filter empty entries
    const soalPattern = /^Soal\s+\d+\s*\n/gm;
    const parts = markdown.split(soalPattern).filter(part => part.trim().length > 0);

    return parts.map((part) => {
        const body = part.trim();

        const questionMatch = body.match(/Pertanyaan:\s*\n([\s\S]*?)(?=\nPilihan:|\Z)/);
        const question = questionMatch ? questionMatch[1].trim() : "";

        const optionsMatch = body.match(/Pilihan:\s*\n([\s\S]*)/);
        const optionsSection = optionsMatch ? optionsMatch[1].trim() : "";

        const options = optionsSection
            .split(/\n+/)
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => {
                const stripped = line.replace(/^-+\s*/, "").trim();
                const indicatorMatch = stripped.match(/^\[(x|\s)\]\s*/i);
                const isCorrect = indicatorMatch ? indicatorMatch[1].toLowerCase() === "x" : false;
                const text = indicatorMatch
                    ? stripped.replace(/^\[(x|\s)\]\s*/i, "").trim()
                    : stripped;
                return {
                    text,
                    isCorrect,
                };
            });

        return {
            pertanyaan: question,
            options,
        };
    });
};
