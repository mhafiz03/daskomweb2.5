import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/praktikans";

export const index = createIndexDescriptor(BASE_PATH);

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (praktikanId) => `${BASE_PATH}/${ensureId(praktikanId, "praktikan id")}`);

export const destroy = makeRoute("delete", (praktikanId) => `${BASE_PATH}/${ensureId(praktikanId, "praktikan id")}`);

export const setPraktikan = makeRoute("post", "/api/praktikans/assign-module");

export const setPassword = makeRoute("patch", "/api/praktikans/password");

export const updatePassword = makeRoute("post", "/api/auth/change-password");
