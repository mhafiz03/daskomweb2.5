const GOOGLE_FORMS_BASE_URL = "https://forms.googleapis.com/v1/forms";

function sanitizeDisplayedText(text) {
    if (!text) {
        return "";
    }

    return String(text)
        .replace(/\r?\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function normalizeOptionText(option, fallbackIndex) {
    if (!option) {
        return `Pilihan ${fallbackIndex + 1}`;
    }

    const text =
        option.text ??
        option.option_text ??
        option.label ??
        option.value ??
        option.nama ??
        option.name ??
        "";

    const normalized = sanitizeDisplayedText(text);
    return normalized || `Pilihan ${fallbackIndex + 1}`;
}

function normalizePertanyaan(item, index) {
    const pertanyaan =
        item?.pertanyaan ??
        item?.soal ??
        item?.question ??
        item?.title ??
        item?.text ??
        "";

    const normalized = sanitizeDisplayedText(pertanyaan);
    return normalized || `Soal ${index + 1}`;
}

function resolveCorrectOptionIndexes(options, soalItem) {
    const indices = [];
    const opsiBenarId =
        soalItem?.opsi_benar_id ??
        soalItem?.correct_option_id ??
        soalItem?.correct_option_uuid ??
        null;
    const opsiBenar = soalItem?.opsi_benar;
    const correctIndexField =
        typeof soalItem?.correct_option === "number" ? soalItem.correct_option : null;

    options.forEach((option, index) => {
        if (option?.is_correct === true) {
            indices.push(index);
            return;
        }

        if (option?.isCorrect === true) {
            indices.push(index);
            return;
        }

        if (option?.id && opsiBenarId && String(option.id) === String(opsiBenarId)) {
            indices.push(index);
            return;
        }

        if (Number.isInteger(opsiBenar) && opsiBenar === index) {
            indices.push(index);
        }
    });

    if (Number.isInteger(correctIndexField) && correctIndexField >= 0 && correctIndexField < options.length) {
        if (!indices.includes(correctIndexField)) {
            indices.push(correctIndexField);
        }
    }

    return indices;
}

function resolvePointValue(soalItem) {
    const point =
        soalItem?.pointValue ??
        soalItem?.point_value ??
        soalItem?.poin ??
        soalItem?.poin_skor ??
        soalItem?.skor;

    const parsed = Number(point);

    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }

    return 1;
}

export function buildGoogleFormRequests(soalItems = [], { kategori } = {}) {
    if (!Array.isArray(soalItems) || soalItems.length === 0) {
        return [];
    }

    const requests = [];

    soalItems.forEach((item, index) => {
        const optionsRaw = Array.isArray(item?.options) ? item.options : [];
        const normalizedOptions = optionsRaw.length
            ? optionsRaw.map((option, optionIndex) => ({
                  value: normalizeOptionText(option, optionIndex),
              }))
            : [
                  { value: "Pilihan 1" },
                  { value: "Pilihan 2" },
              ];

        const questionTitle = normalizePertanyaan(item, index);
        const correctIndexes = resolveCorrectOptionIndexes(optionsRaw, item);
        const correctAnswers = correctIndexes
            .map((optionIndex) => normalizedOptions[optionIndex])
            .filter(Boolean)
            .map((option) => ({
                value: option.value,
            }));

        const pointValue = resolvePointValue(item);

        requests.push({
            createItem: {
                item: {
                    title: questionTitle,
                    questionItem: {
                        question: {
                            required: true,
                            choiceQuestion: {
                                type: "RADIO",
                                options: normalizedOptions,
                            },
                            grading:
                                correctAnswers.length > 0
                                    ? {
                                          pointValue,
                                          correctAnswers: {
                                              answers: correctAnswers,
                                          },
                                      }
                                    : undefined,
                        },
                    },
                    description: undefined,
                },
                location: {
                    index,
                },
            },
        });
    });

    return requests;
}

async function parseResponse(response) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("json")) {
        const payload = await response.json();
        const message =
            payload?.error?.message ??
            payload?.message ??
            response.statusText ??
            "Permintaan ke Google Forms API gagal.";
        const error = new Error(message);
        error.payload = payload;
        error.status = response.status;
        throw error;
    }

    const fallbackError = new Error(response.statusText || "Permintaan ke Google Forms API gagal.");
    fallbackError.status = response.status;
    throw fallbackError;
}

export async function createGoogleFormFromSoal({
    token,
    soalItems = [],
    formTitle,
    description,
    kategori,
}) {
    if (!token) {
        throw new Error("Access token Google tidak tersedia.");
    }

    if (!Array.isArray(soalItems) || soalItems.length === 0) {
        throw new Error("Tidak ada soal yang dapat dikirim ke Google Forms.");
    }

    const normalizedTitle = sanitizeDisplayedText(
        formTitle?.trim() || `Soal ${kategori ? kategori.toUpperCase() : "Praktikum"}`,
    );

    const infoPayload = {
        info: {
            title: normalizedTitle,
        },
    };

    const createResponse = await fetch(GOOGLE_FORMS_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(infoPayload),
    });

    if (!createResponse.ok) {
        await parseResponse(createResponse);
    }

    const formInfo = await createResponse.json();
    const requests = [
        {
            updateSettings: {
                settings: {
                    quizSettings: {
                        isQuiz: true,
                    },
                },
                updateMask: "quizSettings.isQuiz",
            },
        },
    ];

    const normalizedDescription = sanitizeDisplayedText(description);
    if (normalizedDescription) {
        requests.push({
            updateFormInfo: {
                info: {
                    description: normalizedDescription,
                },
                updateMask: "description",
            },
        });
    }

    requests.push(...buildGoogleFormRequests(soalItems, { kategori }));

    if (requests.length > 0) {
        const batchResponse = await fetch(`${GOOGLE_FORMS_BASE_URL}/${formInfo.formId}:batchUpdate`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ requests }),
        });

        if (!batchResponse.ok) {
            await parseResponse(batchResponse);
        }
    }

    return {
        formId: formInfo.formId,
        editUrl: `https://docs.google.com/forms/d/${formInfo.formId}/edit`,
        responderUrl: formInfo.responderUri ?? `https://docs.google.com/forms/d/${formInfo.formId}/viewform`,
        info: formInfo.info ?? null,
    };
}
