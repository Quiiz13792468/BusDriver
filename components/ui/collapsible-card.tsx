"use client";

import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type CollapsibleCardProps = {
  title: string;
  description?: string;
  buttonLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  description,
  buttonLabel = '열기',
  defaultOpen = false,
  children
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="ui-card ui-card-pad">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
          {description ? <p className="text-base text-slate-700">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="ui-btn-outline inline-flex items-center gap-2 border-primary-200 px-4 py-2 text-base text-primary-700 hover:border-primary-400 hover:text-primary-800"
        >
          <ChevronIcon open={open} />
          {open ? '닫기' : buttonLabel}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-slate-100 pt-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
