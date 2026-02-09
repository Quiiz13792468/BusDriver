import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { requireSession } from '@/lib/auth/session';
import { getSchools } from '@/lib/data/school';
import { getRoutesBySchool } from '@/lib/data/route';
import { RouteCreateCard } from '@/components/route-create-card';
import { LinkWithLoading } from '@/components/link-with-loading';
import { PageHeader } from '@/components/layout/page-header';

export const dynamic = 'force-dynamic';

export default async function RoutesPage() {
  await requireSession('ADMIN');
  const schools = await getSchools();

  const routesBySchool = await Promise.all(
    schools.map(async (s) => ({ school: s, routes: await getRoutesBySchool(s.id) }))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="노선 관리" description="학교별 노선을 확인하고 추가/편집할 수 있습니다." />

      <div className="space-y-6">
        {routesBySchool.map(({ school, routes }) => (
          <section key={school.id} className="space-y-3">
            <details className="ui-card" open>
              <summary className="ui-collapse-summary list-none px-4 py-3">
                {school.name}
              </summary>
              <div className="ui-collapse-panel space-y-4 px-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {routes.map((route) => (
                    <LinkWithLoading
                      key={route.id}
                      href={`/routes/${route.id}`}
                      className="block ui-card ui-card-compact transition hover:border-primary-300 hover:shadow"
                    >
                      <p className="text-base font-semibold text-slate-900">{route.name}</p>
                      <p className="mt-2 text-sm text-slate-700">정차 지점 {route.stops.length}개</p>
                    </LinkWithLoading>
                  ))}
                  {routes.length === 0 ? (
                    <p className="ui-empty">
                      등록된 노선이 없습니다.
                    </p>
                  ) : null}
                </div>

                <CollapsibleCard title="노선 추가" description="노선명과 정차 지점을 입력하세요" buttonLabel="노선 추가">
                  <RouteCreateCard schoolId={school.id} />
                </CollapsibleCard>
              </div>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
