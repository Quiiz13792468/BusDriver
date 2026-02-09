import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireSession } from '@/lib/auth/session';
import { getRouteById, getStudentsByRoute } from '@/lib/data/route';
import { getStudentsBySchool } from '@/lib/data/student';
import { assignStudentToRouteAction } from '@/app/(protected)/routes/actions.clean';
import { RouteStopsEditor } from '@/components/route-stops-editor';
import { BulkAssignStudents } from '@/components/bulk-assign-students';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

type PageProps = {
  params: { id: string };
};

export default async function RouteDetailPage({ params }: PageProps) {
  await requireSession('ADMIN');
  const route = await getRouteById(params.id);
  if (!route) notFound();
  const [assigned, all] = await Promise.all([
    getStudentsByRoute(route.id),
    getStudentsBySchool(route.schoolId)
  ]);

  const unassigned = all.filter((s) => s.routeId !== route.id);

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="ui-card ui-card-pad space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          <Link href="/routes" className="text-slate-400 hover:text-primary-600" aria-label="뒤로가기">
            ←
          </Link>
          {route.name}
        </h1>
        <p className="text-base text-slate-700">정차 지점 {route.stops.length}개</p>
      </header>

      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">정차 지점 정렬/편집</h2>
        <RouteStopsEditor routeId={route.id} initialStops={route.stops} />
      </section>

      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">배정 학생</h2>
        <div className="ui-table-wrap">
          <UiTable>
            <UiThead className="sticky top-0 z-10">
              <UiTr>
                <UiTh className="text-left">학생</UiTh>
                <UiTh className="text-left">탑승지점</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {assigned.map((s) => (
                <UiTr key={s.id} className="border-t">
                  <UiTd className="text-slate-800">{s.name}</UiTd>
                  <UiTd className="text-slate-700">{s.pickupPoint ?? '-'}</UiTd>
                </UiTr>
              ))}
              {assigned.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={2} className="text-center text-slate-700">
                    배정된 학생이 없습니다.
                  </UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>

      <AssignStudentForm routeId={route.id} students={unassigned.map((s) => ({ id: s.id, name: s.name }))} stops={route.stops} />
      <BulkAssignStudents routeId={route.id} students={unassigned.map((s) => ({ id: s.id, name: s.name }))} stops={route.stops} />
    </div>
  );
}

function AssignStudentForm({
  routeId,
  students,
  stops
}: {
  routeId: string;
  students: { id: string; name: string }[];
  stops: string[];
}) {
  return (
    <section className="ui-card ui-card-pad space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">학생 배정</h2>
      <form
        action={async (fd) => {
          'use server';
          await assignStudentToRouteAction(undefined, fd);
        }}
        className="ui-control flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="routeId" value={routeId} />
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="studentId">
            학생 선택
          </label>
          <select id="studentId" name="studentId" className="ui-select">
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="pickupPoint">
            정차 지점
          </label>
          <select id="pickupPoint" name="pickupPoint" className="ui-select">
            <option value="">선택 안 함</option>
            {stops.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button className="ui-btn-accent px-4 py-2 text-base font-semibold">배정</button>
      </form>
    </section>
  );
}
