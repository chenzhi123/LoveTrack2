"use client";

import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { afterMutation, hasFirstRewardClaimed } from "@/hooks/use-hydrate-data";
import { db } from "@/lib/db";
import { searchAddress } from "@/lib/geocode";
import { parseQrText } from "@/lib/qr-payload";
import { useAppStore } from "@/store/use-app-store";
import type { CheckInSource } from "@/types/models";

const QrScanner = dynamic(
  () => import("./qr-scanner").then((m) => m.QrScanner),
  { ssr: false },
);

type Tab = "address" | "map" | "qr";

export function AddCheckInDrawer({
  open,
  onClose,
  spaceId,
  prefill,
  onPrefillConsumed,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: string | null;
  prefill?: { lat: number; lng: number; title?: string } | null;
  onPrefillConsumed?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("address");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [lat, setLat] = useState(39.9042);
  const [lng, setLng] = useState(116.4074);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [checkedAt, setCheckedAt] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [error, setError] = useState<string | null>(null);
  const { setShowReward, bumpMapFly } = useAppStore();

  useEffect(() => {
    if (!open || !prefill) return;
    setLat(prefill.lat);
    setLng(prefill.lng);
    if (prefill.title) setTitle(prefill.title);
    setTab("map");
    onPrefillConsumed?.();
  }, [open, prefill, onPrefillConsumed]);

  const reset = useCallback(() => {
    setTab("address");
    setTitle("");
    setNote("");
    setAddressQuery("");
    setLat(39.9042);
    setLng(116.4074);
    setResolvedAddress("");
    setPhotoDataUrl(undefined);
    setCheckedAt(new Date().toISOString().slice(0, 16));
    setError(null);
  }, []);

  const close = () => {
    reset();
    onClose();
  };

  if (!open || !spaceId) return null;

  const onSearchAddress = async () => {
    setSearching(true);
    setError(null);
    try {
      const results = await searchAddress(addressQuery);
      if (results.length === 0) {
        setError("未找到地点，请换关键词试试");
        return;
      }
      const top = results[0];
      setLat(top.lat);
      setLng(top.lng);
      setResolvedAddress(top.displayName);
      if (!title.trim()) setTitle(addressQuery.trim());
    } catch {
      setError("网络或地理编码服务不可用");
    } finally {
      setSearching(false);
    }
  };

  const save = async (source: CheckInSource) => {
    if (!spaceId) return;
    if (!title.trim()) {
      setError("请填写地点名称");
      return;
    }
    setError(null);
    const me = await db.members
      .where("spaceId")
      .equals(spaceId)
      .and((m) => m.displayName === "我")
      .first();
    const memberId = me?.id ?? (await db.members.where("spaceId").equals(spaceId).first())?.id;
    if (!memberId) {
      setError("成员数据异常");
      return;
    }
    const ts = new Date(checkedAt).getTime();
    const id = nanoid();
    await db.checkIns.add({
      id,
      spaceId,
      title: title.trim(),
      note: note.trim(),
      lat,
      lng,
      address: resolvedAddress || undefined,
      photoDataUrl,
      checkedAt: Number.isFinite(ts) ? ts : Date.now(),
      createdByMemberId: memberId,
      source,
    });
    const count = await db.checkIns.where("spaceId").equals(spaceId).count();
    const claimed = await hasFirstRewardClaimed();
    if (count === 1 && !claimed) {
      setShowReward(true);
    }
    await afterMutation(spaceId);
    bumpMapFly();
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <h2 className="text-base font-semibold">添加打卡</h2>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            onClick={close}
          >
            关闭
          </button>
        </div>

        <div className="flex gap-1 border-b border-zinc-100 px-2 py-2 dark:border-zinc-800">
          {(
            [
              ["address", "地址搜索"],
              ["map", "地图选点"],
              ["qr", "扫码打卡"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                tab === k
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 px-4 py-4">
          {tab === "address" && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-500">搜索地址</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="例如：上海外滩"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                />
                <button
                  type="button"
                  disabled={searching}
                  onClick={() => void onSearchAddress()}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {searching ? "搜索中" : "搜索"}
                </button>
              </div>
              {resolvedAddress ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{resolvedAddress}</p>
              ) : null}
            </div>
          )}

          {tab === "map" && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                输入大致经纬度或在手机上用「地址搜索」定位后微调数值。
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-zinc-500">
                  纬度
                  <input
                    type="number"
                    step="0.0001"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs text-zinc-500">
                  经度
                  <input
                    type="number"
                    step="0.0001"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          )}

          {tab === "qr" && (
            <QrScanner
              onDecoded={(text) => {
                const p = parseQrText(text);
                if (!p) {
                  setError("无法识别打卡二维码");
                  return;
                }
                setLat(p.lat);
                setLng(p.lng);
                if (p.title) setTitle(p.title);
                if (p.note) setNote(p.note);
                setTab("map");
                setError(null);
              }}
              onError={(msg) => setError(msg)}
            />
          )}

          <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <label className="block text-xs font-medium text-zinc-500">地点名称</label>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这次足迹起个名字"
            />
            <label className="block text-xs font-medium text-zinc-500">备注</label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录当时的心情或小故事…"
            />
            <label className="block text-xs font-medium text-zinc-500">打卡时间</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={checkedAt}
              onChange={(e) => setCheckedAt(e.target.value)}
            />
            <label className="block text-xs font-medium text-zinc-500">照片（可选）</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) {
                  setPhotoDataUrl(undefined);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  setPhotoDataUrl(typeof reader.result === "string" ? reader.result : undefined);
                };
                reader.readAsDataURL(f);
              }}
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="button"
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg"
            onClick={() => {
              const source: CheckInSource =
                tab === "qr" ? "qr" : tab === "map" ? "map" : "manual";
              void save(source);
            }}
          >
            保存打卡
          </button>
        </div>
      </div>
    </div>
  );
}
