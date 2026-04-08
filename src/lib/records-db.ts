import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function getSql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) return null;
  return neon(url);
}

let initPromise: Promise<void> | null = null;

async function ensureSchema(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS app_records (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      text_content TEXT NOT NULL DEFAULT '',
      file_name TEXT,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_data TEXT
    )
  `;
}

export async function initRecordsDb(): Promise<NeonQueryFunction<false, false> | null> {
  const sql = getSql();
  if (!sql) return null;
  if (!initPromise) {
    initPromise = ensureSchema(sql).catch(() => {
      initPromise = null;
      throw new Error("records_db_init_failed");
    });
  }
  await initPromise;
  return sql;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}
