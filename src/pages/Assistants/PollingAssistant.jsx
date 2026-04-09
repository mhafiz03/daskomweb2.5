import ContentPolling from "../../components/Components/Assistants/Content/ContentPolling";
import AssistantLayout from "../../layouts/AssistantLayout";

export default function PollingAssistant() {
    return (
        <AssistantLayout>
            {({ roleName }) => (
                <ContentPolling roleName={roleName} />
            )}
        </AssistantLayout>
    );
}
