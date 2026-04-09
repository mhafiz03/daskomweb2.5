import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ModalNilaiComplaint({ isOpen, onClose, nilaiId, modulTitle, modulScore }) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [complaint, setComplaint] = useState(null);

    useEffect(() => {
        if (!isOpen || !nilaiId) {
            return;
        }

        let cancelled = false;

        const loadComplaint = async () => {
            try {
                const { data } = await api.get('/api/nilai/complaints');
                const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                const existingComplaint =
                    items.find((item) => String(item?.nilaiId ?? item?.nilai_id) === String(nilaiId)) ?? null;

                if (!cancelled) {
                    setComplaint(existingComplaint);
                }
            } catch {
                if (!cancelled) {
                    setComplaint(null);
                }
            }
        };

        loadComplaint();

        return () => {
            cancelled = true;
        };
    }, [isOpen, nilaiId]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (message.trim().length < 10) {
            toast.error('Pesan minimal 10 karakter');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data } = await api.post(`/api/nilai/${nilaiId}/complaint`, {
                message: message.trim(),
            });

            toast.success('Komplain nilai berhasil dikirim');
            setMessage('');
            setComplaint(data);
        } catch (error) {
            toast.error(
                error?.response?.data?.error ?? error?.response?.data?.message ?? error?.message ?? 'Gagal mengirim komplain'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'} bg-black/50`}>
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800 mx-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Komplain Nilai
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        type="button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="h-6 w-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Module Info */}
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Modul</p>
                        <p className="font-medium text-slate-900 dark:text-white">{modulTitle}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Nilai: {modulScore}</p>
                    </div>

                    {/* Existing Complaint */}
                    {complaint && (
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-slate-900 dark:text-white">Komplain Anda</h4>
                                {getStatusBadge(complaint.status)}
                            </div>

                            <div className="rounded bg-white p-3 dark:bg-slate-800">
                                <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white">
                                    {complaint.message}
                                </p>
                            </div>

                            {/* Asisten Response */}
                            {complaint.notes && (
                                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-900/30">
                                    <div className="flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                                        >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                        <p className="font-medium text-emerald-800 dark:text-emerald-300">Respons dari Asisten</p>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm text-emerald-900 dark:text-emerald-100">
                                        {complaint.notes}
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        Diperbarui: {new Date(complaint.updated_at ?? complaint.updatedAt).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Complaint Form */}
                    {!complaint && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Pesan Komplain
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Jelaskan alasan Anda mengeluh tentang nilai ini..."
                                    className="h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                                    disabled={isSubmitting}
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {message.length}/1000 karakter
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || message.trim().length < 10}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Komplain'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
