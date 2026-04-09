import { useNavigate } from "react-router-dom";
import MarkdownRenderer from "../../MarkdownRenderer";

export default function ContentLihatTP({ jawabanData, praktikan, modul }) {
    const navigate = useNavigate();
    // Check if we have data to display
    const hasData = jawabanData && jawabanData.length > 0;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-deepForestGreen dark:text-green-400">Jawaban TP</h1>
                    <button
                        onClick={() => navigate("/lihat-tp")}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                        Kembali
                    </button>
                </div>

                {/* Practical Info Section */}
                {praktikan && modul && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded mb-6 space-y-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            Nama Praktikan: <span className="font-normal">{praktikan.nama}</span>
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            NIM: <span className="font-normal">{praktikan.nim}</span>
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            Modul: <span className="font-normal">{modul.judul}</span>
                        </p>
                    </div>
                )}

                {/* Questions & Answers Section */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {hasData ? (
                        jawabanData.map((item, index) => (
                            <div
                                key={item.soal_id}
                                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                            >
                                <div className="flex font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100 gap-2">
                                    <span>{index + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                        <MarkdownRenderer content={item.soal_text} />
                                    </div>
                                </div>
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700 shadow-inner">
                                    <div className="text-gray-800 dark:text-gray-200 overflow-x-auto min-w-0">
                                        {item.jawaban ? (
                                            <MarkdownRenderer content={item.jawaban} />
                                        ) : (
                                            "Tidak ada jawaban"
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">
                                Belum ada jawaban yang tersubmit untuk modul ini
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
