import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import StudentRegisterButton from './StudentRegisterButton'

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/dashboard')

  const { school: schoolFilter } = await searchParams

  // 내 학교 목록
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .eq('owner_driver_id', user.id)
    .order('name')

  // 학생 목록
  let query = supabase
    .from('students')
    .select('id, name, ride_type, payment_day, custom_fee, school_id, schools(id, name, default_fee)')
    .eq('driver_id', user.id)
    .eq('is_active', true)
    .order('name')

  if (schoolFilter) {
    query = query.eq('school_id', schoolFilter)
  }

  const { data: students } = await query

  const rideLabel: Record<string, string> = {
    MORNING: '등교',
    AFTERNOON: '하교',
    BOTH: '등하교',
  }

  return (
    <div className="px-4 py-5 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">학생관리</h1>
        <StudentRegisterButton schools={schools ?? []} driverId={user.id} />
      </div>

      {/* 학교 필터 */}
      {(schools ?? []).length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <Link
            href="/schools"
            className={`flex-none h-9 px-4 rounded-full text-sm font-medium border transition-colors ${
              !schoolFilter
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
            }`}
          >
            전체
          </Link>
          {schools!.map((s) => (
            <Link
              key={s.id}
              href={`/schools?school=${s.id}`}
              className={`flex-none h-9 px-4 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                schoolFilter === s.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* 학생 목록 */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {!students?.length ? (
          <p className="px-4 py-8 text-center text-sm text-[#6C6C70]">
            {schoolFilter ? '해당 학교에 등록된 학생이 없습니다.' : '등록된 학생이 없습니다.'}
          </p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {students.map((s) => {
              const school = s.schools as unknown as { name: string } | null
              return (
                <li key={s.id}>
                  <Link
                    href={`/schools/${s.id}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-base font-medium text-black">{s.name}</p>
                      {school && (
                        <p className="text-xs text-[#6C6C70] mt-0.5">{school.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6C6C70] bg-[#F2F2F7] px-2 py-1 rounded-full">
                        {rideLabel[s.ride_type]}
                      </span>
                      {s.payment_day && (
                        <span className="text-xs text-[#6C6C70]">{s.payment_day}일</span>
                      )}
                      <span className="text-[#C6C6C8] text-lg">›</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-[#6C6C70] text-center">
        총 {students?.length ?? 0}명의 학생 이용 중
      </p>
    </div>
  )
}
