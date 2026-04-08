"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import { filterCheckInsByDate } from "@/lib/date-filter";
import { useAppStore } from "@/store/use-app-store";
import type { CheckIn } from "@/types/models";
import { relationshipAccent } from "@/types/models";
import type { Space } from "@/types/models";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type ClusterFeature = GeoJSON.Feature<GeoJSON.Point> & {
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    checkIn?: CheckIn;
  };
};

function pinColor(space: Space | undefined): string {
  return space ? relationshipAccent(space.relationshipMode) : "#6366f1";
}

export function FootprintMap({ space }: { space: Space | undefined }) {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const {
    checkIns,
    selectedCheckInId,
    setSelectedCheckInId,
    bumpListScroll,
    mapFlyToken,
    dateFilter,
    customRange,
  } = useAppStore();

  const visibleCheckIns = useMemo(
    () => filterCheckInsByDate(checkIns, dateFilter, customRange),
    [checkIns, dateFilter, customRange],
  );

  useEffect(() => {
    if (
      selectedCheckInId &&
      !visibleCheckIns.some((c) => c.id === selectedCheckInId)
    ) {
      setSelectedCheckInId(null);
    }
  }, [visibleCheckIns, selectedCheckInId, setSelectedCheckInId]);

  const [viewState, setViewState] = useState({
    longitude: 116.391,
    latitude: 39.907,
    zoom: 4,
  });

  const points = useMemo(() => {
    return visibleCheckIns.map((c) => ({
      type: "Feature" as const,
      properties: { checkIn: c },
      geometry: {
        type: "Point" as const,
        coordinates: [c.lng, c.lat],
      },
    }));
  }, [visibleCheckIns]);

  const index = useMemo(() => {
    const sc = new Supercluster<{ checkIn: CheckIn }>({
      radius: 72,
      maxZoom: 20,
    });
    sc.load(points as GeoJSON.Feature<GeoJSON.Point, { checkIn: CheckIn }>[]);
    return sc;
  }, [points]);

  const [clusters, setClusters] = useState<ClusterFeature[]>([]);

  const updateClusters = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    const z = Math.floor(map.getZoom());
    const next = index.getClusters(bbox, z) as ClusterFeature[];
    setClusters(next);
  }, [index]);

  useEffect(() => {
    updateClusters();
  }, [visibleCheckIns, updateClusters, viewState.zoom, viewState.longitude, viewState.latitude]);

  useEffect(() => {
    if (visibleCheckIns.length === 0) return;
    const sel = visibleCheckIns.find((c) => c.id === selectedCheckInId);
    const target = sel ?? visibleCheckIns[0];
    mapRef.current?.flyTo({
      center: [target.lng, target.lat],
      zoom: Math.max(viewState.zoom, 12),
      duration: 900,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应外部联动 token
  }, [mapFlyToken]);

  const mapStyle = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={updateClusters}
        onLoad={updateClusters}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        reuseMaps
      >
        <div className="absolute right-3 top-3 z-10">
          <NavigationControl showCompass={false} />
        </div>
        {clusters.map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          const { cluster_id, point_count, checkIn } = f.properties;
          if (f.properties.cluster && cluster_id != null && point_count != null) {
            return (
              <Marker
                key={`c-${cluster_id}-${point_count}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
              >
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-zinc-900/85 text-sm font-semibold text-white shadow-lg backdrop-blur-sm dark:bg-white/90 dark:text-zinc-900"
                  onClick={() => {
                    const expansionZoom = Math.min(
                      index.getClusterExpansionZoom(cluster_id),
                      20,
                    );
                    mapRef.current?.easeTo({
                      center: [lng, lat],
                      zoom: expansionZoom,
                      duration: 500,
                    });
                  }}
                >
                  {point_count}
                </button>
              </Marker>
            );
          }
          if (!checkIn) return null;
          const active = checkIn.id === selectedCheckInId;
          const color = pinColor(space);
          return (
            <Marker key={checkIn.id} longitude={lng} latitude={lat} anchor="bottom">
              <button
                type="button"
                aria-label={checkIn.title}
                className="group flex flex-col items-center"
                onClick={() => {
                  setSelectedCheckInId(checkIn.id);
                  bumpListScroll();
                }}
              >
                <span
                  className="relative flex h-4 w-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: color,
                    boxShadow: active
                      ? `0 0 22px 8px ${color}88, 0 0 4px ${color}`
                      : `0 0 16px 4px ${color}66`,
                  }}
                />
                <span className="mt-0.5 h-3 w-0.5 rounded-full bg-white/90 shadow-sm" />
              </button>
            </Marker>
          );
        })}
      </Map>
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-zinc-500 dark:text-zinc-400">
        © OpenStreetMap · CARTO · 数据离线保存在本机
      </p>
    </div>
  );
}
