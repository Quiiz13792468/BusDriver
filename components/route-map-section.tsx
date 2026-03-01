"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { RouteStopRecord } from '@/lib/data/types';
import { KakaoMap } from '@/components/kakao-map';
import { updateStopCoordsAction } from '@/app/(protected)/routes/actions.clean';

export function RouteMapSection({
  routeId,
  initialStops,
}: {
  routeId: string;
  initialStops: RouteStopRecord[];
}) {
  const [stops, setStops] = useState(initialStops);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUpdateCoords(stopId: string, lat: number, lng: number) {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, lat, lng } : s)));
    startTransition(async () => {
      await updateStopCoordsAction(stopId, routeId, lat, lng);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {isPending && <p className="text-xs font-medium text-primary-600">위치 저장 중...</p>}
      <KakaoMap stops={stops} onUpdateCoords={handleUpdateCoords} />
    </div>
  );
}
