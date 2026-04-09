import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Image } from "@imagekit/react";
import daskomIcon from "../../../../assets/daskom.svg";
import editIcon from "../../../../assets/nav/Icon-Edit.svg";
import lightBanner from "../../../../assets/Praktikan-Profile-Banner.gif";
import darkBanner from "../../../../assets/Dark-Praktikan-Banner.gif";
import ModalEditProfilePraktikan from "../Modals/ModalEditProfilePraktikan";

export default function CardPraktikan({ praktikan }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial theme
        const theme = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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

    // New Stats for Praktikan
    const stats = useMemo(() => [
        { label: "Attendance", value: praktikan?.attendance_pct || "100%" },
        { label: "Avg Score", value: praktikan?.avg_score || "0.0" },
    ], [praktikan]);

    return (
        <>
            <div className="flex justify-center px-4 py-10 font-poppins">
                <div className="w-full overflow-hidden rounded-depth-lg border border-depth bg-depth-card shadow-depth-lg">

                    {/* Header Banner Area */}
                    <div
                        className="relative h-56 w-full bg-depth-background overflow-hidden bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url('${isDarkMode ? darkBanner : lightBanner}')` }}
                    >
                        {/* Edit Button */}
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={handleOpenModal}
                                className="group flex h-10 w-10 items-center justify-center rounded-depth-full border border-depth bg-depth-interactive shadow-depth-sm transition hover:-translate-y-0.5"
                            >
                                <img className="edit-icon filter h-4 w-4 opacity-70 group-hover:opacity-100" src={editIcon} alt="Edit" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                        {/* LEFT SIDEBAR: Brand Primary Color Area */}
                        <div className="relative w-full bg-[var(--depth-color-primary)] p-8 text-white md:w-1/3">

                            {/* Profile Image */}
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0">
                                <div className="relative h-40 w-40 overflow-hidden rounded-depth-full border-4 border-[var(--depth-color-primary)] bg-depth-background shadow-depth-lg">
                                    {praktikan?.profile_picture_url ? (
                                        <Image
                                            src={praktikan.profile_picture_url}
                                            transformation={[{ height: "160", width: "160", crop: "maintain_ratio" }]}
                                            className="h-full w-full object-cover"
                                            alt={praktikan?.nama}
                                        />
                                    ) : (
                                        <img src={daskomIcon} className="h-full w-full object-cover" alt="default" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-20 text-center md:mt-24 md:text-left">
                                <h2 className="text-2xl font-bold tracking-tight text-white truncate">
                                    {praktikan?.nama}
                                </h2>
                                <p className="mt-1 text-sm font-medium opacity-80 uppercase tracking-widest">
                                    {praktikan?.nim}
                                </p>
                            </div>

                            {/* Stats Section - Attendance, Score, etc. */}
                            <div className="mt-10 grid grid-cols-2 border-t border-white/20 pt-6 text-center">
                                {stats.map((stat, i) => (
                                    <div key={i} className={i < 2 ? "border-r border-white/10" : ""}>
                                        <p className="text-xl font-bold">{stat.value}</p>
                                        <p className="text-[10px] uppercase tracking-tighter opacity-70">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT CONTENT: Descriptive Area */}
                        <div className="flex-1 p-8 md:p-12">
                            <div className="flex items-center justify-between border-b border-depth pb-4">
                                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-depth-secondary">
                                    Student Profile
                                </h3>
                                {/* Daskom Badge */}
                                <span className="text-[10px] font-bold px-3 py-1 bg-depth-interactive border border-depth rounded-full text-depth-secondary">
                                    DASKOM LABORATORY
                                </span>
                            </div>

                            <div className="mt-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-bold uppercase text-depth-secondary opacity-60 tracking-widest">Academic Class</h4>
                                        <p className="mt-1 text-lg font-semibold text-depth-primary truncate">
                                            {praktikan?.kelas?.kelas ?? praktikan?.kelas_id ?? "-"}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-bold uppercase text-depth-secondary opacity-60 tracking-widest">Contact Number</h4>
                                        <p className="mt-1 text-lg font-semibold text-depth-primary truncate">
                                            {praktikan?.nomor_telepon || "-"}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-bold uppercase text-depth-secondary opacity-60 tracking-widest">Email Address</h4>
                                        <p className="mt-1 text-lg font-semibold text-depth-primary truncate">
                                            {praktikan?.email || "-"}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-bold uppercase text-depth-secondary opacity-60 tracking-widest">Address</h4>
                                        <p className="mt-1 text-lg font-semibold text-depth-primary truncate">
                                            {praktikan?.alamat || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action Area */}
                            <div className="mt-10 flex gap-4">
                                <Link
                                    to="/score-praktikan"
                                    className="inline-block text-center rounded-depth-full bg-[var(--depth-color-primary)] px-8 py-2.5 text-sm font-bold text-white shadow-depth-sm transition hover:brightness-110"
                                >
                                    View Grades
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ModalEditProfilePraktikan
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                praktikan={praktikan}
            />
        </>
    );
}
