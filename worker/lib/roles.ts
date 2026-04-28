import { eq } from "drizzle-orm";
import { roles, users } from "../db";
import { getDb } from "../utils";

export const BUILTIN_ASISTEN_ROLE_PERMISSIONS: Record<string, string[]> = {
    KORDAS: [
        "manage-role", "manage-praktikum", "laporan-praktikum", "manage-plot",
        "manage-pelanggaran", "manage-modul", "manage-soal", "unlock-jawaban",
        "tugas-pendahuluan", "see-pelanggaran", "lms-configuration", "manage-profile",
        "see-praktikum", "see-history", "see-soal", "nilai-praktikan", "see-plot",
        "ranking-praktikan", "see-polling", "set-praktikan", "reset-praktikan",
        "check-tugas-pendahuluan", "change-password", "praktikan-regist",
        "tp-configuration", "logout",
    ],
    WAKORDAS: [
        "manage-praktikum", "laporan-praktikum", "manage-modul", "manage-soal",
        "unlock-jawaban", "tugas-pendahuluan", "manage-profile", "see-praktikum",
        "see-history", "see-soal", "nilai-praktikan", "see-plot", "ranking-praktikan",
        "see-polling", "set-praktikan", "check-tugas-pendahuluan", "change-password",
        "tp-configuration", "logout",
    ],
    SOFTWARE: [
        "manage-modul", "manage-soal", "manage-profile", "see-praktikum",
        "see-history", "see-soal", "nilai-praktikan", "see-plot", "ranking-praktikan",
        "see-polling", "check-tugas-pendahuluan", "change-password", "logout",
    ],
    HARDWARE: [
        "manage-profile", "see-praktikum", "see-history", "see-soal",
        "nilai-praktikan", "ranking-praktikan", "see-polling", "change-password", "logout",
    ],
    ASLAB: [
        "manage-profile", "see-praktikum", "see-soal", "nilai-praktikan",
        "ranking-praktikan", "change-password", "logout",
    ],
    ADMIN: [
        "manage-role", "manage-praktikum", "laporan-praktikum", "manage-plot",
        "manage-pelanggaran", "manage-modul", "manage-soal", "unlock-jawaban",
        "tugas-pendahuluan", "see-pelanggaran", "lms-configuration", "manage-profile",
        "see-praktikum", "see-history", "see-soal", "nilai-praktikan", "see-plot",
        "ranking-praktikan", "see-polling", "set-praktikan", "reset-praktikan",
        "check-tugas-pendahuluan", "change-password", "praktikan-regist",
        "tp-configuration", "logout",
    ],
};

export const PRAKTIKAN_PERMISSIONS = [
    "lihat-profile", "lihat-nilai", "lihat-modul", "lihat-asisten",
    "praktikum-lms", "lihat-leaderboard", "isi-polling", "ganti-password",
    "logout-praktikan",
];

export const ROLE_PACKAGE_PERMISSIONS: Record<string, string[]> = {
    super: ["manage-role"],
    aslab: ["laporan-praktikum", "manage-plot", "lms-configuration"],
    atc: ["manage-modul", "manage-soal", "unlock-jawaban", "tugas-pendahuluan"],
    rdc: ["manage-praktikum", "tp-configuration", "praktikan-regist"],
    asisten: [
        "manage-profile", "see-praktikum", "see-history", "see-modul",
        "see-soal", "nilai-praktikan", "see-plot", "ranking-praktikan",
        "see-polling", "set-praktikan", "reset-praktikan",
        "check-tugas-pendahuluan", "change-password", "logout",
    ],
};

export const PUBLIC_EXCLUDED_ROLE_NAMES = new Set([
    "SOFTWARE",
    "ADMIN",
    "KORDAS",
    "WAKORDAS",
    "KOORPRAK",
    "HARDWARE",
    "DDC",
]);

export type RoleDefinition = {
    id: string;
    name: string;
    permissions: string[];
    paket: string[];
    guard_name: string;
    is_system: boolean;
};

type Database = ReturnType<typeof getDb>;

export const normalizeRoleName = (value: string) => value.trim().toUpperCase();

export const mergePermissionPackages = (paket: string[]) =>
    Array.from(
        new Set(
            paket.flatMap((key) => ROLE_PACKAGE_PERMISSIONS[key] ?? []),
        ),
    );

const parseJsonArray = (value: string | null | undefined): string[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
};

export const listAvailableRoles = async (
    db: Database,
    includeRestricted = false,
): Promise<RoleDefinition[]> => {
    const roleMap = new Map<string, RoleDefinition>();

    for (const [name, permissions] of Object.entries(BUILTIN_ASISTEN_ROLE_PERMISSIONS)) {
        roleMap.set(name, {
            id: `builtin:${name}`,
            name,
            permissions,
            paket: [],
            guard_name: "asisten",
            is_system: true,
        });
    }

    const persistedRoles = await db.select().from(roles);
    for (const role of persistedRoles) {
        const name = normalizeRoleName(role.name);
        roleMap.set(name, {
            id: role.id,
            name,
            permissions: parseJsonArray(role.permissions),
            paket: parseJsonArray(role.paket),
            guard_name: role.guardName,
            is_system: false,
        });
    }

    const assistantRows = await db.select({
        id: users.id,
        asistenRole: users.asistenRole,
        permissions: users.permissions,
    }).from(users).where(eq(users.userType, "asisten"));

    for (const assistant of assistantRows) {
        const roleName = assistant.asistenRole ? normalizeRoleName(assistant.asistenRole) : null;
        if (!roleName || roleMap.has(roleName)) continue;
        roleMap.set(roleName, {
            id: `derived:${roleName}`,
            name: roleName,
            permissions: parseJsonArray(assistant.permissions),
            paket: [],
            guard_name: "asisten",
            is_system: true,
        });
    }

    return Array.from(roleMap.values())
        .filter((role) => role.name !== "PRAKTIKAN")
        .filter((role) => includeRestricted || !PUBLIC_EXCLUDED_ROLE_NAMES.has(role.name))
        .sort((a, b) => a.name.localeCompare(b.name));
};

export const resolveRoleDefinition = async (
    db: Database,
    rawRoleName: string,
): Promise<RoleDefinition | null> => {
    const roleName = normalizeRoleName(rawRoleName);

    if (BUILTIN_ASISTEN_ROLE_PERMISSIONS[roleName]) {
        return {
            id: `builtin:${roleName}`,
            name: roleName,
            permissions: BUILTIN_ASISTEN_ROLE_PERMISSIONS[roleName]!,
            paket: [],
            guard_name: "asisten",
            is_system: true,
        };
    }

    const persisted = await db.select().from(roles).where(eq(roles.name, roleName)).get();
    if (persisted) {
        return {
            id: persisted.id,
            name: roleName,
            permissions: parseJsonArray(persisted.permissions),
            paket: parseJsonArray(persisted.paket),
            guard_name: persisted.guardName,
            is_system: false,
        };
    }

    const fallbackAssistant = await db.select({
        id: users.id,
        permissions: users.permissions,
    }).from(users).where(eq(users.asistenRole, roleName)).get();

    if (!fallbackAssistant) return null;

    return {
        id: `derived:${roleName}`,
        name: roleName,
        permissions: parseJsonArray(fallbackAssistant.permissions),
        paket: [],
        guard_name: "asisten",
        is_system: true,
    };
};
