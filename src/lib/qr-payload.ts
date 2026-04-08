/** Web 扫码解析：支持 lovetrack 路径或查询串 */

export type ParsedQrPlace = {
  lat: number;
  lng: number;
  title?: string;
  note?: string;
};

export function parseQrText(text: string): ParsedQrPlace | null {
  const trimmed = text.trim();
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    if (
      typeof obj.lat === "number" &&
      typeof obj.lng === "number"
    ) {
      return {
        lat: obj.lat,
        lng: obj.lng,
        title: typeof obj.title === "string" ? obj.title : undefined,
        note: typeof obj.note === "string" ? obj.note : undefined,
      };
    }
  } catch {
    /* 非 JSON */
  }

  try {
    const u = new URL(trimmed, "https://placeholder.local");
    const lat = Number(u.searchParams.get("lat"));
    const lng = Number(u.searchParams.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      title: u.searchParams.get("title") ?? u.searchParams.get("n") ?? undefined,
      note: u.searchParams.get("note") ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildShareCheckInUrl(lat: number, lng: number, title: string): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://lovetrack.app";
  const u = new URL("/", base);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("title", title);
  return u.toString();
}
