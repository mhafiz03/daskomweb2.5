import { createIndexDescriptor, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/tugas-pendahuluan";

export const index = createIndexDescriptor(BASE_PATH);

export const update = makeRoute("put", BASE_PATH);
