import type { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../utils";
import { kelas, moduls, nilais, nilaiComplaints, users } from "../db";
import { requirePermission, requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerNilaiRoutes(app: Hono<AppBindings>) {
    const isMultipleOfFive = (value: number | null | undefined) => {
        if (value === null || value === undefined) {
            return true;
        }

        const scaled = Math.round(Number(value) * 100);
        return scaled % 500 === 0;
    };

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

    app.get("/api/anomalies/grades", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const nonMultipleOnly = ["1", "true"].includes(String(c.req.query("non_multiple") ?? "0"));
        const overLimitOnly = ["1", "true"].includes(String(c.req.query("over_limit") ?? "0"));
        const kelasId = c.req.query("kelas_id");
        const modulId = c.req.query("modul_id");
        const fields = ["tp", "ta", "d1", "d2", "d3", "d4", "l1", "l2", "avg"] as const;

        let items = await db.select().from(nilais).orderBy(desc(nilais.updatedAt));
        if (kelasId) {
            items = items.filter((item) => item.kelasId === kelasId);
        }
        if (modulId) {
            items = items.filter((item) => item.modulId === modulId);
        }

        const userRows = await db.select().from(users);
        const kelasRows = await db.select().from(kelas);
        const modulRows = await db.select().from(moduls);
        const userMap = new Map(userRows.map((row) => [row.id, row]));
        const kelasMap = new Map(kelasRows.map((row) => [row.id, row]));
        const modulMap = new Map(modulRows.map((row) => [row.id, row]));

        const filtered = items.map((nilai) => {
            const flags = {
                non_multiple: [] as string[],
                over_limit: [] as string[],
            };

            for (const field of fields) {
                const value = nilai[field];
                if (typeof value !== "number") {
                    continue;
                }

                if (!isMultipleOfFive(value)) {
                    flags.non_multiple.push(field);
                }

                if (value > 100) {
                    flags.over_limit.push(field);
                }
            }

            if (nonMultipleOnly && flags.non_multiple.length === 0) {
                return null;
            }

            if (overLimitOnly && flags.over_limit.length === 0) {
                return null;
            }

            const praktikan = userMap.get(nilai.praktikanId);
            const asisten = nilai.asistenId ? userMap.get(nilai.asistenId) : null;
            const kelasRow = kelasMap.get(nilai.kelasId);
            const modulRow = modulMap.get(nilai.modulId);

            return {
                id: nilai.id,
                praktikan: {
                    id: nilai.praktikanId,
                    nama: praktikan?.name ?? null,
                    nim: praktikan?.nim ?? null,
                },
                kelas: {
                    id: nilai.kelasId,
                    nama: kelasRow?.kelas ?? null,
                },
                modul: {
                    id: nilai.modulId,
                    judul: modulRow?.nama ?? null,
                },
                scores: Object.fromEntries(fields.map((field) => [field, nilai[field]])),
                flags,
                asisten: asisten ? {
                    id: asisten.id,
                    nama: asisten.name,
                    kode: asisten.kode,
                    nomor_telepon: asisten.nomorTelepon,
                    id_line: asisten.idLine,
                    instagram: asisten.instagram,
                } : null,
                updated_at: nilai.updatedAt,
            };
        }).filter(Boolean);

        return c.json({
            data: filtered,
            meta: {
                count: filtered.length,
            },
        });
    }));
}
