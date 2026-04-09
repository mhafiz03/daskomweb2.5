import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { moduls, resources } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerModulRoutes(app: Hono<AppBindings>) {
    app.get("/api/moduls", requireSession(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(moduls));
    }));

    app.get("/api/moduls/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(moduls).where(eq(moduls.id, c.req.param("id")!)).get();
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
    }));

    app.post("/api/moduls", requirePermission("manage-modul")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [created] = await db.insert(moduls).values(body).returning();
        return c.json(created, 201);
    }));

    app.patch("/api/moduls/:id", requirePermission("manage-modul")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [updated] = await db.update(moduls).set(body).where(eq(moduls.id, c.req.param("id")!)).returning();
        if (!updated) return c.json({ error: "Not found" }, 404);
        return c.json(updated);
    }));

    app.delete("/api/moduls/:id", requirePermission("manage-modul")(async c => {
        const db = getDb(c.env);
        await db.delete(moduls).where(eq(moduls.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // Unlock a modul
    app.post("/api/moduls/:id/unlock", requirePermission("unlock-jawaban")(async c => {
        const db = getDb(c.env);
        await db.update(moduls).set({ isUnlocked: true }).where(eq(moduls.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // Resources for a modul
    app.get("/api/moduls/:id/resources", requireSession(async c => {
        const db = getDb(c.env);
        const rows = await db.select().from(resources).where(eq(resources.modulId, c.req.param("id")!));
        return c.json(rows);
    }));

    app.put("/api/moduls/:id/resources", requirePermission("manage-modul")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const existing = await db.select().from(resources).where(eq(resources.modulId, c.req.param("id")!)).get();
        if (existing) {
            const [updated] = await db.update(resources).set(body).where(eq(resources.modulId, c.req.param("id")!)).returning();
            return c.json(updated);
        }
        const [created] = await db.insert(resources).values({ ...body, modulId: c.req.param("id")! }).returning();
        return c.json(created, 201);
    }));
}
