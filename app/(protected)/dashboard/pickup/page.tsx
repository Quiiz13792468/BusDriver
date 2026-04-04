import { requireSession } from '@/lib/auth/session';
import { getRoutesBySchool } from '@/lib/data/route';
import { getSchools } from '@/lib/data/school';
import { getStudentsByParent } from '@/lib/data/student';
import { ChangePickupButton } from '@/components/change-pickup-button';
import { PageHeader } from '@/components/layout/page-header';

export default async function ParentPickupPage() {
  const session = await requireSession('PARENT');
  const [students, schools] = await Promise.all([
    getStudentsByParent(session.id),
    getSchools()
  ]);
  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));
  const schoolIds = Array.from(new Set(students.map((s) => s.schoolId).filter((id): id is string => Boolean(id))));
  const routesBySchool = new Map(
    await Promise.all(schoolIds.map((schoolId) => getRoutesBySchool(schoolId).then((routes) => [schoolId, routes] as const)))
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="탑승지점 변경 요청"
        description="학생의 노선과 탑승 지점을 선택하고 변경 요청을 등록하세요."
      />

      {students.length === 0 ? (
        <section className="ui-card ui-card-pad py-10 text-center text-lg text-slate-500">
          등록된 학생이 없습니다.<br />
          <span className="mt-1 block text-base text-slate-400">먼저 관리자에게 학생 등록을 요청해주세요.</span>
        </section>
      ) : (
        <section className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="ui-card ui-card-pad space-y-4">
              {/* 학생 헤더 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <span className="rounded-full bg-primary-100 px-3 py-0.5 text-base font-semibold text-primary-700">
                  {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'}
                </span>
              </div>

              {/* 현재 탑승지점 표시 */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-base font-medium text-slate-500">현재 탑승지점</span>
                <span className={[
                  'text-lg font-bold',
                  student.pickupPoint ? 'text-amber-700' : 'text-slate-400'
                ].join(' ')}>
                  {student.pickupPoint ?? '미설정'}
                </span>
              </div>

              {student.schoolId ? (
                <ChangePickupButton student={student} routes={routesBySchool.get(student.schoolId) ?? []} />
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-lg text-slate-600">
                  학교 배정 후에 탑승지점 변경이 가능합니다.
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
