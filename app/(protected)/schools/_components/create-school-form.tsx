'use client';

import { useFormState, useFormStatus } from 'react-dom';

import { createSchoolAction } from '@/app/(protected)/schools/actions';

const initialState = undefined;

export function CreateSchoolForm() {
  const [state, formAction] = useFormState(createSchoolAction, initialState);

  return (
    <form action={formAction} className="ui-card ui-card-pad space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">학교 등록</h2>
        <p className="text-sm text-slate-700">운영할 학교 정보를 입력하고 기본 요금을 설정하세요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="학교 이름" name="name" required placeholder="예: 셔틀콕! 초등학교" />
        <Field label="기본 월 요금" name="defaultMonthlyFee" type="number" min={0} placeholder="예: 150000" />
      </div>

      <Field label="주소" name="address" placeholder="도로명 + 상세 주소" />
      <Field label="비고" name="note" as="textarea" rows={3} placeholder="추가 메모를 입력하세요" />

      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
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
};

function Field({ label, name, placeholder, required, type = 'text', min, as = 'input', rows }: FieldProps) {
  const baseClassName = 'ui-input mt-1';

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-slate-700" htmlFor={name}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea id={name} name={name} rows={rows} placeholder={placeholder} className={baseClassName} required={required} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          min={min}
          placeholder={placeholder}
          className={baseClassName}
          required={required}
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
      {status.pending ? '등록 중...' : '학교 등록'}
    </button>
  );
}
