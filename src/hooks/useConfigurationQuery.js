import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const CONFIG_QUERY_KEY = ["configuration"];

const coerceValue = (item) => {
    if (!item) {
        return null;
    }

    if (item.type === "boolean") {
        return Boolean(Number(item.value));
    }

    if (item.type === "number") {
        const numeric = Number(item.value);
        return Number.isNaN(numeric) ? null : numeric;
    }

    if (item.type === "json") {
        try {
            return JSON.parse(item.value ?? "null");
        } catch {
            return null;
        }
    }

    return item.value;
};

const fetchConfiguration = async () => {
    const { data } = await api.get("/api/config");
    const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

    return items.reduce((acc, item) => {
        const key = item?.configKey ?? item?.key;
        if (!key) {
            return acc;
        }

        acc[key] = coerceValue(item);
        if (item?.tpScheduleEnabled !== undefined) {
            acc.tp_schedule_enabled = Boolean(item.tpScheduleEnabled);
        }
        if (item?.tpScheduleStartAt) {
            acc.tp_schedule_start_at = item.tpScheduleStartAt;
        }
        if (item?.tpScheduleEndAt) {
            acc.tp_schedule_end_at = item.tpScheduleEndAt;
        }
        return acc;
    }, {});
};

export const useConfigurationQuery = (options = {}) =>
    useQuery({
        queryKey: CONFIG_QUERY_KEY,
        queryFn: fetchConfiguration,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
