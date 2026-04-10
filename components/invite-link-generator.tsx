"use client";

import { useState } from 'react';
import clsx from 'clsx';

type TargetRole = 'PARENT' | 'DRIVER';

const ROLE_OPTIONS: { value: TargetRole; label: string; desc: string }[] = [
  { value: 'PARENT', label: '학부모', desc: '자녀 정보 포함 가입' },
  { value: 'DRIVER', label: '버스기사', desc: '기사 계정 생성' },
];

export function InviteLinkGenerator() {
  const [targetRole, setTargetRole] = useState<TargetRole>('PARENT');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setGeneratedLink('');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours, targetRole }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }

      const base = typeof window !== 'undefined' ? window.location.origin : '';
      setGeneratedLink(`${base}/signup?token=${data.token}`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="ui-card ui-card-pad space-y-5">
      <div>
        <h2 className="mb-1 text-xl font-bold text-sp-text">초대 링크 생성</h2>
        <p className="text-sm text-sp-muted">1회용 링크로만 가입 가능합니다. 링크를 카카오톡/문자로 전송하세요.</p>
      </div>

      {/* 역할 선택 */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-sp-text">초대 대상</span>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTargetRole(opt.value); setGeneratedLink(''); }}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition',
                targetRole === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-sp-border bg-sp-surface text-sp-muted hover:border-primary-200'
              )}
            >
              <span className="text-base font-bold">{opt.label}</span>
              <span className="text-xs font-normal">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 유효기간 선택 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-sp-text">유효 기간</span>
        {([
          { label: '24시간', value: 24 },
          { label: '7일', value: 168 },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setExpiresInHours(opt.value)}
            className={clsx(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition',
              expiresInHours === opt.value
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-sp-border bg-sp-surface text-sp-muted hover:border-primary-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className={clsx(
          'w-full rounded-2xl py-3 text-base font-semibold transition',
          loading ? 'bg-sp-high text-sp-muted' : 'bg-primary-600 text-white hover:bg-primary-500 active:scale-[.98]'
        )}
      >
        {loading ? '링크 생성 중...' : `${targetRole === 'PARENT' ? '학부모' : '버스기사'} 초대 링크 생성`}
      </button>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      )}

      {generatedLink && (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {targetRole === 'PARENT' ? '학부모용' : '버스기사용'}
            </span>
            <p className="text-xs font-semibold text-emerald-800">초대 링크 생성 완료</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
            <p className="break-all text-xs text-sp-muted">{generatedLink}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-xl border border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[.98]"
            >
              {copied ? '✅ 복사됨!' : '링크 복사'}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => navigator.share?.({ title: '통학버스 가입 초대', url: generatedLink })}
                className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-500 active:scale-[.98]"
              >
                공유하기
              </button>
            )}
          </div>
          <p className="text-xs text-emerald-700">⚠️ 1회만 사용 가능 · {expiresInHours === 24 ? '24시간' : '7일'} 후 만료</p>
        </div>
      )}
    </div>
  );
}
