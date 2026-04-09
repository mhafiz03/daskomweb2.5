import { createIndexDescriptor, ensureId, makeRoute } from "./utils.js";

const BASE_PATH = "/api/nilai/leaderboard";

export const leaderboardIndex = createIndexDescriptor(BASE_PATH);

export const leaderboardByClass = makeRoute("get", (kelasId) => `${BASE_PATH}?kelasId=${ensureId(kelasId, "kelas id")}`);

export const leaderboardDetail = makeRoute(
	"get",
	(praktikanId) => `${BASE_PATH}?praktikanId=${ensureId(praktikanId, "praktikan id")}`,
);
