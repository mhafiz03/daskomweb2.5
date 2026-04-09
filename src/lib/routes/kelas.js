import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/kelas";

const GUESS_PATH = "/api/kelas/public";

export const index = createIndexDescriptor(BASE_PATH);

export const guess_index = createIndexDescriptor(GUESS_PATH);


export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (kelasId) => `${BASE_PATH}/${ensureId(kelasId, "kelas id")}`);

export const destroy = makeRoute("delete", (kelasId) => `${BASE_PATH}/${ensureId(kelasId, "kelas id")}`);
