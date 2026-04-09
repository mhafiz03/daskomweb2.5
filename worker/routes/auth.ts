import type { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { eq, and } from "drizzle-orm";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { getDb } from "../utils";
import { users, sessions } from "../db";
import { requireSession } from "../middleware/session";
import type { AppBindings } from "../types";
import { PRAKTIKAN_PERMISSIONS, normalizeRoleName, resolveRoleDefinition } from "../lib/roles";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hexToBytes = (hex: string): Uint8Array => {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return arr;
};

const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

export const hashPassword = (password: string, salt: string): string => {
    const key = pbkdf2(sha256, password, salt, { c: 100_000, dkLen: 32 });
    return `${salt}:${bytesToHex(key)}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const expected = bytesToHex(pbkdf2(sha256, password, salt, { c: 100_000, dkLen: 32 }));
    // Constant-time comparison
    const a = hexToBytes(expected);
    const b = hexToBytes(hash);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
    return diff === 0;
};

export const generateSalt = (): string =>
    bytesToHex(crypto.getRandomValues(new Uint8Array(16)));

export function registerAuthRoutes(app: Hono<AppBindings>) {
    // Login
    app.post("/api/auth/login", async c => {
        const { identifier, password, userType } = await c.req.json<{
            identifier: string;
            password: string;
            userType: "asisten" | "praktikan";
        }>();

        if (!identifier || !password || !userType) {
            return c.json({ error: "identifier, password and userType are required" }, 400);
        }

        const db = getDb(c.env);
        const [user] = await db
            .select()
            .from(users)
            .where(and(eq(users.identifier, identifier), eq(users.userType, userType)))
            .limit(1);

        if (!user || !verifyPassword(password, user.passwordHash)) {
            return c.json({ error: "Invalid credentials" }, 401);
        }

        // Create session
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

        await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt });

        setCookie(c, "session", sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            path: "/",
            expires: expiresAt,
        });

        const { passwordHash: _, ...safeUser } = user;
        return c.json({ user: safeUser });
    });

    // Logout
    app.post("/api/auth/logout", requireSession(async c => {
        const session = c.get("session");
        if (session) {
            const db = getDb(c.env);
            await db.delete(sessions).where(eq(sessions.id, session.id));
        }
        deleteCookie(c, "session", { path: "/" });
        return c.json({ ok: true });
    }));

    // Current user
    app.get("/api/auth/me", requireSession(async c => {
        const user = c.get("user")!;
        const { passwordHash: _, ...safeUser } = user;
        return c.json({ user: safeUser });
    }));

    // Change password
    app.post("/api/auth/change-password", requireSession(async c => {
        const user = c.get("user")!;
        const { currentPassword, newPassword } = await c.req.json<{
            currentPassword: string;
            newPassword: string;
        }>();

        if (!verifyPassword(currentPassword, user.passwordHash)) {
            return c.json({ error: "Current password is incorrect" }, 400);
        }

        const salt = generateSalt();
        const passwordHash = hashPassword(newPassword, salt);

        const db = getDb(c.env);
        await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

        return c.json({ ok: true });
    }));

    // Register praktikan (protected: asisten with 'praktikan-regist' permission)
    app.post("/api/auth/register/praktikan", async c => {
        const user = c.get("user");
        const perms: string[] = user ? JSON.parse(user.permissions) : [];
        if (!user || user.userType !== "asisten" || !perms.includes("praktikan-regist")) {
            return c.json({ error: "Forbidden" }, 403);
        }

        const body = await c.req.json<{
            nama: string;
            nim: string;
            password: string;
            kelasId: string;
            alamat: string;
            nomorTelepon: string;
            email: string;
            dk: string;
        }>();

        const salt = generateSalt();
        const passwordHash = hashPassword(body.password, salt);

        const db = getDb(c.env);
        const [created] = await db.insert(users).values({
            identifier: body.nim,
            passwordHash,
            userType: "praktikan",
            permissions: JSON.stringify(PRAKTIKAN_PERMISSIONS),
            name: body.nama,
            nim: body.nim,
            kelasId: body.kelasId,
            alamat: body.alamat,
            nomorTelepon: body.nomorTelepon,
            email: body.email,
            dk: body.dk,
        }).returning();

        const { passwordHash: _, ...safeUser } = created!;
        return c.json({ user: safeUser }, 201);
    });

    // Register asisten (protected: KORDAS only)
    app.post("/api/auth/register/asisten", async c => {
        const user = c.get("user");
        const perms: string[] = user ? JSON.parse(user.permissions) : [];
        if (!user || user.userType !== "asisten" || !perms.includes("manage-role")) {
            return c.json({ error: "Forbidden" }, 403);
        }

        const body = await c.req.json<{
            nama: string;
            kode: string;
            password: string;
            asistenRole: string;
            deskripsi?: string;
            nomorTelepon?: string;
            idLine?: string;
            instagram?: string;
        }>();

        const salt = generateSalt();
        const passwordHash = hashPassword(body.password, salt);

        const db = getDb(c.env);
        const roleDefinition = await resolveRoleDefinition(db, body.asistenRole);
        if (!roleDefinition) {
            return c.json({ error: "Role tidak valid" }, 400);
        }

        const [created] = await db.insert(users).values({
            identifier: body.kode,
            passwordHash,
            userType: "asisten",
            permissions: JSON.stringify(roleDefinition.permissions),
            name: body.nama,
            kode: body.kode,
            asistenRole: roleDefinition.name,
            deskripsi: body.deskripsi,
            nomorTelepon: body.nomorTelepon,
            idLine: body.idLine,
            instagram: body.instagram,
        }).returning();

        const { passwordHash: _, ...safeUser } = created!;
        return c.json({ user: safeUser }, 201);
    });

    // Update asisten role (recalculates permissions)
    app.patch("/api/auth/asisten/:id/role", async c => {
        const user = c.get("user");
        const perms: string[] = user ? JSON.parse(user.permissions) : [];
        if (!user || user.userType !== "asisten" || !perms.includes("manage-role")) {
            return c.json({ error: "Forbidden" }, 403);
        }

        const db = getDb(c.env);
        const { role } = await c.req.json<{ role: string }>();
        const roleDefinition = await resolveRoleDefinition(db, role);
        if (!roleDefinition) {
            return c.json({ error: "Role tidak valid" }, 400);
        }

        await db.update(users)
            .set({
                asistenRole: normalizeRoleName(roleDefinition.name),
                permissions: JSON.stringify(roleDefinition.permissions),
            })
            .where(eq(users.id, c.req.param("id")));

        return c.json({ ok: true });
    });
}
