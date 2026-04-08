"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { buildShareCheckInUrl } from "@/lib/qr-payload";
import { filterCheckInsByDate } from "@/lib/date-filter";
import { useAppStore } from "@/store/use-app-store";
import type { CheckIn, Space } from "@/types/models";
import { RELATIONSHIP_LABELS, relationshipAccent } from "@/types/models";

export function ExportDialog({
  open,
  onClose,
  space,
}: {
  open: boolean;
  onClose: () => void;
  space: Space | undefined;
}) {
  const { checkIns, dateFilter, customRange } = useAppStore();
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "poster" | null>(null);

  if (!open || !space) return null;

  const filtered = filterCheckInsByDate(checkIns, dateFilter, customRange);
  const accent = relationshipAccent(space.relationshipMode);
  const sample = filtered[0];

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      let y = margin;
      doc.setFontSize(18);
      doc.text("LoveTrack 足迹导出", margin, y);
      y += 28;
      doc.setFontSize(11);
      doc.text(
        `空间：${space.name}（${RELATIONSHIP_LABELS[space.relationshipMode]}）`,
        margin,
        y,
      );
      y += 18;
      doc.text(`共 ${filtered.length} 条记录`, margin, y);
      y += 28;
      doc.setFontSize(10);
      filtered.forEach((c, i) => {
        if (y > 780) {
          doc.addPage();
          y = margin;
        }
        const line = `${i + 1}. ${c.title} · ${format(c.checkedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}`;
        doc.text(line, margin, y);
        y += 14;
        if (c.address) {
          doc.text(`   地址：${c.address}`, margin, y);
          y += 14;
        }
        if (c.note) {
          const wrapped = doc.splitTextToSize(`   备注：${c.note}`, 500);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 12 + 6;
        }
        y += 8;
      });
      doc.save(`LoveTrack-${space.name}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  const exportPoster = async () => {
    if (!posterRef.current) return;
    setBusy("poster");
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: "#0f172a",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `LoveTrack-海报-${space.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">导出与分享</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PDF 含当前时间轴筛选结果；海报适合社交平台分享。
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void exportPdf()}
            className="flex-1 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy === "pdf" ? "生成中…" : "导出 PDF"}
          </button>
          <button
            type="button"
            disabled={busy !== null || filtered.length === 0}
            onClick={() => void exportPoster()}
            className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold dark:border-zinc-700"
          >
            {busy === "poster" ? "导出中…" : "导出分享海报"}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-slate-950 p-4">
          <p className="text-center text-xs text-slate-400">海报预览（暗色卡片）</p>
          <div ref={posterRef} className="mx-auto mt-3 w-[280px] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-xl">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-400">
              LoveTrack
            </p>
            <h3 className="mt-2 text-center text-xl font-bold" style={{ color: accent }}>
              {space.name}
            </h3>
            <p className="mt-1 text-center text-sm text-slate-300">
              {RELATIONSHIP_LABELS[space.relationshipMode]} · {filtered.length} 处足迹
            </p>
            {sample ? (
              <PosterHighlight checkIn={sample} accent={accent} />
            ) : (
              <p className="mt-6 text-center text-sm text-slate-500">暂无打卡可展示</p>
            )}
            <div className="mt-6 flex justify-center rounded-xl bg-white p-2">
              {sample ? (
                <QRCodeSVG
                  value={buildShareCheckInUrl(sample.lat, sample.lng, sample.title)}
                  size={112}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center text-xs text-slate-400">
                  无二维码
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              扫码可快速在地图中定位此足迹（示例链接）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PosterHighlight({ checkIn, accent }: { checkIn: CheckIn; accent: string }) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-sm font-semibold" style={{ color: accent }}>
        {checkIn.title}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {format(checkIn.checkedAt, "yyyy年M月d日 HH:mm", { locale: zhCN })}
      </p>
      {checkIn.note ? (
        <p className="mt-2 line-clamp-3 text-xs text-slate-300">{checkIn.note}</p>
      ) : null}
    </div>
  );
}
