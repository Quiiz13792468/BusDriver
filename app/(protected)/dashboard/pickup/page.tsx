import { requireSession } from '@/lib/auth/session';
import { getRoutesBySchool } from '@/lib/data/route';
import { getSchools } from '@/lib/data/school';
import { getStudentsByParent } from '@/lib/data/student';
import { ChangePickupButton } from '@/components/change-pickup-button';

export default async function ParentPickupPage() {
  const session = await requireSession('PARENT');
  const user = session.user!;

  const [students, schools] = await Promise.all([
    getStudentsByParent(user.id),
    getSchools()
  ]);
  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));
  const schoolIds = Array.from(new Set(students.map((s) => s.schoolId).filter((id): id is string => Boolean(id))));
  const routesBySchool = new Map(
    await Promise.all(schoolIds.map(async (schoolId) => [schoolId, await getRoutesBySchool(schoolId)] as const))
  );

  return (
    <div className="space-y-6">
      <header className="ui-card ui-card-pad">
        <h1 className="text-2xl font-semibold text-slate-900">탑승지점 변경 요청</h1>
        <p className="text-base text-slate-700">학생의 노선과 탑승 지점을 선택하고 변경 요청을 등록하세요.</p>
      </header>

      {students.length === 0 ? (
        <section className="ui-empty">
          등록된 학생이 없습니다. 먼저 관리자에게 학생 등록을 요청해주세요.
        </section>
      ) : (
        <section className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="ui-card ui-card-compact">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{student.name}</h2>
                  <p className="text-sm text-slate-700">
                    {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'} · 현재 탑승지점 {student.pickupPoint ?? '-'}
                  </p>
                </div>
              </div>
              {student.schoolId ? (
                <ChangePickupButton student={student} routes={routesBySchool.get(student.schoolId) ?? []} />
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
