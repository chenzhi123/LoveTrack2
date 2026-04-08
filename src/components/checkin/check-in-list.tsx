"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useEffect, useMemo, useRef } from "react";
import { filterCheckInsByDate } from "@/lib/date-filter";
import { useAppStore } from "@/store/use-app-store";
import type { CheckIn } from "@/types/models";
import { relationshipAccent } from "@/types/models";
import type { Space } from "@/types/models";

export function CheckInList({ space }: { space: Space | undefined }) {
  const {
    checkIns,
    selectedCheckInId,
    setSelectedCheckInId,
    dateFilter,
    customRange,
    listScrollToken,
    bumpMapFly,
  } = useAppStore();

  const filtered = useMemo(
    () => filterCheckInsByDate(checkIns, dateFilter, customRange),
    [checkIns, dateFilter, customRange],
  );

  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!selectedCheckInId) return;
    const el = refs.current[selectedCheckInId];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedCheckInId, listScrollToken]);

  if (!space) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        请先选择一个共享空间
      </div>
    );
  }

  const accent = relationshipAccent(space.relationshipMode);

  return (
    <div className="flex max-h-[min(70vh,560px)] flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          打卡足迹 · {space.name}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          共 {filtered.length} 条（时间轴筛选后）
        </p>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-1">
        {filtered.length === 0 ? (
          <li className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            暂无记录，点击右下角添加第一次打卡吧
          </li>
        ) : (
          filtered.map((c) => (
            <CheckInRow
              key={c.id}
              checkIn={c}
              accent={accent}
              active={c.id === selectedCheckInId}
              setRef={(el) => {
                refs.current[c.id] = el;
              }}
              onSelect={() => {
                setSelectedCheckInId(c.id);
                bumpMapFly();
              }}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function CheckInRow({
  checkIn,
  accent,
  active,
  setRef,
  onSelect,
}: {
  checkIn: CheckIn;
  accent: string;
  active: boolean;
  setRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        ref={setRef}
        onClick={onSelect}
        className={`flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
          active
            ? "border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-100 bg-zinc-50/80 hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
        }`}
      >
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white/60 shadow-sm"
          style={{
            backgroundColor: accent,
            boxShadow: active ? `0 0 12px ${accent}` : undefined,
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{checkIn.title}</span>
            <span
              className={`shrink-0 text-xs ${
                active ? "text-white/80 dark:text-zinc-600" : "text-zinc-500"
              }`}
            >
              {format(checkIn.checkedAt, "M月d日 HH:mm", { locale: zhCN })}
            </span>
          </div>
          {checkIn.address ? (
            <p
              className={`mt-0.5 truncate text-xs ${
                active ? "text-white/75 dark:text-zinc-600" : "text-zinc-500"
              }`}
            >
              {checkIn.address}
            </p>
          ) : null}
          {checkIn.note ? (
            <p
              className={`mt-1 line-clamp-2 text-xs ${
                active ? "text-white/85 dark:text-zinc-700" : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {checkIn.note}
            </p>
          ) : null}
        </div>
        {checkIn.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL 动态内容
          <img
            src={checkIn.photoDataUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : null}
      </button>
    </li>
  );
}
