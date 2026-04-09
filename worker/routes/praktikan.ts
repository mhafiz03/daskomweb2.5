import type { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils";
import { users, laporanPraktikans, nilais, kelas } from "../db";
import { requirePermission, requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";
import { generateSalt, hashPassword } from "./auth";

export function registerPraktikanRoutes(app: Hono<AppBindings>) {
    app.get("/api/praktikans", requirePermission("set-praktikan")(async c => {
        const db = getDb(c.env);
        const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
        const perPage = Math.min(50, Math.max(5, Number(c.req.query("per_page") ?? "15") || 15));
        const search = String(c.req.query("search") ?? "").trim().toLowerCase();
        const kelasId = String(c.req.query("kelas_id") ?? "").trim();
        const dk = String(c.req.query("dk") ?? "").trim().toUpperCase();

        const allPraktikans = (await db.select().from(users).where(eq(users.userType, "praktikan")))
            .filter((row) => {
                if (kelasId && String(row.kelasId ?? "") !== kelasId) {
                    return false;
                }

                if (dk && String(row.dk ?? "").toUpperCase() !== dk) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                return [
                    row.name,
                    row.nim,
                    row.email,
                ]
                    .filter(Boolean)
                    .map((value) => String(value).toLowerCase())
                    .some((value) => value.includes(search));
            })
            .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));

        const kelasRows = await db.select().from(kelas);
        const kelasMap = new Map(kelasRows.map((row) => [row.id, row]));
        const total = allPraktikans.length;
        const lastPage = Math.max(1, Math.ceil(total / perPage));
        const currentPage = Math.min(page, lastPage);
        const start = (currentPage - 1) * perPage;
        const pageItems = allPraktikans.slice(start, start + perPage).map((row) => {
            const { passwordHash: _, ...safe } = row;
            const kelasItem = row.kelasId ? kelasMap.get(row.kelasId) ?? null : null;

            return {
                ...safe,
                nama: row.name,
                nomor_telepon: row.nomorTelepon,
                kelas_id: row.kelasId,
                kelas: kelasItem
                    ? {
                        id: kelasItem.id,
                        nama: kelasItem.kelas,
                        kelas: kelasItem.kelas,
                        hari: kelasItem.hari,
                        shift: kelasItem.shift,
                    }
                    : null,
            };
        });

        const from = total === 0 ? 0 : start + 1;
        const to = total === 0 ? 0 : start + pageItems.length;

        return c.json({
            success: true,
            data: pageItems,
            meta: {
                current_page: currentPage,
                last_page: lastPage,
                per_page: perPage,
                total,
                from,
                to,
            },
            links: {
                prev: currentPage > 1 ? currentPage - 1 : null,
                next: currentPage < lastPage ? currentPage + 1 : null,
            },
            filters: {
                search: search || null,
                kelas_id: kelasId || null,
                dk: dk || null,
            },
        });
    }));

    app.get("/api/praktikans/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(users)
            .where(eq(users.id, c.req.param("id")!))
            .get();
        if (!row || row.userType !== "praktikan") return c.json({ error: "Not found" }, 404);
        const kelasItem = row.kelasId
            ? await db.select().from(kelas).where(eq(kelas.id, row.kelasId)).get()
            : null;
        const { passwordHash: _, ...safe } = row;
        return c.json({
            ...safe,
            nama: row.name,
            nomor_telepon: row.nomorTelepon,
            kelas_id: row.kelasId,
            kelas: kelasItem
                ? {
                    id: kelasItem.id,
                    nama: kelasItem.kelas,
                    kelas: kelasItem.kelas,
                    hari: kelasItem.hari,
                    shift: kelasItem.shift,
                }
                : null,
        });
    }));

    app.patch("/api/praktikans/:id", requirePermission("set-praktikan")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.update(users).set(body).where(eq(users.id, c.req.param("id")!)).returning();
        if (!r) return c.json({ error: "Not found" }, 404);
        const { passwordHash: _, ...safe } = r;
        return c.json({
            ...safe,
            nama: r.name,
            nomor_telepon: r.nomorTelepon,
            kelas_id: r.kelasId,
        });
    }));

    app.delete("/api/praktikans/:id", requirePermission("reset-praktikan")(async c => {
        const db = getDb(c.env);
        await db.delete(users).where(eq(users.id, c.req.param("id")!));
        return c.json({ ok: true });
    }));

    // Profile update (self)
    app.patch("/api/praktikans/me/profile", requirePraktikan(async c => {
        const user = c.get("user")!;
        const { nama, alamat, nomorTelepon, email, profilePicture } = await c.req.json<{
            nama?: string; alamat?: string; nomorTelepon?: string; email?: string; profilePicture?: string;
        }>();
        const db = getDb(c.env);
        const [r] = await db.update(users)
            .set({ name: nama, alamat, nomorTelepon, email, profilePicture })
            .where(eq(users.id, user.id))
            .returning();
        const { passwordHash: _, ...safe } = r!;
        return c.json(safe);
    }));

    app.patch("/api/praktikans/password", requirePermission("set-praktikan")(async c => {
        const { nim, password } = await c.req.json<{ nim?: string; password?: string }>();

        if (!nim || !password) {
            return c.json({ message: "nim dan password wajib diisi" }, 400);
        }

        const db = getDb(c.env);
        const praktikan = await db.select().from(users).where(eq(users.identifier, nim)).get();

        if (!praktikan || praktikan.userType !== "praktikan") {
            return c.json({ message: "Praktikan tidak ditemukan" }, 404);
        }

        const passwordHash = hashPassword(password, generateSalt());
        await db.update(users).set({ passwordHash }).where(eq(users.id, praktikan.id));

        return c.json({ ok: true, message: "Password praktikan berhasil diperbarui." });
    }));

    app.post("/api/praktikans/assign-module", requirePermission("set-praktikan")(async c => {
        const user = c.get("user")!;
        const { nim, modul_id, modulId } = await c.req.json<{ nim?: string; modul_id?: string | number; modulId?: string | number }>();
        const resolvedModulId = modul_id ?? modulId;

        if (!nim || !resolvedModulId) {
            return c.json({
                success: false,
                message: "nim dan modul_id wajib diisi",
            }, 400);
        }

        const db = getDb(c.env);
        const praktikan = await db.select().from(users)
            .where(eq(users.identifier, nim))
            .get();

        if (!praktikan || praktikan.userType !== "praktikan") {
            return c.json({
                success: false,
                message: "Praktikan with this NIM not found",
            }, 404);
        }

        const modulKey = String(resolvedModulId);
        const existingLaporan = await db.select().from(laporanPraktikans)
            .where(and(
                eq(laporanPraktikans.praktikanId, praktikan.id),
                eq(laporanPraktikans.modulId, modulKey),
            ))
            .get();

        let laporanPraktikan;
        if (existingLaporan) {
            const [updated] = await db.update(laporanPraktikans)
                .set({
                    asistenId: user.id,
                    pesan: `pulled by ${user.kode ?? user.identifier}`,
                    updatedAt: new Date(),
                })
                .where(eq(laporanPraktikans.id, existingLaporan.id))
                .returning();
            laporanPraktikan = updated ?? existingLaporan;
        } else {
            const [created] = await db.insert(laporanPraktikans)
                .values({
                    praktikanId: praktikan.id,
                    asistenId: user.id,
                    modulId: modulKey,
                    pesan: `pulled by ${user.kode ?? user.identifier}`,
                })
                .returning();
            laporanPraktikan = created;
        }

        const existingNilai = await db.select().from(nilais)
            .where(and(
                eq(nilais.praktikanId, praktikan.id),
                eq(nilais.modulId, modulKey),
            ))
            .get();

        let nilai = existingNilai ?? null;
        if (existingNilai) {
            const [updatedNilai] = await db.update(nilais)
                .set({
                    asistenId: user.id,
                    updatedAt: new Date(),
                })
                .where(eq(nilais.id, existingNilai.id))
                .returning();
            nilai = updatedNilai ?? existingNilai;
        }

        return c.json({
            success: true,
            message: "Praktikan successfully assigned to asisten",
            data: {
                laporan_praktikan: laporanPraktikan,
                nilai,
            },
        });
    }));

    // Laporan
    app.get("/api/laporan", requirePermission("laporan-praktikum")(async c => {
        const db = getDb(c.env);
        const { modulId } = c.req.query();
        if (modulId) return c.json(await db.select().from(laporanPraktikans).where(eq(laporanPraktikans.modulId, modulId)));
        return c.json(await db.select().from(laporanPraktikans));
    }));

    app.post("/api/laporan", requirePraktikan(async c => {
        const user = c.get("user")!;
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.insert(laporanPraktikans).values({ ...body, praktikanId: user.id }).returning();
        return c.json(r, 201);
    }));
}
