import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import deleteIcon from "../../../../assets/nav/Icon-Delete.svg";

const noop = () => { };

export default function DropdownPolling({
    value = "",
    onChange = noop,
    onSelectPolling = noop,
    onCategoriesLoaded = noop,
    onLoadingChange = noop,
    canEdit = false,
}) {
    const [selectedCategory, setSelectedCategory] = useState(value ?? "");
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const onSelectPollingRef = useRef(onSelectPolling);
    const onCategoriesLoadedRef = useRef(onCategoriesLoaded);
    const onLoadingChangeRef = useRef(onLoadingChange);

    // Update refs when callbacks change
    useEffect(() => {
        onSelectPollingRef.current = onSelectPolling;
        onCategoriesLoadedRef.current = onCategoriesLoaded;
        onLoadingChangeRef.current = onLoadingChange;
    }, [onSelectPolling, onCategoriesLoaded, onLoadingChange]);

    useEffect(() => {
        setSelectedCategory(value ?? "");
    }, [value]);

    const categoriesQuery = useQuery({
        queryKey: ['jenis-polling'],
        queryFn: async () => {
            const { data } = await api.get('/api/jenis-polling');
            if (data?.status === 'success') {
                return data.categories ?? [];
            }
            throw new Error(data?.message ?? 'Gagal memuat kategori polling');
        },
    });

    const categories = categoriesQuery.data ?? [];

    useEffect(() => {
        if (categories.length > 0) {
            onCategoriesLoadedRef.current(categories);
        }
    }, [categories]);

    const pollsQuery = useQuery({
        queryKey: ['polling', selectedCategory],
        enabled: Boolean(selectedCategory),
        queryFn: async () => {
            const { data } = await api.get(`/api/polling/${selectedCategory}`);
            if (data?.status === 'success') {
                return data.polling ?? [];
            }
            throw new Error(data?.message ?? 'Gagal memuat polling');
        },
        refetchOnWindowFocus: false,
    });

    // Update polling data when query succeeds or fails
    useEffect(() => {
        if (pollsQuery.isSuccess && pollsQuery.data) {
            onSelectPollingRef.current(pollsQuery.data);
        } else if (pollsQuery.isError) {
            console.error('Error fetching polling data:', pollsQuery.error);
            onSelectPollingRef.current([]);
        }
    }, [pollsQuery.isSuccess, pollsQuery.isError, pollsQuery.data, pollsQuery.error]);

    const isBusy = useMemo(
        () => pollsQuery.isFetching || categoriesQuery.isLoading,
        [categoriesQuery.isLoading, pollsQuery.isFetching],
    );

    useEffect(() => {
        onLoadingChangeRef.current(isBusy);
    }, [isBusy]);

    useEffect(() => {
        if (!selectedCategory) {
            onSelectPollingRef.current([]);
        }
    }, [selectedCategory]);

    // Fetch polling data when category is selected
    const handleCategoryChange = async (e) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        onChange(categoryId);
        if (!categoryId) {
            onSelectPollingRef.current([]);
        }
    };

    const selectedCategoryData = useMemo(
        () => categories.find((category) => String(category.id) === String(selectedCategory)) ?? null,
        [categories, selectedCategory],
    );

    const handleOpenDeleteModal = () => {
        if (!selectedCategoryData) {
            toast.error("Pilih jenis polling terlebih dahulu.");
            return;
        }

        setDeleteCandidate(selectedCategoryData);
    };

    const handleConfirmDelete = async () => {
        if (!deleteCandidate || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await api.delete(`/api/jenis-polling/${deleteCandidate.id}`);
            toast.success("Jenis polling berhasil dihapus.");
            setDeleteCandidate(null);
            setSelectedCategory("");
            onChange("");
            onSelectPollingRef.current([]);
            await categoriesQuery.refetch();
        } catch (error) {
            const message = error?.response?.data?.message ?? "Gagal menghapus jenis polling.";
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        if (!isDeleting) {
            setDeleteCandidate(null);
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-depth-secondary">
                    Jenis Polling
                </span>
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="min-w-[220px] appearance-none rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    >
                        <option value="">Pilih Jenis Polling</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.judul}
                            </option>
                        ))}
                    </select>
                    {isBusy && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-depth-secondary">Memuat…</span>}
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenDeleteModal}
                        disabled={!selectedCategory || isBusy}
                        className="inline-flex items-center gap-2 rounded-depth-md border border-red-500/60 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <img src={deleteIcon} alt="" className="h-4 w-4" />
                    </button>
                )}
            </div>

            {deleteCandidate && (
                <ModalOverlay onClose={handleCancelDelete} className="depth-modal-overlay z-[70]">
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className="depth-modal-title text-center">Hapus Jenis Polling</h3>
                            <ModalCloseButton onClick={handleCancelDelete} ariaLabel="Tutup konfirmasi hapus jenis polling" />
                        </div>
                        <p className="text-sm text-depth-secondary">
                            Apakah Anda yakin ingin menghapus jenis polling{" "}
                            <span className="font-semibold text-depth-primary">{deleteCandidate.judul}</span>?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDeleting ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
