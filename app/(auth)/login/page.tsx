import { Suspense } from 'react';

import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-[100dvh] px-4 py-6 md:py-12">
      <div className="mx-auto w-full max-w-xl ui-card rounded-[32px] p-8 shadow-2xl animate-pulse">
        <div className="h-8 w-40 rounded-full bg-slate-200" />
        <div className="mt-4 h-5 w-72 rounded-full bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="h-20 rounded-2xl bg-slate-200" />
          <div className="h-20 rounded-2xl bg-slate-200" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="h-14 rounded-2xl bg-slate-200" />
          <div className="h-14 rounded-2xl bg-slate-200" />
          <div className="h-14 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
