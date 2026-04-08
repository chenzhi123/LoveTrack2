import Dexie, { type Table } from "dexie";
import { nanoid } from "nanoid";
import type { CheckIn, Space, SpaceMember } from "@/types/models";

const CLOUD_KEY = "lovetrack-cloud-mirror";

class FootprintDatabase extends Dexie {
  spaces!: Table<Space>;
  checkIns!: Table<CheckIn>;
  members!: Table<SpaceMember>;

  constructor() {
    super("LoveTrackFootprintDB");
    this.version(1).stores({
      spaces: "id, relationshipMode, updatedAt",
      checkIns: "id, spaceId, checkedAt, [spaceId+checkedAt]",
      members: "id, spaceId, [spaceId+displayName]",
    });
  }
}

export const db = new FootprintDatabase();

export async function ensureSeedData(): Promise<void> {
  const count = await db.spaces.count();
  if (count > 0) return;

  const now = Date.now();
  const spaces: Space[] = [
    {
      id: nanoid(),
      name: "我们的情侣地图",
      relationshipMode: "couple",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      name: "朋友出游足迹",
      relationshipMode: "friend",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      name: "家庭纪念地图",
      relationshipMode: "family",
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.transaction("rw", db.spaces, db.members, db.checkIns, async () => {
    for (const s of spaces) {
      await db.spaces.add(s);
      const m1: SpaceMember = {
        id: nanoid(),
        spaceId: s.id,
        displayName: "我",
        role: "owner",
      };
      const m2: SpaceMember = {
        id: nanoid(),
        spaceId: s.id,
        displayName: "Ta",
        role: "editor",
      };
      await db.members.bulkAdd([m1, m2]);
    }
  });
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`lt:${key}`);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lt:${key}`, JSON.stringify(value));
}

/** 本地模拟云同步：将全量数据镜像到 localStorage，便于备份与多标签页恢复 */
export async function pushCloudMirror(): Promise<void> {
  const [spaces, checkIns, members] = await Promise.all([
    db.spaces.toArray(),
    db.checkIns.toArray(),
    db.members.toArray(),
  ]);
  const payload = {
    version: 1,
    savedAt: Date.now(),
    spaces,
    checkIns,
    members,
  };
  localStorage.setItem(CLOUD_KEY, JSON.stringify(payload));
}

export async function pullCloudMirror(): Promise<boolean> {
  const raw = localStorage.getItem(CLOUD_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as {
      spaces: Space[];
      checkIns: CheckIn[];
      members: SpaceMember[];
    };
    await db.transaction("rw", db.spaces, db.checkIns, db.members, async () => {
      await db.checkIns.clear();
      await db.members.clear();
      await db.spaces.clear();
      await db.spaces.bulkAdd(data.spaces);
      await db.members.bulkAdd(data.members);
      await db.checkIns.bulkAdd(data.checkIns);
    });
    return true;
  } catch {
    return false;
  }
}

/** 用服务端快照覆盖本地 IndexedDB（登录后拉取） */
export async function replaceDexieFromSnapshot(data: {
  spaces: Space[];
  members: SpaceMember[];
  checkIns: CheckIn[];
}): Promise<void> {
  await db.transaction("rw", db.spaces, db.checkIns, db.members, async () => {
    await db.checkIns.clear();
    await db.members.clear();
    await db.spaces.clear();
    if (data.spaces.length) await db.spaces.bulkAdd(data.spaces);
    if (data.members.length) await db.members.bulkAdd(data.members);
    if (data.checkIns.length) await db.checkIns.bulkAdd(data.checkIns);
  });
}

export async function exportSnapshotFromDexie(): Promise<{
  version: 1;
  spaces: Space[];
  members: SpaceMember[];
  checkIns: CheckIn[];
}> {
  const [spaces, checkIns, members] = await Promise.all([
    db.spaces.toArray(),
    db.checkIns.toArray(),
    db.members.toArray(),
  ]);
  return { version: 1, spaces, members, checkIns };
}
