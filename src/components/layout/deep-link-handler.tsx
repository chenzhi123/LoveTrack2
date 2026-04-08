"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 处理分享链接 ?lat=&lng=&title= 预填打开添加打卡（由父组件传入 setter）
 */
export function DeepLinkHandler({
  onPlaceFromQuery,
}: {
  onPlaceFromQuery: (p: { lat: number; lng: number; title?: string }) => void;
}) {
  const params = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const title = params.get("title") ?? params.get("n") ?? undefined;
    done.current = true;
    onPlaceFromQuery({ lat, lng, title });
  }, [params, onPlaceFromQuery]);

  return null;
}
