import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/kelas";

const GUESS_PATH = "/api-v1/get-kelas";

export const index = createIndexDescriptor(BASE_PATH);

export const guess_index = createIndexDescriptor(GUESS_PATH);


export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("put", (kelasId) => `${BASE_PATH}/${ensureId(kelasId, "kelas id")}`);

export const destroy = makeRoute("delete", (kelasId) => `${BASE_PATH}/${ensureId(kelasId, "kelas id")}`);
