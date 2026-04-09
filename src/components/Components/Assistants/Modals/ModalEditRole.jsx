import { useState } from "react";
import toast from "react-hot-toast";
import { useRolesQuery } from "@/hooks/useRolesQuery";
import { submit } from "@/lib/http";
import { update as updateRole } from "@/lib/routes/role";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalEditRole({ onClose, asistenId }) {
    const [selectedRole, setSelectedRole] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const {
        data: roles = [],
        isLoading: rolesLoading,
        isError: rolesError,
        error: rolesQueryError,
    } = useRolesQuery({
        onError: (err) => {
            toast.error(err.message ?? "Whoops terjadi kesalahan");
        },
    });

    const handleRoleChange = (event) => {
        setSelectedRole(Number(event.target.value)); // Convert value to number
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (!selectedRole) {
            setErrorMessage("Pilih role terlebih dahulu.");
            return;
        }

        submit(updateRole(asistenId), {
            data: { role_id: selectedRole },
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Role berhasil diperbarui.");
                setTimeout(() => {
                    onClose();
                }, 1000);
            },
            onError: () => {
                toast.error("Terjadi kesalahan. Coba lagi.");
            },
        });
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div className="depth-modal-container max-w-xl">
                <div className="depth-modal-header">
                    <h2 className="depth-modal-title">Update Role</h2>
                    <ModalCloseButton onClick={onClose} ariaLabel="Tutup pengaturan role" />
                </div>

                <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                        {rolesLoading && (
                            <span className="col-span-2 text-sm text-depth-secondary">Memuat role...</span>
                        )}
                        {rolesError && (
                            <span className="col-span-2 text-sm text-red-500">
                                {rolesQueryError?.message ?? "Gagal memuat role"}
                            </span>
                        )}
                        {!rolesLoading && !rolesError &&
                            roles.map((role) => (
                                <label
                                    key={role.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-depth-md border px-3 py-2 text-sm transition ${selectedRole === role.id
                                            ? "border-[var(--depth-color-primary)] bg-depth-interactive shadow-depth-md"
                                            : "border-depth bg-depth-card shadow-depth-sm hover:border-[var(--depth-color-primary)]"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role_id"
                                        value={role.id}
                                        checked={selectedRole === role.id}
                                        onChange={handleRoleChange}
                                        className="h-4 w-4 rounded border-depth text-[var(--depth-color-primary)] focus:ring-[var(--depth-color-primary)]"
                                    />
                                    <span className="font-medium text-depth-primary">{role.name}</span>
                                </label>
                            ))}
                    </div>

                {errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage}</p>}

                <div className="mt-6 flex justify-end">
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
