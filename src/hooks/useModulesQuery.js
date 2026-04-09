import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const MODULES_QUERY_KEY = ["modules"];

export const fetchModules = async () => {
    const { data } = await api.get("/api/moduls");

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat daftar modul");
    }

    return [];
};

export const useModulesQuery = (options = {}) =>
    useQuery({
        queryKey: MODULES_QUERY_KEY,
        queryFn: fetchModules,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
