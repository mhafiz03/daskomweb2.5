import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useImageKitUpload } from "@/hooks/useImageKitUpload";

export default function ModalEditProfilePraktikan({ isOpen, onClose, praktikan }) {
    const [avatar, setAvatar] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const [errors, setErrors] = useState({});
    const [values, setValues] = useState({
        nomor_telepon: praktikan?.nomor_telepon || '',
        email: praktikan?.email || '',
        alamat: praktikan?.alamat || '',
    });
    const { upload } = useImageKitUpload();

    useEffect(() => {
        setValues({
            nomor_telepon: praktikan?.nomor_telepon || '',
            email: praktikan?.email || '',
            alamat: praktikan?.alamat || '',
        });
        setAvatar(praktikan?.profile_picture_url || praktikan?.profilePicture || null);
        setErrors({});
    }, [praktikan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        if (file.size > 524288) {
            setPhotoError(true);
            setIsSuccessModalOpen(true);
            return;
        }

        setIsUploading(true);
        setProgress(0);

        try {
            const previewUrl = URL.createObjectURL(file);
            setAvatar(previewUrl);

            const uploadResult = await upload(file, 'daskom/profil-praktikan', null, true);
            setProgress(100);

            await api.patch('/api/praktikans/me/profile', {
                profilePicture: uploadResult.url,
            });

            setAvatar(uploadResult.url);
            setPhotoError(false);
            setIsSuccessModalOpen(true);
        } catch (error) {
            console.error('Upload error:', error);
            setPhotoError(true);
            setIsSuccessModalOpen(true);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            await api.patch('/api/praktikans/me/profile', {
                profilePicture: null,
            });
            setAvatar(null);
            setPhotoError(false);
            setIsSuccessModalOpen(true);
        } catch (error) {
            console.error('Delete error:', error);
            setPhotoError(true);
            setIsSuccessModalOpen(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setErrors({});
            await api.patch('/api/praktikans/me/profile', {
                nomorTelepon: values.nomor_telepon,
                email: values.email,
                alamat: values.alamat,
            });
            setPhotoError(false);
            setIsSuccessModalOpen(true);
        } catch (error) {
            setErrors(error?.response?.data?.errors ?? {});
            setPhotoError(true);
            setIsSuccessModalOpen(true);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div className="depth-modal-overlay" onClick={onClose}>
                <div className="depth-modal-container max-w-3xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-6 flex items-center justify-between border-b border-depth pb-4">
                        <h2 className="text-2xl font-bold text-depth-primary">
                            Edit Profile
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-depth-md p-2 text-depth-secondary transition hover:bg-depth-hover hover:text-depth-primary"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Phone Number:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter phone number"
                                        name="nomor_telepon"
                                        id="nomor_telepon"
                                        value={values.nomor_telepon}
                                        onChange={handleChange}
                                    />
                                    {errors.nomorTelepon && (
                                        <p className="mt-1 text-xs text-red-500">{errors.nomorTelepon}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Email:
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter email"
                                        name="email"
                                        id="email"
                                        value={values.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-depth-primary">
                                        Address:
                                    </label>
                                    <textarea
                                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                                        placeholder="Enter address"
                                        name="alamat"
                                        id="alamat"
                                        rows="4"
                                        value={values.alamat}
                                        onChange={handleChange}
                                    />
                                    {errors.alamat && (
                                        <p className="mt-1 text-xs text-red-500">{errors.alamat}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-depth bg-depth-background shadow-depth-md">
                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl text-depth-secondary">👤</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <label
                                        htmlFor="avatarUpload"
                                        className={`cursor-pointer rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-center text-sm font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg ${
                                            isUploading ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                    >
                                        {isUploading ? `Uploading ${progress}%` : 'Change Avatar'}
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
                                <div className="mt-6 w-full rounded-depth-md border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-depth-sm dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-100">
                                    <p className="mb-2 font-semibold"> Peraturan Foto Profil:</p>
                                    <p className="leading-relaxed">
                                        Untuk foto dibebaskan foto apapun dengan syarat menunjukkan wajah diri sendiri dan tidak mengandung sara/pornografi. Jika melanggar maka akan diberikan sanksi akademik yang serius.
                                    </p>
                                </div>
                            </div>
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
            </div>

            {isSuccessModalOpen && (
                <div className="depth-modal-overlay">
                    <div className="depth-modal-container max-w-md">
                        {photoError ? (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mb-2 text-center text-lg font-bold text-red-500">
                                    Upload Error
                                </h3>
                                <p className="mb-4 text-center text-sm text-depth-secondary">
                                    Terjadi kesalahan saat memperbarui profil.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="mb-2 text-center text-lg font-bold text-[var(--depth-color-primary)]">
                                    Success!
                                </h3>
                                <p className="mb-4 text-center text-sm text-depth-secondary">
                                    Profile Updated Successfully!
                                </p>
                            </>
                        )}
                        <button
                            onClick={() => setIsSuccessModalOpen(false)}
                            className="w-full rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
