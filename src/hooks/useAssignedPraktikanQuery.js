import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ASSIGNED_PRAKTIKAN_QUERY_KEY = ["assigned-praktikan"];

const toArray = (value) => (Array.isArray(value) ? value : []);

const latestByKey = (items, keyBuilder) => {
    const map = new Map();

    items.forEach((item) => {
        const key = keyBuilder(item);
        if (!key) {
            return;
        }

        const current = map.get(key);
        const currentTime = new Date(current?.updatedAt ?? current?.createdAt ?? 0).getTime();
        const nextTime = new Date(item?.updatedAt ?? item?.createdAt ?? 0).getTime();

        if (!current || nextTime >= currentTime) {
            map.set(key, item);
        }
    });

    return map;
};

const fetchAssignedPraktikan = async () => {
    const [sessionRes, praktikumsRes, praktikansRes, modulesRes, kelasRes, nilaisRes, laporanRes] = await Promise.all([
        api.get("/api/auth/me").catch(() => ({ data: { user: null } })),
        api.get("/api/praktikums"),
        api.get("/api/praktikans", { params: { per_page: 500 } }),
        api.get("/api/moduls"),
        api.get("/api/kelas"),
        api.get("/api/nilai"),
        api.get("/api/laporan").catch(() => ({ data: [] })),
    ]);
    const sessionUser = sessionRes.data?.user ?? null;

    const praktikums = toArray(praktikumsRes.data).filter(
        (item) => item?.isActive || item?.status === "ongoing",
    );
    const praktikans = toArray(praktikansRes.data?.data ?? praktikansRes.data);
    const modules = toArray(modulesRes.data?.data ?? modulesRes.data);
    const kelas = toArray(kelasRes.data?.data ?? kelasRes.data);
    const nilais = toArray(nilaisRes.data?.data ?? nilaisRes.data);
    const laporans = toArray(laporanRes.data?.data ?? laporanRes.data);

    const kelasMap = new Map(kelas.map((item) => [String(item?.id), item]));
    const moduleMap = new Map(modules.map((item) => [String(item?.id ?? item?.idM), item]));
    const praktikanByClass = praktikans.reduce((acc, item) => {
        const key = String(item?.kelasId ?? item?.kelas_id ?? "");
        if (!key) {
            return acc;
        }

        const bucket = acc.get(key) ?? [];
        bucket.push(item);
        acc.set(key, bucket);
        return acc;
    }, new Map());

    const latestNilaiMap = latestByKey(
        nilais,
        (item) => `${item?.praktikanId ?? item?.praktikan_id}:${item?.modulId ?? item?.modul_id}`,
    );
    const latestLaporanMap = latestByKey(
        laporans,
        (item) => `${item?.praktikanId ?? item?.praktikan_id}:${item?.modulId ?? item?.modul_id}`,
    );

    return praktikums.flatMap((praktikum) => {
        const classKey = String(praktikum?.kelasId ?? praktikum?.kelas_id ?? "");
        const modulKey = String(praktikum?.modulId ?? praktikum?.modul_id ?? "");
        const practicumStudents = praktikanByClass.get(classKey) ?? [];
        const kelasItem = kelasMap.get(classKey) ?? null;
        const modulItem = moduleMap.get(modulKey) ?? null;
        const timestamp = praktikum?.updatedAt ?? praktikum?.startedAt ?? praktikum?.createdAt ?? null;

        return practicumStudents.map((praktikan) => {
            const key = `${praktikan?.id}:${modulKey}`;
            const nilai = latestNilaiMap.get(key) ?? null;
            const laporan = latestLaporanMap.get(key) ?? null;

            return {
                id: key,
                praktikan: {
                    ...praktikan,
                    nama: praktikan?.nama ?? praktikan?.name ?? "",
                    kelas: kelasItem
                        ? {
                            ...kelasItem,
                            nama: kelasItem?.nama ?? kelasItem?.kelas ?? "",
                        }
                        : null,
                },
                modul: {
                    ...modulItem,
                    judul: modulItem?.judul ?? modulItem?.nama ?? modulItem?.name ?? "",
                },
                nilai: nilai
                    ? {
                        ...nilai,
                        i1: nilai?.i1 ?? nilai?.l1,
                        i2: nilai?.i2 ?? nilai?.l2,
                    }
                    : null,
                pesan: laporan?.pesan ?? "",
                rating_praktikum: laporan?.ratingPraktikum ?? laporan?.rating_praktikum ?? null,
                rating_asisten: laporan?.ratingAsisten ?? laporan?.rating_asisten ?? null,
                datetime: {
                    date: timestamp,
                    time: timestamp,
                },
                timestamps: {
                    created_at: praktikum?.createdAt ?? null,
                    updated_at: timestamp,
                },
            };
        });
    }).filter((assignment) => {
        if (!sessionUser?.id) {
            return true;
        }

        const nilaiAsistenId = assignment?.nilai?.asistenId ?? assignment?.nilai?.asisten_id ?? null;
        const laporanAsistenId = assignment?.asistenId ?? assignment?.asisten_id ?? null;

        return (
            String(nilaiAsistenId ?? laporanAsistenId ?? sessionUser.id) === String(sessionUser.id)
        );
    });
};

export const useAssignedPraktikanQuery = (options = {}) =>
    useQuery({
        queryKey: ASSIGNED_PRAKTIKAN_QUERY_KEY,
        queryFn: fetchAssignedPraktikan,
        staleTime: 60 * 1000,
        ...options,
    });
