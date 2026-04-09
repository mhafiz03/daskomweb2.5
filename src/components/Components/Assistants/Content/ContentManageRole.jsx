import { useCallback, useMemo, useState } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import ButtonAddRole from "../Modals/ModalAddRole";
import TableManageRole from "../Tables/TableRole";

export default function ContentManageRole({ asisten }) {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleOpenModal = useCallback(() => setShowModal(true), []);
    const handleCloseModal = useCallback(() => setShowModal(false), []);

    const toolbarConfig = useMemo(
        () => ({
            title: "Manage Asisten",
            actions: [
                {
                    id: "add-role",
                    label: "+ Role",
                    onClick: handleOpenModal,
                },
            ],
        }),
        [handleOpenModal],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section className="space-y-6 text-depth-primary">
            <TableManageRole
                asisten={asisten}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                showSearchInput={false}
            />

            {showModal && <ButtonAddRole onClose={handleCloseModal} />}
        </section>
    );
}
