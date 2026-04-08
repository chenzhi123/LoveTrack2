import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { hasDatabaseUrl, initSql } from "@/lib/database";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!hasDatabaseUrl()) {
    return Response.json(
      {
        ok: false,
        error: "database_unconfigured",
        message: "请先在服务器配置 DATABASE_URL（Neon Postgres）。",
      },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(body.password ?? "");

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { ok: false, error: "weak_password", message: "密码至少 8 位" },
      { status: 400 },
    );
  }

  const sql = await initSql();
  if (!sql) {
    return Response.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }

  const taken = await sql`SELECT 1 FROM users WHERE email = ${email} LIMIT 1`;
  if (taken.length > 0) {
    return Response.json(
      { ok: false, error: "email_taken", message: "该邮箱已注册" },
      { status: 409 },
    );
  }

  const id = nanoid();
  const password_hash = await bcrypt.hash(password, 12);

  try {
    await sql`
      INSERT INTO users (id, email, password_hash)
      VALUES (${id}, ${email}, ${password_hash})
    `;
    return Response.json({ ok: true, userId: id });
  } catch {
    return Response.json({ ok: false, error: "register_failed" }, { status: 500 });
  }
}
