import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AssisstantNav from "@/Components/Common/AssistantNav";
import ThemeToggle from "@/Components/Common/ThemeToggle";
import { getPermissions, getSession } from "@/lib/auth";
import auditIcon from "../assets/nav/Icon-Audit.svg";
import { Toaster } from "react-hot-toast";
import { AssistantToolbarContext } from "./AssistantToolbarContext";

export default function AssistantLayout({
    children,
    layoutClassName = "overflow-hidden relative flex items-start justify-start bg-depth-gradient px-4 py-10 text-depth-primary transition-colors duration-300",
}) {
    const { data: sessionUser } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
        staleTime: 60_000,
    });
    const permissionNames = getPermissions(sessionUser);
    const roleName = sessionUser?.asistenRole ?? null;
    const asisten = useMemo(() => {
        if (!sessionUser) {
            return null;
        }

        return {
            ...sessionUser,
            nama: sessionUser.name,
            role: {
                name: roleName,
                permissions: permissionNames.map((name) => ({ name })),
            },
        };
    }, [permissionNames, roleName, sessionUser]);
    const permissions = asisten?.role?.permissions ?? [];

    const [toolbar, setToolbarState] = useState(null);

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, []);

    const setToolbar = useCallback((value) => {
        setToolbarState(value);
    }, []);

    const clearToolbar = useCallback(() => {
        setToolbarState(null);
    }, []);

    const toolbarValue = useMemo(
        () => ({
            toolbar,
            setToolbar,
            clearToolbar,
        }),
        [clearToolbar, setToolbar, toolbar],
    );

    const renderedChildren =
        typeof children === "function"
            ? children({ asisten, permissions, permissionNames, roleName })
            : children;

    const toolbarActions = useMemo(() => {
        if (!toolbar || !toolbar.actions) {
            return [];
        }

        const actions = Array.isArray(toolbar.actions) ? toolbar.actions : [toolbar.actions];
        return actions.filter(Boolean);
    }, [toolbar]);

    const renderToolbarAction = useCallback((action) => {
        if (!action || !action.label) {
            return null;
        }

        const { label, href, onClick, icon, variant = "secondary", id, disabled = false } = action;
        const actionKey = id ?? `${label}-${href ?? "action"}`;

        const baseButtonClass = "inline-flex items-center gap-2 rounded-depth-md border px-3 py-2 text-xs font-semibold shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--depth-color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--depth-color-background)] md:text-sm";

        const variantClass =
            variant === "primary"
                ? "border-transparent bg-[var(--depth-color-primary)] text-white"
                : variant === "danger"
                    ? "border-red-500/60 bg-red-500/15 text-red-500"
                    : "border-depth bg-depth-interactive text-depth-primary";

        const disabledClass = disabled ? "pointer-events-none opacity-60" : "";

        const content = (
            <>
                {icon ? <span className="text-lg leading-none">{icon}</span> : null}
                <span>{label}</span>
            </>
        );

        if (href) {
            return (
                <Link key={actionKey} to={href} className={`${baseButtonClass} ${variantClass} ${disabledClass}`}>
                    {content}
                </Link>
            );
        }

        return (
            <button
                key={actionKey}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`${baseButtonClass} ${variantClass} ${disabledClass}`}
            >
                {content}
            </button>
        );
    }, []);

    const toolbarHeader = useMemo(() => {
        if (!toolbar) {
            return null;
        }

        const { title, right } = toolbar;

        return (
            <div className="mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        {title ? (
                            <div className="rounded-depth-lg border border-depth bg-depth-card px-10 py-4 shadow-depth-sm">
                                <h6 className="text-lg font-semibold text-depth-primary">{title}</h6>
                            </div>
                        ) : null}
                        {toolbarActions.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {toolbarActions.map((action) => renderToolbarAction(action))}
                            </div>
                        ) : null}
                    </div>
                    {right ? <div className="flex w-full justify-start md:w-auto md:justify-end">{right}</div> : null}
                </div>
            </div>
        );
    }, [renderToolbarAction, toolbar, toolbarActions]);

    return (
        <section className={layoutClassName}>
            <AssistantToolbarContext.Provider value={toolbarValue}>
                <div className="pointer-events-none fixed top-4 right-4 z-30 flex items-center gap-3">
                    <ThemeToggle className="pointer-events-auto" storageKey="assistant-theme" />
                    <Link
                        to="/audit-logs"
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-xs font-semibold text-depth-primary shadow-depth-sm transition hover:-translate-y-0.5 hover:shadow-depth-md"
                    >
                        <img src={auditIcon} alt="Audit logs" className="h-5 w-5 nav-icon-filter" />
                    </Link>
                </div>

                <div className="flex w-full flex-row gap-8 font-depth justify-start ">
                    {/* Navbar Column - Kept as is */}
                    <div className="relative z-20 basis-64 flex-shrink-0 lg:sticky lg:top-10">
                        <AssisstantNav
                            asisten={asisten}
                            permission_name={permissionNames}
                            roleName={roleName}
                        />
                    </div>

                    {/* Main Content Area - UPDATED */}
                    <div className="h-[calc(100vh-80px)] flex-1 flex flex-col overflow-hidden ">
                        {toolbarHeader}
                        <div className="flex-1 overflow-y-auto">
                            {renderedChildren}
                        </div>
                    </div>
                </div>
            </AssistantToolbarContext.Provider>
            <Toaster position="top-right" reverseOrder={false} />
        </section>
    );
}
