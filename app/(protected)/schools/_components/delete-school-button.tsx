"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Swal from "sweetalert2";

import { deleteSchoolAction } from "@/app/(protected)/schools/actions";

const initialState = undefined as any;

type DeleteSchoolButtonProps = {
  schoolId: string;
  schoolName: string;
};

export function DeleteSchoolButton({ schoolId, schoolName }: DeleteSchoolButtonProps) {
  const [state, formAction] = useFormState(deleteSchoolAction, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!state) return;
    void Swal.fire({
      icon: state.status === "success" ? "success" : "error",
      title: state.status === "success" ? "삭제 완료" : "삭제 실패",
      text: state.message
    });
  }, [state]);

  const handleConfirm = async (pending: boolean) => {
    if (pending) return;
    const result = await Swal.fire({
      icon: "warning",
      title: "학교 삭제",
      text: `${schoolName}을(를) 삭제하시겠습니까?`,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      showCancelButton: true
    });
    if (result.isConfirmed) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <DeleteButton onConfirm={handleConfirm} />
    </form>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: (pending: boolean) => void }) {
  const status = useFormStatus();
  return (
    <button
      type="button"
      onClick={() => onConfirm(status.pending)}
      disabled={status.pending}
      className="ui-btn-outline border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:border-rose-300 hover:bg-rose-100"
    >
      {status.pending ? "삭제 중..." : "삭제"}
    </button>
  );
}
