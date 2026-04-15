import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* 앱 로고 */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🚌</div>
        <h1 className="text-2xl font-bold text-black">버스드라이버</h1>
        <p className="text-sm text-[#6C6C70] mt-1">통학버스 관리 시스템</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  )
}
