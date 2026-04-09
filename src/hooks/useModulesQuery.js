import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const MODULES_QUERY_KEY = ["modules"];

export const fetchModules = async () => {
    const { data } = await api.get("/api/moduls");
    const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    if (Array.isArray(items)) {
        return items.map((module) => ({
            ...module,
            idM: module?.idM ?? module?.id,
            judul: module?.judul ?? module?.nama ?? "",
            deskripsi: module?.deskripsi ?? "",
            modul_link: module?.modul_link ?? module?.modulLink ?? "",
            ppt_link: module?.ppt_link ?? module?.pptLink ?? "",
            video_link: module?.video_link ?? module?.videoLink ?? "",
        }));
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
