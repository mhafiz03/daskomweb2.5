import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const GAPI_SRC = "https://apis.google.com/js/api.js";
const DEFAULT_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/forms.body",
];

const scriptPromises = new Map();
let pickerLoaderPromise = null;

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

function loadScript(src) {
    if (!isBrowser) {
        return Promise.reject(new Error("Google API tidak tersedia di lingkungan saat ini."));
    }

    if (scriptPromises.has(src)) {
        return scriptPromises.get(src);
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && (existing.getAttribute("data-loaded") === "true" || existing.readyState === "complete")) {
        return Promise.resolve();
    }

    const promise = new Promise((resolve, reject) => {
        const script = existing ?? document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;

        const cleanup = () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
        };

        function handleLoad() {
            script.setAttribute("data-loaded", "true");
            cleanup();
            resolve();
        }

        function handleError() {
            cleanup();
            reject(new Error(`Gagal memuat skrip ${src}`));
        }

        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });

        if (!existing) {
            document.head.appendChild(script);
        }
    });

    scriptPromises.set(src, promise);
    return promise;
}

function loadPickerModule() {
    if (!isBrowser || !window.gapi) {
        return Promise.reject(new Error("Google API belum tersedia."));
    }

    if (pickerLoaderPromise) {
        return pickerLoaderPromise;
    }

    pickerLoaderPromise = new Promise((resolve, reject) => {
        window.gapi.load("client:picker", {
            callback: resolve,
            onerror: () => reject(new Error("Gagal memuat modul Google Picker.")),
            timeout: 15000,
            ontimeout: () => reject(new Error("Waktu tunggu memuat Google Picker habis.")),
        });
    });

    return pickerLoaderPromise;
}

export function useGoogleApis({
    clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
    apiKey = import.meta.env.VITE_GOOGLE_API_KEY ?? "",
    scopes = DEFAULT_SCOPES,
} = {}) {
    const [status, setStatus] = useState(() => (isBrowser ? "idle" : "unavailable"));
    const [error, setError] = useState(null);
    const tokenClientRef = useRef(null);
    const accessTokenRef = useRef(null);
    const mountedRef = useRef(true);

    const hasCredentials = Boolean(clientId && apiKey);

    useEffect(() => () => {
        mountedRef.current = false;
    }, []);

    const safeSetState = useCallback((updater) => {
        if (mountedRef.current) {
            updater();
        }
    }, []);

    const loadApis = useCallback(async () => {
        if (!isBrowser) {
            throw new Error("Google API tidak tersedia di lingkungan ini.");
        }

        if (!hasCredentials) {
            throw new Error("VITE_GOOGLE_CLIENT_ID dan VITE_GOOGLE_API_KEY belum dikonfigurasi.");
        }

        if (status === "ready" && window.google?.picker) {
            return true;
        }

        safeSetState(() => {
            setStatus("loading");
            setError(null);
        });

        try {
            await Promise.all([loadScript(GSI_SRC), loadScript(GAPI_SRC)]);
            if (!window.gapi) {
                throw new Error("Objek gapi tidak ditemukan setelah skrip dimuat.");
            }
            await loadPickerModule();
            safeSetState(() => {
                setStatus("ready");
                setError(null);
            });
            return true;
        } catch (err) {
            safeSetState(() => {
                setStatus("error");
                setError(err);
            });
            throw err;
        }
    }, [hasCredentials, safeSetState, status]);

    const ensureReady = useCallback(async () => {
        if (status === "ready" && window.google?.picker) {
            return true;
        }
        return loadApis();
    }, [loadApis, status]);

    const requestAccessToken = useCallback(
        ({ prompt = "" } = {}) =>
            new Promise((resolve, reject) => {
                if (!isBrowser || !window.google?.accounts?.oauth2) {
                    reject(new Error("Google Identity Services belum tersedia."));
                    return;
                }

                if (!hasCredentials) {
                    reject(new Error("Konfigurasi Google API belum lengkap."));
                    return;
                }

                const tokenClient =
                    tokenClientRef.current ??
                    window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: scopes.join(" "),
                        callback: () => {},
                    });

                tokenClientRef.current = tokenClient;
                tokenClient.callback = (response) => {
                    if (response.error) {
                        reject(new Error(response.error_description ?? "Gagal mendapatkan akses token Google."));
                        return;
                    }

                    accessTokenRef.current = response.access_token;
                    resolve(response.access_token);
                };

                tokenClient.requestAccessToken({ prompt });
            }),
        [clientId, hasCredentials, scopes],
    );

    const getAccessToken = useCallback(async ({ forcePrompt = false } = {}) => {
        await ensureReady();
        if (!forcePrompt && accessTokenRef.current) {
            return accessTokenRef.current;
        }
        return requestAccessToken({ prompt: forcePrompt ? "consent" : "" });
    }, [ensureReady, requestAccessToken]);

    const resetAccessToken = useCallback(() => {
        accessTokenRef.current = null;
    }, []);

    const openDrivePicker = useCallback(async ({ allowMultiSelect = true, includeFolders = false } = {}) => {
        await ensureReady();
        const token = await getAccessToken();

        if (!window.google?.picker) {
            throw new Error("Google Picker belum siap.");
        }

        return new Promise((resolve, reject) => {
            const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                .setIncludeFolders(includeFolders)
                .setSelectFolderEnabled(includeFolders)
                .setMode(window.google.picker.DocsViewMode.LIST);

            const builder = new window.google.picker.PickerBuilder()
                .setOAuthToken(token)
                .setDeveloperKey(apiKey)
                .setOrigin(window.location.origin)
                .setSize(1050, 650)
                .setTitle("Pilih file dari Google Drive")
                .addView(docsView)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        resolve(data.docs ?? []);
                        return;
                    }

                    if (data.action === window.google.picker.Action.CANCEL) {
                        reject(new Error("PICKER_CLOSED"));
                    }
                });

            if (allowMultiSelect) {
                builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
            }

            const picker = builder.build();
            picker.setVisible(true);
        });
    }, [apiKey, ensureReady, getAccessToken]);

    return useMemo(() => ({
        status,
        error,
        hasCredentials,
        ensureReady,
        getAccessToken,
        requestAccessToken,
        resetAccessToken,
        openDrivePicker,
    }), [ensureReady, error, getAccessToken, hasCredentials, openDrivePicker, requestAccessToken, resetAccessToken, status]);
}
