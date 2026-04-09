import { useState } from "react";
import toast from "react-hot-toast";
import { submit } from "@/lib/http";
import { store as storeModul } from "@/lib/routes/modul";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalAddModule({ onClose }) {
    const [values, setValues] = useState({
        judul: "",
        deskripsi: "",
        isEnglish: 0,
        isUnlocked: 0,
        modul_link: "",
        ppt_link: "",
        video_link: "",
    });
    const [isEnglishOn, setIsEnglishOn] = useState(false);
    const [isUnlockedOn, setIsUnlockedOn] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    const validateFields = () => {
        const newErrors = {};
        if (!values.judul.trim()) {
            newErrors.judul = "Judul wajib diisi.";
        }
        if (!values.deskripsi.trim()) {
            newErrors.deskripsi = "Pencapaian pembelajaran wajib diisi.";
        }
        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = (event) => {
        event.preventDefault();
        if (!validateFields()) {
            toast.error("Harap lengkapi data yang diperlukan.");
            return;
        }

        submit(storeModul(), {
            data: values,
            onSuccess: () => {
                toast.success("Modul berhasil ditambahkan.");
                onClose();
            },
            onError: (error) => {
                const message = error?.response?.data?.message ?? "Gagal menambahkan modul.";
                toast.error(message);
                if (error?.response?.data?.errors) {
                    setLocalErrors(error.response.data.errors);
                }
            },
        });
    };

    const handleToggleEnglish = () => {
        setIsEnglishOn((prev) => {
            const next = !prev;
            setValues((current) => ({ ...current, isEnglish: next ? 1 : 0 }));
            return next;
        });
    };

    const handleToggleUnlocked = () => {
        setIsUnlockedOn((prev) => {
            const next = !prev;
            setValues((current) => ({ ...current, isUnlocked: next ? 1 : 0 }));
            return next;
        });
    };

    const linkFields = [
        { key: "ppt_link", label: "Link PPT", tone: "green" },
        { key: "video_link", label: "Link Video Youtube", tone: "red" },
        { key: "modul_link", label: "Link Modul", tone: "blue" },
    ];

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container max-h-[80vh] w-full max-w-3xl space-y-6 overflow-y-auto"
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Tambah Modul</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup tambah modul" />
                </div>

        <form onSubmit={handleSave} className="space-y-6">
                    <FieldGroup
                        label="Judul Modul"
                        error={localErrors.judul}
                    >
                        <input
                            id="judul"
                            type="text"
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="Masukkan judul modul"
                            value={values.judul}
                            onChange={(event) => setValues({ ...values, judul: event.target.value })}
                        />
                    </FieldGroup>

                    <FieldGroup
                        label="Pencapaian Pembelajaran"
                        description="Tuliskan ringkasan materi atau tujuan pembelajaran yang ingin dicapai."
                        error={localErrors.deskripsi}
                    >
                        <textarea
                            className="w-full rounded-depth-lg border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="Masukkan poin pembelajaran"
                            rows={4}
                            value={values.deskripsi}
                            onChange={(event) => setValues({ ...values, deskripsi: event.target.value })}
                        />
                    </FieldGroup>

                    <div className="space-y-4">
                        {linkFields.map(({ key, label, tone }) => (
                            <FieldGroup key={key} label={label} tone={tone} error={localErrors[key]}>
                                <input
                                    id={key}
                                    type="url"
                                    className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                    placeholder={`Masukkan ${label.toLowerCase()}`}
                                    value={values[key]}
                                    onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                                />
                            </FieldGroup>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-4">
                            <DepthToggleButton label="English" isOn={isEnglishOn} onToggle={handleToggleEnglish} />
                            <DepthToggleButton label="Unlocked" isOn={isUnlockedOn} onToggle={handleToggleUnlocked} />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
}

function FieldGroup({ label, description, error, tone, children }) {
    const toneClasses = {
        green: "text-green-500",
        red: "text-red-500",
        blue: "text-blue-500",
    }[tone];

    return (
        <div className="space-y-2">
            <label className={`text-sm font-semibold text-depth-secondary ${toneClasses ?? ""}`}>
                {label}
            </label>
            {description && <p className="text-xs text-depth-secondary">{description}</p>}
            {children}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
