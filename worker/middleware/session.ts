import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "../utils";
import { sessions, users } from "../db";
import type { AppBindings, User } from "../types";

type Handler = (c: Context<AppBindings>) => Promise<Response> | Response;

export const sessionMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
    const sessionId = getCookie(c, "session");

    if (sessionId) {
        try {
            const db = getDb(c.env);
            const row = await db
                .select()
                .from(sessions)
                .innerJoin(users, eq(sessions.userId, users.id))
                .where(
                    and(
                        eq(sessions.id, sessionId),
                        gt(sessions.expiresAt, new Date()),
                    ),
                )
                .get();

            if (row) {
                c.set("user", row.users);
                c.set("session", row.sessions);
            } else {
                c.set("user", null);
                c.set("session", null);
            }
        } catch (error) {
            console.error("Failed to load session", error);
            c.set("user", null);
            c.set("session", null);
        }
    } else {
        c.set("user", null);
        c.set("session", null);
    }

    await next();
};

export const requireSession = (handler: Handler) => async (c: Context<AppBindings>) => {
    if (!c.get("user")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    return handler(c);
};

export const requireAsisten = (handler: Handler) =>
    requireSession(async c => {
        if (c.get("user")?.userType !== "asisten") {
            return c.json({ error: "Forbidden" }, 403);
        }
        return handler(c);
    });

export const requirePraktikan = (handler: Handler) =>
    requireSession(async c => {
        if (c.get("user")?.userType !== "praktikan") {
            return c.json({ error: "Forbidden" }, 403);
        }
        return handler(c);
    });

export const requirePermission = (permission: string) => (handler: Handler) =>
    requireSession(async c => {
        const user = c.get("user") as User;
        let perms: string[] = [];
        try {
            perms = JSON.parse(user.permissions) as string[];
        } catch {
            perms = [];
        }
        if (!perms.includes(permission)) {
            return c.json({ error: "Forbidden" }, 403);
        }
        return handler(c);
    });
