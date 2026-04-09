import type { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../utils";
import { auditLogs, configurations, tugasPendahuluans, tugasPendahuluanKelas } from "../db";
import { requirePermission, requireAsisten } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerAdminRoutes(app: Hono<AppBindings>) {
    // Audit logs
    app.get("/api/admin/audit-logs", requirePermission("lms-configuration")(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200));
    }));

    // Configurations
    app.get("/api/config", requirePermission("lms-configuration")(async c => {
        return c.json(await getDb(c.env).select().from(configurations));
    }));
    app.put("/api/config/:key", requirePermission("lms-configuration")(async c => {
        const { value } = await c.req.json<{ value: string }>();
        const db = getDb(c.env);
        const [r] = await db.insert(configurations)
            .values({ configKey: c.req.param("key")!, value })
            .onConflictDoUpdate({ target: configurations.configKey, set: { value } })
            .returning();
        return c.json(r);
    }));

    // Tugas Pendahuluan
    app.get("/api/tugas-pendahuluan", requireAsisten(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(tugasPendahuluans).where(eq(tugasPendahuluans.modulId, modulId)));
        return c.json(await db.select().from(tugasPendahuluans));
    }));
    app.post("/api/tugas-pendahuluan", requirePermission("tugas-pendahuluan")(async c => {
        const [r] = await getDb(c.env).insert(tugasPendahuluans).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/tugas-pendahuluan/:id", requirePermission("tugas-pendahuluan")(async c => {
        const [r] = await getDb(c.env).update(tugasPendahuluans).set(await c.req.json()).where(eq(tugasPendahuluans.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/tugas-pendahuluan/:id", requirePermission("tugas-pendahuluan")(async c => {
        await getDb(c.env).delete(tugasPendahuluans).where(eq(tugasPendahuluans.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // TP kelas assignment
    app.post("/api/tugas-pendahuluan/:id/kelas", requirePermission("tugas-pendahuluan")(async c => {
        const { kelasId } = await c.req.json<{ kelasId: string }>();
        const [r] = await getDb(c.env).insert(tugasPendahuluanKelas).values({
            tugasPendahuluanId: c.req.param("id")!,
            kelasId,
        }).returning();
        return c.json(r, 201);
    }));
    app.delete("/api/tugas-pendahuluan-kelas/:id", requirePermission("tugas-pendahuluan")(async c => {
        await getDb(c.env).delete(tugasPendahuluanKelas).where(eq(tugasPendahuluanKelas.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));
}
