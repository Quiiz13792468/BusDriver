import { resolveAlertAction } from '@/app/(protected)/dashboard/actions';
import { requireSession } from '@/lib/auth/session';
import { getAlerts } from '@/lib/data/alert';
import { getSchools } from '@/lib/data/school';
import { getAllStudents } from '@/lib/data/student';
import { PageHeader } from '@/components/layout/page-header';

const ALERT_LABEL: Record<string, string> = {
  PAYMENT: '입금 확인',
  INQUIRY: '문의',
  ROUTE_CHANGE: '탑승지점 변경'
};

const ALERT_COLOR: Record<string, string> = {
  PAYMENT: 'bg-emerald-100 text-emerald-700',
  INQUIRY: 'bg-blue-100 text-blue-700',
  ROUTE_CHANGE: 'bg-amber-100 text-amber-700'
};

export default async function DashboardAlertsPage() {
  await requireSession('ADMIN');

  const [alerts, schools, students] = await Promise.all([getAlerts(), getSchools(), getAllStudents()]);

  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));
  const studentMap = new Map(students.map((student) => [student.id, student.name]));

  return (
    <div className="space-y-4">
      <PageHeader title="알림 목록" />

      {alerts.length === 0 ? (
        <div className="ui-card ui-card-pad py-10 text-center text-lg text-slate-500">
          대기 중인 알림이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="ui-card ui-card-pad space-y-3">
              {/* 1행: 타입 뱃지 + 학생 이름 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${ALERT_COLOR[alert.type] ?? 'bg-slate-100 text-slate-700'}`}>
                  {ALERT_LABEL[alert.type] ?? '확인 필요'}
                </span>
                <span className="text-xl font-bold text-slate-900">{studentMap.get(alert.studentId) ?? '학생 정보 없음'}</span>
              </div>

              {/* 2행: 상세 정보 */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-slate-600">
                <span className="font-semibold text-slate-800">{schoolMap.get(alert.schoolId) ?? '학교 정보 없음'}</span>
                <span>{alert.year}년 {alert.month}월</span>
                <span>{new Date(alert.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {alert.memo && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-base text-slate-700">
                  {alert.memo}
                </div>
              )}

              {/* 처리 버튼 - 하단 전체 폭 */}
              <form action={resolveAlertAction.bind(null, alert.id)}>
                <button className="ui-btn w-full py-3 text-base font-semibold">처리 완료</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
