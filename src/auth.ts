import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { initSql } from "@/lib/database";

function resolveAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.VERCEL) return undefined;
  return "local-dev-auth-secret-min-32-characters-long!!";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      id: "credentials",
      name: "邮箱密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const sql = await initSql();
        if (!sql) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const rows = await sql`
          SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1
        `;
        const user = rows[0] as
          | { id: string; email: string; password_hash: string }
          | undefined;
        if (!user) return null;
        const ok = await bcrypt.compare(
          String(credentials.password),
          user.password_hash,
        );
        if (!ok) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
});
