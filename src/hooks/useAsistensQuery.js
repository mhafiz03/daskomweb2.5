import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ASISTENS_QUERY_KEY = ["asistens"];

const fetchAsistens = async () => {
    const { data } = await api.get("/api/asistens");

    const assistants = Array.isArray(data?.asisten)
        ? data.asisten
        : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
                ? data
                : [];

    if (Array.isArray(assistants)) {
        return assistants.map((assistant) => ({
            ...assistant,
            nama: assistant?.nama ?? assistant?.name ?? "",
            nomor_telepon: assistant?.nomor_telepon ?? assistant?.nomorTelepon ?? "",
            id_line: assistant?.id_line ?? assistant?.idLine ?? "",
            foto: assistant?.foto ?? assistant?.profilePicture ?? null,
            role: assistant?.role ?? assistant?.asistenRole ?? assistant?.roles?.[0]?.name ?? "",
        }));
    }

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat daftar asisten");
    }

    return [];
};

export const useAsistensQuery = (options = {}) =>
    useQuery({
        queryKey: ASISTENS_QUERY_KEY,
        queryFn: fetchAsistens,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
