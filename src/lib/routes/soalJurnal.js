import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/soal/jurnal";

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);

export const destroy = makeRoute("delete", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);
