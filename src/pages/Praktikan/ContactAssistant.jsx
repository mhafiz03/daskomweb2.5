import { useQuery } from "@tanstack/react-query";
import PraktikanAuthenticated from "../../layouts/PraktikanAuthenticatedLayout";
import ContactAssistantTable from "../../components/Components/Praktikans/Tables/ContactAssistantTable";
import PraktikanPageHeader from "../../components/Components/Praktikans/Common/PraktikanPageHeader";
import PraktikanUtilities from "../../components/Components/Praktikans/Layout/PraktikanUtilities";

export default function ContactAssistant() {
    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    });
    const praktikan = me ?? null;

    return (
        <>
            <PraktikanAuthenticated
                praktikan={praktikan}
                customWidth="w-[80%]"
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard
                    </h2>
                }
            >
                <div className="-mt-[1vh] flex flex-col gap-6">
                    <PraktikanPageHeader title="Kontak Asisten" />
                    <ContactAssistantTable />
                </div>
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
