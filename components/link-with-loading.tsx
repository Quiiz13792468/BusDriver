"use client";

import Link, { LinkProps } from 'next/link';
import { PropsWithChildren } from 'react';
import { useNavigationOverlay } from '@/components/navigation-overlay';

type LinkWithLoadingProps = PropsWithChildren<LinkProps & {
  className?: string;
  title?: string;
  ariaLabel?: string;
  loadingMessage?: string;
}>;

export function LinkWithLoading({ children, className, title, ariaLabel, loadingMessage = '잠시만 기다려 주세요.', ...props }: LinkWithLoadingProps) {
  const { show } = useNavigationOverlay();
  return (
    <Link
      {...props}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={(e) => {
        show(loadingMessage);
        props.onClick?.(e as any);
      }}
    >
      {children}
    </Link>
  );
}
