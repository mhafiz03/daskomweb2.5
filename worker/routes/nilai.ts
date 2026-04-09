import type { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../utils";
import { nilais, nilaiComplaints, users } from "../db";
import { requirePermission, requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerNilaiRoutes(app: Hono<AppBindings>) {
    app.get("/api/nilai", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        let q = db.select().from(nilais);
        if (modulId) q = q.where(eq(nilais.modulId, modulId)) as typeof q;
        return c.json(await q);
    }));

    app.get("/api/nilai/my", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        return c.json(await db.select().from(nilais).where(eq(nilais.praktikanId, user.id)));
    }));

    app.post("/api/nilai", requirePermission("nilai-praktikan")(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        // Compute avg from d1-d4, l1, l2
        const { d1, d2, d3, d4, l1, l2, tp, ta } = body as Record<string, number>;
        const avg = (d1 + d2 + d3 + d4 + l1 + l2 + tp + ta) / 8;
        const db = getDb(c.env);
        const [r] = await db.insert(nilais).values({ ...body, avg, asistenId: user.id }).returning();
        return c.json(r, 201);
    }));

    app.patch("/api/nilai/:id", requirePermission("nilai-praktikan")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        // Recompute avg if grade fields changed
        const existing = await db.select().from(nilais).where(eq(nilais.id, c.req.param("id")!)).get();
        if (!existing) return c.json({ error: "Not found" }, 404);
        const merged = { ...existing, ...body };
        const avg = (merged.d1 + merged.d2 + merged.d3 + merged.d4 + merged.l1 + merged.l2 + merged.tp + merged.ta) / 8;
        const [r] = await db.update(nilais).set({ ...body, avg }).where(eq(nilais.id, c.req.param("id")!)).returning();
        return c.json(r);
    }));

    // Leaderboard
    app.get("/api/nilai/leaderboard", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        let q = db.select({
            praktikanId: nilais.praktikanId,
            avg: nilais.avg,
            name: users.name,
            nim: users.nim,
        })
        .from(nilais)
        .innerJoin(users, eq(nilais.praktikanId, users.id))
        .orderBy(desc(nilais.avg));
        if (modulId) q = q.where(eq(nilais.modulId, modulId)) as typeof q;
        return c.json(await q.limit(50));
    }));

    // Complaints
    app.get("/api/nilai/complaints", requireSession(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        let q = db.select().from(nilaiComplaints);
        if (user.userType === "praktikan") {
            q = q.where(eq(nilaiComplaints.praktikanId, user.id)) as typeof q;
        }
        return c.json(await q);
    }));

    app.post("/api/nilai/:id/complaint", requirePraktikan(async c => {
        const user = c.get("user")!;
        const { message } = await c.req.json<{ message: string }>();
        const db = getDb(c.env);
        const [r] = await db.insert(nilaiComplaints).values({
            nilaiId: c.req.param("id")!,
            praktikanId: user.id,
            message,
        }).returning();
        return c.json(r, 201);
    }));

    app.patch("/api/nilai/complaints/:id", requirePermission("nilai-praktikan")(async c => {
        const { status, notes } = await c.req.json<{ status: string; notes?: string }>();
        const db = getDb(c.env);
        const [r] = await db.update(nilaiComplaints)
            .set({ status, notes })
            .where(eq(nilaiComplaints.id, c.req.param("id")!))
            .returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
}
