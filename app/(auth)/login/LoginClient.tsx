"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';

import { BusIcon } from '@/components/layout/icons';
import { loginSchema } from '@/lib/validation';
import { fireAutoPopup } from '@/lib/ui/swal';

const STORAGE_KEY = 'bus-login-preferences';

const ROLE_MAP = {
  admin: {
    label: '관리자',
    value: 'ADMIN' as const,
    description: '학생·노선·입금 현황을 한번에 관리합니다.'
  },
  parent: {
    label: '학부모',
    value: 'PARENT' as const,
    description: '자녀 탑승지점 변경과 입금 현황을 확인하세요.'
  }
} as const;

type RoleKey = keyof typeof ROLE_MAP;

type StoredPreferences = {
  email: string;
  role: RoleKey;
  timestamp: number;
};

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get('role');
  const defaultRole: RoleKey = roleParam === 'admin' ? 'admin' : 'parent';

  const [role, setRole] = useState<RoleKey>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupRole, setSignupRole] = useState<RoleKey>('parent');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupParentPhone, setSignupParentPhone] = useState('');
  const [signupStudentName, setSignupStudentName] = useState('');
  const [signupStudentPhone, setSignupStudentPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAdminEmail, setSignupAdminEmail] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const logoutShownRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as StoredPreferences;
      if (Date.now() - parsed.timestamp <= 1000 * 60 * 30) {
        setRole(parsed.role);
        setEmail(parsed.email);
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    if (searchParams?.get('loggedOut') !== '1') return;
    if (logoutShownRef.current) return;
    logoutShownRef.current = true;
    void (async () => {
      await fireAutoPopup({
        icon: 'success',
        title: '로그아웃 완료',
        text: '고객님의 정보를 안전하게 로그아웃 처리하였습니다.'
      });
      router.replace('/login');
    })();
  }, [searchParams, router]);

  useEffect(() => {
    if (signupRole !== 'parent') {
      setSignupAdminEmail('');
      setSignupParentPhone('');
      setSignupStudentName('');
      setSignupStudentPhone('');
    }
  }, [signupRole]);

  const roleCards = useMemo(() => Object.entries(ROLE_MAP) as [RoleKey, (typeof ROLE_MAP)[RoleKey]][], []);

  function resetSignupForm() {
    setSignupRole('parent');
    setSignupEmail('');
    setSignupName('');
    setSignupParentPhone('');
    setSignupStudentName('');
    setSignupStudentPhone('');
    setSignupPassword('');
    setSignupAdminEmail('');
    setSignupError(null);
    setSigningUp(false);
  }

  async function handleSignupSubmit() {
    if (signingUp) return;

    setSignupError(null);
    setSigningUp(true);

    const isParent = signupRole === 'parent';
    const payload = {
      email: signupEmail.trim(),
      name: signupName.trim(),
      password: signupPassword,
      role: isParent ? 'PARENT' : 'ADMIN',
      adminEmail: isParent ? signupAdminEmail.trim() : undefined,
      studentName: isParent ? signupStudentName.trim() : undefined,
      studentPhone: isParent ? signupStudentPhone.trim() : undefined,
      parentPhone: isParent ? signupParentPhone.trim() : undefined
    };

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        const msg = data?.error ?? '회원가입 요청 처리에 실패했습니다.';
        setSignupError(msg);
        return;
      }

      await fireAutoPopup({
        icon: 'success',
        title: '회원가입 요청 완료',
        text: '가입 요청이 처리되었습니다. 로그인 후 서비스를 이용해주세요.'
      });

      setSignupOpen(false);
      resetSignupForm();
    } catch {
      setSignupError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSigningUp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const parsed = loginSchema.safeParse({
      email,
      password,
      role: ROLE_MAP[role].value
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? '로그인 정보를 다시 확인해주세요.');
      setLoading(false);
      return;
    }

    const redirectUrl = role === 'admin' ? '/admin' : '/dashboard';

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      role: ROLE_MAP[role].value,
      callbackUrl: redirectUrl
    });

    setLoading(false);

    if (result?.error) {
      const code = result.error.toString();
      if (code.includes('CredentialsSignin')) {
        setError('이메일/비밀번호/역할을 확인해주세요.');
      } else {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      return;
    }

    try {
      const payload: StoredPreferences = {
        email,
        role,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    const session = await getSession();
    const displayName = session?.user?.name ?? email;
    await fireAutoPopup({
      icon: 'success',
      title: `${displayName}님 환영합니다!`,
      text: '로그인에 성공했습니다. 대시보드로 이동합니다.'
    });
    router.push(result?.url ?? redirectUrl);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-[100dvh] box-border items-center justify-center overflow-hidden px-4 py-6 md:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-10 h-44 w-44 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute right-[-3rem] top-16 h-56 w-56 rounded-full bg-accent-100/70 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-64 w-64 rounded-full bg-primary-200/50 blur-[90px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-xl ui-card rounded-[32px] p-8 text-slate-900 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary-100/70 p-3">
            <BusIcon className="h-7 w-7 text-primary-600" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold">셔틀콕! 로그인</h1>
          </div>
        </div>

        <p className="mt-4 text-lg text-slate-700">역할을 선택하고 정보를 입력해주세요. 최근 로그인 정보는 자동으로 저장됩니다.</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {roleCards.map(([key, info]) => {
            const selected = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={clsx(
                  'rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
                  selected
                    ? 'border-primary-300 bg-primary-50 text-primary-800 shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800'
                )}
              >
                <span className="text-lg font-semibold">{info.label}</span>
                <p className={clsx('mt-2 text-base', selected ? 'text-primary-700' : 'text-slate-700')}>{info.description}</p>
              </button>
            );
          })}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-base font-semibold text-slate-700" htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ui-input px-4 py-3.5 text-lg"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-semibold text-slate-700" htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="ui-input px-4 py-3.5 text-lg"
              placeholder="영문, 숫자 포함 8자 이상"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className={clsx(
              'w-full ui-btn py-4 text-lg font-semibold',
              loading ? 'bg-slate-200 text-slate-500 hover:bg-slate-200' : 'bg-primary-600 text-white hover:bg-primary-500'
            )}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            onClick={() => { setSignupError(null); setSignupOpen(true); }}
            className="ui-btn-outline px-4 py-2 text-slate-700"
          >
            회원가입 요청
          </button>
          <p>자동로그인: 최근 30분 내 로그인 기록</p>
        </div>

      </motion.div>

      {signupOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-[520px] max-w-[90vw] ui-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">회원가입 요청</h2>
              <button
                type="button"
                onClick={() => { setSignupOpen(false); resetSignupForm(); }}
                className="ui-btn-outline px-3 py-1 text-sm text-slate-600"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {roleCards.map(([key, info]) => {
                const selected = signupRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSignupRole(key)}
                    className={clsx(
                      'rounded-2xl border px-4 py-3 text-left text-sm transition',
                      selected ? 'border-primary-300 bg-primary-50 text-primary-800' : 'border-slate-200 bg-white text-slate-700'
                    )}
                  >
                    <span className="font-semibold">{info.label}</span>
                    <p className="mt-1 text-xs">{info.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3">
              <input
                type="text"
                placeholder="이름"
                value={signupName}
                onChange={(event) => setSignupName(event.target.value)}
                className="ui-input px-4 py-3"
              />
              <input
                type="email"
                placeholder="이메일"
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                className="ui-input px-4 py-3"
              />
              {signupRole === 'parent' ? (
                <>
                  <input
                    type="email"
                    placeholder="담당 기사님(관리자) 이메일"
                    value={signupAdminEmail}
                    onChange={(event) => setSignupAdminEmail(event.target.value)}
                    className="ui-input px-4 py-3"
                  />
                  <input
                    type="text"
                    placeholder="학부모 전화번호"
                    value={signupParentPhone}
                    onChange={(event) => setSignupParentPhone(event.target.value)}
                    className="ui-input px-4 py-3"
                  />
                  <input
                    type="text"
                    placeholder="학생 이름"
                    value={signupStudentName}
                    onChange={(event) => setSignupStudentName(event.target.value)}
                    className="ui-input px-4 py-3"
                  />
                  <input
                    type="text"
                    placeholder="학생 전화번호"
                    value={signupStudentPhone}
                    onChange={(event) => setSignupStudentPhone(event.target.value)}
                    className="ui-input px-4 py-3"
                  />
                </>
              ) : null}
              <input
                type="password"
                placeholder="비밀번호"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                className="ui-input px-4 py-3"
              />
            </div>

            {signupError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {signupError}
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setSignupOpen(false); resetSignupForm(); }}
                className="ui-btn-outline px-4 py-2 text-base text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSignupSubmit}
                className={clsx(
                  'ui-btn px-4 py-2 text-base font-semibold',
                  signingUp ? 'bg-slate-200 text-slate-500 hover:bg-slate-200' : 'bg-primary-600 text-white'
                )}
                disabled={signingUp}
              >
                {signingUp ? '요청 처리 중...' : '요청 보내기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
