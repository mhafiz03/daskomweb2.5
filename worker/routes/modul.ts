import type { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../utils";
import { moduls, resources } from "../db";
import { requirePermission, requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

const parseUnlockConfig = (value: unknown) => {
    if (!value) {
        return {};
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }

    return typeof value === "object" ? value : {};
};

const toLegacyModule = (modul: typeof moduls.$inferSelect, resource?: typeof resources.$inferSelect | null) => {
    const unlockConfig = parseUnlockConfig(modul.unlockConfig);

    return {
        ...modul,
        idM: modul.id,
        judul: modul.nama,
        deskripsi: typeof unlockConfig.deskripsi === "string" ? unlockConfig.deskripsi : "",
        unlock_config: unlockConfig,
        modul_link: resource?.modulLink ?? "",
        ppt_link: resource?.pptLink ?? "",
        video_link: resource?.videoLink ?? "",
    };
};

const normalizeModulePayload = (body: Record<string, unknown>) => {
    const unlockConfig = parseUnlockConfig(body.unlock_config ?? body.unlockConfig);
    const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi : "";

    return {
        modulValues: {
            nama: String(body.judul ?? body.nama ?? "").trim(),
            isEnglish: Boolean(Number(body.isEnglish ?? body.is_english ?? 0)),
            isUnlocked: Boolean(Number(body.isUnlocked ?? body.is_unlocked ?? 0)),
            unlockConfig: JSON.stringify({
                ...unlockConfig,
                deskripsi,
            }),
        },
        resourceValues: {
            modulLink: String(body.modul_link ?? body.modulLink ?? "").trim(),
            pptLink: String(body.ppt_link ?? body.pptLink ?? "").trim(),
            videoLink: String(body.video_link ?? body.videoLink ?? "").trim(),
        },
    };
};

export function registerModulRoutes(app: Hono<AppBindings>) {
    app.get("/api/moduls", requireSession(async c => {
        const db = getDb(c.env);
        const modulRows = await db.select().from(moduls);

        if (modulRows.length === 0) {
            return c.json([]);
        }

        const resourceRows = await db.select().from(resources).where(inArray(resources.modulId, modulRows.map((row) => row.id)));
        const resourceMap = new Map(resourceRows.map((row) => [row.modulId, row]));

        return c.json(modulRows.map((row) => toLegacyModule(row, resourceMap.get(row.id) ?? null)));
    }));

    app.get("/api/moduls/:id", requireSession(async c => {
        const db = getDb(c.env);
        const id = c.req.param("id")!;
        const [modulRow, resourceRow] = await Promise.all([
            db.select().from(moduls).where(eq(moduls.id, id)).get(),
            db.select().from(resources).where(eq(resources.modulId, id)).get(),
        ]);

        if (!modulRow) {
            return c.json({ message: "Modul tidak ditemukan." }, 404);
        }

        return c.json({
            data: toLegacyModule(modulRow, resourceRow ?? null),
        });
    }));

    app.post("/api/moduls", requirePermission("manage-modul")(async c => {
        const body = await c.req.json<Record<string, unknown>>();
        const db = getDb(c.env);
        const { modulValues, resourceValues } = normalizeModulePayload(body);

        const [createdModul] = await db.insert(moduls).values(modulValues).returning();
        const [createdResource] = await db.insert(resources).values({
            modulId: createdModul.id,
            ...resourceValues,
        }).returning();

        return c.json({
            message: "Modul berhasil ditambahkan.",
            data: toLegacyModule(createdModul, createdResource),
        }, 201);
    }));

    app.patch("/api/moduls/:id", requirePermission("manage-modul")(async c => {
        const body = await c.req.json<Record<string, unknown>>();
        const db = getDb(c.env);
        const id = c.req.param("id")!;
        const { modulValues, resourceValues } = normalizeModulePayload(body);

        const [updatedModul] = await db.update(moduls).set(modulValues).where(eq(moduls.id, id)).returning();

        if (!updatedModul) {
            return c.json({ message: "Modul tidak ditemukan." }, 404);
        }

        const existingResource = await db.select().from(resources).where(eq(resources.modulId, id)).get();
        const updatedResource = existingResource
            ? (await db.update(resources).set(resourceValues).where(eq(resources.modulId, id)).returning())[0]
            : (await db.insert(resources).values({ modulId: id, ...resourceValues }).returning())[0];

        return c.json({
            message: "Modul berhasil diperbarui.",
            data: toLegacyModule(updatedModul, updatedResource),
        });
    }));

    app.delete("/api/moduls/:id", requirePermission("manage-modul")(async c => {
        const db = getDb(c.env);
        await db.delete(moduls).where(eq(moduls.id, c.req.param("id")!));
        return c.json({ ok: true, message: "Modul berhasil dihapus." });
    }));

    app.post("/api/moduls/:id/unlock", requirePermission("unlock-jawaban")(async c => {
        const db = getDb(c.env);
        const existing = await db.select().from(moduls).where(eq(moduls.id, c.req.param("id")!)).get();

        if (!existing) {
            return c.json({ message: "Modul tidak ditemukan." }, 404);
        }

        const unlockConfig = parseUnlockConfig(existing.unlockConfig);

        await db.update(moduls)
            .set({
                isUnlocked: true,
                unlockConfig: JSON.stringify(unlockConfig),
            })
            .where(eq(moduls.id, c.req.param("id")!));

        return c.json({ ok: true });
    }));

    app.get("/api/moduls/:id/resources", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(resources).where(eq(resources.modulId, c.req.param("id")!)).get();
        return c.json(row ? [row] : []);
    }));

    app.put("/api/moduls/:id/resources", requirePermission("manage-modul")(async c => {
        const body = await c.req.json<Record<string, unknown>>();
        const db = getDb(c.env);
        const id = c.req.param("id")!;
        const resourceValues = {
            modulLink: String(body.modul_link ?? body.modulLink ?? "").trim(),
            pptLink: String(body.ppt_link ?? body.pptLink ?? "").trim(),
            videoLink: String(body.video_link ?? body.videoLink ?? "").trim(),
        };
        const existing = await db.select().from(resources).where(eq(resources.modulId, id)).get();

        if (existing) {
            const [updated] = await db.update(resources).set(resourceValues).where(eq(resources.modulId, id)).returning();
            return c.json(updated);
        }

        const [created] = await db.insert(resources).values({ modulId: id, ...resourceValues }).returning();
        return c.json(created, 201);
    }));
}
