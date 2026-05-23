// 장부 화면 — 월별 KPI, 6개월 차트, 입금/주유 탭

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  year: number
  month: number
  tab: string
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function formatK(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(0) + '만'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return String(n)
}

function LedgerChart({ income, fuel, monthLabels, currentIdx }: {
  income: number[]
  fuel: number[]
  monthLabels: string[]
  currentIdx: number
}) {
  const W = 300, H = 130, PL = 10, PR = 10, PT = 30, PB = 24
  const maxV = Math.max(...income, ...fuel, 1)

  const pts = (arr: number[]) => arr.map((v, i) => {
    const x = PL + (W - PL - PR) * i / (arr.length - 1)
    const y = PT + (H - PT - PB) * (1 - v / maxV)
    return [x, y] as [number, number]
  })

  const incPts = pts(income)
  const fuelPts = pts(fuel)
  const toPath = (p: [number, number][]) =>
    p.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d={toPath(incPts)} fill="none" stroke="#34C759" strokeWidth="2" />
      <path d={toPath(fuelPts)} fill="none" stroke="#FF3B30" strokeWidth="2" />
      {incPts.map(([x, y], i) => (
        <g key={`i${i}`}>
          <circle cx={x} cy={y} r={3} fill="#34C759" />
          {income[i] > 0 && (
            <text x={x} y={y - 6} textAnchor="middle" fontSize="9" fill="#34C759">{formatK(income[i])}</text>
          )}
        </g>
      ))}
      {fuelPts.map(([x, y], i) => (
        <g key={`f${i}`}>
          <circle cx={x} cy={y} r={3} fill="#FF3B30" />
          {fuel[i] > 0 && (
            <text x={x} y={y + 14} textAnchor="middle" fontSize="9" fill="#FF3B30">{formatK(fuel[i])}</text>
          )}
        </g>
      ))}
      {monthLabels.map((m, i) => {
        const x = PL + (W - PL - PR) * i / (monthLabels.length - 1)
        return (
          <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="10"
            fontWeight={i === currentIdx ? '700' : '400'}
            fill={i === currentIdx ? '#F5A400' : '#8E8E93'}>
            {m}
          </text>
        )
      })}
    </svg>
  )
}

export default async function DriverPayments({ year, month, tab }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = `${year}-${String(month).padStart(2, '0')}-31`

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // 이번달 입금/주유
  const [{ data: payments }, { data: fuelRecords }] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, paid_at, status, memo, students(name)')
      .eq('driver_id', user.id)
      .gte('paid_at', fromDate)
      .lte('paid_at', toDate)
      .order('paid_at', { ascending: false }),
    supabase
      .from('fuel_records')
      .select('id, amount, fueled_at, memo, fuel_type, price_per_liter')
      .eq('driver_id', user.id)
      .gte('fueled_at', fromDate)
      .lte('fueled_at', toDate)
      .order('fueled_at', { ascending: false }),
  ])

  const monthlyIncome = (payments ?? []).filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0)
  const fuelSum = (fuelRecords ?? []).reduce((s, r) => s + r.amount, 0)
  const netProfit = monthlyIncome - fuelSum

  // 6개월 차트 데이터
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  const chartFrom = `${chartMonths[0].year}-${String(chartMonths[0].month).padStart(2, '0')}-01`
  const chartTo = `${year}-${String(month).padStart(2, '0')}-31`

  const [{ data: chartPay }, { data: chartFuel }] = await Promise.all([
    supabase.from('payments').select('amount, paid_at').eq('driver_id', user.id).eq('status', 'CONFIRMED').gte('paid_at', chartFrom).lte('paid_at', chartTo),
    supabase.from('fuel_records').select('amount, fueled_at').eq('driver_id', user.id).gte('fueled_at', chartFrom).lte('fueled_at', chartTo),
  ])

  const barIncome = chartMonths.map(({ year: y, month: m }) => {
    const pfx = `${y}-${String(m).padStart(2, '0')}-`
    return (chartPay ?? []).filter(p => p.paid_at.startsWith(pfx)).reduce((s, p) => s + p.amount, 0)
  })
  const barFuel = chartMonths.map(({ year: y, month: m }) => {
    const pfx = `${y}-${String(m).padStart(2, '0')}-`
    return (chartFuel ?? []).filter(r => r.fueled_at.startsWith(pfx)).reduce((s, r) => s + r.amount, 0)
  })
  const monthLabels = chartMonths.map(({ month: m }) => `${m}월`)

  const tabBase = `/payments?year=${year}&month=${month}`

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>장부</h1>

      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 16, padding: '10px 16px', marginBottom: 10 }}>
        <Link href={`/payments?year=${prevYear}&month=${prevMonth}&tab=${tab}`} aria-label="이전 달"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 22, background: '#F2F2F7', textDecoration: 'none', color: '#000', fontSize: 20 }}>
          ‹
        </Link>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{year}년 {month}월</span>
        <Link href={`/payments?year=${nextYear}&month=${nextMonth}&tab=${tab}`} aria-label="다음 달"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 22, background: '#F2F2F7', textDecoration: 'none', color: '#000', fontSize: 20 }}>
          ›
        </Link>
      </div>

      {/* KPI 3열 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 10px' }}>
          <p style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>입금 확정</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#34C759' }}>{formatKRW(monthlyIncome)}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 10px' }}>
          <p style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>주유 비용</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#FF3B30' }}>{formatKRW(fuelSum)}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 10px' }}>
          <p style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>순이익</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: netProfit >= 0 ? '#F5A400' : '#FF3B30' }}>{formatKRW(netProfit)}</p>
        </div>
      </div>

      {/* 6개월 차트 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '14px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#34C759', fontWeight: 600 }}>● 입금</span>
          <span style={{ fontSize: 12, color: '#FF3B30', fontWeight: 600 }}>● 주유</span>
        </div>
        <LedgerChart income={barIncome} fuel={barFuel} monthLabels={monthLabels} currentIdx={5} />
      </div>

      {/* 탭 바 */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
        {[{ key: 'payments', label: '입금 내역' }, { key: 'fuel', label: '주유 내역' }].map(t => (
          <Link key={t.key} href={`${tabBase}&tab=${t.key}`}
            style={{
              flex: 1, textAlign: 'center', padding: '13px 0', fontSize: 15, fontWeight: 600,
              textDecoration: 'none',
              color: tab === t.key ? '#F5A400' : '#8E8E93',
              borderBottom: tab === t.key ? '2.5px solid #F5A400' : '2.5px solid transparent',
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* 입금 내역 탭 */}
      {tab === 'payments' && (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          {!(payments ?? []).length ? (
            <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 15, color: '#8E8E93' }}>입금 내역이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {(payments ?? []).map((p, i) => {
                const student = p.students as unknown as { name: string } | null
                const [mm, dd] = p.paid_at.split('-').slice(1)
                return (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < (payments ?? []).length - 1 ? '1px solid #F2F2F7' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'center', minWidth: 36 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#F5A400', display: 'block' }}>{parseInt(mm)}월</span>
                        <span style={{ fontSize: 13, color: '#8E8E93', display: 'block' }}>{parseInt(dd)}일</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{formatKRW(p.amount)}</p>
                        {student && <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>{student.name}</p>}
                        {p.memo && <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>{p.memo}</p>}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
                      background: p.status === 'CONFIRMED' ? '#34C75918' : p.status === 'DISPUTED' ? '#FF3B3018' : '#F2F2F7',
                      color: p.status === 'CONFIRMED' ? '#34C759' : p.status === 'DISPUTED' ? '#FF3B30' : '#8E8E93',
                    }}>
                      {p.status === 'CONFIRMED' ? '확정' : p.status === 'DISPUTED' ? '수정요청' : '확인중'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* 주유 내역 탭 */}
      {tab === 'fuel' && (
        <div style={{ marginBottom: 16 }}>
          {/* 주유 요약 카드 */}
          <div style={{ background: '#FF3B3010', border: '1px solid #FF3B3020', borderRadius: 16, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#FF3B30', fontWeight: 600 }}>이번 달 주유 합계</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#FF3B30' }}>{formatKRW(fuelSum)}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
            {!(fuelRecords ?? []).length ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 15, color: '#8E8E93' }}>주유 내역이 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {(fuelRecords ?? []).map((r, i) => {
                  const fuelLabel = r.fuel_type === 'GASOLINE' ? '휘발유' : r.fuel_type === 'DIESEL' ? '경유' : null
                  const liters = r.price_per_liter && r.price_per_liter > 0 ? (r.amount / r.price_per_liter).toFixed(1) : null
                  const [, mm, dd] = r.fueled_at.split('-')
                  return (
                    <li key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < (fuelRecords ?? []).length - 1 ? '1px solid #F2F2F7' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'center', minWidth: 36 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#F5A400', display: 'block' }}>{parseInt(mm)}월</span>
                          <span style={{ fontSize: 13, color: '#8E8E93', display: 'block' }}>{parseInt(dd)}일</span>
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{formatKRW(r.amount)}</p>
                          <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>
                            {liters ? `${liters}L` : ''}{liters && fuelLabel ? ' ' : ''}{fuelLabel ? `(${fuelLabel})` : ''}
                            {r.memo ? (liters || fuelLabel ? ' · ' : '') + r.memo : ''}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
