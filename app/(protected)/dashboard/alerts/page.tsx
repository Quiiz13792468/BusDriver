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
        <p className="ui-empty">대기 중인 알림이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="ui-card ui-card-compact">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALERT_COLOR[alert.type] ?? 'bg-slate-100 text-slate-700'}`}>
                      {ALERT_LABEL[alert.type] ?? '확인 필요'}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">{studentMap.get(alert.studentId) ?? '학생 정보 없음'}</span>
                    <span className="text-sm text-slate-500 truncate">{schoolMap.get(alert.schoolId) ?? '학교 정보 없음'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{alert.year}년 {alert.month}월</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  {alert.memo && <p className="mt-1.5 text-sm text-slate-600">{alert.memo}</p>}
                </div>
                <form action={resolveAlertAction.bind(null, alert.id)} className="shrink-0">
                  <button className="ui-btn px-4 py-1.5 text-sm whitespace-nowrap">
                    처리 완료
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
