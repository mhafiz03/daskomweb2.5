import AssistantLayout from "../../layouts/AssistantLayout";
import ContentManagePraktikan from "../../components/Components/Assistants/Content/ContentManagePraktikan";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "../../lib/auth";

export default function ManagePraktikan() {
    useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    return (
        <AssistantLayout>
            {({ asisten }) => (
                <ContentManagePraktikan asisten={asisten} />
            )}
        </AssistantLayout>
    );
}
