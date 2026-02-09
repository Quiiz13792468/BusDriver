'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type YearSwitcherProps = {
  years: number[];
  activeYear: number;
  className?: string;
};

export function YearSwitcher({ years, activeYear, className }: YearSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleClick = (year: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (year === years[years.length - 1]) {
      params.delete('year');
    } else {
      params.set('year', String(year));
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => handleClick(year)}
          className={`text-base font-semibold transition ${year === activeYear ? 'ui-btn' : 'ui-btn-outline'} ${
            year === activeYear
              ? 'shadow'
              : 'bg-white/80 text-slate-700 hover:bg-primary-50 hover:text-primary-700'
          }`}
        >
          {year}년
        </button>
      ))}
    </div>
  );
}
