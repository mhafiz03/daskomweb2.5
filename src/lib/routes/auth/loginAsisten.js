import { makeRoute } from "../utils.js";

export const store = makeRoute("post", "/login/asisten");

export const destroy = makeRoute("post", "/asisten/logout");
