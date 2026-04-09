import { useCallback, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import ButtonAddPlotting from "../Modals/ModalAddPlottingan";
import ButtonResetPlotting from "../Modals/ModalResetPlottingan";
import TablePlottingan from "../Tables/TablePlottingan";

export default function ContentPlottingan() {
    const [showModal, setShowModal] = useState(false);
    const [showModalReset, setShowModalReset] = useState(false);

    const handleOpenModal = useCallback(() => setShowModal(true), []);
    const handleCloseModal = useCallback(() => setShowModal(false), []);

    const handleOpenModalReset = useCallback(() => setShowModalReset(true), []);
    const handleCloseModalReset = useCallback(() => setShowModalReset(false), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Plotting Jadwal",
            actions: [
                {
                    id: "add-schedule",
                    label: "+ Jadwal",
                    onClick: handleOpenModal,
                },
                {
                    id: "reset-schedule",
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
            <TablePlottingan />

            {showModal && <ButtonAddPlotting onClose={handleCloseModal} />}

            {showModalReset && <ButtonResetPlotting onClose={handleCloseModalReset} />}
        </section>
    );
}
