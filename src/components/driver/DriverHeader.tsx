import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GlobalActions from './GlobalActions'

interface Props {
  fullName: string
  userId: string
}

export default async function DriverHeader({ fullName, userId }: Props) {
  const supabase = await createClient()

  const { data: studentsRaw } = await supabase
    .from('students')
    .select('id, name, custom_fee, schools(name, default_fee)')
    .eq('driver_id', userId)
    .eq('is_active', true)
    .order('name')

  const students = (studentsRaw ?? []).map((s) => {
    const school = s.schools as unknown as { name: string; default_fee: number | null } | null
    return {
      id: s.id,
      name: s.name,
      school_name: school?.name ?? null,
      default_fee: (s.custom_fee ?? school?.default_fee) ?? null,
    }
  })

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA] flex items-center px-4 gap-2" style={{ padding: '12px 16px 10px', height: 'auto' }}>
      <span style={{ fontSize: 26, lineHeight: 1 }}>🚌</span>

      <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
        <GlobalActions students={students} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: '#444', fontWeight: 500 }}>{fullName}</span>
        <Link href="/settings" aria-label="설정" style={{ fontSize: 22, lineHeight: 1 }}>
          ⚙️
        </Link>
      </div>
    </header>
  )
}
