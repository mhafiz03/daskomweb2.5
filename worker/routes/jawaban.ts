import type { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils";
import {
    jawabanFitbs, jawabanJurnals, jawabanMandiris, jawabanTas, jawabanTks, jawabanTps,
    tempJawabantps, tempSoaljurnals, kumpulTps,
} from "../db";
import { requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerJawabanRoutes(app: Hono<AppBindings>) {
    // ── FITB ──────────────────────────────────────────────────────────────
    app.get("/api/jawaban/fitb", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        let q = db.select().from(jawabanFitbs);
        if (modulId) q = q.where(eq(jawabanFitbs.modulId, modulId)) as typeof q;
        return c.json(await q);
    }));
    app.post("/api/jawaban/fitb", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.insert(jawabanFitbs).values({ ...body, praktikanId: user.id }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/jawaban/fitb/:id", requirePraktikan(async c => {
        const body = await c.req.json();
        const [r] = await getDb(c.env).update(jawabanFitbs).set(body).where(eq(jawabanFitbs.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));

    // ── JURNAL ────────────────────────────────────────────────────────────
    app.get("/api/jawaban/jurnal", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanJurnals).where(eq(jawabanJurnals.modulId, modulId)));
        return c.json(await db.select().from(jawabanJurnals));
    }));
    app.post("/api/jawaban/jurnal", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const [r] = await getDb(c.env).insert(jawabanJurnals).values({ ...body, praktikanId: user.id }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/jawaban/jurnal/:id", requirePraktikan(async c => {
        const [r] = await getDb(c.env).update(jawabanJurnals).set(await c.req.json()).where(eq(jawabanJurnals.id, c.req.param("id")!)).returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));

    // ── MANDIRI ───────────────────────────────────────────────────────────
    app.get("/api/jawaban/mandiri", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanMandiris).where(eq(jawabanMandiris.modulId, modulId)));
        return c.json(await db.select().from(jawabanMandiris));
    }));
    app.post("/api/jawaban/mandiri", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const [r] = await getDb(c.env).insert(jawabanMandiris).values({ ...body, praktikanId: user.id }).returning();
        return c.json(r, 201);
    }));

    // ── TA ────────────────────────────────────────────────────────────────
    app.get("/api/jawaban/ta", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanTas).where(eq(jawabanTas.modulId, modulId)));
        return c.json(await db.select().from(jawabanTas));
    }));
    app.post("/api/jawaban/ta", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        // Upsert (unique on soalId + praktikanId)
        const [r] = await db.insert(jawabanTas).values({ ...body, praktikanId: user.id })
            .onConflictDoUpdate({ target: [jawabanTas.soalId, jawabanTas.praktikanId], set: { opsiId: body.opsiId } })
            .returning();
        return c.json(r, 201);
    }));

    // ── TK ────────────────────────────────────────────────────────────────
    app.get("/api/jawaban/tk", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanTks).where(eq(jawabanTks.modulId, modulId)));
        return c.json(await db.select().from(jawabanTks));
    }));
    app.post("/api/jawaban/tk", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.insert(jawabanTks).values({ ...body, praktikanId: user.id })
            .onConflictDoUpdate({ target: [jawabanTks.soalId, jawabanTks.praktikanId], set: { opsiId: body.opsiId } })
            .returning();
        return c.json(r, 201);
    }));

    // ── TP ────────────────────────────────────────────────────────────────
    app.get("/api/jawaban/tp", requireSession(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const { modulId } = c.req.query();
        if (user.userType === "praktikan") {
            if (modulId) {
                return c.json(await db.select().from(jawabanTps).where(and(
                    eq(jawabanTps.modulId, modulId),
                    eq(jawabanTps.praktikanId, user.id),
                )));
            }

            return c.json(await db.select().from(jawabanTps).where(eq(jawabanTps.praktikanId, user.id)));
        }

        if (modulId) return c.json(await db.select().from(jawabanTps).where(eq(jawabanTps.modulId, modulId)));
        return c.json(await db.select().from(jawabanTps));
    }));
    app.post("/api/jawaban/tp", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const submissions = Array.isArray(body) ? body : [body];
        const results = [];

        for (const submission of submissions) {
            const soalId = submission?.soal_id ?? submission?.soalId;
            const modulId = submission?.modul_id ?? submission?.modulId;
            const jawaban = String(submission?.jawaban ?? "-");

            const existing = await db.select().from(jawabanTps).where(and(
                eq(jawabanTps.praktikanId, user.id),
                eq(jawabanTps.soalId, soalId),
            )).get();

            if (existing) {
                const [updated] = await db.update(jawabanTps)
                    .set({ jawaban, modulId, updatedAt: new Date() })
                    .where(eq(jawabanTps.id, existing.id))
                    .returning();
                results.push(updated);
            } else {
                const [created] = await db.insert(jawabanTps)
                    .values({ praktikanId: user.id, soalId, modulId, jawaban })
                    .returning();
                results.push(created);
            }
        }

        return c.json(Array.isArray(body) ? { status: "success", data: results } : results[0], 201);
    }));

    // ── Autosave (temp) ───────────────────────────────────────────────────
    app.post("/api/jawaban/tp/autosave", requirePraktikan(async c => {
        const user = c.get("user")!;
        const { snapshots } = await c.req.json<{ snapshots: Array<{ soalId: string; modulId: string; jawaban: string }> }>();
        const db = getDb(c.env);
        const CHUNK = 100;
        for (let i = 0; i < snapshots.length; i += CHUNK) {
            const chunk = snapshots.slice(i, i + CHUNK).map(s => ({ ...s, praktikanId: user.id }));
            await db.insert(tempJawabantps).values(chunk)
                .onConflictDoUpdate({ target: [tempJawabantps.soalId, tempJawabantps.praktikanId], set: { jawaban: chunk[0]!.jawaban } });
        }
        return c.json({ ok: true });
    }));

    app.post("/api/jawaban/jurnal/autosave", requirePraktikan(async c => {
        const user = c.get("user")!;
        const { snapshots } = await c.req.json<{ snapshots: Array<{ soalId: string; modulId: string; jawaban: string }> }>();
        const db = getDb(c.env);
        const CHUNK = 100;
        for (let i = 0; i < snapshots.length; i += CHUNK) {
            const chunk = snapshots.slice(i, i + CHUNK).map(s => ({ ...s, praktikanId: user.id }));
            await db.insert(tempSoaljurnals).values(chunk)
                .onConflictDoUpdate({ target: [tempSoaljurnals.soalId, tempSoaljurnals.praktikanId], set: { jawaban: chunk[0]!.jawaban } });
        }
        return c.json({ ok: true });
    }));

    // ── Kumpul TP ─────────────────────────────────────────────────────────
    app.get("/api/kumpul-tp", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        let q = db.select().from(kumpulTps);
        if (modulId) q = q.where(eq(kumpulTps.modulId, modulId)) as typeof q;
        return c.json(await q);
    }));
    app.post("/api/kumpul-tp", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const [r] = await getDb(c.env).insert(kumpulTps).values({ ...body, praktikanId: user.id }).returning();
        return c.json(r, 201);
    }));
}
