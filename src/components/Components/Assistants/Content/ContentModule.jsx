import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";

const ButtonAddModule = lazy(() => import("../Modals/ModalAddModule"));
const ButtonResetModule = lazy(() => import("../Modals/ModalResetModule"));
const TableModule = lazy(() => import("../Tables/TableModule"));

export default function ContentModule() {
    const [showModal, setShowModal] = useState(false);
    const [showModalReset, setShowModalReset] = useState(false);

    const handleOpenModal = useCallback(() => setShowModal(true), []);
    const handleCloseModal = useCallback(() => setShowModal(false), []);
    const handleOpenModalReset = useCallback(() => setShowModalReset(true), []);
    const handleCloseModalReset = useCallback(() => setShowModalReset(false), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Modul Praktikum",
            actions: [
                {
                    id: "add-module",
                    label: "+ Modul",
                    onClick: handleOpenModal,
                },
                {
                    id: "reset-modul",
                    label: "Reset",
                    onClick: handleOpenModalReset,
                    variant: "danger",
                },
            ],
        }),
        [handleOpenModal, handleOpenModalReset],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section className="space-y-6 text-depth-primary">
            <Suspense fallback={<div className="text-sm text-depth-secondary">Memuat daftar modul...</div>}>
                <TableModule />
            </Suspense>

            {showModal && (
                <Suspense fallback={null}>
                    <ButtonAddModule onClose={handleCloseModal} />
                </Suspense>
            )}

            {showModalReset && (
                <Suspense fallback={null}>
                    <ButtonResetModule onClose={handleCloseModalReset} />
                </Suspense>
            )}
        </section>
    );
}
