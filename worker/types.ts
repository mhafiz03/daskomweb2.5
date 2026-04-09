import type { users, sessions } from "./db";

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type AppBindings = {
    Bindings: CloudflareBindings;
    Variables: {
        user: User | null;
        session: Session | null;
    };
};
