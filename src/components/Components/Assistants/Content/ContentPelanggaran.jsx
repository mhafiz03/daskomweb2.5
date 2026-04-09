import { useCallback, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import ButtonResetPelanggaran from "../Modals/ModalResetPelanggaran";
import TablePelanggaran from "../Tables/TablePelanggaran";

export default function ContentPelanggaran() {
    const [showModalReset, setShowModalReset] = useState(false);

    const handleOpenModalReset = useCallback(() => setShowModalReset(true), []);
    const handleCloseModalReset = useCallback(() => setShowModalReset(false), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Pelanggaran",
            actions: [
                {
                    id: "reset-pelanggaran",
                    label: "Reset",
                    onClick: handleOpenModalReset,
                    variant: "danger",
                },
            ],
        }),
        [handleOpenModalReset],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section>
            {/* Table data pelanggaran */}
            <div className="">
                <TablePelanggaran />
            </div>

            {/* Modal Reset Pelanggaran */}
            {showModalReset && <ButtonResetPelanggaran onClose={handleCloseModalReset} />} 
        </section>
    );
}
