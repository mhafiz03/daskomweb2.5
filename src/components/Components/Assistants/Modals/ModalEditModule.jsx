import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { send } from "@/lib/http";
import { update as updateModul } from "@/lib/routes/modul";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";
import { api } from "@/lib/api";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalEditModule({ onClose, modules, selectedModuleId, onUpdate }) {
    const [values, setValues] = useState({
        judul: "",
        deskripsi: "",
        modul_link: "",
        ppt_link: "",
        video_link: "",
        isEnglish: 0,
        isUnlocked: 0,
    });
    const [isEnglishOn, setIsEnglishOn] = useState(false);
    const [isUnlockedOn, setIsUnlockedOn] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        setFormErrors({});
        const selected = modules.find((module) => module.idM === selectedModuleId);
        if (selected) {
            setValues({
                judul: selected.judul ?? "",
                deskripsi: selected.deskripsi ?? "",
                modul_link: selected.modul_link ?? "",
                ppt_link: selected.ppt_link ?? "",
                video_link: selected.video_link ?? "",
                isEnglish: selected.isEnglish ?? 0,
                isUnlocked: selected.isUnlocked ?? 0,
            });
            setIsEnglishOn(selected.isEnglish === 1);
            setIsUnlockedOn(selected.isUnlocked === 1);
        }

        if (!selectedModuleId) {
            setFormErrors({});
            return;
        }

        let ignore = false;

        const fetchDetail = async () => {
            setIsDetailLoading(true);
            try {
                const { data } = await api.get(`/api-v1/modul/${selectedModuleId}`);
                const detail = data?.data ?? null;

                if (!detail || ignore) {
                    return;
                }

                setValues({
                    judul: detail.judul ?? "",
                    deskripsi: detail.deskripsi ?? "",
                    modul_link: detail.modul_link ?? "",
                    ppt_link: detail.ppt_link ?? "",
                    video_link: detail.video_link ?? "",
                    isEnglish: detail.isEnglish ?? 0,
                    isUnlocked: detail.isUnlocked ?? 0,
                });
                setIsEnglishOn(detail.isEnglish === 1);
                setIsUnlockedOn(detail.isUnlocked === 1);
            } catch (error) {
                if (!ignore) {
                    const message = error?.response?.data?.message ?? error?.message ?? "Gagal memuat detail modul.";
                    toast.error(message);
                }
            } finally {
                if (!ignore) {
                    setIsDetailLoading(false);
                }
            }
        };

        fetchDetail();

        return () => {
            ignore = true;
        };
    }, [modules, selectedModuleId]);

    const handleSave = async () => {
        if (!selectedModuleId) {
            toast.error("ID modul tidak valid.");
            return;
        }

        try {
            setIsSubmitting(true);
            setFormErrors({});

            const response = await send(updateModul(selectedModuleId), values);
            const responseData = response?.data?.data ?? null;
            const payload = responseData ?? values;
            const updatedModule = {
                ...(modules.find((module) => module.idM === selectedModuleId) ?? {}),
                idM: selectedModuleId,
                ...payload,
            };
            updatedModule.isEnglish = Number(payload?.isEnglish ?? updatedModule.isEnglish ?? 0);
            updatedModule.isUnlocked = Number(payload?.isUnlocked ?? updatedModule.isUnlocked ?? 0);

            if (typeof onUpdate === "function") {
                onUpdate(updatedModule);
            }

            toast.success(response?.data?.message ?? "Modul berhasil diperbarui.");
            onClose();
        } catch (error) {
            const status = error?.response?.status ?? 500;
            if (status === 422) {
                const errorBag = error?.response?.data?.errors ?? {};
                setFormErrors(errorBag);
                toast.error(error?.response?.data?.message ?? "Validasi gagal, periksa kembali data Anda.");
            } else {
                const message = error?.response?.data?.message ?? error?.message ?? "Gagal memperbarui modul.";
                toast.error(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const linkFields = [
        { key: "ppt_link", label: "Link PPT", tone: "green" },
        { key: "video_link", label: "Link Video Youtube", tone: "red" },
        { key: "modul_link", label: "Link Modul", tone: "blue" },
    ];

    const generalErrorMessage = Array.isArray(formErrors?.general)
        ? formErrors.general.join(", ")
        : formErrors?.general;

    return (
        <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
            <div
                className="depth-modal-container max-h-[80vh] w-full max-w-3xl space-y-6 overflow-y-auto"
            >
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Edit Modul</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup edit modul" />
                </div>

                {generalErrorMessage && (
                    <div className="rounded-depth-md border border-red-400 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                        {generalErrorMessage}
                    </div>
                )}

                <div className="space-y-6">
                    <FieldGroup label="Judul Modul" error={formErrors?.judul?.[0] ?? formErrors?.judul}>
                        <input
                            id="judul"
                            type="text"
                            className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                            placeholder="Masukkan judul modul"
                            value={values.judul}
                            onChange={(event) => setValues({ ...values, judul: event.target.value })}
                        />
                    </FieldGroup>

                    <FieldGroup label="Pencapaian Pembelajaran" error={formErrors?.deskripsi?.[0] ?? formErrors?.deskripsi}>
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
                            <FieldGroup
                                key={key}
                                label={label}
                                tone={tone}
                                error={formErrors?.[key]?.[0] ?? formErrors?.[key]}
                            >
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
                            <DepthToggleButton
                                label="English"
                                isOn={isEnglishOn}
                                onToggle={() =>
                                    setIsEnglishOn((prev) => {
                                        const next = !prev;
                                        setValues((current) => ({ ...current, isEnglish: next ? 1 : 0 }));
                                        return next;
                                    })
                                }
                                disabled={isDetailLoading || isSubmitting}
                            />
                            <DepthToggleButton
                                label="Unlocked"
                                isOn={isUnlockedOn}
                                onToggle={() =>
                                    setIsUnlockedOn((prev) => {
                                        const next = !prev;
                                        setValues((current) => ({ ...current, isUnlocked: next ? 1 : 0 }));
                                        return next;
                                    })
                                }
                                disabled={isDetailLoading || isSubmitting}
                            />
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
                                type="button"
                                onClick={handleSave}
                                disabled={isDetailLoading || isSubmitting}
                                className="rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}

function FieldGroup({ label, children, error, tone }) {
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
            {children}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
