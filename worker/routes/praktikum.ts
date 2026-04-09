import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { praktikums } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerPraktikumRoutes(app: Hono<AppBindings>) {
    app.get("/api/praktikums", requirePermission("see-praktikum")(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(praktikums));
    }));

    app.get("/api/praktikums/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(praktikums).where(eq(praktikums.id, c.req.param("id")!)).get();
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
    }));

    app.post("/api/praktikums", requirePermission("manage-praktikum")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [created] = await db.insert(praktikums).values(body).returning();
        return c.json(created, 201);
    }));

    app.patch("/api/praktikums/:id", requirePermission("manage-praktikum")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [updated] = await db.update(praktikums).set(body).where(eq(praktikums.id, c.req.param("id")!)).returning();
        if (!updated) return c.json({ error: "Not found" }, 404);
        return c.json(updated);
    }));

    app.delete("/api/praktikums/:id", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        await db.delete(praktikums).where(eq(praktikums.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // Session control
    app.post("/api/praktikums/:id/start", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const { phase } = await c.req.json<{ phase?: string }>();
        const [updated] = await db.update(praktikums).set({
            status: "ongoing",
            isActive: true,
            startedAt: new Date(),
            currentPhase: phase ?? "tp",
            phaseStartedAt: new Date(),
            phaseElapsedSeconds: 0,
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    app.post("/api/praktikums/:id/end", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const [updated] = await db.update(praktikums).set({
            status: "ended",
            isActive: false,
            endedAt: new Date(),
            currentPhase: null,
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    app.post("/api/praktikums/:id/next-phase", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const { phase } = await c.req.json<{ phase: string }>();
        const [updated] = await db.update(praktikums).set({
            currentPhase: phase,
            phaseStartedAt: new Date(),
            phaseElapsedSeconds: 0,
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    // Progress (polling endpoint — replaces Reverb WebSocket)
    app.get("/api/praktikums/:id/progress", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select({
            id: praktikums.id,
            status: praktikums.status,
            currentPhase: praktikums.currentPhase,
            phaseStartedAt: praktikums.phaseStartedAt,
            phaseElapsedSeconds: praktikums.phaseElapsedSeconds,
            startedAt: praktikums.startedAt,
            endedAt: praktikums.endedAt,
            isActive: praktikums.isActive,
        }).from(praktikums).where(eq(praktikums.id, c.req.param("id")!)).get();
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
    }));

    // Report submission
    app.post("/api/praktikums/:id/report", requirePermission("laporan-praktikum")(async c => {
        const { notes } = await c.req.json<{ notes: string }>();
        const db = getDb(c.env);
        const [updated] = await db.update(praktikums).set({
            reportNotes: notes,
            reportSubmittedAt: new Date(),
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));
}
