"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  onDecoded: (text: string) => void;
  onError?: (message: string) => void;
};

export function QrScanner({ onDecoded, onError }: Props) {
  const regionId = "qr-reader-lovetrack";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cbRef = useRef(onDecoded);
  const errRef = useRef(onError);
  const [starting, setStarting] = useState(true);

  cbRef.current = onDecoded;
  errRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            cbRef.current(decoded);
          },
          () => {
            /* 帧无码，忽略 */
          },
        );
      } catch (e) {
        if (!cancelled) {
          errRef.current?.(e instanceof Error ? e.message : "无法打开摄像头");
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        id={regionId}
        className="overflow-hidden rounded-xl border border-zinc-200 bg-black dark:border-zinc-700"
      />
      {starting ? (
        <p className="text-center text-xs text-zinc-500">正在请求摄像头权限…</p>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          将情侣/好友分享的打卡二维码对准取景框
        </p>
      )}
    </div>
  );
}
