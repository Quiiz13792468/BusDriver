import type { Metadata } from 'next';
import { Nanum_Gothic } from 'next/font/google';
import { ReactNode } from 'react';

import './globals.css';
import { Providers } from '@/components/providers';

const gowun = Nanum_Gothic({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: '학교버스 관리 서비스',
  description: '학교 버스 학생 및 요금 현황 관리'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${gowun.className} antialiased`}>
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
