"use client";

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createStudentAction } from '@/app/(protected)/schools/actions';

const initialState = undefined as any;

type CreateStudentFormProps = {
  schoolId?: string;
  defaultFee?: number;
  schools?: { id: string; name: string }[];
};

export function CreateStudentForm({ schoolId, defaultFee, schools }: CreateStudentFormProps) {
  const [state, formAction] = useFormState(createStudentAction, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state?.status !== 'success') return;
    formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="ui-card ui-card-pad space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">학생 등록</h2>
        <p className="text-sm text-slate-700">
          {schoolId ? '선택한 학교에 새 학생 정보를 입력합니다.' : '학생을 먼저 등록하고 학교는 나중에 배정할 수 있습니다.'}
        </p>
      </div>

      {schoolId ? (
        <input type="hidden" name="schoolId" value={schoolId} />
      ) : (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700" htmlFor="schoolId">
            학교 선택
          </label>
          <select
            id="schoolId"
            name="schoolId"
            defaultValue=""
            className="ui-input mt-1"
          >
            <option value="">미배정</option>
            {(schools ?? []).map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="학생 이름" name="name" required placeholder="예: 홍길동" />
        <Field label="보호자 이름" name="guardianName" required placeholder="예: 홍부모" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="연락처" name="phone" placeholder="010-0000-0000" />
        <Field label="비상 연락처" name="emergencyContact" placeholder="추가 연락처 또는 관계" />
      </div>

      <Field label="주소" name="homeAddress" as="textarea" rows={2} placeholder="거주지 주소" />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="탑승 지점" name="pickupPoint" placeholder="예: 학교 정문 앞" />
        <Field
          label="기본 요금"
          name="feeAmount"
          type="number"
          min={0}
          defaultValue={defaultFee}
          placeholder="예: 150000"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="입금일(일)" name="depositDay" type="number" min={1} placeholder="예: 10" />
      </div>

      <Field label="메모" name="notes" as="textarea" rows={3} placeholder="특이사항을 작성하세요" />

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
  defaultValue?: string | number;
  as?: 'input' | 'textarea';
  rows?: number;
};

function Field({ label, name, placeholder, required, type = 'text', min, defaultValue, as = 'input', rows }: FieldProps) {
  const baseClassName = 'ui-input mt-1';
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-slate-700" htmlFor={name}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea id={name} name={name} placeholder={placeholder} rows={rows} className={baseClassName} required={required} defaultValue={defaultValue} />
      ) : (
        <input id={name} name={name} type={type} min={min} placeholder={placeholder} className={baseClassName} required={required} defaultValue={defaultValue} />
      )}
    </div>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} className="ui-btn w-full">
      {status.pending ? '등록 중...' : '학생 등록'}
    </button>
  );
}
