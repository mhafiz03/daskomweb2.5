import type { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils";
import {
    autosaveQuestionSnapshots,
    autosaveSnapshots,
    jawabanFitbs, jawabanJurnals, jawabanMandiris, jawabanTas, jawabanTks, jawabanTps,
    tempJawabantps, tempSoaljurnals, kumpulTps, moduls, soalFitbs, soalJurnals,
    soalMandiris, soalOpsis, soalTas, soalTks, soalTps, users,
} from "../db";
import { requirePermission, requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";

const normalizeOptions = (
    optionRows: Array<{ id: string; soalId: string; text: string }>,
    soalId: string,
    correctOptionId: string | null | undefined,
) =>
    optionRows
        .filter((option) => option.soalId === soalId)
        .map((option) => ({
            id: option.id,
            text: option.text,
            is_correct: Boolean(correctOptionId) && option.id === correctOptionId,
        }));

const SUPPORTED_AUTOSAVE_TYPES = new Set(["ta", "tk", "jurnal", "fitb", "mandiri", "tm", "tp"]);
const SUPPORTED_QUESTION_SNAPSHOT_TYPES = new Set(["ta", "tk", "mandiri"]);

export function registerJawabanRoutes(app: Hono<AppBindings>) {
    app.get("/api/autosave", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const modulId = c.req.query("modul_id");
        const tipeSoal = c.req.query("tipe_soal");

        let rows = await db.select().from(autosaveSnapshots).where(eq(autosaveSnapshots.praktikanId, user.id));
        if (modulId) {
            rows = rows.filter((row) => row.modulId === modulId);
        }
        if (tipeSoal) {
            rows = rows.filter((row) => row.tipeSoal === tipeSoal);
        }

        return c.json({
            success: true,
            data: rows.map((row) => ({
                praktikan_id: row.praktikanId,
                modul_id: row.modulId,
                tipe_soal: row.tipeSoal,
                jawaban: (() => {
                    try {
                        return JSON.parse(row.jawaban ?? "{}");
                    } catch {
                        return {};
                    }
                })(),
                created_at: row.createdAt?.toISOString?.() ?? row.createdAt,
                updated_at: row.updatedAt?.toISOString?.() ?? row.updatedAt,
            })),
        });
    }));

    app.post("/api/autosave", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const body = await c.req.json<{
            modul_id?: string;
            tipe_soal?: string;
            jawaban?: Record<string, unknown>;
        }>();

        const modulId = body?.modul_id;
        const tipeSoal = body?.tipe_soal;
        const jawaban = body?.jawaban;

        if (!modulId || !tipeSoal || !SUPPORTED_AUTOSAVE_TYPES.has(tipeSoal) || !jawaban || typeof jawaban !== "object") {
            return c.json({ success: false, message: "Payload autosave tidak valid." }, 422);
        }

        const [row] = await db.insert(autosaveSnapshots).values({
            praktikanId: user.id,
            modulId,
            tipeSoal,
            jawaban: JSON.stringify(jawaban),
        }).onConflictDoUpdate({
            target: [autosaveSnapshots.praktikanId, autosaveSnapshots.modulId, autosaveSnapshots.tipeSoal],
            set: {
                jawaban: JSON.stringify(jawaban),
                updatedAt: new Date(),
            },
        }).returning();

        return c.json({
            success: true,
            data: {
                praktikan_id: row.praktikanId,
                modul_id: row.modulId,
                tipe_soal: row.tipeSoal,
                jawaban,
                created_at: row.createdAt?.toISOString?.() ?? row.createdAt,
                updated_at: row.updatedAt?.toISOString?.() ?? row.updatedAt,
            },
        });
    }));

    app.delete("/api/autosave", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const body = await c.req.json<{ modul_id?: string; tipe_soal?: string }>();
        const modulId = body?.modul_id;
        const tipeSoal = body?.tipe_soal;

        if (!modulId) {
            return c.json({ success: false, message: "modul_id wajib diisi." }, 422);
        }

        if (tipeSoal) {
            await db.delete(autosaveSnapshots).where(and(
                eq(autosaveSnapshots.praktikanId, user.id),
                eq(autosaveSnapshots.modulId, modulId),
                eq(autosaveSnapshots.tipeSoal, tipeSoal),
            ));
            return c.json({ success: true, deleted: 1 });
        }

        await db.delete(autosaveSnapshots).where(and(
            eq(autosaveSnapshots.praktikanId, user.id),
            eq(autosaveSnapshots.modulId, modulId),
        ));
        return c.json({ success: true, deleted: 1 });
    }));

    app.get("/api/autosave/questions", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const modulId = c.req.query("modul_id");
        const tipeSoal = c.req.query("tipe_soal");

        if (!modulId || !tipeSoal || !SUPPORTED_QUESTION_SNAPSHOT_TYPES.has(tipeSoal)) {
            return c.json({ success: false, message: "Parameter autosave questions tidak valid." }, 422);
        }

        const snapshot = await db.select().from(autosaveQuestionSnapshots).where(and(
            eq(autosaveQuestionSnapshots.praktikanId, user.id),
            eq(autosaveQuestionSnapshots.modulId, modulId),
            eq(autosaveQuestionSnapshots.tipeSoal, tipeSoal),
        )).get();

        if (!snapshot) {
            return c.json({ success: true, question_ids: [], has_stored_questions: false });
        }

        return c.json({
            success: true,
            question_ids: (() => {
                try {
                    return JSON.parse(snapshot.questionIds ?? "[]");
                } catch {
                    return [];
                }
            })(),
            has_stored_questions: true,
            created_at: snapshot.createdAt?.toISOString?.() ?? snapshot.createdAt,
        });
    }));

    app.post("/api/autosave/questions", requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const body = await c.req.json<{
            modul_id?: string;
            tipe_soal?: string;
            question_ids?: Array<string | number>;
        }>();

        const modulId = body?.modul_id;
        const tipeSoal = body?.tipe_soal;
        const questionIds = Array.isArray(body?.question_ids) ? body.question_ids : [];

        if (!modulId || !tipeSoal || !SUPPORTED_QUESTION_SNAPSHOT_TYPES.has(tipeSoal) || questionIds.length === 0) {
            return c.json({ success: false, message: "Payload question snapshot tidak valid." }, 422);
        }

        const existing = await db.select().from(autosaveQuestionSnapshots).where(and(
            eq(autosaveQuestionSnapshots.praktikanId, user.id),
            eq(autosaveQuestionSnapshots.modulId, modulId),
            eq(autosaveQuestionSnapshots.tipeSoal, tipeSoal),
        )).get();

        if (existing) {
            return c.json({
                success: true,
                question_ids: (() => {
                    try {
                        return JSON.parse(existing.questionIds ?? "[]");
                    } catch {
                        return [];
                    }
                })(),
                created_at: existing.createdAt?.toISOString?.() ?? existing.createdAt,
                message: "Question IDs already stored.",
            });
        }

        await db.insert(autosaveQuestionSnapshots).values({
            praktikanId: user.id,
            modulId,
            tipeSoal,
            questionIds: JSON.stringify(questionIds),
        });

        return c.json({
            success: true,
            question_ids: questionIds,
            message: "Question IDs stored successfully.",
        });
    }));

    // ── FITB ──────────────────────────────────────────────────────────────
    app.get("/api/jawaban/fitb", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        let q = db.select().from(jawabanFitbs);
        if (modulId) q = q.where(eq(jawabanFitbs.modulId, modulId)) as typeof q;
        return c.json(await q);
    }));
    app.get("/api/jawaban/fitb/praktikan/:praktikanId/modul/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalFitbs).where(eq(soalFitbs.modulId, modulId));
        const answers = await db.select().from(jawabanFitbs).where(and(
            eq(jawabanFitbs.praktikanId, praktikanId),
            eq(jawabanFitbs.modulId, modulId),
        ));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row]));

        return c.json({
            success: true,
            jawaban_fitb: questions.map((question) => ({
                soal_id: question.id,
                soal_text: question.soal,
                jawaban: answerMap.get(String(question.id))?.jawaban ?? "-",
            })),
        });
    }));
    app.get("/api/jawaban/fitb/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const answers = await db.select().from(jawabanFitbs).where(and(
            eq(jawabanFitbs.praktikanId, user.id),
            eq(jawabanFitbs.modulId, modulId),
        ));
        return c.json({
            status: "success",
            message: "Jawaban berhasil diambil.",
            jawaban_fitb: answers,
        });
    }));
    app.post("/api/jawaban/fitb", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const submissions = Array.isArray(body) ? body : [body];
        const results = [];
        for (const submission of submissions) {
            const [r] = await db.insert(jawabanFitbs).values({
                ...submission,
                praktikanId: user.id,
                soalId: submission.soal_id ?? submission.soalId,
                modulId: submission.modul_id ?? submission.modulId,
            }).returning();
            results.push(r);
        }
        return c.json(Array.isArray(body) ? results : results[0], 201);
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
    app.get("/api/jawaban/jurnal/praktikan/:praktikanId/modul/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalJurnals).where(eq(soalJurnals.modulId, modulId));
        const answers = await db.select().from(jawabanJurnals).where(and(
            eq(jawabanJurnals.praktikanId, praktikanId),
            eq(jawabanJurnals.modulId, modulId),
        ));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row]));

        return c.json({
            success: true,
            jawaban_jurnal: questions.map((question) => {
                const answer = answerMap.get(String(question.id));
                return {
                    soal_id: question.id,
                    soal_text: question.soal,
                    jawaban: answer?.jawaban ?? "-",
                    attachment_url: answer?.fileUrl ?? null,
                    attachment_file_id: answer?.fileName ?? null,
                };
            }),
        });
    }));
    app.get("/api/jawaban/jurnal/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const answers = await db.select().from(jawabanJurnals).where(and(
            eq(jawabanJurnals.praktikanId, user.id),
            eq(jawabanJurnals.modulId, modulId),
        ));
        return c.json({
            status: "success",
            message: "Jawaban Jurnal Berhasil diambil",
            jawaban_jurnal: answers,
        });
    }));
    app.post("/api/jawaban/jurnal", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const submissions = Array.isArray(body) ? body : [body];
        const results = [];
        for (const submission of submissions) {
            const [r] = await db.insert(jawabanJurnals).values({
                ...submission,
                praktikanId: user.id,
                soalId: submission.soal_id ?? submission.soalId,
                modulId: submission.modul_id ?? submission.modulId,
            }).returning();
            results.push(r);
        }
        return c.json(Array.isArray(body) ? results : results[0], 201);
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
    app.get("/api/jawaban/mandiri/praktikan/:praktikanId/modul/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalMandiris).where(eq(soalMandiris.modulId, modulId));
        const answers = await db.select().from(jawabanMandiris).where(and(
            eq(jawabanMandiris.praktikanId, praktikanId),
            eq(jawabanMandiris.modulId, modulId),
        ));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row]));

        return c.json({
            success: true,
            jawaban_mandiri: questions.map((question) => ({
                soal_id: question.id,
                soal_text: question.soal,
                jawaban: answerMap.get(String(question.id))?.jawaban ?? "-",
            })),
        });
    }));
    app.get("/api/jawaban/mandiri/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const answers = await db.select().from(jawabanMandiris).where(and(
            eq(jawabanMandiris.praktikanId, user.id),
            eq(jawabanMandiris.modulId, modulId),
        ));
        return c.json({
            status: "success",
            jawaban_mandiri: answers,
        });
    }));
    app.post("/api/jawaban/mandiri", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const submissions = Array.isArray(body) ? body : [body];
        const results = [];
        for (const submission of submissions) {
            const [r] = await db.insert(jawabanMandiris).values({
                ...submission,
                praktikanId: user.id,
                soalId: submission.soal_id ?? submission.soalId,
                modulId: submission.modul_id ?? submission.modulId,
            }).returning();
            results.push(r);
        }
        return c.json(Array.isArray(body) ? results : results[0], 201);
    }));

    // ── TA ────────────────────────────────────────────────────────────────
    app.get("/api/jawaban/ta", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanTas).where(eq(jawabanTas.modulId, modulId)));
        return c.json(await db.select().from(jawabanTas));
    }));
    app.get("/api/jawaban/ta/praktikan/:praktikanId/modul/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTas).where(eq(soalTas.modulId, modulId));
        const answers = await db.select().from(jawabanTas).where(and(
            eq(jawabanTas.praktikanId, praktikanId),
            eq(jawabanTas.modulId, modulId),
        ));
        const optionRows = await db.select().from(soalOpsis).where(eq(soalOpsis.soalType, "ta"));
        const questionMap = new Map(questions.map((row) => [String(row.id), row]));

        return c.json({
            success: true,
            jawaban_ta: answers.map((answer) => {
                const question = questionMap.get(String(answer.soalId));
                return {
                    soal_id: answer.soalId,
                    pertanyaan: question?.soal ?? null,
                    selected_opsi_id: answer.opsiId,
                    opsi_benar_id: question?.opsiBenarId ?? null,
                    options: normalizeOptions(optionRows, String(answer.soalId), question?.opsiBenarId),
                };
            }),
        });
    }));
    app.get("/api/jawaban/ta/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTas).where(eq(soalTas.modulId, modulId));
        const answers = await db.select().from(jawabanTas).where(and(
            eq(jawabanTas.praktikanId, user.id),
            eq(jawabanTas.modulId, modulId),
        ));
        const optionRows = await db.select().from(soalOpsis).where(eq(soalOpsis.soalType, "ta"));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row]));

        return c.json({
            status: "success",
            jawaban_ta: questions.map((question) => {
                const answer = answerMap.get(String(question.id));
                return {
                    soal_id: question.id,
                    pertanyaan: question.soal,
                    selected_opsi_id: answer?.opsiId ?? null,
                    opsi_benar_id: question.opsiBenarId,
                    options: normalizeOptions(optionRows, String(question.id), question.opsiBenarId),
                };
            }),
        });
    }));
    app.post("/api/jawaban/ta", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const answers = Array.isArray(body?.answers) ? body.answers : Array.isArray(body) ? body : [body];
        const modulId = body?.modul_id ?? body?.modulId ?? null;
        const results = [];
        for (const answer of answers) {
            const [r] = await db.insert(jawabanTas).values({
                praktikanId: user.id,
                soalId: answer.soal_id ?? answer.soalId,
                modulId: modulId ?? answer.modul_id ?? answer.modulId,
                opsiId: answer.opsi_id ?? answer.opsiId,
            })
                .onConflictDoUpdate({
                    target: [jawabanTas.soalId, jawabanTas.praktikanId],
                    set: { opsiId: answer.opsi_id ?? answer.opsiId, modulId: modulId ?? answer.modul_id ?? answer.modulId },
                })
                .returning();
            results.push(r);
        }
        return c.json(Array.isArray(body?.answers) || Array.isArray(body) ? results : results[0], 201);
    }));

    // ── TK ────────────────────────────────────────────────────────────────
    app.get("/api/jawaban/tk", requireSession(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(jawabanTks).where(eq(jawabanTks.modulId, modulId)));
        return c.json(await db.select().from(jawabanTks));
    }));
    app.get("/api/jawaban/tk/praktikan/:praktikanId/modul/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTks).where(eq(soalTks.modulId, modulId));
        const answers = await db.select().from(jawabanTks).where(and(
            eq(jawabanTks.praktikanId, praktikanId),
            eq(jawabanTks.modulId, modulId),
        ));
        const optionRows = await db.select().from(soalOpsis).where(eq(soalOpsis.soalType, "tk"));
        const questionMap = new Map(questions.map((row) => [String(row.id), row]));

        return c.json({
            success: true,
            jawaban_tk: answers.map((answer) => {
                const question = questionMap.get(String(answer.soalId));
                return {
                    soal_id: answer.soalId,
                    pertanyaan: question?.soal ?? null,
                    selected_opsi_id: answer.opsiId,
                    opsi_benar_id: question?.opsiId ?? null,
                    options: normalizeOptions(optionRows, String(answer.soalId), question?.opsiId),
                };
            }),
        });
    }));
    app.get("/api/jawaban/tk/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTks).where(eq(soalTks.modulId, modulId));
        const answers = await db.select().from(jawabanTks).where(and(
            eq(jawabanTks.praktikanId, user.id),
            eq(jawabanTks.modulId, modulId),
        ));
        const optionRows = await db.select().from(soalOpsis).where(eq(soalOpsis.soalType, "tk"));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row]));

        return c.json({
            status: "success",
            jawaban_tk: questions.map((question) => {
                const answer = answerMap.get(String(question.id));
                return {
                    soal_id: question.id,
                    pertanyaan: question.soal,
                    selected_opsi_id: answer?.opsiId ?? null,
                    opsi_benar_id: question.opsiId,
                    options: normalizeOptions(optionRows, String(question.id), question.opsiId),
                };
            }),
        });
    }));
    app.post("/api/jawaban/tk", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const answers = Array.isArray(body?.answers) ? body.answers : Array.isArray(body) ? body : [body];
        const modulId = body?.modul_id ?? body?.modulId ?? null;
        const results = [];
        for (const answer of answers) {
            const [r] = await db.insert(jawabanTks).values({
                praktikanId: user.id,
                soalId: answer.soal_id ?? answer.soalId,
                modulId: modulId ?? answer.modul_id ?? answer.modulId,
                opsiId: answer.opsi_id ?? answer.opsiId,
            })
                .onConflictDoUpdate({
                    target: [jawabanTks.soalId, jawabanTks.praktikanId],
                    set: { opsiId: answer.opsi_id ?? answer.opsiId, modulId: modulId ?? answer.modul_id ?? answer.modulId },
                })
                .returning();
            results.push(r);
        }
        return c.json(Array.isArray(body?.answers) || Array.isArray(body) ? results : results[0], 201);
    }));

    app.get("/api/nilai-ta/:praktikanId/:modulId", requireSession(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTas).where(eq(soalTas.modulId, modulId));
        const answers = await db.select().from(jawabanTas).where(and(
            eq(jawabanTas.praktikanId, praktikanId),
            eq(jawabanTas.modulId, modulId),
        ));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row.opsiId]));
        const totalQuestions = questions.length;
        const correctAnswers = questions.filter((question) => answerMap.get(String(question.id)) === question.opsiBenarId).length;
        const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        return c.json({ total_questions: totalQuestions, correct_answers: correctAnswers, score });
    }));

    app.get("/api/nilai-tk/:praktikanId/:modulId", requireSession(async c => {
        const db = getDb(c.env);
        const praktikanId = c.req.param("praktikanId")!;
        const modulId = c.req.param("modulId")!;
        const questions = await db.select().from(soalTks).where(eq(soalTks.modulId, modulId));
        const answers = await db.select().from(jawabanTks).where(and(
            eq(jawabanTks.praktikanId, praktikanId),
            eq(jawabanTks.modulId, modulId),
        ));
        const answerMap = new Map(answers.map((row) => [String(row.soalId), row.opsiId]));
        const totalQuestions = questions.length;
        const correctAnswers = questions.filter((question) => answerMap.get(String(question.id)) === question.opsiId).length;
        const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        return c.json({ total_questions: totalQuestions, correct_answers: correctAnswers, score });
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
    app.get("/api/jawaban/tp/by-nim/:nim/:modulId", requirePermission("nilai-praktikan")(async c => {
        const db = getDb(c.env);
        const nim = c.req.param("nim")!;
        const modulId = c.req.param("modulId")!;
        const praktikan = await db.select().from(users).where(eq(users.nim, nim)).get();
        if (!praktikan) {
            return c.json({ success: false, message: "Praktikan tidak ditemukan" }, 404);
        }

        const modul = await db.select().from(moduls).where(eq(moduls.id, modulId)).get();
        if (!modul) {
            return c.json({ success: false, message: "Modul tidak ditemukan" }, 404);
        }

        const soalList = await db.select().from(soalTps).where(eq(soalTps.modulId, modulId));
        if (soalList.length === 0) {
            return c.json({ success: false, message: "Tidak ada soal untuk modul ini" }, 404);
        }

        const jawabanList = await db.select().from(jawabanTps).where(and(
            eq(jawabanTps.praktikanId, praktikan.id),
            eq(jawabanTps.modulId, modulId),
        ));
        const jawabanMap = new Map(jawabanList.map((row) => [String(row.soalId), row.jawaban]));

        return c.json({
            success: true,
            data: {
                jawabanData: soalList.map((soal) => ({
                    soal_id: soal.id,
                    soal_text: soal.soal,
                    jawaban: jawabanMap.get(String(soal.id)) ?? "-",
                })),
                praktikan: {
                    id: praktikan.id,
                    nim: praktikan.nim,
                    nama: praktikan.name,
                    name: praktikan.name,
                },
                modul: {
                    id: modul.id,
                    judul: modul.nama,
                    nama: modul.nama,
                },
            },
        });
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

    app.get("/api/jawaban/tp/:modulId", requirePraktikan(async c => {
        const user = c.get("user")!;
        const db = getDb(c.env);
        const modulId = c.req.param("modulId")!;
        const answers = await db.select().from(jawabanTps).where(and(
            eq(jawabanTps.praktikanId, user.id),
            eq(jawabanTps.modulId, modulId),
        ));
        return c.json({
            status: "success",
            jawaban_tp: answers,
        });
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
