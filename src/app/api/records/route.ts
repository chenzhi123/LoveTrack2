import { nanoid } from "nanoid";
import { hasDatabaseUrl, initRecordsDb } from "@/lib/records-db";
import type { StoredRecord } from "@/types/records";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB base64 上限（演示环境）

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!hasDatabaseUrl()) {
    return Response.json({
      ok: true,
      source: "unconfigured" as const,
      hint: "请在 Vercel 控制台为项目添加 Neon Postgres，并设置 DATABASE_URL（或 POSTGRES_URL）环境变量后重新部署。",
      records: [] as StoredRecord[],
    });
  }

  try {
    const sql = await initRecordsDb();
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
            ORDER BY created_at ASC
          `
        : await sql`
            SELECT id, created_at, text_content, file_name, mime_type, file_size, file_data
            FROM app_records
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
  if (!hasDatabaseUrl()) {
    return Response.json(
      {
        ok: false,
        error: "database_unconfigured",
        useLocal: true,
        message: "服务端数据库未配置，请使用页面内的本机存储模式。",
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
  const sql = await initRecordsDb();
  if (!sql) {
    return Response.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }

  try {
    await sql`
      INSERT INTO app_records (id, text_content, file_name, mime_type, file_size, file_data)
      VALUES (
        ${id},
        ${text},
        ${fileName},
        ${mimeType},
        ${fileSize},
        ${fileBase64}
      )
    `;
    const [row] = await sql`
      SELECT id, created_at, text_content, file_name, mime_type, file_size, file_data
      FROM app_records WHERE id = ${id}
    `;
    return Response.json({ ok: true, record: row as StoredRecord });
  } catch {
    return Response.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!hasDatabaseUrl()) {
    return Response.json({ ok: false, error: "database_unconfigured" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "missing_id" }, { status: 400 });
  }
  const sql = await initRecordsDb();
  if (!sql) {
    return Response.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }
  try {
    await sql`DELETE FROM app_records WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
