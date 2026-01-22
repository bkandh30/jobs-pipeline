import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { users, accounts, sessions, verificationTokens } from "../db/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { initUserBoard } from "../init-user-board";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            account: accounts,
            session: sessions,
            verificationToken: verificationTokens,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    if (user.id) {
                        await initUserBoard(user.id);
                    }
                }
            }
        }
    }
});

export async function getSession() {
    const result = await auth.api.getSession({
        headers: await headers(),
    });
    return result;
}

export async function signOut() {
    const result = await auth.api.signOut({
        headers: await headers(),
    });

    if (result.success) {
        redirect("/sign-in");
    }
}