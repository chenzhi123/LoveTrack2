"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoredRecord } from "@/types/records";

export function RecordsApp() {
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<StoredRecord[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cloudOk, setCloudOk] = useState(true);

  const loadRemote = useCallback(async () => {
    const params = new URLSearchParams({ sort, q });
    const res = await fetch(`/api/records?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as {
      ok: boolean;
      source?: string;
      message?: string;
      records?: StoredRecord[];
      error?: string;
    };

    if (res.status === 401) {
      setCloudOk(false);
      setHint("登录已失效，请重新登录。");
      setRows([]);
      setLoading(false);
      return;
    }

    if (res.status === 503 || !data.ok) {
      setCloudOk(false);
      setHint(
        data.message ??
          "服务端数据库未配置或不可用。请在 Vercel 为项目添加 Neon 并设置 DATABASE_URL、AUTH_SECRET 后重新部署。",
      );
      setRows(data.records ?? []);
      setLoading(false);
      return;
    }

    setCloudOk(true);
    setHint(null);
    setRows(data.records ?? []);
    setLoading(false);
  }, [sort, q]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      if (cancelled) return;
      await loadRemote();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRemote]);

  useEffect(() => {
    if (!cloudOk) return;
    const t = window.setInterval(() => {
      void loadRemote();
    }, 2800);
    return () => window.clearInterval(t);
  }, [cloudOk, loadRemote]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudOk) {
      showToast("当前无法写入云端，请先完成数据库配置。");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("text", text);
      if (file) fd.set("file", file);
      const res = await fetch("/api/records", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      if (!res.ok) {
        showToast("保存失败，请稍后重试");
        return;
      }
      showToast("已保存到云端");
      setText("");
      setFile(null);
      await loadRemote();
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/records?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      showToast("删除失败");
      return;
    }
    await loadRemote();
  };

  const exportCsv = () => {
    const header = ["id", "created_at", "text_content", "file_name", "mime_type", "file_size"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const cells = [
        r.id,
        r.created_at,
        JSON.stringify(r.text_content ?? ""),
        JSON.stringify(r.file_name ?? ""),
        JSON.stringify(r.mime_type ?? ""),
        String(r.file_size ?? 0),
      ];
      lines.push(cells.join(","));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `records-${format(Date.now(), "yyyyMMdd-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedLabel = useMemo(
    () => (sort === "desc" ? "最新在前" : "最旧在前"),
    [sort],
  );

  return (
    <div className="flex flex-col gap-6">
      {hint ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {hint}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          新建记录
        </h2>
        <form className="mt-3 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="输入文本、备忘、日志…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            className="w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="submit"
            disabled={submitting || !cloudOk}
            className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? "提交中…" : "保存到云端"}
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          数据与当前登录账号绑定，存储在服务器数据库中。
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">记录列表</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[160px] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="筛选关键词…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
              onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
            >
              排序：{sortedLabel}
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium dark:border-zinc-700"
              onClick={() => exportCsv()}
            >
              导出 CSV
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">加载中…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">暂无数据</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-2">时间</th>
                  <th className="py-2 pr-2">文本</th>
                  <th className="py-2 pr-2">文件</th>
                  <th className="py-2 pr-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="max-w-[140px] py-2 pr-2 align-top text-xs text-zinc-500">
                      {format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss", {
                        locale: zhCN,
                      })}
                    </td>
                    <td className="max-w-[280px] py-2 pr-2 align-top text-zinc-800 dark:text-zinc-100">
                      <span className="line-clamp-4 whitespace-pre-wrap">
                        {r.text_content}
                      </span>
                    </td>
                    <td className="max-w-[200px] py-2 pr-2 align-top">
                      <FileCell row={r} />
                    </td>
                    <td className="py-2 align-top">
                      <button
                        type="button"
                        className="text-xs text-rose-600 hover:underline dark:text-rose-400"
                        onClick={() => void onDelete(r.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-center text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900 sm:bottom-10">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function FileCell({ row }: { row: StoredRecord }) {
  if (!row.file_name && !row.file_data) {
    return <span className="text-xs text-zinc-400">—</span>;
  }
  if (row.mime_type?.startsWith("image/") && row.file_data) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:${row.mime_type};base64,${row.file_data}`}
        alt=""
        className="h-16 w-16 rounded-lg object-cover"
      />
    );
  }
  if (row.file_data && row.file_name) {
    return (
      <a
        className="text-xs text-sky-600 underline dark:text-sky-400"
        href={`data:${row.mime_type ?? "application/octet-stream"};base64,${row.file_data}`}
        download={row.file_name}
      >
        下载 {row.file_name}
      </a>
    );
  }
  return <span className="text-xs text-zinc-500">{row.file_name}</span>;
}
