import type { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../utils";
import { kelas, laporanPraktikans, moduls, praktikums, users } from "../db";
import { requirePermission, requirePraktikan, requireSession } from "../middleware/session";
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
            status: "running",
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
            status: "completed",
            isActive: false,
            endedAt: new Date(),
            currentPhase: null,
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    app.post("/api/praktikums/:id/pause", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(praktikums).where(eq(praktikums.id, c.req.param("id")!)).get();
        if (!row) return c.json({ error: "Not found" }, 404);

        let elapsed = Math.max(0, Number(row.phaseElapsedSeconds ?? 0));
        if (row.phaseStartedAt) {
            const started = new Date(row.phaseStartedAt).getTime();
            if (!Number.isNaN(started)) {
                elapsed += Math.max(0, Math.floor((Date.now() - started) / 1000));
            }
        }

        const [updated] = await db.update(praktikums).set({
            status: "paused",
            phaseElapsedSeconds: elapsed,
            phaseStartedAt: null,
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    app.post("/api/praktikums/:id/resume", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const [updated] = await db.update(praktikums).set({
            status: "running",
            isActive: true,
            phaseStartedAt: new Date(),
        }).where(eq(praktikums.id, c.req.param("id")!)).returning();
        return c.json(updated);
    }));

    app.post("/api/praktikums/:id/exit", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const [updated] = await db.update(praktikums).set({
            status: "exited",
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

    app.get("/api/praktikum/check-praktikum", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;

        if (!user.kelasId) {
            return c.json({
                status: "error",
                message: "Praktikan does not have an assigned kelas.",
            }, 400);
        }

        if (!user.dk) {
            return c.json({
                status: "success",
                message: "Praktikan belum memilih DK. Silakan pilih DK terlebih dahulu.",
                dk_required: true,
                data: null,
                feedback_pending: false,
                feedback_modul_id: null,
                feedback_asisten_id: null,
            });
        }

        const activePraktikum = await db.select().from(praktikums).where(and(
            eq(praktikums.kelasId, user.kelasId),
            eq(praktikums.dk, user.dk),
            eq(praktikums.isActive, true),
            inArray(praktikums.status, ["ongoing", "running", "paused"]),
        )).get();

        const latestCompletedPraktikum = await db.select().from(praktikums).where(and(
            eq(praktikums.kelasId, user.kelasId),
            eq(praktikums.dk, user.dk),
            inArray(praktikums.status, ["completed", "ended"]),
        )).get();

        const latestDone = latestCompletedPraktikum ?? null;
        let feedbackPending = false;
        let feedbackModulId = null;
        let feedbackAsistenId = null;

        if (latestDone) {
            const feedbackRow = await db.select().from(laporanPraktikans).where(and(
                eq(laporanPraktikans.praktikanId, user.id),
                eq(laporanPraktikans.modulId, latestDone.modulId),
            )).get();

            const reportNotes = String(latestDone.reportNotes ?? "").trim();
            if (!feedbackRow && reportNotes === "") {
                feedbackPending = true;
                feedbackModulId = latestDone.modulId;
                feedbackAsistenId = latestDone.pjId;
            }
        }

        if (!activePraktikum) {
            return c.json({
                status: "success",
                message: "No active praktikum for this kelas.",
                data: null,
                feedback_pending: feedbackPending,
                feedback_modul_id: feedbackModulId,
                feedback_asisten_id: feedbackAsistenId,
            });
        }

        const [modul, pj] = await Promise.all([
            db.select().from(moduls).where(eq(moduls.id, activePraktikum.modulId)).get(),
            activePraktikum.pjId
                ? db.select().from(users).where(eq(users.id, activePraktikum.pjId)).get()
                : Promise.resolve(null),
        ]);

        return c.json({
            status: "success",
            message: "Active praktikum found.",
            data: {
                ...activePraktikum,
                status: activePraktikum.status === "ongoing" ? "running" : activePraktikum.status,
                modul: modul ? { id: modul.id, judul: modul.nama } : null,
                pj: pj ? { id: pj.id, nama: pj.name, kode: pj.kode } : null,
                feedback_pending: feedbackPending && feedbackModulId === activePraktikum.modulId && String(activePraktikum.reportNotes ?? "").trim() === "",
                feedback_modul_id: feedbackModulId,
                feedback_asisten_id: feedbackAsistenId,
            },
            feedback_pending: feedbackPending,
            feedback_modul_id: feedbackModulId,
            feedback_asisten_id: feedbackAsistenId,
        });
    }));

    app.post("/api/praktikum/set-dk", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const { dk } = await c.req.json<{ dk: string }>();

        if (!["DK1", "DK2"].includes(dk)) {
            return c.json({ status: "error", message: "DK tidak valid." }, 422);
        }

        await db.update(users).set({ dk }).where(eq(users.id, user.id));
        return c.json({ status: "success", message: "DK berhasil disimpan.", dk });
    }));

    app.get("/api/anomalies/attendance", requirePermission("see-praktikum")(async c => {
        const db = getDb(c.env);
        const limit = Math.max(Math.min(Number(c.req.query("limit") ?? 200), 1000), 1);
        const kelasId = c.req.query("kelas_id");
        const modulId = c.req.query("modul_id");
        const dk = c.req.query("dk")?.toUpperCase();

        const allPraktikums = await db.select().from(praktikums);
        const filteredPraktikums = allPraktikums
            .filter((praktikum) => ["completed", "ended"].includes(praktikum.status))
            .filter((praktikum) => !kelasId || praktikum.kelasId === kelasId)
            .filter((praktikum) => !modulId || praktikum.modulId === modulId)
            .filter((praktikum) => !dk || praktikum.dk === dk)
            .slice(0, limit);

        if (filteredPraktikums.length === 0) {
            return c.json({ data: [], meta: { count: 0 } });
        }

        const kelasRows = await db.select().from(kelas);
        const modulRows = await db.select().from(moduls);
        const userRows = await db.select().from(users);
        const laporanRows = await db.select().from(laporanPraktikans);
        const kelasMap = new Map(kelasRows.map((row) => [row.id, row]));
        const modulMap = new Map(modulRows.map((row) => [row.id, row]));
        const praktikanRows = userRows.filter((row) => row.userType === "praktikan");
        const laporanSet = new Set(laporanRows.map((row) => `${row.praktikanId}:${row.modulId}`));

        const data = [];
        for (const praktikum of filteredPraktikums) {
            const kelasRow = kelasMap.get(praktikum.kelasId);
            const modulRow = modulMap.get(praktikum.modulId);
            const peserta = praktikanRows.filter((praktikan) => praktikan.kelasId === praktikum.kelasId);

            for (const praktikan of peserta) {
                const laporanKey = `${praktikan.id}:${praktikum.modulId}`;
                if (laporanSet.has(laporanKey)) {
                    continue;
                }

                data.push({
                    praktikan_id: praktikan.id,
                    praktikan_name: praktikan.name,
                    nim: praktikan.nim,
                    kelas_id: kelasRow?.id ?? praktikum.kelasId,
                    kelas_name: kelasRow?.kelas ?? null,
                    modul_id: modulRow?.id ?? praktikum.modulId,
                    modul_name: modulRow?.nama ?? null,
                    praktikum_id: praktikum.id,
                    dk: praktikum.dk,
                    ended_at: praktikum.endedAt,
                    status: praktikum.status,
                });
            }
        }

        return c.json({
            data,
            meta: {
                count: data.length,
            },
        });
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
