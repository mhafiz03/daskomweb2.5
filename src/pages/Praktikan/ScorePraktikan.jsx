import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PraktikanAuthenticated from "../../layouts/PraktikanAuthenticatedLayout";
import ScoreTable from "../../components/Components/Praktikans/Tables/ScoreTable";
import ScoreChart from "../../components/Components/Praktikans/Charts/ScoreChart";
import PraktikanUtilities from "../../components/Components/Praktikans/Layout/PraktikanUtilities";
import { getSession } from "../../lib/auth";

export default function ScorePraktikan() {
    const [viewMode, setViewMode] = useState("chart");

    const { data: session } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });
    const praktikan = session ?? null;

    return (
        <>
            <PraktikanAuthenticated
                user={praktikan}
                praktikan={praktikan}
                customWidth="w-[80%]"
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard
                    </h2>
                }
            >
                <div className="flex flex-col gap-6">
                    {/* <PraktikanPageHeader title="Nilai Praktikan" /> */}

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode("chart")}
                            className={`rounded-depth-md px-4 py-2 text-sm font-semibold transition ${
                                viewMode === "chart"
                                    ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                    : "border border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive/50"
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="mr-2 inline-block h-4 w-4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0 0v-4m0 4H17m6 4a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 0v4m0-4h4" />
                            </svg>
                            Grafik
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`rounded-depth-md px-4 py-2 text-sm font-semibold transition ${
                                viewMode === "table"
                                    ? "bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                    : "border border-depth bg-depth-card text-depth-primary hover:bg-depth-interactive/50"
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="mr-2 inline-block h-4 w-4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v4m-7 0h4m4 0h4" />
                            </svg>
                            Tabel
                        </button>
                    </div>

                    {viewMode === "chart" && <ScoreChart />}
                    {viewMode === "table" && <ScoreTable />}
                </div>
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
