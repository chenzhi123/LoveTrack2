"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lovetrack_consent_v1";

async function requestMediaPermissions(): Promise<{ camera: boolean; mic: boolean }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { camera: false, mic: false };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.getTracks().forEach((t) => t.stop());
    return { camera: true, mic: true };
  } catch {
    return { camera: false, mic: false };
  }
}

async function requestDirectoryAccess(): Promise<boolean> {
  const w = window as Window &
    typeof globalThis & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    };
  if (!w.showDirectoryPicker) return false;
  try {
    await w.showDirectoryPicker();
    return true;
  } catch {
    return false;
  }
}

export function FirstVisitConsent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          使用授权
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          为使用拍照打卡、语音备注与选择本地文件，需要浏览器授权摄像头、麦克风与文件访问。
          点击下方按钮后，系统将依次请求相关权限；您可在浏览器设置中随时撤回。
        </p>
        {status ? (
          <p className="mt-3 rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {status}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => {
              void (async () => {
                setBusy(true);
                setStatus(null);
                const media = await requestMediaPermissions();
                const dir = await requestDirectoryAccess();
                const parts: string[] = [];
                if (media.camera && media.mic) {
                  parts.push("已获取摄像头与麦克风（预览已立即关闭，不会常驻占用）。");
                } else {
                  parts.push(
                    "摄像头/麦克风未全部授权：可在使用扫码或录音功能时再次允许。",
                  );
                }
                if (dir) {
                  parts.push("已选择可访问的本地文件夹（支持 File System Access API 的浏览器）。");
                } else {
                  parts.push(
                    "未选择文件夹或浏览器不支持目录访问：仍可通过「选择文件」上传。",
                  );
                }
                setStatus(parts.join(""));
                setBusy(false);
                window.setTimeout(() => finish(), 900);
              })();
            }}
          >
            一键同意并申请权限
          </button>
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            onClick={() => finish()}
          >
            暂不授权，直接进入
          </button>
        </div>
      </div>
    </div>
  );
}
