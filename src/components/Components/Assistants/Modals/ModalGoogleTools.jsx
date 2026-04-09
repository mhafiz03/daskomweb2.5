import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ModalOverlay } from "@/Components/Common/ModalPortal";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";
import { useModulesQuery } from "@/hooks/useModulesQuery";
import { useSoalQuery } from "@/hooks/useSoalQuery";
import { useGoogleApis } from "@/hooks/useGoogleApis";
import { createGoogleFormFromSoal } from "@/lib/googleForms";

const TABS = [
    { id: "drive", label: "Google Drive" },
    { id: "forms", label: "Google Form" },
];

const KATEGORI_OPTIONS = [
    { value: "ta", label: "Tes Awal" },
    { value: "tk", label: "Tes Keterampilan" },
];

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

export default function ModalGoogleTools({ onClose }) {
    const [activeTab, setActiveTab] = useState("drive");
    const [driveStatus, setDriveStatus] = useState("idle");
    const [driveSelections, setDriveSelections] = useState([]);
    const [docPreviews, setDocPreviews] = useState({});
    const [isModalHidden, setIsModalHidden] = useState(false);

    const [formKategori, setFormKategori] = useState("ta");
    const [selectedModulId, setSelectedModulId] = useState("");
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formStatus, setFormStatus] = useState("idle");
    const [formResult, setFormResult] = useState(null);

    const modulesQuery = useModulesQuery();
    const moduleOptions = useMemo(() => {
        return (modulesQuery.data ?? [])
            .map((moduleItem) => {
                const value =
                    moduleItem?.idM ??
                    moduleItem?.id ??
                    moduleItem?.value ??
                    moduleItem?.uuid ??
                    moduleItem?.ID;
                if (value === undefined || value === null) {
                    return null;
                }

                return {
                    value: String(value),
                    label:
                        moduleItem?.judul ??
                        moduleItem?.title ??
                        moduleItem?.name ??
                        `Modul ${value}`,
                };
            })
            .filter(Boolean);
    }, [modulesQuery.data]);

    useEffect(() => {
        if (!selectedModulId && moduleOptions.length > 0) {
            setSelectedModulId(moduleOptions[0].value);
        }
    }, [moduleOptions, selectedModulId]);

    const soalQuery = useSoalQuery(formKategori, selectedModulId, {
        enabled: Boolean(formKategori && selectedModulId),
    });
    const soalItems = soalQuery.data ?? [];

    const googleApis = useGoogleApis();
    const hasCredentials = googleApis.hasCredentials;

    const credentialsWarning = !hasCredentials
        ? "Lengkapi VITE_GOOGLE_CLIENT_ID dan VITE_GOOGLE_API_KEY pada file .env untuk mengaktifkan integrasi Google."
        : null;

    const handleOpenDrivePicker = useCallback(async () => {
        if (!hasCredentials) {
            toast.error("Konfigurasi Google belum lengkap.");
            return;
        }

        try {
            setDriveStatus("opening");
            setIsModalHidden(true);
            await googleApis.ensureReady();
            const docs = await googleApis.openDrivePicker({
                allowMultiSelect: true,
            });
            setDriveSelections(Array.isArray(docs) ? docs : []);
            toast.success("Berhasil memilih file dari Google Drive.");
        } catch (error) {
            if (error?.message === "PICKER_CLOSED") {
                return;
            }
            toast.error(error?.message ?? "Gagal membuka Google Drive Picker.");
        } finally {
            setDriveStatus("idle");
            setIsModalHidden(false);
        }
    }, [googleApis, hasCredentials]);

    const loadDocPreview = useCallback(
        async (doc) => {
            const docId = doc?.id ?? doc?.resourceId;
            if (!docId) {
                return;
            }

            const mimeType = doc?.mimeType ?? doc?.type ?? "";

            if (mimeType !== GOOGLE_DOC_MIME) {
                setDocPreviews((prev) => ({
                    ...prev,
                    [docId]: {
                        status: "unsupported",
                        content: "",
                        error: "Preview tersedia hanya untuk Google Docs.",
                    },
                }));
                return;
            }

            setDocPreviews((prev) => ({
                ...prev,
                [docId]: { status: "loading", content: "", error: null },
            }));

            try {
                const token = await googleApis.getAccessToken();
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error("Gagal mengambil isi dokumen.");
                }

                const text = await response.text();

                setDocPreviews((prev) => ({
                    ...prev,
                    [docId]: { status: "success", content: text, error: null },
                }));
            } catch (error) {
                setDocPreviews((prev) => ({
                    ...prev,
                    [docId]: { status: "error", content: "", error: error?.message ?? "Gagal memuat dokumen." },
                }));
            }
        },
        [googleApis],
    );

    useEffect(() => {
        driveSelections.forEach((doc) => {
            const docId = doc?.id ?? doc?.resourceId;
            if (!docId) {
                return;
            }

            if (docPreviews[docId]) {
                return;
            }

            loadDocPreview(doc);
        });
    }, [driveSelections, docPreviews, loadDocPreview]);

    const handleRetryPreview = useCallback(
        (doc) => {
            loadDocPreview(doc);
        },
        [loadDocPreview],
    );

    const handleGenerateForm = useCallback(async () => {
        if (!formKategori || !selectedModulId) {
            toast.error("Pilih kategori soal dan modul terlebih dahulu.");
            return;
        }

        if (!hasCredentials) {
            toast.error("Konfigurasi Google belum lengkap.");
            return;
        }

        if (!soalItems.length) {
            toast.error("Tidak ada soal pada modul yang dipilih.");
            return;
        }

        try {
            setFormStatus("submitting");
            await googleApis.ensureReady();
            const token = await googleApis.getAccessToken();
            const result = await createGoogleFormFromSoal({
                token,
                soalItems,
                formTitle: formTitle || `Soal ${formKategori.toUpperCase()}`,
                description: formDescription,
                kategori: formKategori,
            });
            setFormResult(result);
            toast.success("Google Form berhasil dibuat.");
        } catch (error) {
            toast.error(error?.message ?? "Gagal membuat Google Form.");
        } finally {
            setFormStatus("idle");
        }
    }, [
        formDescription,
        formKategori,
        formTitle,
        googleApis,
        hasCredentials,
        selectedModulId,
        soalItems,
    ]);

    const renderDriveTab = () => (
        <div className="space-y-5 p-5">
            <button
                type="button"
                onClick={handleOpenDrivePicker}
                disabled={driveStatus === "opening" || !hasCredentials}
                className="inline-flex items-center justify-center rounded-depth-lg border border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] px-4 py-2 font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
                {driveStatus === "opening" ? "Membuka Google Drive..." : "Pilih File dari Google Drive"}
            </button>

            {credentialsWarning ? (
                <div className="rounded-depth-lg border border-yellow-500/60 bg-yellow-500/10 p-4 text-sm text-yellow-600">
                    {credentialsWarning}
                </div>
            ) : null}

            <div className="rounded-depth-lg border border-dashed border-depth/70 bg-depth-interactive/50 p-4 text-sm">
                <p className="font-semibold text-depth-primary">File Terpilih</p>
                {driveSelections.length === 0 ? (
                    <p className="mt-2 text-depth-secondary">
                        Belum ada file yang dipilih. Setelah picker ditutup, file akan muncul di sini.
                    </p>
                ) : (
                    <ul className="mt-3 divide-y divide-depth/40">
                        {driveSelections.map((doc) => (
                            <li key={doc.id ?? doc.resourceId} className="py-3">
                                <p className="font-medium text-depth-primary">
                                    {doc.name ?? doc.title ?? doc.id}
                                </p>
                                <p className="text-xs text-depth-secondary">
                                    {doc.mimeType ?? doc.type ?? "Tipe tidak diketahui"}
                                </p>
                                <a
                                    href={
                                        doc.url ??
                                        doc.alternateLink ??
                                        (doc.id ? `https://drive.google.com/open?id=${doc.id}` : "#")
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex text-xs font-semibold text-[var(--depth-color-primary)]"
                                >
                                    Buka di Google Drive →
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="rounded-depth-lg border border-depth bg-depth-card/60 p-4 text-sm">
                <p className="font-semibold text-depth-primary">Preview Dokumen</p>
                {driveSelections.length === 0 ? (
                    <p className="mt-2 text-depth-secondary">
                        Pilih file Google Docs untuk melihat isi teksnya.
                    </p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {driveSelections.map((doc) => {
                            const docId = doc?.id ?? doc?.resourceId;
                            const preview = docPreviews[docId];
                            return (
                                <li
                                    key={docId}
                                    className="rounded-depth-lg border border-depth bg-depth-surface/70 p-4 shadow-depth-sm"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-depth-primary">
                                                {doc?.name ?? doc?.title ?? docId}
                                            </p>
                                            <p className="text-xs text-depth-secondary">
                                                {doc?.mimeType ?? doc?.type ?? "Tipe tidak diketahui"}
                                            </p>
                                        </div>
                                        {preview?.status === "error" ? (
                                            <button
                                                type="button"
                                                className="text-xs font-semibold text-[var(--depth-color-primary)]"
                                                onClick={() => handleRetryPreview(doc)}
                                            >
                                                Coba ulang
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="mt-3 rounded-depth-md border border-dashed border-depth/60 bg-depth-interactive/60 p-3 text-sm text-depth-primary">
                                        {preview?.status === "loading" && (
                                            <p className="italic text-depth-secondary">
                                                Mengambil isi dokumen...
                                            </p>
                                        )}
                                        {preview?.status === "unsupported" && (
                                            <p className="text-depth-secondary">{preview.error}</p>
                                        )}
                                        {preview?.status === "error" && (
                                            <p className="text-red-500">{preview.error}</p>
                                        )}
                                        {preview?.status === "success" && (
                                            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed">
                                                {preview.content}
                                            </pre>
                                        )}
                                        {!preview && (
                                            <p className="italic text-depth-secondary">
                                                Preview sedang disiapkan...
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );

    const renderFormsTab = () => (
        <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                        Kategori Soal
                    </label>
                    <select
                        value={formKategori}
                        onChange={(event) => setFormKategori(event.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    >
                        {KATEGORI_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                        Modul
                    </label>
                    <select
                        value={selectedModulId}
                        onChange={(event) => setSelectedModulId(event.target.value)}
                        className="w-full rounded-depth-md border border-depth bg-depth-interactive px-3 py-2 text-depth-primary shadow-depth-inset focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                    >
                        {moduleOptions.length === 0 ? (
                            <option value="">Tidak ada modul</option>
                        ) : (
                            moduleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-depth-secondary">
                    Judul Form
                </label>
                <input
                    type="text"
                    value={formTitle}
                    onChange={(event) => setFormTitle(event.target.value)}
                    placeholder={`Form Soal ${formKategori.toUpperCase()}`}
                    className="w-full rounded-depth-md border border-depth bg-depth-card px-3 py-2 text-depth-primary shadow-depth-sm focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
                />
            </div>
            <div className="rounded-depth-lg border border-depth bg-depth-interactive/60 p-4 text-sm">
                <p className="font-semibold text-depth-primary">Ringkasan Soal</p>
                <div className="mt-2 grid gap-3 md:grid-cols-3">
                    <div>
                        <p className="text-xs text-depth-secondary">Jumlah Soal</p>
                        <p className="text-lg font-semibold text-depth-primary">
                            {soalQuery.isFetching ? "Memuat..." : soalItems.length}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-depth-secondary">Status Data</p>
                        <p className="text-sm font-semibold text-depth-primary">
                            {soalQuery.isFetching ? "Mengambil soal..." : "Siap digunakan"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-depth-secondary">Integrasi</p>
                        <p className="text-sm font-semibold text-depth-primary">
                            {googleApis.status === "ready"
                                ? "Google API siap"
                                : credentialsWarning ?? "Memuat Google API..."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <button
                    type="button"
                    onClick={handleGenerateForm}
                    disabled={
                        formStatus === "submitting" ||
                        !hasCredentials ||
                        soalItems.length === 0 ||
                        !selectedModulId
                    }
                    className="inline-flex items-center justify-center rounded-depth-lg border border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] px-4 py-2 font-semibold text-white shadow-depth-md transition hover:-translate-y-0.5 hover:shadow-depth-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {formStatus === "submitting" ? "Mengirim ke Google..." : "Buat Google Form"}
                </button>
            </div>

            {formResult ? (
                <div className="rounded-depth-lg border border-green-500/60 bg-green-500/10 p-4 text-sm text-green-700">
                    <p className="font-semibold">Google Form berhasil dibuat.</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <a
                            href={formResult.editUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex font-semibold text-green-700 underline"
                        >
                            Buka editor Google Form
                        </a>
                        <a
                            href={formResult.responderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex font-semibold text-green-700 underline"
                        >
                            Buka tautan responden
                        </a>
                    </div>
                </div>
            ) : null}
        </div>
    );

    if (isModalHidden) {
        return null;
    }

    return (
        <ModalOverlay
            onClose={onClose}
            className="depth-modal-overlay z-50 flex items-start justify-center px-4 py-10"
        >
            <div className="w-full max-w-5xl rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-lg max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-depth-primary">Integrasi Google</h2>
                    </div>
                    <ModalCloseButton onClick={onClose} />
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-depth-full border px-4 py-2 text-sm font-semibold transition ${
                                activeTab === tab.id
                                    ? "border-[var(--depth-color-primary)] bg-[var(--depth-color-primary)] text-white shadow-depth-md"
                                    : "border-depth bg-depth-interactive text-depth-primary shadow-depth-sm hover:-translate-y-0.5 hover:shadow-depth-md"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "drive" ? renderDriveTab() : renderFormsTab()}
            </div>
        </ModalOverlay>
    );
}
