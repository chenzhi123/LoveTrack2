"use client";

import { useState } from "react";
import { completeTutorial } from "@/hooks/use-hydrate-data";
import { useAppStore } from "@/store/use-app-store";

const STEPS = [
  {
    title: "选择关系空间",
    body: "情侣、朋友、家人三种模式对应不同配色与独立地图。顶部可切换共享空间。",
  },
  {
    title: "地图与列表联动",
    body: "在地图上点击光晕图钉，或在列表中选择条目，二者会相互联动定位。",
  },
  {
    title: "打卡方式",
    body: "支持地址搜索、经纬度选点与扫码。数据保存在本机 IndexedDB，并可一键同步到浏览器「云镜像」。",
  },
  {
    title: "导出足迹",
    body: "可将筛选后的记录导出为 PDF，或生成带二维码的分享海报。",
  },
];

export function TutorialOverlay() {
  const { showTutorial } = useAppStore();
  const [index, setIndex] = useState(0);

  if (!showTutorial) return null;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-6 text-white shadow-2xl backdrop-blur">
        <p className="text-xs font-medium text-white/50">
          新手引导 {index + 1}/{STEPS.length}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{step.body}</p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-white/20 py-3 text-sm font-medium text-white/90 hover:bg-white/5"
            onClick={() => {
              void completeTutorial();
            }}
          >
            跳过
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-white py-3 text-sm font-semibold text-zinc-900"
            onClick={() => {
              if (last) {
                void completeTutorial();
              } else {
                setIndex((i) => i + 1);
              }
            }}
          >
            {last ? "开始探索" : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}
