import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/auth/asisten";

export const index = createIndexDescriptor("/api/roles");

export const store = makeRoute("post", "/api/roles");

export const update = makeRoute("patch", (asistenId) => `${BASE_PATH}/${ensureId(asistenId, "asisten id")}/role`);
