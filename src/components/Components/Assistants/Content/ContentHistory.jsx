import { useCallback, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import TableHistory from "../Tables/TableHistory";
import ModalAnomalyPraktikum from "../Modals/ModalAnomalyPraktikum";

export default function ContentHistory() {
    const [showAnomalyModal, setShowAnomalyModal] = useState(false);

    const handleOpenAnomalyModal = useCallback(() => setShowAnomalyModal(true), []);
    const handleCloseAnomalyModal = useCallback(() => setShowAnomalyModal(false), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "History Praktikum",
            actions: [
                {
                    id: "anomaly",
                    label: "Anomali",
                    icon: "⚠️",
                    variant: "primary",
                    onClick: handleOpenAnomalyModal,
                },
            ],
        }),
        [handleOpenAnomalyModal],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <>
            <section className="space-y-6 text-depth-primary">
                <TableHistory />
            </section>
            {showAnomalyModal ? <ModalAnomalyPraktikum onClose={handleCloseAnomalyModal} /> : null}
        </>
    );
}
