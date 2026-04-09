import { Hono } from "hono";
import { sessionMiddleware } from "./middleware/session";
import { registerAuthRoutes } from "./routes/auth";
import { registerKelasRoutes } from "./routes/kelas";
import { registerModulRoutes } from "./routes/modul";
import { registerPraktikumRoutes } from "./routes/praktikum";
import { registerPraktikanRoutes } from "./routes/praktikan";
import { registerAsistenRoutes } from "./routes/asisten";
import { registerSoalRoutes } from "./routes/soal";
import { registerJawabanRoutes } from "./routes/jawaban";
import { registerNilaiRoutes } from "./routes/nilai";
import { registerPollingRoutes } from "./routes/polling";
import { registerAdminRoutes } from "./routes/admin";
import { registerImageKitRoutes } from "./routes/imagekit";
import type { AppBindings } from "./types";

const app = new Hono<AppBindings>();

// Session middleware runs on all requests
app.use("*", sessionMiddleware);

// Register all API route modules
registerAuthRoutes(app);
registerKelasRoutes(app);
registerModulRoutes(app);
registerPraktikumRoutes(app);
registerPraktikanRoutes(app);
registerAsistenRoutes(app);
registerSoalRoutes(app);
registerJawabanRoutes(app);
registerNilaiRoutes(app);
registerPollingRoutes(app);
registerAdminRoutes(app);
registerImageKitRoutes(app);

// Health check
app.get("/api/health", c => c.json({ ok: true }));

// 404 for unmatched API routes
app.all("/api/*", c => c.json({ error: "Not found" }, 404));

// Catch-all (should not be reached — Wrangler assets handles SPA fallback)
app.all("*", c => c.text("", 404));

export default {
    fetch: app.fetch,
};
