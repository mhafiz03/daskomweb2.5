import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import { useConfigurationQuery, CONFIG_QUERY_KEY } from "@/hooks/useConfigurationQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { send } from "@/lib/http";
import { update as updateConfigurationRoute } from "@/lib/routes/configuration";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import DepthToggleButton from "@/Components/Common/DepthToggleButton";

export default function ModalKonfigurasi({ onClose }) {
    const [isTugasPendahuluanOn, setIsTugasPendahuluanOn] = useState(false);
    const [isRegistrasiAsistenOn, setIsRegistrasiAsistenOn] = useState(false);
    const [isRegistrasiPraktikanOn, setIsRegistrasiPraktikanOn] = useState(false);
    const [isTugasBesarOn, setIsTugasBesarOn] = useState(false);
    const [isPollingAsistenOn, setIsPollingAsistenOn] = useState(false);
    const [lastEditedBy, setLastEditedBy] = useState("-");

    const queryClient = useQueryClient();

    const {
        data: configuration,
        isLoading,
    } = useConfigurationQuery({
        onError: (err) => {
            toast.error(err?.message ?? "Gagal memuat konfigurasi. Silakan coba lagi.");
            onClose();
        },
    });

    useEffect(() => {
        if (!configuration) {
            return;
        }

        setIsTugasPendahuluanOn(Boolean(configuration.tp_activation));
        setIsRegistrasiAsistenOn(Boolean(configuration.registrationAsisten_activation));
        setIsRegistrasiPraktikanOn(Boolean(configuration.registrationPraktikan_activation));
        setIsTugasBesarOn(Boolean(configuration.tubes_activation));
        setIsPollingAsistenOn(Boolean(configuration.polling_activation));
        setLastEditedBy(configuration.kode_asisten || "-");
    }, [configuration]);

    const getErrorMessage = (err) => {
        const response = err?.response;
        if (response) {
            if (response.status === 422) {
                const errors = response.data?.errors ?? {};
                const messages = Object.values(errors).flat();
                if (messages.length > 0) {
                    return messages[0];
                }
                return response.data?.message ?? "Validasi gagal.";
            }
            if (response.status === 404) {
                return "Data konfigurasi tidak ditemukan.";
            }
            if (response.status === 500) {
                return "Terjadi kesalahan di server. Silakan coba lagi.";
            }
            return response.data?.message ?? "Gagal menyimpan konfigurasi. Silakan coba lagi.";
        }

        return err?.message ?? "Gagal terhubung ke server.";
    };

    const updateConfigurationMutation = useMutation({
        mutationFn: async (configPayload) => {
            const { data } = await send(updateConfigurationRoute(), configPayload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
            toast.success("Konfigurasi berhasil diperbarui.");
            onClose();
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    // Handle save configuration
    const handleSave = async () => {
        const config = {
            tp_activation: isTugasPendahuluanOn ? 1 : 0,
            registrationAsisten_activation: isRegistrasiAsistenOn ? 1 : 0,
            registrationPraktikan_activation: isRegistrasiPraktikanOn ? 1 : 0,
            tubes_activation: isTugasBesarOn ? 1 : 0,
            polling_activation: isPollingAsistenOn ? 1 : 0,
        };

        updateConfigurationMutation.mutate(config);
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div className="depth-modal-container" style={{ maxWidth: 'var(--depth-modal-width-xl, 20vw)' }}>
                    <div className="depth-modal-header">
                        <h2 className="depth-modal-title flex items-center gap-2">
                            <img className="edit-icon-filter h-6 w-6" src={editIcon} alt="praktikum" /> Configuration
                        </h2>
                        <ModalCloseButton onClick={onClose} ariaLabel="Tutup konfigurasi" />
                    </div>

                    {isLoading ? (
                        <div className="py-10 text-center font-semibold text-depth-secondary">
                            Memuat konfigurasi...
                        </div>
                    ) : (
                        <>
                            {/* Switch Options */}
                            <div className="space-y-4">
                                {[
                                    { key: "tp_activation", label: "Tugas Pendahuluan", value: isTugasPendahuluanOn, setter: setIsTugasPendahuluanOn },
                                    { key: "registrationAsisten_activation", label: "Registrasi Asisten", value: isRegistrasiAsistenOn, setter: setIsRegistrasiAsistenOn },
                                    { key: "registrationPraktikan_activation", label: "Registrasi Praktikan", value: isRegistrasiPraktikanOn, setter: setIsRegistrasiPraktikanOn },
                                    // { key: "tubes_activation", label: "Tugas Besar", value: isTugasBesarOn, setter: setIsTugasBesarOn },
                                    { key: "polling_activation", label: "Polling Asisten", value: isPollingAsistenOn, setter: setIsPollingAsistenOn },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between">
                                        <span className="capitalize text-depth-primary font-semibold">{item.label}</span>
                                        <DepthToggleButton
                                            label={item.value ? "ON" : "OFF"}
                                            isOn={Boolean(item.value)}
                                            onToggle={() => item.setter((prev) => !prev)}
                                            disabled={updateConfigurationMutation.isPending}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Kode Asisten */}
                            <div className="text-right text-sm font-semibold text-depth-secondary mt-5">
                                Last edited by {lastEditedBy}
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={updateConfigurationMutation.isPending}
                                className="mt-4 w-full rounded-depth-md bg-[var(--depth-color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateConfigurationMutation.isPending ? "Menyimpan..." : "Simpan"}
                            </button>
                        </>
                    )}
            </div>
        </ModalOverlay>
    );
}
