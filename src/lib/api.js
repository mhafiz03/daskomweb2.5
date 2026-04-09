import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const authToken = Cookies.get("auth");
        const csrfToken = Cookies.get("XSRF-TOKEN");

        if (csrfToken) {
            config.headers["X-XSRF-TOKEN"] = csrfToken;
        }

        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: false, // Public endpoints typically don't need credentials
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export { api, publicApi };
