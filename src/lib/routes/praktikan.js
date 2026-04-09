import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/praktikan";

export const index = createIndexDescriptor(BASE_PATH);

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (praktikanId) => `${BASE_PATH}/${ensureId(praktikanId, "praktikan id")}`);

export const destroy = makeRoute("delete", (praktikanId) => `${BASE_PATH}/${ensureId(praktikanId, "praktikan id")}`);

export const setPraktikan = makeRoute("post", "/api-v1/tarik-praktikan");

export const setPassword = makeRoute("patch", "/api-v1/set-password");

export const updatePassword = makeRoute("patch", `${BASE_PATH}/password`);
