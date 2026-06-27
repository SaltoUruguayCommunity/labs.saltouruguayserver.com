import type { Session as AuthSession, DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
    interface Session extends AuthSession {
        user: {
            id: number;
            username: string;
            is_admin?: boolean;
        } & DefaultSession["user"];
    }
}

declare global {
    namespace App {
        interface Locals {
            user: import("@auth/core/types").Session["user"] | null;
        }
    }
}

export {};
