"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Suspense, useCallback, useState } from "react";
import { useHydrateData } from "@/hooks/use-hydrate-data";
import { pullCloudMirror, pushCloudMirror } from "@/lib/db";
import { useAppStore } from "@/store/use-app-store";
import type { DateFilter } from "@/store/use-app-store";
import { AddCheckInDrawer } from "@/components/checkin/add-checkin-drawer";
import { CheckInList } from "@/components/checkin/check-in-list";
import { ExportDialog } from "@/components/export/export-dialog";
import { DeepLinkHandler } from "@/components/layout/deep-link-handler";
import { MemberPermissionsPanel } from "@/components/members/member-permissions";
import { FirstCheckInReward } from "@/components/onboarding/first-checkin-reward";
import { TutorialOverlay } from "@/components/onboarding/tutorial-overlay";
import { SpaceSwitcher } from "@/components/space/space-switcher";

const FootprintMap = dynamic(
  () => import("@/components/map/footprint-map").then((m) => m.FootprintMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex h-[min(55vh,420px)] w-full animate-pulse items-center justify-center rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80">
      <span className="text-sm text-zinc-500">地图加载中…</span>
    </div>
  );
}

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "7d", label: "近 7 天" },
  { id: "30d", label: "近 30 天" },
  { id: "year", label: "近一年" },
  { id: "custom", label: "自定义" },
];

export function AppShell() {
  useHydrateData();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    hydrated,
    spaces,
    activeSpaceId,
    viewMode,
    setViewMode,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    setSyncMessage,
    canEditActiveSpace,
  } = useAppStore();

  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [prefill, setPrefill] = useState<{
    lat: number;
    lng: number;
    title?: string;
  } | null>(null);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const onPlaceFromQuery = useCallback(
    (p: { lat: number; lng: number; title?: string }) => {
      setPrefill(p);
      setAddOpen(true);
    },
    [],
  );

  const handleSync = async () => {
    await pushCloudMirror();
    setSyncMessage("已同步到本浏览器云镜像");
    window.setTimeout(() => setSyncMessage(null), 3200);
  };

  const handlePull = async () => {
    const ok = await pullCloudMirror();
    setSyncMessage(ok ? "已从云镜像恢复" : "暂无备份可恢复");
    window.setTimeout(() => setSyncMessage(null), 3200);
    window.location.reload();
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        <p className="text-sm">正在加载本地足迹库…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-28 sm:pb-8">
      <Suspense fallback={null}>
        <DeepLinkHandler onPlaceFromQuery={onPlaceFromQuery} />
      </Suspense>
      <header className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <SpaceSwitcher />
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilter(d.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateFilter === d.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
            onClick={() => void handleSync()}
          >
            云同步
          </button>
          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
            onClick={() => void handlePull()}
          >
            恢复备份
          </button>
          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
            onClick={() => setExportOpen(true)}
          >
            导出
          </button>
          <button
            type="button"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            title={`当前：${theme}`}
          >
            {resolvedTheme === "dark" ? "浅色" : "深色"}
          </button>
        </div>
      </header>

      {dateFilter === "custom" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">
          <span className="text-zinc-500">自定义区间：</span>
          <input
            type="date"
            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const start = new Date(v).getTime();
              setCustomRange({
                start,
                end: customRange?.end ?? Date.now(),
              });
            }}
          />
          <span className="text-zinc-400">—</span>
          <input
            type="date"
            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const end = new Date(v).getTime();
              setCustomRange({
                start: customRange?.start ?? end,
                end,
              });
            }}
          />
        </div>
      ) : null}

      <div className="flex gap-2 rounded-2xl bg-zinc-100/80 p-1 dark:bg-zinc-900/80">
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            viewMode === "map"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          onClick={() => setViewMode("map")}
        >
          地图
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            viewMode === "list"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          onClick={() => setViewMode("list")}
        >
          列表
        </button>
      </div>

      {viewMode === "map" ? (
        <div className="flex flex-1 flex-col gap-4 lg:grid lg:min-h-[min(55vh,520px)] lg:grid-cols-[1.4fr_0.9fr]">
          <section className="min-h-[min(55vh,480px)]">
            <FootprintMap space={activeSpace} />
          </section>
          <section className="min-h-0 lg:max-h-[min(70vh,560px)]">
            <CheckInList space={activeSpace} />
          </section>
        </div>
      ) : (
        <section className="min-h-0 flex-1">
          <CheckInList space={activeSpace} />
        </section>
      )}

      <MemberPermissionsPanel spaceId={activeSpaceId} />

      <SyncToast />

      <AddCheckInDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        spaceId={activeSpaceId}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill(null)}
      />
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        space={activeSpace}
      />
      <TutorialOverlay />
      <FirstCheckInReward />

      {canEditActiveSpace ? (
        <button
          type="button"
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 text-2xl text-white shadow-xl shadow-rose-500/30 sm:bottom-8 sm:right-8"
          onClick={() => setAddOpen(true)}
          aria-label="添加打卡"
        >
          +
        </button>
      ) : null}
    </div>
  );
}

function SyncToast() {
  const { syncMessage } = useAppStore();
  if (!syncMessage) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-40 max-w-sm -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-center text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900 sm:bottom-8">
      {syncMessage}
    </div>
  );
}
