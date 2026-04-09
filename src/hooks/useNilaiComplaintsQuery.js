import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const NILAI_COMPLAINTS_QUERY_KEY = ["nilai-complaints-asisten"];

const toArray = (value) => (Array.isArray(value) ? value : []);

export function useNilaiComplaintsQuery(options = {}) {
    return useQuery({
        queryKey: NILAI_COMPLAINTS_QUERY_KEY,
        queryFn: async () => {
            const [sessionRes, complaintsRes, nilaiRes, praktikanRes, moduleRes, asistenRes] = await Promise.all([
                api.get("/api/auth/me").catch(() => ({ data: { user: null } })),
                api.get("/api/nilai/complaints"),
                api.get("/api/nilai"),
                api.get("/api/praktikans", { params: { per_page: 500 } }),
                api.get("/api/moduls"),
                api.get("/api/asistens").catch(() => ({ data: [] })),
            ]);
            const sessionUser = sessionRes.data?.user ?? null;

            const complaints = toArray(complaintsRes.data?.data ?? complaintsRes.data);
            const nilais = toArray(nilaiRes.data?.data ?? nilaiRes.data);
            const praktikans = toArray(praktikanRes.data?.data ?? praktikanRes.data);
            const modules = toArray(moduleRes.data?.data ?? moduleRes.data);
            const asistens = toArray(asistenRes.data?.data ?? asistenRes.data);

            const nilaiMap = new Map(nilais.map((item) => [String(item?.id), item]));
            const praktikanMap = new Map(praktikans.map((item) => [String(item?.id), item]));
            const moduleMap = new Map(modules.map((item) => [String(item?.id ?? item?.idM), item]));
            const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));

            return complaints.map((complaint) => {
                const nilai = nilaiMap.get(String(complaint?.nilaiId ?? complaint?.nilai_id)) ?? null;
                const praktikan = praktikanMap.get(String(complaint?.praktikanId ?? complaint?.praktikan_id)) ?? null;
                const modul = nilai ? moduleMap.get(String(nilai?.modulId ?? nilai?.modul_id)) ?? null : null;
                const asisten = nilai ? asistenMap.get(String(nilai?.asistenId ?? nilai?.asisten_id)) ?? null : null;

                return {
                    ...complaint,
                    nilai_id: complaint?.nilai_id ?? complaint?.nilaiId ?? null,
                    created_at: complaint?.created_at ?? complaint?.createdAt ?? null,
                    updated_at: complaint?.updated_at ?? complaint?.updatedAt ?? null,
                    praktikan: praktikan
                        ? {
                            ...praktikan,
                            name: praktikan?.name ?? praktikan?.nama ?? "",
                            nama: praktikan?.nama ?? praktikan?.name ?? "",
                        }
                        : null,
                    nilai: nilai
                        ? {
                            ...nilai,
                            rata_rata: nilai?.rata_rata ?? nilai?.avg ?? null,
                            modul: modul
                                ? {
                                    ...modul,
                                    judul: modul?.judul ?? modul?.name ?? "",
                                }
                                : null,
                            asisten: asisten
                                ? {
                                    ...asisten,
                                    nama: asisten?.nama ?? asisten?.name ?? "",
                                }
                                : null,
                        }
                        : null,
                };
            }).filter((complaint) => {
                if (!sessionUser?.id) {
                    return true;
                }

                return String(complaint?.nilai?.asistenId ?? complaint?.nilai?.asisten_id ?? "") === String(sessionUser.id);
            });
        },
        staleTime: 1000 * 60 * 5,
        ...options,
    });
}
