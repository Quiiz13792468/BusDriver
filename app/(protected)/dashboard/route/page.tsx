import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getStudentsByParent } from '@/lib/data/student';
import { getRouteById } from '@/lib/data/route';
import { getSchools } from '@/lib/data/school';
import { getRoutePath } from '@/lib/kakao-directions';
import { KakaoMap } from '@/components/kakao-map';
import { PageHeader } from '@/components/layout/page-header';

export default async function ParentRoutePage() {
  const session = await requireSession('PARENT');
  const [students, schools] = await Promise.all([
    getStudentsByParent(session.id),
    getSchools(),
  ]);
  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));

  const studentRoutes = await Promise.all(
    students.map(async (student) => {
      const route = student.routeId ? await getRouteById(student.routeId) : null;
      const stopsWithCoords = route
        ? route.stopRecords
            .filter((s) => s.lat != null && s.lng != null)
            .map((s) => ({ lat: s.lat!, lng: s.lng! }))
        : [];
      const routePath = stopsWithCoords.length >= 2
        ? await getRoutePath(stopsWithCoords)
        : [];
      return { student, route, routePath };
    })
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="노선 확인"
        description="자녀의 탑승 노선과 정차 지점을 확인하세요."
      />

      {studentRoutes.length === 0 && (
        <div className="ui-card ui-card-pad py-10 text-center text-lg text-sp-muted">
          등록된 학생이 없습니다.
        </div>
      )}

      {studentRoutes.map(({ student, route, routePath }) => (
        <section key={student.id} className="ui-card ui-card-pad space-y-4">
          {/* 학생 정보 헤더 */}
          <div className="flex flex-wrap items-center gap-2 border-b border-sp-border pb-3">
            <h2 className="text-xl font-bold text-sp-text">{student.name}</h2>
            <span className="rounded-full bg-primary-900/30 px-3 py-0.5 text-base font-semibold text-primary-400">
              {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '학교 미배정'}
            </span>
            {student.pickupPoint && (
              <span className="rounded-full bg-amber-900/20 px-3 py-0.5 text-base font-semibold text-amber-400">
                탑승지점: {student.pickupPoint}
              </span>
            )}
          </div>

          {!route ? (
            <div className="rounded-2xl border border-dashed border-sp-border bg-sp-raised px-4 py-8 text-center text-lg text-sp-muted">
              노선이 배정되지 않았습니다.<br />
              <span className="mt-1 block text-base text-sp-faint">담당 기사님께 문의해주세요.</span>
            </div>
          ) : (
            <>
              {/* 노선 정보 배너 */}
              <div className="flex items-center justify-between rounded-xl border border-primary-900 bg-primary-900/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-300">{route.name}</span>
                  <span className="rounded-full bg-primary-900/30 px-2.5 py-0.5 text-sm font-semibold text-primary-400">
                    정차 {route.stops.length}개
                  </span>
                </div>
              </div>

              {/* 지도 */}
              <KakaoMap
                stops={route.stopRecords
                  .filter((s) => s.lat != null && s.lng != null)
                  .map((s) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng!, position: s.position }))}
                routePath={routePath.length > 0 ? routePath : undefined}
                readonly
                highlightStopId={route.stopRecords.find((s) => s.name === student.pickupPoint)?.id}
              />

              {/* 정류장 목록 */}
              {route.stops.length > 0 && (
                <div>
                  <h3 className="mb-2 text-base font-semibold text-sp-muted">정류장 순서</h3>
                  <ul className="space-y-2">
                    {route.stops.map((stopName, idx) => {
                      const isMyStop = stopName === student.pickupPoint;
                      return (
                        <li
                          key={stopName}
                          className={[
                            'flex items-center gap-3 rounded-xl px-4 py-3',
                            isMyStop
                              ? 'border-2 border-amber-600 bg-amber-900/20 font-semibold text-amber-300'
                              : 'border border-sp-border bg-sp-raised text-sp-muted',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                              isMyStop ? 'bg-amber-500 text-white' : 'bg-sp-raised text-sp-faint',
                            ].join(' ')}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-lg">{stopName}</span>
                          {isMyStop && (
                            <span className="ml-auto rounded-full bg-amber-400 px-3 py-0.5 text-sm font-bold text-white">내 탑승지점</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      ))}

      <div className="pb-4 text-center">
        <Link href="/dashboard" className="text-base text-primary-600 hover:underline">
          ← 대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
