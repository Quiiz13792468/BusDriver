import { Suspense } from 'react';
import { SignupClient } from './SignupClient';

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-base text-slate-500">초대 링크 확인 중...</div>
      </div>
    }>
      <SignupClient />
    </Suspense>
  );
}
