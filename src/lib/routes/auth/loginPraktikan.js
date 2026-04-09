import { makeRoute } from "../utils.js";

export const store = makeRoute("post", "/login/praktikan");

export const destroy = makeRoute("post", "/praktikan/logout");
