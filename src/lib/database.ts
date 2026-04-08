import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

function getSqlRaw(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) return null;
  return neon(url);
}

let initPromise: Promise<void> | null = null;

async function ensureSchema(sql: NeonQueryFunction<false, false>) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_records (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      text_content TEXT NOT NULL DEFAULT '',
      file_name TEXT,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_data TEXT,
      user_id TEXT
    )
  `;

  await sql`ALTER TABLE app_records ADD COLUMN IF NOT EXISTS user_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_app_records_user_id ON app_records (user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS fp_snapshot (
      user_id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function initSql(): Promise<NeonQueryFunction<false, false> | null> {
  const sql = getSqlRaw();
  if (!sql) return null;
  if (!initPromise) {
    initPromise = ensureSchema(sql).catch(() => {
      initPromise = null;
      throw new Error("database_init_failed");
    });
  }
  await initPromise;
  return sql;
}

/** @deprecated 使用 initSql */
export async function initRecordsDb() {
  return initSql();
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}
