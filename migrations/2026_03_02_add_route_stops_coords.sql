-- 노선 정류장에 카카오맵 좌표 및 설명 컬럼 추가

ALTER TABLE route_stops
  ADD COLUMN IF NOT EXISTS lat         double precision,  -- 위도 (예: 37.5665)
  ADD COLUMN IF NOT EXISTS lng         double precision,  -- 경도 (예: 126.9780)
  ADD COLUMN IF NOT EXISTS description text;              -- 정류장 설명 (예: 정문 기준 오른쪽)
