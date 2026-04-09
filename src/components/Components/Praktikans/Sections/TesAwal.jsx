import { useEffect } from "react";
import QuestionCommentInput from "./QuestionCommentInput";
import MarkdownRenderer from "../../MarkdownRenderer";

export default function TesAwal({
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
}) {
    useEffect(() => {
        setQuestionsCount(questions.length);
    }, [questions, setQuestionsCount]);

    const handleOptionChange = (index, optionId) => {
        const updated = [...answers];
        updated[index] = optionId;
        setAnswers(updated);
    };

    const handleSubmit = () => {
        if (onSubmitTask) {
            onSubmitTask("TesAwal", answers);
        }
    };

    if (isLoading) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-depth-secondary">Memuat soal tes awal...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-red-400 font-semibold">{errorMessage}</p>
            </div>
        );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return (
            <div className="mt-[1vh] p-5 max-w-4xl mx-auto text-center">
                <p className="text-depth-secondary">Belum ada soal tes awal untuk modul ini.</p>
            </div>
        );
    }

    return (
        <div className=" transition-all duration-300 w-full ">
            {/* Header */}
            <div className="flex bg-[var(--depth-color-primary)] rounded-depth-lg py-2 px-3 mb-4 justify-center shadow-depth-lg">
                <h1 className="text-white text-center font-bold text-lg">
                    Tes Awal
                </h1>
            </div>

            {/* Questions Container */}
            <div className="space-y-5 max-h-[80vh] p-4 pb-14 rounded-depth-lg border border-depth bg-depth-card overflow-y-auto overflow-x-hidden shadow-depth-lg">
                {questions.map((question, index) => (
                    <div
                        key={question.id ?? index}
                        className="p-3.5 rounded-depth-lg hover:shadow-depth-lg transition-all duration-200 w-[70%]"
                    >
                        {/* Question Number and Text */}
                        <div className="mb-3">
                            <div className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-depth-full bg-[var(--depth-color-primary)] text-white font-bold text-xs shadow-depth-sm">
                                    {index + 1}
                                </span>
                                <div className="flex-1 text-depth-primary font-medium text-sm leading-relaxed">
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
                        </div>

                        {/* Options */}
                        <div className="space-y-2 pl-8">
                            {(question.options ?? []).map((option, optIdx) => {
                                const isSelected = answers[index] === option.id;
                                const optionLabels = ['A', 'B', 'C', 'D'];

                                return (
                                    <label
                                        key={option.id}
                                        className={`max-w-3xl group flex gap-2.5 rounded-depth-md border px-3 py-2 text-xs transition-all duration-200 cursor-pointer ${isSelected
                                            ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)]/15 shadow-depth-sm scale-[1.01]"
                                            : "border-depth bg-depth-card hover:border-[var(--depth-color-primary)]/40 hover:bg-[var(--depth-color-primary)]/5 hover:shadow-depth-sm"
                                            }`}
                                        onClick={() => handleOptionChange(index, option.id)}
                                    >
                                        <input
                                            type="radio"
                                            name={`tes-awal-${question.id}`}
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => { }}
                                            className="sr-only"
                                        />
                                        <span className={`mr-1.5 flex items-center justify-center w-5 h-5 rounded-depth-md text-[10px] font-bold transition-all duration-200 flex-shrink-0 ${isSelected
                                            ? "bg-[var(--depth-color-primary)] text-white shadow-depth-sm"
                                            : "bg-depth-interactive text-depth-secondary group-hover:bg-[var(--depth-color-primary)]/20 group-hover:text-depth-primary"
                                            }`}>
                                            {optionLabels[optIdx]}
                                        </span>
                                        <div className={`flex-1 leading-relaxed transition-colors duration-200 text-sm ${isSelected ? "text-depth-primary font-medium" : "text-depth-primary"
                                            }`}>
                                            <MarkdownRenderer content={option.text} />
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
