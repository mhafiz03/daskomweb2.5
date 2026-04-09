import { api } from "./api";

const normalizeRoute = (route) => {
    if (!route) {
        throw new Error("Route descriptor is required");
    }

    if (typeof route === "string") {
        return { url: route, method: "get" };
    }

    if (typeof route === "object" && route.url) {
        const method = route.method ?? route.methods?.[0] ?? "get";
        if (typeof route.url === "function") {
            return { url: route.url(), method: method.toLowerCase() };
        }

        return { url: route.url, method: method.toLowerCase() };
    }

    throw new Error("Unsupported route descriptor provided to HTTP helper");
};

const resolveRequestConfig = (normalized, payload, config = {}) => {
    const requestConfig = {
        url: normalized.url,
        method: normalized.method,
        ...config,
    };

    if (typeof payload !== "undefined") {
        requestConfig.data = payload;
    }

    return requestConfig;
};

export const send = (route, payload, config = {}) => {
    const normalized = normalizeRoute(route);
    const requestConfig = resolveRequestConfig(normalized, payload, config);

    return api.request(requestConfig);
};

export const submit = (route, options = {}) => {
    const {
        data,
        method,
        forceFormData = false,
        headers,
        onSuccess,
        onError,
        onFinish,
        ...rest
    } = options;
    const normalized = normalizeRoute(route);
    const requestConfig = {
        url: normalized.url,
        method: (method ?? normalized.method).toLowerCase(),
        headers: {
            ...(headers ?? {}),
        },
        ...rest,
    };

    if (typeof data !== "undefined") {
        if (forceFormData && !(data instanceof FormData)) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((item) => formData.append(`${key}[]`, item));
                    return;
                }

                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });
            requestConfig.data = formData;
            delete requestConfig.headers["Content-Type"];
        } else {
            requestConfig.data = data;
        }
    }

    return api
        .request(requestConfig)
        .then((response) => {
            if (typeof onSuccess === "function") {
                onSuccess(response);
            }
            return response;
        })
        .catch((error) => {
            if (typeof onError === "function") {
                onError(error?.response?.data ?? error);
            }
            throw error;
        })
        .finally(() => {
            if (typeof onFinish === "function") {
                onFinish();
            }
        });
};

export const resolveUrl = (route) => normalizeRoute(route).url;

export const resolveMethod = (route) => normalizeRoute(route).method;
