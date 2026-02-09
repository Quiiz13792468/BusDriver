"use client";

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import clsx from 'clsx';

import Swal from 'sweetalert2';

import { unassignStudentFromSchoolAction, updateStudentInfoAction } from '@/app/(protected)/schools/actions';
import type { RouteRecord, StudentRecord } from '@/lib/data/types';
import { SearchableSelect } from '@/components/searchable-select';

const initialState = undefined as any;

type StudentCardProps = {
  student: StudentRecord;
  schoolId: string;
  routes?: RouteRecord[];
};

export function StudentCard({ student, schoolId, routes = [] }: StudentCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [state, formAction] = useFormState(updateStudentInfoAction, initialState);
  const [unassignState, unassignAction] = useFormState(unassignStudentFromSchoolAction, initialState);
  const [pickup, setPickup] = useState<string>(student.pickupPoint ?? '');
  const unassignFormRef = useRef<HTMLFormElement | null>(null);
  const suspensionStatus = getSuspensionStatus(student.suspendedAt);

  useEffect(() => {
    if (state?.status === 'success') setEditing(false);
  }, [state]);

  return (
    <article className="ui-card ui-card-pad transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">{student.name}</p>
            {suspensionStatus ? (
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  suspensionStatus === '이용종료' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                {suspensionStatus}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-700">보호자 {student.guardianName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="ui-btn-outline px-3 py-1.5 text-sm sm:px-4"
          >
            {expanded ? '상세 닫기' : '상세 보기'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ui-btn-outline border-primary-200 px-3 py-1.5 text-sm text-primary-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 sm:px-4"
          >
            정보 편집
          </button>
          <form
            ref={unassignFormRef}
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await Swal.fire({
                icon: 'warning',
                title: '학생 배정 해제',
                text: '이 학생을 학교에서 배정 해제하시겠습니까?',
                showCancelButton: true,
                confirmButtonText: '해제',
                cancelButtonText: '취소',
                confirmButtonColor: '#e11d48'
              });
              if (!result.isConfirmed) return;
              if (!unassignFormRef.current) return;
              const fd = new FormData(unassignFormRef.current);
              await unassignAction(fd);
            }}
          >
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="schoolId" value={schoolId} />
            <button
              type="submit"
              className="ui-btn-outline border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 sm:px-4"
            >
              배정 해제
            </button>
          </form>
        </div>
      </div>

      {unassignState ? (
        <p className={`mt-3 text-base ${unassignState.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{unassignState.message}</p>
      ) : null}

      <div className="mt-4 space-y-4 text-base text-slate-700 sm:mt-5">
        <dl className="grid gap-3 sm:gap-4">
          <DetailRow label="연락처" value={student.phone ?? '-'} />
          <DetailRow label="탑승 지점" value={student.pickupPoint ?? '-'} />
        </dl>
        {expanded ? (
          <>
            <Divider />
            <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <DetailRow label="비상 연락처" value={student.emergencyContact ?? '-'} />
              <DetailRow label="기본 요금" value={`${student.feeAmount.toLocaleString()}원`} />
              <DetailRow label="입금일(일)" value={student.depositDay ? `${student.depositDay}일` : '-'} />
              <DetailRow label="이용종료일" value={student.suspendedAt ? new Date(student.suspendedAt).toLocaleDateString() : '-'} />
            </dl>
            <Divider />
            <dl className="grid gap-3">
              <DetailRow label="주소" value={student.homeAddress ?? '-'} />
              <DetailRow label="메모" value={student.notes ?? '-'} />
            </dl>
          </>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl ui-card ui-card-pad shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">학생 정보 편집</p>
                <p className="text-sm text-slate-700">필요한 정보만 수정하고 저장하세요.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="ui-btn-outline px-3 py-1.5 text-sm"
              >
                닫기
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="studentId" defaultValue={student.id} />
              <input type="hidden" name="schoolId" defaultValue={schoolId} />

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <EditableInput defaultValue={student.name} label="학생 이름" name="name" required />
                <EditableInput defaultValue={student.guardianName} label="보호자 이름" name="guardianName" required />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <EditableInput defaultValue={student.phone ?? ''} label="연락처" name="phone" />
                <div className="flex flex-col">
                  <SearchableSelect label="탑승 지점" value={pickup} onChange={setPickup} options={Array.from(new Set(routes.flatMap((r) => r.stops)))} />
                  <input type="hidden" name="pickupPoint" value={pickup} />
                </div>
                <EditableInput defaultValue={student.emergencyContact ?? ''} label="비상 연락처" name="emergencyContact" />
                <EditableInput defaultValue={student.feeAmount.toString()} label="기본 요금" name="feeAmount" type="number" min={0} required />
                <EditableInput defaultValue={student.depositDay?.toString() ?? ''} label="입금일(일)" name="depositDay" type="number" min={1} />
                <EditableInput defaultValue={student.suspendedAt ? student.suspendedAt.slice(0, 10) : ''} label="이용종료일" name="suspendedAt" type="date" />
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-slate-700" htmlFor={`routeId-${student.id}`}>노선</label>
                  <select
                    id={`routeId-${student.id}`}
                    name="routeId"
                    defaultValue={student.routeId ?? ''}
                    className="ui-select mt-1"
                  >
                    <option value="">선택 안 함</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3">
                <EditableTextarea defaultValue={student.homeAddress ?? ''} label="주소" name="homeAddress" rows={2} />
                <EditableTextarea defaultValue={student.notes ?? ''} label="메모" name="notes" rows={3} />
              </div>

              {state ? (
                <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
              ) : null}

              <SubmitControls onCancel={() => setEditing(false)} />
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function getSuspensionStatus(suspendedAt?: string | null) {
  if (!suspendedAt) return null;
  const target = new Date(suspendedAt);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target <= today ? '이용종료' : '종료예정';
}

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2', className)}>
      <dt className="text-sm font-semibold text-slate-700">{label}</dt>
      <dd className="mt-1 text-base text-slate-700">{value}</dd>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-100" />;
}

type EditableInputProps = {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  min?: number;
};

function EditableInput({ label, name, defaultValue, type = 'text', required, min }: EditableInputProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-slate-700" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} min={min} defaultValue={defaultValue} required={required} className="ui-input mt-1" />
    </div>
  );
}

type EditableTextareaProps = { label: string; name: string; defaultValue: string; rows?: number };
function EditableTextarea({ label, name, defaultValue, rows = 3 }: EditableTextareaProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-slate-700" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} defaultValue={defaultValue} rows={rows} className="ui-input mt-1" />
    </div>
  );
}

type SubmitControlsProps = { onCancel: () => void };
function SubmitControls({ onCancel }: SubmitControlsProps) {
  const status = useFormStatus();
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button type="button" onClick={onCancel} className="ui-btn-outline whitespace-nowrap px-4 py-2 text-base font-medium">취소</button>
      <button type="submit" disabled={status.pending} className="ui-btn whitespace-nowrap px-5 py-2 text-base font-medium">{status.pending ? '저장 중...' : '저장'}</button>
    </div>
  );
}
