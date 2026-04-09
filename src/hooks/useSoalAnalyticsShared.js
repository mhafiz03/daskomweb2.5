import { api } from "@/lib/api";

const clampPercentage = (count, total) => {
    if (!total) {
        return 0;
    }

    return Number(((count / total) * 100).toFixed(1));
};

export const fetchSoalData = async (kategoriSoal, modulId) => {
    if (!(kategoriSoal === "ta" || kategoriSoal === "tk") || !modulId) {
        return {
            summary: { total_questions: 0, total_responses: 0, respondent_count: 0 },
            questions: [],
        };
    }

    const [questionRes, optionRes, answerRes] = await Promise.all([
        api.get(`/api/soal/${kategoriSoal}`, { params: { modulId } }),
        api.get("/api/soal/opsis", { params: { soalType: kategoriSoal } }),
        api.get(`/api/jawaban/${kategoriSoal}`, { params: { modulId } }),
    ]);

    const questions = Array.isArray(questionRes.data?.data) ? questionRes.data.data : Array.isArray(questionRes.data) ? questionRes.data : [];
    const options = Array.isArray(optionRes.data?.data) ? optionRes.data.data : Array.isArray(optionRes.data) ? optionRes.data : [];
    const answers = Array.isArray(answerRes.data?.data) ? answerRes.data.data : Array.isArray(answerRes.data) ? answerRes.data : [];
    const optionMap = new Map(options.map((item) => [String(item?.id), item]));

    const normalizedQuestions = questions.map((question) => {
        const optionIds = kategoriSoal === "ta"
            ? [question?.opsi1Id, question?.opsi2Id, question?.opsi3Id, question?.opsiBenarId]
            : [question?.opsiId];
        const uniqueOptionIds = Array.from(new Set(optionIds.filter(Boolean).map(String)));
        const answersForQuestion = answers.filter((item) => String(item?.soalId ?? item?.soal_id) === String(question?.id));
        const respondentIds = new Set(answersForQuestion.map((item) => String(item?.praktikanId ?? item?.praktikan_id)).filter(Boolean));

        const normalizedOptions = uniqueOptionIds.map((id) => {
            const count = answersForQuestion.filter((item) => String(item?.opsiId ?? item?.opsi_id) === id).length;
            return {
                id,
                text: optionMap.get(id)?.text ?? "",
                count,
                percentage: clampPercentage(count, answersForQuestion.length),
                is_correct: id === String(question?.opsiBenarId ?? question?.opsiId ?? ""),
            };
        });

        return {
            id: question?.id,
            soal_id: question?.id,
            pertanyaan: question?.pertanyaan ?? question?.soal ?? "",
            options: normalizedOptions,
            response_count: answersForQuestion.length,
            respondent_count: respondentIds.size,
        };
    });

    const totalResponses = normalizedQuestions.reduce((sum, item) => sum + (item?.response_count ?? 0), 0);
    const uniqueRespondents = new Set(answers.map((item) => String(item?.praktikanId ?? item?.praktikan_id)).filter(Boolean));

    return {
        summary: {
            total_questions: normalizedQuestions.length,
            total_responses: totalResponses,
            respondent_count: uniqueRespondents.size,
        },
        questions: normalizedQuestions,
    };
};
