import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { leaderboardDetail } from "@/lib/routes/leaderboard";

const DETAIL_QUERY_KEY = "praktikan-leaderboard-detail";

const fetchPraktikanLeaderboardDetail = async ({ queryKey }) => {
    const [, praktikanId] = queryKey;

    if (!praktikanId) {
        return null;
    }

    const descriptor = leaderboardDetail(praktikanId);
    const { data } = await api.get(descriptor.url);

    if (data?.status !== "success") {
        const message = data?.message ?? "Gagal memuat detail nilai praktikan";
        throw new Error(message);
    }

    return {
        praktikan: data.praktikan ?? null,
        modules: Array.isArray(data.modules) ? data.modules : [],
        summary: {
            nilai_count: data.summary?.nilai_count ?? 0,
            rating_count: data.summary?.rating_count ?? 0,
        },
    };
};

export const usePraktikanLeaderboardDetailQuery = (praktikanId, options = {}) => {
    const { enabled: enabledOption, ...restOptions } = options;

    return useQuery({
        queryKey: [DETAIL_QUERY_KEY, praktikanId],
        queryFn: fetchPraktikanLeaderboardDetail,
        enabled: Boolean(praktikanId) && (enabledOption ?? true),
        staleTime: 30_000,
        ...restOptions,
    });
};
