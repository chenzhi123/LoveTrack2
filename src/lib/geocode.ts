export type NominatimResult = {
  lat: number;
  lng: number;
  displayName: string;
};

/** 使用 OpenStreetMap Nominatim（请遵守使用政策；生产环境建议自建或换商业地理编码） */
export async function searchAddress(query: string): Promise<NominatimResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "zh-CN",
    },
  });
  if (!res.ok) throw new Error("地理编码请求失败");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return data.map((row) => ({
    lat: Number(row.lat),
    lng: Number(row.lon),
    displayName: row.display_name,
  }));
}
