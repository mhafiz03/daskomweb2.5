import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { useQuery } from "@tanstack/react-query";
import PraktikanAuthenticated from "../../layouts/PraktikanAuthenticatedLayout";
import { api } from "../../lib/api";
import toast from "react-hot-toast";
import { useModulesQuery } from "../../hooks/useModulesQuery";
import { getSession } from "../../lib/auth";

const NoPraktikumSection = lazy(() => import("../../components/Components/Praktikans/Sections/NoPraktikumSection"));
const TesAwal = lazy(() => import("../../components/Components/Praktikans/Sections/TesAwal"));
const Jurnal = lazy(() => import("../../components/Components/Praktikans/Sections/Jurnal"));
const Mandiri = lazy(() => import("../../components/Components/Praktikans/Sections/Mandiri"));
const TesKeterampilan = lazy(() => import("../../components/Components/Praktikans/Sections/TesKeterampilan"));
const PraktikanUtilities = lazy(() => import("../../components/Components/Praktikans/Layout/PraktikanUtilities"));
const ScoreDisplayModal = lazy(() => import("../../components/Components/Modals/ScoreDisplayModal"));
const FeedbackPhase = lazy(() => import("../../components/Components/Praktikans/Sections/FeedbackPhase"));

const TASK_COMPONENTS = {
    TesAwal,
    Jurnal,
    Mandiri,
    TesKeterampilan,
};

const TASK_NAMES = Object.keys(TASK_COMPONENTS);
const ALLOWED_COMPONENTS = new Set(["NoPraktikumSection", ...TASK_NAMES, "FeedbackPhase"]);

const INITIAL_COMPLETED_STATE = TASK_NAMES.reduce((accumulator, key) => {
    accumulator[key] = false;
    return accumulator;
}, {});

const TASK_CONFIG = {
    TesAwal: {
        questionEndpoint: "/api/soal/ta",
        submitEndpoint: "/api/jawaban/ta",
        variant: "multiple-choice",
        commentType: "ta",
    },
    Jurnal: {
        questionEndpoint: "/api/soal/jurnal",
        submitEndpoint: "/api/jawaban/jurnal",
        variant: "essay",
        commentType: "jurnal",
        fitb: {
            questionEndpoint: "/api/soal/fitb",
            submitEndpoint: "/api/jawaban/fitb",
        },
    },
    Mandiri: {
        questionEndpoint: "/api/soal/mandiri",
        answerEndpoint: null,
        submitEndpoint: "/api/jawaban/mandiri",
        variant: "essay",
        commentType: "mandiri",
    },
    TesKeterampilan: {
        questionEndpoint: "/api/soal/tk",
        submitEndpoint: "/api/jawaban/tk",
        variant: "multiple-choice",
        commentType: "tk",
    },
};

const AUTOSAVE_TYPE_MAP = {
    TesAwal: "ta",
    Jurnal: "jurnal",
    Mandiri: "mandiri",
    TesKeterampilan: "tk",
};

const SCORE_PHASE_BY_TASK = {
    TesAwal: "ta",
    TesKeterampilan: "tk",
};

const STICKY_TASKS = new Set(["TesAwal", "Mandiri", "TesKeterampilan"]);

const extractQuestions = (response) => {
    const payload = response?.data ?? response;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.questions)) return payload.questions;
    return [];
};

const normalizeEssayQuestions = (items, questionType = "essay") => {
    return (items ?? [])
        .filter((item) => item && (item.soal || item.pertanyaan))
        .map((item) => ({
            id: item.id,
            text: item.soal ?? item.pertanyaan ?? "",
            questionType,
            enable_file_upload: Boolean(item.enable_file_upload),
        }));
};

const normalizeMultipleChoiceQuestions = (items, questionType = "multiple-choice") => {
    return (items ?? [])
        .filter((item) => item && item.pertanyaan)
        .map((item) => ({
            id: item.id,
            text: item.pertanyaan,
            options: (item.options ?? []).map((option) => ({
                id: option.id,
                text: option.text,
            })),
            questionType,
        }))
        .filter((item) => Array.isArray(item.options) && item.options.length > 0);
};

const reorderQuestionsByIds = (questions, questionIds) => {
    if (!Array.isArray(questionIds) || questionIds.length === 0) return questions;

    const questionMap = new Map();
    questions.forEach((question) => {
        if (question?.id !== undefined && question?.id !== null) {
            questionMap.set(String(question.id), question);
        }
    });

    const ordered = [];
    const usedKeys = new Set();

    questionIds.forEach((id) => {
        const key = String(id);
        if (questionMap.has(key) && !usedKeys.has(key)) {
            ordered.push(questionMap.get(key));
            usedKeys.add(key);
        }
    });

    questions.forEach((question) => {
        const key = question?.id;
        if (key === undefined || key === null) return;
        const normalizedKey = String(key);
        if (!usedKeys.has(normalizedKey)) {
            ordered.push(question);
            usedKeys.add(normalizedKey);
        }
    });

    return ordered;
};

const isLikelyJsonObjectString = (value) => {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed === "") return false;
    return (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
};

const serializeAnswerForAutosave = (question, answerValue) => {
    if (!question) return null;

    if (question.questionType === "multiple-choice") {
        if (answerValue === null || answerValue === undefined) return null;
        return answerValue;
    }

    if (answerValue === null || answerValue === undefined) return null;

    if (typeof answerValue === "object") {
        try {
            return JSON.stringify(answerValue);
        } catch (error) {
            console.warn("[Autosave] Failed to serialize answer", error);
            return null;
        }
    }

    if (typeof answerValue === "string") {
        return answerValue.trim() === "" ? null : answerValue;
    }

    const normalized = String(answerValue ?? "");
    return normalized.trim() === "" ? null : normalized;
};

const hydrateAutosaveAnswer = (question, storedAnswer) => {
    if (!question) return storedAnswer ?? "";

    if (question.questionType === "multiple-choice") return storedAnswer;

    if (storedAnswer === null || storedAnswer === undefined) return "";

    if (typeof storedAnswer === "object") return storedAnswer;

    if (typeof storedAnswer !== "string") return String(storedAnswer ?? "");

    const trimmed = storedAnswer.trim();
    if (trimmed === "") return "";

    if (isLikelyJsonObjectString(trimmed)) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === "object") return parsed;
        } catch (error) {
            console.warn("[Autosave] Failed to parse stored answer", error);
        }
    }

    return storedAnswer;
};

const serialiseAnswerForSubmission = (answerValue) => {
    if (answerValue === null || answerValue === undefined) return "";

    if (typeof answerValue === "object") {
        try {
            return JSON.stringify(answerValue);
        } catch (error) {
            console.warn("[Submission] Failed to stringify answer", error);
            return "";
        }
    }

    if (typeof answerValue === "string") return answerValue;

    return String(answerValue ?? "");
};

const PHASE_TO_COMPONENT = {
    ta: "TesAwal",
    fitb_jurnal: "Jurnal",
    mandiri: "Mandiri",
    tk: "TesKeterampilan",
    feedback: "FeedbackPhase",
};

export default function PraktikumPage() {
    const { data: sessionData } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    const praktikanData = sessionData ?? null;
    const praktikanId = praktikanData?.id ?? null;
    const kelasId = praktikanData?.kelas_id ?? praktikanData?.kelas?.id ?? null;
    const kelasName = praktikanData?.kelas?.kelas ?? "";
    const kelasIsTotFlag = praktikanData?.kelas?.is_tot ?? false;
    const isTotClass =
        Boolean(kelasIsTotFlag) ||
        kelasName.trim().toUpperCase().startsWith("TOT");

    const [activeComponent, setActiveComponent] = useState("NoPraktikumSection");
    const [answers, setAnswers] = useState([]);
    const [questionsCount, setQuestionsCount] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [activeTask, setActiveTask] = useState(null);
    const [completedCategories, setCompletedCategories] = useState(INITIAL_COMPLETED_STATE);
    const [activeModulId, setActiveModulId] = useState(null);
    const [moduleMeta, setModuleMeta] = useState(null);
    const [isLoadingTask, setIsLoadingTask] = useState(false);
    const [taskError, setTaskError] = useState(null);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [feedbackReminder, setFeedbackReminder] = useState({
        isPending: false,
        modulId: null,
        asistenId: null,
    });
    const [feedbackContext, setFeedbackContext] = useState({
        modulId: null,
        assistantId: null,
    });
    const [scoreModalState, setScoreModalState] = useState({
        isOpen: false,
        phaseType: null,
        correctAnswers: 0,
        totalQuestions: 0,
        percentage: 0,
        hasError: false,
        isRetrying: false,
    });

    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

    const autosaveDebouncersRef = useRef({});
    const isRestoringAutosaveRef = useRef(false);

    const { data: moduleOptions = [] } = useModulesQuery();

    const resolveModuleTitle = useCallback(
        (identifier) => {
            if (!identifier) return null;
            const identifierString = String(identifier);
            const match =
                moduleOptions.find(
                    (module) => String(module?.id ?? module?.idM ?? module?.modul_id) === identifierString
                ) ?? null;
            if (!match) return null;
            if (typeof match === "string") return match;
            if (match?.judul) return match.judul;
            if (match?.name) return match.name;
            if (match?.modul) {
                if (typeof match.modul === "string") return match.modul;
                if (match.modul?.judul) return match.modul.judul;
            }
            return null;
        },
        [moduleOptions]
    );

    const clearTaskProgress = useCallback(() => {
        setQuestions([]);
        setAnswers([]);
        setQuestionsCount(0);
    }, []);

    const getAutosaveHandler = useCallback((tipeSoal) => {
        if (!tipeSoal) return null;

        if (!autosaveDebouncersRef.current[tipeSoal]) {
            autosaveDebouncersRef.current[tipeSoal] = debounce(async (payload) => {
                try {
                    await api.post("/api/autosave", payload);
                } catch (error) {
                    console.warn(`[Autosave] Failed to save ${tipeSoal} snapshot`, error);
                }
            }, 600);
        }

        return autosaveDebouncersRef.current[tipeSoal];
    }, []);

    useEffect(() => {
        return () => {
            Object.values(autosaveDebouncersRef.current).forEach((handler) => {
                if (handler && typeof handler.cancel === "function") {
                    handler.cancel();
                }
            });
        };
    }, []);

    const resetActiveTaskState = useCallback(() => {
        clearTaskProgress();
        setActiveTask(null);
    }, [clearTaskProgress]);

    const scoreFetchLocksRef = useRef(new Set());
    const scoreAckRequiredRef = useRef(false);
    const pendingFeedbackNavigationRef = useRef(null);

    const fetchPhaseScore = useCallback(
        async (phase) => {
            if (!praktikanId || !activeModulId || !["ta", "tk"].includes(phase)) return;

            const cacheKey = `${phase}:${activeModulId}`;
            if (scoreFetchLocksRef.current.has(cacheKey)) return;

            scoreFetchLocksRef.current.add(cacheKey);
            scoreAckRequiredRef.current = true;

            setScoreModalState((prev) => ({ ...prev, isRetrying: true, hasError: false }));

            try {
                const endpoint =
                    phase === "ta"
                        ? `/api/nilai-ta/${praktikanId}/${activeModulId}`
                        : `/api/nilai-tk/${praktikanId}/${activeModulId}`;

                const { data } = await api.get(endpoint);

                const totalQuestions = data?.total_questions ?? data?.totalQuestions ?? 0;
                const correctAnswersRaw = data?.correct_answers ?? data?.correctAnswers;
                const resolvedPercentage = typeof data?.score === "number" ? data.score : null;
                const correctAnswers =
                    typeof correctAnswersRaw === "number"
                        ? correctAnswersRaw
                        : totalQuestions > 0 && typeof resolvedPercentage === "number"
                            ? Math.round((resolvedPercentage / 100) * totalQuestions)
                            : 0;

                const percentage =
                    typeof resolvedPercentage === "number"
                        ? resolvedPercentage
                        : totalQuestions > 0
                            ? (correctAnswers / totalQuestions) * 100
                            : 0;

                setScoreModalState({
                    isOpen: true,
                    phaseType: phase,
                    correctAnswers,
                    totalQuestions,
                    percentage,
                    hasError: false,
                    isRetrying: false,
                });
            } catch (error) {
                console.error(`Failed to fetch ${phase.toUpperCase()} score`, error);
                setScoreModalState((prev) => ({
                    ...prev,
                    isOpen: true,
                    hasError: true,
                    isRetrying: false,
                }));
                scoreFetchLocksRef.current.delete(cacheKey);
                scoreAckRequiredRef.current = false;
            }
        },
        [praktikanId, activeModulId]
    );

    useEffect(() => {
        if (!ALLOWED_COMPONENTS.has(activeComponent)) {
            setActiveComponent("NoPraktikumSection");
        }
    }, [activeComponent]);

    useEffect(() => {
        setCompletedCategories({ ...INITIAL_COMPLETED_STATE });
    }, [activeModulId]);

    const fetchStoredQuestionIds = useCallback(
        async (autosaveType, modulId) => {
            if (!praktikanId || !autosaveType || !modulId) {
                return { questionIds: [], hasStoredQuestions: false };
            }

            try {
                const { data } = await api.get("/api/autosave/questions", {
                    params: {
                        modul_id: modulId,
                        tipe_soal: autosaveType,
                    },
                });

                const ids = Array.isArray(data?.question_ids)
                    ? data.question_ids
                        .map((value) => Number(value))
                        .filter((value) => Number.isInteger(value) && value > 0)
                    : [];

                return {
                    questionIds: ids,
                    hasStoredQuestions: Boolean(data?.has_stored_questions),
                };
            } catch (error) {
                console.warn(`[Autosave] Failed to fetch stored question ids for ${autosaveType}`, error);
                return { questionIds: [], hasStoredQuestions: false };
            }
        },
        [praktikanId]
    );

    const persistQuestionIdsSnapshot = useCallback(
        async (autosaveType, modulId, questionIds) => {
            if (!praktikanId || !autosaveType || !modulId) return;
            if (!Array.isArray(questionIds) || questionIds.length === 0) return;

            try {
                await api.post("/api/autosave/questions", {
                    modul_id: modulId,
                    tipe_soal: autosaveType,
                    question_ids: questionIds,
                });
            } catch (error) {
                console.warn(`[Autosave] Failed to persist question ids for ${autosaveType}`, error);
            }
        },
        [praktikanId]
    );

    const fetchTaskData = useCallback(
        async (taskKey, modulId) => {
            const config = TASK_CONFIG[taskKey];
            if (!config || !modulId) {
                clearTaskProgress();
                return;
            }

            setIsLoadingTask(true);
            setTaskError(null);
            setSubmissionError(null);

            try {
                const autosaveType = AUTOSAVE_TYPE_MAP[taskKey];
                const shouldPersistQuestions = autosaveType && STICKY_TASKS.has(taskKey);
                let storedQuestionIds = [];
                let hasStoredQuestionSet = false;

                if (shouldPersistQuestions) {
                    const stored = await fetchStoredQuestionIds(autosaveType, modulId);
                    storedQuestionIds = stored.questionIds ?? [];
                    hasStoredQuestionSet = Boolean(stored.hasStoredQuestions);
                }

                const questionConfig = storedQuestionIds.length > 0
                    ? { params: { question_ids: storedQuestionIds } }
                    : undefined;

                const questionResponse = await api.get(config.questionEndpoint, {
                    ...(questionConfig ?? {}),
                    params: {
                        ...(questionConfig?.params ?? {}),
                        modulId,
                    },
                });

                const rawQuestions = extractQuestions(questionResponse);
                let normalizedQuestions = [];

                if (taskKey === "Jurnal" && config.fitb) {
                    const fitbQuestionResponse = await api
                        .get(config.fitb.questionEndpoint, { params: { modulId } })
                        .catch(() => ({ data: [] }));

                    const rawFitbQuestions = extractQuestions(fitbQuestionResponse);
                    const fitbQuestions = normalizeEssayQuestions(rawFitbQuestions, "fitb");
                    const jurnalQuestions = normalizeEssayQuestions(rawQuestions, "jurnal");
                    normalizedQuestions = [...fitbQuestions, ...jurnalQuestions];
                } else {
                    normalizedQuestions =
                        config.variant === "multiple-choice"
                            ? normalizeMultipleChoiceQuestions(rawQuestions)
                            : normalizeEssayQuestions(rawQuestions);
                }

                if (shouldPersistQuestions) {
                    const normalizedIds = normalizedQuestions
                        .map((question) => question?.id)
                        .filter((id) => id !== undefined && id !== null);

                    if (!hasStoredQuestionSet && normalizedIds.length > 0) {
                        await persistQuestionIdsSnapshot(autosaveType, modulId, normalizedIds);
                        storedQuestionIds = normalizedIds;
                        hasStoredQuestionSet = true;
                    }

                    if (storedQuestionIds.length > 0) {
                        normalizedQuestions = reorderQuestionsByIds(normalizedQuestions, storedQuestionIds);
                    }
                }

                const defaultAnswers = normalizedQuestions.map((question) =>
                    question.questionType === "multiple-choice" ? null : ""
                );

                setQuestions(normalizedQuestions);
                setQuestionsCount(normalizedQuestions.length);

                let answersToUse = defaultAnswers;

                if (autosaveType && praktikanId) {
                    try {
                        const { data: autosaveResponse } = await api.get("/api/autosave", {
                            params: {
                                modul_id: modulId,
                                tipe_soal: autosaveType,
                            },
                        });

                        const snapshotList = Array.isArray(autosaveResponse?.data)
                            ? autosaveResponse.data
                            : [];
                        const snapshot = snapshotList.find(
                            (item) => item?.tipe_soal === autosaveType
                        );

                        if (snapshot?.jawaban && typeof snapshot.jawaban === "object") {
                            answersToUse = normalizedQuestions.map((question) => {
                                const questionId = question?.id;
                                if (!questionId) {
                                    return question.questionType === "multiple-choice" ? null : "";
                                }

                                const storedAnswer =
                                    snapshot.jawaban[questionId] ??
                                    snapshot.jawaban[String(questionId)] ??
                                    snapshot.jawaban[Number(questionId)];

                                if (storedAnswer === undefined || storedAnswer === null) {
                                    return question.questionType === "multiple-choice" ? null : "";
                                }

                                return hydrateAutosaveAnswer(question, storedAnswer);
                            });
                        }
                    } catch (error) {
                        console.warn(`[Autosave] Failed to load ${autosaveType} snapshot`, error);
                    }
                }

                isRestoringAutosaveRef.current = true;
                setAnswers(answersToUse);
                setTimeout(() => {
                    isRestoringAutosaveRef.current = false;
                }, 0);
            } catch (error) {
                console.error("Failed to fetch task data", error);
                const message = error?.response?.data?.message ?? error.message ?? "Gagal memuat data tugas.";
                setTaskError(message);
                clearTaskProgress();
            } finally {
                setIsLoadingTask(false);
            }
        },
        [clearTaskProgress, fetchStoredQuestionIds, persistQuestionIdsSnapshot, praktikanId]
    );

    useEffect(() => {
        const currentTask = activeTask;
        const autosaveType = AUTOSAVE_TYPE_MAP[currentTask];

        if (!autosaveType || !praktikanId || !activeModulId) return;
        if (!Array.isArray(questions) || questions.length === 0) return;
        if (!Array.isArray(answers) || answers.length === 0) return;
        if (isRestoringAutosaveRef.current) return;

        const jawabanEntries = {};

        questions.forEach((question, index) => {
            const questionId = question?.id;
            if (!questionId) return;

            const answerValue = answers[index];
            const serializedAnswer = serializeAnswerForAutosave(question, answerValue);
            if (serializedAnswer === null || serializedAnswer === undefined) return;
            if (typeof serializedAnswer === "string" && serializedAnswer.trim() === "") return;

            jawabanEntries[questionId] = serializedAnswer;
        });

        if (Object.keys(jawabanEntries).length === 0) return;

        const debouncedSaver = getAutosaveHandler(autosaveType);
        if (!debouncedSaver) return;

        debouncedSaver({
            praktikan_id: praktikanId,
            modul_id: activeModulId,
            tipe_soal: autosaveType,
            jawaban: jawabanEntries,
        });
    }, [answers, questions, activeTask, praktikanId, activeModulId, getAutosaveHandler]);

    const handlePraktikumStateChange = useCallback(
        (praktikumState) => {
            if (!praktikumState) {
                setActiveModulId(null);
                setModuleMeta(null);
                resetActiveTaskState();
                setActiveComponent("NoPraktikumSection");
                setFeedbackReminder({ isPending: false, modulId: null, asistenId: null });
                return;
            }

            const pending = Boolean(praktikumState.feedback_pending ?? praktikumState.feedbackPending);
            const pendingModulId = praktikumState.feedback_modul_id ?? praktikumState.modul_id ?? null;
            const pendingAsistenId = praktikumState.feedback_asisten_id ?? praktikumState.pj_id ?? null;

            setFeedbackReminder({
                isPending: pending,
                modulId: pendingModulId,
                asistenId: pendingAsistenId,
            });

            setActiveModulId(praktikumState.modul_id ?? pendingModulId ?? null);
            setModuleMeta(praktikumState);

            if (praktikumState.status === "exited" || praktikumState.status === "paused") {
                resetActiveTaskState();
                setActiveComponent("NoPraktikumSection");
            }
        },
        [resetActiveTaskState]
    );

    const handleSaveProgress = useCallback(async () => {
        const autosaveType = AUTOSAVE_TYPE_MAP[activeTask];
        if (!autosaveType || !praktikanId || !activeModulId) {
            toast.error("Tidak ada sesi aktif untuk disimpan.");
            return;
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            toast.error("Belum ada soal yang dimuat.");
            return;
        }

        const jawabanEntries = {};
        questions.forEach((question, index) => {
            const questionId = question?.id;
            if (!questionId) return;
            const answerValue = answers[index];
            const serializedAnswer = serializeAnswerForAutosave(question, answerValue);
            if (serializedAnswer === null || serializedAnswer === undefined) return;
            if (typeof serializedAnswer === "string" && serializedAnswer.trim() === "") return;
            jawabanEntries[questionId] = serializedAnswer;
        });

        if (Object.keys(jawabanEntries).length === 0) {
            toast("Belum ada jawaban untuk disimpan.", { icon: "⚠️" });
            return;
        }

        setIsSavingProgress(true);
        try {
            await api.post("/api/autosave", {
                modul_id: activeModulId,
                tipe_soal: autosaveType,
                jawaban: jawabanEntries,
            });
            toast.success("Progress berhasil disimpan.");
        } catch (error) {
            console.error("[SaveProgress] Failed:", error);
            toast.error(error?.response?.data?.message ?? "Gagal menyimpan progress.");
        } finally {
            setIsSavingProgress(false);
        }
    }, [activeTask, praktikanId, activeModulId, questions, answers]);

    const handleRefreshStatus = useCallback(async () => {
        setIsRefreshingStatus(true);
        try {
            const { data } = await api.get("/api/praktikum/check-praktikum");

            if (data?.dk_required) {
                toast("DK belum dipilih. Silakan pilih DK terlebih dahulu.", { icon: "⚠️" });
                setIsRefreshingStatus(false);
                return;
            }

            const hasActiveTask = activeTask && AUTOSAVE_TYPE_MAP[activeTask];

            if (data?.status === "success") {
                const praktikumPayload = data?.data ?? null;
                const feedbackPending = Boolean(data?.feedback_pending ?? praktikumPayload?.feedback_pending ?? false);
                const mergedPayload = praktikumPayload ? { ...praktikumPayload } : {};

                const payloadToApply = feedbackPending || praktikumPayload
                    ? {
                        ...mergedPayload,
                        feedback_pending: feedbackPending,
                        feedback_modul_id: data?.feedback_modul_id ?? mergedPayload.feedback_modul_id ?? mergedPayload.modul_id ?? null,
                        feedback_asisten_id: data?.feedback_asisten_id ?? mergedPayload.feedback_asisten_id ?? mergedPayload.pj_id ?? null,
                    }
                    : null;

                const newPhase = payloadToApply?.current_phase ?? null;
                const newStatus = payloadToApply?.status ?? null;
                const currentPhase = moduleMeta?.current_phase ?? null;

                const applyFeedbackReminder = (payload) => {
                    if (!payload) return;
                    setFeedbackReminder({
                        isPending: Boolean(payload.feedback_pending),
                        modulId: payload.feedback_modul_id ?? null,
                        asistenId: payload.feedback_asisten_id ?? null,
                    });
                };

                if (newStatus === "paused" || newStatus === "exited" || !payloadToApply) {
                    if (hasActiveTask) {
                        await handleSaveProgress();
                    }
                    resetActiveTaskState();
                    setActiveComponent("NoPraktikumSection");
                    if (payloadToApply) {
                        setModuleMeta(payloadToApply);
                        setActiveModulId(payloadToApply.modul_id ?? null);
                        applyFeedbackReminder(payloadToApply);
                    }
                    toast.success("Status praktikum diperbarui.");
                    return;
                }

                if (newPhase && newPhase === currentPhase) {
                    setModuleMeta(payloadToApply);
                    setActiveModulId(payloadToApply.modul_id ?? null);
                    applyFeedbackReminder(payloadToApply);
                    toast.success("Status praktikum berhasil diperbarui.");
                } else {
                    if (hasActiveTask) {
                        await handleSaveProgress();
                    }
                    setModuleMeta(payloadToApply);
                    setActiveModulId(payloadToApply.modul_id ?? null);
                    applyFeedbackReminder(payloadToApply);
                    toast.success("Status praktikum diperbarui — fase berubah.");
                }
            } else {
                if (hasActiveTask) {
                    await handleSaveProgress();
                }
                resetActiveTaskState();
                setActiveComponent("NoPraktikumSection");
                setModuleMeta(null);
                setActiveModulId(null);
                setFeedbackReminder({ isPending: false, modulId: null, asistenId: null });
                toast("Tidak ada sesi praktikum aktif.", { icon: "ℹ️" });
            }
        } catch (error) {
            console.error("[RefreshStatus] Failed:", error);
            toast.error(error?.response?.data?.message ?? "Gagal memperbarui status praktikum.");
        } finally {
            setIsRefreshingStatus(false);
        }
    }, [moduleMeta, activeTask, handleSaveProgress, resetActiveTaskState]);

    const handleNavigate = useCallback(
        (componentName) => {
            const nextComponent = ALLOWED_COMPONENTS.has(componentName)
                ? componentName
                : "NoPraktikumSection";

            setActiveComponent(nextComponent);

            if (TASK_NAMES.includes(nextComponent)) {
                setActiveTask(nextComponent);
                if (activeModulId) {
                    fetchTaskData(nextComponent, activeModulId);
                } else {
                    clearTaskProgress();
                }
            } else {
                setActiveTask(null);
            }
        },
        [activeModulId, fetchTaskData, clearTaskProgress]
    );

    const handleTaskSubmit = useCallback(
        async (taskName, taskAnswers = answers, silent = false) => {
            if (!taskName || !TASK_NAMES.includes(taskName)) return;

            if (!activeModulId || !praktikanId) {
                if (!silent) {
                    setSubmissionError("Modul aktif atau data praktikan tidak ditemukan.");
                }
                return;
            }

            const config = TASK_CONFIG[taskName];
            if (!config) return;

            const normalizedAnswers = questions.map((question, index) => ({
                question,
                answer: taskAnswers[index],
            }));

            let multipleChoiceSelections = [];

            if (config.variant === "multiple-choice") {
                multipleChoiceSelections = normalizedAnswers.filter(
                    (entry) => entry.answer !== null && entry.answer !== undefined
                );
            }

            setIsSubmittingTask(true);
            setSubmissionError(null);

            try {
                if (taskName === "Jurnal" && config.fitb) {
                    const fitbPayload = normalizedAnswers
                        .filter((entry) => entry.question.questionType === "fitb")
                        .map((entry) => ({
                            praktikan_id: praktikanId,
                            modul_id: activeModulId,
                            soal_id: entry.question.id,
                            jawaban: serialiseAnswerForSubmission(entry.answer),
                        }));

                    const jurnalPayload = normalizedAnswers
                        .filter((entry) => entry.question.questionType !== "fitb")
                        .map((entry) => ({
                            praktikan_id: praktikanId,
                            modul_id: activeModulId,
                            soal_id: entry.question.id,
                            jawaban: serialiseAnswerForSubmission(entry.answer),
                        }));

                    if (fitbPayload.length) {
                        await api.post(config.fitb.submitEndpoint, fitbPayload);
                    }

                    if (jurnalPayload.length) {
                        await api.post(config.submitEndpoint, jurnalPayload);
                    }
                } else if (config.variant === "multiple-choice") {
                    const payload = {
                        praktikan_id: praktikanId,
                        modul_id: activeModulId,
                        answers: multipleChoiceSelections.map((entry) => ({
                            soal_id: entry.question.id,
                            opsi_id: entry.answer,
                        })),
                    };

                    await api.post(config.submitEndpoint, payload);
                } else {
                    const payload = normalizedAnswers.map((entry) => ({
                        praktikan_id: praktikanId,
                        modul_id: activeModulId,
                        soal_id: entry.question.id,
                        jawaban: serialiseAnswerForSubmission(entry.answer),
                    }));

                    await api.post(config.submitEndpoint, payload);
                }

                const autosaveType = AUTOSAVE_TYPE_MAP[taskName];
                if (autosaveType) {
                    try {
                        await api.delete("/api/autosave", {
                            data: {
                                modul_id: activeModulId,
                                tipe_soal: autosaveType,
                            },
                        });
                    } catch (error) {
                        console.warn(`[Autosave] Failed to clear ${autosaveType} snapshot`, error);
                    }
                }

                setCompletedCategories((prev) => ({ ...prev, [taskName]: true }));
                clearTaskProgress();

                const zeroScorePhase = SCORE_PHASE_BY_TASK[taskName];
                if (!silent && zeroScorePhase && multipleChoiceSelections.length === 0) {
                    setScoreModalState({
                        isOpen: true,
                        phaseType: zeroScorePhase,
                        correctAnswers: 0,
                        totalQuestions: questions.length,
                        percentage: 0,
                    });
                }

                if (!silent) {
                    setActiveComponent("NoPraktikumSection");
                }
            } catch (error) {
                console.error("Failed to submit answers", error);
                const message = error?.response?.data?.message ?? error.message ?? "Terjadi kesalahan saat menyimpan jawaban.";
                setSubmissionError(message);
            } finally {
                setIsSubmittingTask(false);
            }
        },
        [activeModulId, answers, clearTaskProgress, praktikanId, questions, setScoreModalState]
    );

    const handleReviewTask = useCallback(
        (taskKey) => {
            if (!taskKey || !TASK_NAMES.includes(taskKey)) return;
            handleNavigate(taskKey);
        },
        [handleNavigate]
    );

    const previousPhaseRef = useRef();

    useEffect(() => {
        previousPhaseRef.current = undefined;
    }, [activeModulId]);

    useEffect(() => {
        scoreFetchLocksRef.current = new Set();
        setScoreModalState({
            isOpen: false,
            phaseType: null,
            correctAnswers: 0,
            totalQuestions: 0,
            percentage: 0,
            hasError: false,
            isRetrying: false,
        });
    }, [activeModulId]);

    useEffect(() => {
        if (!activeModulId) return;

        const currentPhase = moduleMeta?.current_phase;
        if (currentPhase && ["ta", "tk"].includes(currentPhase)) {
            const key = `${currentPhase}:${activeModulId}`;
            scoreFetchLocksRef.current.delete(key);
        }
    }, [moduleMeta?.current_phase, activeModulId]);

    const ActiveTaskComponent = TASK_COMPONENTS[activeComponent] ?? null;
    const activeTaskConfig = TASK_CONFIG[activeComponent] ?? null;
    const activeCommentType = activeTaskConfig?.commentType ?? null;

    const reminderModuleLabel = useMemo(() => {
        const moduleEntry = moduleMeta?.modul ?? null;

        if (moduleEntry) {
            if (typeof moduleEntry === "string") return moduleEntry;
            if (moduleEntry?.judul) return moduleEntry.judul;
        }

        if (moduleMeta?.modul_name) return moduleMeta.modul_name;

        if (moduleMeta?.modul_id) {
            const resolved = resolveModuleTitle(moduleMeta.modul_id);
            if (resolved) return resolved;
        }

        if (feedbackReminder.modulId) {
            const resolved = resolveModuleTitle(feedbackReminder.modulId);
            if (resolved) return resolved;
            return `Modul #${feedbackReminder.modulId}`;
        }

        return null;
    }, [feedbackReminder.modulId, moduleMeta?.modul, moduleMeta?.modul_id, moduleMeta?.modul_name, resolveModuleTitle]);

    const feedbackModuleLabel = useMemo(() => {
        if (!feedbackContext.modulId) return null;

        const activeModuleId = moduleMeta?.modul_id ? String(moduleMeta.modul_id) : null;
        if (activeModuleId && activeModuleId === String(feedbackContext.modulId)) {
            if (moduleMeta?.modul?.judul) return moduleMeta.modul.judul;
            if (moduleMeta?.modul_name) return moduleMeta.modul_name;
        }

        const resolved = resolveModuleTitle(feedbackContext.modulId);
        if (resolved) return resolved;

        return null;
    }, [feedbackContext.modulId, moduleMeta?.modul, moduleMeta?.modul_id, moduleMeta?.modul_name, resolveModuleTitle]);

    const showFeedbackReminderBanner =
        feedbackReminder.isPending &&
        moduleMeta?.status !== "running" &&
        activeComponent !== "FeedbackPhase";
    const isFeedbackPhaseActive = activeComponent === "FeedbackPhase";

    const buildFeedbackContext = useCallback(
        (options = {}) => {
            const {
                modulId = null,
                assistantId = null,
                fallbackModulToReminder = true,
                fallbackAssistantToReminder = true,
                fallbackToModuleAssistant = true,
            } = options;

            let primaryModulId = modulId ?? activeModulId ?? null;
            if (primaryModulId === null && fallbackModulToReminder) {
                primaryModulId = feedbackReminder.modulId ?? null;
            }

            if (!primaryModulId) return null;

            let resolvedAssistantId = assistantId ?? null;
            if (resolvedAssistantId === null && fallbackAssistantToReminder) {
                resolvedAssistantId = feedbackReminder.asistenId ?? null;
            }
            if (resolvedAssistantId === null && fallbackToModuleAssistant) {
                resolvedAssistantId = moduleMeta?.pj_id ?? null;
            }

            return { modulId: primaryModulId, assistantId: resolvedAssistantId };
        },
        [activeModulId, feedbackReminder.asistenId, feedbackReminder.modulId, moduleMeta?.pj_id]
    );

    const openFeedbackPhase = useCallback((context) => {
        if (!context?.modulId) {
            toast.error("Modul feedback tidak ditemukan.");
            return;
        }

        setFeedbackContext({
            modulId: context.modulId,
            assistantId: context.assistantId ?? null,
        });
        setActiveComponent("FeedbackPhase");
    }, []);

    const scheduleFeedbackPhase = useCallback(
        (context) => {
            if (!context?.modulId) {
                toast.error("Modul feedback tidak ditemukan.");
                return;
            }

            if (scoreAckRequiredRef.current || scoreModalState.isOpen) {
                pendingFeedbackNavigationRef.current = context;
                return;
            }

            pendingFeedbackNavigationRef.current = null;
            openFeedbackPhase(context);
        },
        [openFeedbackPhase, scoreModalState.isOpen]
    );

    const navigateToFeedback = useCallback(
        (options = {}) => {
            const context = buildFeedbackContext(options);
            if (!context) {
                toast.error("Modul feedback tidak ditemukan.");
                return;
            }
            scheduleFeedbackPhase(context);
        },
        [buildFeedbackContext, scheduleFeedbackPhase]
    );

    const handleFeedbackSubmitted = useCallback(() => {
        setFeedbackReminder({ isPending: false, modulId: null, asistenId: null });
        setFeedbackContext({ modulId: null, assistantId: null });
        setActiveComponent("NoPraktikumSection");
    }, []);

    const handleFeedbackClose = useCallback(() => {
        setFeedbackContext({ modulId: null, assistantId: null });
        setActiveComponent("NoPraktikumSection");
    }, []);

    const closeScoreModal = useCallback(() => {
        setScoreModalState((previous) => ({ ...previous, isOpen: false }));
        scoreAckRequiredRef.current = false;

        if (pendingFeedbackNavigationRef.current) {
            const context = pendingFeedbackNavigationRef.current;
            pendingFeedbackNavigationRef.current = null;
            openFeedbackPhase(context);
        }
    }, [openFeedbackPhase]);

    const retryFetchScore = useCallback(() => {
        const phase = scoreModalState.phaseType;
        if (phase && ["ta", "tk"].includes(phase)) {
            fetchPhaseScore(phase);
        }
    }, [scoreModalState.phaseType, fetchPhaseScore]);

    const handlePhaseChange = useCallback(
        (currentPhase) => {
            if (currentPhase === "feedback") {
                const context =
                    buildFeedbackContext({
                        modulId: moduleMeta?.modul_id ?? activeModulId ?? feedbackReminder.modulId ?? null,
                        assistantId: feedbackReminder.asistenId ?? moduleMeta?.pj_id ?? null,
                        fallbackModulToReminder: true,
                        fallbackAssistantToReminder: true,
                        fallbackToModuleAssistant: true,
                    }) ?? null;

                if (!context) {
                    toast.error("Modul feedback tidak ditemukan.");
                    return;
                }

                scheduleFeedbackPhase(context);
                return;
            }

            const targetComponent = PHASE_TO_COMPONENT[currentPhase];
            if (targetComponent) {
                handleNavigate(targetComponent);
            }
        },
        [
            activeModulId,
            buildFeedbackContext,
            handleNavigate,
            moduleMeta?.modul_id,
            moduleMeta?.pj_id,
            scheduleFeedbackPhase,
        ]
    );

    // Combined phase change handler with auto-submit
    useEffect(() => {
        if (!moduleMeta?.current_phase || !activeModulId) {
            previousPhaseRef.current = undefined;
            return;
        }

        const newPhase = moduleMeta.current_phase;
        const previousPhase = previousPhaseRef.current;

        if (previousPhase === newPhase) return;

        previousPhaseRef.current = newPhase;

        const shouldAutoSubmit =
            Boolean(previousPhase) &&
            previousPhase !== newPhase &&
            activeComponent !== "NoPraktikumSection" &&
            answers.length > 0 &&
            !isSubmittingTask &&
            Boolean(activeTask);

        const shouldShowScore = ["ta", "tk"].includes(previousPhase ?? "");

        if (shouldAutoSubmit) {
            (async () => {
                try {
                    await handleTaskSubmit(activeTask, answers, true);
                    if (shouldShowScore) {
                        await fetchPhaseScore(previousPhase);
                    }
                } catch (error) {
                    console.error("Auto-submit failed:", error);
                } finally {
                    handlePhaseChange(newPhase);
                }
            })();

            return;
        }

        if (shouldShowScore) {
            fetchPhaseScore(previousPhase);
        }

        handlePhaseChange(newPhase);
    }, [moduleMeta?.current_phase, activeModulId, answers, activeComponent, activeTask, isSubmittingTask, handleTaskSubmit, handlePhaseChange, fetchPhaseScore]);

    // Polling for presence/status (replaces WebSocket Echo presence channel)
    useEffect(() => {
        if (!kelasId || !praktikanId) return;

        const interval = setInterval(async () => {
            try {
                await api.get("/api/praktikum/check-praktikum");
            } catch {
                // silently ignore polling errors
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [kelasId, praktikanId]);

    return (
        <>
            <PraktikanAuthenticated
                user={praktikanData}
                praktikan={praktikanData}
                customWidth="w-full"
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard
                    </h2>
                }
            >
                <div className="relative items-center flex flex-col ">
                    <div className="w-full transition-all duration-300 ">
                        {showFeedbackReminderBanner && (
                            <div className="mb-4 rounded-depth-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-depth-sm">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-semibold">Feedback praktikum belum terkirim</p>
                                        <p className="text-xs text-amber-800/80">
                                            Segera lengkapi feedback untuk {reminderModuleLabel ?? "modul terkait"} sebelum meninggalkan halaman.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigateToFeedback()}
                                        className="inline-flex items-center justify-center rounded-depth-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                    >
                                        Buka Form Feedback
                                    </button>
                                </div>
                            </div>
                        )}
                        <Suspense fallback={<div className="mt-6 text-sm text-depth-secondary">Memuat status praktikum...</div>}>
                            <NoPraktikumSection
                                isVisible={activeComponent === "NoPraktikumSection"}
                                onNavigate={handleNavigate}
                                completedCategories={completedCategories}
                                setCompletedCategories={setCompletedCategories}
                                onReviewTask={handleReviewTask}
                                kelasId={kelasId}
                                dk={moduleMeta?.dk}
                                onPraktikumStateChange={handlePraktikumStateChange}
                                moduleMeta={moduleMeta}
                            />
                        </Suspense>
                        {activeComponent !== "NoPraktikumSection" && (
                            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                                {ActiveTaskComponent && (
                                    <button
                                        type="button"
                                        onClick={handleSaveProgress}
                                        disabled={isSavingProgress}
                                        className={`inline-flex items-center gap-1.5 rounded-depth-md border border-depth px-3 py-1.5 text-xs font-semibold shadow-depth-sm transition-all ${isSavingProgress
                                            ? "cursor-not-allowed opacity-50"
                                            : "bg-depth-card text-depth-primary hover:bg-depth-interactive hover:shadow-depth-md"
                                            }`}
                                        title="Simpan progress jawaban secara manual"
                                    >
                                        <svg className={`h-4 w-4 ${isSavingProgress ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {isSavingProgress ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            )}
                                        </svg>
                                        {isSavingProgress ? "Menyimpan..." : "Save Progress"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRefreshStatus}
                                    disabled={isRefreshingStatus}
                                    className={`inline-flex items-center gap-1.5 rounded-depth-md border border-depth px-3 py-1.5 text-xs font-semibold shadow-depth-sm transition-all ${isRefreshingStatus
                                        ? "cursor-not-allowed opacity-50"
                                        : "bg-depth-card text-depth-primary hover:bg-depth-interactive hover:shadow-depth-md"
                                        }`}
                                    title="Refresh status praktikum secara manual"
                                >
                                    <svg className={`h-4 w-4 ${isRefreshingStatus ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {isRefreshingStatus ? "Memuat..." : "Refresh Status"}
                                </button>
                            </div>
                        )}
                        {activeComponent !== "NoPraktikumSection" && (
                            <Suspense fallback={<div className="mt-6 text-sm text-depth-secondary">Memuat konten...</div>}>
                                {ActiveTaskComponent ? (
                                    <ActiveTaskComponent
                                        isLoading={isLoadingTask}
                                        errorMessage={taskError}
                                        setAnswers={setAnswers}
                                        answers={answers}
                                        questions={questions}
                                        setQuestionsCount={setQuestionsCount}
                                        onSubmitTask={handleTaskSubmit}
                                        tipeSoal={activeCommentType}
                                        praktikanId={praktikanId}
                                        isCommentEnabled={isTotClass && Boolean(activeCommentType)}
                                    />
                                ) : isFeedbackPhaseActive ? (
                                    <FeedbackPhase
                                        praktikan={praktikanData}
                                        modulId={feedbackContext.modulId ?? activeModulId}
                                        assistantId={feedbackContext.assistantId}
                                        moduleLabel={feedbackModuleLabel ?? reminderModuleLabel}
                                        onClose={handleFeedbackClose}
                                        onSubmitted={handleFeedbackSubmitted}
                                    />
                                ) : null}
                            </Suspense>
                        )}
                    </div>
                </div>
            </PraktikanAuthenticated>
            <Suspense fallback={null}>
                <PraktikanUtilities />
            </Suspense>
            <Suspense fallback={null}>
                <ScoreDisplayModal
                    isOpen={scoreModalState.isOpen}
                    onClose={closeScoreModal}
                    phaseType={scoreModalState.phaseType}
                    correctAnswers={scoreModalState.correctAnswers}
                    totalQuestions={scoreModalState.totalQuestions}
                    percentage={scoreModalState.percentage}
                    isTotClass={isTotClass}
                    hasError={scoreModalState.hasError}
                    onRetry={retryFetchScore}
                    isRetrying={scoreModalState.isRetrying}
                />
            </Suspense>
        </>
    );
}
