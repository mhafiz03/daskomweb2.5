import { useMemo } from "react";
import { useAssistantToolbar } from "@/Layouts/AssistantToolbarContext";
import DropdownLaporanModule from "../Dropdowns/DropdownLaporanModule";
import TableLaporan from "../Tables/TableLaporan";

export default function ContentLaporan() {
    const toolbarConfig = useMemo(
        () => ({
            title: "Laporan Praktikum",
        }),
        [],
    );

    useAssistantToolbar(toolbarConfig);

    return (
        <section>
            <div className="mb-6">
                <DropdownLaporanModule />
            </div>

            {/* Table data laporan */}
            <div className="">
                <TableLaporan />
            </div>
        </section>
    )
}
