"use client";

import { useEffect, useRef, useState } from 'react';
import type { RouteStopRecord } from '@/lib/data/types';

declare global {
  interface Window {
    kakao: any;
  }
}

type KakaoMapProps = {
  stops: RouteStopRecord[];
  onUpdateCoords?: (stopId: string, lat: number, lng: number) => void;
  readOnly?: boolean;
  highlightedStopName?: string;
};

export function KakaoMap({ stops, onUpdateCoords, readOnly = false, highlightedStopName }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const selectedStopRef = useRef<string | null>(null);
  const boundsInitializedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const hasKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);

  // Sync selected stop to ref (avoids stale closure in map click)
  useEffect(() => {
    selectedStopRef.current = selectedStop;
  }, [selectedStop]);

  // Load Kakao Maps SDK
  useEffect(() => {
    if (!hasKey) return;

    const initMap = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setLoaded(true));
      }
    };

    // Already loaded
    if (window.kakao) {
      initMap();
      return;
    }

    // Script may already be injected (SPA re-navigation)
    let script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'kakao-maps-sdk';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
      document.head.appendChild(script);
    }

    const handleLoad = () => initMap();
    script.addEventListener('load', handleLoad);
    return () => script?.removeEventListener('load', handleLoad);
  }, [hasKey]);

  // Initialize map instance
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const { kakao } = window;
    const stopsWithCoords = stops.filter((s) => s.lat !== null && s.lng !== null);
    const centerLat = stopsWithCoords[0]?.lat ?? 37.5665;
    const centerLng = stopsWithCoords[0]?.lng ?? 126.978;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 5,
    });
    mapInstanceRef.current = map;
    if (!readOnly) {
      kakao.maps.event.addListener(map, 'click', (e: any) => {
        const stopId = selectedStopRef.current;
        if (!stopId || !onUpdateCoords) return;
        onUpdateCoords(stopId, e.latLng.getLat(), e.latLng.getLng());
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Redraw markers when stops change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;
    const { kakao } = window;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    const stopsWithCoords = stops.filter((s) => s.lat !== null && s.lng !== null);
    stopsWithCoords.forEach((stop) => {
      const idx = stops.findIndex((s) => s.id === stop.id);
      const position = new kakao.maps.LatLng(stop.lat!, stop.lng!);
      const isHighlighted = highlightedStopName && stop.name === highlightedStopName;
      const bg = isHighlighted ? '#F59E0B' : '#3B82F6';
      const size = isHighlighted ? '32px' : '26px';
      const content = `<div style="background:${bg};color:#fff;border-radius:50%;width:${size};height:${size};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${idx + 1}</div>`;
      const overlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 1 });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
    if (!boundsInitializedRef.current && stopsWithCoords.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      stopsWithCoords.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat!, s.lng!)));
      map.setBounds(bounds);
      boundsInitializedRef.current = true;
    }
  }, [stops, loaded, highlightedStopName]);

  return (
    <div className="space-y-3">
      {!readOnly && stops.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-500">정차 지점 선택 후 지도를 클릭하면 마커가 설정됩니다.</p>
          <div className="flex flex-wrap gap-1.5">
            {stops.map((stop, idx) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => setSelectedStop((prev) => (prev === stop.id ? null : stop.id))}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  selectedStop === stop.id
                    ? 'border-primary-400 bg-primary-600 text-white'
                    : stop.lat !== null
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                {idx + 1}. {stop.name}
                {stop.lat !== null ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {selectedStop && (
            <p className="mt-1.5 text-xs font-medium text-primary-600">지도를 클릭해 마커 위치를 지정하세요</p>
          )}
        </div>
      )}
      <div className="relative">
        <div ref={mapRef} className="h-64 w-full rounded-2xl border border-slate-200 bg-slate-100 sm:h-80" />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-100">
            {hasKey ? (
              <p className="text-sm text-slate-500">지도 로딩 중...</p>
            ) : (
              <div className="px-4 text-center">
                <p className="text-sm font-medium text-slate-600">카카오맵 API 키가 설정되지 않았습니다</p>
                <p className="mt-1 text-xs text-slate-500">NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수를 추가해주세요</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
