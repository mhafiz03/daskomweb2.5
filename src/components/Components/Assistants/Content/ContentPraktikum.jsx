import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { useKelasQuery } from "@/hooks/useKelasQuery";
import { useAsistensQuery } from "@/hooks/useAsistensQuery";
import { useJadwalJagaQuery } from "@/hooks/useJadwalJagaQuery";
import { PRAKTIKUM_HISTORY_QUERY_KEY } from "@/hooks/usePraktikumHistoryQuery";
import TablePraktikanProgress from "@/Components/Assistants/Tables/TablePraktikanProgress";

const PHASE_SEQUENCE = [
    { key: "preparation", label: "Preparation" },
    { key: "ta", label: "TA" },
    { key: "fitb_jurnal", label: "Jurnal" },
    { key: "mandiri", label: "Mandiri" },
    { key: "tk", label: "TK" },
    { key: "feedback", label: "Feedback" },
];

const STATUS_LABELS = {
    running: "Running",
    paused: "Paused",
    completed: "Finished",
    exited: "Stopped",
    idle: "Not Yet Started",
};

const DK_OPTIONS = ["DK1", "DK2"];

const formatDuration = (totalSeconds = 0) => {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (value) => value.toString().padStart(2, "0");

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }

    return `${pad(minutes)}:${pad(secs)}`;
};

const formatTimestamp = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const getErrorMessage = (error) => {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.message) {
        return error.message;
    }

    return "Terjadi kesalahan tak terduga.";
};

const getPhaseIndex = (phaseKey) =>
    PHASE_SEQUENCE.findIndex((phase) => phase.key === phaseKey);

const PRAKTIKUM_PROGRESS_QUERY_KEY = "praktikum-progress";

export default function ContentPraktikum() {
    const [selectedModul, setSelectedModul] = useState("");
    const [selectedKelas, setSelectedKelas] = useState("");
    const [selectedDk, setSelectedDk] = useState(DK_OPTIONS[0]);
    const [session, setSession] = useState(null);
    const [displaySeconds, setDisplaySeconds] = useState(0);
    const [phaseDisplaySeconds, setPhaseDisplaySeconds] = useState(0);
    const [reportText, setReportText] = useState("");
    const [pendingAction, setPendingAction] = useState(null);
    const [onlinePraktikan, setOnlinePraktikan] = useState(new Set());
    const [isAsistenExpanded, setIsAsistenExpanded] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [isProgressPolling, setIsProgressPolling] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isEchoConnected, setIsEchoConnected] = useState(false);
    const sessionIdRef = useRef(null);
    const lastServerReportRef = useRef("");

    const queryClient = useQueryClient();

    const {
        data: kelas = [],
        isLoading: kelasLoading,
        isError: kelasError,
    } = useKelasQuery();

    const {
        data: moduls = [],
        isLoading: modulLoading,
        isError: modulError,
    } = useModulesQuery();

    const {
        data: asistens = [],
    } = useAsistensQuery({
        enabled: true,
    });

    const {
        data: praktikumByClass = [],
        isLoading: praktikumLoading,
    } = useQuery({
        queryKey: ["praktikum", selectedKelas],
        queryFn: async () => {
            if (!selectedKelas) {
                return [];
            }

            const { data } = await api.get(`/api-v1/praktikum/${selectedKelas}`);

            if (Array.isArray(data?.data)) {
                return data.data;
            }

            if (Array.isArray(data?.praktikum)) {
                return data.praktikum;
            }

            return [];
        },
        enabled: Boolean(selectedKelas),
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const selectedPraktikum = useMemo(() => {
        if (!selectedModul || !selectedDk) {
            return null;
        }

        const modulId = Number(selectedModul);
        return (
            praktikumByClass.find(
                (item) => Number(item?.modul_id) === modulId && (item?.dk ?? DK_OPTIONS[0]) === selectedDk,
            ) ?? null
        );
    }, [praktikumByClass, selectedModul, selectedDk]);

    const asistenMap = useMemo(() => {
        const map = new Map();
        asistens.forEach((item) => {
            if (item?.id != null) {
                map.set(Number(item.id), item);
            }
        });
        return map;
    }, [asistens]);

    const selectedKelasData = useMemo(() => {
        if (!selectedKelas) {
            return null;
        }

        return kelas.find((item) => String(item.id) === String(selectedKelas)) ?? null;
    }, [kelas, selectedKelas]);

    const selectedModulData = useMemo(() => {
        if (!selectedModul) {
            return null;
        }

        return moduls.find((item) => String(item.idM) === String(selectedModul)) ?? null;
    }, [moduls, selectedModul]);

    const { data: jadwalData = [], isLoading: jadwalLoading } = useJadwalJagaQuery(
        selectedKelas ? { kelas_id: selectedKelas } : {},
        {
            enabled: Boolean(selectedKelas),
        }
    );

    const jadwalForSelectedKelas = useMemo(() => {
        if (!selectedKelas) {
            return null;
        }

        const kelasId = Number(selectedKelas);
        return (
            jadwalData.find((item) => Number(item?.id ?? item?.kelas_id ?? item?.kelasId) === kelasId) ??
            jadwalData.find((item) => (item?.kelas ?? "").toString() === selectedKelasData?.kelas) ??
            null
        );
    }, [jadwalData, selectedKelas, selectedKelasData]);

    const asistenJagaList = useMemo(() => {
        if (!jadwalForSelectedKelas) {
            return [];
        }

        if (Array.isArray(jadwalForSelectedKelas?.jadwal_jagas)) {
            return jadwalForSelectedKelas.jadwal_jagas;
        }

        if (Array.isArray(jadwalForSelectedKelas?.asistens)) {
            return jadwalForSelectedKelas.asistens;
        }

        return [];
    }, [jadwalForSelectedKelas]);

    const praktikanList = useMemo(() => {
        if (Array.isArray(selectedKelasData?.praktikans)) {
            return selectedKelasData.praktikans;
        }

        if (Array.isArray(jadwalForSelectedKelas?.praktikans)) {
            return jadwalForSelectedKelas.praktikans;
        }

        return [];
    }, [selectedKelasData, jadwalForSelectedKelas]);

    // Get all running praktikum sessions across all classes
    const {
        data: allPraktikum = [],
    } = useQuery({
        queryKey: ["praktikum-all"],
        queryFn: async () => {
            const { data } = await api.get('/api-v1/praktikum');
            return Array.isArray(data?.data) ? data.data : [];
        },
        refetchInterval: isEchoConnected ? false : 5000, // Only poll as fallback when WebSocket is not connected
    });

    const runningPraktikum = useMemo(() => {
        return allPraktikum.filter(p => p.status === 'running' || p.status === 'paused');
    }, [allPraktikum]);

    const selectedPraktikumId = selectedPraktikum?.id ?? session?.id ?? null;
    const effectiveSession = session ?? selectedPraktikum ?? null;
    const hasSelection = Boolean(selectedKelas) && Boolean(selectedModul) && Boolean(selectedDk);

    const {
        data: fetchedProgress,
        isLoading: progressLoading,
        isFetching: progressFetching,
        refetch: refetchProgress,
    } = useQuery({
        queryKey: [PRAKTIKUM_PROGRESS_QUERY_KEY, selectedPraktikumId],
        queryFn: async () => {
            if (!selectedPraktikumId) {
                return undefined;
            }

            const { data } = await api.get(`/api-v1/praktikum/${selectedPraktikumId}/progress`);
            if (data?.data) {
                return data.data;
            }

            if (data?.progress) {
                return data.progress;
            }

            return data ?? null;
        },
        enabled: Boolean(selectedPraktikumId),
        refetchInterval: isProgressPolling && !isEchoConnected ? 10000 : false, // Only poll as fallback when WebSocket is not connected
        staleTime: 5000,
    });

    useEffect(() => {
        const status = effectiveSession?.status ?? null;
        setIsProgressPolling(status === "running" || status === "paused");
    }, [effectiveSession?.status]);

    useEffect(() => {
        if (typeof fetchedProgress === "undefined") {
            return;
        }

        setProgressData(fetchedProgress);
    }, [fetchedProgress]);

    useEffect(() => {
        if (!selectedPraktikumId) {
            setProgressData(null);
            return;
        }

        if (refetchProgress) {
            refetchProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPraktikumId]); // Only re-run when selectedPraktikumId changes (refetchProgress is not stable)

    const computeElapsedSeconds = useCallback((praktikum) => {
        if (!praktikum?.started_at) {
            return 0;
        }

        const startedAt = new Date(praktikum.started_at);
        if (Number.isNaN(startedAt.getTime())) {
            return 0;
        }

        const status = praktikum.status;

        if (status === "running") {
            return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
        }

        if (praktikum.ended_at) {
            const endedAt = new Date(praktikum.ended_at);
            if (!Number.isNaN(endedAt.getTime())) {
                return Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
            }
        }

        return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, []);

    const computePhaseElapsedSeconds = useCallback(
        (praktikum) => {
            if (!praktikum) {
                return 0;
            }

            const baseSeconds = Math.max(0, Number(praktikum?.phase_elapsed_seconds ?? 0));
            const phaseStartedAt = praktikum?.phase_started_at ? new Date(praktikum.phase_started_at) : null;

            if (praktikum.status === "running" && phaseStartedAt && !Number.isNaN(phaseStartedAt.getTime())) {
                const delta = Math.max(0, Math.floor((Date.now() - phaseStartedAt.getTime()) / 1000));
                return baseSeconds + delta;
            }

            if (baseSeconds > 0) {
                return baseSeconds;
            }

            return computeElapsedSeconds(praktikum);
        },
        [computeElapsedSeconds],
    );

    useEffect(() => {
        if (!selectedPraktikum) {
            setSession(null);
            setDisplaySeconds(0);
            return;
        }

        setSession((prev) => {
            if (!prev || prev.id !== selectedPraktikum.id) {
                return { ...selectedPraktikum };
            }

            if (selectedPraktikum.updated_at && selectedPraktikum.updated_at !== prev.updated_at) {
                return { ...prev, ...selectedPraktikum };
            }

            return prev;
        });
    }, [selectedPraktikum]);

    useEffect(() => {
        setDisplaySeconds(computeElapsedSeconds(session));
        setPhaseDisplaySeconds(computePhaseElapsedSeconds(session));
    }, [session, computeElapsedSeconds, computePhaseElapsedSeconds]);

    useEffect(() => {
        const currentId = effectiveSession?.id ?? null;
        const serverNotes = typeof effectiveSession?.report_notes === "string" ? effectiveSession.report_notes : "";

        if (sessionIdRef.current !== currentId) {
            sessionIdRef.current = currentId;
            lastServerReportRef.current = serverNotes;
            setReportText(serverNotes);
            return;
        }

        if (serverNotes && serverNotes !== lastServerReportRef.current) {
            lastServerReportRef.current = serverNotes;
            setReportText(serverNotes);
        }

        if (!effectiveSession) {
            lastServerReportRef.current = "";
            setReportText("");
        }
    }, [effectiveSession]);

    useEffect(() => {
        if (!session || session.status !== "running") {
            return undefined;
        }

        const intervalId = setInterval(() => {
            setDisplaySeconds(computeElapsedSeconds(session));
            setPhaseDisplaySeconds(computePhaseElapsedSeconds(session));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [session, computeElapsedSeconds, computePhaseElapsedSeconds]);

    useEffect(() => {
        if (!window.Echo || !selectedPraktikumId || !selectedDk) {
            setIsEchoConnected(false);
            return undefined;
        }

        setIsEchoConnected(true);

        const channelName = `praktikum.${selectedPraktikumId}.dk.${selectedDk}`;
        const channel = window.Echo.channel(channelName);

        const statusListener = (payload) => {
            const updated = payload?.praktikum;
            if (!updated) {
                return;
            }

            let nextSession = null;

            setSession((prev) => {
                if (prev && prev.id === updated.id) {
                    nextSession = { ...prev, ...updated };
                    return nextSession;
                }

                if (!prev) {
                    nextSession = { ...updated };
                    return nextSession;
                }

                nextSession = prev;
                return prev;
            });

            if (selectedKelas) {
                queryClient.setQueryData(["praktikum", selectedKelas], (prevData) => {
                    if (!Array.isArray(prevData)) {
                        return prevData;
                    }

                    return prevData.map((item) =>
                        item?.id === updated.id ? { ...item, ...updated } : item
                    );
                });
            }

            if (nextSession) {
                setDisplaySeconds(computeElapsedSeconds(nextSession));
            } else {
                setDisplaySeconds(computeElapsedSeconds(updated));
            }

            if (refetchProgress) {
                refetchProgress();
            }
        };

        const progressListener = (payload) => {
            const praktikumId = Number(payload?.praktikum_id ?? payload?.praktikumId ?? 0);
            if (praktikumId && selectedPraktikumId && praktikumId !== Number(selectedPraktikumId)) {
                return;
            }

            const progressPayload = payload?.progress ?? null;
            if (!progressPayload) {
                return;
            }

            setProgressData(progressPayload);
            queryClient.setQueryData([PRAKTIKUM_PROGRESS_QUERY_KEY, selectedPraktikumId], progressPayload);
        };

        channel.listen(".PraktikumStatusUpdated", statusListener);
        channel.listen(".PraktikumProgressUpdated", progressListener);

        return () => {
            setIsEchoConnected(false);
            window.Echo.leave(channelName);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPraktikumId, selectedDk, selectedKelas, computeElapsedSeconds, queryClient]);

    // Presence channel for online praktikan tracking
    useEffect(() => {
        if (!window.Echo || !selectedKelas) {
            setOnlinePraktikan(new Set());
            return undefined;
        }

        const presenceChannelName = `presence-kelas.${selectedKelas}`;
        const presenceChannel = window.Echo.join(presenceChannelName);

        presenceChannel
            .here((users) => {
                // Initialize with users already in the channel
                const praktikanIds = new Set(
                    users
                        .filter(user => user.type === 'praktikan')
                        .map(user => user.id)
                );
                setOnlinePraktikan(praktikanIds);
            })
            .joining((user) => {
                // Someone joined the channel
                if (user.type === 'praktikan') {
                    setOnlinePraktikan(prev => new Set([...prev, user.id]));
                }
            })
            .leaving((user) => {
                // Someone left the channel
                if (user.type === 'praktikan') {
                    setOnlinePraktikan(prev => {
                        const next = new Set(prev);
                        next.delete(user.id);
                        return next;
                    });
                }
            })
            .error((error) => {
                console.error('Presence channel error:', error);
            });

        return () => {
            window.Echo.leave(presenceChannelName);
            setOnlinePraktikan(new Set());
        };
    }, [selectedKelas]);

    const createPraktikumMutation = useMutation({
        mutationFn: async () => {
            if (!selectedKelas || !selectedModul) {
                throw new Error("Pilih kelas dan modul sebelum memulai praktikum.");
            }

            if (!selectedDk) {
                throw new Error("Pilih DK sebelum memulai praktikum.");
            }

            const { data } = await api.post("/api-v1/praktikum", {
                kelas_id: Number(selectedKelas),
                modul_id: Number(selectedModul),
                dk: selectedDk,
            });

            return data?.data ?? data?.praktikum ?? data;
        },
        onSuccess: (praktikum) => {
            if (!praktikum) {
                toast.error("Gagal membuat data praktikum baru.");
                return;
            }

            setSession((prev) => {
                if (prev && prev.id === praktikum.id) {
                    return { ...prev, ...praktikum };
                }

                return { ...praktikum };
            });

            if (selectedKelas) {
                queryClient.setQueryData(["praktikum", selectedKelas], (prevData) => {
                    if (!Array.isArray(prevData)) {
                        return [praktikum];
                    }

                    const exists = prevData.some((item) => item?.id === praktikum.id);
                    if (exists) {
                        return prevData.map((item) =>
                            item?.id === praktikum.id ? { ...item, ...praktikum } : item
                        );
                    }

                    return [...prevData, praktikum];
                });
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const praktikumMutation = useMutation({
        mutationFn: async ({ action, phase, report_notes, praktikumId }) => {
            const targetId = praktikumId ?? selectedPraktikumId;

            if (!targetId) {
                throw new Error("Data praktikum tidak ditemukan.");
            }

            const payload = { action };

            if (phase) {
                payload.phase = phase;
            }

            if (typeof report_notes === "string") {
                payload.report_notes = report_notes;
            }

            const { data } = await api.put(`/api-v1/praktikum/${targetId}`, payload);
            return data;
        },
        onMutate: async ({ action }) => {
            setPendingAction(action);
            return { action };
        },
        onSuccess: (response, variables) => {
            const updated = response?.data;

            if (updated) {
                setSession((prev) => {
                    if (prev && prev.id === updated.id) {
                        return { ...prev, ...updated };
                    }

                    return { ...updated };
                });

                if (selectedKelas) {
                    queryClient.setQueryData(["praktikum", selectedKelas], (prevData) => {
                        if (!Array.isArray(prevData)) {
                            return prevData;
                        }

                        const exists = prevData.some((item) => item?.id === updated.id);
                        if (!exists) {
                            return prevData;
                        }

                        return prevData.map((item) =>
                            item?.id === updated.id ? { ...item, ...updated } : item
                        );
                    });
                }
            }

            if (variables?.action === "report") {
                setReportText(updated?.report_notes ?? "");
            }

            toast.success(response?.message ?? "Status praktikum diperbarui.");
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
        onSettled: (_, __, ___, context) => {
            setPendingAction(null);

            if (selectedKelas) {
                queryClient.invalidateQueries(["praktikum", selectedKelas]);
            }

            if (context?.action === "report") {
                queryClient.invalidateQueries({ queryKey: PRAKTIKUM_HISTORY_QUERY_KEY });
            }
        },
    });

    const handleAction = useCallback(
        (action, options = {}) => {
            if (!hasSelection) {
                toast.error("Pilih kelas dan modul sebelum mengubah status praktikum.");
                return;
            }

            if (!selectedDk) {
                toast.error("Pilih DK terlebih dahulu.");
                return;
            }

            const payload = { action, ...options };
            if (action === "start" && !payload.phase) {
                payload.phase = PHASE_SEQUENCE[0]?.key ?? "ta";
            }

            const praktikumIdentifier = payload.praktikumId ?? selectedPraktikumId ?? null;

            if (!selectedPraktikumId && action === "start") {
                createPraktikumMutation.mutate(undefined, {
                    onSuccess: (praktikum) => {
                        if (!praktikum?.id) {
                            toast.error("Gagal menentukan data praktikum.");
                            return;
                        }

                        praktikumMutation.mutate({
                            ...payload,
                            praktikumId: praktikum.id,
                        });
                    },
                });
                return;
            }

            if (!selectedPraktikumId && !payload.praktikumId) {
                toast.error("Data praktikum untuk kombinasi ini tidak ditemukan.");
                return;
            }

            praktikumMutation.mutate(payload);
        },
        [
            hasSelection,
            selectedPraktikumId,
            effectiveSession,
            createPraktikumMutation,
            praktikumMutation,
            selectedDk,
        ]
    );

    const handleSubmitReport = useCallback(() => {
        const trimmedNotes = reportText.trim();

        if (effectiveSession?.current_phase !== "feedback") {
            toast.error("Laporan hanya dapat dikirim pada tahap Feedback.");
            return;
        }

        if (trimmedNotes.length < 3) {
            toast.error("Isi laporan minimal 3 karakter.");
            return;
        }

        handleAction("report", { report_notes: trimmedNotes });
    }, [effectiveSession?.current_phase, reportText, handleAction]);

    const handleSwitchToRunning = useCallback((praktikum) => {
        if (!praktikum) {
            return;
        }

        setSelectedKelas(String(praktikum.kelas_id));
        setSelectedModul(String(praktikum.modul_id));
        setSelectedDk(praktikum.dk ?? DK_OPTIONS[0]);

        // Scroll to top to see the selected praktikum
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const isRunning = effectiveSession?.status === "running";
    const isPaused = effectiveSession?.status === "paused";
    const isCompleted = effectiveSession?.status === "completed";
    const isFeedbackPhase = effectiveSession?.current_phase === "feedback";
    const isTerminal = effectiveSession
        ? ["completed", "exited"].includes(effectiveSession.status)
        : false;
    const hasSession = Boolean(effectiveSession);
    const reportSubmitted = Boolean(
        typeof effectiveSession?.report_notes === "string" &&
        effectiveSession.report_notes.trim().length > 0
    );
    const showReportForm = isFeedbackPhase && !reportSubmitted;
    const showReportPreview = reportSubmitted;
    const showControls = true; // Always show controls
    const isSubmittingReport = pendingAction === "report" && praktikumMutation.isPending;

    const startLabel = isTerminal && !isCompleted ? "Restart" : "Start";
    const statusLabel =
        STATUS_LABELS[effectiveSession?.status ?? "idle"] ?? STATUS_LABELS.idle;
    const currentPhaseIndex = useMemo(() => {
        if (!effectiveSession?.current_phase) {
            return 0;
        }

        const index = getPhaseIndex(effectiveSession.current_phase);
        if (index === -1) {
            return 0;
        }

        if (effectiveSession.status === "completed") {
            return PHASE_SEQUENCE.length - 1;
        }

        return index;
    }, [effectiveSession]);

    const currentPhaseLabel = useMemo(() => {
        if (!effectiveSession?.current_phase) {
            return null;
        }

        return (
            PHASE_SEQUENCE.find((phase) => phase.key === effectiveSession.current_phase)?.label ??
            effectiveSession.current_phase
        );
    }, [effectiveSession?.current_phase]);

    const baseStartDisabled =
        !hasSelection || praktikumMutation.isPending || createPraktikumMutation.isPending;
    const pauseDisabled =
        !hasSession || !isRunning || praktikumMutation.isPending;
    const resumeDisabled =
        !hasSession || !isPaused || praktikumMutation.isPending;
    const previousDisabled =
        !hasSession ||
        praktikumMutation.isPending ||
        effectiveSession?.status === "idle" ||
        isTerminal ||
        currentPhaseIndex <= 0;
    const nextDisabled =
        !hasSession ||
        praktikumMutation.isPending ||
        effectiveSession?.status === "idle" ||
        isTerminal ||
        currentPhaseIndex >= PHASE_SEQUENCE.length - 1; // Disable at last phase
    const exitDisabled =
        !hasSession ||
        !(isRunning || isPaused) ||
        praktikumMutation.isPending;

    const restartLocked = isCompleted && reportSubmitted;
    const startDisabled = baseStartDisabled || restartLocked;

    const reportSubmitDisabled =
        !isFeedbackPhase ||
        reportSubmitted ||
        reportText.trim().length < 3 ||
        praktikumMutation.isPending ||
        createPraktikumMutation.isPending;
    const reportSubmittedAt = formatTimestamp(effectiveSession?.report_submitted_at);
    const startedAtDisplay = formatTimestamp(effectiveSession?.started_at);
    const endedAtDisplay = formatTimestamp(effectiveSession?.ended_at);
    const pjData = effectiveSession?.pj ?? null;
    const reportOwnerDisplay = pjData
        ? [pjData.nama, pjData.kode].filter(Boolean).join(" • ") || `Asisten #${pjData.id}`
        : effectiveSession?.pj_id
            ? `Asisten #${effectiveSession.pj_id}`
            : "-";

    const toolbarConfig = useMemo(
        () => ({
            title: "Start Praktikum",
        }),
        [],
    );

    useAssistantToolbar(toolbarConfig);

    const handleConfirmedAction = useCallback(() => {
        if (!confirmAction) {
            return;
        }

        const { action, options } = confirmAction;
        setConfirmAction(null);
        handleAction(action, options);
    }, [confirmAction, handleAction]);

    useEffect(() => {
        setSelectedDk(DK_OPTIONS[0]);
    }, [selectedKelas]);
    return (
        <section className="space-y-6 text-depth-primary">
            {confirmAction && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="mx-4 w-full max-w-sm rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-full ${confirmAction.variant === "danger"
                                        ? "bg-red-100 dark:bg-red-900/30"
                                        : "bg-amber-100 dark:bg-amber-900/30"
                                    }`}
                            >
                                {confirmAction.icon}
                            </div>
                            <h3 className="text-lg font-bold text-depth-primary">{confirmAction.title}</h3>
                            <p className="text-sm text-depth-secondary">{confirmAction.message}</p>
                            <div className="mt-2 flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 rounded-depth-md border border-depth bg-depth-card px-4 py-2.5 text-sm font-semibold text-depth-primary shadow-depth-sm transition-all hover:-translate-y-0.5 hover:shadow-depth-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmedAction}
                                    className="flex-1 rounded-depth-md px-4 py-2.5 text-sm font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
                                    style={{ background: confirmAction.buttonGradient }}
                                >
                                    {confirmAction.confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                <div className="w-full overflow-y-auto p-6 md:h-96 lg:h-[48rem]">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="kelas_id"
                                className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                            >
                                Kelas
                            </label>
                            <select
                                className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                id="kelas_id"
                                value={selectedKelas}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedKelas(value);
                                }}
                            >
                                <option value="">- Pilih Kelas -</option>
                                {kelasLoading && <option disabled>Memuat kelas...</option>}
                                {kelasError && <option disabled>Gagal memuat kelas</option>}
                                {!kelasLoading && !kelasError && kelas.length === 0 && (
                                    <option disabled>Data kelas kosong</option>
                                )}
                                {!kelasLoading && !kelasError &&
                                    kelas.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.kelas}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label
                                htmlFor="modul_id"
                                className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                            >
                                Modul
                            </label>
                            <select
                                className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                id="modul_id"
                                value={selectedModul}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedModul(value);
                                }}
                            >
                                <option value="">- Pilih Modul -</option>
                                {modulLoading && <option disabled>Memuat modul...</option>}
                                {modulError && <option disabled>Gagal memuat modul</option>}
                                {!modulLoading && !modulError && moduls.length === 0 && (
                                    <option disabled>Data modul kosong</option>
                                )}
                                {!modulLoading && !modulError &&
                                    moduls.map((k) => (
                                        <option key={k.idM} value={k.idM}>
                                            {k.judul}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="w-20 max-w-xs space-y-2">
                            <label
                                htmlFor="dk"
                                className="block text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                            >
                                DK
                            </label>
                            <select
                                className="w-20 rounded-depth-md border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                id="dk"
                                value={selectedDk}
                                onChange={(event) => setSelectedDk(event.target.value)}
                            >
                                {DK_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Running Praktikum Section */}
                    {runningPraktikum.length > 0 && (
                        <div className="mt-4 rounded-depth-md border border-amber-400/70 bg-amber-50/90 p-4 shadow-depth-sm transition dark:border-amber-300/50 dark:bg-[#2a1c06]">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                                <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-300"></span>
                                </span>
                                Praktikum Sedang Berjalan ({runningPraktikum.length})
                            </h3>
                            <div className="space-y-2">
                                {runningPraktikum.map((p) => {
                                    const kelasName = kelas.find((k) => k.id === p.kelas_id)?.kelas ?? `Kelas #${p.kelas_id}`;
                                    const modulName = moduls.find((m) => m.idM === p.modul_id)?.judul ?? `Modul #${p.modul_id}`;
                                    const statusLabel = STATUS_LABELS[p.status] ?? p.status;
                                    const phaseLabel =
                                        PHASE_SEQUENCE.find((phase) => phase.key === p.current_phase)?.label ?? p.current_phase;
                                    const dkLabel = p.dk ?? DK_OPTIONS[0];
                                    const isSelectedRunning =
                                        String(p.kelas_id) === String(selectedKelas) &&
                                        String(p.modul_id) === String(selectedModul) &&
                                        dkLabel === selectedDk;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex items-center justify-between rounded-depth-md border bg-white/90 px-3 py-2 text-sm shadow-depth-sm transition-colors hover:bg-amber-100/80 dark:bg-[#3a280c] dark:hover:bg-[#4a3310] ${isSelectedRunning ? "border-[var(--depth-color-primary)] dark:border-[var(--depth-color-primary)]" : "border-amber-200 dark:border-amber-200/40"}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-depth-primary dark:text-amber-100">{kelasName}</span>
                                                    <span className="text-amber-400">•</span>
                                                    <span className="text-depth-secondary dark:text-amber-200">{modulName}</span>
                                                    <span className="rounded-depth-full border border-amber-200/80 bg-white px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-depth-secondary dark:border-amber-200/30 dark:bg-[#2f240c] dark:text-amber-200">
                                                        {dkLabel}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-depth-secondary dark:text-amber-200/80">
                                                    <span className="flex items-center gap-1">
                                                        <span
                                                            className={`rounded-depth-full px-2 py-0.5 text-xs font-semibold text-white ${p.status === "running" ? "bg-emerald-500" : "bg-amber-500"
                                                                }`}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </span>
                                                    <span>Tahap: {phaseLabel}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSwitchToRunning(p)}
                                                className="ml-3 rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="h-4 w-4"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex flex-col gap-6">
                        {/* Main Info Card */}
                        <div className="glass-surface flex flex-1 flex-col rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-full text-center">
                                    <div className="mt-2 text-5xl font-bold text-depth-primary">
                                        {formatDuration(phaseDisplaySeconds)}
                                    </div>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                        Tahap saat ini{currentPhaseLabel ? `: ${currentPhaseLabel}` : ""} • Total{" "}
                                        {formatDuration(displaySeconds)}
                                    </p>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                    {PHASE_SEQUENCE.map((phase, index) => {
                                        const isActiveStage =
                                            effectiveSession &&
                                            effectiveSession.status !== "idle" &&
                                            !isTerminal &&
                                            index === currentPhaseIndex;

                                        const isCompletedStage = effectiveSession
                                            ? index < currentPhaseIndex ||
                                            (isTerminal && index === currentPhaseIndex)
                                            : false;

                                        const baseClass =
                                            "rounded-depth-md border border-depth px-4 py-2 text-sm font-semibold transition";
                                        const className = isActiveStage
                                            ? "bg-[var(--depth-color-primary)] text-white border-transparent shadow-depth-md"
                                            : isCompletedStage
                                                ? "bg-depth-interactive text-depth-primary"
                                                : "bg-depth-card text-depth-secondary";

                                        return (
                                            <div key={phase.key} className="flex items-center gap-2">
                                                <span className={`${baseClass} ${className}`}>
                                                    {phase.label}
                                                </span>
                                                {index < PHASE_SEQUENCE.length - 1 && (
                                                    <span className="text-sm text-depth-secondary">→</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {showReportForm && (
                                    <div className="mt-8 w-full">
                                        <label
                                            htmlFor="laporan_praktikum"
                                            className="mb-2 block text-sm font-semibold text-depth-primary"
                                        >
                                            Laporan Praktikum
                                        </label>
                                        <textarea
                                            id="laporan_praktikum"
                                            value={reportText}
                                            onChange={(e) => setReportText(e.target.value)}
                                            rows={6}
                                            className="w-full rounded-depth-lg border border-depth bg-depth-card p-3 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                            placeholder="Catat ringkasan jalannya praktikum, kendala, dan catatan penting lainnya..."
                                        />
                                        <p className="mt-2 text-xs text-depth-secondary">
                                            Catatan: PJ yang terdaftar akan otomatis mengikuti akun asisten yang mengirim laporan.
                                        </p>
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={handleSubmitReport}
                                                disabled={reportSubmitDisabled}
                                                title={
                                                    reportSubmitDisabled
                                                        ? !isFeedbackPhase
                                                            ? "Laporan baru dapat dikirim pada tahap Feedback."
                                                            : reportSubmitted
                                                                ? "Laporan sudah dikirim."
                                                                : "Minimal 3 karakter sebelum mengirim."
                                                        : undefined
                                                }
                                                className={`glass-button flex items-center gap-2 rounded-depth-lg px-6 py-3 font-semibold shadow-depth-md transition-all ${reportSubmitDisabled
                                                    ? "cursor-not-allowed opacity-50"
                                                    : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                                    }`}
                                                style={{
                                                    background: reportSubmitDisabled
                                                        ? undefined
                                                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
                                                }}
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {isSubmittingReport ? "Mengirim..." : "Kirim Laporan"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {showReportPreview && (
                                    <div className="mt-8 w-full rounded-depth-lg border border-depth bg-depth-card p-4 text-depth-primary shadow-depth-md">
                                        <div className="flex flex-wrap justify-between gap-3 text-sm text-depth-secondary">
                                            <span>Laporan dikirim: {reportSubmittedAt ?? "-"}</span>
                                            <span>Mulai: {startedAtDisplay ?? "-"}</span>
                                            <span>Selesai: {endedAtDisplay ?? "-"}</span>
                                            <span>PJ: {reportOwnerDisplay}</span>
                                            <span>DK: {effectiveSession?.dk ?? selectedDk ?? "-"}</span>
                                        </div>
                                        <hr className="my-3 border-[color:var(--depth-border)]" />
                                        <div className="whitespace-pre-wrap text-base leading-relaxed text-depth-primary">
                                            {effectiveSession?.report_notes}
                                        </div>
                                    </div>
                                )}

                                {praktikumLoading && hasSelection && (
                                    <p className="mt-6 text-center text-sm text-depth-secondary">
                                        Memuat status praktikum...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Control Panel */}
                        {showControls && (
                            <div className="flex w-full flex-col p-6 lg:max-w-3xl lg:self-center">
                                <div className="flex flex-1 justify-between gap-3">
                                    {/* Start/Pause/Resume/Restart Toggle Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!hasSession || effectiveSession?.status === "idle") {
                                                handleAction("start");
                                            } else if (isTerminal) {
                                                handleAction("start");
                                            } else if (isRunning) {
                                                setConfirmAction({
                                                    action: "pause",
                                                    options: {},
                                                    title: "Pause Praktikum?",
                                                    message: "Timer akan dihentikan sementara. Anda dapat melanjutkan kapan saja.",
                                                    confirmLabel: "Ya, Pause",
                                                    variant: "warning",
                                                    buttonGradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))",
                                                    icon: (
                                                        <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ),
                                                });
                                            } else if (isPaused) {
                                                handleAction("resume");
                                            }
                                        }}
                                        disabled={
                                            !hasSession || effectiveSession?.status === "idle"
                                                ? startDisabled
                                                : isTerminal
                                                    ? startDisabled
                                                    : isRunning
                                                        ? pauseDisabled
                                                        : resumeDisabled
                                        }
                                        title={
                                            !hasSession || effectiveSession?.status === "idle"
                                                ? startLabel
                                                : isTerminal
                                                    ? "Restart"
                                                    : isRunning
                                                        ? "Pause"
                                                        : "Resume"
                                        }
                                        aria-label={
                                            !hasSession || effectiveSession?.status === "idle"
                                                ? startLabel
                                                : isTerminal
                                                    ? "Restart"
                                                    : isRunning
                                                        ? "Pause"
                                                        : "Resume"
                                        }
                                        className={`flex w-full items-center justify-center rounded-depth-lg border border-depth bg-depth-interactive p-3 text-depth-primary shadow-depth-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)] enabled:text-white disabled:bg-depth-card disabled:text-depth-secondary ${(!hasSession || effectiveSession?.status === "idle"
                                            ? startDisabled
                                            : isTerminal
                                                ? startDisabled
                                                : isRunning
                                                    ? pauseDisabled
                                                    : resumeDisabled)
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                            }`}
                                        style={{
                                            background: (!hasSession || effectiveSession?.status === "idle"
                                                ? startDisabled
                                                : isTerminal
                                                    ? startDisabled
                                                    : isRunning
                                                        ? pauseDisabled
                                                        : resumeDisabled)
                                                ? undefined
                                                : !hasSession || effectiveSession?.status === "idle"
                                                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))"
                                                    : isTerminal
                                                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))"
                                                        : isRunning
                                                            ? "linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))"
                                                            : "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
                                        }}
                                    >
                                        {!hasSession || effectiveSession?.status === "idle" ? (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : isTerminal ? (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : isRunning ? (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const prevIndex = currentPhaseIndex - 1;
                                            if (prevIndex >= 0) {
                                                const prevPhase = PHASE_SEQUENCE[prevIndex];
                                                setConfirmAction({
                                                    action: "next",
                                                    options: { phase: prevPhase.key },
                                                    title: "Kembali ke Phase Sebelumnya?",
                                                    message: `Kembali dari ${currentPhaseLabel ?? "—"} ke ${prevPhase.label}.`,
                                                    confirmLabel: `Ya, Kembali ke ${prevPhase.label}`,
                                                    variant: "info",
                                                    buttonGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9))",
                                                    icon: (
                                                        <svg className="h-7 w-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8m-13 0a9 9 0 1118 0 9 9 0 01-18 0z" />
                                                        </svg>
                                                    ),
                                                });
                                            }
                                        }}
                                        disabled={previousDisabled}
                                        title="Previous Phase"
                                        aria-label="Previous Phase"
                                        className={`flex w-full items-center justify-center rounded-depth-lg border border-depth bg-depth-interactive p-3 text-depth-primary shadow-depth-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)] enabled:text-white disabled:bg-depth-card disabled:text-depth-secondary ${previousDisabled
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                            }`}
                                        style={{
                                            background: previousDisabled
                                                ? undefined
                                                : "linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.9))",
                                        }}
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8m-13 0a9 9 0 1118 0 9 9 0 01-18 0z" />
                                        </svg>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextIndex = currentPhaseIndex + 1;
                                            if (nextIndex < PHASE_SEQUENCE.length) {
                                                const nextPhase = PHASE_SEQUENCE[nextIndex];
                                                setConfirmAction({
                                                    action: "next",
                                                    options: { phase: nextPhase.key },
                                                    title: "Lanjut ke Phase Berikutnya?",
                                                    message: `Pindah dari ${currentPhaseLabel ?? "—"} ke ${nextPhase.label}. Aksi ini tidak dapat dibatalkan.`,
                                                    confirmLabel: `Ya, Lanjut ke ${nextPhase.label}`,
                                                    variant: "info",
                                                    buttonGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))",
                                                    icon: (
                                                        <svg className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ),
                                                });
                                            }
                                        }}
                                        disabled={nextDisabled}
                                        title="Next Phase"
                                        aria-label="Next Phase"
                                        className={`flex w-full items-center justify-center rounded-depth-lg border border-depth bg-depth-interactive p-3 text-depth-primary shadow-depth-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)] enabled:text-white disabled:bg-depth-card disabled:text-depth-secondary ${nextDisabled
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                            }`}
                                        style={{
                                            background: nextDisabled
                                                ? undefined
                                                : "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))",
                                        }}
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setConfirmAction({
                                                action: "exit",
                                                options: {},
                                                title: "Exit Praktikum?",
                                                message: "Praktikum akan dihentikan dan tidak dapat dilanjutkan. Pastikan semua tahap sudah selesai.",
                                                confirmLabel: "Ya, Exit",
                                                variant: "danger",
                                                buttonGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))",
                                                icon: (
                                                    <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                ),
                                            });
                                        }}
                                        disabled={exitDisabled}
                                        title="Exit Praktikum"
                                        aria-label="Exit Praktikum"
                                        className={`flex w-full items-center justify-center rounded-depth-lg border border-depth bg-depth-interactive p-3 text-depth-primary shadow-depth-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)] enabled:text-white disabled:bg-depth-card disabled:text-depth-secondary ${exitDisabled
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:-translate-y-0.5 hover:shadow-depth-lg"
                                            }`}
                                        style={{
                                            background: exitDisabled
                                                ? undefined
                                                : "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))",
                                        }}
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}


                        <div className="grid grid-rows-1 gap-3">
                            <div className="rounded-depth-lg p-3 shadow-depth-md border border-depth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)] enabled:text-white disabled:bg-depth-card disabled:text-depth-secondary">
                                <div
                                    className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-depth-primary transition-colors hover:text-depth-primary/80"
                                    onClick={() => setIsAsistenExpanded(!isAsistenExpanded)}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Asisten Jaga
                                    {selectedKelas && asistenJagaList.length > 0 && (
                                        <span className="ml-auto rounded-full bg-depth-primary/10 px-2 py-0.5 text-xs font-medium text-depth-primary">
                                            {asistenJagaList.length}
                                        </span>
                                    )}
                                    <svg
                                        className={`ml-2 h-4 w-4 transition-transform ${isAsistenExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {jadwalLoading ? (
                                    <p className="text-xs text-gray-500">Memuat daftar asisten...</p>
                                ) : asistenJagaList.length > 0 ? (
                                    isAsistenExpanded && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {asistenJagaList.map((item, idx) => {
                                                const asistenDetail = item?.asisten ?? asistenMap.get(Number(item?.asisten_id));
                                                const key = item?.id ?? `${item?.asisten_id ?? asistenDetail?.id ?? "asisten"}-${idx}`;

                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex-shrink-0 rounded-depth-md border border-depth bg-depth-card/50 px-3 py-2 text-xs font-semibold shadow-depth-sm transition-all hover:shadow-depth-md"
                                                    >
                                                        {asistenDetail?.kode ?? item?.kode ?? "N/A"}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : selectedKelas ? (
                                    <p className="text-xs text-gray-500">Belum ada asisten jaga untuk kelas ini.</p>
                                ) : (
                                    <p className="text-xs text-gray-500">Pilih kelas untuk melihat daftar asisten.</p>
                                )}
                            </div>

                        </div>
                        {selectedPraktikumId && (
                            <TablePraktikanProgress
                                progress={progressData}
                                onlinePraktikan={onlinePraktikan}
                                isLoading={progressLoading}
                                isFetching={progressFetching}
                                onRefresh={refetchProgress}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
