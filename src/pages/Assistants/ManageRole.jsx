import { Suspense, lazy } from "react";
import AssistantLayout from "../../layouts/AssistantLayout";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "../../lib/auth";

const ContentManageRole = lazy(() =>
    import("../../components/Components/Assistants/Content/ContentManageRole")
);

export default function ManageRole() {
    useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });

    return (
        <AssistantLayout>
            {({ asisten }) => (
                <Suspense
                    fallback={
                        <div className="px-6 py-8 text-sm text-depth-secondary">
                            Memuat manajemen role...
                        </div>
                    }
                >
                    <ContentManageRole asisten={asisten} />
                </Suspense>
            )}
        </AssistantLayout>
    );
}
