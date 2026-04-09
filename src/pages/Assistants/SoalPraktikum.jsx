import ContentSoal from "../../components/Components/Assistants/Content/ContentSoal";
import AssistantLayout from "../../layouts/AssistantLayout";
import { useQuery } from "@tanstack/react-query";
import { getSession, hasPermission } from "../../lib/auth";

export default function SoalPraktikum() {
    const { data: asisten } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    return (
        <AssistantLayout>
            <ContentSoal isEditable={hasPermission(asisten, "manage-soal")} />
        </AssistantLayout>
    );
}
