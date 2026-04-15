import Link from 'next/link'

interface Props {
  fullName: string
}

export default function ParentHeader({ fullName }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#C6C6C8] h-14 flex items-center justify-between px-4">
      <span className="text-xl font-bold text-[#F5A400]">🚌</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#6C6C70]">{fullName}</span>
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
