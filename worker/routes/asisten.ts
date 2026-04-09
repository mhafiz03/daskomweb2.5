import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { users, jadwalJagas, fotoAsistens, feedback } from "../db";
import { requirePermission, requireSession, requireAsisten } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerAsistenRoutes(app: Hono<AppBindings>) {
    app.get("/api/asistens", requireSession(async c => {
        const db = getDb(c.env);
        const rows = await db.select().from(users).where(eq(users.userType, "asisten"));
        return c.json(rows.map(({ passwordHash: _, ...r }) => r));
    }));

    app.get("/api/asistens/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(users)
            .where(eq(users.id, c.req.param("id")!))
            .get();
        if (!row || row.userType !== "asisten") return c.json({ error: "Not found" }, 404);
        const { passwordHash: _, ...safe } = row;
        return c.json(safe);
    }));

    app.patch("/api/asistens/:id", requirePermission("manage-profile")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.update(users).set(body).where(eq(users.id, c.req.param("id")!)).returning();
        if (!r) return c.json({ error: "Not found" }, 404);
        const { passwordHash: _, ...safe } = r;
        return c.json(safe);
    }));

    // Jadwal jaga
    app.get("/api/jadwal-jaga", requireSession(async c => {
        const db = getDb(c.env);
        const { kelasId } = c.req.query();
        if (kelasId) return c.json(await db.select().from(jadwalJagas).where(eq(jadwalJagas.kelasId, kelasId)));
        return c.json(await db.select().from(jadwalJagas));
    }));
    app.post("/api/jadwal-jaga", requirePermission("manage-plot")(async c => {
        const [r] = await getDb(c.env).insert(jadwalJagas).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.delete("/api/jadwal-jaga/:id", requirePermission("manage-plot")(async c => {
        await getDb(c.env).delete(jadwalJagas).where(eq(jadwalJagas.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // Foto asisten
    app.get("/api/asistens/:id/foto", requireSession(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(fotoAsistens).where(eq(fotoAsistens.userId, c.req.param("id")!)));
    }));
    app.post("/api/asistens/foto", requireAsisten(async c => {
        const user = c.get("user")!;
        const { fotoUrl } = await c.req.json<{ fotoUrl: string }>();
        const [r] = await getDb(c.env).insert(fotoAsistens).values({ userId: user.id, fotoUrl }).returning();
        return c.json(r, 201);
    }));

    // Feedback
    app.get("/api/feedback", requirePermission("see-pelanggaran")(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(feedback));
    }));
    app.post("/api/feedback", requireAsisten(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const [r] = await getDb(c.env).insert(feedback).values({ ...body, asistenId: user.id }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/feedback/:id/read", requireAsisten(async c => {
        const [r] = await getDb(c.env).update(feedback).set({ read: true }).where(eq(feedback.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
}
