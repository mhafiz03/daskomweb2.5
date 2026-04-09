/**
 * Seed script: create the initial KORDAS asisten account
 * Usage: bun run seed:admin
 *
 * Requires local D1 to be initialized first:
 *   bun run db:migrate:dev
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import * as fs from "node:fs";
import * as path from "node:path";
import * as schema from "../worker/db/schema";

const KORDAS_PERMISSIONS = [
    "manage-role", "manage-praktikum", "laporan-praktikum", "manage-plot",
    "manage-pelanggaran", "manage-modul", "manage-soal", "unlock-jawaban",
    "tugas-pendahuluan", "see-pelanggaran", "lms-configuration", "manage-profile",
    "see-praktikum", "see-history", "see-soal", "nilai-praktikan", "see-plot",
    "ranking-praktikan", "see-polling", "set-praktikan", "reset-praktikan",
    "check-tugas-pendahuluan", "change-password", "praktikan-regist",
    "tp-configuration", "logout",
];

const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

const hashPassword = (password: string, salt: string): string => {
    const key = pbkdf2(sha256, password, salt, { c: 100_000, dkLen: 32 });
    return `${salt}:${bytesToHex(key)}`;
};

const generateSalt = (): string =>
    bytesToHex(crypto.getRandomValues(new Uint8Array(16)));

// Find local D1 SQLite file
const wranglerDir = path.resolve(".wrangler");
const dbFile = fs.readdirSync(wranglerDir, { encoding: "utf-8", recursive: true })
    .find(f => f.endsWith(".sqlite"));

if (!dbFile) {
    console.error("No local D1 database found. Run: bun run db:migrate:dev");
    process.exit(1);
}

const dbPath = path.resolve(wranglerDir, dbFile);
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

// Prompt for credentials
const kode = process.env.ADMIN_KODE ?? "ADM";
const password = process.env.ADMIN_PASSWORD ?? "admin123";
const nama = process.env.ADMIN_NAMA ?? "Admin Kordas";

const salt = generateSalt();
const passwordHash = hashPassword(password, salt);

const [created] = await db.insert(schema.users).values({
    identifier: kode,
    passwordHash,
    userType: "asisten",
    permissions: JSON.stringify(KORDAS_PERMISSIONS),
    name: nama,
    kode,
    asistenRole: "KORDAS",
    deskripsi: "Initial admin account",
}).returning();

console.log(`Created asisten: ${created!.kode} (${created!.name})`);
console.log(`Login with kode: ${kode}, password: ${password}`);

sqlite.close();
