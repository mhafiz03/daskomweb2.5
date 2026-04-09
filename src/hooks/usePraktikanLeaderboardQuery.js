import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { leaderboardIndex } from "@/lib/routes/leaderboard";

const LEADERBOARD_QUERY_KEY = "praktikan-leaderboard";

const fetchPraktikanLeaderboard = async ({ queryKey }) => {
    const [, filters = {}] = queryKey;
    const { data } = await api.get(leaderboardIndex.url({ query: filters }));

    if (data?.status !== "success") {
        const message = data?.message ?? "Gagal memuat leaderboard praktikan";
        throw new Error(message);
    }

    const rows = Array.isArray(data?.leaderboard) ? data.leaderboard : [];

    return {
        items: rows.map((row) => ({
            praktikan_id: row.praktikanId ?? row.praktikan_id ?? row.id,
            nama: row.name ?? row.nama ?? "-",
            nim: row.nim ?? "-",
            kelas: row.kelas ?? "-",
            average_nilai: row.avg ?? row.average_nilai ?? 0,
            average_rating: row.average_rating ?? 0,
            nilai_count: row.nilai_count ?? 0,
            rating_count: row.rating_count ?? 0,
            last_submitted_at: row.last_submitted_at ?? null,
        })),
        message: data.message ?? null,
    };
};

export const usePraktikanLeaderboardQuery = (filters = {}, options = {}) =>
    useQuery({
        queryKey: [LEADERBOARD_QUERY_KEY, filters],
        queryFn: fetchPraktikanLeaderboard,
        staleTime: 60 * 1000,
        ...options,
    });
