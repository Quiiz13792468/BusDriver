// 인증 화면 공통 레이아웃 (로그인, 초대 등)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F2F2F7]">{children}</div>
}
