import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { send } from "@/lib/http";
import {
    store as storePraktikan,
    update as updatePraktikan,
} from "@/lib/routes/praktikan";
import { MANAGE_PRAKTIKAN_QUERY_KEY } from "@/hooks/useManagePraktikanQuery";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import { ModalOverlay } from "@/Components/Common/ModalPortal";

const DK_OPTIONS = ["DK1", "DK2"];

const DEFAULT_FORM = {
    nama: "",
    nim: "",
    email: "",
    nomor_telepon: "",
    alamat: "",
    kelas_id: "",
    password: "",
    dk: DK_OPTIONS[0],
};

const normaliseClassOptions = (classes) =>
    (Array.isArray(classes) ? classes : []).map((kelas) => ({
        id: kelas?.id ?? kelas?.id_kelas ?? kelas?.kelas_id ?? kelas?.id,
        label: kelas?.kelas ?? kelas?.nama ?? `Kelas ${kelas?.id ?? ""}`,
    }));

export default function ModalUpsertPraktikan({
    mode = "create",
    praktikan = null,
    kelasOptions = [],
    onClose,
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [errors, setErrors] = useState({});

    const isEdit = mode === "edit" && praktikan;

    useEffect(() => {
        if (isEdit) {
            setForm({
                nama: praktikan?.nama ?? "",
                nim: praktikan?.nim ?? "",
                email: praktikan?.email ?? "",
                nomor_telepon: praktikan?.nomor_telepon ?? "",
                alamat: praktikan?.alamat ?? "",
                kelas_id: praktikan?.kelas_id ? String(praktikan.kelas_id) : "",
                password: "",
                dk: praktikan?.dk ?? DK_OPTIONS[0],
            });
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [isEdit, praktikan]);

    const options = useMemo(() => normaliseClassOptions(kelasOptions), [kelasOptions]);

    const mutation = useMutation({
        mutationFn: async (payload) => {
            if (isEdit) {
                return (await send(updatePraktikan(praktikan.id), payload)).data;
            }

            return (await send(storePraktikan(), payload)).data;
        },
        onSuccess: () => {
            const message = isEdit ? "Praktikan berhasil diperbarui." : "Praktikan berhasil ditambahkan.";
            toast.success(message);
            queryClient.invalidateQueries({ queryKey: [MANAGE_PRAKTIKAN_QUERY_KEY] });
            onClose?.();
        },
        onError: (error) => {
            const response = error?.response?.data;

            if (response?.errors) {
                setErrors(response.errors ?? {});
                const firstError = Object.values(response.errors).flat()[0];
                if (firstError) {
                    toast.error(firstError);
                }
            } else {
                toast.error(response?.message ?? error?.message ?? "Terjadi kesalahan. Silakan coba lagi.");
            }
        },
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            nama: form.nama.trim(),
            nim: form.nim.trim(),
            email: form.email.trim(),
            nomor_telepon: form.nomor_telepon.trim(),
            alamat: form.alamat.trim(),
            kelas_id: form.kelas_id ? Number(form.kelas_id) : null,
            dk: form.dk || DK_OPTIONS[0],
        };

        if (!payload.kelas_id) {
            setErrors((prev) => ({
                ...prev,
                kelas_id: "Kelas wajib dipilih.",
            }));
            return;
        }

        if (!payload.dk) {
            setErrors((prev) => ({
                ...prev,
                dk: "DK wajib dipilih.",
            }));
            return;
        }

        if (!isEdit || form.password.trim() !== "") {
            payload.password = form.password.trim();
        }

        mutation.mutate(payload);
    };

    const renderError = (field) => {
        const fieldErrors = errors?.[field];
        if (!fieldErrors) {
            return null;
        }

        const message = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;

        return <p className="mt-1 text-xs text-red-400">{message}</p>;
    };

    const handleRequestClose = () => {
        if (!mutation.isPending) {
            onClose?.();
        }
    };

    return (
        <ModalOverlay onClose={handleRequestClose} className="depth-modal-overlay z-[60]">
            <div className="depth-modal-container w-full max-w-2xl">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">
                        {isEdit ? "Edit Praktikan" : "Tambah Praktikan"}
                    </h2>
                    <ModalCloseButton
                        onClick={handleRequestClose}
                        ariaLabel="Tutup formulir praktikan"
                        className={mutation.isPending ? "pointer-events-none opacity-60" : ""}
                    />
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="nama" className="text-sm font-medium text-depth-secondary">
                                Nama Lengkap
                            </label>
                            <input
                                id="nama"
                                name="nama"
                                value={form.nama}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="Nama praktikan"
                                disabled={mutation.isPending}
                            />
                            {renderError("nama")}
                        </div>

                        <div>
                            <label htmlFor="nim" className="text-sm font-medium text-depth-secondary">
                                NIM
                            </label>
                            <input
                                id="nim"
                                name="nim"
                                value={form.nim}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="1101223xxxx"
                                disabled={mutation.isPending || isEdit}
                            />
                            {renderError("nim")}
                        </div>

                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-depth-secondary">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="praktikan@example.com"
                                disabled={mutation.isPending}
                            />
                            {renderError("email")}
                        </div>

                        <div>
                            <label htmlFor="nomor_telepon" className="text-sm font-medium text-depth-secondary">
                                Nomor Telepon
                            </label>
                            <input
                                id="nomor_telepon"
                                name="nomor_telepon"
                                value={form.nomor_telepon}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="08xxxxxxxxxx"
                                disabled={mutation.isPending}
                            />
                            {renderError("nomor_telepon")}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="alamat" className="text-sm font-medium text-depth-secondary">
                            Alamat
                        </label>
                        <textarea
                            id="alamat"
                            name="alamat"
                            value={form.alamat}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="Alamat lengkap"
                            disabled={mutation.isPending}
                        />
                        {renderError("alamat")}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label htmlFor="kelas_id" className="text-sm font-medium text-depth-secondary">
                                Kelas
                            </label>
                            <select
                                id="kelas_id"
                                name="kelas_id"
                                value={form.kelas_id}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                disabled={mutation.isPending}
                            >
                                <option value="">Pilih kelas</option>
                                {options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {renderError("kelas_id")}
                        </div>

                        <div>
                            <label htmlFor="dk" className="text-sm font-medium text-depth-secondary">
                                DK
                            </label>
                            <select
                                id="dk"
                                name="dk"
                                value={form.dk}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                disabled={mutation.isPending}
                            >
                                {DK_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {renderError("dk")}
                        </div>

                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-depth-secondary">
                                {isEdit ? "Password Baru (Opsional)" : "Password"}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder={isEdit ? "Kosongkan jika tidak ingin mengubah" : "Minimal 8 karakter"}
                                disabled={mutation.isPending}
                            />
                            {renderError("password")}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleRequestClose}
                            disabled={mutation.isPending}
                            className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {mutation.isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Praktikan"}
                        </button>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}
