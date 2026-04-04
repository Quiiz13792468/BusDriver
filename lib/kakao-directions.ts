import 'server-only';

export interface DirectionsStop {
  lat: number;
  lng: number;
}

const REST_API_KEY = process.env.KAKAO_REST_API_KEY ?? '';
const MAX_CHUNK = 7; // origin + 5 waypoints + destination

async function fetchSegment(stops: DirectionsStop[]): Promise<{ lat: number; lng: number }[]> {
  const origin = `${stops[0].lng},${stops[0].lat}`;
  const destination = `${stops[stops.length - 1].lng},${stops[stops.length - 1].lat}`;
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.lng},${s.lat}`)
    .join('|');

  const params = new URLSearchParams({ origin, destination });
  if (waypoints) params.set('waypoints', waypoints);

  const url = `https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[kakao-directions] HTTP ${res.status}: ${body}`);
    return [];
  }

  const data = await res.json();

  // result_code != 0 means routing error (e.g. 104 = no route, 2001 = service unavailable)
  const resultCode = data.routes?.[0]?.result_code;
  if (resultCode !== 0) {
    console.error(`[kakao-directions] result_code=${resultCode}`, data.routes?.[0]?.result_msg ?? '');
    return [];
  }

  const sections: any[] = data.routes?.[0]?.sections ?? [];
  const coords: { lat: number; lng: number }[] = [];

  for (const section of sections) {
    for (const road of section.roads ?? []) {
      const vx: number[] = road.vertexes ?? [];
      for (let i = 0; i + 1 < vx.length; i += 2) {
        coords.push({ lng: vx[i], lat: vx[i + 1] });
      }
    }
  }
  return coords;
}

export async function getRoutePath(
  stops: DirectionsStop[]
): Promise<{ lat: number; lng: number }[]> {
  if (!REST_API_KEY) {
    console.error('[kakao-directions] KAKAO_REST_API_KEY is not set');
    return [];
  }
  if (stops.length < 2) return [];

  try {
    if (stops.length <= MAX_CHUNK) {
      return await fetchSegment(stops);
    }

    // 7개 초과 시 구간 분할 (마지막 지점 겹쳐서 연결)
    const allCoords: { lat: number; lng: number }[] = [];
    for (let i = 0; i < stops.length - 1; i += MAX_CHUNK - 1) {
      const chunk = stops.slice(i, i + MAX_CHUNK);
      if (chunk.length < 2) break;
      const path = await fetchSegment(chunk);
      if (allCoords.length > 0 && path.length > 0) allCoords.pop(); // 중복 접합점 제거
      allCoords.push(...path);
    }
    return allCoords;
  } catch (err) {
    console.error('[kakao-directions] unexpected error:', err);
    return [];
  }
}
