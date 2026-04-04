import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getStudentsByParent } from '@/lib/data/student';
import { getRouteById } from '@/lib/data/route';
import { getSchools } from '@/lib/data/school';
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
      return { student, route };
    })
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="노선 확인"
        description="자녀의 탑승 노선과 정차 지점을 확인하세요."
      />

      {studentRoutes.length === 0 && (
        <div className="ui-card ui-card-pad py-10 text-center text-lg text-slate-500">
          등록된 학생이 없습니다.
        </div>
      )}

      {studentRoutes.map(({ student, route }) => (
        <section key={student.id} className="ui-card ui-card-pad space-y-4">
          {/* 학생 정보 헤더 */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <span className="rounded-full bg-primary-100 px-3 py-0.5 text-base font-semibold text-primary-700">
              {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '학교 미배정'}
            </span>
            {student.pickupPoint && (
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-base font-semibold text-amber-800">
                탑승지점: {student.pickupPoint}
              </span>
            )}
          </div>

          {!route ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-lg text-slate-500">
              노선이 배정되지 않았습니다.<br />
              <span className="mt-1 block text-base text-slate-400">담당 기사님께 문의해주세요.</span>
            </div>
          ) : (
            <>
              {/* 노선 정보 배너 */}
              <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-teal-800">{route.name}</span>
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-sm font-semibold text-teal-700">
                    정차 {route.stops.length}개
                  </span>
                </div>
              </div>

              {/* 지도 */}
              <KakaoMap
                stops={route.stopRecords
                  .filter((s) => s.lat != null && s.lng != null)
                  .map((s) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng!, position: s.position }))}
                readonly
                highlightStopId={route.stopRecords.find((s) => s.name === student.pickupPoint)?.id}
              />

              {/* 정류장 목록 */}
              {route.stops.length > 0 && (
                <div>
                  <h3 className="mb-2 text-base font-semibold text-slate-600">정류장 순서</h3>
                  <ul className="space-y-2">
                    {route.stops.map((stopName, idx) => {
                      const isMyStop = stopName === student.pickupPoint;
                      return (
                        <li
                          key={stopName}
                          className={[
                            'flex items-center gap-3 rounded-xl px-4 py-3',
                            isMyStop
                              ? 'border-2 border-amber-300 bg-amber-50 font-semibold text-amber-900'
                              : 'border border-slate-100 bg-white text-slate-700',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                              isMyStop ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500',
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
