import { auth } from "@/auth";
import { initSql } from "@/lib/database";
import type { CheckIn, Space, SpaceMember } from "@/types/models";

export const runtime = "nodejs";

type SnapshotPayload = {
  version: 1;
  spaces: Space[];
  members: SpaceMember[];
  checkIns: CheckIn[];
};

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = await initSql();
  if (!sql) {
    return Response.json({ error: "database_unavailable" }, { status: 503 });
  }

  const rows = await sql`
    SELECT payload FROM fp_snapshot WHERE user_id = ${userId} LIMIT 1
  `;
  const row = rows[0] as { payload: unknown } | undefined;
  let snapshot: SnapshotPayload | null = null;
  if (row?.payload != null) {
    const p = row.payload;
    snapshot =
      typeof p === "string"
        ? (JSON.parse(p) as SnapshotPayload)
        : (p as SnapshotPayload);
  }
  return Response.json({ ok: true, snapshot });
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SnapshotPayload;
  try {
    body = (await req.json()) as SnapshotPayload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.version !== 1 || !Array.isArray(body.spaces)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const sql = await initSql();
  if (!sql) {
    return Response.json({ error: "database_unavailable" }, { status: 503 });
  }

  const json = JSON.stringify(body);
  await sql`
    INSERT INTO fp_snapshot (user_id, payload, updated_at)
    VALUES (${userId}, ${json}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `;

  return Response.json({ ok: true });
}
