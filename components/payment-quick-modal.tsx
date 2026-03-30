"use client";

import { useEffect, useMemo, useState } from 'react';
import { getPaymentFormDataAction } from '@/app/(protected)/payments/actions';
import { RecordPaymentForm } from '@/app/(protected)/schools/_components/record-payment-form';

type Props = { onClose: () => void };

export function PaymentQuickModal({ onClose }: Props) {
  const [data, setData] = useState<{
    schools: { id: string; name: string; defaultMonthlyFee: number }[];
    students: { id: string; name: string; feeAmount: number; schoolId: string | null }[];
  } | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  useEffect(() => {
    getPaymentFormDataAction().then((d) => {
      setData(d);
      setSelectedSchoolId(d.schools[0]?.id ?? '');
    }).catch(() => {});
  }, []);

  const filteredStudents = useMemo(() => {
    if (!data || !selectedSchoolId) return [];
    return data.students
      .filter((s) => s.schoolId === selectedSchoolId)
      .map((s) => ({ id: s.id, name: s.name, feeAmount: s.feeAmount }));
  }, [data, selectedSchoolId]);

  return (
    <div className="fixed inset-0 z-[9998] bg-[#0b1014]/45 backdrop-blur-[2px]">
      <div className="flex min-h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl ui-card overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">입금 기록 추가</p>
              <h2 className="text-xl font-semibold text-slate-900">학교 선택 후 입력</h2>
            </div>
            <button type="button" onClick={onClose} className="ui-btn-outline px-3 py-1.5 text-sm">
              닫기
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {!data ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">불러오는 중...</p>
              </div>
            ) : data.schools.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">등록된 학교가 없습니다. 먼저 학교를 추가해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4 p-5 pb-8">
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="modal-school">학교 선택</label>
                  <select
                    id="modal-school"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="ui-select"
                  >
                    {data.schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {selectedSchoolId ? (
                  <RecordPaymentForm
                    key={selectedSchoolId}
                    schoolId={selectedSchoolId}
                    students={filteredStudents}
                    onSuccess={onClose}
                  />
                ) : (
                  <div className="ui-empty">학교를 선택하면 입금 기록을 입력할 수 있습니다.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
