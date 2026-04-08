"use client";

import { switchSpace } from "@/hooks/use-hydrate-data";
import { useAppStore } from "@/store/use-app-store";
import { RELATIONSHIP_LABELS } from "@/types/models";

export function SpaceSwitcher() {
  const { spaces, activeSpaceId } = useAppStore();

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        共享空间
      </span>
      <select
        className="truncate rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        value={activeSpaceId ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          const sp = spaces.find((s) => s.id === id);
          if (sp) void switchSpace(sp);
        }}
      >
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {RELATIONSHIP_LABELS[s.relationshipMode]}
          </option>
        ))}
      </select>
    </label>
  );
}
