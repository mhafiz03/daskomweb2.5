import type { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { configurations, fotoAsistens, jenisPollings, pollings, users } from "../db";
import { requirePermission, requirePraktikan, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";
import { getDb } from "../utils";

const isTruthyConfigValue = (value: string | null | undefined) => {
    if (value == null) {
        return true;
    }

    const normalized = String(value).trim().toLowerCase();
    return !["0", "false", "off", "no"].includes(normalized);
};

export function registerPollingRoutes(app: Hono<AppBindings>) {
    app.get("/api/jenis-polling", requireSession(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const [categories, pollingConfig] = await Promise.all([
            db.select({
                id: jenisPollings.id,
                judul: jenisPollings.judul,
                createdAt: jenisPollings.createdAt,
                updatedAt: jenisPollings.updatedAt,
            })
                .from(jenisPollings)
                .orderBy(desc(jenisPollings.createdAt)),
            db.select({ value: configurations.value })
                .from(configurations)
                .where(eq(configurations.configKey, "polling_activation"))
                .get(),
        ]);

        const pollingActive = isTruthyConfigValue(pollingConfig?.value);
        const visibleCategories = user.userType === "praktikan" && !pollingActive ? [] : categories;

        return c.json({
            status: "success",
            categories: visibleCategories,
            polling_active: pollingActive,
            message: pollingActive ? "Polling categories retrieved successfully." : "Polling sedang tidak aktif.",
        });
    }));

    app.post("/api/jenis-polling", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const body = await c.req.json<{ judul?: string }>();
        const judul = body?.judul?.trim();

        if (!judul) {
            return c.json({ status: "error", message: "Judul jenis polling wajib diisi." }, 422);
        }

        const [category] = await db.insert(jenisPollings).values({ judul }).returning();
        return c.json({
            status: "success",
            message: "Jenis polling berhasil dibuat.",
            category,
        }, 201);
    }));

    app.delete("/api/jenis-polling/:id", requirePermission("manage-praktikum")(async c => {
        const db = getDb(c.env);
        const pollingId = c.req.param("id")!;
        const existing = await db.select({ id: pollings.id })
            .from(pollings)
            .where(eq(pollings.pollingId, pollingId))
            .get();

        if (existing) {
            return c.json({
                status: "error",
                message: "Jenis polling tidak dapat dihapus karena masih memiliki data polling.",
            }, 422);
        }

        await db.delete(jenisPollings).where(eq(jenisPollings.id, pollingId));
        return c.json({
            status: "success",
            message: "Jenis polling berhasil dihapus.",
        });
    }));

    app.get("/api/polling", requirePermission("see-polling")(async c => {
        const db = getDb(c.env);
        return c.json(await db.select().from(pollings).orderBy(desc(pollings.createdAt)));
    }));

    app.get("/api/polling/:id", requireSession(async c => {
        const db = getDb(c.env);
        const pollingId = c.req.param("id")!;
        const totalVotes = sql<number>`count(${pollings.id})`;
        const rows = await db.select({
            id: users.id,
            nama: users.name,
            kode: users.kode,
            total: totalVotes.as("total"),
        })
            .from(pollings)
            .innerJoin(users, eq(pollings.asistenId, users.id))
            .where(and(eq(pollings.pollingId, pollingId), eq(users.userType, "asisten")))
            .groupBy(users.id, users.name, users.kode)
            .orderBy(desc(totalVotes));

        return c.json({
            status: "success",
            polling: rows,
            message: "Poll count by assistant code retrieved successfully.",
        });
    }));

    const storePolling = requirePraktikan(async c => {
        const db = getDb(c.env);
        const user = c.get("user")!;
        const body = await c.req.json();
        const submissions = Array.isArray(body) ? body : [body];

        if (submissions.length === 0) {
            return c.json({
                status: "error",
                message: "Pilih minimal 1 asisten sebelum mengirim.",
            }, 422);
        }

        for (const submission of submissions) {
            const pollingId = submission?.polling_id ?? submission?.pollingId;
            const asistenId = submission?.asisten_id ?? submission?.asistenId;
            const kode = submission?.kode;

            if (!pollingId || (!asistenId && !kode)) {
                return c.json({ status: "error", message: "Data polling tidak lengkap." }, 422);
            }

            const asisten = await db.select({ id: users.id })
                .from(users)
                .where(
                    asistenId
                        ? and(eq(users.id, asistenId), eq(users.userType, "asisten"))
                        : and(eq(users.kode, kode), eq(users.userType, "asisten")),
                )
                .get();

            if (!asisten) {
                return c.json({ status: "error", message: "Asisten tidak ditemukan." }, 422);
            }

            const existing = await db.select({ id: pollings.id })
                .from(pollings)
                .where(and(eq(pollings.praktikanId, user.id), eq(pollings.pollingId, pollingId)))
                .get();

            if (existing) {
                await db.update(pollings)
                    .set({ asistenId: asisten.id, updatedAt: new Date() })
                    .where(eq(pollings.id, existing.id));
            } else {
                await db.insert(pollings).values({
                    pollingId,
                    asistenId: asisten.id,
                    praktikanId: user.id,
                });
            }
        }

        return c.json({
            status: "success",
            message: "All pollings submitted successfully",
        });
    });

    app.post("/api/polling", storePolling);
    app.post("/api/pollings", storePolling);

    app.get("/api/polling-assistants", requireSession(async c => {
        const db = getDb(c.env);
        const rows = await db.select({
            id: users.id,
            nama: users.name,
            kode: users.kode,
            deskripsi: users.deskripsi,
            profilePicture: users.profilePicture,
            fotoUrl: fotoAsistens.fotoUrl,
        })
            .from(users)
            .leftJoin(fotoAsistens, eq(fotoAsistens.userId, users.id))
            .where(eq(users.userType, "asisten"));

        return c.json({
            success: true,
            asisten: rows
                .map(({ fotoUrl, profilePicture, ...asisten }) => ({
                    ...asisten,
                    foto: fotoUrl ?? profilePicture ?? null,
                }))
                .filter((asisten) => asisten.kode && asisten.kode !== "BOT"),
        });
    }));
}
