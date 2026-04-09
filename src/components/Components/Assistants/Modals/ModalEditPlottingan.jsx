import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import deleteIcon from "../../../../assets/nav/Icon-Delete.svg";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { send } from "@/lib/http";
import { update as updateKelas } from "@/lib/routes/kelas";
import { KELAS_QUERY_KEY } from "@/hooks/useKelasQuery";
import { useAsistensQuery } from "@/hooks/useAsistensQuery";
import { useJadwalJagaQuery, JADWAL_JAGA_QUERY_KEY } from "@/hooks/useJadwalJagaQuery";
import {
    destroy as destroyJadwalJaga,
    store as storeJadwalJaga,
} from "@/lib/routes/jadwalJaga";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

export default function ModalEditPlotting({ onClose, kelas }) {
    const [formData, setFormData] = useState({ kelas: "", hari: "", shift: "", totalGroup: "", is_tot: 0 });
    const [newAsistenCode, setNewAsistenCode] = useState("");
    const [isEnglish, setIsEnglish] = useState(false);
    const [isTot, setIsTot] = useState(false);
    const queryClient = useQueryClient();

    const { data: asistens = [] } = useAsistensQuery();

    const asistenMap = useMemo(() => {
        const map = new Map();
        asistens.forEach((item) => {
            if (item?.id != null) {
                map.set(Number(item.id), item);
                map.set(String(item.id), item);
            }
            if (item?.kode) {
                map.set(item.kode.toUpperCase(), item);
            }
        });
        return map;
    }, [asistens]);

    const {
        data: jadwalData = [],
        isFetching: jadwalLoading,
        refetch: refetchJadwal,
    } = useJadwalJagaQuery(kelas?.id ? { kelas_id: kelas.id } : {}, {
        enabled: Boolean(kelas?.id),
    });

    const jadwalEntries = useMemo(() => {
        if (!kelas?.id) {
            return [];
        }

        const kelasId = Number(kelas.id);
        const kelasName = kelas?.kelas ? kelas.kelas.toString() : null;

        const target =
            jadwalData.find((item) => Number(item?.id ?? item?.kelas_id ?? item?.kelasId) === kelasId) ??
            (kelasName
                ? jadwalData.find((item) => (item?.kelas ?? "").toString() === kelasName)
                : undefined);

        if (!target) {
            return [];
        }

        if (Array.isArray(target?.jadwal_jagas)) {
            return target.jadwal_jagas;
        }

        if (Array.isArray(target?.asistens)) {
            return target.asistens;
        }

        return [];
    }, [jadwalData, kelas]);

    useEffect(() => {
        if (kelas) {
            setFormData({
                kelas: kelas.kelas ?? "",
                hari: kelas.hari ?? "",
                shift: kelas.shift ?? "",
                totalGroup: kelas.totalGroup ?? "",
                is_tot: kelas.is_tot ? 1 : 0,
            });
            setIsEnglish(Boolean(kelas.isEnglish));
            setIsTot(Boolean(kelas.is_tot));
        }
    }, [kelas]);

    const handleInputChange = (event) => {
        const { id } = event.target;
        let { value } = event.target;

        if (id === "kelas" || id === "hari") {
            value = value.toUpperCase();
        }

        setFormData((prev) => {
            const next = { ...prev, [id]: value };

            if (id === "kelas") {
                if (value.includes("INT")) {
                    next.isEnglish = 1;
                    if (!isEnglish) {
                        setIsEnglish(true);
                    }
                }

                if (value.includes("TOT")) {
                    next.is_tot = 1;
                    if (!isTot) {
                        setIsTot(true);
                    }
                }
            }

            return next;
        });
    };

    const toggleEnglish = () => {
        setIsEnglish((previous) => {
            const next = !previous;
            setFormData((current) => ({ ...current, isEnglish: next ? 1 : 0 }));
            return next;
        });
    };

    const toggleTot = () => {
        setIsTot((previous) => {
            const next = !previous;
            setFormData((current) => ({ ...current, is_tot: next ? 1 : 0 }));
            return next;
        });
    };

    const handleAddAsisten = async () => {
        const trimmed = newAsistenCode.trim().toUpperCase();

        if (!trimmed) {
            toast.error("Masukkan kode asisten terlebih dahulu.");
            return;
        }

        const numericKey = Number(trimmed);
        const asistenDetail =
            asistenMap.get(trimmed) ?? (!Number.isNaN(numericKey) ? asistenMap.get(numericKey) : undefined);

        if (!asistenDetail) {
            toast.error("Asisten tidak ditemukan.");
            return;
        }

        try {
            await send(storeJadwalJaga(), {
                kelas_id: kelas.id,
                asisten_id: asistenDetail.id,
            });

            toast.success("Asisten jaga berhasil ditambahkan.");
            setNewAsistenCode("");
            await refetchJadwal();
            queryClient.invalidateQueries({ queryKey: KELAS_QUERY_KEY });
            queryClient.invalidateQueries({
                predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === JADWAL_JAGA_QUERY_KEY,
            });
        } catch (error) {
            console.error("Gagal menambahkan asisten jaga:", error);
            const message =
                error?.response?.data?.message ?? error?.response?.data?.error ?? "Gagal menambahkan asisten jaga.";
            toast.error(message);
        }
    };

    const handleRemoveAsisten = async (jadwalId) => {
        if (!jadwalId) {
            return;
        }

        try {
            await send(destroyJadwalJaga(jadwalId));
            toast.success("Asisten jaga berhasil dihapus.");
            await refetchJadwal();
            queryClient.invalidateQueries({ queryKey: KELAS_QUERY_KEY });
            queryClient.invalidateQueries({
                predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === JADWAL_JAGA_QUERY_KEY,
            });
        } catch (error) {
            console.error("Gagal menghapus asisten jaga:", error);
            const message =
                error?.response?.data?.message ?? error?.response?.data?.error ?? "Gagal menghapus asisten jaga.";
            toast.error(message);
        }
    };

    const updateKelasMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const token = localStorage.getItem("token");
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            const { data } = await send(updateKelas(id), payload, config);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KELAS_QUERY_KEY });
            toast.success("Jadwal berhasil diubah.");
            onClose();
        },
        onError: (error) => {
            const responseData = error?.response?.data;
            if (responseData?.errors) {
                const message = Object.values(responseData.errors).flat()[0];
                toast.error(message ?? "Gagal menyimpan data kelas. Silakan coba lagi.");
            } else {
                toast.error(responseData?.message ?? error.message ?? "Gagal menyimpan data kelas. Silakan coba lagi.");
            }
        },
    });

    const handleSave = () => {
        if (!formData.kelas || !formData.hari || !formData.shift || !formData.totalGroup) {
            toast.error("Harap isi semua field yang diperlukan.");
            return;
        }

        updateKelasMutation.mutate({
            id: kelas.id,
            payload: {
                kelas: formData.kelas,
                hari: formData.hari,
                shift: Number(formData.shift),
                totalGroup: Number(formData.totalGroup),
                isEnglish: isEnglish ? 1 : 0,
                is_tot: isTot ? 1 : 0,
            },
        });
    };

    const [leftColumnEntries, rightColumnEntries] = useMemo(() => {
        if (jadwalEntries.length === 0) {
            return [[], []];
        }

        const midpoint = Math.ceil(jadwalEntries.length / 2);
        return [jadwalEntries.slice(0, midpoint), jadwalEntries.slice(midpoint)];
    }, [jadwalEntries]);

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container space-y-6"
                style={{ "--depth-modal-max-width": "56rem" }}
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Edit Jadwal</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup edit jadwal" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <label htmlFor="kelas" className="text-sm font-semibold text-depth-secondary">
                            Kelas
                        </label>
                        <input
                            id="kelas"
                            type="text"
                            value={formData.kelas}
                            onChange={handleInputChange}
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="hari" className="text-sm font-semibold text-depth-secondary">
                            Hari
                        </label>
                        <select
                            id="hari"
                            value={formData.hari}
                            onChange={handleInputChange}
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        >
                            <option value="">- Pilih Hari -</option>
                            {["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].map((day) => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="shift" className="text-sm font-semibold text-depth-secondary">
                            Shift
                        </label>
                        <input
                            id="shift"
                            type="number"
                            value={formData.shift}
                            onChange={handleInputChange}
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="totalGroup" className="text-sm font-semibold text-depth-secondary">
                            Kelompok
                        </label>
                        <input
                            id="totalGroup"
                            type="number"
                            value={formData.totalGroup}
                            onChange={handleInputChange}
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        />
                    </div>
                </div>

                <div className="rounded-depth-lg border border-depth bg-depth-interactive/40 p-4 shadow-depth-sm">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                            type="text"
                            value={newAsistenCode}
                            onChange={(event) => setNewAsistenCode(event.target.value.toUpperCase())}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleAddAsisten();
                                }
                            }}
                            placeholder="Masukkan kode asisten"
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0 uppercase"
                        />
                        <button
                            type="button"
                            onClick={handleAddAsisten}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md md:w-auto"
                        >
                            Tambah
                        </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {jadwalLoading ? (
                            <p className="text-sm text-depth-secondary">Memuat daftar asisten jaga...</p>
                        ) : jadwalEntries.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {[leftColumnEntries, rightColumnEntries].map((columnEntries, columnIndex) => (
                                    <ul key={columnIndex} className="space-y-2">
                                        {columnEntries.map((entry, idx) => {
                                            const globalIndex = columnIndex === 0 ? idx : leftColumnEntries.length + idx;
                                            const detail =
                                                entry?.asisten ??
                                                asistenMap.get(Number(entry?.asisten_id)) ??
                                                null;
                                            const kode = detail?.kode ?? entry?.kode ?? `AST-${globalIndex + 1}`;
                                            const jadwalId = entry?.id ?? entry?.jadwal_id ?? null;

                                            return (
                                                <li
                                                    key={jadwalId ?? `${kode}-${columnIndex}-${idx}`}
                                                    className="flex items-center justify-between rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm"
                                                >
                                                    <div>
                                                        <p className="font-semibold">{kode}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAsisten(jadwalId)}
                                                        className="group rounded-depth-md p-1 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        disabled={!jadwalId}
                                                    >
                                                        <img
                                                            src={deleteIcon}
                                                            alt="Hapus"
                                                            className="h-4 w-4 opacity-70 transition group-hover:opacity-100"
                                                        />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-depth-secondary">Belum ada asisten jaga untuk kelas ini.</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="flex flex-wrap gap-3">
                        <DepthToggleButton label={isEnglish ? "English" : "Reguler"} isOn={isEnglish} onToggle={toggleEnglish} />
                        <DepthToggleButton label={isTot ? "TOT" : "Non TOT"} isOn={isTot} onToggle={toggleTot} />
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateKelasMutation.isPending}
                        className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {updateKelasMutation.isPending ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );

}
