import { requireSession } from '@/lib/auth/session';
import { getAllStudents } from '@/lib/data/student';
import { getSchools } from '@/lib/data/school';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="ui-card ui-card-pad">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">학생 목록</h1>
            <p className="text-base text-slate-700">운영 중인 모든 노선의 학생 정보를 한눈에 확인하세요.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>총 학생 수</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{students.length}</span>
          </div>
        </div>
      </header>

      <section className="ui-card ui-card-pad">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" method="get">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="schoolId">
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
          <button
            type="submit"
            className="ui-btn px-4 py-2"
          >
            적용
          </button>
        </form>
      </section>

      <CollapsibleCard title="학생 등록" description="학생을 먼저 등록하고 학교는 나중에 배정할 수 있습니다." buttonLabel="학생 등록">
        <CreateStudentForm schools={schools.map((school) => ({ id: school.id, name: school.name }))} />
      </CollapsibleCard>

      <section className="ui-card overflow-hidden">
        <UiTable>
          <UiThead>
            <UiTr>
              <UiTh className="text-left">학생</UiTh>
              <UiTh className="text-left">학교</UiTh>
              <UiTh className="text-left">연락처</UiTh>
              <UiTh className="text-left">탑승 위치</UiTh>
              <UiTh className="text-left">기본 요금</UiTh>
            </UiTr>
          </UiThead>
          <UiTbody>
            {filtered.map((student) => (
              <UiTr key={student.id} className="border-b border-slate-100 last:border-b-0">
                <UiTd className="text-slate-800">
                  <div className="font-semibold">{student.name}</div>
                  <div className="text-sm text-slate-700">보호자 {student.guardianName}</div>
                </UiTd>
                <UiTd className="text-slate-700">
                  {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'}
                </UiTd>
                <UiTd className="text-slate-700">{student.phone ?? '-'}</UiTd>
                <UiTd className="text-slate-700">{student.pickupPoint ?? '-'}</UiTd>
                <UiTd className="text-slate-700">
                  {student.feeAmount ? `${student.feeAmount.toLocaleString()}원` : '-'}
                </UiTd>
              </UiTr>
            ))}
            {filtered.length === 0 ? (
              <UiTr>
                <UiTd colSpan={5} className="text-center text-base text-slate-700">
                  선택한 조건에 해당하는 학생이 없습니다.
                </UiTd>
              </UiTr>
            ) : null}
          </UiTbody>
        </UiTable>
      </section>
    </div>
  );
}
