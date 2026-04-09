import { useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import FormSoalInput from "../Forms/FormSoalInput";
import ButtonResetInputSoal from "../Modals/ModalResetInputSoal";
import ModalGoogleTools from "../Modals/ModalGoogleTools";

export default function ContentSoal({ isEditable = true }) {
    const [showModalReset, setShowModalReset] = useState(false);
    const [showGoogleTools, setShowGoogleTools] = useState(false);

    const handleOpenModalReset = () => setShowModalReset(true);
    const handleCloseModalReset = () => setShowModalReset(false);
    const handleCloseGoogleTools = () => setShowGoogleTools(false);

    const toolbarConfig = useMemo(
        () => ({
            title: "Manage Soal",
            actions: isEditable ? [
                {
                    id: "google-tools",
                    label: "Integrasi Google",
                    icon: "🔗",
                    variant: "primary",
                    onClick: () => setShowGoogleTools(true),
                },
            ] : [],
        }),
        [setShowGoogleTools, isEditable],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section className="space-y-6">

            {/* all dropdown input soal */}
            <div className="mt-4 rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">
                {/* Panggil komponen dropdown jenis soal */}
                <div className="w-full overflow-y-auto rounded-depth-lg p-6 h-[80vh]">
                    <FormSoalInput isEditable={isEditable} />
                </div>
            </div>

            {/* Modal Reset input soal */}
            {/* {showModalReset && <ButtonResetInputSoal onClose={handleCloseModalReset} />} */}
            {showGoogleTools ? <ModalGoogleTools onClose={handleCloseGoogleTools} /> : null}
        </section>
    );
}
