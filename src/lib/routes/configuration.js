import { createIndexDescriptor, makeRoute } from "./utils.js";

const BASE_PATH = "/api/config";

export const index = createIndexDescriptor(BASE_PATH);

export const update = makeRoute("put", BASE_PATH);
