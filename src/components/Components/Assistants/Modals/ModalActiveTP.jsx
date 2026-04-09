import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useModulesQuery } from "@/hooks/useModulesQuery";
import {
    useTugasPendahuluanQuery,
    TUGAS_PENDAHULUAN_QUERY_KEY,
} from "@/hooks/useTugasPendahuluanQuery";
import { useConfigurationQuery, CONFIG_QUERY_KEY } from "@/hooks/useConfigurationQuery";
import { useKelasQuery } from "@/hooks/useKelasQuery";
import { send } from "@/lib/http";
import { update as updateTugasPendahuluanRoute } from "@/lib/routes/tugasPendahuluan";
import { update as updateConfigurationRoute } from "@/lib/routes/configuration";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

const normaliseModuleId = (module) => Number(module?.idM ?? module?.id ?? module?.modul_id ?? 0);
const boolToInt = (value) => (value ? 1 : 0);
const formatDatetimeLocalValue = (value) => {
    if (!value) {
        return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const normaliseDatetimePayload = (value) => {
    if (!value) {
        return null;
    }

    return value.length === 16 ? `${value}:00` : value;
};

export default function ModalActiveTP({ onClose }) {
    const queryClient = useQueryClient();

    const modulesQuery = useModulesQuery({
        onError: (error) => {
            toast.error(error?.message ?? "Gagal memuat daftar modul.");
        },
    });
    const tugasPendahuluanQuery = useTugasPendahuluanQuery({
        onError: (error) => {
            toast.error(error?.message ?? "Gagal memuat konfigurasi tugas pendahuluan.");
        },
    });
    const configurationQuery = useConfigurationQuery({
        onError: (error) => {
            toast.error(error?.message ?? "Gagal memuat konfigurasi global TP.");
        },
    });
    const kelasQuery = useKelasQuery({
        onError: (error) => {
            toast.error(error?.message ?? "Gagal memuat daftar kelas.");
        },
    });

    const modules = modulesQuery.data ?? [];
    const tugasPendahuluanPayload = tugasPendahuluanQuery.data ?? { items: [], meta: {} };
    const tugasPendahuluan = tugasPendahuluanPayload.items ?? [];
    const configuration = configurationQuery.data ?? null;
    const isTpGloballyActive = Boolean(configuration?.tp_activation);
    const allKelas = kelasQuery.data ?? [];

    const moduleMap = useMemo(() => {
        return new Map(
            modules.map((module) => [normaliseModuleId(module), module])
        );
    }, [modules]);

    // Map tugas pendahuluan by modul_id for easy lookup
    const tugasMap = useMemo(() => {
        return new Map(
            tugasPendahuluan.map((item) => [Number(item.modul_id), item])
        );
    }, [tugasPendahuluan]);

    const regularModules = useMemo(
        () => modules.filter((module) => Number(module?.isEnglish ?? 0) !== 1),
        [modules]
    );

    const englishModules = useMemo(
        () => modules.filter((module) => Number(module?.isEnglish ?? 0) === 1),
        [modules]
    );

    // Filter kelas by type
    const regularKelas = useMemo(
        () => allKelas.filter((kelas) => Number(kelas?.isEnglish ?? 0) !== 1),
        [allKelas]
    );

    const englishKelas = useMemo(
        () => allKelas.filter((kelas) => Number(kelas?.isEnglish ?? 0) === 1),
        [allKelas]
    );

    const [regularSelection, setRegularSelection] = useState("");
    const [englishSelection, setEnglishSelection] = useState("");
    const [regularKelasSelection, setRegularKelasSelection] = useState([]);
    const [englishKelasSelection, setEnglishKelasSelection] = useState([]);
    const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
    const [scheduleStartAt, setScheduleStartAt] = useState("");
    const [scheduleEndAt, setScheduleEndAt] = useState("");

    useEffect(() => {
        if (modulesQuery.isLoading || tugasPendahuluanQuery.isLoading) {
            return;
        }

        const activeRegular = tugasPendahuluan.find((item) => {
            const module = moduleMap.get(Number(item.modul_id));
            return item.isActive && Number(module?.isEnglish ?? 0) !== 1;
        });

        const activeEnglish = tugasPendahuluan.find((item) => {
            const module = moduleMap.get(Number(item.modul_id));
            return item.isActive && Number(module?.isEnglish ?? 0) === 1;
        });

        const defaultRegular =
            activeRegular?.modul_id ??
            (regularModules[0] ? normaliseModuleId(regularModules[0]) : "");
        const defaultEnglish =
            activeEnglish?.modul_id ??
            (englishModules[0] ? normaliseModuleId(englishModules[0]) : "");

        setRegularSelection(defaultRegular ? String(defaultRegular) : "");
        setEnglishSelection(defaultEnglish ? String(defaultEnglish) : "");

        // Set initial kelas selections from active_kelas_ids
        if (activeRegular?.active_kelas_ids) {
            setRegularKelasSelection(activeRegular.active_kelas_ids.map(Number));
        }
        if (activeEnglish?.active_kelas_ids) {
            setEnglishKelasSelection(activeEnglish.active_kelas_ids.map(Number));
        }
    }, [
        modulesQuery.isLoading,
        tugasPendahuluanQuery.isLoading,
        tugasPendahuluan,
        moduleMap,
        regularModules,
        englishModules,
    ]);

    // Update kelas selection when module selection changes
    useEffect(() => {
        if (!regularSelection) {
            setRegularKelasSelection([]);
            return;
        }
        const tugas = tugasMap.get(Number(regularSelection));
        setRegularKelasSelection(tugas?.active_kelas_ids?.map(Number) ?? []);
    }, [regularSelection, tugasMap]);

    useEffect(() => {
        if (!englishSelection) {
            setEnglishKelasSelection([]);
            return;
        }
        const tugas = tugasMap.get(Number(englishSelection));
        setEnglishKelasSelection(tugas?.active_kelas_ids?.map(Number) ?? []);
    }, [englishSelection, tugasMap]);

    useEffect(() => {
        if (!configuration) {
            setIsScheduleEnabled(false);
            setScheduleStartAt("");
            setScheduleEndAt("");
            return;
        }

        setIsScheduleEnabled(Boolean(configuration.tp_schedule_enabled));
        setScheduleStartAt(formatDatetimeLocalValue(configuration.tp_schedule_start_at));
        setScheduleEndAt(formatDatetimeLocalValue(configuration.tp_schedule_end_at));
    }, [configuration]);

    const updateMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await send(updateTugasPendahuluanRoute(), payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TUGAS_PENDAHULUAN_QUERY_KEY });
            toast.success("Konfigurasi tugas pendahuluan berhasil disimpan.");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan konfigurasi.");
        },
    });

    const configurationMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await send(updateConfigurationRoute(), payload);
            return data?.config ?? data;
        },
        onSuccess: (responseData) => {
            queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
            toast.success("Status tugas pendahuluan diperbarui.");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message ?? error?.message ?? "Gagal memperbarui konfigurasi TP.");
        },
    });

    const buildConfigurationPayload = (overrides = {}) => {
        if (!configuration) {
            return null;
        }

        const scheduleEnabled =
            overrides.tp_schedule_enabled !== undefined
                ? Boolean(overrides.tp_schedule_enabled)
                : isScheduleEnabled;

        return {
            tp_activation:
                overrides.tp_activation !== undefined
                    ? overrides.tp_activation
                    : boolToInt(isTpGloballyActive),
            registrationAsisten_activation:
                overrides.registrationAsisten_activation !== undefined
                    ? overrides.registrationAsisten_activation
                    : boolToInt(configuration.registrationAsisten_activation),
            registrationPraktikan_activation:
                overrides.registrationPraktikan_activation !== undefined
                    ? overrides.registrationPraktikan_activation
                    : boolToInt(configuration.registrationPraktikan_activation),
            tubes_activation:
                overrides.tubes_activation !== undefined
                    ? overrides.tubes_activation
                    : boolToInt(configuration.tubes_activation),
            polling_activation:
                overrides.polling_activation !== undefined
                    ? overrides.polling_activation
                    : boolToInt(configuration.polling_activation),
            tp_schedule_enabled: scheduleEnabled ? 1 : 0,
            tp_schedule_start_at:
                overrides.tp_schedule_start_at !== undefined
                    ? overrides.tp_schedule_start_at
                    : scheduleEnabled
                        ? normaliseDatetimePayload(scheduleStartAt)
                        : null,
            tp_schedule_end_at:
                overrides.tp_schedule_end_at !== undefined
                    ? overrides.tp_schedule_end_at
                    : scheduleEnabled
                        ? normaliseDatetimePayload(scheduleEndAt)
                        : null,
        };
    };

    const handleToggleTpActivation = () => {
        if (!configuration) {
            toast.error("Konfigurasi belum dimuat.");
            return;
        }

        const payload = buildConfigurationPayload({
            tp_activation: isTpGloballyActive ? 0 : 1,
        });

        if (!payload) {
            toast.error("Konfigurasi tidak tersedia.");
            return;
        }

        configurationMutation.mutate(payload);
    };

    const handleToggleSchedule = () => {
        if (!configuration) {
            toast.error("Konfigurasi belum dimuat.");
            return;
        }

        if (isScheduleEnabled) {
            setIsScheduleEnabled(false);
            setScheduleStartAt("");
            setScheduleEndAt("");
            const payload = buildConfigurationPayload({
                tp_schedule_enabled: 0,
                tp_schedule_start_at: null,
                tp_schedule_end_at: null,
            });
            configurationMutation.mutate(payload);
            return;
        }

        setIsScheduleEnabled(true);
        if (!scheduleStartAt) {
            const now = new Date();
            setScheduleStartAt(formatDatetimeLocalValue(now));
        }
        if (!scheduleEndAt) {
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1);
            setScheduleEndAt(formatDatetimeLocalValue(nextHour));
        }
    };

    const handleSaveSchedule = () => {
        if (!configuration) {
            toast.error("Konfigurasi belum dimuat.");
            return;
        }

        if (isScheduleEnabled) {
            if (!scheduleStartAt || !scheduleEndAt) {
                toast.error("Lengkapi waktu mulai dan selesai jadwal.");
                return;
            }

            const startTime = new Date(scheduleStartAt);
            const endTime = new Date(scheduleEndAt);

            if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
                toast.error("Format waktu mulai tidak valid.");
                return;
            }

            if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
                toast.error("Format waktu selesai tidak valid.");
                return;
            }

            if (endTime <= startTime) {
                toast.error("Waktu selesai harus setelah waktu mulai.");
                return;
            }
        }

        const payload = buildConfigurationPayload();

        if (!payload) {
            toast.error("Konfigurasi tidak tersedia.");
            return;
        }

        configurationMutation.mutate(payload);
    };

    const persistSelections = (nextRegularSelection, nextEnglishSelection, nextRegularKelas, nextEnglishKelas) => {
        if (!Array.isArray(tugasPendahuluan) || tugasPendahuluan.length === 0) {
            toast.error("Belum ada data tugas pendahuluan.");
            return;
        }

        const payload = tugasPendahuluan.map((item) => {
            const module = moduleMap.get(Number(item.modul_id));
            const isEnglishModule = Number(module?.isEnglish ?? 0) === 1;
            const isSelectedRegular = Number(nextRegularSelection) === Number(item.modul_id);
            const isSelectedEnglish = Number(nextEnglishSelection) === Number(item.modul_id);

            // Only update kelas_ids for the module being modified, preserve others
            let kelasIds;
            if (isEnglishModule && isSelectedEnglish) {
                kelasIds = nextEnglishKelas;
            } else if (!isEnglishModule && isSelectedRegular) {
                kelasIds = nextRegularKelas;
            } else {
                // Preserve existing kelas_ids for other modules
                kelasIds = item.active_kelas_ids ?? [];
            }
            const shouldBeActive = kelasIds.length > 0 ;

            return {
                id: item.id,
                isActive: shouldBeActive ? 1 : 0,
                kelas_ids: kelasIds,
            };
        });

        updateMutation.mutate({ data: payload });
    };

    const handleModuleChange = (isEnglish, value) => {
        if (isEnglish) {
            setEnglishSelection(value);
        } else {
            setRegularSelection(value);
        }
    };

const handleKelasToggle = (isEnglish, kelasId) => {
    const currentSelection = isEnglish ? englishKelasSelection : regularKelasSelection;
    const setSelection = isEnglish ? setEnglishKelasSelection : setRegularKelasSelection;

    const newSelection = currentSelection.includes(kelasId)
        ? currentSelection.filter(id => id !== kelasId)
        : [...currentSelection, kelasId];

    setSelection(newSelection);
};

    const handleSelectAllKelas = (isEnglish) => {
        const kelasList = isEnglish ? englishKelas : regularKelas;
        const setSelection = isEnglish ? setEnglishKelasSelection : setRegularKelasSelection;
        setSelection(kelasList.map(k => k.id));

        // Activate TP when selecting all
        if (!isTpGloballyActive) {
            const payload = buildConfigurationPayload({ tp_activation: 1 });
            if (payload) {
                configurationMutation.mutate(payload);
            }
        }
    };

    const handleClearAllKelas = (isEnglish) => {
        const setSelection = isEnglish ? setEnglishKelasSelection : setRegularKelasSelection;
        setSelection([]);

        // Deactivate TP when clearing all
        if (isTpGloballyActive) {
            const payload = buildConfigurationPayload({ tp_activation: 0 });
            if (payload) {
                configurationMutation.mutate(payload);
            }
        }
    };

    const handleSaveKelasSelection = () => {
        persistSelections(regularSelection, englishSelection, regularKelasSelection, englishKelasSelection);
    };

    const isBusy =
        modulesQuery.isLoading ||
        tugasPendahuluanQuery.isLoading ||
        kelasQuery.isLoading ||
        updateMutation.isPending ||
        configurationMutation.isPending;

    const renderKelasCheckboxes = (isEnglish) => {
        const kelasList = isEnglish ? englishKelas : regularKelas;
        const selection = isEnglish ? englishKelasSelection : regularKelasSelection;
        const moduleSelection = isEnglish ? englishSelection : regularSelection;

        if (!moduleSelection) {
            return null;
        }

        if (kelasList.length === 0) {
            return (
                <p className="mt-3 text-xs text-depth-secondary dark:text-gray-400">
                    Tidak ada kelas tersedia.
                </p>
            );
        }

        return (
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-depth-secondary dark:text-gray-400">
                        Aktifkan untuk kelas:
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleSelectAllKelas(isEnglish)}
                            className="text-xs text-[var(--depth-color-primary)] hover:underline disabled:opacity-50"
                            disabled={isBusy}
                        >
                            Pilih Semua
                        </button>
                        <span className="text-depth-secondary">|</span>
                        <button
                            type="button"
                            onClick={() => handleClearAllKelas(isEnglish)}
                            className="text-xs text-[var(--depth-color-primary)] hover:underline disabled:opacity-50"
                            disabled={isBusy}
                        >
                            Hapus Semua
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-depth-md border border-depth/40 bg-depth-card/30 dark:border-depth/20 dark:bg-depth-card/20">
                    {kelasList.map((kelas) => (
                        <label
                            key={kelas.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-depth-card/50 dark:hover:bg-depth-card/30 p-1.5 rounded-depth-sm transition"
                        >
                            <input
                                type="checkbox"
                                checked={selection.includes(kelas.id)}
                                onChange={() => {
                                    handleKelasToggle(isEnglish, kelas.id);
                                }}
                                disabled={isBusy}
                                className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                            <span className="text-xs font-medium text-depth-primary dark:text-white truncate">
                                {kelas.kelas}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container w-full max-w-2xl" style={{ maxWidth: 'var(--depth-modal-width-xl, 36vw)' }}>
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Tugas Pendahuluan</h2>
                    <div className="flex gap-5 items-center">
                        <DepthToggleButton
                            label={regularKelasSelection.length > 0 ? "ON" : "OFF"}
                            isOn={regularKelasSelection.length > 0}
                            onToggle={() => {
                                if (regularKelasSelection.length > 0) {
                                    // Clear selections and deactivate
                                    setRegularKelasSelection([]);
                                    setEnglishKelasSelection([]);
                                    const payload = buildConfigurationPayload({ tp_activation: 0 });
                                    if (payload) {
                                        configurationMutation.mutate(payload);
                                    }
                                } else {
                                    // Select all and activate
                                    setRegularKelasSelection(regularKelas.map(k => k.id));
                                    setEnglishKelasSelection(englishKelas.map(k => k.id));
                                    const payload = buildConfigurationPayload({ tp_activation: 1 });
                                    if (payload) {
                                        configurationMutation.mutate(payload);
                                    }
                                }
                            }}
                            disabled={!regularSelection || isBusy}
                        />
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfigurasi TP" />
                    </div>
                </div>

                <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <section className="rounded-depth-md border border-depth/60 bg-depth-card/60 p-4 shadow-depth-sm dark:border-depth/30 dark:bg-depth-card/40">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-depth-primary dark:text-white">
                                    Jadwal Otomatis TP
                                </h3>
                                <p className="mt-1 text-xs text-depth-secondary dark:text-gray-400">
                                    Aktifkan jadwal agar TP menyala dan mati otomatis sesuai rentang waktu.
                                </p>
                            </div>
                            <DepthToggleButton
                                label={isScheduleEnabled ? "Jadwal Aktif" : "Jadwal Mati"}
                                isOn={isScheduleEnabled}
                                onToggle={handleToggleSchedule}
                                disabled={configurationQuery.isLoading || configurationMutation.isPending}
                            />
                        </div>

                        {isScheduleEnabled && (
                            <div className="mt-4 space-y-4">
                                <label className="flex flex-col text-xs font-semibold text-depth-primary dark:text-white">
                                    Mulai Aktif
                                    <input
                                        type="datetime-local"
                                        lang="id-ID"
                                        className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm font-medium text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 dark:border-depth/70 dark:bg-depth-card/70 dark:text-white"
                                        value={scheduleStartAt}
                                        onChange={(event) => setScheduleStartAt(event.target.value)}
                                        disabled={isBusy}
                                    />
                                </label>

                                <label className="flex flex-col text-xs font-semibold text-depth-primary dark:text-white">
                                    Berakhir
                                    <input
                                        type="datetime-local"
                                        lang="id-ID"
                                        className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm font-medium text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 dark:border-depth/70 dark:bg-depth-card/70 dark:text-white"
                                        value={scheduleEndAt}
                                        onChange={(event) => setScheduleEndAt(event.target.value)}
                                        disabled={isBusy}
                                    />
                                </label>

                                <button
                                    type="button"
                                    onClick={handleSaveSchedule}
                                    className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:bg-[var(--depth-color-primary-dark)] disabled:cursor-not-allowed disabled:bg-depth-secondary"
                                    disabled={isBusy}
                                >
                                    Simpan Jadwal
                                </button>
                            </div>
                        )}
                    </section>

                    <section className="rounded-depth-md border border-depth/60 bg-depth-card/60 p-4 shadow-depth-sm dark:border-depth/30 dark:bg-depth-card/40">
                        <select
                            className="mt-3 w-full appearance-none rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm font-medium text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 dark:border-depth/70 dark:bg-depth-card/70 dark:text-white"
                            value={regularSelection}
                            onChange={(event) => handleModuleChange(false, event.target.value)}
                            disabled={regularModules.length === 0 || isBusy}
                        >
                            {regularModules.length === 0 && (
                                <option value="">Tidak ada modul reguler.</option>
                            )}
                            {regularModules.map((module) => {
                                const moduleId = normaliseModuleId(module);
                                return (
                                    <option key={moduleId} value={moduleId}>
                                        {module.judul}
                                    </option>
                                );
                            })}
                        </select>
                        {renderKelasCheckboxes(false)}
                    </section>
                                        <section className="rounded-depth-md border border-depth/60 bg-depth-card/60 p-4 shadow-depth-sm dark:border-depth/30 dark:bg-depth-card/40">
                        <h3 className="text-sm font-semibold text-depth-primary dark:text-white mb-3">Modul English</h3>
                        <select
                            className="mt-3 w-full appearance-none rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm font-medium text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 dark:border-depth/70 dark:bg-depth-card/70 dark:text-white"
                            value={englishSelection}
                            onChange={(event) => handleModuleChange(true, event.target.value)}
                            disabled={englishModules.length === 0 || isBusy}
                        >
                            {englishModules.length === 0 && (
                                <option value="">Tidak ada modul English.</option>
                            )}
                            {englishModules.map((module) => {
                                const moduleId = normaliseModuleId(module);
                                return (
                                    <option key={moduleId} value={moduleId}>
                                        {module.judul}
                                    </option>
                                );
                            })}
                        </select>
                        {renderKelasCheckboxes(true)}
                    </section>


                    <button
                        type="button"
                        onClick={handleSaveKelasSelection}
                        className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-depth-sm transition hover:bg-[var(--depth-color-primary-dark)] disabled:cursor-not-allowed disabled:bg-depth-secondary"
                        disabled={isBusy}
                    >
                        {updateMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi Kelas"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
