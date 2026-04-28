import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../utils";
import { roles } from "../db";
import { requirePermission } from "../middleware/session";
import {
    listAvailableRoles,
    mergePermissionPackages,
    normalizeRoleName,
    resolveRoleDefinition,
} from "../lib/roles";
import type { AppBindings } from "../types";

export function registerRoleRoutes(app: Hono<AppBindings>) {
    app.get("/api/roles", async c => {
        const user = c.get("user");
        const db = getDb(c.env);
        const includeRestricted = user?.userType === "asisten";
        const data = await listAvailableRoles(db, includeRestricted);
        return c.json({ roles: data });
    });

    app.post("/api/roles", requirePermission("manage-role")(async c => {
        const body = await c.req.json<{ name?: string; paket?: string[] }>();
        const roleName = typeof body.name === "string" ? normalizeRoleName(body.name) : "";
        const paket = Array.isArray(body.paket)
            ? body.paket.filter((item): item is string => typeof item === "string")
            : [];

        if (!roleName) {
            return c.json({ error: "Nama role wajib diisi" }, 400);
        }

        if (paket.length === 0) {
            return c.json({ error: "Pilih minimal satu paket" }, 400);
        }

        const permissions = mergePermissionPackages(paket);
        if (permissions.length === 0) {
            return c.json({ error: "Paket role tidak valid" }, 400);
        }

        const db = getDb(c.env);
        const existingRole = await resolveRoleDefinition(db, roleName);
        if (existingRole) {
            return c.json({ error: "Nama role sudah digunakan" }, 409);
        }

        const [created] = await db.insert(roles).values({
            name: roleName,
            permissions: JSON.stringify(permissions),
            paket: JSON.stringify(Array.from(new Set(paket))),
            guardName: "asisten",
        }).returning();

        return c.json({
            role: {
                id: created!.id,
                name: created!.name,
                permissions,
                paket,
                guard_name: created!.guardName,
                is_system: false,
            },
        }, 201);
    }));

    app.put("/api/roles/:id", requirePermission("manage-role")(async c => {
        const roleId = c.req.param("id");
        if (!roleId) {
            return c.json({ error: "Role tidak ditemukan" }, 404);
        }
        const body = await c.req.json<{ name?: string; paket?: string[] }>();
        const roleName = typeof body.name === "string" ? normalizeRoleName(body.name) : "";
        const paket = Array.isArray(body.paket)
            ? body.paket.filter((item): item is string => typeof item === "string")
            : [];

        if (!roleName) {
            return c.json({ error: "Nama role wajib diisi" }, 400);
        }

        if (paket.length === 0) {
            return c.json({ error: "Pilih minimal satu paket" }, 400);
        }

        const permissions = mergePermissionPackages(paket);
        if (permissions.length === 0) {
            return c.json({ error: "Paket role tidak valid" }, 400);
        }

        const db = getDb(c.env);
        const duplicate = await db.select().from(roles).where(eq(roles.name, roleName)).get();
        if (duplicate && duplicate.id !== roleId) {
            return c.json({ error: "Nama role sudah digunakan" }, 409);
        }

        const [updated] = await db.update(roles).set({
            name: roleName,
            permissions: JSON.stringify(permissions),
            paket: JSON.stringify(Array.from(new Set(paket))),
        }).where(eq(roles.id, roleId)).returning();

        if (!updated) {
            return c.json({ error: "Role tidak ditemukan" }, 404);
        }

        return c.json({
            role: {
                id: updated.id,
                name: updated.name,
                permissions,
                paket,
                guard_name: updated.guardName,
                is_system: false,
            },
        });
    }));
}
