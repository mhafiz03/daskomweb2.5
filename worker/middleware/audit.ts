import type { MiddlewareHandler } from "hono";
import { getDb } from "../utils";
import { auditLogs } from "../db";
import type { AppBindings } from "../types";

export const auditMiddleware = (action: string): MiddlewareHandler<AppBindings> => async (c, next) => {
    await next();

    const user = c.get("user");
    if (!user || user.userType !== "asisten") return;

    try {
        const db = getDb(c.env);
        await db.insert(auditLogs).values({
            asistenId: user.id,
            action,
            route: c.req.path,
            method: c.req.method,
            ipAddress: c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For"),
            userAgent: c.req.header("User-Agent"),
        });
    } catch (error) {
        console.error("Audit log failed", error);
    }
};
