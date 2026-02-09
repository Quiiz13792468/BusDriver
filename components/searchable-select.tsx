"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label?: string } | string;

export type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  buttonClassName?: string;
  label?: string;
};

export function SearchableSelect({ options, value, onChange, placeholder = '검색...', buttonClassName, label }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const effectivePlaceholder = placeholder ?? '검색...';

  const normalized = useMemo(() => {
    return options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value, label: opt.label ?? opt.value }));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((o) => (o.label ?? '').toLowerCase().includes(q));
  }, [normalized, query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const currentLabel = normalized.find((o) => o.value === value)?.label ?? '';

  return (
    <div className="relative">
      {label ? <div className="mb-1 text-base font-semibold text-slate-700">{label}</div> : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ||
          'ui-select text-left text-slate-700 hover:border-primary-200'
        }
      >
        {currentLabel || effectivePlaceholder}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#13201f]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md ui-card ui-card-pad shadow-2xl">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selected = filtered[activeIndex];
                    if (selected) {
                      onChange(selected.value);
                      setOpen(false);
                      setQuery('');
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setOpen(false);
                    setQuery('');
                  }
                }}
                placeholder={effectivePlaceholder}
                className="ui-input"
              />
              <button
                type="button"
                className="ui-btn-outline px-3 py-2.5 text-base text-slate-700 hover:bg-white"
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                }}
              >
                닫기
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-slate-100 bg-white/70">
              {filtered.map((o, idx) => (
                <button
                  key={o.value + idx}
                  type="button"
                  className={`block w-full px-4 py-2.5 text-left text-base ${
                    idx === activeIndex ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-white'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {o.label}
                </button>
              ))}
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-base text-slate-700">검색 결과가 없습니다.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
