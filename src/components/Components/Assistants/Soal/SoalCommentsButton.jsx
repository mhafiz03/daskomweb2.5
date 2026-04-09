import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const COMMENT_TYPE_MAP = {
    tm: "mandiri",
};

const formatTimestamp = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function SoalCommentsButton({ kategoriSoal, modulId, soalId, variant = "default" }) {
    const commentType = COMMENT_TYPE_MAP[kategoriSoal] ?? kategoriSoal;
    const isCommentSupported = Boolean(commentType) && Boolean(modulId) && Boolean(soalId);
    const [isOpen, setIsOpen] = useState(false);

    const {
        data: comments = [],
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["soal-comments", commentType, modulId],
        queryFn: async () => {
            if (!commentType || !modulId) {
                return [];
            }

            const { data } = await api.get(`/api-v1/asisten/soal-comment/${commentType}/${modulId}`);

            if (data?.success === false) {
                throw new Error(data?.message ?? "Gagal memuat komentar soal.");
            }

            return Array.isArray(data?.data) ? data.data : [];
        },
        enabled: isCommentSupported,
        staleTime: 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });

    const relatedComments = useMemo(() => {
        if (!Array.isArray(comments)) {
            return [];
        }

        return comments.filter((comment) => Number(comment?.soal_id) === Number(soalId));
    }, [comments, soalId]);

    const commentCount = relatedComments.length;
    const isIconVariant = variant === "icon";

    const handleOpen = () => {
        if (!isCommentSupported) {
            toast.error("Komentar soal tidak tersedia untuk soal ini.");
            return;
        }

        setIsOpen(true);
        refetch();
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const renderContent = () => {
        if (isLoading || isFetching) {
            return (
                <div className="flex items-center justify-center gap-2 py-10 text-depth-primary">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--depth-color-primary)] border-t-transparent" />
                    Memuat komentar...
                </div>
            );
        }

        if (isError) {
            return (
                <div className="rounded-depth-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                    <p>{error?.message ?? "Terjadi kesalahan saat memuat komentar."}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 inline-flex items-center justify-center rounded-depth-full border border-rose-300/60 bg-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:border-rose-200 hover:-translate-y-0.5"
                    >
                        Muat ulang
                    </button>
                </div>
            );
        }

        if (relatedComments.length === 0) {
            return (
                <div className="rounded-depth-md border border-depth bg-depth-interactive/40 p-6 text-sm text-depth-secondary">
                    Belum ada komentar untuk soal ini.
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {relatedComments.map((comment) => (
                    <div
                        key={comment.id ?? `${comment.soal_id}-${comment.praktikan_id}-${comment.created_at}`}
                        className="rounded-depth-md border border-depth bg-depth-interactive/60 p-4 shadow-depth-sm"
                    >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <span className="text-sm font-semibold text-depth-primary">
                                {comment.praktikan?.nama ?? "Praktikan"}
                            </span>
                            <span className="text-xs text-depth-secondary">
                                {formatTimestamp(comment.created_at)}
                            </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-depth-primary">
                            {comment.comment}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    if (!isCommentSupported) {
        return null;
    }

    const buttonClasses = isIconVariant
        ? "relative flex h-9 w-9 items-center justify-center rounded-depth-md border border-depth bg-depth-interactive text-depth-primary shadow-depth-sm transition duration-150 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] hover:shadow-depth-md"
        : "flex h-9 items-center justify-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 text-xs font-semibold text-depth-primary shadow-depth-sm transition duration-150 hover:border-[var(--depth-color-primary)] hover:text-[var(--depth-color-primary)] hover:shadow-depth-md";

    return (
        <>
            <button type="button" onClick={handleOpen} className={buttonClasses}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isIconVariant ? "h-4 w-4" : "h-4 w-4"}
                >
                    <path d="M21 15a2 2 0 01-2 2H8l-5 5V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {isIconVariant ? (
                    <>
                        <span className="sr-only">Lihat komentar soal</span>
                        <span className="absolute -top-1 -right-1 min-w-[1.5rem] rounded-depth-full bg-[var(--depth-color-primary)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                            {commentCount}
                        </span>
                    </>
                ) : (
                    <>
                        <span>Komentar</span>
                        <span className="rounded-depth-full bg-depth-card px-2 py-0.5 text-[0.65rem] font-semibold">
                            {commentCount}
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <ModalOverlay onClose={handleClose} className="depth-modal-overlay z-50 px-4 py-6">
                    <div className="w-full max-w-2xl rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                    Komentar Soal
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-depth-primary">
                                    {`Soal ID ${soalId}`}
                                </h3>
                                <p className="mt-1 text-xs text-depth-secondary">
                                    Total komentar: {commentCount}
                                </p>
                            </div>
                            <ModalCloseButton onClick={handleClose} ariaLabel="Tutup komentar soal" />
                        </div>

                        <div className="mt-4 max-h-80 overflow-y-auto">
                            {renderContent()}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
