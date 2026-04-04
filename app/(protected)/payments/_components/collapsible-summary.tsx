"use client";

import { useState, useRef } from 'react';
import { ReactNode } from 'react';

type CollapsibleSummaryProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSummary({ title, defaultOpen = false, children }: CollapsibleSummaryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ui-collapse">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={open}
      >
        <span className="ui-collapse-summary">{title}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className={`transition-[grid-template-rows,opacity] duration-300 ease-in-out grid ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="ui-collapse-panel">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
