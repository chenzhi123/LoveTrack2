"use client";

import {
  ensureSeedData,
  exportSnapshotFromDexie,
  replaceDexieFromSnapshot,
} from "@/lib/db";
import type { CheckIn, Space, SpaceMember } from "@/types/models";

type Snapshot = {
  version: 1;
  spaces: Space[];
  members: SpaceMember[];
  checkIns: CheckIn[];
};

/** 从服务器恢复足迹；若无数据则生成本地种子并上传 */
export async function hydrateFootprintFromServer(): Promise<void> {
  const res = await fetch("/api/footprint/snapshot", { credentials: "same-origin" });
  if (!res.ok) return;
  const data = (await res.json()) as { ok?: boolean; snapshot: Snapshot | null };
  const snap = data.snapshot;
  if (snap?.spaces?.length) {
    await replaceDexieFromSnapshot({
      spaces: snap.spaces,
      members: snap.members ?? [],
      checkIns: snap.checkIns ?? [],
    });
    return;
  }
  await ensureSeedData();
  await pushFootprintSnapshot();
}

export async function pushFootprintSnapshot(): Promise<void> {
  const payload = await exportSnapshotFromDexie();
  await fetch("/api/footprint/snapshot", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
