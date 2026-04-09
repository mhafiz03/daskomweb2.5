#!/usr/bin/env node

import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [, , inputPath, bindingArg] = process.argv;
const binding = bindingArg || process.env.D1_BINDING || "DB";

if (!inputPath || inputPath === "--help" || inputPath === "-h") {
    console.error("Usage: node scripts/import-d1-local.mjs <sql-file> [binding]");
    console.error("Example: node scripts/import-d1-local.mjs ../lms2.sql");
    console.error("Example: bun run db:import:local -- ../lms2.sql");
    process.exit(inputPath ? 0 : 1);
}

const sqlFile = resolve(process.cwd(), inputPath);

if (!existsSync(sqlFile)) {
    console.error(`SQL file not found: ${sqlFile}`);
    process.exit(1);
}

if (!statSync(sqlFile).isFile()) {
    console.error(`Path is not a file: ${sqlFile}`);
    process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["wrangler", "d1", "execute", binding, "--local", "--file", sqlFile];

console.log(`Importing ${sqlFile} into local D1 binding ${binding}...`);

const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
});

if (typeof result.status === "number") {
    process.exit(result.status);
}

console.error("Failed to execute Wrangler.");
process.exit(1);
