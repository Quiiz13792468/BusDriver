"use client";

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  stops?: Array<{ id?: string; name: string; lat: number; lng: number; position: number }>;
  onStopDragEnd?: (stopId: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  highlightStopId?: string;
  readonly?: boolean;
  height?: string;
}

export function KakaoMap({
  stops = [],
  onStopDragEnd,
  onMapClick,
  highlightStopId,
  readonly = false,
  height = '300px',
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const dragCleanupRef = useRef<(() => void)[]>([]);
  const polylineRef = useRef<any>(null);
  const boundsInitializedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const hasKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);

  // Load Kakao Maps SDK
  useEffect(() => {
    if (!hasKey) return;

    const initMap = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setLoaded(true));
      }
    };

    if (window.kakao) {
      initMap();
      return;
    }

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

  // Stable callback refs to avoid stale closures
  const onStopDragEndRef = useRef(onStopDragEnd);
  useEffect(() => { onStopDragEndRef.current = onStopDragEnd; }, [onStopDragEnd]);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // Initialize map instance
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const { kakao } = window;
    const stopsWithCoords = stops.filter((s) => s.lat != null && s.lng != null);
    const centerLat = stopsWithCoords[0]?.lat ?? 37.5665;
    const centerLng = stopsWithCoords[0]?.lng ?? 126.978;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 5,
    });
    mapInstanceRef.current = map;

    kakao.maps.event.addListener(map, 'click', (e: any) => {
      onMapClickRef.current?.(e.latLng.getLat(), e.latLng.getLng());
    });
  }, [loaded]);

  // Redraw markers and polyline when stops change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !loaded) return;
    const { kakao } = window;

    // Cleanup drag listeners from previous render
    dragCleanupRef.current.forEach((fn) => fn());
    dragCleanupRef.current = [];

    // Remove existing overlays
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const stopsWithCoords = stops.filter((s) => s.lat != null && s.lng != null);

    // Draw polyline
    if (stopsWithCoords.length > 1) {
      const path = stopsWithCoords.map((s) => new kakao.maps.LatLng(s.lat, s.lng));
      const polyline = new kakao.maps.Polyline({
        path,
        strokeWeight: 4,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.7,
        strokeStyle: 'solid',
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    // Draw numbered markers
    stopsWithCoords.forEach((stop, idx) => {
      const position = new kakao.maps.LatLng(stop.lat, stop.lng);
      const isHighlighted = highlightStopId != null && stop.id === highlightStopId;
      const bg = isHighlighted ? '#F59E0B' : '#3B82F6';
      const size = isHighlighted ? '32px' : '26px';
      const num = stop.position + 1;

      // Wrapper div needed for drag events on CustomOverlay
      const wrapperId = `kakao-marker-${stop.id ?? idx}`;
      const content = `<div id="${wrapperId}" style="background:${bg};color:#fff;border-radius:50%;width:${size};height:${size};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:${readonly ? 'default' : 'grab'}">${num}</div>`;

      const overlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 1 });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);

      // Enable drag-to-reposition when not readonly and stop has an id
      if (!readonly && stop.id && onStopDragEndRef.current) {
        // Use mouse events on the rendered DOM node after overlay is drawn
        const attachDrag = () => {
          const el = document.getElementById(wrapperId);
          if (!el) return;

          let dragging = false;
          let startX = 0;
          let startY = 0;

          const onMove = (clientX: number, clientY: number) => {
            if (!dragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            startX = clientX;
            startY = clientY;

            const proj = map.getProjection();
            const currentLatLng = overlay.getPosition();
            const point = proj.containerPointFromCoords(currentLatLng);
            const newPoint = new kakao.maps.Point(point.x + dx, point.y + dy);
            const newLatLng = proj.coordsFromContainerPoint(newPoint);
            overlay.setPosition(newLatLng);
          };

          const onEnd = () => {
            if (!dragging) return;
            dragging = false;
            map.setDraggable(true);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);

            const finalLatLng = overlay.getPosition();
            onStopDragEndRef.current?.(stop.id!, finalLatLng.getLat(), finalLatLng.getLng());
          };

          const onMouseMove = (me: MouseEvent) => onMove(me.clientX, me.clientY);
          const onMouseUp = (_ue: MouseEvent) => onEnd();

          const onTouchMove = (te: TouchEvent) => {
            te.preventDefault();
            onMove(te.touches[0].clientX, te.touches[0].clientY);
          };
          const onTouchEnd = (te: TouchEvent) => {
            onMove(te.changedTouches[0].clientX, te.changedTouches[0].clientY);
            onEnd();
          };

          const onMouseDown = (e: MouseEvent) => {
            e.stopPropagation();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;

            map.setDraggable(false);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          };

          const onTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;

            map.setDraggable(false);
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
          };

          el.addEventListener('mousedown', onMouseDown);
          el.addEventListener('touchstart', onTouchStart, { passive: false });
          dragCleanupRef.current.push(() => {
            el.removeEventListener('mousedown', onMouseDown);
            el.removeEventListener('touchstart', onTouchStart);
          });
        };

        // Defer to allow the overlay DOM to render
        requestAnimationFrame(attachDrag);
      }
    });

    // Fit bounds on first render
    if (!boundsInitializedRef.current && stopsWithCoords.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      stopsWithCoords.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)));
      map.setBounds(bounds);
      boundsInitializedRef.current = true;
    }
  }, [stops, loaded, highlightStopId, readonly]);

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="h-full w-full rounded-2xl border border-slate-200 bg-slate-100" />
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
  );
}
