import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { useImageKitUpload } from "@/hooks/useImageKitUpload";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalEditProfile({ isOpen, onClose }) {
    const queryClient = useQueryClient();
    const { data: asisten } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
        staleTime: 60_000,
    });

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [avatar, setAvatar] = useState(null);
    const [values, setValues] = useState({
        nomor_telepon: "",
        id_line: "",
        instagram: "",
        deskripsi: "",
    });

    const { upload, isUploading, progress } = useImageKitUpload();

    const avatarUrl = useMemo(
        () => avatar ?? asisten?.foto_asistens?.foto ?? asisten?.profilePicture ?? null,
        [asisten?.foto_asistens?.foto, asisten?.profilePicture, avatar],
    );

    useEffect(() => {
        if (!asisten || !isOpen) {
            return;
        }

        setValues({
            nomor_telepon: asisten.nomorTelepon ?? asisten.nomor_telepon ?? "",
            id_line: asisten.idLine ?? asisten.id_line ?? "",
            instagram: asisten.instagram ?? "",
            deskripsi: asisten.deskripsi ?? "",
        });
        setAvatar(asisten?.foto_asistens?.foto ?? asisten?.profilePicture ?? null);
        setFieldErrors({});
        setPhotoError("");
    }, [asisten, isOpen]);

    const handleChange = (e) => {
        const key = e.target.id;
        const value = e.target.value;
        setValues((prevValues) => ({
            ...prevValues,
            [key]: value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!asisten?.id) {
            setPhotoError("Session asisten tidak ditemukan.");
            setIsSuccessModalOpen(true);
            return;
        }

        try {
            setFieldErrors({});
            await api.patch(`/api/asistens/${asisten.id}`, {
                nomorTelepon: values.nomor_telepon,
                idLine: values.id_line,
                instagram: values.instagram,
                deskripsi: values.deskripsi,
            });
            await queryClient.invalidateQueries({ queryKey: ["session"] });
            setPhotoError("");
            setIsSuccessModalOpen(true);
            setTimeout(() => {
                setIsSuccessModalOpen(false);
                onClose();
            }, 3000);
        } catch (error) {
            setFieldErrors(error?.response?.data?.errors ?? {});
            setPhotoError(error?.response?.data?.error ?? error?.message ?? "Gagal memperbarui profil.");
            setIsSuccessModalOpen(true);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !asisten?.kode) return;

        if (file.size > 512 * 1024) {
            setPhotoError("Photo must be less than 512kb");
            setIsSuccessModalOpen(true);
            return;
        }

        try {
            const previewUrl = URL.createObjectURL(file);
            setAvatar(previewUrl);

            const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
            const fileName = `${asisten.kode}.${extension}`;
            const result = await upload(file, "daskom/profil-asisten", fileName);

            await api.post("/api/asistens/foto", {
                fotoUrl: result.url,
            });

            await queryClient.invalidateQueries({ queryKey: ["session"] });
            setAvatar(result.url);
            setPhotoError("");
        } catch (error) {
            setPhotoError(error?.message ?? "Upload failed");
            setIsSuccessModalOpen(true);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!asisten?.id) {
            return;
        }

        try {
            await api.patch(`/api/asistens/${asisten.id}`, {
                profilePicture: null,
            });
            setAvatar(null);
            await queryClient.invalidateQueries({ queryKey: ["session"] });
        } catch (error) {
            setPhotoError(error?.response?.data?.error ?? error?.message ?? "Gagal menghapus avatar.");
            setIsSuccessModalOpen(true);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalOverlay onClose={onClose} className="depth-modal-overlay z-50">
                <div className="depth-modal-container max-w-2xl">
                    <div className="flex flex-row items-center justify-between">
                        <h2 className="depth-modal-title mb-6">Edit Profile</h2>
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup edit profil" />
                    </div>
                    <form onSubmit={handleSave}>
                        <div className="flex gap-6 p-4">
                            <div className="flex-1">
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        WhatsApp:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter WhatsApp number"
                                        name="nomor_telepon"
                                        id="nomor_telepon"
                                        value={values.nomor_telepon}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.nomorTelepon && (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.nomorTelepon}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        ID Line:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter ID Line"
                                        name="id_line"
                                        id="id_line"
                                        value={values.id_line}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.idLine && (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.idLine}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Instagram:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter Instagram username"
                                        name="instagram"
                                        id="instagram"
                                        value={values.instagram}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.instagram && (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.instagram}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-depth bg-depth-background shadow-depth-md">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-depth-secondary">👤</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label
                                        htmlFor="avatarUpload"
                                        className={`cursor-pointer rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-center text-sm font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg ${isUploading ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                        {isUploading ? `Uploading ${progress}%` : "Change Avatar"}
                                    </label>
                                    <input
                                        id="avatarUpload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={isUploading}
                                    />

                                    <button
                                        type="button"
                                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={handleDeleteAvatar}
                                        disabled={isUploading}
                                    >
                                        Delete Avatar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                About Me:
                            </label>
                            <textarea
                                className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                placeholder="Tell us about yourself"
                                rows="4"
                                name="deskripsi"
                                id="deskripsi"
                                value={values.deskripsi}
                                onChange={handleChange}
                            />
                            {fieldErrors.deskripsi && (
                                <p className="mt-1 text-xs text-red-500">{fieldErrors.deskripsi}</p>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="w-full max-w-xs rounded-depth-md bg-[var(--depth-color-primary)] px-8 py-3 font-semibold text-white shadow-depth-lg transition hover:-translate-y-0.5 hover:shadow-depth-lg"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
            {isSuccessModalOpen && (
                <ModalOverlay
                    onClose={() => setIsSuccessModalOpen(false)}
                    className="depth-modal-overlay z-[60]"
                >
                    <div className="depth-modal-container max-w-sm space-y-4 text-center">
                        <div className="depth-modal-header justify-center">
                            <h3 className={`depth-modal-title text-center ${photoError ? "text-red-500" : "text-[var(--depth-color-primary)]"}`}>
                                {photoError ? "Upload Error" : "Success!"}
                            </h3>
                            <ModalCloseButton
                                onClick={() => setIsSuccessModalOpen(false)}
                                ariaLabel="Tutup notifikasi edit profil"
                            />
                        </div>

                        <div className="flex justify-center">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${photoError ? "bg-red-100" : "bg-green-100"}`}>
                                {photoError ? (
                                    <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-depth-secondary">
                            {photoError || "Profile Updated Successfully!"}
                        </p>

                        <button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Tutup
                        </button>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
}
