import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/nilai";

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("put", (nilaiId) => `${BASE_PATH}/${ensureId(nilaiId, "nilai id")}`);
