"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RecordPaymentForm } from "@/app/(protected)/schools/_components/record-payment-form";

type SchoolOption = {
  id: string;
  name: string;
  defaultMonthlyFee: number;
};

type StudentOption = {
  id: string;
  name: string;
  feeAmount: number;
  schoolId: string | null;
};

type RecordPaymentModalProps = {
  schools: SchoolOption[];
  students: StudentOption[];
};

export function RecordPaymentModal({ schools, students }: RecordPaymentModalProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '/payments';
  const router = useRouter();
  const open = searchParams?.get("payment") === "1";
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id ?? "");

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (selectedSchoolId) return;
    if (schools[0]?.id) setSelectedSchoolId(schools[0].id);
  }, [open, selectedSchoolId, schools]);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("payment");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId) ?? null;
  const filteredStudents = useMemo(() => {
    if (!selectedSchoolId) return [];
    return students
      .filter((student) => student.schoolId === selectedSchoolId)
      .map((student) => ({ id: student.id, name: student.name, feeAmount: student.feeAmount }));
  }, [students, selectedSchoolId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] m-0 !mt-0 !mb-0 sm:!mt-0 sm:!mb-0 bg-[#0b1014]/45 backdrop-blur-[2px]">
      <div className="flex min-h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl ui-card overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">입금 기록 추가</p>
              <h2 className="text-xl font-semibold text-slate-900">학교 선택 후 입력</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="ui-btn-outline px-3 py-1.5 text-sm"
            >
              닫기
            </button>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="payment-school">
                학교 선택
              </label>
              <select
                id="payment-school"
                value={selectedSchoolId}
                onChange={(event) => setSelectedSchoolId(event.target.value)}
                className="ui-select"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
                {schools.length === 0 ? (
                  <option value="" disabled>
                    학교를 먼저 등록해주세요
                  </option>
                ) : null}
              </select>
            </div>

            {selectedSchool ? (
              <RecordPaymentForm
                key={selectedSchoolId}
                schoolId={selectedSchool.id}
                students={filteredStudents}
                onSuccess={handleClose}
              />
            ) : (
              <div className="ui-empty">
                학교를 선택하면 입금 기록을 입력할 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
