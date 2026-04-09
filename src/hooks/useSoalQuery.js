import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const soalQueryKey = (kategori, modul) => ["soal", kategori, modul];

const fetchSoal = async (kategori, modul) => {
    if (!kategori || !modul) {
        return [];
    }

    const basePath = `/api/soal/${kategori}`;
    const { data: soalRows } = await api.get(basePath, { params: { modulId: modul } });
    const questions = Array.isArray(soalRows?.data) ? soalRows.data : Array.isArray(soalRows) ? soalRows : [];

    if (kategori !== "ta" && kategori !== "tk") {
        return questions.map((item) => ({
            ...item,
            modul_id: item?.modul_id ?? item?.modulId ?? null,
            enable_file_upload: item?.enable_file_upload ?? item?.enableFileUpload ?? false,
        }));
    }

    const soalType = kategori;
    const { data: opsiRows } = await api.get("/api/soal/opsis", { params: { soalType } });
    const options = Array.isArray(opsiRows?.data) ? opsiRows.data : Array.isArray(opsiRows) ? opsiRows : [];
    const opsiMap = new Map(options.map((item) => [String(item?.id), item]));

    return questions.map((item) => {
        const optionIds = kategori === "ta"
            ? [item?.opsi1Id, item?.opsi2Id, item?.opsi3Id, item?.opsiBenarId]
            : [item?.opsiId];

        const uniqueOptionIds = Array.from(new Set(optionIds.filter(Boolean).map(String)));
        const normalizedOptions = uniqueOptionIds.map((id) => ({
            id,
            text: opsiMap.get(id)?.text ?? "",
            is_correct: id === String(item?.opsiBenarId ?? item?.opsiId ?? ""),
        }));

        return {
            ...item,
            pertanyaan: item?.pertanyaan ?? item?.soal ?? "",
            modul_id: item?.modul_id ?? item?.modulId ?? null,
            opsi_benar_id: item?.opsi_benar_id ?? item?.opsiBenarId ?? item?.opsiId ?? null,
            options: normalizedOptions,
        };
    });
};

export const useSoalQuery = (kategori, modul, options = {}) =>
    useQuery({
        queryKey: soalQueryKey(kategori, modul),
        queryFn: async () => fetchSoal(kategori, modul),
        enabled: Boolean(kategori && modul),
        ...options,
    });
