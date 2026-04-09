import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const MANAGE_PRAKTIKAN_QUERY_KEY = "manage-praktikan";

const fetchManagePraktikan = async (params = {}) => {
    const {
        page = 1,
        perPage = 10,
        search = "",
        kelasId = null,
        dk = null,
    } = params;

    const query = {
        page,
        per_page: perPage,
    };

    if (search && search.trim() !== "") {
        query.search = search.trim();
    }

    if (kelasId) {
        query.kelas_id = kelasId;
    }

    if (dk) {
        query.dk = dk;
    }

    const { data } = await api.get("/api/praktikans", { params: query });
    const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    return {
        items,
        meta: data?.meta ?? null,
        links: data?.links ?? null,
        success: data?.success ?? true,
        filters: data?.filters ?? {},
    };
};

export const useManagePraktikanQuery = (params = {}, options = {}) =>
    useQuery({
        queryKey: [MANAGE_PRAKTIKAN_QUERY_KEY, params],
        queryFn: ({ queryKey }) => fetchManagePraktikan(queryKey[1] ?? {}),
        keepPreviousData: true,
        ...options,
    });
