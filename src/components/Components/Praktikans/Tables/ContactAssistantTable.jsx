import { useState } from "react";
import { Image } from "@imagekit/react";
import toast from "react-hot-toast";
import daskomIcon from "../../../../assets/daskom.svg";
import { Dialog } from "@headlessui/react";
import iconWA from "../../../../assets/contact/iconWhatsapp.svg";
import iconLine from "../../../../assets/contact/iconLine.svg";
import iconIG from "../../../../assets/contact/iconInstagram.svg";
import { useAsistensQuery } from "@/hooks/useAsistensQuery";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ContactAssistantTable() {
    const [selectedAsisten, setSelectedAsisten] = useState(null);
    const {
        data: asistens = [],
        isLoading,
        isError,
        error,
    } = useAsistensQuery({
        onError: () => {
            toast.error("Whoops terjadi kesalahan 😢, silahkan hubungi software 😁");
        },
    });


    const openModal = (asisten) => {
        setSelectedAsisten(asisten);
    };
    
    const closeModal = () => {
        setSelectedAsisten(null);
    };

    const RowComponent = ({ asisten }) => (
        <div className="mb-2 cursor-pointer" onClick={() => openModal(asisten)}>
            <div className="flex items-center justify-between rounded-depth-md border border-depth bg-depth-card px-4 py-3 shadow-depth-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-depth-lg">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-depth shadow-depth-sm">
                        {asisten?.foto ? (
                            <Image
                                src={asisten.foto}
                                transformation={[{ height: "48", width: "48", crop: "maintain_ratio" }]}
                                alt={asisten.kode}
                                className="h-full w-full object-cover object-top"
                                loading="lazy"
                            />
                        ) : (
                            <img
                                src={daskomIcon}
                                alt={asisten.kode}
                                className="h-full w-full object-cover object-top"
                            />
                        )}
                    </div>
                    <span className="min-w-[145px] max-w-[146px] break-words text-center font-semibold text-depth-primary">
                        {asisten.nama}
                    </span>
                </div>
                <span className="ml-16 min-w-[48px] max-w-[55px] flex-1 pl-[1px] font-medium text-depth-primary">
                    {asisten.kode}
                </span>
                <span className="ml-12 mr-4 min-w-[100px] max-w-[120px] flex-1 text-center font-medium text-depth-secondary">
                    {asisten.nomor_telepon}
                </span>
                <span className="ml-4 min-w-[40px] max-w-[115px] flex-1 break-words text-center font-medium text-depth-secondary">
                    {asisten.id_line}
                </span>
                <span className="ml-7 mr-10 min-w-[40px] max-w-[115px] flex-1 break-words text-center font-medium text-depth-secondary">
                    {asisten.instagram}
                </span>
            </div>
        </div>
    );

    return (
        <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-6 shadow-depth-lg">
            <div className="rounded-depth-md bg-[var(--depth-color-primary)] px-4 py-3 shadow-depth-md">
                <div className="ml-20 mr-12 flex items-center justify-evenly">
                    <h1 className="text-center font-bold text-white">Nama</h1>
                    <h1 className="text-center font-bold text-white">Kode</h1>
                    <h1 className="text-center font-bold text-white">WhatsApp</h1>
                    <h1 className="text-center font-bold text-white">ID Line</h1>
                    <h1 className="text-center font-bold text-white">Instagram</h1>
                </div>
            </div>
            <div className="mx-auto mt-6 h-[69vh] max-w-[850px] overflow-y-auto scrollbar-thin scrollbar-track-depth scrollbar-thumb-depth-secondary">
                {isLoading ? (
                    <div className="py-10 text-center text-depth-secondary">Memuat data...</div>
                ) : isError ? (
                    <div className="py-10 text-center text-red-500">
                        Error: {error?.message ?? "Gagal memuat data asisten"}
                    </div>
                ) : asistens.length > 0 ? (
                    asistens.map((asisten, index) => <RowComponent key={index} asisten={asisten} />)
                ) : (
                    <div className="py-10 text-center text-depth-secondary">Tidak ada data asisten yang tersedia</div>
                )}
            </div>

            {/* Modal */}
            {selectedAsisten && (
                <Dialog open={true} onClose={closeModal} className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

                    {/* Main Container with Depth Gradient */}
                    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--depth-glass-border)] bg-[var(--depth-color-card)] shadow-depth-lg transition-all">

                        {/* Background Gradient Shapes */}
                        <div className="absolute inset-0 z-0 opacity-40" style={{ background: "var(--depth-gradient-background)" }} />

                        <div className="relative z-10 p-6">
                            <ModalCloseButton onClick={closeModal} className="absolute right-4 top-4 opacity-60 hover:opacity-100" />

                            {/* Profile Section */}
                            <div className="flex flex-col items-start pt-2">
                                <div className="relative mb-4">
                                    <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--depth-color-card)] bg-depth-background shadow-depth-md">
                                        <Image src={selectedAsisten.foto || daskomIcon} alt={selectedAsisten.kode} className="h-full w-full object-cover" />
                                    </div>
                                    {/* Online Indicator using Primary Color */}
                                    <div className="absolute bottom-0 right-1 h-5 w-5 rounded-full border-3 border-[var(--depth-color-card)] bg-[var(--depth-color-primary)] shadow-sm" />
                                </div>

                                <h2 className="text-2xl font-bold tracking-tight text-depth-primary">{selectedAsisten.nama}</h2>
                                <p className="text-sm font-medium text-depth-secondary opacity-80">{selectedAsisten.kode}</p>
                            </div>

                            {/* About Me Section */}
                            <div className="mt-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-depth-secondary opacity-60">About Me</h3>
                                <p className="mt-2 text-sm text-depth-primary leading-relaxed">
                                    {selectedAsisten.deskripsi || "No description provided for this assistant."}
                                </p>
                            </div>

                            {/* Social Media Section - Row Ordered with Labels */}
                            <div className="mt-5 border-t border-depth pt-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-depth-secondary opacity-60 mb-2">Contact & Socials</h3>
                                <div className="space-y-2">
                                    {/* WhatsApp Row */}
                                    <div
                                        className="group flex items-center gap-2 rounded-lg bg-[var(--depth-color-interactive)] border border-depth p-2 transition-all "
                                    >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/50 shadow-sm">
                                            <img className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" src={iconWA} alt="WA" />
                                        </div>
                                        <span className="text-xs font-medium text-depth-primary">{selectedAsisten.nomor_telepon || "Not Available"}</span>
                                    </div>

                                    {/* ID Line Row */}
                                    <div className="group flex items-center gap-2 rounded-lg bg-[var(--depth-color-interactive)] border border-depth p-2 transition-all">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/50 shadow-sm">
                                            <img className="h-3.5 w-3.5 opacity-80" src={iconLine} alt="Line" />
                                        </div>
                                        <span className="text-xs font-medium text-depth-primary">{selectedAsisten.id_line || "Not Available"}</span>
                                    </div>

                                    {/* Instagram Row */}
                                    <div
                                        className="group flex items-center gap-2 rounded-lg bg-[var(--depth-color-interactive)] border border-depth p-2 transition-all "
                                    >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/50 shadow-sm">
                                            <img className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" src={iconIG} alt="IG" />
                                        </div>
                                        <span className="text-xs font-medium text-depth-primary">{selectedAsisten.instagram || "username"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button using Button Gradients */}
                            <a
                                href={`https://wa.me/${selectedAsisten.nomor_telepon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-6 flex w-full items-center justify-center rounded-[var(--depth-radius-full)] py-3 text-center text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-depth-md"
                                style={{ background: "linear-gradient(135deg, var(--depth-button-gradient-start), var(--depth-button-gradient-end))" }}
                            >
                                Get In Touch
                            </a>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
