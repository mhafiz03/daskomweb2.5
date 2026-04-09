import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import ModalConfirmDeleteRole from "../Modals/ModalConfirmDeleteRole";
import ModalEditRole from "../Modals/ModalEditRole";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import { useAsistensQuery, ASISTENS_QUERY_KEY } from "@/hooks/useAsistensQuery";
import { submit } from "@/lib/http";
import { destroy as destroyAsistens } from "@/lib/routes/asisten";

const ROLE_BADGE = {
    SOFTWARE: "border border-blue-400/40 bg-blue-400/15 text-blue-300",
    KORDAS: "border border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
    WAKORDAS: "border border-amber-400/40 bg-amber-400/15 text-amber-300",
    KOORPRAK: "border border-purple-400/40 bg-purple-400/15 text-purple-300",
    ADMIN: "border border-rose-400/40 bg-rose-400/15 text-rose-300",
    HARDWARE: "border border-teal-400/40 bg-teal-400/15 text-teal-300",
    DDC: "border border-indigo-400/40 bg-indigo-400/15 text-indigo-300",
    ATC: "border border-pink-400/40 bg-pink-400/15 text-pink-300",
    RDC: "border border-slate-400/40 bg-slate-400/15 text-slate-300",
    HRD: "border border-orange-400/40 bg-orange-400/15 text-orange-300",
    CMD: "border border-cyan-400/40 bg-cyan-400/15 text-cyan-300",
    MLC: "border border-lime-400/40 bg-lime-400/15 text-lime-300",
};

export default function TableManageRole({ asisten }) {
    const [search, setSearch] = useState("");
    const [checkedAsistens, setCheckedAsistens] = useState([]);
    const [isModalOpenConfirmDelete, setIsModalOpenConfirmDelete] = useState(false);
    const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
    const [selectedAsistenId, setSelectedAsistenId] = useState(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const queryClient = useQueryClient();

    const {
        data: asistens = [],
        isFetching,
        isError,
    } = useAsistensQuery({
        onError: () => toast.error("Whoops terjadi kesalahan saat memuat data."),
    });

    const filteredAsistens = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return asistens
            .filter((item) => item.kode !== asisten?.kode)
            .filter((item) => {
                if (!keyword) {
                    return true;
                }

                return [item.nama, item.kode, item.role]
                    .filter(Boolean)
                    .map((value) => value.toLowerCase())
                    .some((value) => value.includes(keyword));
            });
    }, [asistens, asisten?.kode, search]);

    const isAllChecked = filteredAsistens.length > 0 && filteredAsistens.every((item) => checkedAsistens.includes(item.kode));

    const toggleCheckedAsisten = (kode) => {
        setCheckedAsistens((prev) =>
            prev.includes(kode) ? prev.filter((item) => item !== kode) : [...prev, kode]
        );
    };

    const toggleSelectAll = () => {
        if (isAllChecked) {
            setCheckedAsistens((prev) => prev.filter((kode) => !filteredAsistens.some((item) => item.kode === kode)));
        } else {
            setCheckedAsistens((prev) => {
                const codes = filteredAsistens.map((item) => item.kode);
                const unique = new Set([...prev, ...codes]);
                return Array.from(unique);
            });
        }
    };

    const handleOpenModalDelete = () => {
        if (!checkedAsistens.length) {
            toast("Pilih minimal satu asisten untuk dihapus.");
            return;
        }

        setIsModalOpenConfirmDelete(true);
    };

    const handleConfirmDelete = () => {
        setIsModalOpenConfirmDelete(false);
        setIsSubmittingDelete(true);

        submit(destroyAsistens(), {
            data: { asistens: checkedAsistens },
            onSuccess: () => {
                toast.success("Asisten berhasil dihapus 🎉");
                setCheckedAsistens([]);
            },
            onError: () => {
                toast.error("Whoops terjadi kesalahan 😢");
            },
            onFinish: () => {
                queryClient.invalidateQueries({ queryKey: ASISTENS_QUERY_KEY });
                setIsSubmittingDelete(false);
            },
        });
    };

    const handleOpenModalEdit = (kode) => {
        setSelectedAsistenId(kode);
        setIsModalOpenEdit(true);
    };

    const handleCloseModalEdit = () => {
        setIsModalOpenEdit(false);
        queryClient.invalidateQueries({ queryKey: ASISTENS_QUERY_KEY });
    };

    const assistenCountLabel = checkedAsistens.length
        ? `${checkedAsistens.length} asisten dipilih`
        : "Tidak ada asisten yang dipilih";

    return (
        <div className="mt-5 space-y-4 text-depth-primary">
            <Toaster />

            <div className="flex flex-col gap-3 rounded-depth-lg border border-depth bg-depth-card p-4 shadow-depth-md">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-depth-secondary">{assistenCountLabel}</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative sm:w-64">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari nama, kode, role..."
                                className="w-full rounded-depth-full border border-depth bg-depth-interactive py-2.5 pl-4 pr-11 text-sm text-depth-primary shadow-depth-inset transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-depth-secondary">🔍</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenModalDelete}
                            disabled={isSubmittingDelete || checkedAsistens.length === 0}
                            className="inline-flex items-center justify-center rounded-depth-md border border-red-500/60 bg-red-500/15 px-5 py-2 text-sm font-semibold text-red-400 shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:border-red-500/30 disabled:text-red-300"
                        >
                            {isSubmittingDelete ? "Menghapus..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                <div className="h-[70vh] overflow-auto lg:max-h-[48rem]">
                    <table className="min-w-full divide-y divide-[color:var(--depth-border)] text-sm text-depth-primary">
                        <thead className="bg-depth-interactive/60">
                            <tr className="text-left text-depth-secondary">
                                <th scope="col" className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isAllChecked}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                        />
                                        <span>Pilih</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-4 py-3">Nama</th>
                                <th scope="col" className="px-4 py-3">Kode</th>
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--depth-border)]">
                            {isFetching && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-depth-secondary">
                                        Memuat data asisten...
                                    </td>
                                </tr>
                            )}

                            {isError && !isFetching && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                                        Gagal memuat data asisten.
                                    </td>
                                </tr>
                            )}

                            {!isFetching && !isError && filteredAsistens.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-depth-secondary">
                                        Tidak ada data yang cocok dengan pencarian kamu.
                                    </td>
                                </tr>
                            )}

                            {!isFetching && !isError && filteredAsistens.map((item) => {
                                const isChecked = checkedAsistens.includes(item.kode);
                                const badgeTone = ROLE_BADGE[item.role] ??
                                    "border border-slate-400/40 bg-slate-400/15 text-slate-300";

                                return (
                                    <tr key={item.kode} className="hover:bg-depth-interactive/60">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleCheckedAsisten(item.kode)}
                                                className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium">{item.nama}</td>
                                        <td className="px-4 py-3 font-semibold text-depth-secondary">{item.kode}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-depth-full px-3 py-1 text-xs font-semibold ${badgeTone}`}>
                                                {item.role ?? "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModalEdit(item.kode)}
                                                className="inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-1.5 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                                            >
                                                <img src={editIcon} alt="Edit" className="edit-icon-filter h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpenConfirmDelete && (
                <ModalConfirmDeleteRole
                    onClose={() => setIsModalOpenConfirmDelete(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {isModalOpenEdit && (
                <ModalEditRole onClose={handleCloseModalEdit} asistenId={selectedAsistenId} />
            )}
        </div>
    );
}
