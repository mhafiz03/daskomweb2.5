import { useEffect } from "react";
import QuestionCommentInput from "./QuestionCommentInput";
import MarkdownRenderer from "../../MarkdownRenderer";

export default function TugasPendahuluan({
    isLoading = false,
    errorMessage = null,
    questions = [],
    answers = [],
    setAnswers,
    setQuestionsCount,
    onSubmitTask,
    tipeSoal = null,
    praktikanId = null,
    isCommentEnabled = false,
    showSubmitButton = false,
    submitLabel = "Simpan Jawaban",
}) {
    useEffect(() => {
        setQuestionsCount(questions.length);
    }, [questions, setQuestionsCount]);

    const handleInputChange = (index, value) => {
        const updated = [...answers];
        updated[index] = value;
        setAnswers(updated);
    };

    const handleSubmit = () => {
        if (onSubmitTask) {
            onSubmitTask("TugasPendahuluan", answers);
        }
    };

    if (isLoading) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-gray-600">Memuat soal tugas pendahuluan...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-red-600 font-semibold">{errorMessage}</p>
            </div>
        );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-gray-600">Belum ada soal tugas pendahuluan untuk modul ini.</p>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto mt-2 w-full flex flex-col gap-4 rounded-depth-lg border border-depth bg-depth-card/70 p-4 shadow-depth-lg max-h-[70vh] overflow-hidden">
                <div className="space-y-6 overflow-y-auto min-h-0 flex-1 bg-depth-interactive/40 p-3.5 bg-depth-card rounded-depth-lg">
                    {questions.map((question, index) => (
                        <div key={question.id ?? index} className="space-y-2">
                            <div className="flex items-start gap-2.5">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--depth-color-primary)] text-xs font-semibold text-white shadow-depth-sm">
                                    {index + 1}
                                </span>
                                <div className="flex-1 text-sm font-semibold text-depth-primary break-words">
                                    <MarkdownRenderer content={question.text} />
                                </div>
                            </div>
                            <QuestionCommentInput
                                questionId={question.id ?? question.soalId ?? question.soal_id ?? null}
                                tipeSoal={tipeSoal}
                                praktikanId={praktikanId}
                                isEnabled={isCommentEnabled}
                                className="pl-11"
                            />
                            <textarea
                                className="min-h-[15vh] w-full dark:text-gray-700 rounded-depth-md border border-depth bg-depth-card/80 p-2.5 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)]"
                                placeholder="Tulis jawabanmu di sini..."
                                value={answers[index] ?? ""}
                                onChange={(event) => handleInputChange(index, event.target.value)}
                            ></textarea>
                        </div>
                    ))}
                </div>
            </div>

            {showSubmitButton && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        {submitLabel}
                    </button>
                </div>
            )}
        </>
    );
}
