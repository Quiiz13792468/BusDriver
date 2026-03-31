"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { BusIcon } from '@/components/layout/icons';
import { markTokenUsed } from '@/lib/data/invite';

type TokenState = 'loading' | 'valid' | 'invalid';

export function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [adminId, setAdminId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 토큰 유효성 확인
  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAdminId(data.adminId);
          setExpiresAt(data.expiresAt);
          setTokenState('valid');
        } else {
          setTokenState('invalid');
        }
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
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
          role: 'PARENT',
          inviteToken: token, // 서버에서 토큰으로 adminId 검증
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
        <p className="text-slate-500">초대 링크 확인 중...</p>
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
          <h1 className="text-xl font-bold text-slate-900">유효하지 않은 초대 링크</h1>
          <p className="mt-2 text-sm text-slate-600">
            링크가 만료되었거나 이미 사용된 링크입니다.<br />
            담당 기사님께 새 초대 링크를 요청해주세요.
          </p>
          <Link href="/login" className="mt-6 inline-block rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white">
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  const expiryText = expiresAt
    ? `${new Date(expiresAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}까지 유효`
    : '';

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md ui-card rounded-[32px] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary-100/70 p-3">
            <BusIcon className="h-7 w-7 text-primary-600" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">학부모 회원가입</h1>
            <p className="text-xs text-slate-500">{expiryText}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">✅ 초대 링크가 확인되었습니다</p>
          <p className="mt-0.5 text-xs text-emerald-700">가입 완료 후 담당 기사님과 자동으로 연동됩니다.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-base font-semibold text-slate-700">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ui-input px-4 py-3"
              placeholder="홍길동"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-base font-semibold text-slate-700">이메일 *</label>
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
          <div>
            <label className="mb-1.5 block text-base font-semibold text-slate-700">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="ui-input px-4 py-3"
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-base font-semibold text-slate-700">비밀번호 *</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
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
                ? 'bg-slate-200 text-slate-500'
                : 'bg-primary-600 text-white hover:bg-primary-500 active:scale-[.98]'
            )}
          >
            {submitting ? '가입 처리 중...' : '가입 완료'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
