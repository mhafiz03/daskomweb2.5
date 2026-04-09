import { useQuery } from "@tanstack/react-query";
import PraktikanAuthenticated from "../../layouts/PraktikanAuthenticatedLayout";
import PraktikanCard from "../../components/Components/Praktikans/Sections/CardPraktikan";
import PraktikanUtilities from "../../components/Components/Praktikans/Layout/PraktikanUtilities";
import { getSession } from "../../lib/auth";

export default function ProfilePraktikan() {
    const { data: session } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
    });
    const praktikan = session ?? null;

    return (
        <>
            <PraktikanAuthenticated
                praktikan={praktikan}
                customWidth="w-[60%]"
            >
                <PraktikanCard praktikan={praktikan} />
            </PraktikanAuthenticated>
            <PraktikanUtilities />
        </>
    );
}
