import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { kelas } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerKelasRoutes(app: Hono<AppBindings>) {
    app.get("/api/kelas/public", async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(kelas));
    });

    app.get("/api/kelas", requireSession(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(kelas));
    }));

    app.get("/api/kelas/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(kelas).where(eq(kelas.id, c.req.param("id")!)).get();
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
    }));

    app.post("/api/kelas", requirePermission("manage-praktikum")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [created] = await db.insert(kelas).values(body).returning();
        return c.json(created, 201);
    }));

    app.patch("/api/kelas/:id", requirePermission("manage-praktikum")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [updated] = await db.update(kelas).set(body).where(eq(kelas.id, c.req.param("id")!)).returning();
        if (!updated) return c.json({ error: "Not found" }, 404);
        return c.json(updated);
    }));

    app.delete("/api/kelas/:id", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        await db.delete(kelas).where(eq(kelas.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));
}
