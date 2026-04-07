"use client";

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  stops?: Array<{ id?: string; name: string; lat: number; lng: number; position: number }>;
  routePath?: { lat: number; lng: number }[];
  onStopDragEnd?: (stopId: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  highlightStopId?: string;
  readonly?: boolean;
  height?: string;
}

export function KakaoMap({
  stops = [],
  routePath,
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
  const [authError, setAuthError] = useState(false);

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
    const handleError = () => setAuthError(true);
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    return () => {
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };
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
      draggable: true,
    });
    mapInstanceRef.current = map;

    // Ensure map drag is always re-enabled on mouseup/touchend at document level
    const restoreDrag = () => {
      map.setDraggable(true);
    };
    document.addEventListener('mouseup', restoreDrag);
    document.addEventListener('touchend', restoreDrag);

    kakao.maps.event.addListener(map, 'click', (e: any) => {
      onMapClickRef.current?.(e.latLng.getLat(), e.latLng.getLng());
    });

    return () => {
      document.removeEventListener('mouseup', restoreDrag);
      document.removeEventListener('touchend', restoreDrag);
    };
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

    // Draw polyline — routePath(도로 경로) 우선, 없으면 직선 fallback
    const polylineSrc = routePath && routePath.length > 1
      ? routePath
      : stopsWithCoords.length > 1 ? stopsWithCoords : null;

    const arrowOverlays: any[] = [];

    if (polylineSrc && polylineSrc.length > 1) {
      const pts = polylineSrc.map((p) => new kakao.maps.LatLng(p.lat, p.lng));

      // 전체 경로 폴리라인
      const mainLine = new kakao.maps.Polyline({
        path: pts,
        strokeWeight: 6,
        strokeColor: '#0f6d5d',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
      });
      mainLine.setMap(map);
      arrowOverlays.push(mainLine);

      // 방향 화살표: 경로 위에 회전된 삼각형 오버레이를 일정 간격으로 배치
      const ARROW_INTERVAL_PX = 90;
      const proj = map.getProjection();

      let accumulated = 0;
      let nextArrowAt = ARROW_INTERVAL_PX / 2; // 첫 화살표는 절반 간격 후

      for (let i = 0; i < pts.length - 1; i++) {
        const from = pts[i];
        const to = pts[i + 1];

        const fp = proj.containerPointFromCoords(from);
        const tp = proj.containerPointFromCoords(to);
        const dx = tp.x - fp.x;
        const dy = tp.y - fp.y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen < 1) continue;

        // 이 세그먼트의 방향각 (라디안 → 도, 북=0 기준)
        // 화면 좌표계: x=동, y=남 → 각도 보정 필요
        const angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);

        while (nextArrowAt <= accumulated + segLen) {
          const t = (nextArrowAt - accumulated) / segLen;
          const lat = from.getLat() + (to.getLat() - from.getLat()) * t;
          const lng = from.getLng() + (to.getLng() - from.getLng()) * t;

          // 회전된 삼각형 SVG 화살표
          const svgArrow = `<div style="transform:rotate(${angleDeg}deg);width:14px;height:14px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="7,1 13,13 7,10 1,13" fill="#ffffff" fill-opacity="0.95"/>
            </svg>
          </div>`;

          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(lat, lng),
            content: svgArrow,
            zIndex: 2,
          });
          overlay.setMap(map);
          arrowOverlays.push(overlay);

          nextArrowAt += ARROW_INTERVAL_PX;
        }

        accumulated += segLen;
      }

      // cleanup용 통합 ref
      polylineRef.current = {
        setMap: (m: any) => arrowOverlays.forEach((o) => o.setMap(m)),
      };
    }

    // Draw numbered markers
    stopsWithCoords.forEach((stop, idx) => {
      const position = new kakao.maps.LatLng(stop.lat, stop.lng);
      const isHighlighted = highlightStopId != null && stop.id === highlightStopId;
      const bg = isHighlighted ? '#F59E0B' : '#0f6d5d';
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
  }, [stops, routePath, loaded, highlightStopId, readonly]);

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="h-full w-full rounded-2xl border border-slate-200 bg-slate-100" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-100">
          {authError ? (
            <div className="px-4 text-center">
              <p className="text-sm font-medium text-slate-600">카카오맵 인증에 실패했습니다</p>
              <p className="mt-1 text-xs text-slate-500">Kakao Developers 콘솔에서 지도/로컬 서비스를 활성화해주세요</p>
            </div>
          ) : hasKey ? (
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
