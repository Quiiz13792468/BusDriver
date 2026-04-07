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
  const arrowOverlaysRef = useRef<any[]>([]);
  const polylineSrcRef = useRef<{ lat: number; lng: number }[] | null>(null);
  const boundsInitializedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Haversine 거리 계산 (미터)
  function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 줌 레벨 → 화살표 간격 미터
  function arrowIntervalMeters(zoomLevel: number) {
    // 카카오맵 level: 숫자 클수록 축소 (1=가장 확대, 14=가장 축소)
    // level 1~3: 50m, 4~5: 150m, 6~7: 400m, 8~9: 1200m, 10+: 4000m
    if (zoomLevel <= 3) return 50;
    if (zoomLevel <= 5) return 150;
    if (zoomLevel <= 7) return 400;
    if (zoomLevel <= 9) return 1200;
    return 4000;
  }

  // 화살표만 재그리기
  function redrawArrows(map: any, kakao: any, pts: any[]) {
    // 기존 화살표 제거
    arrowOverlaysRef.current.forEach((o) => o.setMap(null));
    arrowOverlaysRef.current = [];

    if (pts.length < 2) return;

    const zoomLevel = map.getLevel();
    const intervalM = arrowIntervalMeters(zoomLevel);

    let accumulated = 0;
    let nextArrowAt = intervalM / 2;

    for (let i = 0; i < pts.length - 1; i++) {
      const from = pts[i];
      const to = pts[i + 1];

      const segM = haversineMeters(
        from.getLat(), from.getLng(),
        to.getLat(), to.getLng()
      );
      if (segM < 1) continue;

      // 방향각: 경위도 기반 (북=0, 시계방향)
      const dLng = to.getLng() - from.getLng();
      const dLat = to.getLat() - from.getLat();
      const angleDeg = Math.atan2(dLng, dLat) * (180 / Math.PI);

      while (nextArrowAt <= accumulated + segM) {
        const t = (nextArrowAt - accumulated) / segM;
        const lat = from.getLat() + dLat * t;
        const lng = from.getLng() + dLng * t;

        const svgArrow = `<div style="transform:rotate(${angleDeg}deg);width:16px;height:16px;pointer-events:none;display:flex;align-items:center;justify-content:center;">
          <svg width="12" height="16" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
            <polygon points="6,0 12,16 6,11 0,16" fill="rgba(255,255,255,0.9)"/>
          </svg>
        </div>`;

        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(lat, lng),
          content: svgArrow,
          zIndex: 3,
        });
        overlay.setMap(map);
        arrowOverlaysRef.current.push(overlay);

        nextArrowAt += intervalM;
      }

      accumulated += segM;
    }
  }

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

    // Remove existing arrow overlays
    arrowOverlaysRef.current.forEach((o) => o.setMap(null));
    arrowOverlaysRef.current = [];

    const stopsWithCoords = stops.filter((s) => s.lat != null && s.lng != null);

    // Draw polyline — routePath(도로 경로) 우선, 없으면 직선 fallback
    const polylineSrc = routePath && routePath.length > 1
      ? routePath
      : stopsWithCoords.length > 1 ? stopsWithCoords : null;

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
      polylineRef.current = mainLine;

      // 경로 포인트 저장 (zoom_changed 시 재사용)
      polylineSrcRef.current = polylineSrc;

      // 초기 화살표 그리기
      redrawArrows(map, kakao, pts);

      // 줌 변경 시 화살표 재그리기
      kakao.maps.event.addListener(map, 'zoom_changed', () => {
        const src = polylineSrcRef.current;
        if (!src) return;
        const latLngs = src.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
        redrawArrows(map, kakao, latLngs);
      });
    } else {
      polylineSrcRef.current = null;
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
