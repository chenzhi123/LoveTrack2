"use client";

import { markFirstRewardDone } from "@/hooks/use-hydrate-data";
import { useAppStore } from "@/store/use-app-store";

export function FirstCheckInReward() {
  const { showReward, setShowReward } = useAppStore();

  if (!showReward) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-b from-amber-50 to-white p-8 text-center shadow-2xl dark:border-amber-900/40 dark:from-amber-950 dark:to-zinc-950">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-rose-400/25 blur-2xl" />
        <p className="text-4xl" aria-hidden>
          🎁
        </p>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          首次打卡成就解锁
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          已获得「初遇足迹」动态图钉光效与导出海报隐藏款配色提示。继续点亮你们的地图吧！
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 py-3 text-sm font-semibold text-white shadow-lg"
          onClick={() => {
            void markFirstRewardDone();
            setShowReward(false);
          }}
        >
          开心收下
        </button>
      </div>
    </div>
  );
}
