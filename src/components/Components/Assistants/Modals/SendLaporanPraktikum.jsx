import { useState } from "react";
import toast from "react-hot-toast";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalLaporanPraktikum({ onClose }) {
    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [kodeAsisten, setKodeAsisten] = useState("");
    const [kodeAsistenError, setKodeAsistenError] = useState("");

    const handleSave = () => {
        if (kodeAsistenError) {
            toast.error("Perbaiki kode asisten sebelum mengirim laporan.");
            return;
        }
        toast.success("Laporan berhasil dikirim!");
        onClose();
    };

    const handleKodeAsistenChange = (e) => {
        const value = e.target.value.toUpperCase();

        // validasi ini
        if (value === "" || /^[A-Z-]+$/.test(value)) {
            setKodeAsisten(value);
            setKodeAsistenError("");
        } else {
            setKodeAsistenError("Kode asisten tidak valid. Pastikan formatnya benar, misalnya: ALL-DEY-FYN.");
        }
    };
    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-[60] px-4 py-6">
            <div className="depth-modal-container w-full max-w-3xl space-y-6">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Laporan Praktikum</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup laporan praktikum" />
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="kodeAsisten" className="block text-sm font-semibold text-depth-secondary">
                            Asisten Yang Mengajar
                        </label>
                        <input
                            id="kodeAsisten"
                            value={kodeAsisten}
                            onChange={handleKodeAsistenChange}
                            className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="ex: ALL-DHY-FYN-DEY-JIN"
                        />
                        {kodeAsistenError && (
                            <p className="mt-2 text-sm text-red-500">{kodeAsistenError}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="deskripsi" className="block text-sm font-semibold text-depth-secondary">
                            Deskripsi
                        </label>
                        <textarea
                            id="deskripsi"
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            rows={6}
                            placeholder="Masukkan deskripsi laporan"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        type="button"
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
