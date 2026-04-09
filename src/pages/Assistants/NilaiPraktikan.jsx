import ContentNilai from "../../components/Components/Assistants/Content/ContentNilai";
import AssistantLayout from "../../layouts/AssistantLayout";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "../../lib/auth";

export default function NilaiPraktikan() {
    const { data: asisten } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    return (
        <AssistantLayout>
            <ContentNilai asisten={asisten} />
        </AssistantLayout>
    );
}
