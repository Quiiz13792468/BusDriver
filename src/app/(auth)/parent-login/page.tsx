// 학부모 전용 로그인 페이지
import LoginFormBase from '../login/LoginFormBase'

export default function ParentLoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* 앱 아이콘 */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🚌</div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <LoginFormBase role="PARENT" />
      </div>
    </div>
  )
}
