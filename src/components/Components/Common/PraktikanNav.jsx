import { useEffect, useMemo, useState } from 'react';

import { Link, useLocation } from "react-router-dom";
import { logout as logoutPraktikanSession } from "@/lib/auth";
import { api } from "@/lib/api";
import profileIcon from "../../../assets/nav/Icon-Profile.svg";
import praktikumIcon from "../../../assets/nav/Icon-Praktikum.svg";
import moduleIcon from "../../../assets/nav/Icon-Module.svg";
import nilaiIcon from "../../../assets/nav/Icon-Nilai.svg";
import asistenIcon from "../../../assets/nav/Icon-Asisten.svg";
import pollingIcon from "../../../assets/nav/Icon-Polling.svg";
import tpIcon from "../../../assets/nav/Icon-Laporan.svg";
import changePassIcon from "../../../assets/nav/Icon-GantiPassword.svg";
import logoutIcon from "../../../assets/nav/Icon-Logout.svg";
import komplainIcon from "../../../assets/nav/Icon-komplain.svg";
import ModalLogout from './Modals/ModalLogout';
import ModalPassword from './Modals/ModalPassword';

const STORAGE_KEY = 'praktikanNavCollapsed';

const NAV_ITEMS = [
    {
        href: "/praktikan",
        icon: profileIcon,
        label: "Profile",
        alt: "profile",
        paths: ["/praktikan"],
    },
    {
        href: "/praktikum",
        icon: praktikumIcon,
        label: "Praktikum",
        alt: "praktikum",
        paths: ["/praktikum"],
    },
    {
        href: "/praktikan-modul",
        icon: moduleIcon,
        label: "Modul",
        alt: "modul",
        paths: ["/praktikan-modul"],
    },
    {
        href: "/tugas-pendahuluan",
        icon: tpIcon,
        label: "Tugas Pendahuluan",
        alt: "tugas pendahuluan",
        paths: ["/tugas-pendahuluan"],
    },
    {
        href: "/score-praktikan",
        icon: nilaiIcon,
        label: "Nilai",
        alt: "nilai",
        paths: ["/score-praktikan"],
    },
    {
        href: "/contact-assistant",
        icon: asistenIcon,
        label: "Asisten",
        alt: "asisten",
        paths: ["/contact-assistant"],
    },
    {
        href: "/polling-assistant",
        icon: pollingIcon,
        label: "Polling",
        alt: "polling",
        paths: ["/polling-assistant"],
    },
];

export default function PraktikanNav({ praktikan }) {
    const location = useLocation();
    const updatePraktikanPasswordAction = (values) =>
        api.post("/api/auth/change-password", {
            currentPassword: values.current_password,
            newPassword: values.password,
        });

    const normalizePathSegment = (path) => {
        if (!path) {
            return "";
        }

        const basePath = path.split("?")[0];
        const trimmed = basePath.replace(/\/+$/, "");
        return trimmed === "" ? "/" : trimmed;
    };

    const normalizedUrl = useMemo(() => normalizePathSegment(location.pathname) || "/", [location.pathname]);

    const getInitialCollapsed = () => {
        if (typeof window === 'undefined') {
            return true;
        }
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored !== null ? stored === 'true' : true;
    };

    const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Theme state
    const getTheme = () => {
        if (typeof window === 'undefined') return 'light';
        const stored = window.localStorage.getItem('depth-theme');
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    const [theme, setTheme] = useState(getTheme);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem('depth-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((c) => (c === 'dark' ? 'light' : 'dark'));

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const toggleSidebar = () => {
        if (!isCollapsed) {
            setIsAnimating(true);
            setTimeout(() => {
                setIsCollapsed((prev) => !prev);
                setIsAnimating(false);
            }, 300);
        } else {
            setIsCollapsed((prev) => !prev);
        }
    };

    const isActiveItem = (item) => {
        if (!item?.paths || !normalizedUrl) {
            return false;
        }

        return item.paths.some((path) => {
            const normalizedPath = normalizePathSegment(path);
            if (!normalizedPath) {
                return false;
            }

            if (normalizedPath === normalizedUrl) {
                return true;
            }

            return normalizedUrl.startsWith(`${normalizedPath}/`);
        });
    };

    const navLinkBaseClass =
        "group relative flex w-full items-center gap-3 rounded-depth-md px-2 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)] hover:-translate-y-0.5 hover:shadow-depth-md";
    const activeLinkClass =
        "bg-[var(--depth-color-primary)] text-white shadow-depth-md hover:bg-[var(--depth-color-primary)]";
    const inactiveLinkClass = "text-depth-primary hover:bg-depth-interactive";
    const labelVisibilityClass = isCollapsed
        ? "opacity-0 delay-0"
        : isAnimating
            ? "opacity-0"
            : "opacity-100 delay-300";
    const navLabelBaseClass = `text-sm font-medium transition-opacity duration-300 whitespace-nowrap ${labelVisibilityClass}`;
    const navIconClass = "h-6 w-6 flex-shrink-0 transition-all duration-300";

    // Helper function to get icon filter classes based on state
    const getIconFilterClass = (isActive) =>
        isActive ? "nav-icon-filter-active" : "nav-icon-filter";

    const genericHamburgerLine = `h-1 w-6 my-1 rounded-full bg-slate-500 dark:bg-white transition ease transform duration-300`;

    return (
        <>
            <nav className="flex h-screen items-center">
                <div
                    className={`mx-2 flex h-[91vh] flex-col rounded-depth-lg border border-depth bg-depth-card dark:glass-surface shadow-depth-lg transition-all duration-300 ${isCollapsed ? "w-12" : "w-[230px]"
                        }`}
                >
                    <div className={`relative flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
                        <button
                            className="group flex flex-col items-center justify-center p-3"
                            onClick={toggleSidebar}
                            aria-label="Toggle navigation"
                        >
                            <div
                                className={`${genericHamburgerLine} ${isCollapsed ? "opacity-100" : "translate-y-3 rotate-45"
                                    }`}
                            />
                            <div
                                className={`${genericHamburgerLine} ${isCollapsed ? "opacity-100" : "opacity-0"
                                    }`}
                            />
                            <div
                                className={`${genericHamburgerLine} ${isCollapsed ? "opacity-100" : "-translate-y-3 -rotate-45"
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex flex-grow flex-col justify-between py-1">
                        {/* Top Navigation Items */}
                        <ul className={`flex flex-col gap-1 py-1 ${isCollapsed ? "px-1" : "px-4"}`}>
                            {NAV_ITEMS.map((item) => {
                                const isActive = isActiveItem(item);
                                const linkClasses = `${navLinkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass
                                    }`;
                                const iconClasses = `${navIconClass} ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                                    } ${getIconFilterClass(isActive)}`;
                                const labelClasses = `${navLabelBaseClass} ${isActive ? "text-gray-50" : "text-depth-primary"
                                    }`;

                                return (
                                    <li key={item.href}>
                                        <Link to={item.href} className={linkClasses}>
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute inset-y-1 translate-x-1 right-1 w-1 rounded-depth-full "
                                                />
                                            )}
                                            <img
                                                className={iconClasses}
                                                src={item.icon}
                                                alt={item.alt}
                                            />
                                            <span className={labelClasses}>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Bottom Navigation Items */}
                        <ul className={`flex flex-col gap-1 py-8 ${isCollapsed ? "px-1" : "px-4"}`}>
                            {/* Theme Toggle */}
                            <li className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-2"} py-2`}>
                                {isCollapsed ? (
                                    <button
                                        type="button"
                                        onClick={toggleTheme}
                                        className={`${navLinkBaseClass} ${inactiveLinkClass} justify-center`}
                                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                    >
                                        {isDark ? (
                                            <svg className="h-6 w-6 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-6 w-6 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={toggleTheme}
                                            className="relative flex h-7 w-12 flex-shrink-0 items-center rounded-full border border-depth transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-1"
                                            style={{ backgroundColor: isDark ? 'var(--depth-color-primary)' : 'var(--depth-color-interactive)' }}
                                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                        >
                                            <span
                                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'translate-x-[22px]' : 'translate-x-[3px]'}`}
                                            >
                                                {isDark ? (
                                                    <svg className="h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                    </svg>
                                                )}
                                            </span>
                                        </button>
                                        <span className={`${navLabelBaseClass} text-depth-primary`}>
                                            {isDark ? 'Dark' : 'Light'}
                                        </span>
                                    </>
                                )}
                            </li>

                            <li>
                                <button
                                    type="button"
                                    className={`${navLinkBaseClass} ${inactiveLinkClass}`}
                                    onClick={() => setIsPasswordModalOpen(true)}
                                >
                                    <img
                                        className={`${navIconClass} opacity-70 group-hover:opacity-100 ${getIconFilterClass(false)}`}
                                        src={changePassIcon}
                                        alt="change password"
                                    />
                                    <span className={`${navLabelBaseClass} text-depth-primary`}>
                                        Change Password
                                    </span>
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    className={`${navLinkBaseClass} ${inactiveLinkClass}`}
                                    onClick={() => setShowLogoutModal(true)}
                                >
                                    <img
                                        className={`${navIconClass} opacity-70 group-hover:opacity-100 ${getIconFilterClass(false)}`}
                                        src={logoutIcon}
                                        alt="logout"
                                    />
                                    <span className={`${navLabelBaseClass} text-depth-primary`}>
                                        Logout
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <ModalPassword
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                updatePasswordAction={updatePraktikanPasswordAction}
                userType="praktikan"
            />

            <ModalLogout
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                logoutAction={logoutPraktikanSession}
                onLogoutSuccess={() => {
                    window.location.href = "/";
                }}
            />
        </>
    );
}
