import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api-v1/leaderboard";

export const leaderboardIndex = createIndexDescriptor(BASE_PATH);

export const leaderboardByClass = makeRoute("get", (kelasId) => `${BASE_PATH}/${ensureId(kelasId, "kelas id")}`);

export const leaderboardDetail = makeRoute(
	"get",
	(praktikanId) => `${BASE_PATH}/praktikan/${ensureId(praktikanId, "praktikan id")}`,
);
