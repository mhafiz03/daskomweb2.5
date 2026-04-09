import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const PRAKTIKUM_HISTORY_QUERY_KEY = ["praktikum-history"];

const fetchPraktikumHistory = async () => {
    const [praktikumRes, modulRes, kelasRes, asistenRes] = await Promise.all([
        api.get("/api/praktikums"),
        api.get("/api/moduls"),
        api.get("/api/kelas"),
        api.get("/api/asistens").catch(() => ({ data: [] })),
    ]);

    const praktikums = Array.isArray(praktikumRes.data?.data) ? praktikumRes.data.data : Array.isArray(praktikumRes.data) ? praktikumRes.data : [];
    const moduls = Array.isArray(modulRes.data?.data) ? modulRes.data.data : Array.isArray(modulRes.data) ? modulRes.data : [];
    const kelas = Array.isArray(kelasRes.data?.data) ? kelasRes.data.data : Array.isArray(kelasRes.data) ? kelasRes.data : [];
    const asistens = Array.isArray(asistenRes.data?.data) ? asistenRes.data.data : Array.isArray(asistenRes.data) ? asistenRes.data : [];

    const modulMap = new Map(moduls.map((item) => [String(item?.id ?? item?.idM), item]));
    const kelasMap = new Map(kelas.map((item) => [String(item?.id), item]));
    const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));

    return praktikums
        .filter((item) => item?.endedAt || item?.reportSubmittedAt || item?.status === "ended")
        .sort((a, b) => new Date(b?.reportSubmittedAt ?? b?.endedAt ?? 0).getTime() - new Date(a?.reportSubmittedAt ?? a?.endedAt ?? 0).getTime())
        .map((item) => ({
            ...item,
            report_submitted_at: item?.reportSubmittedAt ?? item?.report_submitted_at ?? null,
            report_notes: item?.reportNotes ?? item?.report_notes ?? null,
            modul: modulMap.get(String(item?.modulId ?? item?.modul_id)) ?? null,
            kelas: kelasMap.get(String(item?.kelasId ?? item?.kelas_id)) ?? null,
            pj: asistenMap.get(String(item?.pjId ?? item?.pj_id)) ?? null,
            pj_id: item?.pjId ?? item?.pj_id ?? null,
        }));
};

export const usePraktikumHistoryQuery = (params = {}, options = {}) =>
    useQuery({
        queryKey: [...PRAKTIKUM_HISTORY_QUERY_KEY, params],
        queryFn: fetchPraktikumHistory,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
