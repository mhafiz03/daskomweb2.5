import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const UNMARKED_LAPORAN_QUERY_KEY = ["unmarked-laporan"];

export const useUnmarkedLaporanQuery = (options = {}) =>
    useQuery({
        queryKey: UNMARKED_LAPORAN_QUERY_KEY,
        queryFn: async () => {
            const [laporanRes, asistenRes] = await Promise.all([
                api.get("/api/laporan"),
                api.get("/api/asistens").catch(() => ({ data: [] })),
            ]);

            const laporan = Array.isArray(laporanRes.data?.data) ? laporanRes.data.data : Array.isArray(laporanRes.data) ? laporanRes.data : [];
            const asistens = Array.isArray(asistenRes.data?.data) ? asistenRes.data.data : Array.isArray(asistenRes.data) ? asistenRes.data : [];
            const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));

            const summary = new Map();
            laporan.forEach((item) => {
                const key = String(item?.asistenId ?? item?.asisten_id ?? "unassigned");
                const entry = summary.get(key) ?? {
                    asisten: key === "unassigned" ? { id: "unassigned", nama: "Belum ditugaskan", kode: "-" } : asistenMap.get(key) ?? { id: key, nama: `Asisten #${key}`, kode: "-" },
                    totals: { praktikan: 0, laporan: 0 },
                    praktikanIds: new Set(),
                };

                entry.totals.laporan += 1;
                entry.praktikanIds.add(String(item?.praktikanId ?? item?.praktikan_id ?? ""));
                entry.totals.praktikan = entry.praktikanIds.size;
                summary.set(key, entry);
            });

            return Array.from(summary.values())
                .map((item) => ({ ...item, praktikanIds: undefined }))
                .sort((a, b) => (b?.totals?.praktikan ?? 0) - (a?.totals?.praktikan ?? 0));
        },
        staleTime: 60 * 1000,
        ...options,
    });
