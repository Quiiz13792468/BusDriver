import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireSession } from '@/lib/auth/session';
import { getRouteById, getStudentsByRoute } from '@/lib/data/route';
import { getStudentsBySchool } from '@/lib/data/student';
import { assignStudentToRouteAction } from '@/app/(protected)/routes/actions.clean';
import { RouteStopsEditor } from '@/components/route-stops-editor';
import { BulkAssignStudents } from '@/components/bulk-assign-students';
import { RouteMapSection } from '@/components/route-map-section';
import { RouteStopAccordion } from '@/components/route-stop-accordion';
import type { StopGroup } from '@/components/route-stop-accordion';

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

  // Group assigned students by stop for accordion
  const stopGroups: StopGroup[] = route.stops.map((stopName) => ({
    stopName,
    students: assigned
      .filter((s) => s.pickupPoint === stopName)
      .map((s) => ({ id: s.id, name: s.name, phone: s.phone })),
  }));

  // Students assigned but no specific stop
  const noStopStudents = assigned.filter(
    (s) => !s.pickupPoint || !route.stops.includes(s.pickupPoint)
  );

  return (
    <div className="space-y-3">
      <header className="ui-card ui-card-pad space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          <Link href="/routes" className="text-slate-400 hover:text-primary-600" aria-label="뒤로가기">
            ←
          </Link>
          {route.name}
        </h1>
        <p className="text-base text-slate-700">
          정차 지점 {route.stops.length}개 · 배정 학생 {assigned.length}명
        </p>
      </header>

      {/* 카카오맵 */}
      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">노선 지도</h2>
        <RouteMapSection routeId={route.id} initialStops={route.stopRecords} />
      </section>

      {/* 정류장별 탑승 학생 (accordion) */}
      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">정류장별 탑승 학생</h2>
        <RouteStopAccordion groups={stopGroups} />
        {noStopStudents.length > 0 && (
          <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-amber-700">정류장 미배정 학생 ({noStopStudents.length}명)</p>
            <ul className="space-y-1">
              {noStopStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 정차 지점 편집 */}
      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">정차 지점 편집</h2>
        <RouteStopsEditor routeId={route.id} initialStops={route.stops} />
      </section>

      {/* 학생 배정 */}
      <AssignStudentForm
        routeId={route.id}
        students={unassigned.map((s) => ({ id: s.id, name: s.name }))}
        stops={route.stops}
      />
      <BulkAssignStudents
        routeId={route.id}
        students={unassigned.map((s) => ({ id: s.id, name: s.name }))}
        stops={route.stops}
      />
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
