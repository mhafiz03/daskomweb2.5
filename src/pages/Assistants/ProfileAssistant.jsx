import AssistantCard from "../../components/Components/Assistants/Buttons/AssistantCard";
import AssistantLayout from "../../layouts/AssistantLayout";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "../../lib/auth";

export default function ProfileAssistant() {
    useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    return (
        <AssistantLayout>
            {({ asisten }) => (
                <AssistantCard asisten={asisten} />
            )}
        </AssistantLayout>
    );
}
