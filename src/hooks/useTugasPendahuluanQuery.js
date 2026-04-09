import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const TUGAS_PENDAHULUAN_QUERY_KEY = ["tugas-pendahuluan"];

const normalisePayload = (data) => {
    if (Array.isArray(data)) {
        return {
            items: data,
            meta: {},
        };
    }

    if (Array.isArray(data?.data)) {
        return {
            items: data.data,
            meta: data.meta ?? {},
        };
    }

    return {
        items: [],
        meta: {},
    };
};

const fetchTugasPendahuluan = async () => {
    try {
        const { data } = await api.get("/api/tugas-pendahuluan");

        if (data?.success === false) {
            throw new Error(data?.message ?? "Gagal memuat tugas pendahuluan");
        }

        return normalisePayload(data);
    } catch (error) {
        if (error?.response?.status === 403 || error?.response?.status === 404) {
            return {
                items: [],
                meta: {},
            };
        }
        throw error;
    }
};

export const useTugasPendahuluanQuery = (options = {}) =>
    useQuery({
        queryKey: TUGAS_PENDAHULUAN_QUERY_KEY,
        queryFn: fetchTugasPendahuluan,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
