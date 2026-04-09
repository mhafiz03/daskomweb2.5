import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ButtonEditModule from "../Modals/ModalEditModule";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import trashIcon from "../../../../assets/nav/Icon-Delete.svg";
import iconPPT from "../../../../assets/practicum/iconPPT.svg";
import iconVideo from "../../../../assets/practicum/iconVideo.svg";
import iconModule from "../../../../assets/practicum/iconModule.svg";
import { useModulesQuery, MODULES_QUERY_KEY } from "@/hooks/useModulesQuery";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

const normalizeBooleanFlag = (value) => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true";
    }

    return false;
};

const toNumericFlag = (value) => (normalizeBooleanFlag(value) ? 1 : 0);


export default function TableModule() {
    const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState(null);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [openIndex, setOpenIndex] = useState(null);
    const [selectedModuleIds, setSelectedModuleIds] = useState(new Set());
    const queryClient = useQueryClient();

    const {
        data: modules = [],
        isLoading: modulesLoading,
        isError: modulesError,
        error: modulesQueryError,
    } = useModulesQuery();

    useEffect(() => {
        setSelectedModuleIds((previous) => {
            const next = new Set();
            if (Array.isArray(modules)) {
                modules.forEach((module) => {
                    const key = String(module.idM);
                    if (previous.has(key)) {
                        next.add(key);
                    }
                });
            }
            return next;
        });
    }, [modules]);

    const handleModuleUpdate = (updatedModule) => {
        queryClient.setQueryData(MODULES_QUERY_KEY, (prev) => {
            if (!Array.isArray(prev)) {
                return prev;
            }

            return prev.map((module) =>
                module.idM === updatedModule.idM ? { ...module, ...updatedModule } : module
            );
        });
    };

    const deleteModuleMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/api-v1/modul/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY });
            toast.success("Modul berhasil dihapus!");
            setIsDeleteModalOpen(false);
            setModuleToDelete(null);
        },
        onError: (err) => {
            const responseMessage = err?.response?.data?.message ?? err?.message ?? "Gagal menghapus modul.";
            toast.error(responseMessage);
            setIsDeleteModalOpen(false);
        },
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async ({ payload }) => {
            await api.patch("/api-v1/modul/bulk-update", payload);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY });
            toast.success(variables?.message ?? "Modul diperbarui.");
            setSelectedModuleIds(new Set());
        },
        onError: (error) => {
            const message = error?.response?.data?.message ?? error?.message ?? "Gagal memperbarui modul.";
            toast.error(message);
        },
    });

    const handleOpenModalEdit = (module) => {
        setSelectedModuleId(module.idM);
        setIsModalOpenEdit(true);
    };

    const handleCloseModalEdit = () => {
        setIsModalOpenEdit(false);
        setSelectedModuleId(null); // Clear the selected module ID when closing modal
    };

    // Updated delete handler to show confirmation modal
    const handleDeleteClick = (id) => {
        setModuleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setModuleToDelete(null);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!moduleToDelete) {
            setIsDeleteModalOpen(false);
            return;
        }

        deleteModuleMutation.mutate(moduleToDelete);
    };

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const toggleModuleSelection = (moduleId) => {
        const key = String(moduleId);
        setSelectedModuleIds((previous) => {
            const next = new Set(previous);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const clearSelection = () => setSelectedModuleIds(new Set());

    const areAllSelected = modules.length > 0 && selectedModuleIds.size === modules.length;

    const toggleSelectAll = () => {
        if (areAllSelected) {
            setSelectedModuleIds(new Set());
            return;
        }

        const next = new Set();
        modules.forEach((module) => {
            next.add(String(module.idM));
        });
        setSelectedModuleIds(next);
    };

    const handleBulkAction = (changes, message) => {
        if (selectedModuleIds.size === 0) {
            toast.error("Pilih modul terlebih dahulu.");
            return;
        }

        const payload = Array.from(selectedModuleIds).map((id) => {
            const key = String(id);
            const module = modules.find((m) => String(m.idM) === key) ?? {};
            const resolvedEnglish = changes.hasOwnProperty("isEnglish")
                ? toNumericFlag(changes.isEnglish)
                : toNumericFlag(module.isEnglish);
            const resolvedUnlocked = changes.hasOwnProperty("isUnlocked")
                ? toNumericFlag(changes.isUnlocked)
                : toNumericFlag(module.isUnlocked);

            return {
                id: Number(id),
                judul: module.judul ?? "",
                deskripsi: module.deskripsi ?? "",
                isEnglish: resolvedEnglish,
                isUnlocked: resolvedUnlocked,
                modul_link: module.modul_link ?? "",
                ppt_link: module.ppt_link ?? "",
                video_link: module.video_link ?? "",
            };
        });

        bulkUpdateMutation.mutate({ payload, message });
    };

    const toggleModuleUnlockMutation = useMutation({
        mutationFn: async ({ module, nextIsUnlocked }) => {
            const payload = {
                judul: module.judul ?? "",
                deskripsi: module.deskripsi ?? "",
                isEnglish: toNumericFlag(module.isEnglish),
                isUnlocked: Number(nextIsUnlocked),
                modul_link: module.modul_link ?? "",
                ppt_link: module.ppt_link ?? "",
                video_link: module.video_link ?? "",
            };

            const { data } = await api.patch(`/api-v1/modul/${module.idM}`, payload);
            return data?.data ?? null;
        },
        onSuccess: (updatedModule) => {
            if (updatedModule) {
                queryClient.setQueryData(MODULES_QUERY_KEY, (prev) => {
                    if (!Array.isArray(prev)) {
                        return prev;
                    }

                    return prev.map((module) =>
                        module.idM === updatedModule.idM ? { ...module, ...updatedModule } : module,
                    );
                });
            } else {
                queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY });
            }

            toast.success("Status modul berhasil diperbarui.");
        },
        onError: (err) => {
            const responseMessage =
                err?.response?.data?.message ?? err?.message ?? "Gagal memperbarui status modul.";
            toast.error(responseMessage);
        },
    });

    const handleToggleUnlocked = (module) => {
        if (!module?.idM) {
            return;
        }

        const currentValue = normalizeBooleanFlag(module?.isUnlocked);
        const nextValue = currentValue ? 0 : 1;
        toggleModuleUnlockMutation.mutate({ module, nextIsUnlocked: nextValue });
    };

    const selectedCount = selectedModuleIds.size;
    const isBulkUpdating = bulkUpdateMutation.isPending;

    return (
        <div className="space-y-4">
            <div className="rounded-depth-lg border border-depth/60 bg-depth-card px-4 py-3 shadow-depth-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-depth-secondary">
                    <span className="font-semibold">
                        {selectedCount > 0 ? `${selectedCount} modul dipilih` : `${modules.length} modul tersedia`}
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-3 py-1 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            {areAllSelected ? "Batalkan Pilih Semua" : "Pilih Semua"}
                        </button>
                        {selectedCount > 0 && (
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="rounded-depth-md border border-depth bg-depth-card px-3 py-1 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Bersihkan
                            </button>
                        )}
                    </div>
                </div>

                {selectedCount > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => handleBulkAction({ isUnlocked: 1 }, "Modul berhasil dibuka.")}
                            disabled={isBulkUpdating}
                            className="rounded-depth-md border border-emerald-500/60 bg-emerald-500/15 px-3 py-2 text-emerald-600 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Unlock
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkAction({ isUnlocked: 0 }, "Modul berhasil dikunci.")}
                            disabled={isBulkUpdating}
                            className="rounded-depth-md border border-gray-400/60 bg-gray-500/10 px-3 py-2 text-depth-secondary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Lock
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkAction({ isEnglish: 1 }, "Modul ditandai English.")}
                            disabled={isBulkUpdating}
                            className="rounded-depth-md border border-blue-500/60 bg-blue-500/10 px-3 py-2 text-blue-600 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Tandai English
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkAction({ isEnglish: 0 }, "Modul ditandai reguler.")}
                            disabled={isBulkUpdating}
                            className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Tandai Reguler
                        </button>
                    </div>
                )}
            </div>

            <div className="h-[76vh] overflow-y-auto rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                {modulesLoading ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">Memuat data...</div>
                ) : modulesError ? (
                    <div className="px-6 py-10 text-center text-red-500">
                        {modulesQueryError?.message ?? "Gagal memuat data modul"}
                    </div>
                ) : modules.length === 0 ? (
                    <div className="px-6 py-10 text-center text-depth-secondary">Tidak ada modul yang tersedia.</div>
                ) : (
                    <ul className="divide-y divide-[color:var(--depth-border)]">
                        {modules.map((module, index) => {
                            const isUnlocked = normalizeBooleanFlag(module?.isUnlocked);
                            const isEnglish = normalizeBooleanFlag(module?.isEnglish);

                            return (
                                <li key={`module-${module.idM}-${index}`} className="transition hover:bg-depth-interactive/60">
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(index)}
                                        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                                    >
                                        <div className="flex flex-1 items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedModuleIds.has(String(module.idM))}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    toggleModuleSelection(module.idM);
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                            />
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold text-depth-primary">{module.judul}</h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isUnlocked && (
                                                <span className="rounded-depth-full border border-depth bg-depth-interactive px-2 py-1 text-xs text-depth-secondary">
                                                    🔒
                                                </span>
                                            )}
                                            {isEnglish && (
                                                <span className="rounded-depth-full border border-depth bg-depth-interactive px-3 py-1 text-xs font-semibold text-depth-primary">
                                                    English
                                                </span>
                                            )}
                                            <span className="text-depth-secondary">{openIndex === index ? "▲" : "▼"}</span>
                                        </div>
                                    </button>

                                    {openIndex === index && (
                                        <div className="space-y-6 px-6 pb-6">
                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                <DepthToggleButton
                                                    label={isUnlocked ? "Unlocked" : "Locked"}
                                                    isOn={isUnlocked}
                                                    onToggle={() => handleToggleUnlocked(module)}
                                                    disabled={toggleModuleUnlockMutation.isPending}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(module.idM)}
                                                    className="inline-flex items-center gap-2 rounded-depth-md border border-red-500/60 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                >
                                                    <img className="h-4 w-4" src={trashIcon} alt="Delete" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenModalEdit(module)}
                                                    className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                                >
                                                    <img className="edit-icon-filter h-4 w-4" src={editIcon} alt="Edit" />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold uppercase tracking-wide text-depth-secondary">
                                                    Pencapaian Pembelajaran
                                                </h4>
                                                <div className="rounded-depth-md border border-depth bg-depth-card p-4 text-sm text-depth-primary shadow-depth-sm">
                                                    {module.deskripsi ? (
                                                        <pre className="whitespace-pre-wrap break-words">
                                                            {module.deskripsi}
                                                        </pre>
                                                    ) : (
                                                        <p className="italic text-depth-secondary">
                                                            Belum ada poin pembelajaran.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h5 className="text-sm font-semibold uppercase tracking-wide text-depth-secondary">
                                                    Sumber Pembelajaran
                                                </h5>
                                                <div className="grid gap-2 md:grid-cols-3">
                                                    <ResourceLink href={module.ppt_link} icon={iconPPT} label="PPT" tone="green" />
                                                    <ResourceLink href={module.video_link} icon={iconVideo} label="Video" tone="red" />
                                                    <ResourceLink href={module.modul_link} icon={iconModule} label="Modul" tone="blue" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )
                }
            </div>

            {isModalOpenEdit && (
                <ButtonEditModule
                    onClose={handleCloseModalEdit}
                    modules={modules}
                    selectedModuleId={selectedModuleId}
                    onUpdate={handleModuleUpdate}
                />
            )}

            {isDeleteModalOpen && (
                <ModalOverlay onClose={handleCancelDelete} className="depth-modal-overlay z-50">
                    <div className="depth-modal-container max-w-sm text-center space-y-4">
                        <div className="depth-modal-header justify-center">
                            <h2 className="depth-modal-title">Konfirmasi Hapus</h2>
                            <ModalCloseButton onClick={handleCancelDelete} ariaLabel="Tutup konfirmasi hapus modul" />
                        </div>
                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus modul ini?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

function ResourceLink({ href, icon, label, tone }) {
    if (!href) {
        return (
            <span className="rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-secondary shadow-depth-sm">
                {label} belum tersedia
            </span>
        );
    }

    const toneBadge = {
        green: "bg-green-500/15 text-green-400",
        red: "bg-red-500/15 text-red-400",
        blue: "bg-blue-500/15 text-blue-400",
    }[tone];

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
        >
            <span className={`flex h-6 w-6 items-center justify-center rounded-depth-full ${toneBadge}`}>
                <img className="h-4 w-4" src={icon} alt={label} />
            </span>
            {label}
        </a>
    );
}
