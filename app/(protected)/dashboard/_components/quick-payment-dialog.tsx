'use client';

import { useState, useTransition, useEffect } from 'react';
import clsx from 'clsx';
import { fireAutoPopup } from '@/lib/ui/swal';
import type { StudentRecord, SchoolRecord } from '@/lib/data/types';
import { getEffectiveFee } from '@/lib/data/payment-utils';

interface QuickPaymentDialogProps {
  students: Array<StudentRecord & { schoolName: string }>;
  schools: SchoolRecord[];
  currentYear: number;
  currentMonth: number;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3;
type PaymentType = 'PAID' | 'PARTIAL';

export function QuickPaymentDialog({
  students,
  schools,
  currentYear,
  currentMonth,
  onSuccess
}: QuickPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<(StudentRecord & { schoolName: string }) | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('PAID');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredStudents = (query.trim()
    ? students.filter(s =>
        s.name.includes(query) ||
        s.schoolName.includes(query) ||
        (s.guardianName ?? '').includes(query)
      )
    : [...students].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  ).slice(0, 20);

  function handleOpen() {
    setStep(1);
    setQuery('');
    setSelectedStudent(null);
    setPaymentType('PAID');
    setAmount('');
    setMemo('');
    setOpen(true);
  }

  function handleSelectStudent(student: StudentRecord & { schoolName: string }) {
    setSelectedStudent(student);
    const school = schools.find(s => s.id === student.schoolId) ?? null;
    const fee = getEffectiveFee(student, school);
    setAmount(String(fee));
    setStep(2);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  async function handleSubmit() {
    if (!selectedStudent) return;

    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    if (!selectedStudent.schoolId) {
      await fireAutoPopup({ icon: 'error', title: '학교 미배정', text: '학교 미배정 학생은 결제 등록이 불가합니다.' });
      return;
    }

    const schoolId = selectedStudent.schoolId;
    startTransition(async () => {
      try {
        const { quickRecordPayment } = await import('@/app/(protected)/dashboard/actions');
        await quickRecordPayment({
          studentId: selectedStudent.id,
          schoolId: schoolId!,
          amount: parsed,
          targetYear: currentYear,
          targetMonth: currentMonth,
          status: paymentType,
          memo: memo || null
        });

        await fireAutoPopup({ icon: 'success', title: '등록 완료' });

        setOpen(false);
        onSuccess?.();
      } catch (err) {
        await fireAutoPopup({ icon: 'error', title: '오류', text: '결제 등록 중 오류가 발생했습니다.' });
      }
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{step}/3단계</span>
            <h2 className="text-base font-bold text-slate-900">
              {step === 1 ? '학생 선택' : step === 2 ? '결제 정보' : '확인'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-12 w-12 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Student Search */}
          {step === 1 && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="학생 이름 또는 학교명 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="ui-input"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                {filteredStudents.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">검색 결과 없음</div>
                ) : (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className="flex min-h-[56px] w-full items-center justify-between border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-primary-50"
                    >
                      <div>
                        <div className="text-base font-semibold text-slate-900">{student.name}</div>
                        <div className="text-sm text-slate-500">{student.schoolName}</div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Payment Info */}
          {step === 2 && selectedStudent && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-base font-bold text-slate-900">{selectedStudent.name}</div>
                <div className="text-sm text-slate-500">{selectedStudent.schoolName} · {currentYear}년 {currentMonth}월</div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">결제 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PAID', 'PARTIAL'] as PaymentType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={clsx(
                        'rounded-xl border py-3 text-sm font-semibold transition',
                        paymentType === type
                          ? 'border-primary-300 bg-primary-50 text-primary-800'
                          : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      {type === 'PAID' ? '일반입금' : '부분입금'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">금액 (원)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="ui-input"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">비고 (선택)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="메모 입력"
                  className="ui-input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ui-btn-outline min-h-[48px] flex-1 py-3 text-sm"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!amount || isNaN(parseInt(amount, 10)) || parseInt(amount, 10) <= 0 || isPending}
                  className="ui-btn min-h-[48px] flex-1 py-3 text-sm disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {isPending ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
