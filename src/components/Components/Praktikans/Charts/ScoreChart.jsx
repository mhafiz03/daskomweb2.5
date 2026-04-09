import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const ScoreChart = () => {
    const nilaiQuery = useQuery({
        queryKey: ['nilai'],
        queryFn: async () => {
            const { data } = await api.get('/api-v1/nilai');

            if (!Array.isArray(data?.nilai)) {
                return [];
            }

            return data.nilai.map((item) => {
                const createdAt = item.created_at ? new Date(item.created_at) : null;

                return {
                    id: item.id ?? `${item.modul_id}-${item.praktikan_id}`,
                    modulId: item.modul_id,
                    tanggal: createdAt && !Number.isNaN(createdAt.getTime())
                        ? createdAt.toLocaleDateString('id-ID')
                        : '-',
                    modul: item.modul?.judul ?? `Modul ${item.modul_id}`,
                    scores: {
                        tp: item.tp,
                        ta: item.ta,
                        d1: item.d1,
                        d2: item.d2,
                        d3: item.d3,
                        d4: item.d4,
                        l1: item.l1,
                        l2: item.l2,
                        avg: item.avg,
                    },
                    asisten: item.asisten?.nama ?? 'Tidak diketahui',
                };
            });
        },
        refetchOnWindowFocus: false,
    });

    const scores = useMemo(() => nilaiQuery.data ?? [], [nilaiQuery.data]);
    const loading = nilaiQuery.isLoading || nilaiQuery.isFetching;
    const errorMessage = nilaiQuery.isError
        ? nilaiQuery.error?.response?.data?.message ?? nilaiQuery.error?.message ?? 'Failed to load score data'
        : null;
    const [visibleLines, setVisibleLines] = useState({
        tp: true,
        ta: true,
        d1: true,
        d2: true,
        d3: true,
        d4: true,
        l1: true,
        l2: true,
        avg: true,
    });

    // Transform data for chart display
    const chartData = scores.map((score, index) => ({
        name: score.modul || `Module ${index + 1}`,
        date: score.tanggal,
        tp: score.scores?.tp || 0,
        ta: score.scores?.ta || 0,
        d1: score.scores?.d1 || 0,
        d2: score.scores?.d2 || 0,
        d3: score.scores?.d3 || 0,
        d4: score.scores?.d4 || 0,
        l1: score.scores?.l1 || 0,
        l2: score.scores?.l2 || 0,
        avg: score.scores?.avg || 0,
    }));

    const handleLegendClick = (data) => {
        setVisibleLines((prev) => ({
            ...prev,
            [data.dataKey]: !prev[data.dataKey],
        }));
    };

    // Define colors for each line
    const lineConfig = {
        tp: { color: '#ef4444', name: 'TP' },
        ta: { color: '#f97316', name: 'TA' },
        d1: { color: '#eab308', name: 'D1' },
        d2: { color: '#84cc16', name: 'D2' },
        d3: { color: '#22c55e', name: 'D3' },
        d4: { color: '#06b6d4', name: 'D4' },
        l1: { color: '#0ea5e9', name: 'I1' },
        l2: { color: '#6366f1', name: 'I2' },
        avg: { color: '#8b5cf6', name: 'Rata-rata' },
    };

    if (loading) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
                <div className="flex h-[400px] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]"></div>
                        <p className="text-depth-secondary">Loading chart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
                <div className="flex h-[400px] items-center justify-center">
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
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
                <p className="text-center text-depth-secondary">
                    Belum ada data nilai untuk ditampilkan
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
            <h3 className="mb-4 text-lg font-semibold text-depth-primary">
                Visualisasi Nilai Praktikan
            </h3>

            <div className="mb-4 flex flex-wrap gap-2">
                {Object.keys(lineConfig).map((key) => (
                    <button
                        key={key}
                        onClick={() =>
                            setVisibleLines((prev) => ({
                                ...prev,
                                [key]: !prev[key],
                            }))
                        }
                        className={`rounded-depth-md px-3 py-1 text-sm font-medium transition-all ${visibleLines[key]
                            ? 'bg-opacity-100 text-white'
                            : 'bg-depth-interactive text-depth-secondary'
                            }`}
                        style={{
                            backgroundColor: visibleLines[key]
                                ? lineConfig[key].color
                                : 'transparent',
                            borderWidth: '1px',
                            borderColor: lineConfig[key].color,
                        }}
                    >
                        {lineConfig[key].name}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--depth-border)"
                        opacity={0.3}
                    />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: 'var(--depth-text-secondary)', fontSize: 12 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: 'var(--depth-text-secondary)', fontSize: 12 }}
                        label={{
                            value: 'Nilai',
                            angle: -90,
                            position: 'insideLeft',
                            fill: 'var(--depth-text-secondary)',
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--depth-color-card)',
                            border: '1px solid var(--depth-border)',
                            borderRadius: '0.5rem',
                            color: 'var(--depth-text-primary)',
                        }}
                        labelStyle={{ color: 'var(--depth-text-primary)' }}
                        formatter={(value) => value.toFixed(2)}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        onClick={(e) => handleLegendClick(e)}
                    />

                    {visibleLines.tp && (
                        <Line
                            type="monotone"
                            dataKey="tp"
                            stroke={lineConfig.tp.color}
                            name={lineConfig.tp.name}
                            connectNulls
                            dot={{ fill: lineConfig.tp.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.ta && (
                        <Line
                            type="monotone"
                            dataKey="ta"
                            stroke={lineConfig.ta.color}
                            name={lineConfig.ta.name}
                            connectNulls
                            dot={{ fill: lineConfig.ta.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.d1 && (
                        <Line
                            type="monotone"
                            dataKey="d1"
                            stroke={lineConfig.d1.color}
                            name={lineConfig.d1.name}
                            connectNulls
                            dot={{ fill: lineConfig.d1.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.d2 && (
                        <Line
                            type="monotone"
                            dataKey="d2"
                            stroke={lineConfig.d2.color}
                            name={lineConfig.d2.name}
                            connectNulls
                            dot={{ fill: lineConfig.d2.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.d3 && (
                        <Line
                            type="monotone"
                            dataKey="d3"
                            stroke={lineConfig.d3.color}
                            name={lineConfig.d3.name}
                            connectNulls
                            dot={{ fill: lineConfig.d3.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.d4 && (
                        <Line
                            type="monotone"
                            dataKey="d4"
                            stroke={lineConfig.d4.color}
                            name={lineConfig.d4.name}
                            connectNulls
                            dot={{ fill: lineConfig.d4.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.l1 && (
                        <Line
                            type="monotone"
                            dataKey="l1"
                            stroke={lineConfig.l1.color}
                            name={lineConfig.l1.name}
                            connectNulls
                            dot={{ fill: lineConfig.l1.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.l2 && (
                        <Line
                            type="monotone"
                            dataKey="l2"
                            stroke={lineConfig.l2.color}
                            name={lineConfig.l2.name}
                            connectNulls
                            dot={{ fill: lineConfig.l2.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {visibleLines.avg && (
                        <Line
                            type="monotone"
                            dataKey="avg"
                            stroke={lineConfig.avg.color}
                            name={lineConfig.avg.name}
                            strokeWidth={2}
                            connectNulls
                            dot={{ fill: lineConfig.avg.color, r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ScoreChart;
