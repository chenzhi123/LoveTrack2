import { create } from "zustand";
import type { CheckIn, Space } from "@/types/models";

export type ViewMode = "map" | "list";

export type DateFilter = "all" | "7d" | "30d" | "year" | "custom";

type State = {
  hydrated: boolean;
  activeSpaceId: string | null;
  spaces: Space[];
  checkIns: CheckIn[];
  selectedCheckInId: string | null;
  viewMode: ViewMode;
  dateFilter: DateFilter;
  customRange: { start: number; end: number } | null;
  listScrollToken: number;
  mapFlyToken: number;
  syncMessage: string | null;
  showTutorial: boolean;
  showReward: boolean;
  canEditActiveSpace: boolean;
  setHydrated: (v: boolean) => void;
  setSpaces: (s: Space[]) => void;
  setCheckIns: (c: CheckIn[]) => void;
  setActiveSpaceId: (id: string | null) => void;
  setSelectedCheckInId: (id: string | null) => void;
  setViewMode: (m: ViewMode) => void;
  setDateFilter: (f: DateFilter) => void;
  setCustomRange: (r: { start: number; end: number } | null) => void;
  bumpListScroll: () => void;
  bumpMapFly: () => void;
  setSyncMessage: (m: string | null) => void;
  setShowTutorial: (v: boolean) => void;
  setShowReward: (v: boolean) => void;
  setCanEditActiveSpace: (v: boolean) => void;
};

export const useAppStore = create<State>((set) => ({
  hydrated: false,
  activeSpaceId: null,
  spaces: [],
  checkIns: [],
  selectedCheckInId: null,
  viewMode: "map",
  dateFilter: "all",
  customRange: null,
  listScrollToken: 0,
  mapFlyToken: 0,
  syncMessage: null,
  showTutorial: false,
  showReward: false,
  canEditActiveSpace: true,
  setHydrated: (v) => set({ hydrated: v }),
  setSpaces: (spaces) => set({ spaces }),
  setCheckIns: (checkIns) => set({ checkIns }),
  setActiveSpaceId: (activeSpaceId) => set({ activeSpaceId }),
  setSelectedCheckInId: (selectedCheckInId) => set({ selectedCheckInId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDateFilter: (dateFilter) => set({ dateFilter }),
  setCustomRange: (customRange) => set({ customRange }),
  bumpListScroll: () =>
    set((s) => ({ listScrollToken: s.listScrollToken + 1 })),
  bumpMapFly: () => set((s) => ({ mapFlyToken: s.mapFlyToken + 1 })),
  setSyncMessage: (syncMessage) => set({ syncMessage }),
  setShowTutorial: (showTutorial) => set({ showTutorial }),
  setShowReward: (showReward) => set({ showReward }),
  setCanEditActiveSpace: (canEditActiveSpace) => set({ canEditActiveSpace }),
}));
