import { useQuery } from "@tanstack/react-query";

export const ROLES_QUERY_KEY = ["roles"];

const ROLES = [
    { id: 1, name: "KORDAS" },
    { id: 2, name: "WAKORDAS" },
    { id: 3, name: "SOFTWARE" },
    { id: 4, name: "HARDWARE" },
    { id: 5, name: "ASLAB" },
];

export const useRolesQuery = (options = {}) =>
    useQuery({
        queryKey: ROLES_QUERY_KEY,
        queryFn: async () => ROLES,
        staleTime: Infinity,
        ...options,
    });
