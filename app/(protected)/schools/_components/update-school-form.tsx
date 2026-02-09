'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import { updateSchoolFormAction } from '@/app/(protected)/schools/actions';

type UpdateSchoolFormProps = {
  schoolId: string;
  initial: {
    name: string;
    address: string | null;
    defaultMonthlyFee: number;
    note: string | null;
  };
  onSuccess?: () => void;
};

const initialState = undefined;

export function UpdateSchoolForm({ schoolId, initial, onSuccess }: UpdateSchoolFormProps) {
  const [state, formAction] = useFormState(updateSchoolFormAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.status !== 'success') return;
    router.refresh();
    onSuccess?.();
  }, [state, router, onSuccess]);

  return (
    <form action={formAction} className="ui-card ui-card-pad space-y-4">
      <input type="hidden" name="schoolId" value={schoolId} />

      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">학교 정보 수정</h2>
        <p className="text-sm text-slate-700">학교명, 요금, 주소를 최신 정보로 업데이트하세요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="학교 이름" name="name" required defaultValue={initial.name} placeholder="예: 셔틀콕! 초등학교" />
        <Field
          label="기본 월 요금"
          name="defaultMonthlyFee"
          type="number"
          min={0}
          defaultValue={initial.defaultMonthlyFee}
          placeholder="예: 150000"
        />
      </div>

      <Field label="주소" name="address" defaultValue={initial.address ?? ''} placeholder="도로명 + 상세 주소" />
      <Field label="비고" name="note" as="textarea" rows={3} defaultValue={initial.note ?? ''} placeholder="추가 메모를 입력하세요" />

      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: number;
  as?: 'input' | 'textarea';
  rows?: number;
  defaultValue?: string | number;
};

function Field({ label, name, placeholder, required, type = 'text', min, as = 'input', rows, defaultValue }: FieldProps) {
  const baseClassName = 'ui-input mt-1';

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-slate-700" htmlFor={name}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          className={baseClassName}
          required={required}
          defaultValue={defaultValue as string | undefined}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          min={min}
          placeholder={placeholder}
          className={baseClassName}
          required={required}
          defaultValue={defaultValue}
        />
      )}
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();

  return (
    <button
      type="submit"
      disabled={status.pending}
      className="ui-btn w-full"
    >
      {status.pending ? '저장 중...' : '학교 정보 저장'}
    </button>
  );
}
