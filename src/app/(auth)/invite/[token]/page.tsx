interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-center mb-8">회원가입</h1>
      {/* TODO: 초대 토큰 검증 + 가입 폼 구현 */}
      <p className="text-center text-gray-500 text-sm break-all">token: {token}</p>
    </div>
  )
}
