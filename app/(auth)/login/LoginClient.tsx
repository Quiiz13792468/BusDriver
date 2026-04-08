"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

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
  const inactiveShownRef = useRef(false);

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
    if (searchParams?.get('loggedOut') !== '1') return;
    if (logoutShownRef.current) return;
    logoutShownRef.current = true;
    router.replace('/login');
    void fireAutoPopup({
      icon: 'success',
      title: '로그아웃 완료',
      text: '고객님의 정보를 안전하게 로그아웃 처리하였습니다.'
    });
  }, [searchParams, router]);

  useEffect(() => {
    if (searchParams?.get('reason') !== 'inactive') return;
    if (inactiveShownRef.current) return;
    inactiveShownRef.current = true;
    router.replace('/login');
    void fireAutoPopup({
      icon: 'warning',
      title: '자동 로그아웃',
      text: '30분 이상 활동이 없어 자동으로 로그아웃되었습니다.'
    });
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

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
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

    const redirectUrl = '/dashboard';

    const supabase = createBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !data.user) {
      setError('이메일/비밀번호를 확인해주세요.');
      setLoading(false);
      return;
    }

    // Verify role matches
    const userRole = data.user.app_metadata?.role as string;
    if (userRole !== ROLE_MAP[role].value) {
      // signOut 대신 에러만 표시 — signOut 호출 시 로그아웃 팝업이 트리거될 수 있음
      await supabase.auth.signOut({ scope: 'local' });
      setError('선택한 역할과 계정 역할이 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    setLoading(false);

    try {
      const payload: StoredPreferences = {
        email,
        role,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    // 팝업과 라우팅을 동시에 시작하여 1.5초 내 대시보드 진입 보장
    void import('sweetalert2').then(({ default: Swal }) =>
      Swal.fire({
        icon: 'success',
        title: '로그인 성공',
        text: '대시보드로 이동합니다.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      })
    );
    router.push(redirectUrl);
  }

  return (
    <div className="relative flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-4rem] top-10 h-44 w-44 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute right-[-3rem] top-16 h-56 w-56 rounded-full bg-sp-green/5 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-64 w-64 rounded-full bg-primary-600/8 blur-[90px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-sm ui-card p-4 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="rounded-xl bg-primary-600 p-2">
            <BusIcon className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">셔틀콕!</h1>
            <p className="text-base text-sp-muted leading-tight">통학버스 관리 서비스</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {roleCards.map(([key, info]) => {
            const selected = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={clsx(
                  'rounded-xl border px-3 py-3.5 text-center text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                    : 'border-sp-line bg-sp-raised text-sp-muted hover:border-primary-600 hover:text-sp-text'
                )}
              >
                {info.label}
              </button>
            );
          })}
        </div>

        <p className="mt-2 min-h-[1.25rem] text-base text-sp-muted leading-snug">
          {ROLE_MAP[role].description}
        </p>

        <form className="mt-2 space-y-2.5" onSubmit={handleSubmit}>
          <div>
            <label className="text-base font-semibold text-sp-muted" htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ui-input mt-1"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-base font-semibold text-sp-muted" htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="ui-input mt-1"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-800 bg-rose-900/30 px-3 py-2 text-sm text-rose-400">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full ui-btn font-semibold"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-2.5 flex justify-end">
          <button
            type="button"
            onClick={() => { setSignupError(null); setSignupOpen(true); }}
            className="min-h-[44px] px-2 text-base text-sp-muted underline-offset-2 hover:text-sp-text hover:underline"
          >
            회원가입 요청
          </button>
        </div>

      </motion.div>

      {signupOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm ui-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sp-text">회원가입 요청</h2>
              <button
                type="button"
                onClick={() => { setSignupOpen(false); resetSignupForm(); }}
                className="min-h-[44px] px-3 text-base text-sp-faint hover:text-sp-text"
              >
                닫기
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {roleCards.map(([key, info]) => {
                const selected = signupRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSignupRole(key)}
                    className={clsx(
                      'rounded-xl border px-3 py-3 text-center text-base font-semibold transition',
                      selected ? 'border-primary-600 bg-primary-600/20 text-primary-300' : 'border-sp-line bg-sp-raised text-sp-muted'
                    )}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>

            {signupRole === 'parent' ? (
              <div className="mt-3 rounded-xl border border-emerald-700 bg-emerald-900/20 px-4 py-4 text-center">
                <p className="text-base font-semibold text-emerald-400">학부모 가입은 초대 링크로만 가능합니다</p>
                <p className="mt-1.5 text-base text-emerald-500 leading-snug">담당 버스 기사님께<br />초대 링크를 요청해 주세요.</p>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                <input
                  type="text"
                  placeholder="이름"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  className="ui-input"
                />
                <input
                  type="email"
                  placeholder="이메일"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  className="ui-input"
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  className="ui-input"
                />
              </div>
            )}

            {signupError ? (
              <div className="mt-3 rounded-xl border border-rose-800 bg-rose-900/30 px-3 py-2 text-sm text-rose-400">
                {signupError}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setSignupOpen(false); resetSignupForm(); }}
                className="ui-btn-outline px-4 py-3 text-base"
              >
                취소
              </button>
              {signupRole !== 'parent' && (
                <button
                  type="button"
                  onClick={handleSignupSubmit}
                  className={clsx(
                    'ui-btn-accent px-4 py-3 text-base font-semibold',
                    signingUp ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                  disabled={signingUp}
                >
                  {signingUp ? '처리 중...' : '요청 보내기'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
