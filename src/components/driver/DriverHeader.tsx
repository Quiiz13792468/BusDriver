import Link from 'next/link'

interface Props {
  fullName: string
}

export default function DriverHeader({ fullName }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#C6C6C8] h-14 flex items-center justify-between px-4">
      {/* 앱 아이콘 */}
      <span className="text-xl font-bold text-[#F5A400]">🚌</span>

      {/* 글로벌 액션 + 이름 + 설정 */}
      <div className="flex items-center gap-2">
        <button
          className="h-9 px-3 rounded-full bg-[#F5A400] text-black text-sm font-semibold"
          aria-label="입금 등록"
        >
          입금
        </button>
        <button
          className="h-9 px-3 rounded-full bg-white border border-[#C6C6C8] text-sm font-semibold"
          aria-label="주유 등록"
        >
          주유
        </button>
        <span className="text-sm text-[#6C6C70] ml-1">{fullName}</span>
        <Link
          href="/settings"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F2F2F7]"
          aria-label="설정"
        >
          ⚙️
        </Link>
      </div>
    </header>
  )
}
