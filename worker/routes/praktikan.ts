import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { users, laporanPraktikans } from "../db";
import { requirePermission, requireSession, requirePraktikan } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerPraktikanRoutes(app: Hono<AppBindings>) {
    app.get("/api/praktikans", requirePermission("set-praktikan")(async c => {
        const db = getDb(c.env);
        void c.req.query();
        let q = db.select().from(users).where(eq(users.userType, "praktikan"));
        return c.json(await q);
    }));

    app.get("/api/praktikans/:id", requireSession(async c => {
        const db = getDb(c.env);
        const row = await db.select().from(users)
            .where(eq(users.id, c.req.param("id")!))
            .get();
        if (!row || row.userType !== "praktikan") return c.json({ error: "Not found" }, 404);
        const { passwordHash: _, ...safe } = row;
        return c.json(safe);
    }));

    app.patch("/api/praktikans/:id", requirePermission("set-praktikan")(async c => {
        const body = await c.req.json();
        const db = getDb(c.env);
        const [r] = await db.update(users).set(body).where(eq(users.id, c.req.param("id")!)).returning();
        if (!r) return c.json({ error: "Not found" }, 404);
        const { passwordHash: _, ...safe } = r;
        return c.json(safe);
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
