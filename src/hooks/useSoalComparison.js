import { useQuery, useQueryClient } from "@tanstack/react-query";
import { soalQueryKey } from "./useSoalQuery";
import { api } from "@/lib/api";

const normalizeModuleId = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return String(value);
};

export const soalComparisonQueryKey = (kategoriSoal, regularModuleId, englishModuleId) => [
    "soal-comparison",
    kategoriSoal ?? null,
    normalizeModuleId(regularModuleId),
    normalizeModuleId(englishModuleId),
];

export const useSoalComparison = (kategoriSoal, regularModuleId, englishModuleId, options = {}) => {
    const queryClient = useQueryClient();
    const normalizedRegularId = normalizeModuleId(regularModuleId);
    const normalizedEnglishId = normalizeModuleId(englishModuleId);
    const { enabled: userEnabled, ...restOptions } = options;

    return useQuery({
        queryKey: soalComparisonQueryKey(kategoriSoal, normalizedRegularId, normalizedEnglishId),
        queryFn: async () => {
            const fetchDataset = async (moduleId) => {
                if (!moduleId) {
                    return null;
                }

                const existing = queryClient.getQueryData(soalQueryKey(kategoriSoal, moduleId));
                if (existing) {
                    return { modulId: moduleId, items: existing };
                }

                const { data } = await api.get(`/api/soal/${kategoriSoal}`, { params: { modulId: moduleId } });
                const payload = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                queryClient.setQueryData(soalQueryKey(kategoriSoal, moduleId), payload);
                return { modulId: moduleId, items: payload };
            };

            const [regular, english] = await Promise.all([
                fetchDataset(normalizedRegularId),
                fetchDataset(normalizedEnglishId),
            ]);

            return { regular, english };
        },
        enabled: Boolean(kategoriSoal && (normalizedRegularId || normalizedEnglishId)) && (userEnabled ?? true),
        refetchOnWindowFocus: false,
        ...restOptions,
    });
};
