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
    .select('id, name, schools(name)')
    .eq('driver_id', userId)
    .eq('is_active', true)
    .order('name')

  const students = (studentsRaw ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    school_name: (s.schools as unknown as { name: string } | null)?.name ?? null,
  }))

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#C6C6C8] h-14 flex items-center justify-between px-4">
      <span className="font-bold text-[#F5A400]" style={{ fontSize: 36, lineHeight: 1 }}>🚌</span>

      <div className="flex items-center gap-2">
        <GlobalActions students={students} />
        <span className="text-sm text-[#6C6C70]">{fullName}</span>
        <Link
          href="/settings"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          aria-label="설정"
        >
          ⚙️
        </Link>
      </div>
    </header>
  )
}
