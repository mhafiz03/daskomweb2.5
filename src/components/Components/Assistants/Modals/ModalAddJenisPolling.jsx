import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

const normalizeTitle = (value) => value?.trim() ?? "";

export default function ModalAddJenisPolling({ onClose, onSuccess, existingCategories = [] }) {
    const [judul, setJudul] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const normalizedTitle = normalizeTitle(judul);

        if (!normalizedTitle) {
            setErrorMessage("Nama jenis polling tidak boleh kosong.");
            return;
        }

        const isDuplicate = existingCategories.some((category) =>
            (category?.judul ?? "").toLowerCase() === normalizedTitle.toLowerCase()
        );

        if (isDuplicate) {
            setErrorMessage("Jenis polling dengan nama tersebut sudah tersedia.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            const { data } = await api.post("/api/jenis-polling", { judul: normalizedTitle });

            if (data?.status === "success") {
                toast.success("Jenis polling berhasil ditambahkan.");
                onSuccess?.(data?.category ?? null);
                setJudul("");
            } else {
                toast.error(data?.message ?? "Gagal menambahkan jenis polling.");
            }
        } catch (err) {
            const message = err?.response?.data?.message ?? "Terjadi kesalahan saat menambahkan jenis polling.";
            toast.error(message);
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose?.();
        }
    };

    return (
        <ModalOverlay onClose={handleClose}>
            <div className="depth-modal-container max-w-lg">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Tambah Jenis Polling</h2>
                    <ModalCloseButton onClick={handleClose} ariaLabel="Tutup tambah jenis polling" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="jenisPollingName" className="text-sm font-semibold text-depth-secondary">
                            Nama Jenis Polling
                        </label>
                        <input
                            id="jenisPollingName"
                            type="text"
                            ref={inputRef}
                            value={judul}
                            onChange={(event) => setJudul(event.target.value)}
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-card)]"
                            placeholder="Contoh: Evaluasi Sesi 1"
                            disabled={isSubmitting}
                        />
                        {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-4 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:pointer-events-none disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );

}
