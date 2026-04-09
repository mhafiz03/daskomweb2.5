import type { Hono } from "hono";
import { createImageKitSignature } from "../utils";
import { requireSession } from "../middleware/session";
import type { AppBindings } from "../types";

export function registerImageKitRoutes(app: Hono<AppBindings>) {
    app.get("/api/imagekit/auth", requireSession(async c => {
        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const signature = await createImageKitSignature(c.env.IMAGEKIT_PRIVATE_KEY, token, expire);
        return c.json({ token, expire, signature });
    }));
}
