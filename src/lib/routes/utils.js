const appendQueryParams = (url, query = undefined) => {
    if (!query || typeof query !== "object") {
        return url;
    }

    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (item !== undefined && item !== null) {
                    searchParams.append(key, String(item));
                }
            });
            return;
        }

        searchParams.append(key, String(value));
    });

    const queryString = searchParams.toString();
    if (!queryString) {
        return url;
    }

    return `${url}?${queryString}`;
};

const ensureId = (value, label = "identifier") => {
    if (value === undefined || value === null || value === "") {
        throw new Error(`A valid ${label} is required`);
    }

    return encodeURIComponent(String(value));
};

const createIndexDescriptor = (baseUrl) => ({
    method: "get",
    url: ({ query } = {}) => appendQueryParams(baseUrl, query),
});

const makeRoute = (method, builder) => {
    if (typeof builder === "function") {
        return (...args) => ({
            method,
            url: builder(...args),
        });
    }

    return () => ({
        method,
        url: builder,
    });
};

export { appendQueryParams, ensureId, createIndexDescriptor, makeRoute };
