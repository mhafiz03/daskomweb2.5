import { makeRoute } from "./utils.js";

const BASE_PATH = "/api/asistens";

export const update = makeRoute("patch", (asistenId) => `${BASE_PATH}/${asistenId}`);

export const updatePp = makeRoute("post", "/api/asistens/foto");

export const destroyPp = makeRoute("delete", "/api/asistens/foto");

export const updatePassword = makeRoute("post", "/api/auth/change-password");

export const destroy = makeRoute("post", `${BASE_PATH}/delete`);
