import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/nilai";

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (nilaiId) => `${BASE_PATH}/${ensureId(nilaiId, "nilai id")}`);
