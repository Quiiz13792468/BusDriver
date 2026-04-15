import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/dashboard')

  const { studentId } = await params

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">학생 상세</h1>
      {/* TODO: 학생 상세 정보, 편집, 월별 입금 내역 */}
      <p className="text-[#6C6C70] text-sm">studentId: {studentId}</p>
    </div>
  )
}
