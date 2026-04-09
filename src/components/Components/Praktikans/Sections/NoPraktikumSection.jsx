import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import iconModule from "../../../../assets/practicum/iconModule.svg";

const PHASE_LABELS = {
    preparation: "Preparation",
    ta: "Tes Awal",
    fitb_jurnal: "Jurnal",
    mandiri: "Mandiri",
    tk: "Tes Keterampilan",
    feedback: "Feedback",
};

const STATUS_LABELS = {
    running: "Sedang berjalan",
    paused: "Terjeda",
    completed: "Selesai",
    exited: "Dihentikan",
    idle: "Siap",
};

export default function NoPraktikumSection({
    isVisible = true,
    kelasId = null,
    dk = null,
    onPraktikumStateChange,
    moduleMeta,
}) {
    const [praktikumState, setPraktikumState] = useState(null);
    const [dkRequired, setDkRequired] = useState(false);
    const [selectedDk, setSelectedDk] = useState(null);
    const [isSavingDk, setIsSavingDk] = useState(false);
    const applyPraktikumState = useCallback((payload) => {
        if (!payload) {
            setPraktikumState(null);

            return;
        }

        setPraktikumState((previous) => {
            const previousState = previous ?? null;

            const resolvedModul =
                payload.modul?.judul ??
                payload.modul?.nama ??
                previousState?.modul ??
                (payload.modul_id ? `Modul #${payload.modul_id}` : null);

            return {
                status: payload.status ?? previousState?.status ?? null,
                current_phase: payload.current_phase ?? previousState?.current_phase ?? null,
                dk: payload.dk ?? previousState?.dk ?? null,
                modul: resolvedModul,
                modul_id: payload.modul_id ?? previousState?.modul_id ?? null,
                started_at: payload.started_at ?? previousState?.started_at ?? null,
                ended_at: payload.ended_at ?? previousState?.ended_at ?? null,
                pj: payload.pj ?? previousState?.pj ?? null,
                pj_id: payload.pj_id ?? previousState?.pj_id ?? null,
                feedback_pending: Boolean(payload.feedback_pending ?? previousState?.feedback_pending ?? false),
                feedback_modul_id: payload.feedback_modul_id ?? previousState?.feedback_modul_id ?? payload.modul_id ?? null,
                feedback_asisten_id: payload.feedback_asisten_id ?? previousState?.feedback_asisten_id ?? payload.pj_id ?? null,
            };
        });
    }, []);
    const formatTimestamp = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "-";
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

    useEffect(() => {
        if (!isVisible) {
            document.body.style.overflow = "";

            return undefined;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isVisible]);

    useEffect(() => {
        onPraktikumStateChange(praktikumState);
    }, [praktikumState, onPraktikumStateChange]);

    // Fetch initial praktikum state on mount/refresh
    useEffect(() => {
        if (!kelasId) {
            return;
        }

        const fetchActivePraktikum = async () => {
            try {
                const { data } = await api.get('/api-v1/praktikum/check-praktikum');

                if (data?.dk_required) {
                    setDkRequired(true);
                    applyPraktikumState(null);
                } else if (data?.status === 'success') {
                    setDkRequired(false);
                    const praktikumPayload = data?.data ?? null;
                    const feedbackPending = Boolean(data?.feedback_pending ?? praktikumPayload?.feedback_pending ?? false);
                    const mergedPayload = praktikumPayload
                        ? { ...praktikumPayload }
                        : {};

                    const payloadToApply = feedbackPending || praktikumPayload
                        ? {
                            ...mergedPayload,
                            feedback_pending: feedbackPending,
                            feedback_modul_id: data?.feedback_modul_id ?? mergedPayload.feedback_modul_id ?? mergedPayload.modul_id ?? null,
                            feedback_asisten_id: data?.feedback_asisten_id ?? mergedPayload.feedback_asisten_id ?? mergedPayload.pj_id ?? null,
                        }
                        : null;

                    applyPraktikumState(payloadToApply);
                } else {
                    applyPraktikumState(null);
                }
            } catch (error) {
                console.error('Failed to fetch active praktikum:', error);
            }
        };

        fetchActivePraktikum();
    }, [kelasId, applyPraktikumState]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const effectiveDk = dk ?? praktikumState?.dk ?? null;
        if (!kelasId || !effectiveDk) {
            return undefined;
        }

        const echo = window.Echo;
        const channelName = `praktikum.class.${kelasId}.dk.${effectiveDk}`;
        const channel = echo.channel(channelName);
        const listener = (payload) => {
            const praktikumPayload = payload?.praktikum ?? payload ?? null;
            const formatted = praktikumPayload
                ? JSON.stringify(praktikumPayload, null, 2)
                : "Payload kosong diterima.";

            if (!praktikumPayload) {
                return;
            }

            applyPraktikumState(praktikumPayload);
        };

        channel.listen(".PraktikumStatusUpdated", listener);

        return () => {
            try {
                echo.leave(channelName);
            } catch (err) {
                console.warn("Gagal meninggalkan channel praktikum:", err);
            }
        };
    }, [kelasId, dk, praktikumState?.dk, applyPraktikumState]);

    const statusLabel = praktikumState?.status
        ? STATUS_LABELS[praktikumState.status] ?? praktikumState.status
        : "Menunggu sesi";
    const phaseLabel = praktikumState?.current_phase
        ? PHASE_LABELS[praktikumState.current_phase] ?? praktikumState.current_phase
        : "-";
    const modulLabel = praktikumState?.modul
        ? praktikumState.modul
        : praktikumState?.modul_id
            ? `Modul #${praktikumState.modul_id}`
            : "-";
    const startedDisplay = formatTimestamp(praktikumState?.started_at);
    const endedDisplay = formatTimestamp(praktikumState?.ended_at);

    const resolveDisplayText = (value, fallback = "-") => {
        if (value === null || value === undefined) {
            return fallback;
        }

        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }

        if (typeof value === "object") {
            return (
                value.judul ??
                value.nama ??
                value.name ??
                value.title ??
                value.email ??
                fallback
            );
        }

        return fallback;
    };

    const modulId = moduleMeta?.modul_id ?? praktikumState?.modul_id ?? null;
    const modulTitle = resolveDisplayText(
        moduleMeta?.modul ??
        praktikumState?.modul ??
        (modulId ? `Modul #${modulId}` : null)
    );
    const pjName = resolveDisplayText(moduleMeta?.pj ?? praktikumState?.pj);

    const handleSaveDk = async () => {
        if (!selectedDk) {
            toast.error("Pilih DK terlebih dahulu.");
            return;
        }

        setIsSavingDk(true);
        try {
            const { data } = await api.post("/api-v1/praktikum/set-dk", { dk: selectedDk });
            if (data?.status === "success") {
                toast.success(`Berhasil memilih ${selectedDk}.`);
                setDkRequired(false);
                setSelectedDk(null);

                const { data: checkData } = await api.get("/api-v1/praktikum/check-praktikum");
                if (checkData?.status === "success") {
                    const praktikumPayload = checkData?.data ?? null;
                    const feedbackPending = Boolean(checkData?.feedback_pending ?? praktikumPayload?.feedback_pending ?? false);
                    const mergedPayload = praktikumPayload ? { ...praktikumPayload } : {};
                    const payloadToApply = feedbackPending || praktikumPayload
                        ? {
                            ...mergedPayload,
                            feedback_pending: feedbackPending,
                            feedback_modul_id: checkData?.feedback_modul_id ?? mergedPayload.feedback_modul_id ?? mergedPayload.modul_id ?? null,
                            feedback_asisten_id: checkData?.feedback_asisten_id ?? mergedPayload.feedback_asisten_id ?? mergedPayload.pj_id ?? null,
                        }
                        : null;
                    applyPraktikumState(payloadToApply);
                }
            }
        } catch (error) {
            console.error("Failed to save DK:", error);
            toast.error(error?.response?.data?.message ?? "Gagal menyimpan DK.");
        } finally {
            setIsSavingDk(false);
        }
    };

    if (dkRequired && isVisible) {
        return (
            <div
                className="mx-auto w-full rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg"
            >
                <div className="mb-6 flex justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-3 shadow-depth-md">
                    <h1 className="w-[50%] rounded-depth-md p-2 text-center text-2xl font-bold text-white transition hover:bg-white/10">
                        PRAKTIKUM
                    </h1>
                </div>
                <div className="flex flex-col items-center gap-6 rounded-depth-md border border-depth bg-depth-interactive p-8 shadow-depth-sm">
                    <p className="text-center text-lg font-semibold text-depth-primary">
                        Kamu belum memilih ruangan DK.
                    </p>
                    <p className="text-center text-sm text-depth-secondary">
                        Silakan pilih ruangan DK tempat kamu akan mengikuti praktikum.
                    </p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setSelectedDk("DK1")}
                            className={`rounded-depth-md px-8 py-3 text-lg font-bold transition ${selectedDk === "DK1"
                                ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                : "border border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive"
                                }`}
                        >
                            DK1
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedDk("DK2")}
                            className={`rounded-depth-md px-8 py-3 text-lg font-bold transition ${selectedDk === "DK2"
                                ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                : "border border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive"
                                }`}
                        >
                            DK2
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveDk}
                        disabled={!selectedDk || isSavingDk}
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSavingDk ? "Menyimpan..." : "Simpan & Lanjutkan"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="mx-auto w-full rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg"
            style={{ display: isVisible ? "block" : "none" }}
        >
            <div className="mb-6 flex justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-3 shadow-depth-md">
                <h1 className="w-[50%] rounded-depth-md p-2 text-center text-2xl font-bold text-white transition hover:bg-white/10">
                    PRAKTIKUM
                </h1>
            </div>
            <div className="mb-6 grid gap-4 rounded-depth-md border border-depth bg-depth-interactive p-5 text-sm shadow-depth-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            Status
                        </p>
                        <p className="text-base font-semibold text-depth-primary">{statusLabel}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            Tahap Saat Ini
                        </p>
                        <p className="text-base font-semibold text-depth-primary">{phaseLabel}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            Modul
                        </p>
                        <p className="text-base font-semibold text-depth-primary">{modulLabel}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                            Waktu Mulai / Selesai
                        </p>
                        <p className="text-base font-semibold text-depth-primary">
                            {startedDisplay} — {endedDisplay}
                        </p>
                    </div>
                </div>
            </div>
            <div
                className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-track-depth scrollbar-thumb-depth-secondary"
                style={{ maxHeight: "69vh" }}
            >
                <div className="rounded-depth-md border border-depth bg-depth-interactive p-5 text-sm shadow-depth-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">Modul Aktif</p>
                            <p className="text-lg font-bold text-depth-primary">{modulTitle || "-"}</p>
                            <p className="mt-1 text-xs text-depth-secondary">
                                Penanggung jawab: <span className="font-semibold text-depth-primary">{pjName || "-"}</span>
                            </p>
                        </div>
                        {modulId && (
                            <div className="flex items-center gap-3">
                                <img src={iconModule} alt="Modul" className="h-8 w-8" />
                                <span className="text-xs text-depth-secondary">ID Modul: {modulId}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
