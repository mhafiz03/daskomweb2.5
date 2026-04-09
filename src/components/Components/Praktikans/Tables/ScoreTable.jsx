import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ModalPraktikanAnswers from '@/Components/Praktikans/Modals/ModalPraktikanAnswers';
import ModalNilaiComplaint from '@/Components/Praktikans/Modals/ModalNilaiComplaint';

export default function ScoreTable() {
    const nilaiQuery = useQuery({
        queryKey: ['nilai'],
        queryFn: async () => {
            const [{ data: nilaiData }, { data: modulData }, { data: asistenData }] = await Promise.all([
                api.get('/api/nilai/my'),
                api.get('/api/moduls'),
                api.get('/api/asistens').catch(() => ({ data: [] })),
            ]);

            const nilaiItems = Array.isArray(nilaiData) ? nilaiData : Array.isArray(nilaiData?.data) ? nilaiData.data : [];
            const modules = Array.isArray(modulData) ? modulData : Array.isArray(modulData?.data) ? modulData.data : [];
            const asistens = Array.isArray(asistenData) ? asistenData : Array.isArray(asistenData?.data) ? asistenData.data : [];
            const modulMap = new Map(modules.map((item) => [String(item?.id ?? item?.idM), item]));
            const asistenMap = new Map(asistens.map((item) => [String(item?.id), item]));

            return nilaiItems.map((item) => {
                const createdAt = item.created_at
                    ? new Date(item.created_at)
                    : item.createdAt
                        ? new Date(item.createdAt)
                        : null;
                const modulId = item.modul_id ?? item.modulId;
                const asistenId = item.asisten_id ?? item.asistenId;
                const modul = modulMap.get(String(modulId));
                const asisten = asistenMap.get(String(asistenId));

                return {
                    id: item.id ?? `${item.modul_id}-${item.praktikan_id}`,
                    nilaiId: item.id,
                    modulId,
                    tanggal: createdAt && !Number.isNaN(createdAt.getTime())
                        ? createdAt.toLocaleDateString('id-ID')
                        : '-',
                    modul: modul?.judul ?? modul?.name ?? `Modul ${modulId}`,
                    scores: {
                        tp: item.tp,
                        ta: item.ta,
                        d1: item.d1,
                        d2: item.d2,
                        d3: item.d3,
                        d4: item.d4,
                        i1: item.i1 ?? item.l1,
                        i2: item.i2 ?? item.l2,
                        avg: item.avg,
                    },
                    asisten: asisten?.nama ?? asisten?.name ?? 'Tidak diketahui',
                };
            });
        },
        refetchOnWindowFocus: false,
    });

    const rows = useMemo(() => nilaiQuery.data ?? [], [nilaiQuery.data]);
    const loading = nilaiQuery.isLoading || nilaiQuery.isFetching;
    const errorMessage = nilaiQuery.isError
        ? nilaiQuery.error?.response?.data?.message ?? nilaiQuery.error?.message ?? 'Failed to load score data'
        : null;

    const formatScore = (value) => {
        if (value === null || value === undefined) {
            return '-';
        }

        const numeric = Number(value);

        if (Number.isNaN(numeric)) {
            return value;
        }

        return Number.isInteger(numeric) ? numeric : numeric.toFixed(2);
    };

    const [modalState, setModalState] = useState(null);
    const [complaintModal, setComplaintModal] = useState(null);

    const Table = ({ rows, onOpenAnswers }) => {
        if (loading) {
            return (
                <div className="mt-6 flex h-[68vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]"></div>
                        <p className="text-depth-secondary">Loading scores...</p>
                    </div>
                </div>
            );
        }

        if (errorMessage) {
            return (
                <div className="mt-6 flex h-[68vh] items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500">{errorMessage}</p>
                        <button 
                            onClick={() => nilaiQuery.refetch()} 
                            className="mt-4 rounded-depth-md bg-[var(--depth-color-primary)] px-6 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        if (rows.length === 0) {
            return (
                <div className="mt-6 flex h-[68vh] items-center justify-center">
                    <p className="text-depth-secondary">No score data available</p>
                </div>
            );
        }

        return (
            <div className="mt-6 h-[68vh] overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-track-depth scrollbar-thumb-depth-secondary">
                <table className="min-w-[960px] w-full text-sm">
                    <thead className="bg-depth-interactive/80 text-depth-primary">
                        <tr className="text-xs font-semibold uppercase tracking-wide">
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Modul</th>
                            <th className="px-4 py-3 text-center">TP</th>
                            <th className="px-4 py-3 text-center">TA</th>
                            <th className="px-4 py-3 text-center">D1</th>
                            <th className="px-4 py-3 text-center">D2</th>
                            <th className="px-4 py-3 text-center">D3</th>
                            <th className="px-4 py-3 text-center">D4</th>
                            <th className="px-4 py-3 text-center">I1</th>
                            <th className="px-4 py-3 text-center">I2</th>
                            <th className="px-4 py-3 text-center">Rata-rata</th>
                            <th className="px-4 py-3 text-left">Asisten</th>
                            <th className="px-4 py-3 text-center">Jawaban</th>
                            <th className="px-4 py-3 text-center">Komplain</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-depth">
                        {rows.map((row) => (
                            <tr key={row.id} className="transition hover:bg-depth-interactive/50">
                                <td className="px-4 py-3 text-depth-primary">{row.tanggal}</td>
                                <td className="px-4 py-3 text-depth-primary">{row.modul}</td>
                                <td className="px-4 py-3 text-center font-semibold text-[var(--depth-color-primary)]">{formatScore(row.scores.tp)}</td>
                                <td className="px-4 py-3 text-center font-semibold text-[var(--depth-color-primary)]">{formatScore(row.scores.ta)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.d1)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.d2)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.d3)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.d4)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.i1)}</td>
                                <td className="px-4 py-3 text-center text-depth-primary">{formatScore(row.scores.i2)}</td>
                                <td className="px-4 py-3 text-center font-semibold text-[var(--depth-color-primary)]">{formatScore(row.scores.avg)}</td>
                                <td className="px-4 py-3 text-depth-secondary">{row.asisten}</td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => onOpenAnswers(row)}
                                        className="rounded-depth-md border border-depth bg-[var(--depth-color-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                    >
                                        <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                                stroke="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setComplaintModal({ nilaiId: row.id, modulTitle: row.modul, modulScore: row.scores.avg })}
                                        className="rounded-depth-md border border-red-500 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md dark:bg-red-900/20"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="2"
                                            stroke="currentColor"
                                            className="h-4 w-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="mx-auto w-full max-w-5xl rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
            <Table
                rows={rows}
                onOpenAnswers={(row) => setModalState({ modulId: row.modulId, modulTitle: row.modul })}
            />
            <ModalPraktikanAnswers
                isOpen={Boolean(modalState)}
                modulId={modalState?.modulId ?? null}
                modulTitle={modalState?.modulTitle ?? null}
                onClose={() => setModalState(null)}
            />
            <ModalNilaiComplaint
                isOpen={Boolean(complaintModal)}
                onClose={() => setComplaintModal(null)}
                nilaiId={complaintModal?.nilaiId}
                modulTitle={complaintModal?.modulTitle}
                modulScore={complaintModal?.modulScore}
            />
        </div>
    );
}
