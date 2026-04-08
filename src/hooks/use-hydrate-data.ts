"use client";

import { useEffect } from "react";
import {
  db,
  ensureSeedData,
  getSetting,
  pushCloudMirror,
  setSetting,
} from "@/lib/db";
import { useAppStore } from "@/store/use-app-store";
import type { CheckIn, Space, SpaceMember } from "@/types/models";

async function loadAll(preferredSpaceId: string | null) {
  const spaces = await db.spaces.orderBy("updatedAt").reverse().toArray();
  const sid =
    preferredSpaceId && spaces.some((s) => s.id === preferredSpaceId)
      ? preferredSpaceId
      : spaces[0]?.id ?? null;
  let checkIns: CheckIn[] = [];
  if (sid) {
    checkIns = await db.checkIns.where("spaceId").equals(sid).sortBy("checkedAt");
    checkIns.reverse();
  }
  return { spaces, sid, checkIns };
}

export function useHydrateData() {
  const {
    setHydrated,
    setSpaces,
    setCheckIns,
    setActiveSpaceId,
    setShowTutorial,
    setCanEditActiveSpace,
  } = useAppStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureSeedData();
      const tutorialDone = await getSetting("tutorialCompleted", false);
      const savedSid = await getSetting<string | null>("activeSpaceId", null);
      const { spaces, sid, checkIns } = await loadAll(savedSid);
      if (cancelled) return;
      setSpaces(spaces);
      setActiveSpaceId(sid);
      if (sid) await setSetting("activeSpaceId", sid);
      setCheckIns(checkIns);
      setShowTutorial(!tutorialDone);
      setHydrated(true);

      if (sid) {
        const me = await db.members
          .where("spaceId")
          .equals(sid)
          .and((m) => m.displayName === "我")
          .first();
        const role = me?.role ?? "owner";
        setCanEditActiveSpace(role === "owner" || role === "editor");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    setActiveSpaceId,
    setCheckIns,
    setHydrated,
    setShowTutorial,
    setSpaces,
    setCanEditActiveSpace,
  ]);

  return null;
}

export async function refreshSpaceData(spaceId: string) {
  const checkIns = await db.checkIns.where("spaceId").equals(spaceId).sortBy("checkedAt");
  checkIns.reverse();
  useAppStore.getState().setCheckIns(checkIns);
  const me = await db.members
    .where("spaceId")
    .equals(spaceId)
    .and((m: SpaceMember) => m.displayName === "我")
    .first();
  const role = me?.role ?? "owner";
  useAppStore.getState().setCanEditActiveSpace(role === "owner" || role === "editor");
}

export async function afterMutation(spaceId: string) {
  const space = await db.spaces.get(spaceId);
  if (space) {
    await db.spaces.update(spaceId, { updatedAt: Date.now() });
  }
  await pushCloudMirror();
  await refreshSpaceData(spaceId);
}

export async function switchSpace(space: Space) {
  await setSetting("activeSpaceId", space.id);
  useAppStore.getState().setActiveSpaceId(space.id);
  await refreshSpaceData(space.id);
}

export async function completeTutorial() {
  await setSetting("tutorialCompleted", true);
  useAppStore.getState().setShowTutorial(false);
}

export async function markFirstRewardDone() {
  await setSetting("firstCheckInRewardClaimed", true);
  useAppStore.getState().setShowReward(false);
}

export async function hasFirstRewardClaimed(): Promise<boolean> {
  return getSetting("firstCheckInRewardClaimed", false);
}
