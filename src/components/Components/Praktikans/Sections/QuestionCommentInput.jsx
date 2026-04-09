import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function QuestionCommentInput({
    questionId,
    tipeSoal,
    praktikanId,
    isEnabled = false,
    onSubmitted,
    className = "",
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resolvedQuestionId = useMemo(() => {
        const normalized = Number(questionId);

        return Number.isFinite(normalized) ? normalized : null;
    }, [questionId]);

    if (!isEnabled || !praktikanId || !tipeSoal || !resolvedQuestionId) {
        return null;
    }

    const handleToggle = () => {
        setIsVisible((prev) => !prev);
    };

    const handleSubmit = async () => {
        const trimmedComment = comment.trim();

        if (trimmedComment.length === 0) {
            toast.error("Isi komentar tidak boleh kosong.");

            return;
        }

        setIsSubmitting(true);

        try {
            await api.post(
                `/api-v1/praktikan/soal-comment/${praktikanId}/${tipeSoal}/${resolvedQuestionId}`,
                { comment: trimmedComment }
            );

            setComment("");
            setIsVisible(false);
            toast.success("Komentar soal berhasil dikirim.");

            if (typeof onSubmitted === "function") {
                onSubmitted(trimmedComment);
            }
        } catch (error) {
            console.error("Failed to submit question comment", error);
            const message =
                error?.response?.data?.message ??
                error?.message ??
                "Gagal mengirim komentar soal.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerClasses = ["mt-3", className].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
            <button
                type="button"
                onClick={handleToggle}
                className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-1.5 text-sm font-medium text-depth-primary shadow-depth-sm transition hover:border-[var(--depth-color-primary)] hover:bg-[var(--depth-color-primary)]/10"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {isVisible ? "Tutup komentar" : "Komentari soal"}
            </button>

            {isVisible && (
                <div className="mt-3 rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-md">
                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                        Tulis pertanyaan atau catatan Anda
                    </label>
                    <textarea
                        className="w-full min-h-[96px] resize-y rounded-depth-md border border-depth bg-depth-interactive p-3 text-sm text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]/40"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Tuliskan komentar untuk asisten..."
                        disabled={isSubmitting}
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsVisible(false)}
                            className="rounded-depth-md px-3 py-1.5 text-sm font-medium text-depth-secondary transition hover:text-depth-primary"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="inline-flex items-center gap-2 rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-1.5 text-sm font-semibold text-white shadow-depth-sm transition hover:bg-[var(--depth-color-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Mengirim..." : "Kirim"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
