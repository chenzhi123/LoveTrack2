import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { hasDatabaseUrl, initSql } from "@/lib/database";
import type { StoredRecord } from "@/types/records";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!hasDatabaseUrl()) {
    return Response.json(
      {
        ok: false,
        error: "database_unconfigured",
        message: "请配置 DATABASE_URL 后使用云端记录。",
        records: [] as StoredRecord[],
      },
      { status: 503 },
    );
  }

  try {
    const sql = await initSql();
    if (!sql) {
      return Response.json(
        { ok: false, error: "database_unavailable" },
        { status: 503 },
      );
    }
    const rows =
      sort === "asc"
        ? await sql`
            SELECT id, created_at, text_content, file_name, mime_type, file_size, file_data
            FROM app_records
            WHERE user_id = ${userId}
            ORDER BY created_at ASC
          `
        : await sql`
            SELECT id, created_at, text_content, file_name, mime_type, file_size, file_data
            FROM app_records
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `;
    let list = rows as StoredRecord[];
    if (q) {
      list = list.filter(
        (r) =>
          r.text_content.toLowerCase().includes(q) ||
          (r.file_name?.toLowerCase().includes(q) ?? false),
      );
    }
    return Response.json({ ok: true, source: "postgres" as const, records: list });
  } catch {
    return Response.json(
      { ok: false, error: "database_error" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return Response.json(
      {
        ok: false,
        error: "database_unconfigured",
        message: "请配置 DATABASE_URL。",
      },
      { status: 503 },
    );
  }

  let text = "";
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileBase64: string | null = null;
  let fileSize = 0;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    text = String(form.get("text") ?? "");
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) {
        return Response.json(
          { ok: false, error: "file_too_large" },
          { status: 413 },
        );
      }
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      fileSize = file.size;
      const buf = Buffer.from(await file.arrayBuffer());
      fileBase64 = buf.toString("base64");
    }
  } else {
    const body = (await req.json()) as {
      text?: string;
      fileName?: string;
      mimeType?: string;
      fileBase64?: string;
    };
    text = body.text ?? "";
    fileName = body.fileName ?? null;
    mimeType = body.mimeType ?? null;
    fileBase64 = body.fileBase64 ?? null;
    if (fileBase64) {
      fileSize = Math.floor((fileBase64.length * 3) / 4);
      if (fileSize > MAX_FILE_BYTES) {
        return Response.json(
          { ok: false, error: "file_too_large" },
          { status: 413 },
        );
      }
    }
  }

  const id = nanoid();
  const sql = await initSql();
  if (!sql) {
    return Response.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }

  try {
    await sql`
      INSERT INTO app_records (id, text_content, file_name, mime_type, file_size, file_data, user_id)
      VALUES (
        ${id},
        ${text},
        ${fileName},
        ${mimeType},
        ${fileSize},
        ${fileBase64},
        ${userId}
      )
    `;
    const [row] = await sql`
      SELECT id, created_at, text_content, file_name, mime_type, file_size, file_data
      FROM app_records WHERE id = ${id} AND user_id = ${userId}
    `;
    return Response.json({ ok: true, record: row as StoredRecord });
  } catch {
    return Response.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return Response.json({ ok: false, error: "database_unconfigured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "missing_id" }, { status: 400 });
  }
  const sql = await initSql();
  if (!sql) {
    return Response.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  try {
    await sql`DELETE FROM app_records WHERE id = ${id} AND user_id = ${userId}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
