import { useState } from 'react';
import { ModalOverlay } from '@/Components/Common/ModalPortal';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function ModalNilaiComplaintAsisten({
    isOpen,
    onClose,
    complaint,
    onUpdated = () => {},
}) {
    const [status, setStatus] = useState(complaint?.status || 'pending');
    const [notes, setNotes] = useState(complaint?.notes || '');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !complaint) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!notes.trim() && status === complaint.status) {
            toast.error('Tambahkan catatan atau ubah status');
            return;
        }

        setIsLoading(true);
        try {
            await api.patch(`/api-v1/nilai-complaints/${complaint.id}`, {
                status,
                notes,
            });

            toast.success('Status komplain berhasil diperbarui');
            onUpdated();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui komplain');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Komplain Nilai
                    </h2>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Praktikan & Module Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Nama Praktikan
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {complaint.praktikan?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Modul
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {complaint.nilai?.modul?.judul}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Nilai
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {complaint.nilai?.rata_rata?.toFixed(2) || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Status
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                complaint.status === 'pending'
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                                    : complaint.status === 'resolved'
                                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                                {complaint.status === 'pending'
                                    ? 'Menunggu'
                                    : complaint.status === 'resolved'
                                    ? 'Selesai'
                                    : 'Ditolak'}
                            </span>
                        </div>
                    </div>

                    {/* Complaint Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Komplain
                        </label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                            <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                                {complaint.message}
                            </p>
                        </div>
                    </div>

                    {/* Status Update Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Status Dropdown */}
                        <div>
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Ubah Status
                            </label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Menunggu</option>
                                <option value="resolved">Selesai</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>

                        {/* Notes Textarea */}
                        <div>
                            <label
                                htmlFor="notes"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Catatan (Opsional)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={1000}
                                rows={4}
                                placeholder="Tambahkan catatan atau penjelasan untuk praktikan..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {notes.length}/1000 karakter
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalOverlay>
    );
}
