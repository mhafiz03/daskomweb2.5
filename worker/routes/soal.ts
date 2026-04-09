import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { soalFitbs, soalJurnals, soalMandiris, soalTas, soalTks, soalTps, soalOpsis, soalComments } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerSoalRoutes(app: Hono<AppBindings>) {
    // ── FITB ──────────────────────────────────────────────────────────────
    app.get("/api/soal/fitb", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalFitbs).where(eq(soalFitbs.modulId, modulId)));
        return c.json(await db.select().from(soalFitbs));
    }));
    app.post("/api/soal/fitb", requirePermission("manage-soal")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.insert(soalFitbs).values(body).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/fitb/:id", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const [r] = await db.update(soalFitbs).set(await c.req.json()).where(eq(soalFitbs.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/fitb/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalFitbs).where(eq(soalFitbs.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── JURNAL ────────────────────────────────────────────────────────────
    app.get("/api/soal/jurnal", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalJurnals).where(eq(soalJurnals.modulId, modulId)));
        return c.json(await db.select().from(soalJurnals));
    }));
    app.post("/api/soal/jurnal", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalJurnals).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/jurnal/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalJurnals).set(await c.req.json()).where(eq(soalJurnals.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/jurnal/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalJurnals).where(eq(soalJurnals.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── MANDIRI ───────────────────────────────────────────────────────────
    app.get("/api/soal/mandiri", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalMandiris).where(eq(soalMandiris.modulId, modulId)));
        return c.json(await db.select().from(soalMandiris));
    }));
    app.post("/api/soal/mandiri", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalMandiris).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/mandiri/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalMandiris).set(await c.req.json()).where(eq(soalMandiris.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/mandiri/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalMandiris).where(eq(soalMandiris.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── TA (Theory Application - Multiple Choice) ─────────────────────────
    app.get("/api/soal/ta", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalTas).where(eq(soalTas.modulId, modulId)));
        return c.json(await db.select().from(soalTas));
    }));
    app.post("/api/soal/ta", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalTas).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/ta/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalTas).set(await c.req.json()).where(eq(soalTas.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/ta/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalTas).where(eq(soalTas.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── TK (Theory Knowledge - Multiple Choice) ───────────────────────────
    app.get("/api/soal/tk", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalTks).where(eq(soalTks.modulId, modulId)));
        return c.json(await db.select().from(soalTks));
    }));
    app.post("/api/soal/tk", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalTks).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/tk/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalTks).set(await c.req.json()).where(eq(soalTks.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/tk/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalTks).where(eq(soalTks.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── TP (Preliminary Task) ─────────────────────────────────────────────
    app.get("/api/soal/tp", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalTps).where(eq(soalTps.modulId, modulId)));
        return c.json(await db.select().from(soalTps));
    }));
    app.post("/api/soal/tp", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalTps).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/tp/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalTps).set(await c.req.json()).where(eq(soalTps.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/tp/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalTps).where(eq(soalTps.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── Options (soal_opsis) ──────────────────────────────────────────────
    app.get("/api/soal/opsis", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const { soalType, soalId } = c.req.query();
        if (soalType && soalId) {
            return c.json(await db.select().from(soalOpsis)
                .where(eq(soalOpsis.soalType, soalType)));
        }
        return c.json(await db.select().from(soalOpsis));
    }));
    app.post("/api/soal/opsis", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).insert(soalOpsis).values(await c.req.json()).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/opsis/:id", requirePermission("manage-soal")(async c => {
        const [r] = await getDb(c.env).update(soalOpsis).set(await c.req.json()).where(eq(soalOpsis.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/opsis/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalOpsis).where(eq(soalOpsis.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── Comments ──────────────────────────────────────────────────────────
    app.get("/api/soal/comments", requirePermission("see-soal")(async c => {
        const db = getDb(c.env);
        const { soalType, soalId } = c.req.query();
        if (soalType && soalId) {
            return c.json(await db.select().from(soalComments).where(eq(soalComments.soalType, soalType)));
        }
        return c.json(await db.select().from(soalComments));
    }));
    app.post("/api/soal/comments", requirePermission("manage-soal")(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const [r] = await getDb(c.env).insert(soalComments).values({ ...body, asistenId: user.id }).returning();
        return c.json(r, 201);
    }));
    app.delete("/api/soal/comments/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalComments).where(eq(soalComments.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));
}
