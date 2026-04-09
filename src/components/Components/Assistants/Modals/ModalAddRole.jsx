import { useState } from "react";
import toast from "react-hot-toast";
import { submit } from "@/lib/http";
import { store as storeRole } from "@/lib/routes/role";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ButtonAddRole({ onClose, defaultChecked = ['asisten'] }) {
    const [roleName, setRoleName] = useState("");
    const [checkedPermissions, setCheckedPermissions] = useState(defaultChecked);
    const [errorMessage, setErrorMessage] = useState("");

    const rolePermissions = [
        { paket: "super", name: "Fitur Aslab (Software & Koordas)" },
        { paket: "aslab", name: "Fitur Aslab (Regular)" },
        { paket: "atc", name: "Fitur Asprak (ATC)" },
        { paket: "rdc", name: "Fitur Asprak (RDC)" },
        { paket: "asisten", name: "Fitur Asprak (Default)" },
    ];

    const toggleCheckedPermission = (paket) => {
        setCheckedPermissions((prev) =>
            prev.includes(paket)
                ? prev.filter((p) => p !== paket)
                : [...prev, paket]
        );
    };

    const handleSave = async () => {
        if (!roleName.trim()) {
            setErrorMessage("Nama Role tidak boleh kosong!");
            return;
        }
        if (!checkedPermissions.length) {
            setErrorMessage("Pilih minimal satu paket.");
            return;
        }
        try {
            submit(storeRole(), {
                data: {
                    name: roleName,
                    paket: checkedPermissions,
                },
                onSuccess: () => {
                    toast.success("Role berhasil ditambahkan.");
                    setTimeout(() => {
                        onClose();
                    }, 1000);
                },
                onError: (error) => {
                    toast.error("Terjadi kesalahan. Coba lagi.");
                },
            });
        } catch (error) {
            toast.error("Terjadi kesalahan. Coba lagi.");
        }
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div className="depth-modal-container max-w-3xl">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Tambah Role</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup tambah role" />
                </div>

                <div className="mb-4 space-y-2">
                    <label htmlFor="roleName" className="text-sm font-medium text-depth-secondary">
                        Nama Role
                    </label>
                    <input
                        id="roleName"
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                        placeholder="ex: DDC"
                    />
                </div>

                <div className="max-h-60 overflow-y-auto rounded-depth-md border border-depth bg-depth-interactive/40 p-4">
                    {rolePermissions.map((permission) => (
                        <div
                            key={permission.paket}
                            className="mb-2 flex items-center gap-3 rounded-depth-md border border-transparent bg-depth-card px-3 py-2 text-sm text-depth-primary shadow-depth-sm"
                        >
                            <input
                                type="checkbox"
                                id={`permission-${permission.paket}`}
                                className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                checked={checkedPermissions.includes(permission.paket)}
                                onChange={() => toggleCheckedPermission(permission.paket)}
                            />
                            <label htmlFor={`permission-${permission.paket}`} className="text-depth-secondary">
                                {permission.name}
                            </label>
                        </div>
                    ))}
                </div>

                {errorMessage && (
                    <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-depth-md border border-depth bg-depth-interactive px-5 py-2 text-sm font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        Batal
                    </button>
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
