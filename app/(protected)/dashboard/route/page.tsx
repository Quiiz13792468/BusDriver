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
    getStudentsByParent(session.user!.id),
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
    <div className="space-y-6">
      <PageHeader
        title="노선 확인"
        description="자녀의 탑승 노선과 정차 지점을 확인하세요."
      />

      {studentRoutes.length === 0 && (
        <div className="ui-card ui-card-pad text-center text-sm text-slate-500">
          등록된 학생이 없습니다.
        </div>
      )}

      {studentRoutes.map(({ student, route }) => (
        <section key={student.id} className="ui-card ui-card-pad space-y-4">
          {/* 학생 정보 */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{student.name}</h2>
            <p className="text-sm text-slate-500">
              {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '학교 미배정'}
              {student.pickupPoint ? ` · 탑승지점: ${student.pickupPoint}` : ''}
            </p>
          </div>

          {!route ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              노선이 배정되지 않았습니다. 담당 기사님께 문의해주세요.
            </div>
          ) : (
            <>
              {/* 노선 정보 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{route.name}</span>
                  <span className="ml-2 text-xs text-slate-500">정차 {route.stops.length}개</span>
                </div>
                {student.pickupPoint && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    내 정류장: {student.pickupPoint}
                  </span>
                )}
              </div>

              {/* 지도 */}
              <KakaoMap
                stops={route.stopRecords}
                readOnly
                highlightedStopName={student.pickupPoint ?? undefined}
              />

              {/* 정류장 목록 */}
              {route.stops.length > 0 && (
                <ul className="space-y-1.5">
                  {route.stops.map((stopName, idx) => {
                    const isMyStop = stopName === student.pickupPoint;
                    return (
                      <li
                        key={stopName}
                        className={[
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                          isMyStop
                            ? 'border border-amber-200 bg-amber-50 font-semibold text-amber-900'
                            : 'border border-slate-100 bg-white text-slate-700',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            isMyStop ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {idx + 1}
                        </span>
                        <span>{stopName}</span>
                        {isMyStop && (
                          <span className="ml-auto text-xs font-medium text-amber-700">내 탑승지점</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      ))}

      <div className="pb-4 text-center">
        <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">
          ← 대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
