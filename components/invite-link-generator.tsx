"use client";

import { useState } from 'react';
import clsx from 'clsx';

export function InviteLinkGenerator() {
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
        body: JSON.stringify({ expiresInHours }),
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
    <div className="ui-card ui-card-pad space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">학부모 초대 링크 생성</h2>
        <p className="mt-0.5 text-sm text-slate-500">1회용 링크로만 가입 가능합니다. 링크를 카카오톡/문자로 전송하세요.</p>
      </div>

      {/* 유효기간 선택 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">유효 기간</span>
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
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
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
          'w-full rounded-2xl py-3 text-sm font-semibold transition',
          loading ? 'bg-slate-200 text-slate-500' : 'bg-primary-600 text-white hover:bg-primary-500 active:scale-[.98]'
        )}
      >
        {loading ? '링크 생성 중...' : '초대 링크 생성'}
      </button>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      )}

      {generatedLink && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-800">생성된 초대 링크</p>
          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
            <p className="break-all text-xs text-slate-700">{generatedLink}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-xl border border-emerald-300 bg-white py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[.98]"
            >
              {copied ? '✅ 복사됨!' : '링크 복사'}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => navigator.share?.({ title: '통학버스 가입 초대', url: generatedLink })}
                className="flex-1 rounded-xl bg-primary-600 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 active:scale-[.98]"
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
