import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PollingSummary({ categories = [] }) {
    const summaryQuery = useQuery({
        queryKey: ['polling-summary', categories.map(c => c.id).join(',')],
        enabled: categories.length > 0,
        queryFn: async () => {
            // Fetch all polling data for each category
            const results = await Promise.all(
                categories.map(async (category) => {
                    try {
                        const { data } = await api.get(`/api/polling/${category.id}`);
                        if (data?.status === 'success') {
                            const polling = data.polling ?? [];
                            // Get top 3
                            const top3 = polling.slice(0, 3);
                            return {
                                category,
                                top3,
                            };
                        }
                        return { category, top3: [] };
                    } catch (error) {
                        console.error(`Error fetching polling for ${category.judul}:`, error);
                        return { category, top3: [] };
                    }
                })
            );
            return results;
        },
        refetchOnWindowFocus: false,
    });

    if (summaryQuery.isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]"></div>
                    <p className="text-depth-secondary">Memuat ringkasan...</p>
                </div>
            </div>
        );
    }

    if (summaryQuery.isError) {
        return (
            <div className="rounded-depth-lg border border-red-300 bg-red-50 p-6 text-center shadow-depth-md">
                <p className="text-red-600">Gagal memuat ringkasan polling</p>
            </div>
        );
    }

    const summaryData = summaryQuery.data ?? [];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {summaryData.map(({ category, top3 }) => (
                    <div
                        key={category.id}
                        className="rounded-depth-lg border border-depth bg-depth-card p-5 shadow-depth-lg transition-all hover:shadow-depth-lg"
                    >
                        <h3 className="mb-4 text-lg font-bold text-[var(--depth-color-primary)]">
                            {category.judul}
                        </h3>

                        {top3.length > 0 ? (
                            <div className="space-y-3">
                                {top3.map((asisten, index) => (
                                    <div
                                        key={asisten.id ?? index}
                                        className="flex items-center gap-4 rounded-depth-md border border-depth bg-depth p-3 shadow-depth-sm"
                                    >
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--depth-color-primary)] text-lg font-bold text-white shadow-depth-md">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-depth-primary">
                                                {asisten.nama ?? "-"}
                                            </div>
                                            <div className="text-sm text-depth-secondary">
                                                {asisten.kode ?? "-"}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 rounded-depth-md bg-[var(--depth-color-primary)] px-3 py-1 text-sm font-bold text-white shadow-depth-sm">
                                            {asisten.total ?? 0} votes
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-depth-md border border-depth bg-depth p-6 text-center text-depth-secondary">
                                Tidak ada data polling untuk kategori ini
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {summaryData.length === 0 && (
                <div className="rounded-depth-lg border border-depth bg-depth-card p-8 text-center shadow-depth-lg">
                    <p className="text-depth-secondary">Tidak ada kategori polling tersedia</p>
                </div>
            )}
        </div>
    );
}
