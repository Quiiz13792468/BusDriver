"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { BusIcon } from '@/components/layout/icons';

type TokenState = 'loading' | 'valid' | 'invalid';
type TargetRole = 'PARENT' | 'DRIVER';
type StudentInput = { name: string; phone: string };

export function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [targetRole, setTargetRole] = useState<TargetRole>('PARENT');
  const [expiresAt, setExpiresAt] = useState('');

  // 공통 필드
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 학생 목록 (학부모 전용)
  const [students, setStudents] = useState<StudentInput[]>([{ name: '', phone: '' }]);

  // 토큰 유효성 확인
  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setTargetRole(data.targetRole === 'DRIVER' ? 'DRIVER' : 'PARENT');
          setExpiresAt(data.expiresAt);
          setTokenState('valid');
        } else {
          setTokenState('invalid');
        }
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  function addStudent() {
    setStudents((prev) => [...prev, { name: '', phone: '' }]);
  }

  function removeStudent(idx: number) {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateStudent(idx: number, field: keyof StudentInput, value: string) {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (targetRole === 'PARENT') {
      const emptyStudent = students.find((s) => !s.name.trim());
      if (emptyStudent) {
        setError('자녀 이름을 모두 입력해주세요.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
          phone: phone.trim(),
          inviteToken: token,
          students: targetRole === 'PARENT' ? students.map((s) => ({ name: s.name.trim(), phone: s.phone.trim() })) : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? '회원가입 처리 중 오류가 발생했습니다.');
        return;
      }
      router.push('/login?signedUp=1');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (tokenState === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-sp-muted">초대 링크 확인 중...</p>
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <svg className="h-8 w-8 text-rose-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mb-1 text-xl font-bold text-sp-text">유효하지 않은 초대 링크</h2>
          <p className="mt-2 text-base text-sp-muted">
            링크가 만료되었거나 이미 사용된 링크입니다.<br />
            담당 관리자께 새 초대 링크를 요청해주세요.
          </p>
          <Link href="/login" className="mt-6 inline-block rounded-2xl bg-primary-600 px-6 py-3 text-base font-semibold text-white">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  const expiryText = expiresAt
    ? `${new Date(expiresAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}까지 유효`
    : '';

  const isParent = targetRole === 'PARENT';

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md ui-card rounded-[32px] p-6 shadow-2xl sm:p-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary-100/70 p-3">
            <BusIcon className="h-7 w-7 text-primary-600" />
          </span>
          <div>
            <h2 className="mb-1 text-xl font-bold text-sp-text">
              {isParent ? '학부모 회원가입' : '버스기사 회원가입'}
            </h2>
            <p className="text-xs text-sp-muted">{expiryText}</p>
          </div>
        </div>

        {/* 초대 확인 배너 */}
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">✅ 초대 링크가 확인되었습니다</p>
          <p className="mt-0.5 text-xs text-emerald-700">
            {isParent
              ? '가입 완료 후 담당 관리자와 자동으로 연동됩니다.'
              : '가입 완료 후 관리자 승인 후 이용 가능합니다.'}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* 공통: 이름 */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-sp-text">
              {isParent ? '학부모 이름' : '이름'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ui-input px-4 py-3"
              placeholder="홍길동"
              required
            />
          </div>

          {/* 공통: 이메일 */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-sp-text">이메일 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input px-4 py-3"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* 공통: 전화번호 */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-sp-text">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="ui-input px-4 py-3"
              placeholder="010-0000-0000"
              inputMode="tel"
            />
          </div>

          {/* 공통: 비밀번호 */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-sp-text">비밀번호 *</label>
            <div className="relative">
              <input
                type={pwVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input px-4 py-3 pr-12"
                placeholder="영문, 숫자 포함 8자 이상"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setPwVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sp-muted hover:text-sp-text"
                aria-label={pwVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {pwVisible ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* 학부모 전용: 자녀 정보 */}
          {isParent && (
            <div className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-sp-text">자녀 정보</p>
                  <p className="text-xs text-sp-muted">자녀가 여러 명이면 + 버튼으로 추가하세요</p>
                </div>
                <button
                  type="button"
                  onClick={addStudent}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 active:scale-95"
                  aria-label="자녀 추가"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {students.map((student, idx) => (
                <div key={idx} className="space-y-2 rounded-xl border border-primary-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-700">자녀 {idx + 1}</span>
                    {students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                        aria-label="자녀 삭제"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-sp-text">이름 *</label>
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                      className="ui-input px-3 py-2.5 text-base"
                      placeholder="자녀 이름"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-sp-text">연락처</label>
                    <input
                      type="tel"
                      value={student.phone}
                      onChange={(e) => updateStudent(idx, 'phone', e.target.value)}
                      className="ui-input px-3 py-2.5 text-base"
                      placeholder="010-0000-0000"
                      inputMode="tel"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              'w-full rounded-2xl py-4 text-base font-semibold transition',
              submitting
                ? 'bg-sp-high text-sp-muted'
                : 'bg-primary-600 text-white hover:bg-primary-500 active:scale-[.98]'
            )}
          >
            {submitting ? '가입 처리 중...' : '가입 완료'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-sp-muted">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
