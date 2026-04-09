import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const LEADERBOARD_QUERY_KEY = "praktikan-leaderboard";

const fetchPraktikanLeaderboard = async ({ queryKey }) => {
    const [, filters = {}] = queryKey;
    const params = {};

    if (filters.modulId) {
        params.modulId = filters.modulId;
    }

    const { data } = await api.get("/api/nilai/leaderboard", { params });
    const rows = Array.isArray(data) ? data : Array.isArray(data?.leaderboard) ? data.leaderboard : [];

    let items = rows.map((row) => ({
        praktikan_id: row.praktikanId ?? row.praktikan_id ?? row.id,
        nama: row.name ?? row.nama ?? "-",
        nim: row.nim ?? "-",
        kelas: row.kelas ?? "-",
        average_nilai: row.avg ?? row.average_nilai ?? 0,
        average_rating: row.average_rating ?? 0,
        last_submitted_at: row.last_submitted_at ?? null,
    }));

    if (filters.kelas_id) {
        items = items.filter((item) => String(item.kelas ?? "") === String(filters.kelas_id));
    }

    if (filters.limit) {
        items = items.slice(0, Number(filters.limit));
    }

    return {
        items,
        message: null,
    };
};

export const usePraktikanLeaderboardQuery = (filters = {}, options = {}) =>
    useQuery({
        queryKey: [LEADERBOARD_QUERY_KEY, filters],
        queryFn: fetchPraktikanLeaderboard,
        staleTime: 60 * 1000,
        ...options,
    });
