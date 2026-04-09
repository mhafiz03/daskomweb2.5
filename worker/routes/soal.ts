import type { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils";
import { soalFitbs, soalJurnals, soalMandiris, soalTas, soalTks, soalTps, soalOpsis, soalComments, users } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

const enrichMultipleChoiceQuestions = async (
    db: ReturnType<typeof getDb>,
    rows: Array<any>,
    soalType: "ta" | "tk",
) => {
    const soalIds = rows.map((row) => row.id).filter(Boolean);
    const opsiRows = soalIds.length > 0
        ? await db.select().from(soalOpsis).where(eq(soalOpsis.soalType, soalType))
        : [];

    return rows.map((row: any) => {
        const uniqueOptionIds = [
            ...new Set(
                opsiRows
                    .filter((opsi) => opsi.soalId === row.id)
                    .map((opsi) => opsi.id),
            ),
        ];
        return {
            ...row,
            pertanyaan: row.soal,
            options: uniqueOptionIds
                .map((id) => opsiRows.find((opsi) => opsi.id === id))
                .filter(Boolean)
                .map((opsi) => ({ id: opsi!.id, text: opsi!.text })),
        };
    });
};

const toStringId = (value: unknown) =>
    value === undefined || value === null || value === "" ? null : String(value);

const normalizeEssayPayload = (
    body: Record<string, unknown>,
    options: { includeFileUpload?: boolean; requireModulId?: boolean } = {},
) => {
    const modulId = toStringId(body.modulId ?? body.modul_id);
    const soal = typeof body.soal === "string" ? body.soal : "";
    const enableFileUpload = Boolean(body.enableFileUpload ?? body.enable_file_upload);
    const payload: Record<string, unknown> = {
        soal,
    };

    if (modulId !== null) {
        payload.modulId = modulId;
    } else if (options.requireModulId) {
        throw new Error("modul_id wajib diisi");
    }

    if (options.includeFileUpload) {
        payload.enableFileUpload = enableFileUpload;
    }

    return payload;
};

const normalizeMultipleChoicePayload = (body: Record<string, unknown>) => {
    const modulId = toStringId(body.modulId ?? body.modul_id);
    const soal = typeof body.pertanyaan === "string"
        ? body.pertanyaan
        : typeof body.soal === "string"
            ? body.soal
            : "";
    const rawOptions = Array.isArray(body.options) ? body.options : [];
    const options = rawOptions
        .map((option) => {
            if (typeof option === "string") {
                return { id: null, text: option, isCorrect: false };
            }

            const text = typeof option?.text === "string" ? option.text : "";
            const isCorrect = Boolean(option?.isCorrect ?? option?.is_correct);
            return {
                id: toStringId(option?.id),
                text,
                isCorrect,
            };
        })
        .filter((option) => option.text.trim() !== "");
    const correctOption = Number(body.correct_option);
    const correctIndex = Number.isFinite(correctOption) && correctOption >= 0
        ? correctOption
        : Math.max(options.findIndex((option) => option.isCorrect), 0);

    return {
        modulId,
        soal,
        options,
        correctIndex,
    };
};

const replaceOptionsForQuestion = async (
    db: ReturnType<typeof getDb>,
    soalType: "ta" | "tk",
    soalId: string,
    options: Array<{ text: string }>,
) => {
    await db.delete(soalOpsis).where(and(eq(soalOpsis.soalType, soalType), eq(soalOpsis.soalId, soalId)));

    if (options.length === 0) {
        return [];
    }

    return db.insert(soalOpsis)
        .values(options.map((option) => ({
            soalType,
            soalId,
            text: option.text.trim(),
        })))
        .returning();
};

export function registerSoalRoutes(app: Hono<AppBindings>) {
    // ── FITB ──────────────────────────────────────────────────────────────
    app.get("/api/soal/fitb", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalFitbs).where(eq(soalFitbs.modulId, modulId)));
        return c.json(await db.select().from(soalFitbs));
    }));
    app.post("/api/soal/fitb", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            includeFileUpload: true,
            requireModulId: true,
        });
        const db = getDb(c.env);
        const [r] = await db.insert(soalFitbs).values({
            modulId: String(body.modulId),
            soal: String(body.soal ?? ""),
            enableFileUpload: Boolean(body.enableFileUpload),
        }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/fitb/:id", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            includeFileUpload: true,
        });
        const updatePayload: { modulId?: string; soal?: string; enableFileUpload?: boolean } = {};
        if (body.modulId) updatePayload.modulId = String(body.modulId);
        if (body.soal !== undefined) updatePayload.soal = String(body.soal ?? "");
        if (body.enableFileUpload !== undefined) updatePayload.enableFileUpload = Boolean(body.enableFileUpload);
        const [r] = await db.update(soalFitbs)
            .set(updatePayload)
            .where(eq(soalFitbs.id, c.req.param("id")!))
            .returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/fitb/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalFitbs).where(eq(soalFitbs.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── JURNAL ────────────────────────────────────────────────────────────
    app.get("/api/soal/jurnal", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalJurnals).where(eq(soalJurnals.modulId, modulId)));
        return c.json(await db.select().from(soalJurnals));
    }));
    app.post("/api/soal/jurnal", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            includeFileUpload: true,
            requireModulId: true,
        });
        const [r] = await getDb(c.env).insert(soalJurnals).values({
            modulId: String(body.modulId),
            soal: String(body.soal ?? ""),
            enableFileUpload: Boolean(body.enableFileUpload),
        }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/jurnal/:id", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            includeFileUpload: true,
        });
        const updatePayload: { modulId?: string; soal?: string; enableFileUpload?: boolean } = {};
        if (body.modulId) updatePayload.modulId = String(body.modulId);
        if (body.soal !== undefined) updatePayload.soal = String(body.soal ?? "");
        if (body.enableFileUpload !== undefined) updatePayload.enableFileUpload = Boolean(body.enableFileUpload);
        const [r] = await getDb(c.env).update(soalJurnals)
            .set(updatePayload)
            .where(eq(soalJurnals.id, c.req.param("id")!))
            .returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/jurnal/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalJurnals).where(eq(soalJurnals.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── MANDIRI ───────────────────────────────────────────────────────────
    app.get("/api/soal/mandiri", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        if (modulId) return c.json(await db.select().from(soalMandiris).where(eq(soalMandiris.modulId, modulId)));
        return c.json(await db.select().from(soalMandiris));
    }));
    app.post("/api/soal/mandiri", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            requireModulId: true,
        });
        const [r] = await getDb(c.env).insert(soalMandiris).values({
            modulId: String(body.modulId),
            soal: String(body.soal ?? ""),
        }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/mandiri/:id", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>());
        const updatePayload: { modulId?: string; soal?: string } = {};
        if (body.modulId) updatePayload.modulId = String(body.modulId);
        if (body.soal !== undefined) updatePayload.soal = String(body.soal ?? "");
        const [r] = await getDb(c.env).update(soalMandiris)
            .set(updatePayload)
            .where(eq(soalMandiris.id, c.req.param("id")!))
            .returning();
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/mandiri/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalMandiris).where(eq(soalMandiris.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── TA (Theory Application - Multiple Choice) ─────────────────────────
    app.get("/api/soal/ta", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        const rows = modulId
            ? await db.select().from(soalTas).where(eq(soalTas.modulId, modulId))
            : await db.select().from(soalTas);
        return c.json(await enrichMultipleChoiceQuestions(db, rows, "ta"));
    }));
    app.post("/api/soal/ta", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const payload = normalizeMultipleChoicePayload(await c.req.json<Record<string, unknown>>());
        const [r] = await db.insert(soalTas).values({
            modulId: payload.modulId!,
            soal: payload.soal,
        }).returning();

        if (!r) {
            return c.json({ error: "Failed to create question" }, 500);
        }

        const createdOptions = await replaceOptionsForQuestion(db, "ta", r.id, payload.options);
        const [updated] = await db.update(soalTas)
            .set({
                opsi1Id: createdOptions[0]?.id ?? null,
                opsi2Id: createdOptions[1]?.id ?? null,
                opsi3Id: createdOptions[2]?.id ?? null,
                opsiBenarId: createdOptions[payload.correctIndex]?.id ?? createdOptions[0]?.id ?? null,
            })
            .where(eq(soalTas.id, r.id))
            .returning();

        return c.json(updated ?? r, 201);
    }));
    app.patch("/api/soal/ta/:id", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const payload = normalizeMultipleChoicePayload(await c.req.json<Record<string, unknown>>());
        const baseUpdate: Record<string, unknown> = {};

        if (payload.modulId) {
            baseUpdate.modulId = payload.modulId;
        }
        if (payload.soal.trim() !== "") {
            baseUpdate.soal = payload.soal;
        }

        if (Object.keys(baseUpdate).length > 0) {
            await db.update(soalTas).set(baseUpdate).where(eq(soalTas.id, c.req.param("id")!));
        }

        if (payload.options.length > 0) {
            const createdOptions = await replaceOptionsForQuestion(db, "ta", c.req.param("id")!, payload.options);
            await db.update(soalTas)
                .set({
                    opsi1Id: createdOptions[0]?.id ?? null,
                    opsi2Id: createdOptions[1]?.id ?? null,
                    opsi3Id: createdOptions[2]?.id ?? null,
                    opsiBenarId: createdOptions[payload.correctIndex]?.id ?? createdOptions[0]?.id ?? null,
                })
                .where(eq(soalTas.id, c.req.param("id")!));
        }

        const [r] = await db.select().from(soalTas).where(eq(soalTas.id, c.req.param("id")!));
        return r ? c.json(r) : c.json({ error: "Not found" }, 404);
    }));
    app.delete("/api/soal/ta/:id", requirePermission("manage-soal")(async c => {
        await getDb(c.env).delete(soalTas).where(eq(soalTas.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // ── TK (Theory Knowledge - Multiple Choice) ───────────────────────────
    app.get("/api/soal/tk", requireSession(async c => {
        const db = getDb(c.env);
        const modulId = c.req.query("modulId");
        const rows = modulId
            ? await db.select().from(soalTks).where(eq(soalTks.modulId, modulId))
            : await db.select().from(soalTks);
        return c.json(await enrichMultipleChoiceQuestions(db, rows, "tk"));
    }));
    app.post("/api/soal/tk", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const payload = normalizeMultipleChoicePayload(await c.req.json<Record<string, unknown>>());
        const [r] = await db.insert(soalTks).values({
            modulId: payload.modulId!,
            soal: payload.soal,
        }).returning();

        if (!r) {
            return c.json({ error: "Failed to create question" }, 500);
        }

        const createdOptions = await replaceOptionsForQuestion(db, "tk", r.id, payload.options);
        const [updated] = await db.update(soalTks)
            .set({
                opsiId: createdOptions[payload.correctIndex]?.id ?? createdOptions[0]?.id ?? null,
            })
            .where(eq(soalTks.id, r.id))
            .returning();

        return c.json(updated ?? r, 201);
    }));
    app.patch("/api/soal/tk/:id", requirePermission("manage-soal")(async c => {
        const db = getDb(c.env);
        const payload = normalizeMultipleChoicePayload(await c.req.json<Record<string, unknown>>());
        const baseUpdate: Record<string, unknown> = {};

        if (payload.modulId) {
            baseUpdate.modulId = payload.modulId;
        }
        if (payload.soal.trim() !== "") {
            baseUpdate.soal = payload.soal;
        }

        if (Object.keys(baseUpdate).length > 0) {
            await db.update(soalTks).set(baseUpdate).where(eq(soalTks.id, c.req.param("id")!));
        }

        if (payload.options.length > 0) {
            const createdOptions = await replaceOptionsForQuestion(db, "tk", c.req.param("id")!, payload.options);
            await db.update(soalTks)
                .set({
                    opsiId: createdOptions[payload.correctIndex]?.id ?? createdOptions[0]?.id ?? null,
                })
                .where(eq(soalTks.id, c.req.param("id")!));
        }

        const [r] = await db.select().from(soalTks).where(eq(soalTks.id, c.req.param("id")!));
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
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>(), {
            requireModulId: true,
        });
        const [r] = await getDb(c.env).insert(soalTps).values({
            modulId: String(body.modulId),
            soal: String(body.soal ?? ""),
        }).returning();
        return c.json(r, 201);
    }));
    app.patch("/api/soal/tp/:id", requirePermission("manage-soal")(async c => {
        const body = normalizeEssayPayload(await c.req.json<Record<string, unknown>>());
        const updatePayload: { modulId?: string; soal?: string } = {};
        if (body.modulId) updatePayload.modulId = String(body.modulId);
        if (body.soal !== undefined) updatePayload.soal = String(body.soal ?? "");
        const [r] = await getDb(c.env).update(soalTps)
            .set(updatePayload)
            .where(eq(soalTps.id, c.req.param("id")!))
            .returning();
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
                .where(and(eq(soalOpsis.soalType, soalType), eq(soalOpsis.soalId, soalId))));
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
        const { soalType, soalId, modulId } = c.req.query();
        let comments = await db.select().from(soalComments);

        if (soalType) {
            comments = comments.filter((comment) => comment.soalType === soalType);
        }

        if (soalId) {
            comments = comments.filter((comment) => String(comment.soalId) === String(soalId));
        }

        if (soalType && modulId) {
            const questions = soalType === "fitb"
                ? await db.select().from(soalFitbs).where(eq(soalFitbs.modulId, modulId))
                : soalType === "jurnal"
                    ? await db.select().from(soalJurnals).where(eq(soalJurnals.modulId, modulId))
                    : soalType === "mandiri"
                        ? await db.select().from(soalMandiris).where(eq(soalMandiris.modulId, modulId))
                        : soalType === "ta"
                            ? await db.select().from(soalTas).where(eq(soalTas.modulId, modulId))
                            : soalType === "tk"
                                ? await db.select().from(soalTks).where(eq(soalTks.modulId, modulId))
                                : soalType === "tp"
                                    ? await db.select().from(soalTps).where(eq(soalTps.modulId, modulId))
                                    : [];
            const questionIds = new Set(questions.map((question) => String(question.id)));
            comments = comments.filter((comment) => questionIds.has(String(comment.soalId)));
        }

        const authorIds = [...new Set(comments.map((comment) => comment.asistenId).filter(Boolean))];
        const authorRows = authorIds.length > 0
            ? (await db.select().from(users)).filter((user) => authorIds.includes(user.id))
            : [];
        const authorMap = new Map(authorRows.map((author) => [author.id, author]));

        return c.json(comments.map((comment) => {
            const author = comment.asistenId ? authorMap.get(comment.asistenId) : null;
            return {
                ...comment,
                praktikan: author ? {
                    id: author.id,
                    nama: author.name,
                    nim: author.nim,
                } : null,
            };
        }));
    }));
    app.post("/api/soal/comments", requireSession(async c => {
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
