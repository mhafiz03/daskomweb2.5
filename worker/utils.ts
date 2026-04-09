import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db";
import type { AppBindings } from "./types";

export const getDb = (env: AppBindings["Bindings"]) => drizzle(env.DB, { schema });

export const buildCorsMiddleware = (origins: string[]) =>
    cors({
        origin: origins,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    });

export const parseOrigins = (value?: string) =>
    value?.split(",").map(o => o.trim()).filter(Boolean) ?? ["http://localhost:5173"];

const encoder = new TextEncoder();

export const createImageKitSignature = async (privateKey: string, token: string, expire: number) => {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(privateKey),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"],
    );
    const data = encoder.encode(token + expire);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
    return Array.from(new Uint8Array(signatureBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
};
