export type RelationshipMode = "couple" | "friend" | "family";

export type MemberRole = "owner" | "editor" | "viewer";

export type CheckInSource = "manual" | "map" | "qr";

export interface Space {
  id: string;
  name: string;
  relationshipMode: RelationshipMode;
  createdAt: number;
  updatedAt: number;
}

export interface SpaceMember {
  id: string;
  spaceId: string;
  displayName: string;
  role: MemberRole;
}

export interface CheckIn {
  id: string;
  spaceId: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  address?: string;
  photoDataUrl?: string;
  checkedAt: number;
  createdByMemberId: string;
  source: CheckInSource;
}

export interface AppSettingRow {
  key: string;
  value: unknown;
}

export const RELATIONSHIP_LABELS: Record<RelationshipMode, string> = {
  couple: "情侣",
  friend: "朋友",
  family: "家人",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "所有者",
  editor: "可编辑",
  viewer: "仅查看",
};

export function relationshipAccent(mode: RelationshipMode): string {
  switch (mode) {
    case "couple":
      return "#f43f5e";
    case "friend":
      return "#0ea5e9";
    case "family":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
}
