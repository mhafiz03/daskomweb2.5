import { makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/asisten";

export const update = makeRoute("put", BASE_PATH);

export const updatePp = makeRoute("post", "/api-v1/profilePic");

export const destroyPp = makeRoute("delete", "/api-v1/profilePic");

export const updatePassword = makeRoute("patch", `${BASE_PATH}/password`);

export const destroy = makeRoute("post", `${BASE_PATH}/delete`);
