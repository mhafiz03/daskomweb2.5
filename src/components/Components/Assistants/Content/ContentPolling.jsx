import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import DropdownPolling from "../Dropdowns/DropdownPolling";
import TablePolling from "../Tables/TablePolling";
import PollingSummary from "../Sections/PollingSummary";
import ModalAddJenisPolling from "../Modals/ModalAddJenisPolling";

const ALLOWED_EDIT_ROLES = ['software', 'admin', 'kordas'];

export default function ContentPolling({ roleName = null }) {
    const queryClient = useQueryClient();
    const [pollingData, setPollingData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isAddJenisOpen, setIsAddJenisOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState("table"); // "table" or "summary"

    const canEdit = ALLOWED_EDIT_ROLES.includes(roleName?.toLowerCase());

    const handleSelectPolling = useCallback((data) => {
        setPollingData(data);
        setLoading(false);
    }, []);

    const handleCategoryChange = useCallback((categoryId) => {
        setSelectedCategory(categoryId);
        setPollingData([]);
        setLoading(Boolean(categoryId));
    }, []);

    const handleCategoriesLoaded = useCallback((items) => {
        setCategories(items);
        if ((!selectedCategory || selectedCategory === "") && Array.isArray(items) && items.length > 0) {
            handleCategoryChange(String(items[0].id));
        }
    }, [handleCategoryChange, selectedCategory]);

    const handleLoadingChange = useCallback((isBusy) => {
        setLoading(isBusy);
    }, []);

    const openAddJenisModal = useCallback(() => {
        setIsAddJenisOpen(true);
    }, []);

    const closeAddJenisModal = useCallback(() => {
        setIsAddJenisOpen(false);
    }, []);

    const handleJenisCreated = useCallback(async (newCategory) => {
        closeAddJenisModal();
        if (newCategory?.id) {
            const nextCategoryId = String(newCategory.id);
            queryClient.setQueryData(['jenis-polling'], (previous) => {
                if (!Array.isArray(previous)) {
                    return [newCategory];
                }

                const exists = previous.some((item) => item.id === newCategory.id);
                if (exists) {
                    return previous;
                }

                return [...previous, newCategory];
            });
            handleCategoryChange(nextCategoryId);
            await queryClient.invalidateQueries({ queryKey: ['jenis-polling'] });
            await queryClient.invalidateQueries({ queryKey: ['polling', nextCategoryId] });
        } else {
            await queryClient.invalidateQueries({ queryKey: ['jenis-polling'] });
        }
    }, [closeAddJenisModal, handleCategoryChange, queryClient]);

    const handleRefresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['jenis-polling'] });
        await queryClient.invalidateQueries({ queryKey: ['polling'] });
        await queryClient.invalidateQueries({ queryKey: ['polling-summary'] });
    }, [queryClient]);

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === "table" ? "summary" : "table");
    }, []);

    const toolbarConfig = useMemo(
        () => {
            const actions = [
                {
                    id: "refresh-polling",
                    label: loading ? "Loading..." : "Refresh",
                    icon: "↻",
                    variant: "secondary",
                    onClick: handleRefresh,
                    disabled: loading,
                },
            ];

            if (canEdit) {
                actions.unshift({
                    id: "add-jenis-polling",
                    label: "Tambah Jenis Polling",
                    variant: "primary",
                    onClick: openAddJenisModal,
                });
            }

            return {
                title: "Polling Assistant",
                actions,
            };
        },
        [canEdit, handleRefresh, loading, openAddJenisModal],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section>
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                    {viewMode === "table" &&
                        <DropdownPolling
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            onSelectPolling={handleSelectPolling}
                            onCategoriesLoaded={handleCategoriesLoaded}
                            onLoadingChange={handleLoadingChange}
                            canEdit={canEdit}
                        />
                    }
                </div>
                <button
                    type="button"
                    onClick={toggleViewMode}
                    className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-card px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
                >
                    {viewMode === "table" ? (
                        <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Lihat Ringkasan
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Lihat Tabel
                        </>
                    )}
                </button>
            </div>

            {/* Table or Summary view */}
            <div className="">
                {viewMode === "table" ? (
                    loading ? (
                        <div className="flex items-center justify-center py-12 text-center">
                            <div className="text-center">
                                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]"></div>
                                <p className="text-depth-secondary">Loading...</p>
                            </div>
                        </div>
                    ) : (
                        <TablePolling data={pollingData} />
                    )
                ) : (
                    <PollingSummary categories={categories} />
                )}
            </div>

            {canEdit && isAddJenisOpen ? (
                <ModalAddJenisPolling
                    onClose={closeAddJenisModal}
                    onSuccess={handleJenisCreated}
                    existingCategories={categories}
                />
            ) : null}
        </section>
    );
}
