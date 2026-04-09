import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const fetchJawabanTp = async ({ nim, modulId }) => {
    if (!nim || !modulId) {
        return null;
    }

    const { data } = await api.get(`/api-v1/jawaban-tp/${nim}/${modulId}`);

    if (data?.success === false) {
        throw new Error(data?.message ?? "Gagal memuat jawaban TP");
    }

    return data?.data ?? null;
};

export default function ModalJawabanTP({ onClose, nim, modulId, assignment }) {
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["jawaban-tp", nim, modulId],
        queryFn: () => fetchJawabanTp({ nim, modulId }),
        enabled: Boolean(nim && modulId),
    });

    const praktikan = data?.praktikan ?? assignment?.praktikan ?? null;
    const modul = data?.modul ?? assignment?.modul ?? null;
    const jawabanList = data?.jawabanData ?? [];

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container max-w-6xl" style={{ "--depth-modal-max-width": "56rem" }}>
                <div className="depth-modal-header">
                    <div className="flex-1 text-center">
                        <h3 className="depth-modal-title">Jawaban Tugas Pendahuluan</h3>
                        <p className="mt-1 text-sm text-depth-secondary">
                            {praktikan?.nim ?? "-"} · {praktikan?.nama ?? "Praktikan"}
                        </p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-depth-secondary">
                            {modul?.judul ?? "Modul tidak ditemukan"}
                        </p>
                    </div>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup jawaban TP" />
                </div>

                <div className="max-h-[32rem] overflow-y-auto pr-1">
                    {!nim || !modulId ? (
                        <div className="py-10 text-center text-depth-secondary">
                            Data praktikan atau modul tidak lengkap.
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-depth-primary">
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--depth-color-primary)] border-t-transparent" />
                            Memuat jawaban...
                        </div>
                    ) : isError ? (
                        <div className="py-10 text-center text-red-500">
                            {error?.message ?? "Gagal memuat jawaban."}
                        </div>
                    ) : jawabanList.length === 0 ? (
                        <div className="py-10 text-center text-depth-secondary">
                            Belum ada jawaban yang disubmit untuk modul ini.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jawabanList.map((item, index) => (
                                <article
                                    key={`${item.soal_id}-${index}`}
                                    className="rounded-depth-lg border border-depth bg-depth-card p-5 shadow-depth-md transition-shadow hover:shadow-depth-lg"
                                >
                                    <h4 className="mb-3 text-md font-semibold text-depth-primary">
                                        {index + 1}. {item.soal_text ?? "Soal tidak tersedia"}
                                    </h4>
                                    <div className="rounded-depth-md border border-depth bg-depth-interactive/40 p-4 text-depth-primary shadow-depth-sm">
                                        {item.jawaban && item.jawaban !== "-" ? (
                                            <pre className="whitespace-pre-wrap break-words text-md font-sans leading-relaxed">
                                                {item.jawaban}
                                            </pre>
                                        ) : (
                                            <span className="italic text-depth-secondary">Belum ada jawaban</span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
