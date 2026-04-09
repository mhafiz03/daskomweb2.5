import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchSoalData } from "./useSoalAnalyticsShared";

export const soalAnalyticsQueryKey = (kategoriSoal, modulId) => [
    "soal-analytics",
    kategoriSoal ?? null,
    modulId ? String(modulId) : null,
];

export const useSoalAnalytics = (kategoriSoal, modulId, options = {}) => {
    const normalizedModuleId = modulId ? String(modulId) : null;
    const { enabled: userEnabled, ...restOptions } = options;

    return useQuery({
        queryKey: soalAnalyticsQueryKey(kategoriSoal, normalizedModuleId),
        queryFn: async () => fetchSoalData(kategoriSoal, normalizedModuleId),
        enabled: Boolean((kategoriSoal === "ta" || kategoriSoal === "tk") && normalizedModuleId) && (userEnabled ?? true),
        refetchOnWindowFocus: false,
        ...restOptions,
    });
};
