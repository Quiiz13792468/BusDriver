'use client';

import { useState, useCallback } from 'react';
import { KakaoMap } from '@/components/kakao-map';
import { RouteStopsEditor } from '@/components/route-stops-editor';

interface StopItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  position: number;
  description?: string | null;
}

interface RouteBuilderProps {
  routeId: string;
  initialStops: StopItem[];
  readonly?: boolean;
  highlightStopId?: string;
  onReorder: (stops: Array<{ id: string; position: number }>) => Promise<void>;
  onAdd: (name: string, lat: number, lng: number) => Promise<void>;
  onDelete: (stopId: string) => Promise<void>;
  onUpdate: (stopId: string, data: { name?: string; description?: string }) => Promise<void>;
  onStopDragEnd: (stopId: string, lat: number, lng: number) => Promise<void>;
}

export function RouteBuilder({
  routeId,
  initialStops,
  readonly = false,
  highlightStopId,
  onReorder,
  onAdd,
  onDelete,
  onUpdate,
  onStopDragEnd,
}: RouteBuilderProps) {
  const [stops, setStops] = useState<StopItem[]>(initialStops);
  const [pendingLat, setPendingLat] = useState<number | null>(null);
  const [pendingLng, setPendingLng] = useState<number | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (readonly) return;
    setPendingLat(lat);
    setPendingLng(lng);
  }, [readonly]);

  const handleDragEnd = useCallback(async (stopId: string, lat: number, lng: number) => {
    setStops((prev) => prev.map((s) => s.id === stopId ? { ...s, lat, lng } : s));
    await onStopDragEnd(stopId, lat, lng);
  }, [onStopDragEnd]);

  return (
    <div className="flex flex-col gap-4">
      <KakaoMap
        stops={stops}
        onStopDragEnd={readonly ? undefined : handleDragEnd}
        onMapClick={readonly ? undefined : handleMapClick}
        highlightStopId={highlightStopId}
        readonly={readonly}
        height="300px"
      />
      {!readonly && (
        <RouteStopsEditor
          stops={stops}
          pendingLat={pendingLat}
          pendingLng={pendingLng}
          onReorder={async (reordered) => {
            setStops((prev) => {
              const posMap = new Map(reordered.map((r) => [r.id, r.position]));
              return [...prev]
                .map((s) => ({ ...s, position: posMap.get(s.id) ?? s.position }))
                .sort((a, b) => a.position - b.position);
            });
            await onReorder(reordered);
          }}
          onAdd={async (name, lat, lng) => {
            await onAdd(name, lat, lng);
            setPendingLat(null);
            setPendingLng(null);
          }}
          onDelete={async (stopId) => {
            setStops((prev) => prev.filter((s) => s.id !== stopId));
            await onDelete(stopId);
          }}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
