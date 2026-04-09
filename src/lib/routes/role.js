import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/roles";

export const index = createIndexDescriptor(BASE_PATH);

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("put", (roleId) => `${BASE_PATH}/${ensureId(roleId, "role id")}`);
