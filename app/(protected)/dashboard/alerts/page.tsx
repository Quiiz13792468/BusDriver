import { resolveAlertAction } from '@/app/(protected)/dashboard/actions';
import { requireSession } from '@/lib/auth/session';
import { getAlerts } from '@/lib/data/alert';
import { getSchools } from '@/lib/data/school';
import { getAllStudents } from '@/lib/data/student';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

const ALERT_LABEL: Record<string, string> = {
  PAYMENT: '입금 확인 요청',
  INQUIRY: '문의 등록',
  ROUTE_CHANGE: '탑승지점 변경'
};

export default async function DashboardAlertsPage() {
  await requireSession('ADMIN');

  const [alerts, schools, students] = await Promise.all([getAlerts(), getSchools(), getAllStudents()]);

  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));
  const studentMap = new Map(students.map((student) => [student.id, student.name]));

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="ui-card ui-card-pad">
        <h1 className="text-2xl font-semibold text-slate-900">알림 목록</h1>
        <p className="text-base text-slate-700">학부모 문의 등록과 입금 확인 요청을 한눈에 확인하고 처리하세요.</p>
      </header>

      <div className="ui-table-wrap">
        <UiTable className="divide-y divide-slate-200">
          <UiThead>
            <UiTr>
              <UiTh className="w-[5rem] border-r border-slate-200 px-[0.3rem] py-3">유형</UiTh>
              <UiTh className="border-r border-slate-200 px-[0.3rem] py-3">학생</UiTh>
              <UiTh className="border-r border-slate-200 px-[0.3rem] py-3">학교</UiTh>
              <UiTh className="w-[6rem] border-r border-slate-200 px-[0.3rem] py-3">대상 연월</UiTh>
              <UiTh className="border-r border-slate-200 px-[0.3rem] py-3">요청시각</UiTh>
              <UiTh className="border-r border-slate-200 px-[0.3rem] py-3">메모</UiTh>
              <UiTh className="w-[4rem] px-[0.3rem] py-3">처리</UiTh>
            </UiTr>
          </UiThead>
          <UiTbody className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <UiTr key={alert.id}>
                <UiTd className="w-[5rem] border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle font-medium text-slate-900">
                  <span className="mx-auto block max-w-[7.5rem] leading-tight text-slate-900">{ALERT_LABEL[alert.type] ?? '확인 필요'}</span>
                </UiTd>
                <UiTd className="border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle text-slate-700">{studentMap.get(alert.studentId) ?? '학생 정보 없음'}</UiTd>
                <UiTd className="border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle text-slate-700">{schoolMap.get(alert.schoolId) ?? '학교 정보 없음'}</UiTd>
                <UiTd className="w-[6rem] border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle text-slate-700">{alert.year}년 {alert.month}월</UiTd>
                <UiTd className="border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle text-slate-700">{new Date(alert.createdAt).toLocaleString()}</UiTd>
                <UiTd className="border-r border-slate-200 px-[0.3rem] py-3 text-center align-middle text-slate-700">{alert.memo ?? '-'}</UiTd>
                <UiTd className="w-[4rem] px-[0.3rem] py-3 text-center align-middle">
                  <form action={resolveAlertAction.bind(null, alert.id)} className="inline-flex">
                    <button className="ui-btn px-4 py-2 text-sm">
                      처리 완료
                    </button>
                  </form>
                </UiTd>
              </UiTr>
            ))}
            {alerts.length === 0 ? (
              <UiTr>
                <UiTd colSpan={7} className="text-center text-base text-slate-700">
                  대기 중인 알림이 없습니다.
                </UiTd>
              </UiTr>
            ) : null}
          </UiTbody>
        </UiTable>
      </div>
    </div>
  );
}
