import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/jadwal";

export const store = makeRoute("post", BASE_PATH);

export const destroy = makeRoute("delete", (jadwalId) => `${BASE_PATH}/${ensureId(jadwalId, "jadwal id")}`);
