import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

export function useImageKitUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const uploadRef = useRef(null);

    const reset = useCallback(() => {
        setIsUploading(false);
        setProgress(0);
        setError(null);
    }, []);

    const abort = useCallback(() => {
        uploadRef.current?.abort?.();
        setIsUploading(false);
        setProgress(0);
        setError("Upload cancelled");
    }, []);

    const getAuthParams = useCallback(async () => {
        const { data } = await api.get("/api/imagekit/auth");
        if (!data?.token || !data?.signature || !data?.expire) {
            throw new Error("Gagal mendapatkan kredensial ImageKit.");
        }

        return data;
    }, []);

    const upload = useCallback(async (file, folder = "/", fileName = null, useUniqueFileName = true) => {
        if (!file) {
            throw new Error("File upload tidak ditemukan.");
        }

        const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
        if (!publicKey) {
            throw new Error("VITE_IMAGEKIT_PUBLIC_KEY belum dikonfigurasi.");
        }

        const auth = await getAuthParams();
        const controller = new AbortController();
        uploadRef.current = controller;
        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("fileName", fileName || file.name);
            formData.append("folder", folder);
            formData.append("useUniqueFileName", useUniqueFileName ? "true" : "false");
            formData.append("publicKey", publicKey);
            formData.append("token", auth.token);
            formData.append("signature", auth.signature);
            formData.append("expire", String(auth.expire));

            const response = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
                signal: controller.signal,
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (event) => {
                    if (!event.total) {
                        return;
                    }
                    setProgress(Math.round((event.loaded * 100) / event.total));
                },
            });

            setIsUploading(false);
            setProgress(100);
            return response.data;
        } catch (uploadError) {
            const message =
                uploadError?.response?.data?.message ??
                uploadError?.message ??
                "Upload file gagal.";
            setIsUploading(false);
            setProgress(0);
            setError(message);
            throw new Error(message);
        }
    }, [getAuthParams]);

    const onError = useCallback((err) => {
        setError(err?.message ?? "Upload failed");
        setIsUploading(false);
        setProgress(0);
    }, []);

    const onSuccess = useCallback((response) => {
        setError(null);
        setIsUploading(false);
        setProgress(100);
        return response;
    }, []);

    const onUploadProgress = useCallback((event) => {
        if (!event?.total) {
            return;
        }
        setProgress(Math.round((event.loaded * 100) / event.total));
    }, []);

    const onUploadStart = useCallback(() => {
        setIsUploading(true);
        setProgress(0);
        setError(null);
    }, []);

    return {
        upload,
        abort,
        reset,
        isUploading,
        progress,
        error,
        uploadRef,
        getAuthParams,
        onError,
        onSuccess,
        onUploadProgress,
        onUploadStart,
    };
}
