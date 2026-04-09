import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/soal-tp";

export const store = makeRoute("post", (modulId) => `${BASE_PATH}/${ensureId(modulId, "modul id")}`);

export const update = makeRoute("put", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);

export const destroy = makeRoute("delete", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);
