import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import { useManagePraktikanQuery, MANAGE_PRAKTIKAN_QUERY_KEY } from "@/hooks/useManagePraktikanQuery";
import { useKelasQuery } from "@/hooks/useKelasQuery";
import TableManagePraktikan from "../Tables/TableManagePraktikan";
import ModalUpsertPraktikan from "../Modals/ModalUpsertPraktikan";
import ModalDeletePraktikan from "../Modals/ModalDeletePraktikan";
import { send } from "@/lib/http";
import { destroy as destroyPraktikan } from "@/lib/routes/praktikan";


const DK_OPTIONS = ["DK1", "DK2"];

export default function ContentManagePraktikan() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [kelasFilter, setKelasFilter] = useState("");
    const [dkFilter, setDkFilter] = useState("");
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [modalState, setModalState] = useState({ mode: null, praktikan: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const kelasQuery = useKelasQuery();

    const queryParams = useMemo(
        () => ({
            page,
            perPage,
            search: searchTerm.trim(),
            kelasId: kelasFilter || null,
            dk: dkFilter || null,
        }),
        [page, perPage, searchTerm, kelasFilter, dkFilter],
    );

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useManagePraktikanQuery(queryParams, {
        keepPreviousData: true,
    });

    const praktikanItems = data?.items ?? [];
    const meta = data?.meta ?? null;

    useEffect(() => {
        if (!meta) {
            return;
        }

        const lastPage = meta.last_page ?? 1;

        if (page > lastPage && lastPage > 0) {
            setPage(lastPage);
        }
    }, [meta, page]);

    const kelasOptions = useMemo(() => {
        const raw = kelasQuery.data ?? [];

        return raw.map((kelas) => ({
            id: kelas?.id ?? kelas?.kelas_id ?? kelas?.id_kelas ?? kelas?.id,
            label: kelas?.kelas ?? kelas?.nama ?? `Kelas ${kelas?.id ?? ""}`,
        }));
    }, [kelasQuery.data]);

    const resetToolbar = useCallback(() => {
        setSearchTerm("");
        setKelasFilter("");
        setPage(1);
        setDkFilter("");
    }, []);

    useAssistantToolbar(
        useMemo(
            () => ({
                title: "Manage Praktikan",
                actions: [
                    {
                        id: "add-praktikan",
                        label: "+ Praktikan",
                        onClick: () => setModalState({ mode: "create", praktikan: null }),
                    },
                    // {
                    //     id: "reset-filter",
                    //     label: "Reset",
                    //     onClick: resetToolbar,
                    //     variant: "danger",
                    // },
                ],
                right: (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative min-w-[14rem]">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Cari nama, NIM, email..."
                                className="w-full rounded-depth-full border border-depth bg-depth-interactive py-2.5 pl-4 pr-11 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-depth-secondary">
                                🔍
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={kelasFilter}
                                onChange={(event) => {
                                    setKelasFilter(event.target.value);
                                    setPage(1);
                                }}
                                disabled={kelasQuery.isLoading}
                                className="rounded-depth-full border border-depth bg-depth-interactive px-4 py-2 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            >
                                <option value="">Semua Kelas</option>
                                {kelasOptions.map((kelas) => (
                                    <option key={kelas.id} value={kelas.id}>
                                        {kelas.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={dkFilter}
                                onChange={(event) => {
                                    setDkFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="rounded-depth-full border border-depth bg-depth-interactive px-4 py-2 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            >
                                <option value="">Semua DK</option>
                                {DK_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ),
            }),
            [resetToolbar, searchTerm, kelasFilter, kelasOptions, dkFilter],
        ),
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            setIsDeleting(true);
            await send(destroyPraktikan(deleteTarget.id));
            toast.success("Praktikan berhasil dihapus.");
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: [MANAGE_PRAKTIKAN_QUERY_KEY] });
        } catch (err) {
            const message = err?.response?.data?.message ?? err?.message ?? "Gagal menghapus praktikan.";
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    }, [deleteTarget, queryClient]);

    const closeModal = useCallback(() => setModalState({ mode: null, praktikan: null }), []);

    return (
        <section className="space-y-6">
            <TableManagePraktikan
                items={praktikanItems}
                meta={meta}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                error={error}
                onRetry={refetch}
                onEdit={(praktikan) => setModalState({ mode: "edit", praktikan })}
                onDelete={(praktikan) => setDeleteTarget(praktikan)}
                onPageChange={(nextPage) => setPage(nextPage)}
            />

            {modalState.mode && (
                <ModalUpsertPraktikan
                    mode={modalState.mode}
                    praktikan={modalState.praktikan}
                    kelasOptions={kelasQuery.data ?? []}
                    onClose={closeModal}
                />
            )}

            {deleteTarget && (
                <ModalDeletePraktikan
                    praktikan={deleteTarget}
                    onClose={() => {
                        if (isDeleting) {
                            return;
                        }
                        setDeleteTarget(null);
                        setIsDeleting(false);
                    }}
                    onConfirm={handleConfirmDelete}
                    isProcessing={isDeleting}
                />
            )}
        </section>
    );
}
