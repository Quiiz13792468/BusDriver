'use client'

// 비밀번호 찾기 4단계 플로우 (전화번호 → 인증번호 → 새 비밀번호 → 완료)

import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
  accent: string
}

export default function ForgotPassword({ onBack, accent }: Props) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [sent, setSent] = useState(false)
  const [timer, setTimer] = useState(180)

  useEffect(() => {
    if (!sent || step !== 2) return
    if (timer <= 0) return
    const t = setInterval(() => setTimer((v) => v - 1), 1000)
    return () => clearInterval(t)
  }, [sent, step, timer])

  const mmss = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`

  const sendCode = () => {
    setSent(true)
    setTimer(180)
    setStep(2)
  }

  const resend = () => {
    setTimer(180)
    setCode('')
  }

  const inputCls =
    'w-full bg-[#F2F2F7] rounded-xl px-4 text-lg border-[1.5px] border-[#E5E5EA] text-[#111] outline-none focus:border-[#aaa] h-14 box-border'

  const handleBack = () => {
    if (step === 1 || step === 4) onBack()
    else setStep(step - 1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7]">
      {/* 상단 바 */}
      <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-1.5 flex-shrink-0">
        <button
          onClick={handleBack}
          style={{ color: accent }}
          className="text-[30px] font-black min-w-[44px] min-h-[44px] px-2 flex items-center justify-center leading-none"
        >
          ‹
        </button>
        <span className="text-[19px] font-black text-[#111]">비밀번호 찾기</span>
      </div>

      {/* 단계 표시 바 */}
      {step < 4 && (
        <div className="flex gap-1.5 px-6 pb-[18px] pt-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{ background: step >= s ? accent : '#E5E5EA' }}
              className="flex-1 h-[5px] rounded-full transition-colors"
            />
          ))}
        </div>
      )}

      <div className="flex flex-col flex-1 px-6 pb-8 pt-2">
        {/* 1단계: 휴대폰 번호 입력 */}
        {step === 1 && (
          <>
            <div className="text-[24px] font-black text-[#111] mb-2">휴대폰 번호 입력</div>
            <div className="text-sm text-[#8E8E93] mb-7 leading-relaxed">
              가입 시 등록하신 휴대폰 번호로<br />인증번호를 보내드립니다
            </div>
            <div className="flex-1">
              <label className="block text-[15px] font-semibold text-[#333] mb-2">휴대폰 번호</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={inputCls}
              />
            </div>
            <button
              onClick={sendCode}
              disabled={!phone}
              style={{
                background: accent,
                boxShadow: `0 3px 10px ${accent}50`,
                opacity: phone ? 1 : 0.5,
              }}
              className="w-full h-[60px] text-white rounded-[14px] text-[19px] font-black disabled:cursor-default"
            >
              인증번호 받기
            </button>
          </>
        )}

        {/* 2단계: 인증번호 입력 */}
        {step === 2 && (
          <>
            <div className="text-[24px] font-black text-[#111] mb-2">인증번호 입력</div>
            <div className="text-sm text-[#8E8E93] mb-6 leading-relaxed">
              <span className="font-bold text-[#111]">{phone}</span>으로<br />보낸 6자리 인증번호를 입력하세요
            </div>
            <div className="flex-1">
              <label className="block text-[15px] font-semibold text-[#333] mb-2">인증번호</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6자리 숫자"
                  className={`${inputCls} pr-[70px] text-[22px] tracking-[6px] font-bold`}
                />
                <span
                  style={{ color: timer > 30 ? accent : '#FF3B30' }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-bold"
                >
                  {mmss}
                </span>
              </div>
              <button
                onClick={resend}
                className="mt-2.5 text-sm text-[#8E8E93] underline py-1.5"
              >
                인증번호 다시 보내기
              </button>
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={code.length < 6}
              style={{
                background: accent,
                boxShadow: `0 3px 10px ${accent}50`,
                opacity: code.length >= 6 ? 1 : 0.5,
              }}
              className="w-full h-[60px] text-white rounded-[14px] text-[19px] font-black disabled:cursor-default"
            >
              확인
            </button>
          </>
        )}

        {/* 3단계: 새 비밀번호 설정 */}
        {step === 3 && (
          <>
            <div className="text-[24px] font-black text-[#111] mb-2">새 비밀번호 설정</div>
            <div className="text-sm text-[#8E8E93] mb-6 leading-relaxed">
              새롭게 사용하실 비밀번호를 설정해주세요
            </div>
            <div className="flex-1 space-y-[18px]">
              <div>
                <label className="block text-[15px] font-semibold text-[#333] mb-2">새 비밀번호</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="8자 이상"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[15px] font-semibold text-[#333] mb-2">비밀번호 확인</label>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className={inputCls}
                />
                {pw && pw2 && pw !== pw2 && (
                  <div className="text-[13px] text-[#FF3B30] font-semibold mt-2">
                    ⚠️ 비밀번호가 일치하지 않습니다
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setStep(4)}
              disabled={!pw || pw.length < 8 || pw !== pw2}
              style={{
                background: accent,
                boxShadow: `0 3px 10px ${accent}50`,
                opacity: pw && pw.length >= 8 && pw === pw2 ? 1 : 0.5,
              }}
              className="w-full h-[60px] text-white rounded-[14px] text-[19px] font-black disabled:cursor-default"
            >
              비밀번호 변경
            </button>
          </>
        )}

        {/* 4단계: 완료 */}
        {step === 4 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <div
                style={{
                  background: accent,
                  boxShadow: `0 6px 20px ${accent}40`,
                  width: 88,
                  height: 88,
                }}
                className="rounded-full flex items-center justify-center text-[44px] text-white font-black mb-6"
              >
                ✓
              </div>
              <div className="text-[26px] font-black text-[#111] mb-2.5">비밀번호 변경 완료</div>
              <div className="text-[15px] text-[#8E8E93] leading-relaxed">
                새 비밀번호로 다시 로그인해주세요
              </div>
            </div>
            <button
              onClick={onBack}
              style={{ background: accent, boxShadow: `0 3px 10px ${accent}80` }}
              className="w-full h-[60px] text-white rounded-[14px] text-[19px] font-black"
            >
              로그인 화면으로
            </button>
          </>
        )}
      </div>
    </div>
  )
}
