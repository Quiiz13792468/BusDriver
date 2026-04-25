import { createClient } from '@/lib/supabase/server'
import HomeTabs from './HomeTabs'

function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

interface Props {
  driverName: string
}

export default async function DriverDashboard({ driverName }: Props) {
  const supabase = await createClient()
  const today = new Date().getDate()
  const { year, month } = getCurrentYearMonth()
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = `${year}-${String(month).padStart(2, '0')}-31`

  const [todayRes, overdueRes, pendingRes, monthlyRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, name, custom_fee, schools(name, default_fee)')
      .eq('is_active', true)
      .eq('payment_day', today),

    supabase
      .from('students')
      .select('id, name, payment_day, custom_fee, schools(name, default_fee)')
      .eq('is_active', true)
      .not('payment_day', 'is', null)
      .lt('payment_day', today),

    supabase
      .from('payments')
      .select('id, amount, paid_at, students(name)')
      .eq('status', 'PENDING')
      .eq('created_by_role', 'PARENT')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'CONFIRMED')
      .gte('paid_at', fromDate)
      .lte('paid_at', toDate),
  ])

  const monthlySum = (monthlyRes.data ?? []).reduce((s, r) => s + r.amount, 0)

  const { data: confirmedThisMonth } = await supabase
    .from('payments')
    .select('student_id')
    .eq('status', 'CONFIRMED')
    .gte('paid_at', fromDate)
    .lte('paid_at', toDate)

  const confirmedIds = new Set((confirmedThisMonth ?? []).map((r) => r.student_id))

  type SchoolJoin = { name: string; default_fee: number } | null

  const todayStudents = (todayRes.data ?? []).map((s) => {
    const school = s.schools as unknown as SchoolJoin
    return {
      id: s.id,
      name: s.name,
      school_name: school?.name ?? null,
      custom_fee: s.custom_fee,
      default_fee: school?.default_fee ?? null,
    }
  })

  const overdueList = (overdueRes.data ?? [])
    .filter((s) => !confirmedIds.has(s.id))
    .map((s) => {
      const school = s.schools as unknown as SchoolJoin
      return {
        id: s.id,
        name: s.name,
        school_name: school?.name ?? null,
        payment_day: s.payment_day as number,
        custom_fee: s.custom_fee,
        default_fee: school?.default_fee ?? null,
      }
    })

  const pendingPayments = (pendingRes.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount,
    paid_at: p.paid_at,
    student_name: (p.students as unknown as { name: string } | null)?.name ?? null,
  }))

  // 매트릭스용 데이터
  const { data: { user } } = await supabase.auth.getUser()
  const matrixData = user ? await (async () => {
    const yearFrom = `${year}-01-01`
    const yearTo = `${year}-12-31`
    const [schoolsRes, studentsRes, paymentsRes] = await Promise.all([
      supabase
        .from('schools')
        .select('id, name')
        .eq('owner_driver_id', user.id)
        .order('name'),
      supabase
        .from('students')
        .select('id, name, school_id, custom_fee, schools(default_fee)')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('payments')
        .select('id, student_id, amount, paid_at, status')
        .eq('driver_id', user.id)
        .eq('status', 'CONFIRMED')
        .gte('paid_at', yearFrom)
        .lte('paid_at', yearTo),
    ])
    return {
      schools: schoolsRes.data ?? [],
      students: studentsRes.data ?? [],
      payments: paymentsRes.data ?? [],
    }
  })() : { schools: [], students: [], payments: [] }

  return (
    <HomeTabs
      year={year}
      month={month}
      monthlySum={monthlySum}
      todayStudents={todayStudents}
      overdueList={overdueList}
      pendingPayments={pendingPayments}
      schools={matrixData.schools}
      matrixStudents={matrixData.students as unknown as Array<{ id: string; name: string; school_id: string; custom_fee: number | null; schools: { default_fee: number } | null }>}
      matrixPayments={matrixData.payments}
      driverName={driverName}
    />
  )
}
