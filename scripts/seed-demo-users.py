#!/usr/bin/env python3

import hashlib
import json
import sqlite3
import sys
from pathlib import Path
from typing import Iterable


ASSISTANT_PERMISSIONS = sorted(
    {
        "manage-role",
        "manage-praktikum",
        "laporan-praktikum",
        "manage-plot",
        "manage-pelanggaran",
        "manage-modul",
        "manage-soal",
        "unlock-jawaban",
        "tugas-pendahuluan",
        "see-pelanggaran",
        "lms-configuration",
        "manage-profile",
        "see-praktikum",
        "see-history",
        "see-soal",
        "nilai-praktikan",
        "see-plot",
        "ranking-praktikan",
        "see-polling",
        "set-praktikan",
        "reset-praktikan",
        "check-tugas-pendahuluan",
        "change-password",
        "praktikan-regist",
        "tp-configuration",
        "logout",
    }
)

PRAKTIKAN_PERMISSIONS = [
    "lihat-profile",
    "lihat-nilai",
    "lihat-modul",
    "lihat-asisten",
    "praktikum-lms",
    "lihat-leaderboard",
    "isi-polling",
    "ganti-password",
    "logout-praktikan",
]

DEMO_CLASS_ID = "seed-kelas-a"
DEMO_ASSISTANT_ID = "seed-asisten-kordas"
DEMO_ASSISTANT_KODE = "ADM"
DEMO_ASSISTANT_PASSWORD = "admin123"

DEMO_PRAKTIKANS = [
    {
        "id": f"seed-praktikan-{index}",
        "name": f"Praktikan Demo {index}",
        "nim": f"1352200{index}",
        "email": f"praktikan{index}@example.com",
        "alamat": f"Jl. Demo No. {index}",
        "nomor_telepon": f"0812300000{index}",
        "dk": f"DK{((index - 1) % 2) + 1}",
        "password": "praktikan123",
    }
    for index in range(1, 6)
]


def bytes_to_hex(value: bytes) -> str:
    return value.hex()


def hash_password(password: str, salt: str) -> str:
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000, dklen=32)
    return f"{salt}:{bytes_to_hex(key)}"


def resolve_local_db_path(project_root: Path) -> Path:
    wrangler_dir = project_root / ".wrangler"
    if not wrangler_dir.exists():
        raise FileNotFoundError("No .wrangler directory found. Run `bun run db:migrate:dev` first.")

    sqlite_files = sorted(
        path
        for path in wrangler_dir.rglob("*.sqlite")
        if path.name != "metadata.sqlite"
    )

    if not sqlite_files:
        raise FileNotFoundError("No local D1 SQLite database found. Run `bun run db:migrate:dev` first.")

    return sqlite_files[0]


def ensure_minimum_schema(cursor: sqlite3.Cursor) -> None:
    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            identifier TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            user_type TEXT NOT NULL,
            permissions TEXT NOT NULL DEFAULT '[]',
            name TEXT NOT NULL,
            nim TEXT UNIQUE,
            alamat TEXT,
            nomor_telepon TEXT,
            email TEXT UNIQUE,
            profile_picture TEXT,
            kelas_id TEXT,
            dk TEXT,
            kode TEXT UNIQUE,
            asisten_role TEXT,
            deskripsi TEXT,
            id_line TEXT,
            instagram TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS kelas (
            id TEXT PRIMARY KEY NOT NULL,
            kelas TEXT NOT NULL,
            hari TEXT NOT NULL,
            shift INTEGER NOT NULL,
            is_english INTEGER NOT NULL DEFAULT 0,
            total_group INTEGER,
            is_tot INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        """
    )


def ensure_demo_class(cursor: sqlite3.Cursor, now_ms: int) -> None:
    cursor.execute(
        """
        INSERT INTO kelas (
            id, kelas, hari, shift, is_english, total_group, is_tot, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            kelas = excluded.kelas,
            hari = excluded.hari,
            shift = excluded.shift,
            is_english = excluded.is_english,
            total_group = excluded.total_group,
            is_tot = excluded.is_tot,
            updated_at = excluded.updated_at
        """,
        (DEMO_CLASS_ID, "A", "Senin", 1, 0, 5, 0, now_ms, now_ms),
    )


def upsert_user(
    cursor: sqlite3.Cursor,
    *,
    seed_id: str,
    identifier: str,
    password_hash: str,
    user_type: str,
    permissions: Iterable[str],
    name: str,
    now_ms: int,
    nim: str | None = None,
    alamat: str | None = None,
    nomor_telepon: str | None = None,
    email: str | None = None,
    profile_picture: str | None = None,
    kelas_id: str | None = None,
    dk: str | None = None,
    kode: str | None = None,
    asisten_role: str | None = None,
    deskripsi: str | None = None,
    id_line: str | None = None,
    instagram: str | None = None,
) -> None:
    cursor.execute(
        """
        INSERT INTO users (
            id, identifier, password_hash, user_type, permissions, name,
            nim, alamat, nomor_telepon, email, profile_picture, kelas_id, dk,
            kode, asisten_role, deskripsi, id_line, instagram, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(identifier) DO UPDATE SET
            password_hash = excluded.password_hash,
            user_type = excluded.user_type,
            permissions = excluded.permissions,
            name = excluded.name,
            nim = excluded.nim,
            alamat = excluded.alamat,
            nomor_telepon = excluded.nomor_telepon,
            email = excluded.email,
            profile_picture = excluded.profile_picture,
            kelas_id = excluded.kelas_id,
            dk = excluded.dk,
            kode = excluded.kode,
            asisten_role = excluded.asisten_role,
            deskripsi = excluded.deskripsi,
            id_line = excluded.id_line,
            instagram = excluded.instagram,
            updated_at = excluded.updated_at
        """,
        (
            seed_id,
            identifier,
            password_hash,
            user_type,
            json.dumps(list(permissions)),
            name,
            nim,
            alamat,
            nomor_telepon,
            email,
            profile_picture,
            kelas_id,
            dk,
            kode,
            asisten_role,
            deskripsi,
            id_line,
            instagram,
            now_ms,
            now_ms,
        ),
    )


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent

    try:
        db_path = resolve_local_db_path(project_root)
    except FileNotFoundError as error:
        print(str(error), file=sys.stderr)
        return 1

    now_ms = int(__import__("time").time() * 1000)
    connection = sqlite3.connect(db_path)
    connection.execute("PRAGMA foreign_keys = ON")
    cursor = connection.cursor()

    try:
        ensure_minimum_schema(cursor)
        ensure_demo_class(cursor, now_ms)

        assistant_hash = hash_password(DEMO_ASSISTANT_PASSWORD, "demoasistensalt01")
        upsert_user(
            cursor,
            seed_id=DEMO_ASSISTANT_ID,
            identifier=DEMO_ASSISTANT_KODE,
            password_hash=assistant_hash,
            user_type="asisten",
            permissions=ASSISTANT_PERMISSIONS,
            name="Admin Demo",
            now_ms=now_ms,
            kode=DEMO_ASSISTANT_KODE,
            asisten_role="KORDAS",
            deskripsi="Demo assistant with full permissions",
            nomor_telepon="081234567890",
            id_line="adm_demo",
            instagram="@adm_demo",
        )

        for praktikan in DEMO_PRAKTIKANS:
            password_hash = hash_password(praktikan["password"], f"demopraktikansalt{praktikan['nim'][-2:]}")
            upsert_user(
                cursor,
                seed_id=praktikan["id"],
                identifier=praktikan["nim"],
                password_hash=password_hash,
                user_type="praktikan",
                permissions=PRAKTIKAN_PERMISSIONS,
                name=praktikan["name"],
                now_ms=now_ms,
                nim=praktikan["nim"],
                alamat=praktikan["alamat"],
                nomor_telepon=praktikan["nomor_telepon"],
                email=praktikan["email"],
                kelas_id=DEMO_CLASS_ID,
                dk=praktikan["dk"],
            )

        connection.commit()
    finally:
        connection.close()

    print(f"Seeded local D1 database: {db_path}")
    print("Created or updated class: A / Senin / shift 1")
    print(f"Asisten: kode={DEMO_ASSISTANT_KODE} password={DEMO_ASSISTANT_PASSWORD}")
    print("Praktikans:")
    for praktikan in DEMO_PRAKTIKANS:
        print(f"  - nim={praktikan['nim']} password={praktikan['password']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
