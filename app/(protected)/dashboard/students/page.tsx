import { requireSession } from '@/lib/auth/session';
import { getAllStudents } from '@/lib/data/student';
import { getSchools } from '@/lib/data/school';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { CreateStudentForm } from '@/app/(protected)/schools/_components/create-student-form';

type StudentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function DashboardStudentsPage({ searchParams }: StudentsPageProps) {
  await requireSession('ADMIN');

  const [students, schools] = await Promise.all([getAllStudents(), getSchools()]);
  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));

  const selectedSchoolId =
    (Array.isArray(searchParams?.schoolId) ? searchParams?.schoolId[0] : searchParams?.schoolId) ?? 'ALL';

  const filtered =
    selectedSchoolId === 'ALL'
      ? students
      : selectedSchoolId === 'UNASSIGNED'
      ? students.filter((student) => student.schoolId === null)
      : students.filter((student) => student.schoolId === selectedSchoolId);

  const activeStudents = filtered.filter((s) => s.isActive);
  const inactiveStudents = filtered.filter((s) => !s.isActive);

  return (
    <div className="space-y-3">
      <header className="ui-card ui-card-pad">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-1 text-xl font-bold text-sp-text">학생 목록</h2>
            <p className="text-base text-sp-muted">운영 중인 모든 노선의 학생 정보를 한눈에 확인하세요.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>총 학생 수</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{activeStudents.length}명</span>
          </div>
        </div>
      </header>

      <section className="ui-card ui-card-pad">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" method="get">
          <div className="flex items-center gap-2">
            <label className="text-base font-semibold text-slate-700" htmlFor="schoolId">
              학교 필터
            </label>
            <select
              id="schoolId"
              name="schoolId"
              defaultValue={selectedSchoolId}
              className="ui-select"
            >
              <option value="ALL">전체</option>
              <option value="UNASSIGNED">미배정</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="ui-btn px-5 py-3 text-base">
            적용
          </button>
        </form>
      </section>

      <CollapsibleCard title="학생 등록" description="학생을 먼저 등록하고 학교는 나중에 배정할 수 있습니다." buttonLabel="학생 등록">
        <CreateStudentForm schools={schools.map((school) => ({ id: school.id, name: school.name }))} />
      </CollapsibleCard>

      {/* 재학생 카드 목록 */}
      <section className="space-y-2">
        {activeStudents.length === 0 && inactiveStudents.length === 0 ? (
          <div className="ui-card ui-card-pad text-center text-base text-slate-700">
            선택한 조건에 해당하는 학생이 없습니다.
          </div>
        ) : null}

        {activeStudents.map((student) => (
          <div
            key={student.id}
            className="ui-card ui-card-pad flex flex-col gap-2"
          >
            {/* 이름 + 상태 뱃지 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold text-slate-900">{student.name}</span>
              <span className="shrink-0 rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">
                재학중
              </span>
            </div>

            {/* 세부 정보 그리드 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">학교</span>
                <span className="font-medium text-slate-800">
                  {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">보호자</span>
                <span className="font-medium text-slate-800">{student.guardianName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">연락처</span>
                <span className="font-medium text-slate-800">{student.phone ?? '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-500">탑승 위치</span>
                <span className="font-medium text-slate-800">{student.pickupPoint ?? '-'}</span>
              </div>
              {student.feeAmount ? (
                <div className="col-span-2 flex flex-col">
                  <span className="text-sm text-slate-500">기본 요금</span>
                  <span className="font-semibold text-primary-700">{student.feeAmount.toLocaleString()}원</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {/* 이용 정지 학생 (접힌 섹션) */}
        {inactiveStudents.length > 0 ? (
          <details className="ui-card overflow-hidden">
            <summary className="flex cursor-pointer select-none items-center justify-between ui-card-pad text-base font-semibold text-slate-600">
              <span>이용 정지 학생</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
                {inactiveStudents.length}명
              </span>
            </summary>
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {inactiveStudents.map((student) => (
                <div key={student.id} className="flex flex-col gap-1.5 ui-card-pad opacity-60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-slate-700">{student.name}</span>
                    <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-500">
                      정지
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-400">학교</span>
                      <span className="font-medium text-slate-600">
                        {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-400">연락처</span>
                      <span className="font-medium text-slate-600">{student.phone ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </div>
  );
}
