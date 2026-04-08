"use client";

import { useEffect, useState } from "react";
import { refreshSpaceData } from "@/hooks/use-hydrate-data";
import { db, pushCloudMirror } from "@/lib/db";
import type { MemberRole, SpaceMember } from "@/types/models";
import { ROLE_LABELS } from "@/types/models";

export function MemberPermissionsPanel({ spaceId }: { spaceId: string | null }) {
  const [members, setMembers] = useState<SpaceMember[]>([]);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    void db.members
      .where("spaceId")
      .equals(spaceId)
      .toArray()
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  if (!spaceId) return null;

  const updateRole = async (id: string, role: MemberRole) => {
    await db.members.update(id, { role });
    await pushCloudMirror();
    await refreshSpaceData(spaceId);
    const rows = await db.members.where("spaceId").equals(spaceId).toArray();
    setMembers(rows);
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">成员与权限</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        「我」模拟当前登录用户；可调整角色体验只读/可编辑差异。
      </p>
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/80"
          >
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {m.displayName}
            </span>
            <select
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
              value={m.role}
              onChange={(e) =>
                void updateRole(m.id, e.target.value as MemberRole)
              }
            >
              {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
