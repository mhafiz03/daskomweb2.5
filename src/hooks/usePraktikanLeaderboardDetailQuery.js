import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const DETAIL_QUERY_KEY = "praktikan-leaderboard-detail";

const fetchPraktikanLeaderboardDetail = async ({ queryKey }) => {
    const [, praktikanId] = queryKey;

    if (!praktikanId) {
        return null;
    }

    const { data } = await api.get(`/api/praktikans/${praktikanId}`);
    const praktikan = data ?? null;

    return {
        praktikan,
        modules: [],
        summary: {
            nilai_count: 0,
            rating_count: 0,
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
