"use client";

import Link, { LinkProps } from 'next/link';
import { PropsWithChildren } from 'react';
import { useNavigationOverlay } from '@/components/navigation-overlay';

type LinkWithLoadingProps = PropsWithChildren<LinkProps & { className?: string; title?: string; ariaLabel?: string }>;

export function LinkWithLoading({ children, className, title, ariaLabel, ...props }: LinkWithLoadingProps) {
  const { show } = useNavigationOverlay();
  return (
    <Link
      {...props}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={(e) => {
        show();
        props.onClick?.(e as any);
      }}
    >
      {children}
    </Link>
  );
}
