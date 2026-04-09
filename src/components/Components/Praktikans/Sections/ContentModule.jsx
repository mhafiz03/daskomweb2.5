import { Suspense, lazy, useEffect, useMemo, useState } from "react";

const ModuleAccordionItem = lazy(() => import("./ModuleAccordionItem"));

export default function ContentModule({ modules = [], emptyMessage = "Belum ada modul yang tersedia." }) {
    const [openIndex, setOpenIndex] = useState(null);

    const normalizedModules = useMemo(() => (Array.isArray(modules) ? modules : []), [modules]);

    useEffect(() => {
        if (openIndex === null) {
            return;
        }

        if (openIndex < 0 || openIndex >= normalizedModules.length) {
            setOpenIndex(null);
        }
    }, [normalizedModules, openIndex]);

    const handleToggle = (index) => {
        setOpenIndex((previous) => (previous === index ? null : index));
    };

    if (normalizedModules.length === 0) {
        return (
            <div className="px-6 py-10 text-center text-depth-secondary">
                {emptyMessage}
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="px-6 py-10 text-center text-depth-secondary">Memuat modul...</div>}>
            <ul className="divide-y divide-[color:var(--depth-border)]">
                {normalizedModules.map((module, index) => (
                    <ModuleAccordionItem
                        key={`praktikan-module-${module.idM ?? module.id ?? index}`}
                        module={module}
                        index={index}
                        isOpen={openIndex === index}
                        onToggle={handleToggle}
                    />
                ))}
            </ul>
        </Suspense>
    );
}
