import type { Metadata } from 'next';
import Script from 'next/script';
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
  title: '통학버스 관리 서비스',
  description: '학교 버스 학생 및 요금 현황 관리'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${gowun.className} antialiased`}>
        {adsEnabled && adsClient ? (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
