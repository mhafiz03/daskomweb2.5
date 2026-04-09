import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import { MODULES_QUERY_KEY, useModulesQuery } from "@/hooks/useModulesQuery";
import { send } from "@/lib/http";
import { update as updateModul } from "@/lib/routes/modul";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const QUESTION_TYPES = [
    // { key: "tp", label: "TP", description: "Tugas Pendahuluan" },
    { key: "ta", label: "TA", description: "Tes Awal" },
    { key: "jurnal", label: "Jurnal", description: "Jurnal Praktikum" },
    { key: "fitb", label: "FITB", description: "Fill in the Blank" },
    { key: "tm", label: "TM", description: "Tugas Mandiri" },
    { key: "tk", label: "TK", description: "Tes Keterampilan" },
];

const normalizeModuleConfig = (moduleItem) => {
    const fallback = Boolean(Number(moduleItem?.isUnlocked ?? 0));
    const config = moduleItem?.unlock_config && typeof moduleItem.unlock_config === "object" ? moduleItem.unlock_config : null;

    return QUESTION_TYPES.reduce((acc, type) => {
        const rawValue = config && Object.prototype.hasOwnProperty.call(config, type.key) ? config[type.key] : undefined;
        acc[type.key] = typeof rawValue === "boolean" ? rawValue : fallback;
        return acc;
    }, {});
};

const getModuleId = (moduleItem) => String(moduleItem?.idM ?? moduleItem?.id);

export default function ModalOpenKJ({ onClose, modules }) {
    const [config, setConfig] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const shouldFetchModules = !modules || modules.length === 0;

    const {
        data: fetchedModules = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery({
        enabled: shouldFetchModules,
    });

    const moduleItems = useMemo(() => {
        const source = shouldFetchModules ? fetchedModules : modules;

        if (Array.isArray(source)) {
            return source;
        }

        return [];
    }, [fetchedModules, modules, shouldFetchModules]);

    useEffect(() => {
        if (!moduleItems.length) {
            setConfig({});
            return;
        }

        const initial = moduleItems.reduce((acc, moduleItem) => {
            acc[getModuleId(moduleItem)] = normalizeModuleConfig(moduleItem);
            return acc;
        }, {});

        setConfig(initial);
    }, [moduleItems]);

    const toggleType = useCallback(
        (moduleId, typeKey) => {
        if (typeKey === "tp") {
            return;
        }

        setConfig((prev) => {
            const moduleConfig = prev[moduleId] ?? normalizeModuleConfig(moduleItems.find((item) => getModuleId(item) === moduleId) ?? {});

                return {
                    ...prev,
                    [moduleId]: {
                        ...moduleConfig,
                        [typeKey]: !moduleConfig[typeKey],
                    },
                };
            });
        },
        [moduleItems],
    );

    const toggleAll = useCallback(
        (moduleId, value) => {
        setConfig((prev) => ({
            ...prev,
            [moduleId]: QUESTION_TYPES.reduce((acc, type) => {
                acc[type.key] = type.key === "tp" ? true : value;
                return acc;
            }, {}),
        }));
        },
        [],
    );

    const handleSave = async () => {
        if (!moduleItems.length) {
            toast.error("Belum ada modul untuk diperbarui.");
            return;
        }

        setIsSaving(true);

        try {
            await Promise.all(
                moduleItems.map((moduleItem) => {
                    const moduleId = getModuleId(moduleItem);
                    const currentConfig = config[moduleId] ?? normalizeModuleConfig(moduleItem);

                    const baseUnlocked = Boolean(Number(moduleItem?.isUnlocked ?? 0));
                    const payload = {
                        id: Number(moduleId),
                        judul: moduleItem?.judul ?? `Modul ${moduleId}`,
                        deskripsi: moduleItem?.deskripsi ?? "",
                        isEnglish: Number(moduleItem?.isEnglish ?? 0),
                        isUnlocked: baseUnlocked ? 1 : 0,
                        modul_link: moduleItem?.modul_link ?? "",
                        ppt_link: moduleItem?.ppt_link ?? "",
                        video_link: moduleItem?.video_link ?? "",
                        unlock_config: {
                            ...currentConfig,
                            tp: true,
                        },
                    };

                    return send(updateModul(moduleId), payload);
                }),
            );

            await queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY });
            toast.success("Konfigurasi kunci jawaban diperbarui.");
            onClose?.();
        } catch (error) {
            const message = error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan konfigurasi modul.";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div className="depth-modal-container max-w-6xl">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title flex items-center gap-2">
                        <img className="edit-icon-filter h-6 w-6" src={editIcon} alt="praktikum" /> Pengaturan Kunci Jawaban
                    </h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfigurasi modul" />
                </div>

                {modulesLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-depth-lg border border-depth bg-depth-card/70 py-12 text-depth-secondary">
                        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]" />
                        Memuat daftar modul...
                    </div>
                )}

                {modulesError && !modulesLoading && (
                    <div className="rounded-depth-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {modulesQueryError?.message ?? "Gagal memuat modul."}
                    </div>
                )}

                {!modulesLoading && !modulesError && (
                    <>
                        <div className="max-h-[450px] overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-depth-card">
                                    <tr>
                                        <th className="border-b border-depth px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                            Modul
                                        </th>
                                        {QUESTION_TYPES.map((type) => (
                                            <th
                                                key={type.key}
                                                className="border-b border-depth px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-depth-secondary"
                                            >
                                                {type.label}
                                            </th>
                                        ))}
                                        <th className="border-b border-depth px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                                            Semua
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moduleItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={QUESTION_TYPES.length + 2} className="py-10 text-center text-sm text-depth-secondary">
                                                Belum ada modul yang tersedia.
                                            </td>
                                        </tr>
                                    ) : (
                                        moduleItems.map((moduleItem) => {
                                            const moduleId = getModuleId(moduleItem);
                                            const rowConfig = config[moduleId] ?? normalizeModuleConfig(moduleItem);
                                            const togglableTypes = QUESTION_TYPES.filter((type) => type.key !== "tp");
                                            const allEnabled = togglableTypes.every((type) => rowConfig[type.key]);
                                            const moduleTitle = moduleItem?.judul ?? `Modul ${moduleId}`;

                                            return (
                                                <tr key={moduleId} className="border-b border-depth/40">
                                                    <td className="px-4 py-4 align-middle text-sm font-semibold text-depth-primary">{moduleTitle}</td>
                                                    {QUESTION_TYPES.map((type) => {
                                                        const isAlwaysOn = type.key === "tp";
                                                        const isEnabled = isAlwaysOn ? true : rowConfig[type.key];
                                                        const buttonClass = isEnabled
                                                            ? "bg-emerald-500 text-white border-emerald-500"
                                                            : "bg-depth-card text-depth-secondary border-depth";

                                                        return (
                                                            <td key={`${moduleId}-${type.key}`} className="px-2 py-3 text-center align-middle">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleType(moduleId, type.key)}
                                                                    aria-pressed={isEnabled}
                                                                    disabled={isAlwaysOn}
                                                                    className={`w-10 rounded-depth-md border px-2 py-2 text-xs font-semibold shadow-depth-sm transition ${
                                                                        isAlwaysOn
                                                                            ? "bg-emerald-500 text-white opacity-80"
                                                                            : "hover:-translate-y-0.5 hover:shadow-depth-md"
                                                                    } ${buttonClass}`}
                                                                >
                                                                    {isAlwaysOn ? "Selalu Aktif" : isEnabled ? "On" : "Off"}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAll(moduleId, !allEnabled)}
                                                            className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                        >
                                                            {allEnabled ? "Matikan" : "Aktifkan"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-depth px-4 py-3 text-sm text-depth-secondary">
                            <p className="font-semibold text-depth-primary">Legend</p>
                            <ul className="mt-2 flex flex-wrap gap-4 text-xs">
                                <li className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-depth-full bg-emerald-500" />
                                    Praktikan dapat melihat kunci jawaban
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-depth-full bg-depth-card border border-depth" />
                                    Jawaban tetap terkunci untuk praktikan
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || modulesLoading || modulesError || moduleItems.length === 0}
                        className={`rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition ${
                            isSaving || modulesLoading || moduleItems.length === 0
                                ? "cursor-not-allowed opacity-60"
                                : "hover:-translate-y-0.5 hover:shadow-depth-md"
                        }`}
                    >
                        {isSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
