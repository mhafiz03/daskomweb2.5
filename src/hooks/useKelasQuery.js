import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const KELAS_QUERY_KEY = ["kelas"];
export const GUESS_KELAS_QUERY_KEY = ["guess_kelas"];

export const fetchKelasGuess = async () => {
    try {
        const { data } = await api.get("/api/kelas/public");
        if (Array.isArray(data)) {
            return data;
        }
        if (Array.isArray(data?.kelas)) {
            return data.kelas;
        }
        if (data?.status === "success" && Array.isArray(data?.data)) {
            return data.data;
        }
        return [];
    } catch {
        return [];
    }
};

export const fetchKelas = async () => {
    const { data } = await api.get("/api/kelas");
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.kelas)) {
        return data.kelas;
    }
    if (data?.status === "success" && Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
};

export const useKelasQuery = (options = {}) =>
    useQuery({
        queryKey: KELAS_QUERY_KEY,
        queryFn: fetchKelas,
        staleTime: 5 * 60 * 1000,
        ...options,
    });

export const useKelasQueryGuess = (options = {}) =>
    useQuery({
        queryKey: GUESS_KELAS_QUERY_KEY,
        queryFn: fetchKelasGuess,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
