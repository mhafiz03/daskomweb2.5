import { ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/soal/tk";

export const store = makeRoute("post", BASE_PATH);

export const update = makeRoute("patch", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);

export const destroy = makeRoute("delete", (soalId) => `${BASE_PATH}/${ensureId(soalId, "soal id")}`);

export const analysis = makeRoute(
	"get",
	(modulId) => `${BASE_PATH}/analysis/${ensureId(modulId, "modul id")}`,
);
