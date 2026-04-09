import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const JADWAL_JAGA_QUERY_KEY = "jadwal-jaga";

const fetchJadwalJaga = async (params = {}) => {
    const kelasId = params?.kelas_id ?? params?.kelasId ?? null;
    const [jadwalRes, kelasRes, asistenRes] = await Promise.all([
        api.get("/api/jadwal-jaga", { params: kelasId ? { kelasId } : {} }),
        api.get("/api/kelas"),
        api.get("/api/asistens"),
    ]);

    const rows = Array.isArray(jadwalRes.data?.data) ? jadwalRes.data.data : Array.isArray(jadwalRes.data) ? jadwalRes.data : [];
    const kelas = Array.isArray(kelasRes.data?.data) ? kelasRes.data.data : Array.isArray(kelasRes.data) ? kelasRes.data : [];
    const asistens = Array.isArray(asistenRes.data?.data) ? asistenRes.data.data : Array.isArray(asistenRes.data) ? asistenRes.data : [];

    const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));
    const grouped = new Map();

    rows.forEach((row) => {
        const key = String(row?.kelasId ?? row?.kelas_id ?? "");
        if (!key) {
            return;
        }

        const bucket = grouped.get(key) ?? [];
        bucket.push({
            ...row,
            asisten_id: row?.asisten_id ?? row?.asistenId ?? null,
            asisten: asistenMap.get(String(row?.asistenId ?? row?.asisten_id)) ?? null,
        });
        grouped.set(key, bucket);
    });

    return kelas
        .filter((item) => !kelasId || String(item?.id) === String(kelasId))
        .map((item) => ({
            ...item,
            id: item?.id,
            kelas: item?.kelas ?? item?.nama ?? "",
            jadwal_jagas: grouped.get(String(item?.id)) ?? [],
            asistens: (grouped.get(String(item?.id)) ?? []).map((entry) => entry.asisten).filter(Boolean),
        }));
};

export const useJadwalJagaQuery = (params = {}, options = {}) =>
    useQuery({
        queryKey: [JADWAL_JAGA_QUERY_KEY, params?.kelas_id ?? params?.kelasId ?? "all"],
        queryFn: () => fetchJadwalJaga(params),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
