import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/modul";

export const index = createIndexDescriptor(BASE_PATH);

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (modulId) => `${BASE_PATH}/${ensureId(modulId, "modul id")}`);

export const destroy = makeRoute("delete", (modulId) => `${BASE_PATH}/${ensureId(modulId, "modul id")}`);

export const bulkUpdate = makeRoute("patch", `${BASE_PATH}/bulk-update`);
