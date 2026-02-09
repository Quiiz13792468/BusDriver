'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MutableRefObject } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Swal from 'sweetalert2';
import { LoadingOverlay } from '@/components/loading-overlay';

import { recordPaymentAction } from '@/app/(protected)/schools/actions';

const initialState = undefined as any;

type StudentOption = {
  id: string;
  name: string;
  feeAmount: number;
};

type RecordPaymentFormProps = {
  schoolId: string;
  students: StudentOption[];
  onSuccess?: () => void;
};

export function RecordPaymentForm({ schoolId, students, onSuccess }: RecordPaymentFormProps) {
  const [state, formAction] = useFormState(recordPaymentAction, initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? '');
  const [amount, setAmount] = useState(students[0]?.feeAmount ?? 0);
  const [status, setStatus] = useState<'PAID' | 'PENDING' | 'PARTIAL'>('PAID');
  const [paidAt, setPaidAt] = useState(() => formatDateInput(new Date()));
  const paidAtRef = useRef<HTMLInputElement | null>(null);
  const handledSuccessRef = useRef(false);

  const filteredStudents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return students;
    }
    return students.filter((student) => student.name.toLowerCase().includes(keyword));
  }, [searchTerm, students]);

  const defaultFee = useMemo(() => {
    const student = students.find((item) => item.id === selectedStudent);
    return student?.feeAmount ?? 0;
  }, [selectedStudent, students]);

  useEffect(() => {
    if (filteredStudents.length === 0) {
      if (selectedStudent !== '') {
        setSelectedStudent('');
      }
      setAmount(0);
      return;
    }

    if (!selectedStudent) {
      setSelectedStudent(filteredStudents[0].id);
      setAmount(filteredStudents[0].feeAmount);
      return;
    }

    if (!filteredStudents.some((student) => student.id === selectedStudent)) {
      setSelectedStudent(filteredStudents[0].id);
      setAmount(filteredStudents[0].feeAmount);
      return;
    }

    setAmount(defaultFee);
  }, [filteredStudents, selectedStudent, defaultFee]);

  useEffect(() => {
    if (amount > 0 && status === 'PENDING') {
      setStatus('PAID');
    }
  }, [amount, status]);

  useEffect(() => {
    if (!state || state.status !== 'success') return;
    if (handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    void Swal.fire({
      icon: 'success',
      title: '저장 완료',
      text: state.message ?? '입금 기록이 저장되었습니다.',
      timer: 2000,
      showConfirmButton: false
    });
    onSuccess?.();
  }, [state, onSuccess]);

  useEffect(() => {
    if (!state || state.status !== 'success') {
      handledSuccessRef.current = false;
    }
  }, [state]);

  if (students.length === 0) {
    return (
      <div className="ui-empty">
        등록된 학생이 없어 입금 기록을 추가할 수 없습니다.
      </div>
    );
  }

  return (
    <form action={formAction} className="ui-card ui-card-pad space-y-4">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">입금 기록 추가</h2>
        <p className="text-sm text-slate-700">학생의 입금 내역을 추가하고 상태를 업데이트하세요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="student-search">
            학생 검색
          </label>
          <input
            id="student-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="학생 이름을 입력하세요"
            className="ui-input"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="studentId">
            학생 선택
          </label>
          <select
            id="studentId"
            name="studentId"
            value={selectedStudent}
            onChange={(event) => setSelectedStudent(event.target.value)}
            className="ui-select"
          >
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.feeAmount.toLocaleString()}원)
              </option>
            ))}
            {filteredStudents.length === 0 ? (
              <option value="" disabled>
                일치하는 학생이 없습니다
              </option>
            ) : null}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <DateField
          label="입금 일자"
          id="paidAt"
          name="paidAt"
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
          inputRef={paidAtRef}
          onOpenPicker={() => {
            const input = paidAtRef.current as HTMLInputElement & { showPicker?: () => void };
            if (input?.showPicker) {
              input.showPicker();
              return;
            }
            input?.focus();
          }}
        />
        <InputField label="메모" id="memo" name="memo" placeholder="예: 10일 이체 예정" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <InputField
          label="입금 금액"
          id="amount"
          name="amount"
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="status">
            입금 상태
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'PAID' | 'PENDING' | 'PARTIAL')}
            className="ui-select"
          >
            <option value="PAID">완납</option>
            {amount === 0 ? <option value="PENDING">미입금</option> : null}
            <option value="PARTIAL">부분 입금</option>
          </select>
        </div>
      </div>

      {state && state.status !== 'success' ? (
        <p className="text-base text-red-600">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

type InputFieldProps = {
  label: string;
  id: string;
  name: string;
  type?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  placeholder?: string;
  value?: number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

function InputField({
  label,
  id,
  name,
  type = 'text',
  min,
  max,
  defaultValue,
  placeholder,
  value,
  onChange
}: InputFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        min={min}
        max={max}
        defaultValue={defaultValue}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="ui-input"
      />
    </div>
  );
}

type DateFieldProps = {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  inputRef: MutableRefObject<HTMLInputElement | null>;
};

function DateField({ label, id, name, value, onChange, onOpenPicker, inputRef }: DateFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          className="date-input ui-input pr-11"
        />
        <button
          type="button"
          onClick={onOpenPicker}
          aria-label="달력 열기"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V4m8 3V4m-9 7h10M5 9.5h14V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9.5Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <div className="relative inline-block w-full">
      <button
        type="submit"
        disabled={status.pending}
        className="ui-btn w-full"
      >
        {status.pending ? '저장 중...' : '입금 기록 추가'}
      </button>
      <LoadingOverlay show={status.pending} message="저장 중..." />
    </div>
  );
}
