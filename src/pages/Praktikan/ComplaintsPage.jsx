import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import PraktikanAuthenticatedLayout from '../../layouts/PraktikanAuthenticatedLayout';

export default function ComplaintsPage() {
    const { data: complaintsData, isLoading } = useQuery({
        queryKey: ['nilai-complaints'],
        queryFn: async () => {
            const [{ data: complaintsRaw }, { data: nilaiRaw }, { data: modulRaw }, { data: asistenRaw }] = await Promise.all([
                api.get("/api/nilai/complaints"),
                api.get("/api/nilai/my"),
                api.get("/api/moduls"),
                api.get("/api/asistens").catch(() => ({ data: [] })),
            ]);

            const complaints = Array.isArray(complaintsRaw) ? complaintsRaw : Array.isArray(complaintsRaw?.data) ? complaintsRaw.data : [];
            const nilais = Array.isArray(nilaiRaw) ? nilaiRaw : Array.isArray(nilaiRaw?.data) ? nilaiRaw.data : [];
            const modules = Array.isArray(modulRaw) ? modulRaw : Array.isArray(modulRaw?.data) ? modulRaw.data : [];
            const asistens = Array.isArray(asistenRaw) ? asistenRaw : Array.isArray(asistenRaw?.data) ? asistenRaw.data : [];
            const nilaiMap = new Map(nilais.map((item) => [String(item?.id), item]));
            const modulMap = new Map(modules.map((item) => [String(item?.id ?? item?.idM), item]));
            const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));

            return complaints.map((complaint) => {
                const nilai = nilaiMap.get(String(complaint?.nilaiId ?? complaint?.nilai_id)) ?? null;
                const modul = nilai ? modulMap.get(String(nilai?.modulId ?? nilai?.modul_id)) ?? null : null;
                const asisten = nilai ? asistenMap.get(String(nilai?.asistenId ?? nilai?.asisten_id)) ?? null : null;

                return {
                    ...complaint,
                    created_at: complaint?.created_at ?? complaint?.createdAt ?? null,
                    nilai: nilai
                        ? {
                            ...nilai,
                            avg: nilai?.avg ?? null,
                            modul: modul
                                ? { ...modul, judul: modul?.judul ?? modul?.name ?? '-' }
                                : null,
                            asisten: asisten
                                ? { ...asisten, nama: asisten?.nama ?? asisten?.name ?? '-' }
                                : null,
                        }
                        : null,
                };
            });
        },
        refetchOnWindowFocus: false,
    });

    const complaints = useMemo(() => complaintsData ?? [], [complaintsData]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Menunggu' },
            resolved: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Terselesaikan' },
            rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Ditolak' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <PraktikanAuthenticatedLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
                        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                    </div>
                </div>
            </PraktikanAuthenticatedLayout>
        );
    }

    return (
        <PraktikanAuthenticatedLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Komplain Nilai</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Daftar semua komplain nilai yang telah Anda ajukan
                    </p>
                </div>

                {complaints.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center shadow dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-slate-600 dark:text-slate-400">Anda belum memiliki komplain nilai</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                className="rounded-lg border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {complaint.nilai?.modul?.judul}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Nilai: {complaint.nilai?.avg}
                                        </p>
                                    </div>
                                    {getStatusBadge(complaint.status)}
                                </div>

                                <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-700">
                                    <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white">
                                        {complaint.message}
                                    </p>
                                </div>

                                {complaint.notes && (
                                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/30">
                                        <div className="mb-2 flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                                            >
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                            <p className="font-medium text-emerald-800 dark:text-emerald-300">Respons Asisten</p>
                                        </div>
                                        <p className="whitespace-pre-wrap text-sm text-emerald-900 dark:text-emerald-100">
                                            {complaint.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Dibuat: {new Date(complaint.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Asisten: {complaint.nilai?.asisten?.nama}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PraktikanAuthenticatedLayout>
    );
}
