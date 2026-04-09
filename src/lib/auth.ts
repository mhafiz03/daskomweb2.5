export type UserType = "asisten" | "praktikan";

export interface AuthUser {
    id: string;
    identifier: string;
    userType: UserType;
    permissions: string; // JSON string[]
    name: string;
    nim?: string | null;
    kode?: string | null;
    kelasId?: string | null;
    dk?: string | null;
    asistenRole?: string | null;
    profilePicture?: string | null;
    email?: string | null;
    nomorTelepon?: string | null;
    createdAt: number;
}

export interface LoginPayload {
    identifier: string;
    password: string;
    userType: UserType;
}

export const getSession = async (): Promise<AuthUser | null> => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json() as { user: AuthUser };
    return data.user;
};

export const login = async (payload: LoginPayload): Promise<AuthUser> => {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Login failed");
    }
    const data = await res.json() as { user: AuthUser };
    return data.user;
};

export const logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
};

export const hasPermission = (user: AuthUser | null, permission: string): boolean => {
    if (!user) return false;
    try {
        const perms = JSON.parse(user.permissions) as string[];
        return perms.includes(permission);
    } catch {
        return false;
    }
};

export const getPermissions = (user: AuthUser | null): string[] => {
    if (!user) return [];
    try {
        return JSON.parse(user.permissions) as string[];
    } catch {
        return [];
    }
};
