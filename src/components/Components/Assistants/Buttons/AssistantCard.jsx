import { useMemo, useState, useEffect } from "react";
import { Image } from "@imagekit/react";
import ModalEditProfile from "../Modals/ModalEditProfile";
import iconWA from "../../../../assets/contact/iconWhatsapp.svg";
import iconLine from "../../../../assets/contact/iconLine.svg";
import iconIG from "../../../../assets/contact/iconInstagram.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import daskomIcon from "../../../../assets/daskom.svg";
import lightBanner from "../../../../assets/Profile-Banner.gif";
import darkBanner from "../../../../assets/Dark-Profile-Banner.gif";

export default function AssistantCard({ asisten }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial theme
        const theme = document.documentElement.dataset.theme || 
                     (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setIsDarkMode(theme === "dark");

        // Listen for theme changes
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.dataset.theme;
            setIsDarkMode(newTheme === "dark");
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        return () => observer.disconnect();
    }, []);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    // Dynamic stats derived from the 'asisten' prop
    const stats = useMemo(() => [
        { label: "Teaching", value: asisten?.teaching_count || "0" },
        { label: "Ungraded", value: asisten?.ungraded_praktikan || "0" },
    ], [asisten]);

    const roleName = asisten?.roles?.[0]?.name ?? "Asisten";

    return (
        <>
            <div className="flex justify-center px-4 py-8">
                <div className="w-full max-w-4xl overflow-hidden rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">

                    {/* Header Banner Area */}
                    <div 
                        className="relative h-56 w-full bg-depth-background overflow-hidden bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url('${isDarkMode ? darkBanner : lightBanner}')` }}
                    >

                        {/* Edit Button - Floating Top Right */}
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={handleOpenModal}
                                className="group flex h-10 w-10 items-center justify-center rounded-depth-full border border-depth bg-depth-interactive shadow-depth-sm transition hover:-translate-y-0.5"
                            >
                                <img className="edit-icon-filter h-4 w-4 opacity-70 group-hover:opacity-100" src={editIcon} alt="Edit" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                        {/* LEFT SIDEBAR: Brand Primary Color Area */}
                        <div className="relative w-full bg-[var(--depth-color-primary)] p-8 text-white md:w-1/3">

                            {/* Profile Image - Circular & Floating */}
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0">
                                <div className="relative h-40 w-40 overflow-hidden rounded-depth-full border-4 border-[var(--depth-color-primary)] bg-depth-background shadow-depth-lg">
                                    {asisten?.foto_asistens?.foto ? (
                                        <Image
                                            src={asisten.foto_asistens.foto}
                                            transformation={[{ height: "160", width: "160", crop: "maintain_ratio" }]}
                                            className="h-full w-full object-cover"
                                            alt={asisten?.nama}
                                        />
                                    ) : (
                                        <img src={daskomIcon} className="h-full w-full object-cover" alt="default" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-20 text-center md:mt-24 md:text-left">
                                <h2 className="text-2xl font-bold tracking-tight text-white">
                                    {asisten?.nama ?? "Asisten Daskom"}
                                </h2>
                                <p className="mt-1 text-sm font-medium opacity-80 italic">
                                    {roleName}
                                </p>

                                {/* Social Icons - Centered or Left aligned */}
                                <div className="mt-6 flex flex-col justify-center gap-3 md:justify-start">
                                    {/* WhatsApp Row */}
                                    <div className="flex items-center gap-3 group cursor-default">
                                        <img src={iconWA} className="h-5 w-5 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition" alt="WA" />
                                        <span className="text-sm text-white">{asisten?.nomor_telepon}</span>
                                    </div>

                                    {/* Line Row */}
                                    <div className="flex items-center gap-3 group cursor-default">
                                        <img src={iconLine} className="h-5 w-5 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition" alt="Line" />
                                        <span className="text-sm text-white">{asisten?.id_line}</span>
                                    </div>

                                    {/* IG Row */}
                                    <div className="flex items-center gap-3 group cursor-default">
                                        <img src={iconIG} className="h-5 w-5 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition" alt="IG" />
                                        <span className="text-sm text-white">{asisten?.instagram}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT CONTENT: Descriptive Area */}
                        <div className="flex-1 p-8 md:p-12">
                            <div className="flex flex-col gap-6">
                                {/* Star Rating Section */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-amber-400 drop-shadow-sm">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <span key={index} className={`text-lg ${index < Math.round(asisten?.rating || 0) ? "opacity-100" : "opacity-30"}`}>★</span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-depth-secondary opacity-60">({(asisten?.rating || 0).toFixed(1)})</span>
                                </div>

                                {/* About Section */}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-depth-secondary mb-3">
                                        About
                                    </h3>
                                    <p className="text-lg leading-relaxed text-depth-primary">
                                        {asisten?.deskripsi || "Belum ada deskripsi yang ditambahkan untuk asisten ini."}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <ModalEditProfile isOpen={isModalOpen} onClose={handleCloseModal} />
        </>
    );
}
